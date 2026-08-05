type TKongVaultAsset = {
	address: string;
	decimals: number;
};

type TKongVault = {
	address: string;
	chainId: number;
	v3?: boolean;
	pricePerShare: string;
	asset: TKongVaultAsset;
};

type TKongResponse<T> = {
	data?: T;
	errors?: Array<{message: string}>;
};

export type TKongVaultMetadata = {
	assetAddress: string;
	decimals: number;
	pricePerShare: string;
};

const DEFAULT_KONG_URL = 'https://kong.yearn.fi/api/gql';
const CACHE_TTL_MS = 5 * 60 * 1000;
const kongCache = new Map<string, {value: TKongVaultMetadata, fetchedAt: number}>();

function getKongUrl(): string {
	return process.env.KONG_GRAPHQL_URL || DEFAULT_KONG_URL;
}

async function queryKong<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
	const response = await fetch(getKongUrl(), {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({query, variables})
	});

	if (!response.ok) {
		return null;
	}

	const payload = await response.json() as TKongResponse<T>;
	if (payload.errors && payload.errors.length > 0) {
		return null;
	}

	return payload.data ?? null;
}

function toKongVaultMetadata(vault: TKongVault | undefined): TKongVaultMetadata | null {
	if (!vault?.asset?.address || typeof vault.asset.decimals !== 'number' || !vault.pricePerShare) {
		return null;
	}

	return {
		assetAddress: vault.asset.address,
		decimals: vault.asset.decimals,
		pricePerShare: vault.pricePerShare
	};
}

export async function getKongVaultMetadataForVaults(
	chainId: number,
	vaultAddresses: string[]
): Promise<Map<string, TKongVaultMetadata>> {
	const metadataByVault = new Map<string, TKongVaultMetadata>();
	const missingAddresses = new Set<string>();

	for (const vaultAddress of vaultAddresses) {
		const normalizedAddress = vaultAddress.toLowerCase();
		const cacheKey = `${chainId}:${normalizedAddress}`;
		const cached = kongCache.get(cacheKey);
		if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
			metadataByVault.set(normalizedAddress, cached.value);
		} else {
			missingAddresses.add(normalizedAddress);
		}
	}

	if (missingAddresses.size === 0) {
		return metadataByVault;
	}

	const query = `
		query VaultsByAddresses($addresses: [String!]!, $chainId: Int!) {
			vaults(chainId: $chainId, addresses: $addresses, v3: true) {
				address
				chainId
				v3
				pricePerShare
				asset {
					address
					decimals
				}
			}
		}
	`;
	const data = await queryKong<{vaults: TKongVault[]}>(query, {
		addresses: Array.from(missingAddresses),
		chainId
	});

	for (const vault of data?.vaults || []) {
		if (vault.chainId !== chainId) {
			continue;
		}
		const metadata = toKongVaultMetadata(vault);
		if (!metadata) {
			continue;
		}
		const normalizedAddress = vault.address.toLowerCase();
		metadataByVault.set(normalizedAddress, metadata);
		kongCache.set(`${chainId}:${normalizedAddress}`, {value: metadata, fetchedAt: Date.now()});
	}

	return metadataByVault;
}

export async function getKongVaultMetadata(
	chainId: number,
	vaultAddress: string
): Promise<TKongVaultMetadata | null> {
	const normalizedAddress = vaultAddress.toLowerCase();
	const metadataByVault = await getKongVaultMetadataForVaults(
		chainId,
		[normalizedAddress]
	);
	const batchedMetadata = metadataByVault.get(normalizedAddress);
	if (batchedMetadata) {
		return batchedMetadata;
	}

	const queryByAddress = `
		query VaultByAddress($address: String!) {
			vaults(addresses: [$address], v3: true) {
				address
				chainId
				v3
				pricePerShare
				asset {
					address
					decimals
				}
			}
		}
	`;
	const dataByAddress = await queryKong<{vaults: TKongVault[]}>(queryByAddress, {
		address: normalizedAddress
	});
	const vault = dataByAddress?.vaults?.find((item) => item.chainId === chainId);
	const metadata = toKongVaultMetadata(vault);
	if (!metadata) {
		return null;
	}

	kongCache.set(`${chainId}:${normalizedAddress}`, {value: metadata, fetchedAt: Date.now()});
	return metadata;
}
