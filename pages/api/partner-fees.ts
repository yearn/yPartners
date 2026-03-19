import {BigNumber, ethers} from 'ethers';
import type {NextApiRequest, NextApiResponse} from 'next';
import {getTokenPriceUsdWithDebug} from 'lib/crypto/defillama';
import {getRpcUrlArchive, getRpcUrlLatest} from 'lib/crypto/rpc';
import {getTokenSymbol} from 'lib/crypto/tokenMetadata';
import {getKongVaultMetadata} from 'lib/yearn/kong';
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
	totalFeesNormalized: number,
	currentShares: string,
	currentSharesNormalized: number,
	netProfit: string,
	netProfitNormalized: number,
	grossProfit: string,
	grossProfitNormalized: number,
	weightedAvgEntryPps: string,
	weightedAvgEntryPpsNormalized: number
};

type TChartSnapshot = {
	block: number,
	shares: number,
	profit: number
};

type TResponse =
	| {
			vaultAddress: string,
			assetAddress: string,
			assetPriceUsd: number,
			assetSymbol: string,
			decimals: number,
			performanceFeeBps: number,
			totalFees: string,
			totalFeesNormalized: number,
			netProfit: string,
			netProfitNormalized: number,
			grossProfit: string,
			grossProfitNormalized: number,
			accounts: TAccountFees[],
			snapshots: TChartSnapshot[]
		}
	| {error: string};

const DEFAULT_VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';
const ZERO_ADDRESS = ethers.constants.AddressZero;
const PRICE_PER_SHARE_SELECTOR = '0x99530b06';
const DECIMALS_SELECTOR = '0x313ce567';
const ASSET_SELECTOR = '0x38d52e0f';
const ACCOUNTANT_SELECTOR = '0x4fb3ccc5';
const VAULT_CONFIG_SELECTOR = '0xde1eb9a3';
const DEFAULT_DECIMALS = 18;
const DEFAULT_PERFORMANCE_FEE_BPS = 0;
const REQUEST_TIMEOUT_MS = 12_000;

const pricePerShareCache: Map<string, BigNumber> = new Map();

function getProviderCacheKey(provider: ethers.providers.JsonRpcProvider): string {
	const providerUrl = (provider.connection as {url?: string} | undefined)?.url;
	return providerUrl ?? 'unknown-provider';
}

function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error(`[partner-fees] ${label} timed out after ${timeoutMs}ms`));
		}, timeoutMs);
		promise.then((value) => {
			clearTimeout(timeoutId);
			resolve(value);
		}).catch((error) => {
			clearTimeout(timeoutId);
			reject(error);
		});
	});
}

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
		assetAddress: ZERO_ADDRESS,
		assetPriceUsd: 0,
		assetSymbol: 'Unknown token',
		decimals: DEFAULT_DECIMALS,
		performanceFeeBps: DEFAULT_PERFORMANCE_FEE_BPS,
		totalFees: '0',
		totalFeesNormalized: 0,
		netProfit: '0',
		netProfitNormalized: 0,
		grossProfit: '0',
		grossProfitNormalized: 0,
		accounts: addresses.map((address): TAccountFees => ({
			address,
			totalFees: '0',
			totalFeesNormalized: 0,
			currentShares: '0',
			currentSharesNormalized: 0,
			netProfit: '0',
			netProfitNormalized: 0,
			grossProfit: '0',
			grossProfitNormalized: 0,
			weightedAvgEntryPps: '0',
			weightedAvgEntryPpsNormalized: 0
		})),
		snapshots: []
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

function parseEventId(eventId: string): {block: number, log: number} | null {
	const parts = eventId.split('_');
	if (parts.length < 3) {
		return null;
	}
	const block = parseInt(parts[1], 10);
	const log = parseInt(parts[2], 10);
	if (!Number.isFinite(block) || !Number.isFinite(log) || block < 0 || log < 0) {
		return null;
	}
	return {block, log};
}

async function getDepositEvents(address: string, vaultAddress: string): Promise<TDepositEvent[]> {
	const query = `
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
	`;

	const result = await queryEnvioGraphQL<{Deposit: TDepositEvent[]}>(query, {
		depositorAddress: address.toLowerCase(),
		vaultAddress: vaultAddress.toLowerCase()
	});
	return result?.Deposit || [];
}

