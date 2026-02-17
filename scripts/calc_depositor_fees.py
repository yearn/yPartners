#!/usr/bin/env python3
"""Python port of the Yearn V3 depositor fee calculator."""

import argparse
import base64
import bisect
import datetime
import json
import logging
import os
import sys
import textwrap
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
)
logger = logging.getLogger(__name__)

try:
    import matplotlib.pyplot as plt
except ImportError:  # pragma: no cover
    plt = None

HAS_MATPLOTLIB = plt is not None

_CHAINLIST_RPCS: Optional[Dict[int, List[str]]] = None
_CHAIN_BLOCK_TIME_CACHE: Dict[int, float] = {}



# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def load_local_env(file_path: str) -> None:
    # Lightweight .env loader to make CLI usage easier without extra deps.
    if not os.path.isfile(file_path):
        return

    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            trimmed = line.strip()
            if not trimmed or trimmed.startswith('#'):
                continue

            if '=' not in trimmed:
                continue

            key, value = trimmed.split('=', 1)
            key = key.strip()
            value = value.strip()
            if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            os.environ[key] = value


DOTENV_FILE = os.path.join(os.getcwd(), '.env')
load_local_env(DOTENV_FILE)

ENVIO_GRAPHQL_URL = os.environ.get('ENVIO_GRAPHQL_URL', 'https://indexer.hyperindex.xyz/3fec0a4/v1/graphql')
ENVIO_PASSWORD = os.environ.get('ENVIO_PASSWORD', 'testing')
DEFAULT_VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204'
DEFAULT_CHAIN_ID = 1
CHAIN_CONFIG = {
    1: {
        'name': 'Ethereum',
        'rpc_env': 'RPC_URL_ETHEREUM',
        'fallback_rpcs': [
            'https://mainnet.gateway.tenderly.co/3V34wr9LQ5X3HupEWCw8kg',
            'https://eth.llamarpc.com',
            'https://rpc.ankr.com/eth',
            'https://ethereum.publicnode.com',
            'https://1rpc.io/eth',
        ],
    },
    8453: {
        'name': 'Base',
        'rpc_env': 'RPC_URL_BASE',
        'fallback_rpcs': [
            'https://base.llamarpc.com',
            'https://rpc.ankr.com/base',
            'https://base.publicnode.com',
            'https://1rpc.io/base',
        ],
    },
    42161: {
        'name': 'Arbitrum',
        'rpc_env': 'RPC_URL_ARBITRUM',
        'fallback_rpcs': [
            'https://arbitrum.llamarpc.com',
            'https://rpc.ankr.com/arbitrum',
            'https://arbitrum-one.publicnode.com',
            'https://1rpc.io/arb',
        ],
    },
    137: {
        'name': 'Polygon',
        'rpc_env': 'RPC_URL_POLYGON',
        'fallback_rpcs': [
            'https://polygon.llamarpc.com',
            'https://rpc.ankr.com/polygon',
            'https://polygon-bor.publicnode.com',
            'https://1rpc.io/matic',
        ],
    },
}
PRICE_PER_SHARE_SELECTOR = '0x99530b06'
DECIMALS_SELECTOR = '0x313ce567'
ASSET_SELECTOR = '0x38d52e0f'
SYMBOL_SELECTOR = '0x95d89b41'

@dataclass
class VaultContext:
    address: str
    chain_id: int
    rpc_url: str
    decimals: int
    symbol: str
    asset_address: str
    price_per_share_cache: Dict[int, int] = field(default_factory=dict)
    block_timestamp_cache: Dict[int, datetime.datetime] = field(default_factory=dict)


@dataclass
class DepositEvent:
    id: str
    sender: str
    owner: str
    assets: str
    shares: str


@dataclass
class WithdrawEvent:
    id: str
    sender: str
    receiver: str
    owner: str
    assets: str
    shares: str


@dataclass
class TransferEvent:
    id: str
    sender: str
    receiver: str
    value: str


@dataclass
class Event:
    type: str
    block_number: int
    log_index: int
    data: Dict[str, Any]


@dataclass
class PositionSnapshot:
    block_number: int
    event_type: str
    shares_balance: int
    shares_change: int
    assets_deposited: int
    assets_withdrawn: int


@dataclass
class PositionResult:
    snapshots: List[PositionSnapshot]
    current_shares: int
    total_deposited: int
    total_withdrawn: int
    user_events: List[Event]
    peak_shares: int
    peak_shares_block: int


