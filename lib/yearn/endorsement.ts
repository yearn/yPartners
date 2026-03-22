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
			endorsementCache.set(cacheKey, false);
			return false;
		}

		// Use StaticJsonRpcProvider to skip network detection
		// This prevents "could not detect network" errors
		const provider = new ethers.providers.StaticJsonRpcProvider(
			rpcUrl,
			{
				chainId: chainId,
				name: `chain-${chainId}`
			}
		);

		const contract = new ethers.Contract(ENDORSEMENT_CONTRACT, ENDORSEMENT_ABI, provider);

		// Add timeout to the contract call
		const timeoutPromise = new Promise<boolean>((_, reject) => {
			setTimeout(() => reject(new Error('Endorsement check timeout')), 10000);
		});

		const endorsementPromise = contract.isEndorsed(vaultAddress);
		const isEndorsed = await Promise.race([endorsementPromise, timeoutPromise]) as boolean;

		// Cache the result
		endorsementCache.set(cacheKey, isEndorsed);

		return isEndorsed;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.warn(`[endorsement] Failed to check endorsement for ${vaultAddress} on chain ${chainId}: ${errorMsg}`);
		// On error, cache as false and assume not endorsed for safety
		endorsementCache.set(cacheKey, false);
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
