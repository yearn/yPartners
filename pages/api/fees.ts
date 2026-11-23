import type {NextApiRequest, NextApiResponse} from 'next';

const FEES_ENDPOINT = 'https://api.llama.fi/summary/fees/yearn';

export default async function handler(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
	try {
		const response = await fetch(FEES_ENDPOINT);
		if (!response.ok) {
			res.setHeader('Cache-Control', 'no-store');
			return res.status(502).json({error: 'Failed to fetch fees'});
		}

		const data = await response.json();

		res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
		return res.status(200).json({total30d: data?.total30d ?? 0});
	} catch (error) {
		console.error('[fees] Error:', error);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(500).json({error: 'Unexpected error'});
	}
}
