import	React, {createContext, useContext, useEffect, useMemo, useRef, useState}	from	'react';
import {NETWORK_LABELS} from 'utils/b2b';
import useSWR from 'swr';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {baseFetcher} from '@yearn-finance/web-lib/utils/fetchers';

import LogoYearn from '../components/icons/LogoYearn';
import {LOGOS, PARTNER_SHORT_NAMES} from '../utils/b2b/Partners';

import type {Dispatch, MutableRefObject, ReactElement, SetStateAction} from 'react';
import type {SWRResponse} from 'swr';
import type {TPartnerVault, TPartnerVaultsByNetwork, TYearnVault} from 'types/types';

type TPartnerContext = {
	partner: string,
	logo?: MutableRefObject<ReactElement>,
	set_partner?: Dispatch<SetStateAction<string>>
	vaults: TPartnerVault[],
	isLoadingVaults: boolean,
}

const	defaultProps: TPartnerContext = {
	partner: '',
	vaults: [],
	isLoadingVaults: false
};

const	Partner = createContext<TPartnerContext>(defaultProps);

export const PartnerContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	{chainID} = useWeb3();
	const	[partner, set_partner] = useState('');
	const	logo = useRef(<LogoYearn className={'text-900 h-full w-full opacity-0'}/>);

	const isObjectEmpty = (obj: object): boolean => Object.values(obj).length === 0;

	useEffect((): void => {
		if(partner !== ''){
			logo.current = LOGOS[partner];
		}
	}, [partner]);

	const	{data: yVaults} = useSWR(
		`${process.env.YDAEMON_BASE_URI}/${chainID}/vaults/all?strategiesDetails=withDetails`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;

	// Conditonally fetch vault data when partner is set
	const	{data: payouts, isLoading: isLoadingVaults} = useSWR(
		partner ? `${process.env.YVISION_BASE_URI}/partners/${PARTNER_SHORT_NAMES[partner]}/payout_total` : null,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;


	const	vaults = useMemo((): TPartnerVault[] => {
		const currentNetwork = NETWORK_LABELS[chainID];

		const vaultsAllNetworks = Object.values(payouts || {})[0] as TPartnerVaultsByNetwork;
		const vaultsCurrentNetwork = vaultsAllNetworks ? vaultsAllNetworks[currentNetwork]: {};

		if(!payouts || !yVaults || !vaultsCurrentNetwork || isObjectEmpty(vaultsAllNetworks)){
			return []; 
		}

		const _vaults: TPartnerVault[] = [];
	
		//Iterate yVaults add relevant details to parter matches
		yVaults.forEach((yVault: TYearnVault): void => {
			const partnerVault = vaultsCurrentNetwork[yVault.address];

			if(partnerVault){
				const {riskScore, apy} = yVault;

				const _vault = {...partnerVault, riskScore, apy: apy.net_apy};

				if(_vault.balance > 0){
					_vaults.push(_vault);
				}
			}
		});
		
		return _vaults;
	}, [chainID, payouts, yVaults]);

	return (
		<Partner.Provider
			value={{
				partner,
				set_partner,
				logo,
				vaults: vaults,
				isLoadingVaults
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
