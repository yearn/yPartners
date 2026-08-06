import {ethers} from 'ethers';
import {getRpcUrlLatest} from 'lib/crypto/rpc';
import type {TAddress} from './utils/address';

export type TVaultType = 'vault' | 'strategy' | 'unknown';

// ABI with vault-specific functions (only exist on Allocator Vaults, not on TokenizedStrategies)
const VAULT_CHECK_ABI = [
	'function get_default_queue() view returns (address[])',
	'function apiVersion() view returns (string)'
];

/**
 * Method 1: Check on-chain if an address is a vault or strategy
 * Vaults (Allocator Vaults) have get_default_queue(), strategies don't
 */
async function checkOnChainVaultType(
	chainId: number,
	address: TAddress
): Promise<TVaultType> {
	const rpcUrl = getRpcUrlLatest(chainId);
	if (!rpcUrl) {
		return 'unknown';
	}

	try {
		const provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId);
		const contract = new ethers.Contract(address, VAULT_CHECK_ABI, provider);
		await contract.get_default_queue();
		return 'vault';
	} catch (firstError) {
		void firstError;
		try {
			const provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId);
			const contract = new ethers.Contract(address, VAULT_CHECK_ABI, provider);
			const version = await contract.apiVersion();
			return version ? 'strategy' : 'unknown';
		} catch (secondError) {
			void secondError;
			return 'unknown';
		}
	}
}

/**
 * Method 5: Check Kong/yDaemon API to determine vault type
 * Returns 'vault' for MultiStrategy/Legacy, 'strategy' for SingleStrategy
 */
async function checkKongVaultType(
	chainId: number,
	address: TAddress
): Promise<TVaultType> {
	try {
		const url = `https://ydaemon.yearn.fi/${chainId}/vaults/${address}`;
		const response = await fetch(url);

		if (!response.ok) {
			return 'unknown';
		}

		const data = await response.json();
		const kind = data?.kind;

		if (kind === 'Single Strategy') {
			return 'strategy';
		}
		if (kind === 'Multi Strategy' || kind === 'Legacy') {
			return 'vault';
		}
		return 'unknown';
	} catch {
		return 'unknown';
	}
}

// Cache for vault type checks to avoid repeated API calls
const vaultTypeCache = new Map<string, TVaultType>();

function getCacheKey(chainId: number, address: TAddress): string {
	return `${chainId}:${address.toLowerCase()}`;
}

/**
 * Check if an address is a vault (not a strategy)
 * Uses both Method 1 (on-chain) and Method 5 (Kong API)
 * Returns true only if both methods agree it's a vault, or if Kong says it's a vault
 */
export async function isVault(
	chainId: number,
	address: TAddress
): Promise<boolean> {
	const cacheKey = getCacheKey(chainId, address);
	const cached = vaultTypeCache.get(cacheKey);
	if (cached) {
		return cached === 'vault';
	}

	// Try Kong API first (Method 5) - faster
	const kongType = await checkKongVaultType(chainId, address);

	if (kongType === 'vault') {
		vaultTypeCache.set(cacheKey, 'vault');
		return true;
	}

	if (kongType === 'strategy') {
		vaultTypeCache.set(cacheKey, 'strategy');
		return false;
	}

	// Kong didn't return useful data, fall back to on-chain check (Method 1)
	const onChainType = await checkOnChainVaultType(chainId, address);
	vaultTypeCache.set(cacheKey, onChainType);

	return onChainType === 'vault';
}

/**
 * Filter an array of vault combos to only include actual vaults (not strategies)
 */
export async function filterOnlyVaults<T extends {chainId: number; vaultAddress: TAddress}>(
	combos: T[]
): Promise<T[]> {
	const results = await Promise.all(
		combos.map(async (combo) => {
			const isVaultResult = await isVault(combo.chainId, combo.vaultAddress);
			return {combo, isVault: isVaultResult};
		})
	);

	return results.filter((r) => r.isVault).map((r) => r.combo);
}

/**
 * Synchronous check using cached values
 * Returns undefined if not in cache
 */
export function getCachedVaultType(
	chainId: number,
	address: TAddress
): TVaultType | undefined {
	return vaultTypeCache.get(getCacheKey(chainId, address));
}

/**
 * Pre-populate the cache with known vault/strategy addresses
 * This can be called at app initialization to avoid API calls for known addresses
 */
export function preloadVaultTypeCache(
	chainId: number,
	address: TAddress,
	type: TVaultType
): void {
	vaultTypeCache.set(getCacheKey(chainId, address), type);
}
