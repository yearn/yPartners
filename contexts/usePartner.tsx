import {createContext, useContext, useMemo}	from 'react';
import {PARTNER_ADDRESS_GROUPS, PARTNER_VAULT_CONFIG, SHAREABLE_ADDRESSES} from 'utils/Partners';
import useSWR from 'swr';
import {baseFetcher} from 'lib/yearn/utils/fetchers';
import {toAddress} from 'lib/yearn/utils/address';

import type {ReactElement} from 'react';
import type {SWRResponse} from 'swr';
import type {TPartnerVault} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';
import type {TAddress} from 'lib/yearn/utils/address';

type TPartnerContext = {
	vaults: TDict<TPartnerVault>,
	isLoadingVaults: boolean,
	isLoadingFees: boolean,
	tvlOverride?: number,
	userCount?: number,
	feesOverride?: number,
	chainId?: number,
	vaultAddress?: TAddress,
}

const	defaultProps: TPartnerContext = {
	vaults: {},
	isLoadingVaults: false,
	isLoadingFees: false,
	tvlOverride: undefined,
	userCount: undefined,
	feesOverride: undefined,
	chainId: undefined,
	vaultAddress: undefined
};

const	Partner = createContext<TPartnerContext>(defaultProps);

type TPartnerTVLResponse = {
	vaultAddress: string,
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

type TPartnerFeesResponse = {
	totalFeesNormalized: number,
	accounts: {
		address: string,
		totalFees: string,
		totalFeesNormalized: number
	}[]
};

type TVaultCombo = {
	chainId: number;
	vaultAddress: TAddress;
	addresses: TAddress[];
};

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

	// Make API calls for each vault combination
	const tvlCalls = vaultCombos.map((combo) => {
		const key = typeof window !== 'undefined' && combo.addresses.length > 0
			? `/api/partner-tvl?addresses=${combo.addresses.join(',')}&vaultAddress=${combo.vaultAddress}&chainId=${combo.chainId}`
			: null;
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useSWR(key, baseFetcher, {revalidateOnFocus: false}) as SWRResponse<TPartnerTVLResponse>;
	});

	const feesCalls = vaultCombos.map((combo) => {
		const key = typeof window !== 'undefined' && combo.addresses.length > 0
			? `/api/partner-fees?addresses=${combo.addresses.join(',')}&vaultAddress=${combo.vaultAddress}&chainId=${combo.chainId}${windowDays ? `&days=${windowDays}` : ''}`
			: null;
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useSWR(key, baseFetcher, {revalidateOnFocus: false}) as SWRResponse<TPartnerFeesResponse>;
	});

	const isLoadingDepositorTVL = tvlCalls.some((call) => call.isLoading);
	const isLoadingDepositorFees = feesCalls.some((call) => call.isLoading);

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

	const	vaults = useMemo((): TDict<TPartnerVault> => {
		// Yearn Vision data usage is disabled; returning empty vault list.
		return {};
	}, []);

	// Aggregate TVL from all vault combinations
	const tvlOverride = useMemo((): number | undefined => {
		if (tvlCalls.length === 0) {
			return undefined;
		}

		// If any call is still loading, return undefined
		if (tvlCalls.some((call) => call.isLoading)) {
			return undefined;
		}

		let totalTVL = 0;
		let hasData = false;

		tvlCalls.forEach((call) => {
			if (call.data && typeof call.data.totalCurrentValueNormalized === 'number') {
				totalTVL += call.data.totalCurrentValueNormalized;
				hasData = true;
			}
		});

		return hasData ? totalTVL : undefined;
	}, [tvlCalls]);

	// Aggregate fees from all vault combinations
	const feesOverride = useMemo((): number | undefined => {
		if (feesCalls.length === 0) {
			return undefined;
		}

		// If any call is still loading, return undefined
		if (feesCalls.some((call) => call.isLoading)) {
			return undefined;
		}

		let totalFees = 0;
		let hasData = false;

		feesCalls.forEach((call) => {
			if (call.data && typeof call.data.totalFeesNormalized === 'number') {
				totalFees += call.data.totalFeesNormalized;
				hasData = true;
			}
		});

		return hasData ? totalFees : undefined;
	}, [feesCalls]);

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
				tvlOverride,
				userCount,
				feesOverride,
				chainId: firstCombo?.chainId,
				vaultAddress: firstCombo?.vaultAddress
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
