import {KONG_REST_URL} from 'lib/yearn/kongRest';

const VAULTS_ENDPOINT = `${KONG_REST_URL}/list/vaults?origin=yearn`;
const SUPPORTED_CHAINS = new Set([1, 8453, 42161, 747474]);

export const config = {
	runtime: 'edge'
};

export default async function handler(): Promise<Response> {
	try {
		const response = await fetch(VAULTS_ENDPOINT);
		if (!response.ok) {
			return new Response(JSON.stringify({error: 'Failed to fetch vaults'}), {
				status: 502,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-store'
				}
			});
		}

		const data = await response.json();
		if (!Array.isArray(data)) {
			throw new Error('Kong returned an invalid vault list');
		}
		const count = data.filter((vault): boolean => Boolean(
			vault?.address && vault.v3 === true && SUPPORTED_CHAINS.has(vault.chainId)
			&& !vault.isHidden && !vault.isRetired
		)).length;

		return new Response(JSON.stringify({vaults_count: count}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				// Cache at the edge for 1 day; serve stale while revalidating.
				'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'
			}
		});
	} catch (error) {
		console.error('[vault-count] Error:', error);
		return new Response(JSON.stringify({error: 'Unexpected error'}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store'
			}
		});
	}
}
