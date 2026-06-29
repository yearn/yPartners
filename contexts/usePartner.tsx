import {createContext, useContext, useEffect, useMemo, useState}	from 'react';
import {PARTNER_ADDRESS_GROUPS, PARTNER_VAULT_CONFIG, SHAREABLE_ADDRESSES, VAULT_WHITELIST} from 'utils/Partners';
import useSWR from 'swr';
import {baseFetcher} from 'lib/yearn/utils/fetchers';
import {toAddress} from 'lib/yearn/utils/address';
import {checkVaultsEndorsement} from 'lib/yearn/endorsement';
import {isVault, TVaultType} from 'lib/yearn/vaultDetection';

import type {ReactElement} from 'react';
import type {TPartnerVault} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';
import type {TAddress} from 'lib/yearn/utils/address';
import type {TChainConfig} from 'utils/Partners';

type TAccountFees = {
	address: string,
	totalFees: string,
	totalFeesNormalized: number,
	currentShares: string,
	currentSharesNormalized: number,
	netProfit?: string,
	netProfitNormalized?: number,
	grossProfit?: string,
	grossProfitNormalized?: number,
	weightedAvgEntryPps?: string,
	weightedAvgEntryPpsNormalized?: number
};

type TPartnerContext = {
	vaults: TDict<TPartnerVault>,
	isLoadingVaults: boolean,
	isLoadingFees: boolean,
	isLoadingChart: boolean,
	tvlOverride?: number,
	userCount?: number,
	feesOverride?: number,
	chainId?: number,
	vaultAddress?: TAddress,
	chartSnapshots: TChartSnapshot[],
	accountFees: TAccountFees[],
	vaultComboData: TVaultComboData[],
	apiErrors: string[],
	selectedVaultKey: string,
	setSelectedVaultKey: (value: string) => void
}

const	defaultProps: TPartnerContext = {
	vaults: {},
	isLoadingVaults: false,
	isLoadingFees: false,
	isLoadingChart: false,
	tvlOverride: undefined,
	userCount: undefined,
	feesOverride: undefined,
	chainId: undefined,
	vaultAddress: undefined,
	chartSnapshots: [],
	accountFees: [],
	vaultComboData: [],
	apiErrors: [],
	selectedVaultKey: '',
	setSelectedVaultKey: (): void => undefined
};

const	Partner = createContext<TPartnerContext>(defaultProps);

type TPartnerTVLResponse = {
	vaultAddress: string,
	assetAddress?: string,
	assetPriceUsd?: number,
	assetSymbol?: string,
	decimals: number,
	pricePerShare: string,
	totalCurrentValue: string,
	totalCurrentValueNormalized: number,
	accounts: {
		address: string,
		shares: string,
		currentValue: string,
		currentValueNormalized: number
	}[]
};

type TChartSnapshot = {
	block: number,
	shares: number,
	profit: number
};

type TPartnerFeesResponse = {
	totalFeesNormalized: number,
	assetAddress?: string,
	assetPriceUsd?: number,
	assetSymbol?: string,
	netProfitNormalized?: number,
	grossProfitNormalized?: number,
	accounts: {
		address: string,
		totalFees: string,
		totalFeesNormalized: number,
		currentShares: string,
		currentSharesNormalized: number,
		netProfit?: string,
		netProfitNormalized?: number,
		grossProfit?: string,
		grossProfitNormalized?: number,
		weightedAvgEntryPps?: string,
		weightedAvgEntryPpsNormalized?: number
	}[],
	snapshots: TChartSnapshot[]
};

type TVaultAssetMetadataResponse = {
	chainId: number,
	vaultAddress: string,
	assetAddress: string | null
};

type TVaultCombo = {
	chainId: number;
	vaultAddress: TAddress;
	addresses: TAddress[];
};

const TOTAL_VAULT_KEY = 'total';

function getComboKey(combo: TVaultCombo): string {
	return `${combo.chainId}:${combo.vaultAddress.toLowerCase()}`;
}

type TVaultComboData = {
	key: string;
	chainId: number;
	vaultAddress: TAddress;
	addresses: TAddress[];
	assetAddress?: string;
	tvl?: TPartnerTVLResponse;
	fees?: TPartnerFeesResponse;
	chart?: TPartnerFeesResponse;
	isLoadingTVL: boolean;
	isLoadingFees: boolean;
	isLoadingChart: boolean;
};

