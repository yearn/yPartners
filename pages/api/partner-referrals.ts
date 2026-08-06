import { toAddress, ZERO_ADDRESS } from "lib/yearn/utils/address";
import {SHAREABLE_ADDRESSES} from 'utils/Partners';
import type { NextApiRequest, NextApiResponse } from "next";

// Chains where YearnReferralWrapper (0x3744Df2673097d738aCaa3E463E6D638867757f2) is deployed
const SUPPORTED_CHAIN_IDS = new Set([1, 8453, 42161, 747474]);
// This address is the ysyBOLD vault used by Frankencoin collateral tracking,
// but it must never be attributed as a referral depositor in any partner flow.
const EXCLUDED_REFERRAL_ADDRESSES: Record<string, true> = {
	'0x23346b04a7f55b8760e5860aa5a77383d63491cd': true
};
const FRANKENCOIN_PARTNER = "frankencoin";
// ysyBOLD (Staked yBOLD, 0x23346B04…) is the Yearn V3 vault used as Frankencoin (ZCHF)
// collateral. The Frankencoin partner has no static depositor list: the tracked
// depositors are the Frankencoin V2 collateral positions, resolved dynamically below.
const YSYBOLD_VAULT = "0x23346B04a7f55b8760E5860AA5A77383D63491cD";

type TReferralDeposit = {
	id: string;
	receiver: string;
	referrer: string;
	vault: string;
};
type TShareDeposit = {
	id: string;
	shares: string;
};

type TShareTransfer = {
	id: string;
	receiver: string;
	value: string;
};

type TPartnerVaultConfig = {
	[chainId: number]: {
		[vaultAddress: string]: string[];
	};
};

type TResponseBody = TPartnerVaultConfig | { error: string };

// Envio multi-chain event IDs are formatted as "{chainId}_{blockNumber}_{logIndex}"
function parseChainIdFromEventId(eventId: string): number | null {
	const parts = eventId.split("_");
	if (parts.length < 3) {
		return null;
	}
	const chainId = parseInt(parts[0], 10);
	if (!Number.isFinite(chainId) || !SUPPORTED_CHAIN_IDS.has(chainId)) {
		return null;
	}
	return chainId;
}

function parseBlockFromEventId(eventId: string): number | null {
	const parts = eventId.split("_");
	if (parts.length < 3) {
		return null;
	}
	const block = parseInt(parts[1], 10);
	return Number.isFinite(block) ? block : null;
}

