import	React, {createContext, useContext, useMemo}	from 'react';
import {useYearn} from 'contexts/useYearn';
import {NETWORK_CHAINID} from 'utils/b2b';
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
	const	{data: payouts, isLoading: isLoadingVaults} = useSWR(
		`${process.env.YVISION_BASE_URI}/partners/${partnerID}/payout_total`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;

	const	vaults = useMemo((): TDict<TPartnerVault> => {
		const vaultsAllNetworksOject = Object.values(payouts || {})[0] as TPartnerVaultsByNetwork;
		const partnerVaults: TDict<TPartnerVault> = {};
		for (const [networkName, vaultsForNetwork] of Object.entries(vaultsAllNetworksOject || {})) {
			const	chainID = NETWORK_CHAINID[networkName];
			for (const [vaultAddress, currentVault] of Object.entries(vaultsForNetwork || {})) {
				currentVault.chainID = chainID;
				currentVault.address = toAddress(vaultAddress);

				const	yVaultData = yVaults[currentVault.address];
				if (yVaultData) {
					const {riskScore, apy} = yVaultData;
					currentVault.riskScore = riskScore;
					currentVault.apy = apy.net_apy;
					if (currentVault.balance > 0) {
						partnerVaults[`${currentVault.address}_${chainID}`] = currentVault;
					}
				}
			}
		}

		return partnerVaults;
	}, [payouts, yVaults]);

	return (
		<Partner.Provider
			value={{
				vaults: vaults,
				isLoadingVaults
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
