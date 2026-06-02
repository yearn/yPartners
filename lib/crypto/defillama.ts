import {utils} from 'ethers';

const DEFILLAMA_API_BASE = 'https://coins.llama.fi/prices/current';
const CACHE_TTL_MS = 5 * 60 * 1000;

const priceCache = new Map<string, {price: number, fetchedAt: number}>();
const inFlightPriceLookups = new Map<string, Promise<TTokenPriceUsdLookup>>();

type TTokenPriceLookupReason =
	| 'unsupported_chain'
	| 'invalid_address'
	| 'rate_limited'
	| 'http_error'
	| 'invalid_json'
	| 'network_error'
	| 'missing_usd';

export type TTokenPriceUsdLookup = {
	price: number | null;
	source: 'cache' | 'network';
	reason?: TTokenPriceLookupReason;
	status?: number;
	message?: string;
};

function getDefiLlamaChainName(chainId: number): string | null {
	switch (chainId) {
		case 1:
			return 'ethereum';
		case 8453:
			return 'base';
		case 42161:
			return 'arbitrum';
		case 137:
			return 'polygon';
		case 747474:
			return 'katana';
		default:
			return null;
	}
}

export async function getTokenPriceUsdWithDebug(chainId: number, contractAddress: string): Promise<TTokenPriceUsdLookup> {
	const chainName = getDefiLlamaChainName(chainId);
	if (!chainName) {
		return {
			price: null,
			source: 'network',
			reason: 'unsupported_chain',
			message: `Unsupported chainId ${chainId} for DefiLlama pricing`
		};
	}

	let address: string;
	try {
		address = utils.getAddress(contractAddress);
	} catch {
		return {
			price: null,
			source: 'network',
			reason: 'invalid_address',
			message: `Invalid address or failed EIP-55 checksum for ${contractAddress}`
		};
	}

	const cacheKey = `${chainName}:${address.toLowerCase()}`;
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

	const url = `${DEFILLAMA_API_BASE}/${chainName}:${address}`;

	const requestPromise = (async (): Promise<TTokenPriceUsdLookup> => {
		try {
			const response = await fetch(url);
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
					message: bodySnippet || response.statusText
				};
			}

			let data: {coins: Record<string, {price?: number, decimals?: number, symbol?: string, timestamp?: number, confidence?: number}>};
			try {
				data = await response.json() as {coins: Record<string, {price?: number}>};
			} catch (error) {
				return {
					price: null,
					source: 'network',
					reason: 'invalid_json',
					status: response.status,
					message: error instanceof Error ? error.message : String(error)
				};
			}

			const coinKey = `${chainName}:${address}`;
			const price = data.coins?.[coinKey]?.price;

			if (typeof price !== 'number') {
				return {
					price: null,
					source: 'network',
					reason: 'missing_usd',
					status: response.status,
					message: `Missing price field for ${coinKey}`
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