async function getWithdrawEvents(address: string, vaultAddress: string): Promise<TWithdrawEvent[]> {
	const query = `
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
	`;

	const result = await queryEnvioGraphQL<{Withdraw: TWithdrawEvent[]}>(query, {
		depositorAddress: address.toLowerCase(),
		vaultAddress: vaultAddress.toLowerCase()
	});
	return result?.Withdraw || [];
}

async function getTransferEvents(address: string, vaultAddress: string): Promise<TTransferEvent[]> {
	const query = `
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
	`;

	const variables = {
		depositorAddress: address.toLowerCase(),
		zeroAddress: ZERO_ADDRESS.toLowerCase(),
		vaultAddress: vaultAddress.toLowerCase()
	};
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
	const seenDeposits = new Set<string>();
	const seenWithdrawals = new Set<string>();
	const seenTransfers = new Set<string>();

	for (const deposit of deposits) {
		if (seenDeposits.has(deposit.id)) {
			continue;
		}
		seenDeposits.add(deposit.id);
		const parsed = parseEventId(deposit.id);
		if (!parsed) {
			continue;
		}
		const {block, log} = parsed;
		events.push({type: 'deposit', blockNumber: block, logIndex: log, data: deposit});
	}

	for (const withdrawal of withdrawals) {
		if (seenWithdrawals.has(withdrawal.id)) {
			continue;
		}
		seenWithdrawals.add(withdrawal.id);
		const parsed = parseEventId(withdrawal.id);
		if (!parsed) {
			continue;
		}
		const {block, log} = parsed;
		events.push({type: 'withdraw', blockNumber: block, logIndex: log, data: withdrawal});
	}

	for (const transfer of transfers) {
		if (seenTransfers.has(transfer.id)) {
			continue;
		}
		seenTransfers.add(transfer.id);
		const parsed = parseEventId(transfer.id);
		if (!parsed) {
			continue;
		}
		const {block, log} = parsed;
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
	const providerKey = getProviderCacheKey(provider);
	const normalizedVault = vault.toLowerCase();
	const cacheKey = block ? `${providerKey}-${normalizedVault}-${block}` : `${providerKey}-${normalizedVault}-latest`;
	const cached = pricePerShareCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const data = await provider.call({to: vault, data: PRICE_PER_SHARE_SELECTOR}, block ? block : undefined);
	const value = BigNumber.from(data);
	pricePerShareCache.set(cacheKey, value);
	return value;
}

async function getVaultAssetAddress(provider: ethers.providers.JsonRpcProvider, vault: string): Promise<string> {
	const data = await provider.call({to: vault, data: ASSET_SELECTOR});
	return toAddress(`0x${data.slice(-40)}`);
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

async function calculateWeightedAverageEntryPps(
	provider: ethers.providers.JsonRpcProvider,
	events: TEvent[],
	decimals: number,
	vault: string
): Promise<BigNumber> {
	const scale = BigNumber.from(10).pow(decimals);
	let totalAssets = BigNumber.from(0);
	let totalShares = BigNumber.from(0);

	for (const event of events) {
		if (event.type === 'deposit') {
			const shares = BigNumber.from(event.data.shares);
			const assets = BigNumber.from(event.data.assets);
			totalShares = totalShares.add(shares);
			totalAssets = totalAssets.add(assets);
		} else if (event.type === 'withdraw') {
			const shares = BigNumber.from(event.data.shares);
			if (totalShares.gt(0)) {
				const removeShares = shares.gt(totalShares) ? totalShares : shares;
				const removedAssets = totalAssets.mul(removeShares).div(totalShares);
				totalShares = totalShares.sub(removeShares);
				totalAssets = totalAssets.sub(removedAssets);
			}
		} else if (event.type === 'transfer_in') {
			const shares = BigNumber.from(event.data.value);
			const pps = await getPricePerShareAtBlock(provider, vault, event.blockNumber);
			const assets = shares.mul(pps).div(scale);
			totalShares = totalShares.add(shares);
			totalAssets = totalAssets.add(assets);
		} else if (event.type === 'transfer_out') {
			const shares = BigNumber.from(event.data.value);
			if (totalShares.gt(0)) {
				const removeShares = shares.gt(totalShares) ? totalShares : shares;
				const removedAssets = totalAssets.mul(removeShares).div(totalShares);
				totalShares = totalShares.sub(removeShares);
				totalAssets = totalAssets.sub(removedAssets);
			}
		}
	}

	if (totalShares.isZero()) {
		return BigNumber.from(0);
	}

	return totalAssets.mul(scale).div(totalShares);
}

async function getCutoffBlock(provider: ethers.providers.JsonRpcProvider, days?: number): Promise<number | null> {
	if (!days || days <= 0) {
		return null; // No filter, return all history
	}

	const currentBlock = await provider.getBlockNumber();

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
): Promise<{netProfit: BigNumber, grossProfit: BigNumber, totalFees: BigNumber}> {
	if (snapshots.length === 0) {
		return {
			netProfit: BigNumber.from(0),
			grossProfit: BigNumber.from(0),
			totalFees: BigNumber.from(0)
		};
	}

	const orderedSnapshots = [...snapshots].sort((a, b): number => a.blockNumber - b.blockNumber);

	const scale = BigNumber.from(10).pow(decimals);
	let netProfit = BigNumber.from(0);
	let previousShares = BigNumber.from(0);
	let previousPps: BigNumber;
	let snapshotsInWindow = orderedSnapshots;

	if (cutoffBlock !== null) {
		const lastSnapshotBeforeCutoff = [...orderedSnapshots].reverse().find(
			(snapshot): boolean => snapshot.blockNumber < cutoffBlock
		);
		previousShares = lastSnapshotBeforeCutoff ? lastSnapshotBeforeCutoff.sharesBalance : BigNumber.from(0);
		previousPps = await getPricePerShareAtBlock(provider, vault, cutoffBlock);
		snapshotsInWindow = orderedSnapshots.filter((snapshot): boolean => snapshot.blockNumber >= cutoffBlock);
	} else {
		previousPps = await getPricePerShareAtBlock(provider, vault, orderedSnapshots[0].blockNumber);
	}

	for (const snapshot of snapshotsInWindow) {
		const snapshotPps = await getPricePerShareAtBlock(provider, vault, snapshot.blockNumber);
		const deltaPps = snapshotPps.sub(previousPps);
		netProfit = netProfit.add(previousShares.mul(deltaPps).div(scale));
		previousShares = snapshot.sharesBalance;
		previousPps = snapshotPps;
	}

	netProfit = netProfit.add(previousShares.mul(currentPps.sub(previousPps)).div(scale));

	const basisPoints = 10000;
	if (netProfit.lte(0) || performanceFeeBps >= basisPoints) {
		return {
			netProfit,
			grossProfit: netProfit,
			totalFees: BigNumber.from(0)
		};
	}

	const grossProfit = netProfit.mul(basisPoints).div(basisPoints - performanceFeeBps);
	return {
		netProfit,
		grossProfit,
		totalFees: grossProfit.sub(netProfit)
	};
}

function aggregateSnapshots(snapshots: TSnapshot[]): TSnapshot[] {
	if (snapshots.length === 0) {
		return [];
	}

	// Group snapshots by block number and sum shares
	const blockMap = new Map<number, BigNumber>();

	for (const snapshot of snapshots) {
		const currentShares = blockMap.get(snapshot.blockNumber) || BigNumber.from(0);
		blockMap.set(snapshot.blockNumber, currentShares.add(snapshot.sharesBalance));
	}

	// Convert back to snapshot array and sort by block
	const aggregated: TSnapshot[] = [];
	for (const [blockNumber, sharesBalance] of blockMap.entries()) {
		aggregated.push({
			blockNumber,
			eventType: 'deposit', // Type doesn't matter for chart
			sharesBalance
		});
	}

	return aggregated.sort((a, b) => a.blockNumber - b.blockNumber);
}

async function prepareChartSnapshots(
	provider: ethers.providers.JsonRpcProvider,
	snapshots: TSnapshot[],
	decimals: number,
	currentPps: BigNumber,
	currentShares: BigNumber,
	vault: string,
	priceUsd: number,
	latestProvider?: ethers.providers.JsonRpcProvider
): Promise<TChartSnapshot[]> {
	if (snapshots.length === 0) {
		return [];
	}

	// OPTIMIZATION: Batch all RPC calls in parallel instead of sequential
	// Collect all unique block numbers
	const blockNumbers = snapshots.map((s) => s.blockNumber);

	// Fetch all price-per-share values in parallel
	const ppsPromises = blockNumbers.map((block) => getPricePerShareAtBlock(provider, vault, block));
	const ppsValues = await Promise.all(ppsPromises);

	// Create a map for quick lookup
	const ppsMap = new Map<number, BigNumber>();
	blockNumbers.forEach((block, idx) => {
		ppsMap.set(block, ppsValues[idx]);
	});

	// Now calculate profit using the pre-fetched values
	const scale = BigNumber.from(10).pow(decimals);
	const chartData: TChartSnapshot[] = [];
	let profit = BigNumber.from(0);
	let previousShares = BigNumber.from(0);
	let previousPps = ppsMap.get(snapshots[0].blockNumber)!;

	for (const snapshot of snapshots) {
		const snapshotPps = ppsMap.get(snapshot.blockNumber)!;
		const deltaPps = snapshotPps.sub(previousPps);
		profit = profit.add(previousShares.mul(deltaPps).div(scale));
		previousShares = snapshot.sharesBalance;
		previousPps = snapshotPps;

		chartData.push({
			block: snapshot.blockNumber,
			shares: Number(ethers.utils.formatUnits(snapshot.sharesBalance, decimals)),
			profit: Number(ethers.utils.formatUnits(profit, decimals)) * priceUsd
		});
	}

	// Add final data point with current state
	profit = profit.add(previousShares.mul(currentPps.sub(previousPps)).div(scale));

	try {
		const currentBlock = await (latestProvider ?? provider).getBlockNumber();
		chartData.push({
			block: currentBlock,
			shares: Number(ethers.utils.formatUnits(currentShares, decimals)),
			profit: Number(ethers.utils.formatUnits(profit, decimals)) * priceUsd
		});
	} catch {
		// If we can't get current block, use last snapshot block + offset
		const lastBlock = snapshots[snapshots.length - 1].blockNumber + 1000;
		chartData.push({
			block: lastBlock,
			shares: Number(ethers.utils.formatUnits(currentShares, decimals)),
			profit: Number(ethers.utils.formatUnits(profit, decimals)) * priceUsd
		});
	}

	return chartData;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TResponse>): Promise<void> {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		res.status(405).json({error: 'Method not allowed'});
		return;
	}

	res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

	const vaultAddressParam = req.query.vaultAddress;
	const vaultAddress = vaultAddressParam
		? toAddress(Array.isArray(vaultAddressParam) ? vaultAddressParam[0] : vaultAddressParam)
		: toAddress(DEFAULT_VAULT_ADDRESS);
	const addresses = parseAddresses(req.query.addresses || req.query.address);
	const chainIdParam = req.query.chainId;
	const parsedChainId = chainIdParam ? parseInt(Array.isArray(chainIdParam) ? chainIdParam[0] : chainIdParam, 10) : NaN;
	const chainId = Number.isFinite(parsedChainId) ? parsedChainId : 1;
	const latestRpcUrl = getRpcUrlLatest(chainId);
	const {url: archiveRpcUrl, isPublicFallback} = getRpcUrlArchive(chainId);
	const daysParam = req.query.days;
	const days = daysParam ? parseInt(Array.isArray(daysParam) ? daysParam[0] : daysParam, 10) : undefined;
	const includeSnapshotsParam = req.query.includeSnapshots;
	const includeSnapshots = includeSnapshotsParam === 'true' || includeSnapshotsParam === '1';

	if (addresses.length === 0) {
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
		return;
	}

	const hasEnvioConfig = Boolean(process.env.ENVIO_GRAPHQL_URL);
	if (!vaultAddress || !hasEnvioConfig) {
		console.warn(`[partner-fees] Missing configuration for chain ${chainId}, returning empty payload`);
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
		return;
	}

	if (!latestRpcUrl || !archiveRpcUrl) {
		const missingLatest = !latestRpcUrl ? 'latest RPC' : null;
		const missingArchive = !archiveRpcUrl ? 'archive RPC' : null;
		const missingParts = [missingLatest, missingArchive].filter(Boolean).join(' and ');
		console.warn(`[partner-fees] Missing ${missingParts} for chain ${chainId}, returning empty payload`);
		res.status(200).json({
			error: `Missing ${missingParts} for chain ${chainId}. Configure RPC_URL_*_PUBLIC and RPC_URL_*_PRIVATE (or legacy RPC_URL_*) env vars.`
		});
		return;
	}

	try {
		if (isPublicFallback) {
			console.warn(`[partner-fees] Archive RPC missing for chain ${chainId}; falling back to public RPC`);
		}

		const latestProvider = new ethers.providers.JsonRpcProvider(latestRpcUrl, chainId);
		const archiveProvider = new ethers.providers.JsonRpcProvider(archiveRpcUrl, chainId);
		const [performanceFeeBpsResult, cutoffBlockResult, kongMetadataResult] = await Promise.allSettled([
			withTimeout(getPerformanceFeeBps(latestProvider, vaultAddress), 'getPerformanceFeeBps'),
			withTimeout(getCutoffBlock(latestProvider, days), 'getCutoffBlock'),
			withTimeout(getKongVaultMetadata(chainId, vaultAddress), 'getKongVaultMetadata')
		]);
		const performanceFeeBps = performanceFeeBpsResult.status === 'fulfilled'
			? performanceFeeBpsResult.value
			: DEFAULT_PERFORMANCE_FEE_BPS;
		const cutoffBlock = cutoffBlockResult.status === 'fulfilled'
			? cutoffBlockResult.value
			: null;
		const kongMetadata = kongMetadataResult.status === 'fulfilled'
			? kongMetadataResult.value
			: null;

		let currentPpsRaw: BigNumber | null = null;
		let decimals: number | null = kongMetadata?.decimals ?? null;
		let assetAddress: string | null = kongMetadata?.assetAddress ?? null;

		if (kongMetadata?.pricePerShare) {
			try {
				currentPpsRaw = BigNumber.from(kongMetadata.pricePerShare);
			} catch {
				currentPpsRaw = null;
			}
		}

		if (!currentPpsRaw) {
			currentPpsRaw = await withTimeout(
				getPricePerShareAtBlock(latestProvider, vaultAddress),
				'getPricePerShareAtBlock'
			);
		}

		if (decimals === null) {
			const decimalsRaw = await withTimeout(
				latestProvider.call({to: vaultAddress, data: DECIMALS_SELECTOR}),
				'vault.decimals'
			);
			decimals = BigNumber.from(decimalsRaw).toNumber();
		}

		if (!assetAddress) {
			assetAddress = await withTimeout(
				getVaultAssetAddress(latestProvider, vaultAddress),
				'vault.asset'
			);
		}

		if (!currentPpsRaw || decimals === null || !assetAddress) {
			throw new Error('Missing vault metadata');
		}

			let assetPriceUsd: number | undefined;
			let assetSymbol: string | undefined;
			let pricingDebugDetails = '';
			if (assetAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
				const [priceResult, symbolResult] = await Promise.allSettled([
					withTimeout(getTokenPriceUsdWithDebug(chainId, assetAddress), 'getTokenPriceUsd'),
					withTimeout(getTokenSymbol(latestProvider, assetAddress), 'getTokenSymbol')
				]);
				if (priceResult.status === 'fulfilled') {
					const lookup = priceResult.value;
					assetPriceUsd = typeof lookup.price === 'number' ? lookup.price : undefined;
					if (assetPriceUsd === undefined) {
						const message = lookup.message ? lookup.message.replace(/"/g, '\'') : undefined;
						const details = [
							lookup.reason ? `reason=${lookup.reason}` : undefined,
							typeof lookup.status === 'number' ? `status=${lookup.status}` : undefined,
							message ? `message="${message}"` : undefined
						].filter(Boolean);
						pricingDebugDetails = details.join(' ');
					}
				} else {
					const errorMessage = priceResult.reason instanceof Error ? priceResult.reason.message : String(priceResult.reason);
					pricingDebugDetails = `reason=request_failed message="${errorMessage.replace(/"/g, '\'')}"`;
				}
				assetSymbol = symbolResult.status === 'fulfilled' ? (symbolResult.value ?? undefined) : undefined;
			} else {
				assetSymbol = 'Unknown token';
			}
			if (assetPriceUsd === undefined) {
				const errorMessage = `Unable to resolve USD price for asset ${assetAddress} on chain ${chainId}${pricingDebugDetails ? ` (${pricingDebugDetails})` : ''}`;
				console.warn(`[partner-fees] ${errorMessage}`);
				res.status(200).json({
					error: errorMessage
				});
				return;
			}
		const priceUsd = assetPriceUsd;

		const accountFees: TAccountFees[] = [];
		let totalFees = BigNumber.from(0);
		let totalNetProfit = BigNumber.from(0);
		let totalGrossProfit = BigNumber.from(0);
		let allSnapshots: TSnapshot[] = [];
		let totalCurrentShares = BigNumber.from(0);

		for (const address of addresses) {
			const [deposits, withdrawals, transfers] = await Promise.all([
				getDepositEvents(address, vaultAddress),
				getWithdrawEvents(address, vaultAddress),
				getTransferEvents(address, vaultAddress)
			]);

			const timeline = buildEventTimeline(deposits, withdrawals, transfers, address);
			const {snapshots, currentShares} = calculatePosition(timeline);
			const weightedAvgEntryPps = await calculateWeightedAverageEntryPps(
				archiveProvider,
				timeline,
				decimals,
				vaultAddress
			);
			const profitAndFees = await calculateIncrementalProfitAndFees(
				archiveProvider,
				snapshots,
				performanceFeeBps,
				currentPpsRaw,
				decimals,
				vaultAddress,
				cutoffBlock
			);

			totalFees = totalFees.add(profitAndFees.totalFees);
			totalNetProfit = totalNetProfit.add(profitAndFees.netProfit);
			totalGrossProfit = totalGrossProfit.add(profitAndFees.grossProfit);
			totalCurrentShares = totalCurrentShares.add(currentShares);
			allSnapshots = allSnapshots.concat(snapshots);
			accountFees.push({
				address,
				totalFees: profitAndFees.totalFees.toString(),
				totalFeesNormalized: Number(ethers.utils.formatUnits(profitAndFees.totalFees, decimals || 6)) * priceUsd,
				currentShares: currentShares.toString(),
				currentSharesNormalized: Number(ethers.utils.formatUnits(currentShares, decimals)),
				netProfit: profitAndFees.netProfit.toString(),
				netProfitNormalized: Number(ethers.utils.formatUnits(profitAndFees.netProfit, decimals || 6)) * priceUsd,
				grossProfit: profitAndFees.grossProfit.toString(),
				grossProfitNormalized: Number(ethers.utils.formatUnits(profitAndFees.grossProfit, decimals || 6)) * priceUsd,
				weightedAvgEntryPps: weightedAvgEntryPps.toString(),
				weightedAvgEntryPpsNormalized: Number(ethers.utils.formatUnits(weightedAvgEntryPps, decimals || 6))
			});
		}

		// Conditionally generate chart snapshots (expensive operation)
		let chartSnapshots: TChartSnapshot[] = [];
		if (includeSnapshots) {
			const aggregatedSnapshots = aggregateSnapshots(allSnapshots);
			chartSnapshots = await prepareChartSnapshots(
				archiveProvider,
				aggregatedSnapshots,
				decimals,
				currentPpsRaw,
				totalCurrentShares,
				vaultAddress,
				priceUsd,
				latestProvider
			);
		}

			res.status(200).json({
				vaultAddress,
				assetAddress,
				assetPriceUsd,
				assetSymbol: assetSymbol ?? 'Unknown token',
			decimals,
			performanceFeeBps,
			totalFees: totalFees.toString(),
			totalFeesNormalized: Number(ethers.utils.formatUnits(totalFees, decimals || 6)) * priceUsd,
			netProfit: totalNetProfit.toString(),
			netProfitNormalized: Number(ethers.utils.formatUnits(totalNetProfit, decimals || 6)) * priceUsd,
			grossProfit: totalGrossProfit.toString(),
			grossProfitNormalized: Number(ethers.utils.formatUnits(totalGrossProfit, decimals || 6)) * priceUsd,
			accounts: accountFees,
			snapshots: chartSnapshots
		});
	} catch (error) {
		console.error('[partner-fees] Failed to fetch partner fees', error);
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
	}
}