def rpc_call_with_url(rpc_url: str, method: str, params: List[Any]) -> Any:
    payload = json.dumps({
        'jsonrpc': '2.0',
        'method': method,
        'params': params,
        'id': 1,
    }).encode('utf-8')
    headers = {'Content-Type': 'application/json'}

    request = urllib.request.Request(rpc_url, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
    except urllib.error.URLError as exc:
        raise RuntimeError(f'RPC call failed: {exc}')

    if 'error' in result:
        raise RuntimeError(f"RPC error: {result['error'].get('message')}")
    return result.get('result')


def rpc_call(rpc_url: str, method: str, params: List[Any]) -> Any:
    return rpc_call_with_url(rpc_url, method, params)


def select_rpc_url(chain_id: int) -> str:
    if chain_id not in CHAIN_CONFIG:
        raise RuntimeError(f'Unsupported chain ID: {chain_id}')
    config = CHAIN_CONFIG[chain_id]
    env_override = os.environ.get(config['rpc_env'])
    urls_to_try = [env_override] if env_override else []
    urls_to_try.extend(config['fallback_rpcs'])
    if os.environ.get('RPC_URL'):
        urls_to_try.insert(0, os.environ['RPC_URL'])

    last_error = None
    for candidate in urls_to_try:
        if not candidate:
            continue
        try:
            rpc_call_with_url(candidate, 'eth_blockNumber', [])
            return candidate
        except Exception as exc:
            last_error = exc
            continue
    raise RuntimeError(f"All RPC endpoints failed for {config['name']}: {last_error}")

def contract_call(rpc_url: str, address: str, data: str, block_number: Optional[int] = None) -> str:
    params: List[Any] = [{'to': address, 'data': data}]
    params.append(f'0x{block_number:x}' if block_number is not None else 'latest')
    return rpc_call(rpc_url, 'eth_call', params)


def get_price_per_share_at_block(ctx: VaultContext, block_number: int) -> int:
    if block_number in ctx.price_per_share_cache:
        return ctx.price_per_share_cache[block_number]

    price_hex = contract_call(ctx.rpc_url, ctx.address, PRICE_PER_SHARE_SELECTOR, block_number)
    value = int(price_hex, 16)
    ctx.price_per_share_cache[block_number] = value
    return value


def get_asset_address(rpc_url: str, vault_address: str) -> str:
    asset_hex = contract_call(rpc_url, vault_address, ASSET_SELECTOR)
    return '0x' + asset_hex[-40:]


def decode_abi_string(data_hex: str) -> str:
    payload = data_hex[2:] if data_hex.startswith('0x') else data_hex
    if not payload:
        return ''
    data = bytes.fromhex(payload)
    # ABI dynamic string layout: 32-byte offset, then 32-byte length, then data.
    if len(data) >= 64:
        offset = int.from_bytes(data[0:32], 'big')
        if offset + 32 <= len(data):
            length = int.from_bytes(data[offset:offset + 32], 'big')
            start = offset + 32
            end = min(start + length, len(data))
            return data[start:end].decode('utf-8', errors='ignore').strip('\x00')
    # Fallback for bytes32-returning symbol() implementations.
    return data[:32].decode('utf-8', errors='ignore').strip('\x00')


def get_token_symbol(rpc_url: str, token_address: str) -> str:
    symbol_hex = contract_call(rpc_url, token_address, SYMBOL_SELECTOR)
    return decode_abi_string(symbol_hex)


def validate_vault_address(rpc_url: str, vault_address: str) -> None:
    asset_hex = contract_call(rpc_url, vault_address, ASSET_SELECTOR)
    if not asset_hex or len(asset_hex) < 42:
        raise RuntimeError('Vault asset() response invalid')
    decimals_hex = contract_call(rpc_url, vault_address, DECIMALS_SELECTOR)
    if not decimals_hex:
        raise RuntimeError('Vault decimals() response invalid')
    _ = int(decimals_hex, 16)
    price_hex = contract_call(rpc_url, vault_address, PRICE_PER_SHARE_SELECTOR)
    if not price_hex:
        raise RuntimeError('Vault pricePerShare() response invalid')


def get_block_timestamp(ctx: VaultContext, block_number: int) -> datetime.datetime:
    if block_number in ctx.block_timestamp_cache:
        return ctx.block_timestamp_cache[block_number]

    try:
        block = rpc_call(ctx.rpc_url, 'eth_getBlockByNumber', [f'0x{block_number:x}', False])
        timestamp = int(block['timestamp'], 16)
        result = datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc)
    except Exception:
        try:
            # If the exact block timestamp fails, estimate it using chain block time.
            current_block_hex = rpc_call(ctx.rpc_url, 'eth_blockNumber', [])
            current_block = int(current_block_hex, 16)
            current_time = datetime.datetime.now(datetime.timezone.utc)
            block_diff = current_block - block_number
            block_time = get_chain_fallback_block_time_seconds(ctx)
            if block_diff < 0:
                block_diff = 0
            if block_time is None:
                result = current_time
            else:
                result = current_time - datetime.timedelta(seconds=block_diff * block_time)
        except Exception:
            result = datetime.datetime.now(datetime.timezone.utc)

    ctx.block_timestamp_cache[block_number] = result
    return result


def _extract_rpc_urls(raw_list: Any) -> List[str]:
    urls: List[str] = []
    if not isinstance(raw_list, list):
        return urls
    for entry in raw_list:
        url = None
        if isinstance(entry, str):
            url = entry
        elif isinstance(entry, dict):
            url = entry.get('url') or entry.get('rpc') or entry.get('endpoint')
        if not url or '${' in url:
            continue
        urls.append(url)
    return urls


def _load_chainlist_rpcs() -> Dict[int, List[str]]:
    global _CHAINLIST_RPCS
    if _CHAINLIST_RPCS is not None:
        return _CHAINLIST_RPCS

    _CHAINLIST_RPCS = {}
    try:
        with urllib.request.urlopen('https://chainlist.org/rpcs.json', timeout=30) as response:
            data = json.load(response)
    except Exception as exc:
        logger.warning('Could not load Chainlist RPCs: %s', exc)
        return _CHAINLIST_RPCS

    if isinstance(data, dict):
        if isinstance(data.get('rpcs'), dict):
            data = data['rpcs']
        elif isinstance(data.get('chains'), list):
            data = data['chains']

    if isinstance(data, list):
        for entry in data:
            if not isinstance(entry, dict):
                continue
            chain_id = entry.get('chainId') or entry.get('chain_id') or entry.get('id')
            if chain_id is None:
                continue
            urls = _extract_rpc_urls(entry.get('rpc') or entry.get('rpcs') or entry.get('rpcUrls'))
            if urls:
                _CHAINLIST_RPCS[int(chain_id)] = urls
    elif isinstance(data, dict):
        for key, value in data.items():
            try:
                chain_id = int(key)
            except Exception:
                continue
            urls = _extract_rpc_urls(value)
            if urls:
                _CHAINLIST_RPCS[chain_id] = urls

    return _CHAINLIST_RPCS


def _estimate_block_time_seconds(rpc_url: str) -> Optional[float]:
    try:
        latest = rpc_call_with_url(rpc_url, 'eth_getBlockByNumber', ['latest', False])
        if not latest or 'number' not in latest or 'timestamp' not in latest:
            return None
        latest_number = int(latest['number'], 16)
        if latest_number <= 0:
            return None
        sample_number = max(latest_number - 1000, 0)
        if sample_number == latest_number:
            return None
        older = rpc_call_with_url(rpc_url, 'eth_getBlockByNumber', [f'0x{sample_number:x}', False])
        if not older or 'timestamp' not in older:
            return None
        latest_time = int(latest['timestamp'], 16)
        older_time = int(older['timestamp'], 16)
        if latest_time <= older_time:
            return None
        return (latest_time - older_time) / (latest_number - sample_number)
    except Exception:
        return None


