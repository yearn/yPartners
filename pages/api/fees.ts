const FEES_ENDPOINT = 'https://api.llama.fi/summary/fees/yearn';

export const config = {
	runtime: 'edge'
};

export default async function handler(): Promise<Response> {
	try {
		const response = await fetch(FEES_ENDPOINT);
		if (!response.ok) {
			return new Response(JSON.stringify({error: 'Failed to fetch fees'}), {
				status: 502,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-store'
				}
			});
		}

		const data = await response.json();

		return new Response(JSON.stringify({total30d: data?.total30d ?? 0}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				// Cache at the edge for 1 day; serve stale while revalidating.
				'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'
			}
		});
	} catch (error) {
		console.error('[fees] Error:', error);
		return new Response(JSON.stringify({error: 'Unexpected error'}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store'
			}
		});
	}
}
