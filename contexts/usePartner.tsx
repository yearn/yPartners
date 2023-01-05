import	React, {createContext, useContext, useEffect, useMemo, useRef, useState}	from	'react';
import useSWR from 'swr';
import {baseFetcher} from '@yearn-finance/web-lib/utils/fetchers';

import LogoYearn from '../components/icons/LogoYearn';
import {LOGOS, PARTNER_SHORT_NAMES} from '../utils/b2b/Partners';

import type {Dispatch, MutableRefObject, ReactElement, SetStateAction} from 'react';
import type {SWRResponse} from 'swr';
import type {TPartnerVault, TPartnerVaultsByNetwork} from 'types/types';

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
	const	[partner, set_partner] = useState('');
	const	logo = useRef(<LogoYearn className={'text-900 h-full w-full opacity-0'}/>);

	useEffect((): void => {
		if(partner !== ''){
			logo.current = LOGOS[partner];
		}
	}, [partner]);

	// Conditonally fetch vault data when partner is set
	const	{data: payouts, isLoading: isLoadingVaults} = useSWR(
		partner ? `${process.env.YVISION_BASE_URI}/partners/${PARTNER_SHORT_NAMES[partner]}/payout_total` : null,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;

	// eslint-disable-next-line prefer-destructuring
	const vaultsAllNetworks= Object.values(payouts || {})[0] as TPartnerVaultsByNetwork;

	const	vaults = useMemo((): TPartnerVault[] => {
		if(!vaultsAllNetworks){
			return []; 
		}
	
		const _vaults: TPartnerVault[] = [];

		Object.keys(vaultsAllNetworks).forEach((network): void => {
			const vaultsByNetwork = vaultsAllNetworks[network];
			
			const vaultsAddresses = Object.keys(vaultsByNetwork);

			vaultsAddresses.forEach((address: string): void => {
				const _vault = {...vaultsByNetwork[address], network, address};

				if(_vault.balance > 0){
					_vaults.push(_vault);
				}
			});
		});	

		return _vaults;
	}, [vaultsAllNetworks]);
	
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