async function queryEnvioGraphQL<T>(
	query: string,
	variables: Record<string, unknown>,
): Promise<T> {
	const envioUrl = process.env.ENVIO_GRAPHQL_URL;

	if (!envioUrl) {
		throw new Error("ENVIO_GRAPHQL_URL must be configured");
	}

	const payload = JSON.stringify({ query, variables });

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (process.env.ENVIO_PASSWORD) {
		headers["Authorization"] = `Bearer ${process.env.ENVIO_PASSWORD}`;
	}

	const response = await fetch(envioUrl, {
		method: "POST",
		headers,
		body: payload,
	});

	if (!response.ok) {
		throw new Error(
			`GraphQL query failed: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as { data?: T; errors?: unknown };
	if (data.errors) {
		throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
	}
	return data.data as T;
}

async function getReferralDeposits(
	referrerAddress: string,
): Promise<TReferralDeposit[]> {
	const query = `
		query GetReferralDeposits($referrerAddress: String!) {
			ReferralDeposit(
				where: {
					referrer: { _ilike: $referrerAddress }
				}
				order_by: { id: asc }
			) {
				id
				receiver
				referrer
				vault
			}
		}
	`;

	const result = await queryEnvioGraphQL<{
		ReferralDeposit: TReferralDeposit[];
	}>(query, {
		referrerAddress: referrerAddress.toLowerCase(),
	});

	return result?.ReferralDeposit || [];
}

// Maximum hops to follow when tracing forwarded referral shares. Atomic swap
// routers forward within a handful of hops; this bounds pathological chains.
const MAX_SHARE_TRACE_DEPTH = 10;

// Envio stores addresses EIP-55 checksummed and `_in`/`_eq` are case-sensitive,
// so we query both the lowercased and checksummed forms (mirrors
// buildAddressVariants in partner-fees.ts) to keep matching case-insensitive.
function buildAddressVariants(address: string): string[] {
	const variants = new Set<string>();
	variants.add(address.toLowerCase());
	const checksummed = toAddress(address);
	if (checksummed !== ZERO_ADDRESS) {
		variants.add(checksummed);
	}
	return Array.from(variants);
}

// Recover the minted share amount per deposit block for a referral receiver.
// The Envio ReferralDeposit row carries no amount, so we read it from the
// matching ERC4626 Deposit (same owner/vault/chain, same block/tx).
async function getDepositSharesByOwner(
	owner: string,
	vaultAddress: string,
	chainId: number,
): Promise<Map<number, string>> {
	const query = `
		query GetOwnerShares($owners: [String!]!, $vaults: [String!]!, $chainId: Int!) {
			Deposit(
				where: {
					owner: { _in: $owners }
					vaultAddress: { _in: $vaults }
					chainId: { _eq: $chainId }
				}
				order_by: { id: asc }
			) {
				id
				shares
			}
		}
	`;
	const result = await queryEnvioGraphQL<{ Deposit: TShareDeposit[] }>(query, {
		owners: buildAddressVariants(owner),
		vaults: buildAddressVariants(vaultAddress),
		chainId,
	});
	const byBlock = new Map<number, string>();
	for (const deposit of result?.Deposit || []) {
		const block = parseBlockFromEventId(deposit.id);
		if (block !== null && !byBlock.has(block)) {
			byBlock.set(block, deposit.shares);
		}
	}
	return byBlock;
}

// All vault share Transfers sent by `sender`, used to follow forwarding hops.
async function getTransfersFromSender(
	sender: string,
	vaultAddress: string,
	chainId: number,
): Promise<TShareTransfer[]> {
	const query = `
		query GetSenderTransfers($senders: [String!]!, $vaults: [String!]!, $chainId: Int!) {
			Transfer(
				where: {
					sender: { _in: $senders }
					vaultAddress: { _in: $vaults }
					chainId: { _eq: $chainId }
				}
				order_by: { id: asc }
			) {
				id
				receiver
				value
			}
		}
	`;
	const result = await queryEnvioGraphQL<{ Transfer: TShareTransfer[] }>(query, {
		senders: buildAddressVariants(sender),
		vaults: buildAddressVariants(vaultAddress),
		chainId,
	});
	return result?.Transfer || [];
}

// Trace the minted referral shares forward through Transfer events until they
// reach an address that retains them, returning that holder.
//
// Aggregator-routed referral deposits (e.g. via Jumper) name the router as the
// referral `receiver`. The router forwards the shares to the end user within the
// same transaction, so the router itself holds nothing and would contribute 0
// TVL/fees. We instead follow the exact minted share amount, hop by hop, scoped
// to the deposit's own block (atomic forwarding), and attribute the deposit to
// the address that ultimately holds the shares.
async function traceShareHolder(
	receiver: string,
	vaultAddress: string,
	chainId: number,
	shares: string,
	depositBlock: number,
	transferCache: Map<string, TShareTransfer[]>,
): Promise<string> {
	let current = receiver;
	const visited = new Set<string>();
	for (let depth = 0; depth < MAX_SHARE_TRACE_DEPTH; depth += 1) {
		const key = `${chainId}_${vaultAddress.toLowerCase()}_${current.toLowerCase()}`;
		if (visited.has(current.toLowerCase())) {
			break;
		}
		visited.add(current.toLowerCase());
		let transfers = transferCache.get(key);
		if (!transfers) {
			transfers = await getTransfersFromSender(current, vaultAddress, chainId);
			transferCache.set(key, transfers);
		}
		// Follow the forwarding transfer of the exact share amount within the
		// deposit's own block (atomic swaps forward in the same tx/block).
		const next = transfers.find(
			(t) => t.value === shares && parseBlockFromEventId(t.id) === depositBlock,
		);
		if (!next) {
			break;
		}
		current = next.receiver;
	}
	return current;
}

// Build the {chain → vault → depositors} config, resolving each referral
// `receiver` to the ultimate holder of its minted shares. Falls back to the raw
// receiver when the share amount cannot be recovered (no matching Deposit).
async function resolveReferralHolders(
	deposits: TReferralDeposit[],
): Promise<TPartnerVaultConfig> {
	const config: TPartnerVaultConfig = {};
	const transferCache = new Map<string, TShareTransfer[]>();
	const sharesCache = new Map<string, Map<number, string>>();

	for (const deposit of deposits) {
		const chainId = parseChainIdFromEventId(deposit.id);
		const block = parseBlockFromEventId(deposit.id);
		if (chainId === null || block === null) {
			continue;
		}

		const vault = toAddress(deposit.vault);
		const receiver = toAddress(deposit.receiver);
		if (EXCLUDED_REFERRAL_ADDRESSES[receiver.toLowerCase()]) {
			continue;
		}
		const sharesKey = `${chainId}_${vault}_${receiver.toLowerCase()}`;
		let sharesByBlock = sharesCache.get(sharesKey);
		if (!sharesByBlock) {
			sharesByBlock = await getDepositSharesByOwner(receiver, vault, chainId);
			sharesCache.set(sharesKey, sharesByBlock);
		}

		const shares = sharesByBlock.get(block);
		const holder = shares
			? toAddress(await traceShareHolder(receiver, vault, chainId, shares, block, transferCache))
			: receiver;
		if (EXCLUDED_REFERRAL_ADDRESSES[holder.toLowerCase()]) {
			continue;
		}

		if (!config[chainId]) {
			config[chainId] = {};
		}
		if (!config[chainId][vault]) {
			config[chainId][vault] = [];
		}
		if (!config[chainId][vault].includes(holder)) {
			config[chainId][vault].push(holder);
		}
	}

	return config;
}
type TFrankencoinPositionAccount = {
	address: string;
	chainId: number;
};

// Resolve the Frankencoin V2 positions that hold ysyBOLD as ZCHF collateral.
//
// The Envio indexer (yearn-indexing-test, PRs #36/#37) flags every such position via
// FrankencoinMintingHubV2.PositionOpened and maintains a per-account ysyBOLD ledger
// (FrankencoinYsyBoldAccount, isPosition=true). Each flagged account's `address` is a
// collateral position contract; its ysyBOLD balance (driven by Transfer events) is what
// /api/partner-tvl and /api/partner-fees track. We return the same {chain → vault →
// depositors} shape as the referral resolver so the dashboard's merge machinery in
// usePartner consumes it unchanged. This is ground truth and needs no RPC.
async function getFrankencoinCollateralConfig(): Promise<TPartnerVaultConfig> {
	const query = `
		query GetFrankencoinYsyBoldPositions {
			FrankencoinYsyBoldAccount(
				where: { isPosition: { _eq: true } }
				limit: 1000
			) {
				address
				chainId
			}
		}
	`;

	const result = await queryEnvioGraphQL<{
		FrankencoinYsyBoldAccount: TFrankencoinPositionAccount[];
	}>(query, {});

	const config: TPartnerVaultConfig = {};
	const vault = toAddress(YSYBOLD_VAULT);
	for (const account of result?.FrankencoinYsyBoldAccount || []) {
		if (!config[account.chainId]) {
			config[account.chainId] = {};
		}
		if (!config[account.chainId][vault]) {
			config[account.chainId][vault] = [];
		}
		const position = toAddress(account.address);
		if (!config[account.chainId][vault].includes(position)) {
			config[account.chainId][vault].push(position);
		}
	}

	return config;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<TResponseBody>,
): Promise<void> {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

	const referrerParam = req.query.referrer;

	if (!referrerParam) {
		res.status(400).json({ error: "referrer parameter is required" });
		return;
	}

	const referrerAddress = toAddress(
		Array.isArray(referrerParam) ? referrerParam[0] : referrerParam,
	);

	const hasEnvioConfig = Boolean(process.env.ENVIO_GRAPHQL_URL);
	if (!hasEnvioConfig) {
		const error = "ENVIO_GRAPHQL_URL is not configured.";
		console.warn(`[partner-referrals] ${error}`);
		res.status(503).json({error});
		return;
	}

	try {
		const partnerShortName = SHAREABLE_ADDRESSES[referrerAddress]?.shortName;
		if (partnerShortName === FRANKENCOIN_PARTNER) {
			const collateralConfig = await getFrankencoinCollateralConfig();
			res.status(200).json(collateralConfig);
			return;
		}
		const deposits = await getReferralDeposits(referrerAddress);

		// Resolve each referral deposit's ultimate share holder. Aggregator-routed
		// deposits name the router as the referral `receiver`; the router forwards
		// the shares to the end user in the same transaction, so we trace the
		// minted shares forward and attribute the deposit to whoever holds them.
		const config = await resolveReferralHolders(deposits);

		res.status(200).json(config);
	} catch (error) {
		console.error(
			"[partner-referrals] Failed to fetch referral deposits",
			error,
		);
		res.status(500).json({ error: "Failed to fetch referral deposits" });
	}
}
