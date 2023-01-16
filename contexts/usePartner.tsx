import	React, {createContext, useContext, useEffect, useMemo, useRef, useState}	from	'react';
import useSWR from 'swr';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {baseFetcher} from '@yearn-finance/web-lib/utils/fetchers';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import LogoYearn from '../components/icons/LogoYearn';
import {LOGOS, PARTNER_SHORT_NAMES} from '../utils/b2b/Partners';

import type {Dispatch, MutableRefObject, ReactElement, SetStateAction} from 'react';
import type {SWRResponse} from 'swr';
import type {TPartnerVault, TPartnerVaultsByNetwork, TYearnVault} from 'types/types';

type TVaultDetail = {
	[address: string]: {
		riskScore: string,
		apy: string
	}
};

type TPartnerContext = {
	partner: string,
	logo?: MutableRefObject<ReactElement>,
	set_partner?: Dispatch<SetStateAction<string>>
	vaults: TPartnerVault[],
	yVaultDetails: TVaultDetail,
	isLoadingVaults: boolean,
}

const	defaultProps: TPartnerContext = {
	partner: '',
	vaults: [],
	yVaultDetails: {},
	isLoadingVaults: false
};

const	Partner = createContext<TPartnerContext>(defaultProps);

export const PartnerContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	{chainID} = useWeb3();
	const	[partner, set_partner] = useState('');
	const	logo = useRef(<LogoYearn className={'text-900 h-full w-full opacity-0'}/>);

	const formatPercent = (n: number, min = 2, max = 2): string => `${formatAmount(n || 0, min, max)}%`;

	useEffect((): void => {
		if(partner !== ''){
			logo.current = LOGOS[partner];
		}
	}, [partner]);

	// fetch all yearn vaults for the currently selected network
	const	{data: yVaultData} = useSWR(
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

	// eslint-disable-next-line prefer-destructuring
	const vaultsAllNetworks= Object.values(payouts || {})[0] as TPartnerVaultsByNetwork;

	// maybe rename to payouts,deposits, or balances 
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

	const yVaultDetails = useMemo((): TVaultDetail => {
		if(!yVaultData){
			return {}; 
		}
	
		const _yVaultDetails: TVaultDetail = {};

		yVaultData.forEach((vault: TYearnVault): void => {
			const netAPY = formatPercent(vault.apy.net_apy);
			const riskScore = formatAmount(vault.riskScore);

			_yVaultDetails[vault.address] = {riskScore, apy: netAPY};
		});

		return _yVaultDetails;
	}, [yVaultData]);


	return (
		<Partner.Provider
			value={{
				partner,
				set_partner,
				logo,
				vaults: vaults,
				yVaultDetails: yVaultDetails,
				isLoadingVaults
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