def get_chain_fallback_block_time_seconds(ctx: VaultContext) -> Optional[float]:
    if ctx.chain_id in _CHAIN_BLOCK_TIME_CACHE:
        return _CHAIN_BLOCK_TIME_CACHE[ctx.chain_id]

    candidates = [ctx.rpc_url]
    candidates.extend(_load_chainlist_rpcs().get(ctx.chain_id, []))

    for rpc_url in candidates:
        if not rpc_url:
            continue
        seconds = _estimate_block_time_seconds(rpc_url)
        if seconds:
            _CHAIN_BLOCK_TIME_CACHE[ctx.chain_id] = seconds
            return seconds

    return None


def format_date(value: datetime.datetime) -> str:
    return value.strftime('%Y-%m-%d %H:%M:%S UTC')


def format_units(value: int, decimals: int = 6) -> str:
    sign = '-' if value < 0 else ''
    absolute = abs(value)
    if decimals == 0:
        return f"{sign}{absolute}"
    divisor = 10 ** decimals
    whole = absolute // divisor
    fraction = absolute % divisor
    if fraction == 0:
        return f"{sign}{whole}"
    frac_str = str(fraction).rjust(decimals, '0').rstrip('0')
    return f"{sign}{whole}.{frac_str}"


def format_units_display(value: int, decimals: int) -> str:
    max_frac = 6
    if decimals >= 18:
        max_frac = 8
    elif decimals == 8:
        max_frac = 8
    elif decimals <= 6:
        max_frac = 6
    text = format_units(value, decimals)
    if '.' not in text:
        return text
    whole, frac = text.split('.', 1)
    if len(frac) <= max_frac:
        return text
    return f"{whole}.{frac[:max_frac]}".rstrip('.')


