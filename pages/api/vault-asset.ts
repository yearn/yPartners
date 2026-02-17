import type {NextApiRequest, NextApiResponse} from 'next';
import {getKongVaultMetadata} from 'lib/yearn/kong';
import {toAddress} from 'lib/yearn/utils/address';

type TResponse =
	| {
		chainId: number,
		vaultAddress: string,
		assetAddress: string | null
	}
	| {error: string};

const DEFAULT_CHAIN_ID = 1;
const DEFAULT_VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';

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
		const metadata = await getKongVaultMetadata(chainId, vaultAddress);
		res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
		res.status(200).json({
			chainId,
			vaultAddress,
			assetAddress: metadata?.assetAddress ?? null
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch vault metadata';
		res.status(200).json({error: message});
	}
}
