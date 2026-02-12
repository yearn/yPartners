import {createContext, useContext, useMemo}	from 'react';
import {PARTNER_ADDRESS_GROUPS, PARTNER_VAULT_CONFIG, SHAREABLE_ADDRESSES} from 'utils/Partners';
import useSWR from 'swr';
import {baseFetcher} from 'lib/yearn/utils/fetchers';
import {toAddress} from 'lib/yearn/utils/address';

import type {ReactElement} from 'react';
import type {TPartnerVault} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';
import type {TAddress} from 'lib/yearn/utils/address';

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
	apiErrors: string[]
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
	apiErrors: []
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

type TVaultCombo = {
	chainId: number;
	vaultAddress: TAddress;
	addresses: TAddress[];
};

type TVaultComboData = {
	key: string;
	chainId: number;
	vaultAddress: TAddress;
	addresses: TAddress[];
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

export const PartnerContextApp = ({
	partnerID,
	children,
	windowDays
}: {partnerID: string, children: ReactElement, windowDays?: number}): ReactElement => {
	const currentPartner = SHAREABLE_ADDRESSES[partnerID] ? SHAREABLE_ADDRESSES[partnerID].shortName : '';
	const depositorAddresses = currentPartner ? PARTNER_ADDRESS_GROUPS[currentPartner] || [] : [];
	const isSSR = typeof window === 'undefined';

	// Extract all chain/vault combinations for this partner
	const vaultCombos = useMemo((): TVaultCombo[] => {
		if (!currentPartner || !PARTNER_VAULT_CONFIG[currentPartner]) {
			return [];
		}

		const combos: TVaultCombo[] = [];
		const chainConfig = PARTNER_VAULT_CONFIG[currentPartner];

		Object.entries(chainConfig).forEach(([chainIdStr, vaultConfig]) => {
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
	}, [currentPartner]);

	const shouldFetchCombos = !isSSR && vaultCombos.length > 0;
	const comboIdentityKey = useMemo((): string => {
		return vaultCombos
			.map((combo): string => `${combo.chainId}:${combo.vaultAddress.toLowerCase()}:${combo.addresses.join(',').toLowerCase()}`)
			.join('|');
	}, [vaultCombos]);

	const {data: tvlResults, isLoading: isLoadingDepositorTVL} = useSWR<(TPartnerTVLResponse | TAPIError)[]>(
		shouldFetchCombos ? ['partner-tvl', comboIdentityKey] : null,
		async (): Promise<(TPartnerTVLResponse | TAPIError)[]> => Promise.all(
			vaultCombos.map((combo) => baseFetcher<TPartnerTVLResponse | TAPIError>(buildPartnerTVLUrl(combo)))
		),
		{revalidateOnFocus: false}
	);

	const {data: feesResults, isLoading: isLoadingDepositorFees} = useSWR<(TPartnerFeesResponse | TAPIError)[]>(
		shouldFetchCombos ? ['partner-fees', comboIdentityKey, windowDays] : null,
		async (): Promise<(TPartnerFeesResponse | TAPIError)[]> => Promise.all(
			vaultCombos.map((combo) => baseFetcher<TPartnerFeesResponse | TAPIError>(buildPartnerFeesUrl(combo, windowDays, false)))
		),
		{revalidateOnFocus: false}
	);

	const {data: chartResults, isLoading: isLoadingDepositorChart} = useSWR<(TPartnerFeesResponse | TAPIError)[]>(
		shouldFetchCombos ? ['partner-fees-chart', comboIdentityKey, windowDays] : null,
		async (): Promise<(TPartnerFeesResponse | TAPIError)[]> => Promise.all(
			vaultCombos.map((combo) => baseFetcher<TPartnerFeesResponse | TAPIError>(buildPartnerFeesUrl(combo, windowDays, true)))
		),
		{revalidateOnFocus: false}
	);

	const tvlCalls = tvlResults ?? [];
	const feesCalls = feesResults ?? [];
	const chartCalls = chartResults ?? [];

	const isLoadingVaults = useMemo((): boolean => {
		if (depositorAddresses.length === 0) {
			return false;
		}
		if (isSSR) {
			// During SSR mark as loading so server and client render the same markup.
			return true;
		}
		return isLoadingDepositorTVL;
	}, [depositorAddresses.length, isSSR, isLoadingDepositorTVL]);

	const isLoadingFees = useMemo((): boolean => {
		if (depositorAddresses.length === 0) {
			return false;
		}
		if (isSSR) {
			return true;
		}
		return isLoadingDepositorFees;
	}, [depositorAddresses.length, isSSR, isLoadingDepositorFees]);

	const isLoadingChart = useMemo((): boolean => {
		if (depositorAddresses.length === 0) {
			return false;
		}
		if (isSSR) {
			return true;
		}
		return isLoadingDepositorChart;
	}, [depositorAddresses.length, isSSR, isLoadingDepositorChart]);

	const	vaults = useMemo((): TDict<TPartnerVault> => {
		// Yearn Vision data usage is disabled; returning empty vault list.
		return {};
	}, []);

	// Aggregate TVL from all vault combinations
	const tvlOverride = useMemo((): number | undefined => {
		if (vaultCombos.length === 0) {
			return undefined;
		}

		if (isLoadingDepositorTVL || tvlCalls.length !== vaultCombos.length) {
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
	}, [tvlCalls, vaultCombos.length, isLoadingDepositorTVL]);

	// Aggregate fees from all vault combinations
	const feesOverride = useMemo((): number | undefined => {
		if (vaultCombos.length === 0) {
			return undefined;
		}

		if (isLoadingDepositorFees || feesCalls.length !== vaultCombos.length) {
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
	}, [feesCalls, vaultCombos.length, isLoadingDepositorFees]);

	// Aggregate chart snapshots from all vault combinations (uses separate chart calls)
	const chartSnapshots = useMemo((): TChartSnapshot[] => {
		if (vaultCombos.length === 0) {
			return [];
		}

		if (isLoadingDepositorChart || chartCalls.length !== vaultCombos.length) {
			return [];
		}

		const allSnapshots: TChartSnapshot[] = [];

		chartCalls.forEach((call) => {
			if (!isAPIError(call) && call.snapshots) {
				allSnapshots.push(...call.snapshots);
			}
		});

		// Sort by block number
		return allSnapshots.sort((a, b) => a.block - b.block);
	}, [chartCalls, vaultCombos.length, isLoadingDepositorChart]);

	// Aggregate account fees from all vault combinations
	const accountFees = useMemo((): TAccountFees[] => {
		if (vaultCombos.length === 0) {
			return [];
		}

		if (isLoadingDepositorFees || feesCalls.length !== vaultCombos.length) {
			return [];
		}

		const allAccounts: TAccountFees[] = [];

		feesCalls.forEach((call) => {
			if (!isAPIError(call) && call.accounts) {
				allAccounts.push(...call.accounts);
			}
		});

		return allAccounts;
	}, [feesCalls, vaultCombos.length, isLoadingDepositorFees]);

	const vaultComboData = useMemo((): TVaultComboData[] => {
		if (vaultCombos.length === 0) {
			return [];
		}

		return vaultCombos.map((combo, idx): TVaultComboData => {
			const key = `${combo.chainId}:${combo.vaultAddress.toLowerCase()}`;
			const tvlCall = tvlCalls[idx];
			const feesCall = feesCalls[idx];
			const chartCall = chartCalls[idx];
			return {
				key,
				chainId: combo.chainId,
				vaultAddress: combo.vaultAddress,
				addresses: combo.addresses,
				tvl: tvlCall && !isAPIError(tvlCall) ? tvlCall : undefined,
				fees: feesCall && !isAPIError(feesCall) ? feesCall : undefined,
				chart: chartCall && !isAPIError(chartCall) ? chartCall : undefined,
				isLoadingTVL: Boolean(isLoadingDepositorTVL),
				isLoadingFees: Boolean(isLoadingDepositorFees),
				isLoadingChart: Boolean(isLoadingDepositorChart)
			};
		});
	}, [chartCalls, feesCalls, tvlCalls, vaultCombos, isLoadingDepositorTVL, isLoadingDepositorFees, isLoadingDepositorChart]);

	const apiErrors = useMemo((): string[] => {
		const errors: string[] = [];
		const pushError = (item: TPartnerTVLResponse | TPartnerFeesResponse | TAPIError): void => {
			if (isAPIError(item) && !errors.includes(item.error)) {
				errors.push(item.error);
			}
		};
		tvlCalls.forEach(pushError);
		feesCalls.forEach(pushError);
		chartCalls.forEach(pushError);
		return errors;
	}, [tvlCalls, feesCalls, chartCalls]);

	const userCount = useMemo((): number | undefined => {
		if (depositorAddresses.length === 0) {
			return undefined;
		}
		return depositorAddresses.length;
	}, [depositorAddresses.length]);

	// For backward compatibility, return the first chain/vault combination
	// Note: tvlOverride and feesOverride are aggregated across ALL chains/vaults
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
				apiErrors
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
export type {TVaultComboData};