def query_envio_graphql(query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
    payload = json.dumps({'query': query, 'variables': variables}).encode('utf-8')
    auth = base64.b64encode(f":{ENVIO_PASSWORD}".encode('utf-8')).decode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Basic {auth}',
    }
    request = urllib.request.Request(ENVIO_GRAPHQL_URL, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
    except urllib.error.URLError as exc:
        raise RuntimeError(f'GraphQL query failed: {exc}')

    if 'errors' in result:
        raise RuntimeError(f"GraphQL errors: {result['errors']}")
    return result.get('data', {})


def get_deposit_events(depositor_address: str, vault_address: Optional[str] = None) -> List[DepositEvent]:
    if vault_address:
        query = textwrap.dedent('''
            query GetDepositorDeposits($depositorAddress: String!, $vaultAddress: String!) {
              Deposit(
                where: {
                  owner: { _eq: $depositorAddress }
                  vaultAddress: { _eq: $vaultAddress }
                }
                order_by: { id: asc }
              ) {
                id
                sender
                owner
                assets
                shares
              }
            }
        ''')
        data = query_envio_graphql(query, {
            'depositorAddress': depositor_address.lower(),
            'vaultAddress': vault_address.lower(),
        })
    else:
        query = textwrap.dedent('''
            query GetDepositorDeposits($depositorAddress: String!) {
              Deposit(
                where: { owner: { _eq: $depositorAddress } }
                order_by: { id: asc }
              ) {
                id
                sender
                owner
                assets
                shares
              }
            }
        ''')
        data = query_envio_graphql(query, {'depositorAddress': depositor_address.lower()})
    return [DepositEvent(**entry) for entry in data.get('Deposit', [])]


def get_withdraw_events(depositor_address: str, vault_address: Optional[str] = None) -> List[WithdrawEvent]:
    if vault_address:
        query = textwrap.dedent('''
            query GetDepositorWithdrawals($depositorAddress: String!, $vaultAddress: String!) {
              Withdraw(
                where: {
                  owner: { _eq: $depositorAddress }
                  vaultAddress: { _eq: $vaultAddress }
                }
                order_by: { id: asc }
              ) {
                id
                sender
                receiver
                owner
                assets
                shares
              }
            }
        ''')
        data = query_envio_graphql(query, {
            'depositorAddress': depositor_address.lower(),
            'vaultAddress': vault_address.lower(),
        })
    else:
        query = textwrap.dedent('''
            query GetDepositorWithdrawals($depositorAddress: String!) {
              Withdraw(
                where: { owner: { _eq: $depositorAddress } }
                order_by: { id: asc }
              ) {
                id
                sender
                receiver
                owner
                assets
                shares
              }
            }
        ''')
        data = query_envio_graphql(query, {'depositorAddress': depositor_address.lower()})
    return [WithdrawEvent(**entry) for entry in data.get('Withdraw', [])]


def get_transfer_events(depositor_address: str, vault_address: Optional[str] = None) -> List[TransferEvent]:
    zero_address = '0x' + '0' * 40
    if vault_address:
        query = textwrap.dedent('''
            query GetDepositorTransfers($depositorAddress: String!, $zeroAddress: String!, $vaultAddress: String!) {
              transfersFrom: Transfer(
                where: {
                  sender: { _eq: $depositorAddress }
                  receiver: { _neq: $zeroAddress }
                  vaultAddress: { _eq: $vaultAddress }
                }
                order_by: { id: asc }
              ) {
                id
                sender
                receiver
                value
              }
              transfersTo: Transfer(
                where: {
                  receiver: { _eq: $depositorAddress }
                  sender: { _neq: $zeroAddress }
                  vaultAddress: { _eq: $vaultAddress }
                }
                order_by: { id: asc }
              ) {
                id
                sender
                receiver
                value
              }
            }
        ''')
        data = query_envio_graphql(query, {
            'depositorAddress': depositor_address.lower(),
            'zeroAddress': zero_address.lower(),
            'vaultAddress': vault_address.lower(),
        })
    else:
        query = textwrap.dedent('''
            query GetDepositorTransfers($depositorAddress: String!, $zeroAddress: String!) {
              transfersFrom: Transfer(
                where: {
                  sender: { _eq: $depositorAddress }
                  receiver: { _neq: $zeroAddress }
                }
                order_by: { id: asc }
              ) {
                id
                sender
                receiver
                value
              }
              transfersTo: Transfer(
                where: {
                  receiver: { _eq: $depositorAddress }
                  sender: { _neq: $zeroAddress }
                }
                order_by: { id: asc }
              ) {
                id
                sender
                receiver
                value
              }
            }
        ''')
        data = query_envio_graphql(query, {
            'depositorAddress': depositor_address.lower(),
            'zeroAddress': zero_address.lower(),
        })
    return [TransferEvent(**entry) for entry in data.get('transfersFrom', []) + data.get('transfersTo', [])]


def parse_event_id(event_id: str) -> Tuple[int, int]:
    parts = event_id.split('_')
    return int(parts[1]), int(parts[2])


def build_event_timeline(
    deposits: List[DepositEvent],
    withdrawals: List[WithdrawEvent],
    transfers: List[TransferEvent],
    depositor_address: str,
) -> List[Event]:
    events: List[Event] = []

    for deposit in deposits:
        block, log = parse_event_id(deposit.id)
        events.append(Event('deposit', block, log, deposit.__dict__))

    for withdrawal in withdrawals:
        block, log = parse_event_id(withdrawal.id)
        events.append(Event('withdraw', block, log, withdrawal.__dict__))

    for transfer in transfers:
        block, log = parse_event_id(transfer.id)
        event_type = 'transfer_out' if transfer.sender.lower() == depositor_address.lower() else 'transfer_in'
        events.append(Event(event_type, block, log, transfer.__dict__))

    events.sort(key=lambda itm: (itm.block_number, itm.log_index))
    return events


def calculate_position(events: List[Event], depositor_address: str) -> PositionResult:
    snapshots: List[PositionSnapshot] = []
    user_events: List[Event] = []
    current_shares = 0
    total_deposited = 0
    total_withdrawn = 0
    peak_shares = 0
    peak_shares_block = 0

    for event in events:
        shares_change = 0
        if event.type == 'deposit':
            shares_change = int(event.data['shares'])
            current_shares += shares_change
            total_deposited += int(event.data['assets'])
            user_events.append(event)
        elif event.type == 'withdraw':
            shares_change = -int(event.data['shares'])
            current_shares += shares_change
            total_withdrawn += int(event.data['assets'])
            user_events.append(event)
        elif event.type in ('transfer_in', 'transfer_out'):
            shares_change = int(event.data['value']) if event.type == 'transfer_in' else -int(event.data['value'])
            current_shares += shares_change
            user_events.append(event)

        if current_shares > peak_shares:
            peak_shares = current_shares
            peak_shares_block = event.block_number

        snapshots.append(PositionSnapshot(
            block_number=event.block_number,
            event_type=event.type,
            shares_balance=current_shares,
            shares_change=shares_change,
            assets_deposited=total_deposited,
            assets_withdrawn=total_withdrawn,
        ))

    return PositionResult(
        snapshots=snapshots,
        current_shares=current_shares,
        total_deposited=total_deposited,
        total_withdrawn=total_withdrawn,
        user_events=user_events,
        peak_shares=peak_shares,
        peak_shares_block=peak_shares_block,
    )


def calculate_weighted_average_entry_pps(ctx: VaultContext, events: List[Event], decimals: int) -> int:
    scale = 10 ** decimals
    total_assets = 0
    total_shares = 0

    # Track cost basis in asset terms while shares change over time.
    for event in events:
        if event.type == 'deposit':
            shares = int(event.data['shares'])
            assets = int(event.data['assets'])
            total_shares += shares
            total_assets += assets
        elif event.type == 'withdraw':
            shares = int(event.data['shares'])
            if total_shares > 0:
                remove_shares = min(shares, total_shares)
                removed_assets = (total_assets * remove_shares) // total_shares
                total_shares -= remove_shares
                total_assets -= removed_assets
        elif event.type == 'transfer_in':
            # Incoming transfers are valued at the PPS of the transfer block.
            shares = int(event.data['value'])
            pps = get_price_per_share_at_block(ctx, event.block_number)
            assets = shares * pps // scale
            total_shares += shares
            total_assets += assets
        elif event.type == 'transfer_out':
            shares = int(event.data['value'])
            if total_shares > 0:
                remove_shares = min(shares, total_shares)
                removed_assets = (total_assets * remove_shares) // total_shares
                total_shares -= remove_shares
                total_assets -= removed_assets

    if total_shares == 0:
        return 0

    return total_assets * scale // total_shares


def read_accountant_fee_config(
    ctx: VaultContext,
    vault_address: str,
    block_number: Optional[int] = None,
) -> Tuple[int, int, int, int]:
    accountant_hex = contract_call(ctx.rpc_url, vault_address, '0x4fb3ccc5', block_number)
    accountant_address = '0x' + accountant_hex[-40:]
    selector = '0xde1eb9a3'
    vault_param = vault_address.lower().replace('0x', '').rjust(64, '0')
    config_hex = contract_call(ctx.rpc_url, accountant_address, selector + vault_param, block_number)
    if not config_hex:
        raise RuntimeError('Empty getVaultConfig response')
    raw_payload = config_hex[2:] if config_hex.startswith('0x') else config_hex
    if len(raw_payload) < 64 * 4:
        logger.warning(
            'getVaultConfig returned %d hex characters; padding to %d',
            len(raw_payload),
            64 * 4,
        )
        hex_payload = raw_payload.ljust(64 * 4, '0')
    else:
        hex_payload = raw_payload
    words = [int(hex_payload[i * 64:(i + 1) * 64], 16) for i in range(4)]
    return (words[0], words[1], words[2], words[3])


def verify_management_fee_zero(ctx: VaultContext, vault_address: str, blocks: List[int]) -> None:
    for block in blocks:
        management_fee, _, _, _ = read_accountant_fee_config(ctx, vault_address, block)
        if management_fee != 0:
            raise RuntimeError(
                f'Management fee non-zero ({management_fee}) detected at block {block}; expected 0'
            )


def get_performance_fee_rate(
    ctx: VaultContext,
    vault_address: str,
    block_number: Optional[int] = None,
    *,
    log: bool = True,
) -> int:
    try:
        management_fee, performance_fee, _, max_fee = read_accountant_fee_config(ctx, vault_address, block_number)
        if management_fee != 0:
            raise RuntimeError(f'Unexpected management fee {management_fee} (expected 0)')
        if max_fee == 0:
            raise RuntimeError('maxFee is zero')
        ratio_bps = performance_fee * 10000 // max_fee
        if log:
            logger.info('Performance fee %.2f%% (calculated from on-chain)', ratio_bps / 100)
        return ratio_bps
    except Exception as exc:
        logger.warning('Could not fetch performance fee rate (%s) - using default 10%%', exc)
        return 1000


def sample_fee_check_blocks(start_block: int, end_block: int, checks: int = 5) -> List[int]:
    if checks <= 1 or start_block == end_block:
        return [start_block] * checks

    span = end_block - start_block
    if span <= 0:
        return [start_block] * checks

    return [start_block + (span * i) // (checks - 1) for i in range(checks)]


def verify_performance_fee_stability(
    ctx: VaultContext,
    vault_address: str,
    first_block: Optional[int],
    last_block: Optional[int],
    reference_fee_bps: int,
    checks: int = 5,
    *,
    blocks_to_check: Optional[List[int]] = None,
) -> List[int]:
    if first_block is None or last_block is None:
        return []
    if checks <= 0:
        return []

    if blocks_to_check is None:
        blocks_to_check = sample_fee_check_blocks(first_block, last_block, checks)
    observed = []
    for block in blocks_to_check:
        fee = get_performance_fee_rate(ctx, vault_address, block, log=False)
        observed.append((block, fee))

    if any(fee != reference_fee_bps for _, fee in observed):
        details = ', '.join(
            f'Block {block}: {fee / 100:.2f}%' for block, fee in observed
        )
        raise RuntimeError(
            f'Performance fee changed during depositor activity; expected '
            f'{reference_fee_bps / 100:.2f}%, observed [{details}]'
        )
    return blocks_to_check


def calculate_incremental_profit_and_fees(
    ctx: VaultContext,
    snapshots: List[PositionSnapshot],
    performance_fee_bps: int,
    current_pps: int,
    current_shares: int,
    decimals: int,
) -> Dict[str, int]:
    scale = 10 ** decimals
    net_profit = 0
    previous_shares = 0
    previous_pps = get_price_per_share_at_block(ctx, snapshots[0].block_number) if snapshots else current_pps

    # Incremental profit accumulates as PPS changes between user events.
    for snapshot in snapshots:
        snapshot_pps = get_price_per_share_at_block(ctx, snapshot.block_number)
        delta_pps = snapshot_pps - previous_pps
        net_profit += previous_shares * delta_pps // scale
        previous_shares = snapshot.shares_balance
        previous_pps = snapshot_pps

    # Add profit from the last snapshot to the current on-chain PPS.
    net_profit += previous_shares * (current_pps - previous_pps) // scale

    basis_points = 10000
    gross_profit = net_profit
    total_fees = 0
    if net_profit > 0 and basis_points > performance_fee_bps:
        gross_profit = net_profit * basis_points // (basis_points - performance_fee_bps)
        total_fees = gross_profit - net_profit

    return {
        'net_profit': net_profit,
        'gross_profit': gross_profit,
        'total_fees': total_fees,
        'effective_shares': current_shares,
    }


def sample_series(series: List[Dict[str, int]], max_points: int) -> List[Dict[str, int]]:
    if len(series) <= max_points:
        return series
    step = len(series) / (max_points - 1)
    sampled: List[Dict[str, int]] = []
    for i in range(max_points - 1):
        index = min(int(i * step), len(series) - 1)
        sampled.append(series[index])
    sampled.append(series[-1])
    return sampled


def prepare_balance_profit_series(
    ctx: VaultContext,
    snapshots: List[PositionSnapshot],
    decimals: int,
    current_pps: int,
    current_shares: int,
) -> List[Dict[str, int]]:
    if not snapshots:
        return []
    scale = 10 ** decimals
    series: List[Dict[str, int]] = []
    profit = 0
    previous_shares = 0
    previous_pps = get_price_per_share_at_block(ctx, snapshots[0].block_number)

    # Mirror the incremental profit calc so the plot matches fee math.
    for snapshot in snapshots:
        snapshot_pps = get_price_per_share_at_block(ctx, snapshot.block_number)
        delta_pps = snapshot_pps - previous_pps
        profit += previous_shares * delta_pps // scale
        previous_shares = snapshot.shares_balance
        previous_pps = snapshot_pps
        series.append({
            'block': snapshot.block_number,
            'shares': snapshot.shares_balance,
            'profit': profit,
        })

    # Extend the series to "now" with the current PPS.
    profit += previous_shares * (current_pps - previous_pps) // scale

    # Add the current state as a final data point (block is best-effort).
    try:
        current_block_hex = rpc_call(ctx.rpc_url, 'eth_blockNumber', [])
        current_block = int(current_block_hex, 16)
    except Exception:
        # If RPC call fails, use last snapshot block + offset as approximation.
        current_block = snapshots[-1].block_number + 1000

    series.append({
        'block': current_block,
        'shares': current_shares,
        'profit': profit,
    })

    return series


def plot_balance_profit(
    ctx: VaultContext,
    snapshots: List[PositionSnapshot],
    decimals: int,
    current_pps: int,
    current_shares: int,
    symbol: str,
) -> None:
    if not snapshots:
        return
    if not HAS_MATPLOTLIB:  # pragma: no cover
        logger.info('Install matplotlib (`pip install matplotlib`) to see the plot.')
        return
    series = prepare_balance_profit_series(ctx, snapshots, decimals, current_pps, current_shares)
    graph_series = sample_series(series, 300)
    blocks = [point['block'] for point in graph_series]
    shares = [point['shares'] / (10 ** decimals) for point in graph_series]
    profits = [point['profit'] / (10 ** decimals) for point in graph_series]

    fig, ax = plt.subplots(figsize=(10, 4))
    try:
        fig.canvas.manager.set_window_title('Balance and profit over time')
    except AttributeError:
        try:
            fig.canvas.set_window_title('Balance and profit over time')
        except AttributeError:
            pass
    # Step chart keeps balances flat between events, only jumping at event blocks.
    shares_line, = ax.step(blocks, shares, label='Share balance', color='tab:blue', where='post')
    ax.set_xlabel('Block')
    ax.set_ylabel(f'Shares ({symbol} share units)', color='tab:blue')
    ax.tick_params(axis='y', labelcolor='tab:blue')
    ax.grid(alpha=0.3)

    dates = [get_block_timestamp(ctx, block) for block in blocks]

    # Add a top x-axis for start/end dates plus quarterly markers.
    if dates:
        start_date = dates[0].strftime('%d/%m/%Y')
        end_date = dates[-1].strftime('%d/%m/%Y')

        ax_dates = ax.twiny()
        ax_dates.set_xlim(ax.get_xlim())

        ticks: List[Tuple[int, str]] = [
            (blocks[0], f'Start: {start_date}'),
            (blocks[-1], f'End: {end_date}'),
        ]

        # Add quarterly markers by mapping quarter starts to the nearest block in the series.
        quarter_start_month = ((dates[0].month - 1) // 3) * 3 + 1
        quarter_start = datetime.datetime(
            dates[0].year,
            quarter_start_month,
            1,
            tzinfo=dates[0].tzinfo,
        )
        if quarter_start < dates[0]:
            month = quarter_start.month + 3
            year = quarter_start.year
            if month > 12:
                month -= 12
                year += 1
            quarter_start = datetime.datetime(year, month, 1, tzinfo=dates[0].tzinfo)

        date_timestamps = [date.timestamp() for date in dates]
        while quarter_start < dates[-1]:
            target_ts = quarter_start.timestamp()
            idx = bisect.bisect_left(date_timestamps, target_ts)
            if 0 < idx < len(date_timestamps):
                before_ts = date_timestamps[idx - 1]
                after_ts = date_timestamps[idx]
                if after_ts != before_ts:
                    ratio = (target_ts - before_ts) / (after_ts - before_ts)
                else:
                    ratio = 0.0
                block = blocks[idx - 1] + ratio * (blocks[idx] - blocks[idx - 1])
                quarter = (quarter_start.month - 1) // 3 + 1
                ticks.append((block, f'Q{quarter} {quarter_start.year}'))

            month = quarter_start.month + 3
            year = quarter_start.year
            if month > 12:
                month -= 12
                year += 1
            quarter_start = datetime.datetime(year, month, 1, tzinfo=dates[0].tzinfo)

        ticks.sort(key=lambda item: item[0])
        tick_positions = [block for block, _ in ticks]
        tick_labels = [label for _, label in ticks]

        ax_dates.set_xticks(tick_positions)
        ax_dates.set_xticklabels(tick_labels)
        ax_dates.set_xlabel('Date Range')
        ax_dates.xaxis.set_label_position('top')
        ax_dates.xaxis.set_ticks_position('top')
        ax_dates.spines['top'].set_position(('outward', 36))
        ax_dates.tick_params(axis='x', labelrotation=15, labelsize=9)

    ax2 = ax.twinx()
    profit_line, = ax2.plot(blocks, profits, label=f'Incremental profit ({symbol})', color='tab:green')
    ax2.set_ylabel(f'Incremental profit ({symbol})', color='tab:green')
    ax2.tick_params(axis='y', labelcolor='tab:green')

    lines = [shares_line, profit_line]
    labels = [line.get_label() for line in lines]
    ax.legend(lines, labels, loc='upper left')
    fig.suptitle(f'Yearn V3 depositor balance vs incremental profit ({symbol})')
    fig.tight_layout()
    output_path = 'depositor_fees_plot.png'
    plt.savefig(output_path, dpi=200)
    logger.info('Plot saved to %s', output_path)


def format_output(
    ctx: VaultContext,
    depositor_address: str,
    deposits: List[DepositEvent],
    withdrawals: List[WithdrawEvent],
    transfers: List[TransferEvent],
    position: PositionResult,
    current_value: int,
    weighted_avg_entry_pps: int,
    profit_and_fees: Dict[str, int],
    performance_fee_bps: int,
    current_pps: int,
    first_interaction_date: Optional[datetime.datetime],
    first_interaction_block: Optional[int],
    peak_value: Optional[int],
    peak_date: Optional[datetime.datetime],
) -> None:
    net_profit = profit_and_fees['net_profit']
    gross_profit = profit_and_fees['gross_profit']
    total_fees = profit_and_fees['total_fees']
    current_shares = position.current_shares
    total_deposited = position.total_deposited
    total_withdrawn = position.total_withdrawn
    net_deposited = total_deposited - total_withdrawn
    transfers_in = [t for t in transfers if t.receiver.lower() == depositor_address.lower()]
    transfers_out = [t for t in transfers if t.sender.lower() == depositor_address.lower()]
    transfer_adjusted_net = net_deposited
    scale = 10 ** ctx.decimals
    for transfer in transfers:
        shares = int(transfer.value)
        pps = get_price_per_share_at_block(ctx, parse_event_id(transfer.id)[0])
        assets = shares * pps // scale
        if transfer.receiver.lower() == depositor_address.lower():
            transfer_adjusted_net += assets
        elif transfer.sender.lower() == depositor_address.lower():
            transfer_adjusted_net -= assets

    print('\n' + '=' * 80)
    print('YEARN V3 DEPOSITOR FEE & PROFIT ANALYSIS')
    print('=' * 80)
    print('\n📊 DEPOSITOR INFORMATION')
    print('-' * 80)
    print(f'Address: {depositor_address}')
    print(f'Vault:   {ctx.address}')
    chain_name = CHAIN_CONFIG.get(ctx.chain_id, {}).get('name', 'Unknown')
    print(f'Asset:   {ctx.symbol} ({ctx.decimals} decimals)')
    print(f'Chain:   {chain_name} (ID: {ctx.chain_id})')
    if first_interaction_block and first_interaction_date:
        print(f'First Interaction: Block {first_interaction_block} ({format_date(first_interaction_date)})')

    print('\n💰 POSITION SUMMARY')
    print('-' * 80)
    print(f'Current Shares:     {format_units_display(current_shares, ctx.decimals)} shares')
    print(f'Current Value:      {format_units_display(current_value, ctx.decimals)} {ctx.symbol}')
    print(f'Total Deposited:    {format_units_display(total_deposited, ctx.decimals)} {ctx.symbol}')
    print(f'Total Withdrawn:    {format_units_display(total_withdrawn, ctx.decimals)} {ctx.symbol}')
    print(f'Net Deposited:      {format_units_display(net_deposited, ctx.decimals)} {ctx.symbol}')

    if position.peak_shares > 0:
        print('\n📊 Peak Position:')
        print(f'   Highest Shares:  {format_units_display(position.peak_shares, ctx.decimals)} shares')
        if peak_value is not None:
            print(f'   Peak Value:      {format_units_display(peak_value, ctx.decimals)} {ctx.symbol}')
        if peak_date:
            print(f'   Peak Date:       Block {position.peak_shares_block} ({format_date(peak_date)})')
        else:
            print(f'   Peak Block:      {position.peak_shares_block}')

        shares_diff = current_shares - position.peak_shares
        shares_diff_pct = (shares_diff * 10000) // position.peak_shares if position.peak_shares else 0
        if shares_diff < 0:
            print(f'   Change from peak: {format_units_display(-shares_diff, ctx.decimals)} shares lower ({abs(shares_diff_pct) / 100:.2f}%)')
        elif shares_diff == 0:
            print('   Change from peak: Currently at peak!')

    print('\n💰 PRICE PER SHARE ANALYSIS')
    print('-' * 80)
    print(f'Weighted Avg Entry PPS: {format_units_display(weighted_avg_entry_pps, ctx.decimals)}')
    print(f'Current PPS:            {format_units_display(current_pps, ctx.decimals)}')
    pps_diff = current_pps - weighted_avg_entry_pps
    pps_diff_pct = (pps_diff * 10000) // weighted_avg_entry_pps if weighted_avg_entry_pps else 0
    pps_sign = '+' if pps_diff >= 0 else ''
    print(f'PPS Change:             {pps_sign}{format_units_display(pps_diff, ctx.decimals)} ({pps_sign}{pps_diff_pct / 100:.2f}%)')

    print('\n📈 PROFIT/LOSS (Price Per Share Method)')
    print('-' * 80)
    net_profit_sign = '+' if net_profit >= 0 else ''
    gross_profit_sign = '+' if gross_profit >= 0 else ''
    print(f'Gross Profit (before fees): {gross_profit_sign}{format_units_display(gross_profit, ctx.decimals)} {ctx.symbol}')
    print(f'Net Profit (after fees):    {net_profit_sign}{format_units_display(net_profit, ctx.decimals)} {ctx.symbol}')

    net_profit_pct = (net_profit * 10000) // net_deposited if net_deposited > 0 else 0
    transfer_adjusted_pct = (net_profit * 10000) // transfer_adjusted_net if transfer_adjusted_net > 0 else 0
    print(f'Return on Investment (cash): {net_profit_sign}{net_profit_pct / 100:.2f}%')
    print(f'Return on Investment (xfer): {net_profit_sign}{transfer_adjusted_pct / 100:.2f}%')

    print('\n💸 FEES PAID')
    print('-' * 80)
    print(f'Performance Fee Rate:   {performance_fee_bps / 100}%')
    print(f'Total Fees Paid:        {format_units_display(total_fees, ctx.decimals)} {ctx.symbol}')
    if gross_profit > 0:
        fee_percentage = (total_fees * 10000) // gross_profit
        print(f'Fees as % of Gross:     {fee_percentage / 100:.2f}%')

    print('\nCalculation Method:')
    print('  • Weighted average entry PPS calculated from deposits and incoming transfers (transfers valued at the block PPS)')
    print('  • Net profit = (Current PPS - Entry PPS) × Current Shares')
    print('  • Gross profit = Net profit / (1 - Fee Rate)')
    print('  • Fees = Gross profit - Net profit')

    print('\n📝 USER EVENTS')
    print('-' * 80)
    print(f'Total Deposits:     {len(deposits)}')
    print(f'Total Withdrawals:  {len(withdrawals)}')
    print(f'Total Transfers:    {len(transfers)} (excluding mint/burn)')
    print(f'  - Transfers IN:   {len(transfers_in)}')
    print(f'  - Transfers OUT:  {len(transfers_out)}')
    print(f'Total Events Processed: {len(position.user_events)}')

    all_events = build_event_timeline(deposits, withdrawals, transfers, depositor_address)
    if all_events:
        print('\n  Events:')
        for index, event in enumerate(all_events, start=1):
            block = event.block_number
            if event.type == 'deposit':
                assets = int(event.data['assets'])
                shares = int(event.data['shares'])
                print(f'    {index}. Block {block}: Deposit {format_units_display(assets, ctx.decimals)} {ctx.symbol} → {format_units_display(shares, ctx.decimals)} shares')
            elif event.type == 'withdraw':
                assets = int(event.data['assets'])
                shares = int(event.data['shares'])
                print(f'    {index}. Block {block}: Withdraw {format_units_display(shares, ctx.decimals)} shares → {format_units_display(assets, ctx.decimals)} {ctx.symbol}')
            elif event.type == 'transfer_in':
                value = int(event.data['value'])
                print(f'    {index}. Block {block}: Transfer IN {format_units_display(value, ctx.decimals)} shares')
            elif event.type == 'transfer_out':
                value = int(event.data['value'])
                print(f'    {index}. Block {block}: Transfer OUT {format_units_display(value, ctx.decimals)} shares')

    print('\n' + '=' * 80)

    plot_balance_profit(ctx, position.snapshots, ctx.decimals, current_pps, current_shares, ctx.symbol)



def main() -> None:
    parser = argparse.ArgumentParser(
        description='Calculate Yearn V3 depositor fees and profit/loss analysis'
    )
    parser.add_argument(
        'depositor_address',
        help='Ethereum address of the depositor (must start with 0x)'
    )
    parser.add_argument(
        '--vault', '-v',
        default=DEFAULT_VAULT_ADDRESS,
        help=f'Vault address (default: {DEFAULT_VAULT_ADDRESS})'
    )
    parser.add_argument(
        '--chain', '-c',
        type=int,
        default=DEFAULT_CHAIN_ID,
        help=f'Chain ID (default: {DEFAULT_CHAIN_ID}). Supported: 1 (Ethereum), 8453 (Base), 42161 (Arbitrum), 137 (Polygon)'
    )
    parser.add_argument(
        '--stable-fees',
        action='store_true',
        help='Verify that performance fee remained stable throughout depositor history'
    )
    args = parser.parse_args()

    depositor_address = args.depositor_address
    vault_address = args.vault
    chain_id = args.chain
    check_stable_fees = args.stable_fees

    if not depositor_address.startswith('0x') or len(depositor_address) != 42:
        logger.error('Invalid Ethereum address format for depositor')
        sys.exit(1)
    if not (vault_address.startswith('0x') and len(vault_address) == 42):
        logger.error('Invalid vault address format')
        sys.exit(1)

    rpc_url = select_rpc_url(chain_id)

    logger.info('Validating vault contract...')
    validate_vault_address(rpc_url, vault_address)

    logger.info('Fetching data from Envio indexer...')
    deposits = get_deposit_events(depositor_address, vault_address)
    withdrawals = get_withdraw_events(depositor_address, vault_address)
    transfers = get_transfer_events(depositor_address, vault_address)

    logger.info('Building position timeline...')
    position = calculate_position(
        build_event_timeline(deposits, withdrawals, transfers, depositor_address),
        depositor_address,
    )

    if position.snapshots:
        first_event_block = position.snapshots[0].block_number
        last_event_block = position.snapshots[-1].block_number
    else:
        first_event_block = None
        last_event_block = None

    logger.info('Fetching current vault state...')
    price_per_share_hex = contract_call(rpc_url, vault_address, PRICE_PER_SHARE_SELECTOR)
    decimals_hex = contract_call(rpc_url, vault_address, DECIMALS_SELECTOR)
    price_per_share = int(price_per_share_hex, 16)
    decimals = int(decimals_hex, 16)
    symbol = 'TOKEN'
    asset_address = ''
    try:
        asset_address = get_asset_address(rpc_url, vault_address)
        symbol = get_token_symbol(rpc_url, asset_address) or symbol
    except Exception as exc:
        logger.warning('Could not fetch token symbol: %s', exc)
    ctx = VaultContext(
        address=vault_address,
        chain_id=chain_id,
        rpc_url=rpc_url,
        decimals=decimals,
        symbol=symbol,
        asset_address=asset_address,
    )
    current_value = position.current_shares * price_per_share // (10 ** decimals)

    logger.info('Fetching performance fee rate...')
    performance_fee_bps = get_performance_fee_rate(ctx, vault_address)
    if check_stable_fees and first_event_block is not None and last_event_block is not None:
        blocks_to_check = sample_fee_check_blocks(first_event_block, last_event_block)
        logger.info('Verifying performance fee stability throughout depositor history (%d datapoints)...', len(blocks_to_check))
        verify_performance_fee_stability(
            ctx,
            vault_address,
            first_event_block,
            last_event_block,
            performance_fee_bps,
            blocks_to_check=blocks_to_check,
        )
        logger.info('Verifying management fee remains zero throughout depositor history (%d datapoints)...', len(blocks_to_check))
        verify_management_fee_zero(ctx, vault_address, blocks_to_check)
    weighted_avg_entry_pps = calculate_weighted_average_entry_pps(ctx, position.user_events, decimals)
    profit_and_fees = calculate_incremental_profit_and_fees(
        ctx,
        position.snapshots,
        performance_fee_bps,
        price_per_share,
        position.current_shares,
        decimals,
    )

    all_user_blocks = [
        *map(lambda d: parse_event_id(d.id)[0], deposits),
        *map(lambda w: parse_event_id(w.id)[0], withdrawals),
        *map(lambda t: parse_event_id(t.id)[0], transfers),
    ]
    first_block = min(all_user_blocks) if all_user_blocks else None
    first_date = get_block_timestamp(ctx, first_block) if first_block is not None else None

    peak_value = None
    peak_date = None
    if position.peak_shares > 0 and position.peak_shares_block > 0:
        logger.info('Calculating peak position value...')
        try:
            peak_price = get_price_per_share_at_block(ctx, position.peak_shares_block)
            peak_value = position.peak_shares * peak_price // (10 ** decimals)
            peak_date = get_block_timestamp(ctx, position.peak_shares_block)
        except Exception as exc:
            logger.warning('Could not fetch peak position value: %s', exc)

    format_output(
        ctx,
        depositor_address,
        deposits,
        withdrawals,
        transfers,
        position,
        current_value,
        weighted_avg_entry_pps,
        profit_and_fees,
        performance_fee_bps,
        price_per_share,
        first_date,
        first_block,
        peak_value,
        peak_date,
    )


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        logger.error('Error: %s', exc)
        sys.exit(1)
