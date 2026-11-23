const TOKEN_ASSETS_BASE_URL = 'https://assets.yearn.fi/api';

function getChainLogoUrl(chainId: number): string {
	return `${TOKEN_ASSETS_BASE_URL}/chains/${chainId}/logo-32.png?fallback=true`;
}

function getTokenLogoUrl(chainId: number, tokenAddress: string): string {
	return `${TOKEN_ASSETS_BASE_URL}/tokens/${chainId}/${tokenAddress.toLowerCase()}/logo-32.png?fallback=true`;
}

export {getChainLogoUrl, getTokenLogoUrl};
