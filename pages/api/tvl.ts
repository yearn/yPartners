const TVL_ENDPOINT = 'https://api.llama.fi/protocol/yearn-finance';

export const config = {
	runtime: 'edge'
};

export default async function handler(): Promise<Response> {
	try {
		const response = await fetch(TVL_ENDPOINT);
		if (!response.ok) {
			return new Response(JSON.stringify({error: 'Failed to fetch TVL'}), {
				status: 502,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-store'
				}
			});
		}

		const data = await response.json();
		// DeFiLlama returns the full historical TVL series; the current total is the last point.
		const tvlSeries = Array.isArray(data?.tvl) ? data.tvl : [];
		const tvl = tvlSeries.length > 0 ? Number(tvlSeries[tvlSeries.length - 1]?.totalLiquidityUSD ?? 0) : 0;

		return new Response(JSON.stringify({tvl}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				// Cache at the edge for 1 day; serve stale while revalidating.
				'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'
			}
		});
	} catch (error) {
		console.error('[tvl] Error:', error);
		return new Response(JSON.stringify({error: 'Unexpected error'}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store'
			}
		});
	}
}
