import {ethers} from 'ethers';
import {getRpcUrlLatest} from 'lib/crypto/rpc';

const ENDORSEMENT_CONTRACT = '0xd40ecF29e001c76Dcc4cC0D9cd50520CE845B038';

// ABI for isEndorsed function
const ENDORSEMENT_ABI = [
	'function isEndorsed(address vault) view returns (bool)'
];

type EndorsementCache = Map<string, boolean>;
const endorsementCache: EndorsementCache = new Map();

/**
 * Check if a vault is endorsed by calling isEndorsed() on the endorsement contract
 * @param chainId - The chain ID
 * @param vaultAddress - The vault address to check
 * @returns Promise<boolean> - true if endorsed, false otherwise
 */
export async function isVaultEndorsed(chainId: number, vaultAddress: string): Promise<boolean> {
	const cacheKey = `${chainId}:${vaultAddress.toLowerCase()}`;

	// Check cache first
	if (endorsementCache.has(cacheKey)) {
		return endorsementCache.get(cacheKey)!;
	}

	try {
		const rpcUrl = getRpcUrlLatest(chainId);
		if (!rpcUrl) {
			console.warn(`[endorsement] No RPC URL for chain ${chainId}, assuming not endorsed`);
			return false;
		}

		const provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId);
		const contract = new ethers.Contract(ENDORSEMENT_CONTRACT, ENDORSEMENT_ABI, provider);

		const isEndorsed = await contract.isEndorsed(vaultAddress);

		// Cache the result
		endorsementCache.set(cacheKey, isEndorsed);

		return isEndorsed;
	} catch (error) {
		console.error(`[endorsement] Failed to check endorsement for ${vaultAddress} on chain ${chainId}:`, error);
		// On error, assume not endorsed for safety
		return false;
	}
}

/**
 * Check multiple vaults for endorsement in parallel
 * @param vaults - Array of {chainId, vaultAddress} objects
 * @returns Promise<Map<string, boolean>> - Map of "chainId:vaultAddress" to endorsement status
 */
export async function checkVaultsEndorsement(
	vaults: Array<{chainId: number, vaultAddress: string}>
): Promise<Map<string, boolean>> {
	const results = await Promise.allSettled(
		vaults.map(async ({chainId, vaultAddress}) => {
			const isEndorsed = await isVaultEndorsed(chainId, vaultAddress);
			return {
				key: `${chainId}:${vaultAddress.toLowerCase()}`,
				isEndorsed
			};
		})
	);

	const endorsementMap = new Map<string, boolean>();
	results.forEach((result) => {
		if (result.status === 'fulfilled') {
			endorsementMap.set(result.value.key, result.value.isEndorsed);
		}
	});

	return endorsementMap;
}
