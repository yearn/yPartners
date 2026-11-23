import type {NextApiRequest, NextApiResponse} from 'next';
import {KONG_REST_URL} from 'lib/yearn/kongRest';

const VAULTS_ENDPOINT = `${KONG_REST_URL}/list/vaults?origin=yearn`;
const SUPPORTED_CHAINS = new Set([1, 8453, 42161, 747474]);

export default async function handler(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
	try {
		const response = await fetch(VAULTS_ENDPOINT);
		if (!response.ok) {
			res.setHeader('Cache-Control', 'no-store');
			return res.status(502).json({error: 'Failed to fetch vaults'});
		}

		const data = await response.json();
		if (!Array.isArray(data)) {
			throw new Error('Kong returned an invalid vault list');
		}
		const count = data.filter((vault): boolean => Boolean(
			vault?.address && vault.v3 === true && SUPPORTED_CHAINS.has(vault.chainId)
			&& !vault.isHidden && !vault.isRetired
		)).length;

		res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
		return res.status(200).json({vaults_count: count});
	} catch (error) {
		console.error('[vault-count] Error:', error);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(500).json({error: 'Unexpected error'});
	}
}
