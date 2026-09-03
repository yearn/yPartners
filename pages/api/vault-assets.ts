import {ethers} from 'ethers';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TKongVaultMetadata} from 'lib/yearn/kong';
import type {TAddress} from 'lib/yearn/utils/address';

import {getRpcUrlLatest} from 'lib/crypto/rpc';
import {getTokenSymbol} from 'lib/crypto/tokenMetadata';
import {getKongVaultMetadataForVaults} from 'lib/yearn/kong';
import {toAddress, ZERO_ADDRESS} from 'lib/yearn/utils/address';

type TVaultSpec = {
	chainId: number;
	vaultAddress: TAddress;
};

type TVaultAsset = {
	chainId: number;
	vaultAddress: string;
	assetAddress: string | null;
	assetSymbol: string | null;
};

type TResponse =
	| {vaults: TVaultAsset[]}
	| {error: string};

const MAX_VAULTS = 100;
const VAULT_ABI = ['function asset() view returns (address)', 'function token() view returns (address)'];

function parseVaults(value: string | string[] | undefined): TVaultSpec[] | null {
	const rawVaults = (Array.isArray(value) ? value.join(',') : value || '')
		.split(',')
		.filter(Boolean);
	if (rawVaults.length === 0 || rawVaults.length > MAX_VAULTS) {
		return null;
	}

	const vaultsByKey = new Map<string, TVaultSpec>();
	for (const rawVault of rawVaults) {
		const [rawChainId, rawAddress, ...unexpectedParts] = rawVault.split(':');
		const chainId = Number(rawChainId);
		const vaultAddress = toAddress(rawAddress);
		if (
			unexpectedParts.length > 0 ||
			!Number.isSafeInteger(chainId) ||
			chainId <= 0 ||
			vaultAddress === ZERO_ADDRESS
		) {
			return null;
		}
		vaultsByKey.set(`${chainId}:${vaultAddress.toLowerCase()}`, {chainId, vaultAddress});
	}

	return Array.from(vaultsByKey.values());
}

async function resolveVaultAssets(chainId: number, vaults: TAddress[]): Promise<TVaultAsset[]> {
	let metadataByVault = new Map<string, TKongVaultMetadata>();
	try {
		metadataByVault = await getKongVaultMetadataForVaults(chainId, vaults);
	} catch (error) {
		console.warn(`[vault-assets] Kong metadata lookup failed for chain ${chainId}:`, error);
	}

	const rpcUrl = getRpcUrlLatest(chainId);
	const provider = rpcUrl ? new ethers.providers.JsonRpcProvider(rpcUrl, chainId) : null;
	const assets = await Promise.all(vaults.map(async (vaultAddress): Promise<TVaultAsset> => {
		let assetAddress = metadataByVault.get(vaultAddress.toLowerCase())?.assetAddress ?? null;
		if (!assetAddress && provider) {
			const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
			try {
				assetAddress = toAddress(await vault.asset() as string);
			} catch {
				// Yearn v2 vaults revert on asset(); token() returns the underlying token.
				try {
					assetAddress = toAddress(await vault.token() as string);
				} catch (tokenError) {
					console.warn(`[vault-assets] Failed to fetch asset for vault ${vaultAddress} on chain ${chainId}:`, tokenError);
				}
			}
		}

		return {
			chainId,
			vaultAddress,
			assetAddress,
			assetSymbol: null
		};
	}));

	const symbolPromises = new Map<string, Promise<string | null>>();
	return Promise.all(assets.map(async (asset): Promise<TVaultAsset> => {
		if (!asset.assetAddress || !provider) {
			return asset;
		}

		const assetKey = asset.assetAddress.toLowerCase();
		let symbolPromise = symbolPromises.get(assetKey);
		if (!symbolPromise) {
			symbolPromise = getTokenSymbol(provider, asset.assetAddress);
			symbolPromises.set(assetKey, symbolPromise);
		}
		return {...asset, assetSymbol: await symbolPromise};
	}));
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<TResponse>): Promise<void> {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		res.status(405).json({error: 'Method not allowed'});
		return;
	}

	const vaultSpecs = parseVaults(req.query.vaults);
	if (!vaultSpecs) {
		res.status(400).json({error: 'vaults must be 1-100 comma-separated chainId:address pairs'});
		return;
	}

	const vaultsByChain = new Map<number, TAddress[]>();
	for (const {chainId, vaultAddress} of vaultSpecs) {
		const vaults = vaultsByChain.get(chainId) ?? [];
		vaults.push(vaultAddress);
		vaultsByChain.set(chainId, vaults);
	}

	const resolvedAssets = await Promise.all(
		Array.from(vaultsByChain, ([chainId, vaults]) => resolveVaultAssets(chainId, vaults))
	);
	const assetsByKey = new Map(
		resolvedAssets.flat().map((asset) => [`${asset.chainId}:${asset.vaultAddress.toLowerCase()}`, asset])
	);

	res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
	res.status(200).json({
		vaults: vaultSpecs.map(({chainId, vaultAddress}) =>
			assetsByKey.get(`${chainId}:${vaultAddress.toLowerCase()}`) ?? {
				chainId,
				vaultAddress,
				assetAddress: null,
				assetSymbol: null
			}
		)
	});
}