type TAPIError = {
	error: string;
};

type TPartnerReferralConfig = {
	[chainId: number]: {
		[vaultAddress: string]: string[];
	};
};

function isAPIError(value: unknown): value is TAPIError {
	return Boolean(
		value &&
		typeof value === 'object' &&
		'error' in value &&
		typeof (value as {error?: unknown}).error === 'string'
	);
}

function buildPartnerTVLUrl(combo: TVaultCombo): string {
	return `/api/partner-tvl?addresses=${combo.addresses.join(',')}&vaultAddress=${combo.vaultAddress}&chainId=${combo.chainId}`;
}

function buildPartnerFeesUrl(combo: TVaultCombo, windowDays: number | undefined, includeSnapshots: boolean): string {
	return `/api/partner-fees?addresses=${combo.addresses.join(',')}&vaultAddress=${combo.vaultAddress}&chainId=${combo.chainId}${windowDays ? `&days=${windowDays}` : ''}&includeSnapshots=${includeSnapshots ? 'true' : 'false'}`;
}

function buildVaultAssetMetadataUrl(combo: TVaultCombo): string {
	return `/api/vault-asset?vaultAddress=${combo.vaultAddress}&chainId=${combo.chainId}`;
}

export const PartnerContextApp = ({
	partnerID,
	children,
	windowDays
}: {partnerID: string, children: ReactElement, windowDays?: number}): ReactElement => {
	const currentPartner = SHAREABLE_ADDRESSES[partnerID] ? SHAREABLE_ADDRESSES[partnerID].shortName : '';
	const isSSR = typeof window === 'undefined';
	const isDynamicPartner = currentPartner === 'ceazor' || currentPartner === 'jumper';

	// Fetch dynamic referral data for partners with dynamic vault config
	const shouldFetchReferrals = !isSSR && isDynamicPartner && partnerID;
	const {data: referralConfigResult, isLoading: isLoadingReferrals} = useSWR<TPartnerReferralConfig | TAPIError>(
		shouldFetchReferrals ? ['partner-referrals', partnerID] : null,
		async (): Promise<TPartnerReferralConfig | TAPIError> =>
			baseFetcher<TPartnerReferralConfig | TAPIError>(`/api/partner-referrals?referrer=${partnerID}`),
		{revalidateOnFocus: false}
	);

	// Merge static config with dynamic referral config
	const mergedVaultConfig = useMemo((): TChainConfig => {
		const staticConfig = PARTNER_VAULT_CONFIG[currentPartner] || {};

		// If not a dynamic partner or no referral data yet, return static config
		if (!isDynamicPartner || !referralConfigResult || isAPIError(referralConfigResult)) {
			return staticConfig;
		}

		// Merge dynamic referral config with static config
		const merged: TChainConfig = {...staticConfig};

		Object.entries(referralConfigResult).forEach(([chainIdStr, vaults]) => {
			const chainId = Number(chainIdStr);
			if (!merged[chainId]) {
				merged[chainId] = {};
			}

			Object.entries(vaults).forEach(([vault, addresses]) => {
				const vaultAddr = toAddress(vault);
				if (!merged[chainId][vaultAddr]) {
					merged[chainId][vaultAddr] = addresses.map(toAddress);
				} else {
					// Merge addresses, removing duplicates
					const combined = [...merged[chainId][vaultAddr], ...addresses];
					const uniqueAddresses = Array.from(new Set(combined.map((a) => a.toLowerCase()))).map(toAddress);
					merged[chainId][vaultAddr] = uniqueAddresses;
				}
			});
		});

		return merged;
	}, [currentPartner, referralConfigResult, isDynamicPartner]);

	// Extract depositor addresses from merged config
	const depositorAddresses = useMemo((): TAddress[] => {
		if (!currentPartner) {
			return [];
		}

		// For dynamic partners, use the merged config; for others, use static PARTNER_ADDRESS_GROUPS
		if (isDynamicPartner) {
			const allAddresses: TAddress[] = [];
			Object.values(mergedVaultConfig).forEach((vaults) => {
				Object.values(vaults).forEach((addresses) => {
					allAddresses.push(...addresses);
				});
			});
			// Remove duplicates
			const uniqueAddresses = Array.from(new Set(allAddresses.map((a) => a.toLowerCase()))).map(toAddress);
			return uniqueAddresses;
		}

		return PARTNER_ADDRESS_GROUPS[currentPartner] || [];
	}, [currentPartner, mergedVaultConfig, isDynamicPartner]);

	// Extract all chain/vault combinations for this partner
	const vaultCombos = useMemo((): TVaultCombo[] => {
		if (!currentPartner) {
			return [];
		}

		const combos: TVaultCombo[] = [];

		Object.entries(mergedVaultConfig).forEach(([chainIdStr, vaultConfig]) => {
			const chainId = Number(chainIdStr);
			Object.entries(vaultConfig).forEach(([vaultAddress, addresses]) => {
				combos.push({
					chainId,
					vaultAddress: toAddress(vaultAddress),
					addresses
				});
			});
		});

		return combos;
	}, [currentPartner, mergedVaultConfig]);

	const [selectedVaultKey, setSelectedVaultKey] = useState('');
	const [endorsementMap, setEndorsementMap] = useState<Map<string, boolean>>(new Map());
	const [isCheckingEndorsement, setIsCheckingEndorsement] = useState(false);
	const [vaultTypeMap, setVaultTypeMap] = useState<Map<string, TVaultType>>(new Map());
	const [isCheckingVaultTypes, setIsCheckingVaultTypes] = useState(false);

	const firstComboKey = useMemo((): string => {
		return vaultCombos[0] ? getComboKey(vaultCombos[0]) : '';
	}, [vaultCombos]);

	// Keep the selected vault in sync as the available vault combos change.
	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect((): void => {
		if (vaultCombos.length === 0) {
			if (selectedVaultKey !== '') {
				setSelectedVaultKey('');
			}
			return;
		}

		if (selectedVaultKey === '' || (selectedVaultKey !== TOTAL_VAULT_KEY && !vaultCombos.some((combo) => getComboKey(combo) === selectedVaultKey))) {
			setSelectedVaultKey(firstComboKey);
		}
	}, [vaultCombos, selectedVaultKey, firstComboKey]);
	/* eslint-enable react-hooks/set-state-in-effect */

	// Lazy load endorsement status after vaults are loaded
	useEffect((): void => {
		if (isSSR || vaultCombos.length === 0 || isCheckingEndorsement) {
			return;
		}

		const checkEndorsements = async (): Promise<void> => {
			setIsCheckingEndorsement(true);
			try {
				const vaultsToCheck = vaultCombos.map((combo) => ({
					chainId: combo.chainId,
					vaultAddress: combo.vaultAddress
				}));

				const results = await checkVaultsEndorsement(vaultsToCheck);

				// Only set endorsement map if we got at least some results
				// If all checks failed, we'll show all vaults by keeping the map empty
				if (results.size > 0) {
					setEndorsementMap(results);
				} else {
					console.warn('[usePartner] All endorsement checks failed, showing all vaults');
				}
			} catch (error) {
				console.error('[usePartner] Failed to check vault endorsements:', error);
			} finally {
				setIsCheckingEndorsement(false);
			}
		};

		void checkEndorsements();
	}, [vaultCombos, isSSR, isCheckingEndorsement]);

	// Check vault types to filter out strategies (only show vaults in dropdown)
	useEffect((): void => {
		if (isSSR || vaultCombos.length === 0 || isCheckingVaultTypes) {
			return;
		}

		const checkVaultTypes = async (): Promise<void> => {
			setIsCheckingVaultTypes(true);
			try {
				const results = new Map<string, TVaultType>();

				// Check each vault combo to determine if it's a vault or strategy
				await Promise.all(
					vaultCombos.map(async (combo) => {
						const key = `${combo.chainId}:${combo.vaultAddress.toLowerCase()}`;
						const vaultType = await isVault(combo.chainId, combo.vaultAddress) ? 'vault' : 'strategy';
						results.set(key, vaultType);
					})
				);

				if (results.size > 0) {
					setVaultTypeMap(results);
					// Log strategies that will be filtered out
					const strategies = Array.from(results.entries())
						.filter(([, type]) => type === 'strategy')
						.map(([key]) => key);
					if (strategies.length > 0) {
						console.log('[usePartner] Filtering out strategies:', strategies);
					}
				}
			} catch (error) {
				console.error('[usePartner] Failed to check vault types:', error);
			} finally {
				setIsCheckingVaultTypes(false);
			}
		};

		void checkVaultTypes();
	}, [vaultCombos, isSSR, isCheckingVaultTypes]);

	const activeCombos = useMemo((): TVaultCombo[] => {
		if (vaultCombos.length === 0) {
			return [];
		}

		if (selectedVaultKey === TOTAL_VAULT_KEY) {
			return vaultCombos;
		}

		const effectiveSelectedKey = selectedVaultKey || firstComboKey;
		const combo = vaultCombos.find((item) => getComboKey(item) === effectiveSelectedKey);
		return combo ? [combo] : [];
	}, [vaultCombos, selectedVaultKey, firstComboKey]);

	const shouldFetchCombos = !isSSR && activeCombos.length > 0;
	const shouldFetchVaultMetadata = !isSSR && vaultCombos.length > 0;
	const comboIdentityKey = useMemo((): string => {
		return activeCombos
			.map((combo): string => `${combo.chainId}:${combo.vaultAddress.toLowerCase()}:${combo.addresses.join(',').toLowerCase()}`)
			.join('|');
	}, [activeCombos]);
	const vaultMetadataIdentityKey = useMemo((): string => {
		return vaultCombos
			.map((combo): string => `${combo.chainId}:${combo.vaultAddress.toLowerCase()}`)
			.join('|');
	}, [vaultCombos]);

	const {data: tvlResults, isLoading: isLoadingDepositorTVL} = useSWR<(TPartnerTVLResponse | TAPIError)[]>(
		shouldFetchCombos ? ['partner-tvl', comboIdentityKey] : null,
		async (): Promise<(TPartnerTVLResponse | TAPIError)[]> => Promise.all(
			activeCombos.map((combo) => baseFetcher<TPartnerTVLResponse | TAPIError>(buildPartnerTVLUrl(combo)))
		),
		{revalidateOnFocus: false}
	);

	const {data: feesResults, isLoading: isLoadingDepositorFees} = useSWR<(TPartnerFeesResponse | TAPIError)[]>(
		shouldFetchCombos ? ['partner-fees', comboIdentityKey, windowDays] : null,
		async (): Promise<(TPartnerFeesResponse | TAPIError)[]> => Promise.all(
			activeCombos.map((combo) => baseFetcher<TPartnerFeesResponse | TAPIError>(buildPartnerFeesUrl(combo, windowDays, true)))
		),
		{revalidateOnFocus: false}
	);
	const {data: vaultAssetMetadataResults} = useSWR<(TVaultAssetMetadataResponse | TAPIError)[]>(
		shouldFetchVaultMetadata ? ['vault-asset', vaultMetadataIdentityKey] : null,
		async (): Promise<(TVaultAssetMetadataResponse | TAPIError)[]> => Promise.all(
			vaultCombos.map((combo) => baseFetcher<TVaultAssetMetadataResponse | TAPIError>(buildVaultAssetMetadataUrl(combo)))
		),
		{revalidateOnFocus: false}
	);

	const tvlCalls = tvlResults ?? [];
	const feesCalls = feesResults ?? [];
	const vaultAssetMetadataCalls = vaultAssetMetadataResults ?? [];
	const activeComboKeys = useMemo((): Set<string> => {
		return new Set(activeCombos.map((combo) => getComboKey(combo)));
	}, [activeCombos]);
	const vaultAssetAddressByKey = useMemo((): Map<string, string> => {
		const map = new Map<string, string>();
		vaultCombos.forEach((combo, idx): void => {
			const metadataCall = vaultAssetMetadataCalls[idx];
			if (!metadataCall || isAPIError(metadataCall) || !metadataCall.assetAddress) {
				return;
			}
			map.set(getComboKey(combo), toAddress(metadataCall.assetAddress));
		});
		return map;
	}, [vaultCombos, vaultAssetMetadataCalls]);
	const tvlCallsByKey = useMemo((): Map<string, TPartnerTVLResponse | TAPIError> => {
		const map = new Map<string, TPartnerTVLResponse | TAPIError>();
		activeCombos.forEach((combo, idx): void => {
			const call = tvlCalls[idx];
			if (call) {
				map.set(getComboKey(combo), call);
			}
		});
		return map;
	}, [activeCombos, tvlCalls]);
	const feesCallsByKey = useMemo((): Map<string, TPartnerFeesResponse | TAPIError> => {
		const map = new Map<string, TPartnerFeesResponse | TAPIError>();
		activeCombos.forEach((combo, idx): void => {
			const call = feesCalls[idx];
			if (call) {
				map.set(getComboKey(combo), call);
			}
		});
		return map;
	}, [activeCombos, feesCalls]);

	const isLoadingVaults = useMemo((): boolean => {
		if (isSSR) {
			// During SSR mark as loading so server and client render the same markup.
			return true;
		}
		// For dynamic partners, also wait for referral data
		if (isDynamicPartner && isLoadingReferrals) {
			return true;
		}
		if (depositorAddresses.length === 0) {
			return false;
		}
		return isLoadingDepositorTVL;
	}, [depositorAddresses.length, isSSR, isLoadingDepositorTVL, currentPartner, isLoadingReferrals, isDynamicPartner]);

	const isLoadingFees = useMemo((): boolean => {
		if (isSSR) {
			return true;
		}
		// For dynamic partners, also wait for referral data
		if (isDynamicPartner && isLoadingReferrals) {
			return true;
		}
		if (depositorAddresses.length === 0) {
			return false;
		}
		return isLoadingDepositorFees;
	}, [depositorAddresses.length, isSSR, isLoadingDepositorFees, currentPartner, isLoadingReferrals, isDynamicPartner]);

	const isLoadingChart = useMemo((): boolean => {
		if (isSSR) {
			return true;
		}
		// For dynamic partners, also wait for referral data
		if (isDynamicPartner && isLoadingReferrals) {
			return true;
		}
		if (depositorAddresses.length === 0) {
			return false;
		}
		return isLoadingDepositorFees;
	}, [depositorAddresses.length, isSSR, isLoadingDepositorFees, currentPartner, isLoadingReferrals, isDynamicPartner]);

	const	vaults = useMemo((): TDict<TPartnerVault> => {
		// Yearn Vision data usage is disabled; returning empty vault list.
		return {};
	}, []);

	// Aggregate TVL from all vault combinations
	const tvlOverride = useMemo((): number | undefined => {
		if (activeCombos.length === 0) {
			return undefined;
		}

		if (isLoadingDepositorTVL || tvlCalls.length !== activeCombos.length) {
			return undefined;
		}

		let totalTVL = 0;
		let hasData = false;

		tvlCalls.forEach((call) => {
			if (!isAPIError(call) && typeof call.totalCurrentValueNormalized === 'number') {
				totalTVL += call.totalCurrentValueNormalized;
				hasData = true;
			}
		});

		return hasData ? totalTVL : undefined;
	}, [tvlCalls, activeCombos.length, isLoadingDepositorTVL]);

	// Aggregate fees from all vault combinations
	const feesOverride = useMemo((): number | undefined => {
		if (activeCombos.length === 0) {
			return undefined;
		}

		if (isLoadingDepositorFees || feesCalls.length !== activeCombos.length) {
			return undefined;
		}

		let totalFees = 0;
		let hasData = false;

		feesCalls.forEach((call) => {
			if (!isAPIError(call) && typeof call.totalFeesNormalized === 'number') {
				totalFees += call.totalFeesNormalized;
				hasData = true;
			}
		});

		return hasData ? totalFees : undefined;
	}, [feesCalls, activeCombos.length, isLoadingDepositorFees]);

	// Aggregate chart snapshots from active fee calls.
	const chartSnapshots = useMemo((): TChartSnapshot[] => {
		if (activeCombos.length === 0) {
			return [];
		}

		if (isLoadingDepositorFees || feesCalls.length !== activeCombos.length) {
			return [];
		}

		const allSnapshots: TChartSnapshot[] = [];

		feesCalls.forEach((call) => {
			if (!isAPIError(call) && call.snapshots) {
				allSnapshots.push(...call.snapshots);
			}
		});

		// Sort by block number
		return allSnapshots.sort((a, b) => a.block - b.block);
	}, [feesCalls, activeCombos.length, isLoadingDepositorFees]);

	// Aggregate account fees from all vault combinations
	const accountFees = useMemo((): TAccountFees[] => {
		if (activeCombos.length === 0) {
			return [];
		}

		if (isLoadingDepositorFees || feesCalls.length !== activeCombos.length) {
			return [];
		}

		const allAccounts: TAccountFees[] = [];

		feesCalls.forEach((call) => {
			if (!isAPIError(call) && call.accounts) {
				allAccounts.push(...call.accounts);
			}
		});

		return allAccounts;
	}, [feesCalls, activeCombos.length, isLoadingDepositorFees]);

	const vaultComboData = useMemo((): TVaultComboData[] => {
		if (vaultCombos.length === 0) {
			return [];
		}

		const allComboData = vaultCombos.map((combo): TVaultComboData => {
			const key = getComboKey(combo);
			const tvlCall = tvlCallsByKey.get(key);
			const feesCall = feesCallsByKey.get(key);
			const isActive = activeComboKeys.has(key);
			return {
				key,
				chainId: combo.chainId,
				vaultAddress: combo.vaultAddress,
				addresses: combo.addresses,
				assetAddress: vaultAssetAddressByKey.get(key),
				tvl: tvlCall && !isAPIError(tvlCall) ? tvlCall : undefined,
				fees: feesCall && !isAPIError(feesCall) ? feesCall : undefined,
				chart: feesCall && !isAPIError(feesCall) ? feesCall : undefined,
				isLoadingTVL: isActive ? Boolean(isLoadingDepositorTVL) : false,
				isLoadingFees: isActive ? Boolean(isLoadingDepositorFees) : false,
				isLoadingChart: isActive ? Boolean(isLoadingDepositorFees) : false
			};
		});

		// Filter out non-endorsed vaults and strategies (lazy loaded)
		// If endorsement/vault type checks haven't completed yet, show all vaults
		let filteredData = allComboData;

		// Filter by endorsement if we have endorsement data
		if (endorsementMap.size > 0) {
			filteredData = filteredData.filter((combo): boolean => {
				const endorsementKey = `${combo.chainId}:${combo.vaultAddress.toLowerCase()}`;
				const isEndorsed = endorsementMap.get(endorsementKey);
				// Only include if endorsed (exclude if explicitly false or missing)
				return isEndorsed === true;
			});
		}

		// Filter out strategies if we have vault type data
		if (vaultTypeMap.size > 0) {
			filteredData = filteredData.filter((combo): boolean => {
				const vaultTypeKey = `${combo.chainId}:${combo.vaultAddress.toLowerCase()}`;
				const vaultType = vaultTypeMap.get(vaultTypeKey);
				// Check if this address is whitelisted (should not be filtered)
				const whitelistedAddresses = VAULT_WHITELIST[combo.chainId] || [];
				const isWhitelisted = whitelistedAddresses.includes(combo.vaultAddress.toLowerCase());
				// Include if it's a vault OR if it's whitelisted
				return vaultType === 'vault' || isWhitelisted;
			});
		}

		return filteredData;
	}, [activeComboKeys, feesCallsByKey, tvlCallsByKey, vaultCombos, vaultAssetAddressByKey, isLoadingDepositorTVL, isLoadingDepositorFees, endorsementMap, vaultTypeMap]);

	const apiErrors = useMemo((): string[] => {
		const errors: string[] = [];
		const pushError = (item: TPartnerTVLResponse | TPartnerFeesResponse | TAPIError): void => {
			if (isAPIError(item) && !errors.includes(item.error)) {
				errors.push(item.error);
			}
		};
		tvlCalls.forEach(pushError);
		feesCalls.forEach(pushError);
		return errors;
	}, [tvlCalls, feesCalls]);

	const userCount = useMemo((): number | undefined => {
		if (depositorAddresses.length === 0) {
			return undefined;
		}
		return depositorAddresses.length;
	}, [depositorAddresses.length]);

	// For backward compatibility, return the first chain/vault combination.
	// tvlOverride/feesOverride reflect the active scope: selected vault or total.
	const firstCombo = vaultCombos[0];

	return (
		<Partner.Provider
			value={{
				vaults: vaults,
				isLoadingVaults,
				isLoadingFees,
					isLoadingChart,
					tvlOverride,
					userCount,
					feesOverride,
					chainId: firstCombo?.chainId,
					vaultAddress: firstCombo?.vaultAddress,
					chartSnapshots,
					accountFees,
					vaultComboData,
					apiErrors,
					selectedVaultKey: selectedVaultKey || firstComboKey,
					setSelectedVaultKey
				}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
export type {TVaultComboData};
