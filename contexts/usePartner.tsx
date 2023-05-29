import {createContext, useContext, useMemo}	from 'react';
import {useYearn} from 'contexts/useYearn';
import {NETWORK_CHAINID} from 'utils';
import {SHAREABLE_ADDRESSES} from 'utils/Partners';
import useSWR from 'swr';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {baseFetcher} from '@yearn-finance/web-lib/utils/fetchers';

import type {ReactElement} from 'react';
import type {SWRResponse} from 'swr';
import type {TPartnerVault, TPartnerVaultsByNetwork} from 'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

type TPartnerContext = {
	vaults: TDict<TPartnerVault>,
	isLoadingVaults: boolean,
}

const	defaultProps: TPartnerContext = {
	vaults: {},
	isLoadingVaults: false
};

const	Partner = createContext<TPartnerContext>(defaultProps);

export const PartnerContextApp = ({
	partnerID,
	children
}: {partnerID: string, children: ReactElement}): ReactElement => {
	const	{vaults: yVaults} = useYearn();
	const currentPartner = SHAREABLE_ADDRESSES[partnerID] ? SHAREABLE_ADDRESSES[partnerID].shortName : '';

	const	{data: balances, isLoading: isLoadingBalances} = useSWR(
		`${process.env.YVISION_BASE_URI}/partners/${currentPartner}/balance`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;
	
	const	{data: payouts, isLoading: isLoadingPayouts} = useSWR(
		`${process.env.YVISION_BASE_URI}/partners/${currentPartner}/payout_total`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;

	const	vaults = useMemo((): TDict<TPartnerVault> => {
		if(!balances || !payouts) {
			return {};
		}

		const balancesAllNetworksOject = Object.values(balances || {})[0] as TPartnerVaultsByNetwork;
		const payoutsAllNetworksOject = Object.values(payouts || {})[0] as TPartnerVaultsByNetwork;
		
		const partnerVaults: TDict<TPartnerVault> = {};

		for (const [networkName, vaultsForNetwork] of Object.entries(balancesAllNetworksOject || {})) {
			const	chainID = NETWORK_CHAINID[networkName];
			for (const [vaultAddress, currentVault] of Object.entries(vaultsForNetwork || {})) {
				currentVault.chainID = chainID;
				currentVault.address = toAddress(vaultAddress);

				const	yVaultData = yVaults[currentVault.address];
				if (yVaultData) {
					const {riskScore, apy} = yVaultData;
					currentVault.riskScore = riskScore;
					currentVault.apy = apy.net_apy * 100;
					currentVault.totalPayout = payoutsAllNetworksOject[networkName][vaultAddress].tvl;
					if (currentVault.tvl > 0) {
						partnerVaults[`${currentVault.address}_${chainID}`] = currentVault;
					}
				}
			}
		}

		return partnerVaults;
	}, [balances, payouts, yVaults]);

	return (
		<Partner.Provider
			value={{
				vaults: vaults,
				isLoadingVaults: isLoadingBalances || isLoadingPayouts
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
