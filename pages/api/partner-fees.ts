import {BigNumber, ethers} from 'ethers';
import type {NextApiRequest, NextApiResponse} from 'next';
import {toAddress} from 'lib/yearn/utils/address';

type TDepositEvent = {
	id: string,
	sender: string,
	owner: string,
	assets: string,
	shares: string
};

type TWithdrawEvent = {
	id: string,
	sender: string,
	receiver: string,
	owner: string,
	assets: string,
	shares: string
};

type TTransferEvent = {
	id: string,
	sender: string,
	receiver: string,
	value: string
};

type TEvent =
	| {type: 'deposit', blockNumber: number, logIndex: number, data: TDepositEvent}
	| {type: 'withdraw', blockNumber: number, logIndex: number, data: TWithdrawEvent}
	| {type: 'transfer_in' | 'transfer_out', blockNumber: number, logIndex: number, data: TTransferEvent};

type TSnapshot = {
	blockNumber: number,
	eventType: TEvent['type'],
	sharesBalance: BigNumber
};

type TAccountFees = {
	address: string,
	totalFees: string,
	totalFeesNormalized: number
};

type TResponse =
	| {
			vaultAddress: string,
			decimals: number,
			performanceFeeBps: number,
			totalFees: string,
			totalFeesNormalized: number,
			accounts: TAccountFees[]
		}
	| {error: string};

const DEFAULT_VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';
const ZERO_ADDRESS = ethers.constants.AddressZero;
const PRICE_PER_SHARE_SELECTOR = '0x99530b06';
const DECIMALS_SELECTOR = '0x313ce567';
const ACCOUNTANT_SELECTOR = '0x4fb3ccc5';
const VAULT_CONFIG_SELECTOR = '0xde1eb9a3';
const DEFAULT_DECIMALS = 18;
const DEFAULT_PERFORMANCE_FEE_BPS = 0;

const pricePerShareCache: Map<string, BigNumber> = new Map();

function parseAddresses(addressParam: string | string[] | undefined): string[] {
	if (!addressParam) {
		return [];
	}

	const rawAddresses = Array.isArray(addressParam) ? addressParam : addressParam.split(',');
	const uniqueAddresses = new Set<string>();

	for (const addr of rawAddresses) {
		const formatted = toAddress(addr);
		if (formatted !== ZERO_ADDRESS) {
			uniqueAddresses.add(formatted);
		}
	}

	return Array.from(uniqueAddresses);
}

function buildEmptyResponse(addresses: string[], vaultAddress: string): TResponse {
	return {
		vaultAddress,
		decimals: DEFAULT_DECIMALS,
		performanceFeeBps: DEFAULT_PERFORMANCE_FEE_BPS,
		totalFees: '0',
		totalFeesNormalized: 0,
		accounts: addresses.map((address): TAccountFees => ({
			address,
			totalFees: '0',
			totalFeesNormalized: 0
		}))
	};
}

async function queryEnvioGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
	const envioUrl = process.env.ENVIO_GRAPHQL_URL;

	if (!envioUrl) {
		throw new Error('ENVIO_GRAPHQL_URL must be configured');
	}

	const payload = JSON.stringify({query, variables});

	const response = await fetch(envioUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: payload
	});

	if (!response.ok) {
		throw new Error(`GraphQL query failed: ${response.status} ${response.statusText}`);
	}

	const data = await response.json() as {data?: T, errors?: unknown};
	if (data.errors) {
		throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
	}
	return data.data as T;
}

function parseEventId(eventId: string): {block: number, log: number} {
	const parts = eventId.split('_');
	return {block: parseInt(parts[1], 10), log: parseInt(parts[2], 10)};
}

async function getDepositEvents(address: string): Promise<TDepositEvent[]> {
	const query = `
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
	`;

	const result = await queryEnvioGraphQL<{Deposit: TDepositEvent[]}>(query, {depositorAddress: address.toLowerCase()});
	return result?.Deposit || [];
}

async function getWithdrawEvents(address: string): Promise<TWithdrawEvent[]> {
	const query = `
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
	`;

	const result = await queryEnvioGraphQL<{Withdraw: TWithdrawEvent[]}>(query, {depositorAddress: address.toLowerCase()});
	return result?.Withdraw || [];
}

async function getTransferEvents(address: string): Promise<TTransferEvent[]> {
	const query = `
		query GetDepositorTransfers($depositorAddress: String!, $zeroAddress: String!) {
			transfersFrom: Transfer(
				where: { sender: { _eq: $depositorAddress }, receiver: { _neq: $zeroAddress } }
				order_by: { id: asc }
			) {
				id
				sender
				receiver
				value
			}
			transfersTo: Transfer(
				where: { receiver: { _eq: $depositorAddress }, sender: { _neq: $zeroAddress } }
				order_by: { id: asc }
			) {
				id
				sender
				receiver
				value
			}
		}
	`;

	const variables = {depositorAddress: address.toLowerCase(), zeroAddress: ZERO_ADDRESS.toLowerCase()};
	const result = await queryEnvioGraphQL<{transfersFrom: TTransferEvent[], transfersTo: TTransferEvent[]}>(query, variables);
	return [...(result?.transfersFrom || []), ...(result?.transfersTo || [])];
}

