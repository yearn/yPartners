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

type TKongVaultResult = {
	assetAddress: string;
	decimals: number;
	pricePerShare: string;
};

const DEFAULT_KONG_URL = 'https://kong.yearn.fi/api/gql';
const CACHE_TTL_MS = 5 * 60 * 1000;
const kongCache = new Map<string, {value: TKongVaultResult, fetchedAt: number}>();

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

export async function getKongVaultMetadata(chainId: number, vaultAddress: string): Promise<TKongVaultResult | null> {
	const normalizedAddress = vaultAddress.toLowerCase();
	const cacheKey = `${chainId}:${normalizedAddress}`;
	const cached = kongCache.get(cacheKey);
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
		return cached.value;
	}

	const queryByChain = `
		query VaultByAddress($address: String!, $chainId: Int!) {
			vaults(where: {address: $address, chainId: $chainId, v3: true}) {
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

	const queryByAddress = `
		query VaultByAddress($address: String!) {
			vaults(where: {address: $address, v3: true}) {
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

	const dataByChain = await queryKong<{vaults: TKongVault[]}>(queryByChain, {
		address: normalizedAddress,
		chainId
	});

	let vault = dataByChain?.vaults?.[0];

	if (!vault) {
		const dataByAddress = await queryKong<{vaults: TKongVault[]}>(queryByAddress, {
			address: normalizedAddress
		});
		vault = dataByAddress?.vaults?.find((item) => item.chainId === chainId);
	}

	if (!vault?.asset?.address || typeof vault.asset.decimals !== 'number' || !vault.pricePerShare) {
		return null;
	}

	const result: TKongVaultResult = {
		assetAddress: vault.asset.address,
		decimals: vault.asset.decimals,
		pricePerShare: vault.pricePerShare
	};

	kongCache.set(cacheKey, {value: result, fetchedAt: Date.now()});
	return result;
}
