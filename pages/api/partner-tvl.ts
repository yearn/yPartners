import {BigNumber, ethers} from 'ethers';
import type {NextApiRequest, NextApiResponse} from 'next';
import {getTokenPriceUsd} from 'lib/crypto/coingecko';
import {getRpcUrlLatest} from 'lib/crypto/rpc';
import {getTokenSymbol} from 'lib/crypto/tokenMetadata';
import {getKongVaultMetadata} from 'lib/yearn/kong';
import {toAddress} from 'lib/yearn/utils/address';

type TAccountValue = {
	address: string,
	shares: string,
	currentValue: string,
	currentValueNormalized: number
};

type TResponseBody = {
	vaultAddress: string,
	assetAddress: string,
	assetPriceUsd: number,
	assetSymbol: string,
	decimals: number,
	pricePerShare: string,
	totalCurrentValue: string,
	totalCurrentValueNormalized: number,
	accounts: TAccountValue[]
} | {error: string};

const DEFAULT_VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';
const DEFAULT_DECIMALS = 18;
const ZERO_ADDRESS = ethers.constants.AddressZero;
const REQUEST_TIMEOUT_MS = 12_000;

const VAULT_ABI = [
	'function balanceOf(address) view returns (uint256)',
	'function pricePerShare() view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function asset() view returns (address)'
];

function	parseAddresses(addressParam: string | string[] | undefined): string[] {
	if (!addressParam) {
		return [];
	}

	const rawAddresses = Array.isArray(addressParam) ? addressParam : addressParam.split(',');
	const uniqueAddresses = new Set<string>();

	for (const addr of rawAddresses) {
		try {
			const formatted = toAddress(addr);
			if (formatted !== ethers.constants.AddressZero) {
				uniqueAddresses.add(formatted);
			}
		} catch {
			// Ignore malformed addresses
		}
	}

	return Array.from(uniqueAddresses);
}

function buildEmptyResponse(addresses: string[], vaultAddress: string): TResponseBody {
	return {
		vaultAddress,
		assetAddress: ethers.constants.AddressZero,
		assetPriceUsd: 0,
		assetSymbol: 'Unknown token',
		decimals: DEFAULT_DECIMALS,
		pricePerShare: '0',
		totalCurrentValue: '0',
		totalCurrentValueNormalized: 0,
		accounts: addresses.map((address): TAccountValue => ({
			address,
			shares: '0',
			currentValue: '0',
			currentValueNormalized: 0
		}))
	};
}

function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error(`[partner-tvl] ${label} timed out after ${timeoutMs}ms`));
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<TResponseBody>): Promise<void> {
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
	const rpcUrl = getRpcUrlLatest(chainId);

	if (addresses.length === 0) {
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
		return;
	}

	if (!rpcUrl) {
		console.warn(`[partner-tvl] No RPC URL for chain ${chainId}, returning empty payload`);
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
		return;
	}

	try {
		const provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId);
		const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, provider);

		const kongMetadataResult = await Promise.allSettled([
			withTimeout(getKongVaultMetadata(chainId, vaultAddress), 'getKongVaultMetadata')
		]);
		const kongMetadata = kongMetadataResult[0].status === 'fulfilled'
			? kongMetadataResult[0].value
			: null;
		let pricePerShare: BigNumber | null = null;
		let decimals: number | null = kongMetadata?.decimals ?? null;
		let assetAddress: string | null = kongMetadata?.assetAddress ?? null;

		if (kongMetadata?.pricePerShare) {
			try {
				pricePerShare = BigNumber.from(kongMetadata.pricePerShare);
			} catch {
				pricePerShare = null;
			}
		}

		if (!pricePerShare || decimals === null || !assetAddress) {
			const [rpcPricePerShareRaw, rpcDecimalsRaw, rpcAssetAddressRaw] = await Promise.all([
				withTimeout(vaultContract.pricePerShare(), 'vault.pricePerShare'),
				withTimeout(vaultContract.decimals(), 'vault.decimals'),
				withTimeout(vaultContract.asset(), 'vault.asset')
			]);
			const rpcPricePerShare = rpcPricePerShareRaw as BigNumber;
			const rpcDecimals = rpcDecimalsRaw as BigNumber | number;
			const rpcAssetAddress = rpcAssetAddressRaw as string;
			pricePerShare = pricePerShare ?? rpcPricePerShare;
			decimals = decimals ?? (BigNumber.isBigNumber(rpcDecimals) ? rpcDecimals.toNumber() : Number(rpcDecimals));
			assetAddress = assetAddress ?? toAddress(rpcAssetAddress);
		}

		if (!pricePerShare || decimals === null || !assetAddress) {
			throw new Error('Missing vault metadata');
		}

		let assetPriceUsd: number | undefined;
		let assetSymbol: string | undefined;
		if (assetAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
			const [priceResult, symbolResult] = await Promise.allSettled([
				withTimeout(getTokenPriceUsd(chainId, assetAddress), 'getTokenPriceUsd'),
				withTimeout(getTokenSymbol(provider, assetAddress), 'getTokenSymbol')
			]);
			assetPriceUsd = priceResult.status === 'fulfilled' ? (priceResult.value ?? undefined) : undefined;
			assetSymbol = symbolResult.status === 'fulfilled' ? (symbolResult.value ?? undefined) : undefined;
		} else {
			assetSymbol = 'Unknown token';
		}
		if (assetPriceUsd === undefined) {
			res.status(200).json({
				error: `Unable to resolve USD price for asset ${assetAddress} on chain ${chainId}`
			});
			return;
		}
		const priceUsd = assetPriceUsd;
		const divisor = BigNumber.from(10).pow(decimals);
		const accounts: TAccountValue[] = [];

		for (const address of addresses) {
			const shares: BigNumber = await withTimeout(
				vaultContract.balanceOf(address),
				'vault.balanceOf'
			);
			const currentValue = shares.mul(pricePerShare).div(divisor);

			accounts.push({
				address,
				shares: shares.toString(),
				currentValue: currentValue.toString(),
				currentValueNormalized: Number(ethers.utils.formatUnits(currentValue, decimals)) * priceUsd
			});
		}

		const totalCurrentValue = accounts.reduce((acc, {currentValue}): BigNumber => {
			return acc.add(BigNumber.from(currentValue));
		}, BigNumber.from(0));

		res.status(200).json({
			vaultAddress,
			assetAddress: toAddress(assetAddress),
			assetPriceUsd,
			assetSymbol: assetSymbol ?? 'Unknown token',
			decimals: Number(decimals),
			pricePerShare: pricePerShare.toString(),
			totalCurrentValue: totalCurrentValue.toString(),
			totalCurrentValueNormalized: Number(ethers.utils.formatUnits(totalCurrentValue, decimals)) * priceUsd,
			accounts
		});
	} catch (error) {
		console.error('[partner-tvl] Failed to fetch balances', error);
		res.status(200).json(buildEmptyResponse(addresses, vaultAddress));
	}
}
