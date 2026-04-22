import {ethers} from 'ethers';
import {getRpcUrlLatest} from 'lib/crypto/rpc';

const ENDORSEMENT_CONTRACT = '0xd40ecF29e001c76Dcc4cC0D9cd50520CE845B038';

const ENDORSEMENT_ABI = [
	'function isEndorsed(address vault) view returns (bool)'
];

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 6000];

type EndorsementCache = Map<string, boolean>;
const endorsementCache: EndorsementCache = new Map();

function isRateLimitError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	const msg = error.message || '';
	if (msg.includes('429')) return true;
	if (msg.includes('rate-limit') || msg.includes('rate limited') || msg.includes('rate_limited')) return true;
	const anyError = error as unknown as Record<string, unknown>;
	if (anyError.code === 'SERVER_ERROR') {
		const body = anyError.body as string | undefined;
		if (body && (body.includes('"code":429') || body.includes('rate-limit'))) return true;
	}
	return false;
}

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function isVaultEndorsed(chainId: number, vaultAddress: string): Promise<boolean> {
	const cacheKey = `${chainId}:${vaultAddress.toLowerCase()}`;

	if (endorsementCache.has(cacheKey)) {
		return endorsementCache.get(cacheKey)!;
	}

	const rpcUrl = getRpcUrlLatest(chainId);
	if (!rpcUrl) {
		console.warn(`[endorsement] No RPC URL for chain ${chainId}, assuming not endorsed`);
		endorsementCache.set(cacheKey, false);
		return false;
	}

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const provider = new ethers.providers.StaticJsonRpcProvider(
				rpcUrl,
				{
					chainId: chainId,
					name: `chain-${chainId}`
				}
			);

			const contract = new ethers.Contract(ENDORSEMENT_CONTRACT, ENDORSEMENT_ABI, provider);

			const timeoutPromise = new Promise<boolean>((_, reject) => {
				setTimeout(() => reject(new Error('Endorsement check timeout')), 10000);
			});

			const endorsementPromise = contract.isEndorsed(vaultAddress);
			const isEndorsed = await Promise.race([endorsementPromise, timeoutPromise]) as boolean;

			endorsementCache.set(cacheKey, isEndorsed);

			return isEndorsed;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			if (isRateLimitError(error)) {
				if (attempt < MAX_RETRIES) {
					console.warn(`[endorsement] Rate-limited checking ${vaultAddress} on chain ${chainId}, retrying in ${RETRY_DELAYS[attempt]}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
					await sleep(RETRY_DELAYS[attempt]);
					continue;
				}
				console.warn(`[endorsement] Rate-limited checking ${vaultAddress} on chain ${chainId} after ${MAX_RETRIES} retries, will retry on next call`);
				return false;
			}

			console.warn(`[endorsement] Failed to check endorsement for ${vaultAddress} on chain ${chainId}: ${errorMsg}`);
			endorsementCache.set(cacheKey, false);
			return false;
		}
	}

	return false;
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
