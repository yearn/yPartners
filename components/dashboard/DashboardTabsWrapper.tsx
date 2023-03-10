import React, {Fragment, useMemo, useState} from 'react';
import OverviewChart from 'components/graphs/OverviewChart';
import IconChevronDown from 'components/icons/IconChevronDown';
import dayjs, {extend, unix} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {getExplorerURL, NETWORK_CHAINID, NETWORK_LABELS} from 'utils/b2b';
import {PROFIT_SHARE_TEIRS} from 'utils/b2b/Partners';
import axios from 'axios';
import {Listbox, Transition} from '@headlessui/react';
import {Button} from '@yearn-finance/web-lib/components/Button';
import IconCopy from '@yearn-finance/web-lib/icons/IconCopy';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {copyToClipboard} from '@yearn-finance/web-lib/utils/helpers';

import {usePartner} from '../../contexts/usePartner';
import VaultChart from '../graphs/VaultChart';
import SummaryMetrics from './SummaryMetrics';

import type {AxiosResponse} from 'axios';
import type {MouseEvent, ReactElement} from 'react';
import type {TChartBar} from 'types/chart';
import type {TPartnerVaultsByNetwork} from 'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

extend(utc);

const dataWindows = [
	{name: '1 week', value: 7},
	{name: '1 month', value: 29},
	{name: '1 year', value: 365},
	{name: 'All time', value: 50}
];

type TProps = {
	selectedIndex: number,
	set_selectedIndex: React.Dispatch<React.SetStateAction<number>>
};

function	Tabs({selectedIndex, set_selectedIndex}: TProps): ReactElement {
	const	{vaults} = usePartner();

	const displayVaults = Object.values(vaults || []);
	const vaultCount = displayVaults.length;

	return (
		<>
			<nav className={`hidden flex-row items-center space-x-10 ${vaultCount > 5 ? '' : 'md:flex'}`}>
				<button
					onClick={(): void => set_selectedIndex(-1)}>
					<p
						title={'Overview'}
						aria-selected={selectedIndex === -1}
						className={'hover-fix tab'}>
						{'Overview'}
					</p>
				</button>
				{displayVaults.map((vault, idx): ReactElement => (
					<button
						key={`desktop-${idx}`}
						onClick={(): void => set_selectedIndex(idx)}>
						<p
							aria-selected={selectedIndex === idx}
							className={'hover-fix tab'}>
							{`${vault.token} - ${NETWORK_LABELS[vault.chainID]}`}
						</p>
					</button>
				))}
			</nav>
			<div className={'relative z-50'}>
				<Listbox
					value={selectedIndex}
					onChange={(value): void => {
						set_selectedIndex(value);
					}}>
					{({open}): ReactElement => (
						<>
							<Listbox.Button
								className={`flex h-10 w-40 flex-row items-center border-0 border-b-2 border-neutral-900 bg-neutral-100 p-0 font-bold focus:border-neutral-900 ${vaultCount > 5 ? '' : 'md:hidden'}`}>
								<div className={'relative flex flex-row items-center'}>
									{displayVaults[selectedIndex] ? 
										`${displayVaults[selectedIndex].token} - ${NETWORK_LABELS[displayVaults[selectedIndex]?.chainID]}` 
										: 'Overview'}
								</div>
								<div className={'absolute right-0'}>
									<IconChevronDown
										className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
								</div>
							</Listbox.Button>
							<Transition
								as={Fragment}
								show={open}
								enter={'transition duration-100 ease-out'}
								enterFrom={'transform scale-95 opacity-0'}
								enterTo={'transform scale-100 opacity-100'}
								leave={'transition duration-75 ease-out'}
								leaveFrom={'transform scale-100 opacity-100'}
								leaveTo={'transform scale-95 opacity-0'}>
								<Listbox.Options style={{scrollbarWidth: 'thin'}} className={'yearn--listbox-menu'}>
									<Listbox.Option
										className={'yearn--listbox-menu-item'}
										value={-1}>
										{'Overview'}
									</Listbox.Option>

									{displayVaults.map((vault, idx): ReactElement => (
										<Listbox.Option
											className={'yearn--listbox-menu-item'}
											key={idx}
											value={idx}>
											{`${vault.token} - ${NETWORK_LABELS[vault.chainID]}`}
										</Listbox.Option>
									))}
								</Listbox.Options>
							</Transition>
						</>
					)}
				</Listbox>
			</div>
		</>
	);
}

