import type {NextApiRequest, NextApiResponse} from 'next';
import {ethers} from 'ethers';
import {getKongVaultMetadata} from 'lib/yearn/kong';
import {getRpcUrlLatest} from 'lib/crypto/rpc';
import {getTokenSymbol} from 'lib/crypto/tokenMetadata';
import {toAddress} from 'lib/yearn/utils/address';

type TResponse =
	| {
		chainId: number,
		vaultAddress: string,
		assetAddress: string | null,
		assetSymbol: string | null
	}
	| {error: string};

const DEFAULT_CHAIN_ID = 1;
const DEFAULT_VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';

const VAULT_ABI = [
	'function asset() view returns (address)'
];

function parseChainId(value: string | string[] | undefined): number {
	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = raw ? parseInt(raw, 10) : NaN;
	return Number.isFinite(parsed) ? parsed : DEFAULT_CHAIN_ID;
}

function parseVaultAddress(value: string | string[] | undefined): string {
	const raw = Array.isArray(value) ? value[0] : value;
	return toAddress(raw || DEFAULT_VAULT_ADDRESS);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TResponse>): Promise<void> {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		res.status(405).json({error: 'Method not allowed'});
		return;
	}

	const chainId = parseChainId(req.query.chainId);
	let vaultAddress: string;
	try {
		vaultAddress = parseVaultAddress(req.query.vaultAddress);
	} catch {
		res.status(400).json({error: 'Invalid vaultAddress'});
		return;
	}

	try {
		const rpcUrl = getRpcUrlLatest(chainId);
		const provider = rpcUrl ? new ethers.providers.JsonRpcProvider(rpcUrl, chainId) : null;

		// Try to get asset address from Kong first
		const metadata = await getKongVaultMetadata(chainId, vaultAddress);
		let assetAddress: string | null = metadata?.assetAddress ?? null;

		// If Kong doesn't have the asset address, fetch it directly from the vault contract
		if (!assetAddress && provider) {
			try {
				const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
				const rpcAssetAddress = await vaultContract.asset() as string;
				assetAddress = toAddress(rpcAssetAddress);
			} catch (rpcError) {
				console.warn(`[vault-asset] Failed to fetch asset from RPC for vault ${vaultAddress} on chain ${chainId}:`, rpcError);
			}
		}

		// Resolve the asset symbol so the partner dashboard can label every vault
		// consistently — not only the currently-selected one (which otherwise is the
		// only combo whose fees/tvl response carries assetSymbol).
		let assetSymbol: string | null = null;
		if (assetAddress && provider) {
			assetSymbol = await getTokenSymbol(provider, assetAddress);
		}

		res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
		res.status(200).json({
			chainId,
			vaultAddress,
			assetAddress,
			assetSymbol
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch vault metadata';
		res.status(200).json({error: message});
	}
}