function buildEventTimeline(
	deposits: TDepositEvent[],
	withdrawals: TWithdrawEvent[],
	transfers: TTransferEvent[],
	address: string
): TEvent[] {
	const events: TEvent[] = [];

	for (const deposit of deposits) {
		const {block, log} = parseEventId(deposit.id);
		events.push({type: 'deposit', blockNumber: block, logIndex: log, data: deposit});
	}

	for (const withdrawal of withdrawals) {
		const {block, log} = parseEventId(withdrawal.id);
		events.push({type: 'withdraw', blockNumber: block, logIndex: log, data: withdrawal});
	}

	for (const transfer of transfers) {
		const {block, log} = parseEventId(transfer.id);
		const eventType = transfer.sender.toLowerCase() === address.toLowerCase() ? 'transfer_out' : 'transfer_in';
		events.push({type: eventType, blockNumber: block, logIndex: log, data: transfer});
	}

	return events.sort((a, b): number => {
		if (a.blockNumber === b.blockNumber) {
			return a.logIndex - b.logIndex;
		}
		return a.blockNumber - b.blockNumber;
	});
}

async function getPricePerShareAtBlock(provider: ethers.providers.JsonRpcProvider, vault: string, block?: number): Promise<BigNumber> {
	const cacheKey = block ? `${vault}-${block}` : `${vault}-latest`;
	const cached = pricePerShareCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const data = await provider.call({to: vault, data: PRICE_PER_SHARE_SELECTOR}, block ? block : undefined);
	const value = BigNumber.from(data);
	pricePerShareCache.set(cacheKey, value);
	return value;
}

async function readAccountantFeeConfig(provider: ethers.providers.JsonRpcProvider, vault: string, block?: number): Promise<[BigNumber, BigNumber, BigNumber, BigNumber]> {
	const accountantHex = await provider.call({to: vault, data: ACCOUNTANT_SELECTOR}, block);
	const accountantAddress = `0x${accountantHex.slice(-40)}`;

	const vaultParam = vault.toLowerCase().replace('0x', '').padStart(64, '0');
	const data = await provider.call({to: accountantAddress, data: `${VAULT_CONFIG_SELECTOR}${vaultParam}`}, block);
	const hexPayload = data.startsWith('0x') ? data.slice(2) : data;
	const padded = hexPayload.padEnd(64 * 4, '0');
	const words = [0, 1, 2, 3].map((idx): BigNumber => BigNumber.from(`0x${padded.slice(idx * 64, (idx + 1) * 64)}`));
	return [words[0], words[1], words[2], words[3]];
}

async function getPerformanceFeeBps(provider: ethers.providers.JsonRpcProvider, vault: string): Promise<number> {
	try {
		const [managementFee, performanceFee, , maxFee] = await readAccountantFeeConfig(provider, vault);
		if (managementFee.gt(0) || maxFee.isZero()) {
			throw new Error('Unexpected fee config');
		}
		return performanceFee.mul(10000).div(maxFee).toNumber();
	} catch {
		// Default fallback to 10% if accountant lookup fails
		return 1000;
	}
}

function calculatePosition(events: TEvent[]): {snapshots: TSnapshot[], currentShares: BigNumber} {
	const snapshots: TSnapshot[] = [];
	let currentShares = BigNumber.from(0);

	for (const event of events) {
		if (event.type === 'deposit') {
			currentShares = currentShares.add(BigNumber.from(event.data.shares));
		} else if (event.type === 'withdraw') {
			currentShares = currentShares.sub(BigNumber.from(event.data.shares));
		} else if (event.type === 'transfer_in' || event.type === 'transfer_out') {
			const delta = BigNumber.from(event.data.value);
			currentShares = event.type === 'transfer_in' ? currentShares.add(delta) : currentShares.sub(delta);
		}

		snapshots.push({
			blockNumber: event.blockNumber,
			eventType: event.type,
			sharesBalance: currentShares
		});
	}

	return {snapshots, currentShares};
}

async function getBlockTimestamp(provider: ethers.providers.JsonRpcProvider, blockNumber: number): Promise<number> {
	const block = await provider.getBlock(blockNumber);
	return block.timestamp;
}

