import useSWR from 'swr';
import {KONG_REST_URL} from 'lib/yearn/kongRest';

type TKongVault = {
	address: string;
	name: string;
	symbol: string;
	apiVersion: string;
	chainId: number;
	decimals: number;
	asset: {
		address: string;
		name: string;
		symbol: string;
		decimals: number | string;
	};
};

async function fetchVault(chainId: number, vaultAddress: string): Promise<TKongVault | null> {
	const response = await fetch(`${KONG_REST_URL}/snapshot/${chainId}/${vaultAddress}`);
	if (response.status === 404) {
		return null;
	}
	if (!response.ok) {
		throw new Error(`Kong returned HTTP ${response.status}`);
	}
	const vault = await response.json() as TKongVault;
	if (vault.chainId !== chainId || vault.address?.toLowerCase() !== vaultAddress.toLowerCase()) {
		throw new Error('Kong returned a different vault');
	}
	return vault;
}

/**
 * Hook to fetch vault metadata from Kong API
 * @param chainId - The chain ID
 * @param vaultAddress - The vault address
 * @returns Vault data including name and symbol
 */
export function useKongVault(chainId: number | undefined, vaultAddress: string | undefined) {
	const shouldFetch = Boolean(chainId && vaultAddress);
	const cacheKey = shouldFetch ? `kong-vault-${chainId}-${vaultAddress}` : null;

	const {data, error, isLoading} = useSWR(
		cacheKey,
		async () => {
			if (!chainId || !vaultAddress) {
				return null;
			}
			return fetchVault(chainId, vaultAddress);
		},
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 3600000, // 1 hour cache
		}
	);

	return {
		vault: data,
		isLoading,
		error
	};
}

/**
 * Extract a clean vault name from the Kong name field
 * Strips " yVault" suffix if present
 */
export function getCleanVaultName(vaultName: string | undefined): string | null {
	if (!vaultName) {
		return null;
	}

	// Remove " yVault" suffix if present
	return vaultName.replace(/ yVault$/, '');
}
