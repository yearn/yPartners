import {createContext, useContext, useMemo}	from 'react';
import {PARTNER_ADDRESS_GROUPS, SHAREABLE_ADDRESSES} from 'utils/Partners';
import useSWR from 'swr';
import {baseFetcher} from 'lib/yearn/utils/fetchers';

import type {ReactElement} from 'react';
import type {SWRResponse} from 'swr';
import type {TPartnerVault} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';

type TPartnerContext = {
	vaults: TDict<TPartnerVault>,
	isLoadingVaults: boolean,
	tvlOverride?: number,
	userCount?: number,
	feesOverride?: number,
}

const	defaultProps: TPartnerContext = {
	vaults: {},
	isLoadingVaults: false,
	tvlOverride: undefined,
	userCount: undefined,
	feesOverride: undefined
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

export const PartnerContextApp = ({
	partnerID,
	children
}: {partnerID: string, children: ReactElement}): ReactElement => {
	const currentPartner = SHAREABLE_ADDRESSES[partnerID] ? SHAREABLE_ADDRESSES[partnerID].shortName : '';
	const depositorAddresses = currentPartner ? PARTNER_ADDRESS_GROUPS[currentPartner] || [] : [];
	const isSSR = typeof window === 'undefined';

	const {data: depositorTVL, isLoading: isLoadingDepositorTVL} = useSWR(
		typeof window !== 'undefined' && depositorAddresses.length > 0 ? `/api/partner-tvl?addresses=${depositorAddresses.join(',')}` : null,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse<TPartnerTVLResponse>;

	const {data: depositorFees, isLoading: isLoadingDepositorFees} = useSWR(
		typeof window !== 'undefined' && depositorAddresses.length > 0 ? `/api/partner-fees?addresses=${depositorAddresses.join(',')}` : null,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse<TPartnerFeesResponse>;

	const isLoadingVaults = useMemo((): boolean => {
		if (depositorAddresses.length === 0) {
			return false;
		}
		if (isSSR) {
			// During SSR mark as loading so server and client render the same markup.
			return true;
		}
		return isLoadingDepositorTVL || isLoadingDepositorFees;
	}, [depositorAddresses.length, isSSR, isLoadingDepositorTVL, isLoadingDepositorFees]);

	const	vaults = useMemo((): TDict<TPartnerVault> => {
		// Yearn Vision data usage is disabled; returning empty vault list.
		return {};
	}, []);

	const tvlOverride = useMemo((): number | undefined => {
		if (!depositorTVL) {
			return undefined;
		}

		if (typeof depositorTVL.totalCurrentValueNormalized === 'number') {
			return depositorTVL.totalCurrentValueNormalized;
		}

		return undefined;
	}, [depositorTVL]);

	const feesOverride = useMemo((): number | undefined => {
		if (!depositorFees) {
			return undefined;
		}
		if (typeof depositorFees.totalFeesNormalized === 'number') {
			return depositorFees.totalFeesNormalized;
		}
		return undefined;
	}, [depositorFees]);

	const userCount = useMemo((): number | undefined => {
		if (depositorAddresses.length === 0) {
			return undefined;
		}
		return depositorAddresses.length;
	}, [depositorAddresses.length]);

	return (
		<Partner.Provider
			value={{
				vaults: vaults,
				isLoadingVaults,
				tvlOverride,
				userCount,
				feesOverride
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