async function getCutoffBlock(provider: ethers.providers.JsonRpcProvider, days?: number): Promise<number | null> {
	if (!days || days <= 0) {
		return null; // No filter, return all history
	}

	const currentBlock = await provider.getBlockNumber();
	const currentTimestamp = await getBlockTimestamp(provider, currentBlock);
	const cutoffTimestamp = currentTimestamp - (days * 24 * 60 * 60);

	// Approximate blocks per day (~7200 for 12s block time)
	const estimatedBlocksPerDay = 7200;
	const estimatedCutoffBlock = currentBlock - (days * estimatedBlocksPerDay);

	return Math.max(0, estimatedCutoffBlock);
}

async function calculateIncrementalProfitAndFees(
	provider: ethers.providers.JsonRpcProvider,
	snapshots: TSnapshot[],
	performanceFeeBps: number,
	currentPps: BigNumber,
	decimals: number,
	vault: string,
	cutoffBlock: number | null = null
): Promise<BigNumber> {
	// Filter snapshots by cutoff block if specified
	const filteredSnapshots = cutoffBlock !== null
		? snapshots.filter((snapshot): boolean => snapshot.blockNumber >= cutoffBlock)
		: snapshots;

	if (filteredSnapshots.length === 0) {
		return BigNumber.from(0);
	}

	const scale = BigNumber.from(10).pow(decimals);
	let netProfit = BigNumber.from(0);
	let previousShares = BigNumber.from(0);
	let previousPps = await getPricePerShareAtBlock(provider, vault, filteredSnapshots[0].blockNumber);

	for (const snapshot of filteredSnapshots) {
		const snapshotPps = await getPricePerShareAtBlock(provider, vault, snapshot.blockNumber);
		const deltaPps = snapshotPps.sub(previousPps);
		netProfit = netProfit.add(previousShares.mul(deltaPps).div(scale));
		previousShares = snapshot.sharesBalance;
		previousPps = snapshotPps;
	}

	netProfit = netProfit.add(previousShares.mul(currentPps.sub(previousPps)).div(scale));

	const basisPoints = 10000;
	if (netProfit.lte(0) || performanceFeeBps >= basisPoints) {
		return BigNumber.from(0);
	}

	const grossProfit = netProfit.mul(basisPoints).div(basisPoints - performanceFeeBps);
	return grossProfit.sub(netProfit);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TResponse>): Promise<void> {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		res.status(405).json({error: 'Method not allowed'});
		return;
	}

	const rpcUrl = process.env.RPC_URL_MAINNET;
	const vaultAddress = process.env.V3_VAULT_ADDRESS || DEFAULT_VAULT_ADDRESS;
	const addresses = parseAddresses(req.query.addresses || req.query.address);
	const daysParam = req.query.days;
	const days = daysParam ? parseInt(Array.isArray(daysParam) ? daysParam[0] : daysParam, 10) : undefined;

	if (addresses.length === 0) {
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
		return;
	}

	const hasEnvioConfig = Boolean(process.env.ENVIO_GRAPHQL_URL);
	if (!rpcUrl || !vaultAddress || !hasEnvioConfig) {
		console.warn('[partner-fees] Missing configuration, returning empty payload');
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
		return;
	}

	try {
		const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
		const [currentPpsRaw, decimalsRaw, performanceFeeBps, cutoffBlock] = await Promise.all([
			getPricePerShareAtBlock(provider, vaultAddress),
			provider.call({to: vaultAddress, data: DECIMALS_SELECTOR}),
			getPerformanceFeeBps(provider, vaultAddress),
			getCutoffBlock(provider, days)
		]);

		const decimals = BigNumber.from(decimalsRaw).toNumber();

		const accountFees: TAccountFees[] = [];
		let totalFees = BigNumber.from(0);

		for (const address of addresses) {
			const [deposits, withdrawals, transfers] = await Promise.all([
				getDepositEvents(address),
				getWithdrawEvents(address),
				getTransferEvents(address)
			]);

			const timeline = buildEventTimeline(deposits, withdrawals, transfers, address);
			const {snapshots} = calculatePosition(timeline);
			const feesPaid = await calculateIncrementalProfitAndFees(
				provider,
				snapshots,
				performanceFeeBps,
				currentPpsRaw,
				decimals,
				vaultAddress,
				cutoffBlock
			);

			totalFees = totalFees.add(feesPaid);
			accountFees.push({
				address,
				totalFees: feesPaid.toString(),
				totalFeesNormalized: Number(ethers.utils.formatUnits(feesPaid, decimals || 6))
			});
		}

		res.status(200).json({
			vaultAddress,
			decimals,
			performanceFeeBps,
			totalFees: totalFees.toString(),
			totalFeesNormalized: Number(ethers.utils.formatUnits(totalFees, decimals || 6)),
			accounts: accountFees
		});
	} catch (error) {
		console.error('[partner-fees] Failed to fetch partner fees', error);
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
	}
}
