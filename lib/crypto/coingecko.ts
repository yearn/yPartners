const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_TTL_MS = 5 * 60 * 1000;

const priceCache = new Map<string, {price: number, fetchedAt: number}>();
const inFlightPriceLookups = new Map<string, Promise<TTokenPriceUsdLookup>>();

type TTokenPriceLookupReason =
	| 'unsupported_chain'
	| 'rate_limited'
	| 'http_error'
	| 'missing_usd'
	| 'invalid_json'
	| 'network_error';

export type TTokenPriceUsdLookup = {
	price: number | null;
	source: 'cache' | 'network';
	reason?: TTokenPriceLookupReason;
	status?: number;
	rateLimitRemaining?: string;
	rateLimitReset?: string;
	message?: string;
};

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

function getHeader(headers: Headers, keys: string[]): string | undefined {
	for (const key of keys) {
		const value = headers.get(key);
		if (value) {
			return value;
		}
	}
	return undefined;
}

export async function getTokenPriceUsdWithDebug(chainId: number, contractAddress: string): Promise<TTokenPriceUsdLookup> {
	const platform = getCoingeckoPlatformId(chainId);
	if (!platform) {
		return {
			price: null,
			source: 'network',
			reason: 'unsupported_chain',
			message: `Unsupported chainId ${chainId} for CoinGecko pricing`
		};
	}

	const address = contractAddress.toLowerCase();
	const cacheKey = `${platform}:${address}`;
	const cached = priceCache.get(cacheKey);
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
		return {
			price: cached.price,
			source: 'cache'
		};
	}

	const inFlight = inFlightPriceLookups.get(cacheKey);
	if (inFlight) {
		return inFlight;
	}

	const url = `${COINGECKO_API_BASE}/simple/token_price/${platform}?contract_addresses=${address}&vs_currencies=usd`;
	const headers: HeadersInit = {};
	const apiKey = process.env.COINGECKO_API_KEY;

	if (apiKey) {
		headers['x-cg-pro-api-key'] = apiKey;
		headers['x-cg-demo-api-key'] = apiKey;
	}

	const requestPromise = (async (): Promise<TTokenPriceUsdLookup> => {
		try {
			const response = await fetch(url, {headers});
			const rateLimitRemaining = getHeader(response.headers, ['x-ratelimit-remaining', 'x-ratelimit-remaining-minute', 'x-ratelimit-remaining-day']);
			const rateLimitReset = getHeader(response.headers, ['x-ratelimit-reset', 'x-ratelimit-reset-minute', 'x-ratelimit-reset-day']);
			if (!response.ok) {
				let bodySnippet = '';
				try {
					bodySnippet = (await response.text()).replace(/\s+/g, ' ').slice(0, 180);
				} catch {
					bodySnippet = '';
				}

				return {
					price: null,
					source: 'network',
					reason: response.status === 429 ? 'rate_limited' : 'http_error',
					status: response.status,
					rateLimitRemaining,
					rateLimitReset,
					message: bodySnippet || response.statusText
				};
			}

			let data: Record<string, {usd?: number}>;
			try {
				data = await response.json() as Record<string, {usd?: number}>;
			} catch (error) {
				return {
					price: null,
					source: 'network',
					reason: 'invalid_json',
					status: response.status,
					rateLimitRemaining,
					rateLimitReset,
					message: error instanceof Error ? error.message : String(error)
				};
			}
			const price = data[address]?.usd;

			if (typeof price !== 'number') {
				return {
					price: null,
					source: 'network',
					reason: 'missing_usd',
					status: response.status,
					rateLimitRemaining,
					rateLimitReset,
					message: `Missing usd field for ${address}`
				};
			}

			priceCache.set(cacheKey, {price, fetchedAt: Date.now()});
			return {
				price,
				source: 'network',
				status: response.status,
			};
		} catch (error) {
			return {
				price: null,
				source: 'network',
				reason: 'network_error',
				message: error instanceof Error ? error.message : String(error)
			};
		}
	})();

	inFlightPriceLookups.set(cacheKey, requestPromise);
	try {
		return await requestPromise;
	} finally {
		inFlightPriceLookups.delete(cacheKey);
	}
}

export async function getTokenPriceUsd(chainId: number, contractAddress: string): Promise<number | null> {
	return (await getTokenPriceUsdWithDebug(chainId, contractAddress)).price;
}
