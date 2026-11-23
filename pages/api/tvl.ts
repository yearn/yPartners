import type {NextApiRequest, NextApiResponse} from 'next';

const TVL_ENDPOINT = 'https://api.llama.fi/protocol/yearn';

export default async function handler(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
	try {
		const response = await fetch(TVL_ENDPOINT);
		if (!response.ok) {
			res.setHeader('Cache-Control', 'no-store');
			return res.status(502).json({error: 'Failed to fetch TVL'});
		}

		const data = await response.json();
		// DeFiLlama returns the full historical TVL series; the current total is the last point.
		const tvlSeries = Array.isArray(data?.tvl) ? data.tvl : [];
		const tvl = tvlSeries.length > 0 ? Number(tvlSeries[tvlSeries.length - 1]?.totalLiquidityUSD ?? 0) : 0;

		res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
		return res.status(200).json({tvl});
	} catch (error) {
		console.error('[tvl] Error:', error);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(500).json({error: 'Unexpected error'});
	}
}
