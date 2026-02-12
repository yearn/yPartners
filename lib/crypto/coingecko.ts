const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_TTL_MS = 5 * 60 * 1000;

const priceCache = new Map<string, {price: number, fetchedAt: number}>();

function getCoingeckoPlatformId(chainId: number): string | null {
	switch (chainId) {
		case 1:
			return 'ethereum';
		case 8453:
			return 'base';
		case 42161:
			return 'arbitrum-one';
		case 137:
			return 'polygon-pos';
		default:
			return null;
	}
}

export async function getTokenPriceUsd(chainId: number, contractAddress: string): Promise<number | null> {
	const platform = getCoingeckoPlatformId(chainId);
	if (!platform) {
		return null;
	}

	const address = contractAddress.toLowerCase();
	const cacheKey = `${platform}:${address}`;
	const cached = priceCache.get(cacheKey);
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
		return cached.price;
	}

	const url = `${COINGECKO_API_BASE}/simple/token_price/${platform}?contract_addresses=${address}&vs_currencies=usd`;
	const headers: HeadersInit = {};
	const apiKey = process.env.COINGECKO_API_KEY;

	if (apiKey) {
		headers['x-cg-pro-api-key'] = apiKey;
		headers['x-cg-demo-api-key'] = apiKey;
	}

	const response = await fetch(url, {headers});
	if (!response.ok) {
		return null;
	}

	const data = await response.json() as Record<string, {usd?: number}>;
	const price = data[address]?.usd;

	if (typeof price !== 'number') {
		return null;
	}

	priceCache.set(cacheKey, {price, fetchedAt: Date.now()});
	return price;
}