function	DashboardTabsWrapper(props: {partnerID: string}): ReactElement {
	const {partnerID} = props;
	const {vaults} = usePartner();
	const [selectedIndex, set_selectedIndex] = useState(-1);
	const [activeWindow, set_activeWindow] = useState('1 month');
	const [windowValue, set_windowValue] = useState(29);
	const [balanceTVLs, set_balanceTVLs] = useState<TDict<TChartBar[]>>();
	const [wrapperTotals, set_wrapperTotals] = useState<TChartBar[]>();
	const [payoutTotals, set_payoutTotals] = useState<TDict<TChartBar[]>>();

	const selectedVault = Object.values(vaults)[selectedIndex];

	const selectedAddress = selectedVault ? selectedVault.address : '';
	const selectedChainID = selectedVault ? selectedVault.chainID : 1;
	const selectedToken = selectedVault ? selectedVault.token : '';

	function handleWindowChange(e: MouseEvent<HTMLButtonElement>): void {
		const {name, value} = e.currentTarget;
		set_activeWindow(name);
		set_windowValue(+value);
	}


	useMemo((): void => {
		const baseBalanceURI = `${process.env.YVISION_BASE_URI}/partners/${partnerID}/balance`;
		const basePayoutURI = `${process.env.YVISION_BASE_URI}/partners/${partnerID}/payout_total`;

		const now = dayjs().unix();
		const startOfToday = dayjs().utc().startOf('D').unix();

		const balanceEndpoints = [`${baseBalanceURI}?ts=${now}`];
		const payoutEndpoints = [`${basePayoutURI}?ts=${now}`];
			
		for (let i = 1; i < windowValue; i++) {
			const ts = startOfToday - (86400 * i);
			balanceEndpoints.push(`${baseBalanceURI}?ts=${ts}`);
			payoutEndpoints.push(`${basePayoutURI}?ts=${ts}`);
		}

		// reverse so requests resolve with first elements being the oldest
		balanceEndpoints.reverse();
		payoutEndpoints.reverse();

		const partnerBalanceTVL: TDict<TChartBar[]> = {};
		const _wrapperTotals: TDict<TChartBar> = {};

		Promise.all(balanceEndpoints.map(async (endpoint): Promise<AxiosResponse> => axios.get(endpoint))).then(
			(responses): void => {
				responses.forEach(({data}): void => {
					const vaultsAllNetworksOject = Object.values(data || {})[0] as TPartnerVaultsByNetwork;

					for (const [networkName, vaultsForNetwork] of Object.entries(vaultsAllNetworksOject || {})) {
						const	chainID = NETWORK_CHAINID[networkName];

						for (const [vaultAddress, currentVault] of Object.entries(vaultsForNetwork || {})) {
							const vaultBalanceArray = partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`];
							const date = unix(data.ts).format('MMM DD YYYY');
							const shortDate = unix(data.ts).format('MMM DD');
							const {token} = currentVault;
							
							if (currentVault.tvl > 0) {
								const dataPoint = {name: date, shortDate, data: {balanceTVL: currentVault.tvl}, token};

								if(vaultBalanceArray){
									partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`].push(dataPoint);
								}else{
									partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`] = [dataPoint];
								}
	
								// Sum TVLs by day for aggregate wrapper balance chart
								const dailyTVL = _wrapperTotals[date];
	
								if(dailyTVL){
									_wrapperTotals[date] = {...dailyTVL, data: {totalTVL: dailyTVL.data.totalTVL + currentVault.tvl}};
								}else{
									_wrapperTotals[date] = {name: date, shortDate, data: {totalTVL: currentVault.tvl}};
								}
							}

						}
					}
				});


				// Assign profit share tiers based on contributed TVL
				const wrapperData = Object.values(_wrapperTotals).map((item): TChartBar => {
					const shareTiers = Object.keys(PROFIT_SHARE_TEIRS);
					let partnerTier = 0;
					
					for (const tierPercent of shareTiers) {
						if(item.data.totalTVL > PROFIT_SHARE_TEIRS[tierPercent]){
							partnerTier = +tierPercent;
						}else {
							break;
						}
					}

					return {...item, data: {...item.data, profitShare: partnerTier}};
				});

				set_balanceTVLs(partnerBalanceTVL);
				set_wrapperTotals(wrapperData);
			});

			
		const partnerPayoutTotals: TDict<TChartBar[]> = {};

		Promise.all(payoutEndpoints.map(async (endpoint): Promise<AxiosResponse> => axios.get(endpoint))).then(
			(responses): void => {
				responses.forEach(({data}): void => {
					const vaultsAllNetworksOject = Object.values(data || {})[0] as TPartnerVaultsByNetwork;

					for (const [networkName, vaultsForNetwork] of Object.entries(vaultsAllNetworksOject || {})) {
						const	chainID = NETWORK_CHAINID[networkName];

						for (const [vaultAddress, currentVault] of Object.entries(vaultsForNetwork || {})) {
							const vaultPayoutArray = partnerPayoutTotals[`${toAddress(vaultAddress)}_${chainID}`];
							const date = unix(data.ts).format('MMM DD YYYY');
							const shortDate = unix(data.ts).format('MMM DD');
							const {token} = currentVault;
							
							if (currentVault.tvl > 0) {
								const dataPoint = {name: date, shortDate, data: {feePayout: currentVault.tvl}, token};

								if(vaultPayoutArray){
									partnerPayoutTotals[`${toAddress(vaultAddress)}_${chainID}`].push(dataPoint);
								}else{
									partnerPayoutTotals[`${toAddress(vaultAddress)}_${chainID}`] = [dataPoint];
								}
							}
						}
					}
				});

				set_payoutTotals(partnerPayoutTotals);
			});

	}, [partnerID, windowValue]);

	return (
		<div aria-label={'Vault Details'} className={'col-span-12 mb-4 flex flex-col bg-neutral-100'}>
			<div className={'relative flex w-full flex-row items-center justify-between px-4 pt-4 md:px-8'}>
				<Tabs
					selectedIndex={selectedIndex}
					set_selectedIndex={set_selectedIndex} />

				<div className={'flex flex-row items-center justify-end space-x-2 pb-0 md:pb-4 md:last:space-x-4'}>
					<a
						className={ selectedIndex === -1 ? 'hidden' : ''}
						href={`${getExplorerURL(selectedChainID)}/address/${selectedAddress}`}
						target={'_blank'}
						rel={'noopener noreferrer'}>
						<span className={'sr-only'}>{'Open in explorer'}</span>
						<IconLinkOut className={'h-5 w-5 cursor-alias text-neutral-600 transition-colors hover:text-neutral-900 md:h-6 md:w-6'} />
					</a>
					<button
						onClick={(): void => copyToClipboard(selectedAddress)}
						className={ selectedIndex === -1 ? 'hidden' : ''}>
						<span className={'sr-only'}>{'Copy address'}</span>
						<IconCopy className={'h-5 w-5 text-neutral-600 transition-colors hover:text-neutral-900 md:h-6 md:w-6'} />
					</button>
				</div>
			</div>

			<div className={'-mt-0.5 h-0.5 w-full bg-neutral-300'} />

			<div className={'mt-10 flex flex-row space-x-4'}>
				{dataWindows.map((window): ReactElement => (
					<Button
						disabled={window.value === 365}
						key={window.name}
						name={window.name}
						value={window.value}
						className={'w-[90px] text-xs md:w-[100px] md:text-base'}
						variant={window.name === activeWindow ? 'filled' : 'outlined'}
						onClick={handleWindowChange}>
						{window.name}
					</Button>
				))}
			</div>

			<SummaryMetrics
				vaults={vaults}
				vault={selectedVault}
				selectedIndex={selectedIndex}/>

			{ !balanceTVLs || !wrapperTotals || !payoutTotals ? 
				<h1>{'Generating visuals...'}</h1> : (
					<>			
						{Object.values(vaults || []).map((_, idx): ReactElement | null => {
							return idx === selectedIndex ? <VaultChart
								key={idx}
								address={selectedAddress}
								token={selectedToken}
								activeWindow={activeWindow}
								windowValue={windowValue}
								balanceTVL={balanceTVLs[`${selectedAddress}_${selectedChainID}`]}
								payoutTotal={payoutTotals[`${selectedAddress}_${selectedChainID}`] || []}
							/> : null;
						})}

						{selectedIndex === -1 ? <OverviewChart
							activeWindow={activeWindow}
							windowValue={windowValue}
							wrapperTotals={wrapperTotals}
							balanceTVLs={balanceTVLs}
							payoutTotals={payoutTotals}
						/> : null}
					</>
				)}
		</div>
	);
}

export {DashboardTabsWrapper};
