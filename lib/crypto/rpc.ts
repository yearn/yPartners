type TChainConfig = {
	name: string;
	rpcEnvVar: string;
	publicEnvVar: string;
	privateEnvVar: string;
	fallbackRpcs: string[];
};

const CHAIN_CONFIG: Record<number, TChainConfig> = {
	1: {
		name: 'Ethereum',
		rpcEnvVar: 'RPC_URL_MAINNET',
		publicEnvVar: 'RPC_URL_MAINNET_PUBLIC',
		privateEnvVar: 'RPC_URL_MAINNET_PRIVATE',
		fallbackRpcs: [
			'https://mainnet.gateway.tenderly.co/3V34wr9LQ5X3HupEWCw8kg',
			'https://gateway.tenderly.co/public/mainnet',
			'https://rpc.ankr.com/eth',
			'https://ethereum.publicnode.com',
			'https://1rpc.io/eth'
		]
	},
	8453: {
		name: 'Base',
		rpcEnvVar: 'RPC_URL_BASE',
		publicEnvVar: 'RPC_URL_BASE_PUBLIC',
		privateEnvVar: 'RPC_URL_BASE_PRIVATE',
		fallbackRpcs: [
			'https://gateway.tenderly.co/public/base',
			'https://rpc.ankr.com/base',
			'https://base.publicnode.com',
			'https://1rpc.io/base'
		]
	},
	42161: {
		name: 'Arbitrum',
		rpcEnvVar: 'RPC_URL_ARBITRUM',
		publicEnvVar: 'RPC_URL_ARBITRUM_PUBLIC',
		privateEnvVar: 'RPC_URL_ARBITRUM_PRIVATE',
		fallbackRpcs: [
			'https://arbitrum-one.publicnode.com',
			'https://arbitrum.gateway.tenderly.co',
			'https://1rpc.io/arb'
		]
	},
	747474: {
		name: 'Katana',
		rpcEnvVar: 'RPC_URL_KATANA',
		publicEnvVar: 'RPC_URL_KATANA_PUBLIC',
		privateEnvVar: 'RPC_URL_KATANA_PRIVATE',
		fallbackRpcs: [
			'https://katana.gateway.tenderly.co',
			'https://rpc.katana.network',
			'https://katana.drpc.org',
			'https://rpc.katana.network'
		]
	}
};

export function getRpcUrlLatest(chainId: number): string | null {
	const config = CHAIN_CONFIG[chainId];
	if (!config) {
		console.warn(`[rpc] Unsupported chain ID: ${chainId}`);
		return null;
	}

	// Prefer explicit public URL, then legacy RPC URL
	const envRpc = process.env[config.publicEnvVar] || process.env[config.rpcEnvVar];
	if (envRpc) {
		return envRpc;
	}

	// Fall back to the first fallback RPC
	if (config.fallbackRpcs.length > 0) {
		return config.fallbackRpcs[0];
	}

	return null;
}

export function getRpcUrlArchive(chainId: number): {url: string | null, isPublicFallback: boolean} {
	const config = CHAIN_CONFIG[chainId];
	if (!config) {
		console.warn(`[rpc] Unsupported chain ID: ${chainId}`);
		return {url: null, isPublicFallback: false};
	}

	// Prefer explicit private URL, then legacy RPC URL
	const envRpc = process.env[config.privateEnvVar] || process.env[config.rpcEnvVar];
	if (envRpc) {
		return {url: envRpc, isPublicFallback: false};
	}

	// Fall back to the first fallback RPC (may not be archive)
	if (config.fallbackRpcs.length > 0) {
		return {url: config.fallbackRpcs[0], isPublicFallback: true};
	}

	return {url: null, isPublicFallback: false};
}

export function getRpcUrl(chainId: number): string | null {
	return getRpcUrlLatest(chainId);
}

export function getChainName(chainId: number): string {
	return CHAIN_CONFIG[chainId]?.name ?? `Chain ${chainId}`;
}

export {CHAIN_CONFIG};
