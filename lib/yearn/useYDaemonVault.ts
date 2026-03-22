import useSWR from 'swr';
import {toAddress} from 'lib/yearn/utils/address';

type TYDaemonVault = {
	address: string;
	name: string;
	symbol: string;
	version: string;
	chainID: number;
	decimals: number;
	token: {
		address: string;
		name: string;
		symbol: string;
		decimals: number;
	};
};

const YDAEMON_BASE_URI = 'https://ydaemon.yearn.fi';

async function fetchVault(chainId: number, vaultAddress: string): Promise<TYDaemonVault | null> {
	try {
		const response = await fetch(
			`${YDAEMON_BASE_URI}/vaults?hideAlways=true&chainIDs=${chainId}&limit=2500`,
			{
				headers: {
					'Accept': 'application/json'
				}
			}
		);

		if (!response.ok) {
			console.warn(`[yDaemon] Failed to fetch vaults for chain ${chainId}`);
			return null;
		}

		const vaults = await response.json() as TYDaemonVault[];
		const normalizedAddress = toAddress(vaultAddress);

		// Find the vault by address
		const vault = vaults.find((v) => toAddress(v.address) === normalizedAddress);

		return vault || null;
	} catch (error) {
		console.error('[yDaemon] Error fetching vault data:', error);
		return null;
	}
}

/**
 * Hook to fetch vault metadata from yDaemon API
 * @param chainId - The chain ID
 * @param vaultAddress - The vault address
 * @returns Vault data including name and symbol
 */
export function useYDaemonVault(chainId: number | undefined, vaultAddress: string | undefined) {
	const shouldFetch = Boolean(chainId && vaultAddress);
	const cacheKey = shouldFetch ? `ydaemon-vault-${chainId}-${vaultAddress}` : null;

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
 * Extract a clean vault name from the yDaemon name field
 * Strips " yVault" suffix if present
 */
export function getCleanVaultName(vaultName: string | undefined): string | null {
	if (!vaultName) {
		return null;
	}

	// Remove " yVault" suffix if present
	return vaultName.replace(/ yVault$/, '');
}
