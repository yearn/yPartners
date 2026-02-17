import {ethers} from 'ethers';

const SYMBOL_SELECTOR = '0x95d89b41';
const symbolCache = new Map<string, string>();

export async function getTokenSymbol(
	provider: ethers.providers.JsonRpcProvider,
	tokenAddress: string
): Promise<string | null> {
	const normalized = tokenAddress.toLowerCase();
	const cached = symbolCache.get(normalized);
	if (cached) {
		return cached;
	}

	let data: string;
	try {
		data = await provider.call({to: tokenAddress, data: SYMBOL_SELECTOR});
	} catch {
		return null;
	}

	if (!data || data === '0x') {
		return null;
	}

	let symbol: string | null = null;
	try {
		[symbol] = ethers.utils.defaultAbiCoder.decode(['string'], data);
	} catch {
		try {
			symbol = ethers.utils.parseBytes32String(data);
		} catch {
			symbol = null;
		}
	}

	if (!symbol) {
		return null;
	}

	const trimmed = symbol.trim();
	if (!trimmed) {
		return null;
	}

	symbolCache.set(normalized, trimmed);
	return trimmed;
}
