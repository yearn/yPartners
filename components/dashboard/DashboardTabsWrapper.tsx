import {Fragment, memo, useMemo, useState} from 'react';
import OverviewChart from 'components/graphs/OverviewChart';
import IconChevronDown from 'components/icons/IconChevronDown';
import BalanceProfitChart from 'components/charts/BalanceProfitChart';
import AccountFeesTable from 'components/dashboard/AccountFeesTable';
import {getExplorerURL, NETWORK_LABELS} from 'utils';
import {Listbox, Transition} from '@headlessui/react';
import {Button} from 'lib/yearn/components/Button';
import IconCopy from 'lib/yearn/icons/IconCopy';
import IconLinkOut from 'lib/yearn/icons/IconLinkOut';
import {copyToClipboard} from 'lib/yearn/utils/helpers';
import performBatchedUpdates from 'lib/yearn/utils/performBatchedUpdates';
import {truncateHex} from 'lib/yearn/utils/address';
import Image from 'next/image';
import {getChainLogoUrl, getTokenLogoUrl} from 'lib/crypto/tokenLogos';

import {usePartner} from '../../contexts/usePartner';
import type {TVaultComboData} from '../../contexts/usePartner';
import VaultChart from '../graphs/VaultChart';
import SummaryMetrics from './SummaryMetrics';

import type {MouseEvent, ReactElement} from 'react';
import type {TChartBar} from 'types/chart';
import type {TDict} from 'lib/yearn/utils/types';

const dataWindows = [
	{name: '1 week', value: 7},
	{name: '1 month', value: 29},
	{name: '3 month', value: 90},
	{name: 'All time', value: 365}
];

type TProps = {
	selectedIndex: number,
	set_selectedIndex: React.Dispatch<React.SetStateAction<number>>
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function getComboAssetAddress(combo?: TVaultComboData): string | undefined {
	return combo?.fees?.assetAddress ?? combo?.tvl?.assetAddress ?? combo?.assetAddress;
}

function getComboAssetSymbol(combo?: TVaultComboData): string | undefined {
	return combo?.fees?.assetSymbol ?? combo?.tvl?.assetSymbol;
}

function getComboTokenLogoSrc(combo?: TVaultComboData): string | null {
	if (!combo) {
		return null;
	}
	const assetAddress = getComboAssetAddress(combo);
	if (!assetAddress || assetAddress.toLowerCase() === ZERO_ADDRESS) {
		return null;
	}
	return getTokenLogoUrl(combo.chainId, assetAddress);
}

function getComboChainLogoSrc(combo?: TVaultComboData): string | null {
	if (!combo) {
		return null;
	}
	return getChainLogoUrl(combo.chainId);
}

type TVaultOptionLabelProps = {
	tokenLogoSrc: string | null;
	chainLogoSrc: string | null;
	label: string;
};

const VaultOptionLabel = memo(function VaultOptionLabel({
	tokenLogoSrc,
	chainLogoSrc,
	label
}: TVaultOptionLabelProps): ReactElement {
	return (
		<span className={'flex items-center gap-2'}>
			{tokenLogoSrc ? (
				<Image src={tokenLogoSrc} alt={'Token logo'} width={16} height={16} className={'h-4 w-4'} />
			) : null}
			{chainLogoSrc ? (
				<Image src={chainLogoSrc} alt={'Chain logo'} width={16} height={16} className={'h-4 w-4'} />
			) : null}
			<span>{label}</span>
		</span>
	);
});

function	Tabs({selectedIndex, set_selectedIndex}: TProps): ReactElement {
	const	{vaults} = usePartner();

	const displayVaults = Object.values(vaults || []);
	const vaultCount = displayVaults.length;

	if (vaultCount === 0) {
		return <></>;
	}

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
							title={`${vault.token} - ${NETWORK_LABELS[vault.chainID]}`}
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
								className={`flex h-10 w-50 flex-row items-center border-0 border-b-2 border-neutral-900 bg-neutral-100 p-0 font-bold focus:border-neutral-900 ${vaultCount > 5 ? '' : 'md:hidden'}`}>
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

function	DashboardTabsWrapper({partnerID: _partnerID, windowValue, onWindowChange}: {partnerID: string, windowValue: number, onWindowChange: (value: number) => void}): ReactElement {
	const {vaults, tvlOverride, userCount, feesOverride, isLoadingFees, isLoadingChart, chartSnapshots, accountFees, vaultComboData, apiErrors, selectedVaultKey, setSelectedVaultKey} = usePartner();
	const vaultList = Object.values(vaults || {});
	const hasVaults = vaultList.length > 0;
	const [selectedIndex, set_selectedIndex] = useState(-1);
	const [activeWindow, set_activeWindow] = useState('1 month');
	const [balanceTVLs] = useState<TDict<TChartBar[]>>();
	const [wrapperTotals] = useState<TChartBar[]>();
	const [payoutTotals] = useState<TDict<TChartBar[]>>();
	const [aggregationStep] = useState(0);

	void _partnerID;
	const selectedVault = vaultList[selectedIndex];

	const selectedAddress = selectedVault ? selectedVault.address : '';
	const selectedChainID = selectedVault ? selectedVault.chainID : 1;
	const selectedToken = selectedVault ? selectedVault.token : '';
	const selectedCombo = vaultComboData.find((combo) => combo.key === selectedVaultKey);
	const selectedTvl = selectedCombo?.tvl?.totalCurrentValueNormalized;
	const selectedFees = selectedCombo?.fees?.totalFeesNormalized;
	const selectedAccountFees = selectedCombo?.fees?.accounts || [];
	const selectedSnapshots = selectedCombo?.chart?.snapshots || [];
	const selectedLoadingFees = selectedCombo ? selectedCombo.isLoadingFees : isLoadingFees;
	const selectedLoadingChart = selectedCombo ? selectedCombo.isLoadingChart : isLoadingChart;
	const selectedUserCount = selectedCombo ? selectedCombo.addresses.length : userCount;
	const shouldShowVaultDropdown = vaultComboData.length > 0;
	const isLoadingTVL = vaultComboData.some((combo) => combo.isLoadingTVL);
	const isLoadingData = isLoadingFees || isLoadingChart || isLoadingTVL;
	const isEmptyState = !isLoadingData && vaultComboData.length === 0;
	const getVaultDropdownLabel = (combo: typeof selectedCombo): string => {
		if (!combo) {
			return 'Total';
		}

		const symbol = getComboAssetSymbol(combo);
		const chainLabel = NETWORK_LABELS[combo.chainId] || 'Chain';
		const addressLabel = truncateHex(combo.vaultAddress, 4);
		return symbol ? `${symbol} • ${chainLabel} • ${addressLabel}` : `${chainLabel} • ${addressLabel}`;
	};

	const vaultDropdownLabel = getVaultDropdownLabel(selectedCombo);
	const selectedTokenLogoSrc = getComboTokenLogoSrc(selectedCombo);
	const selectedChainLogoSrc = getComboChainLogoSrc(selectedCombo);

	function handleWindowChange(e: MouseEvent<HTMLButtonElement>): void {
		const {name, value} = e.currentTarget;
		performBatchedUpdates((): void => {
			set_activeWindow(name);
			onWindowChange(+value);
		});
	}


	useMemo((): void => {
		/* Visual generation and data fetching temporarily disabled. */
		// const baseBalanceURI = `${process.env.YVISION_BASE_URI}/partners/${partnerID}/balance`;
		// const basePayoutURI = `${process.env.YVISION_BASE_URI}/partners/${partnerID}/payout_total`;
		//
		// const now = dayjs().unix();
		// const startOfToday = dayjs().utc().startOf('D').unix();
		//
		// const balanceEndpoints = [`${baseBalanceURI}?ts=${now}`];
		// const payoutEndpoints = [`${basePayoutURI}?ts=${now}`];
		// 	
		// for (let i = 1; i < windowValue; i++) {
		// 	const ts = startOfToday - (86400 * i);
		// 	balanceEndpoints.push(`${baseBalanceURI}?ts=${ts}`);
		// 	payoutEndpoints.push(`${basePayoutURI}?ts=${ts}`);
		// }
		//
		// const earliestTimestamp = startOfToday - (86400 * (windowValue-1));
		// // reverse so requests resolve with first elements being the oldest
		// balanceEndpoints.reverse();
		// payoutEndpoints.reverse();
		//
		// const partnerBalanceTVL: TDict<TChartBar[]> = {};
		// const _wrapperTotals: TDict<TChartBar> = {};
		//
		// Promise.all(balanceEndpoints.map(async (endpoint): Promise<AxiosResponse> => axios.get(endpoint))).then(
		// 	(responses): void => {
		// 		responses.forEach(({data}): void => {
		// 			const vaultsAllNetworksOject = Object.values(data || {})[0] as TPartnerVaultsByNetwork;
		//
		// 			for (const [networkName, vaultsForNetwork] of Object.entries(vaultsAllNetworksOject || {})) {
		// 				const	chainID = NETWORK_CHAINID[networkName];
		//
		// 				for (const [vaultAddress, currentVault] of Object.entries(vaultsForNetwork || {})) {
		// 					const vaultBalanceArray = partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`];
		// 					const date = unix(data.ts).format('MMM DD YYYY');
		// 					const shortDate = unix(data.ts).format('MMM DD');
		// 					const {token} = currentVault;
		// 					
		// 					if (currentVault.tvl > 0 || vaultBalanceArray?.length > 0) {
		// 						const dataPoint = {name: date, shortDate, data: {balanceTVL: currentVault.tvl}, token};
		//
		// 						if(vaultBalanceArray){
		// 							partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`].push(dataPoint);
		// 						}else{
		// 							const missingData = [];
		//
		// 							if(data.ts > earliestTimestamp){
		// 								const numToAdd = Math.floor((data.ts - earliestTimestamp) / 86400);
		//
		// 								for (let i = 0; i < numToAdd; i++) {
		// 									const ts = earliestTimestamp + (86400 * i);
		// 									const _date = unix(ts).format('MMM DD YYYY');
		// 									const _shortDate = unix(ts).format('MMM DD');
		//
		// 									const missingDataPoint = {name: _date, shortDate: _shortDate, data: {balanceTVL: 0}, token};
		// 									missingData.push(missingDataPoint);
		// 								}
		// 							}
		//
		// 							missingData.push(dataPoint);
		// 							partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`] = missingData;
		// 						}
		// 
		// 						// Sum TVLs by day for aggregate wrapper balance chart
		// 						const dailyTVL = _wrapperTotals[date];
		// 
		// 						if(dailyTVL){
		// 							_wrapperTotals[date] = {...dailyTVL, data: {totalTVL: dailyTVL.data.totalTVL + currentVault.tvl}};
		// 						}else{
		// 							_wrapperTotals[date] = {name: date, shortDate, data: {totalTVL: currentVault.tvl}};
		// 						}
		// 					}
		//
		// 				}
		// 			}
		// 		});
		//
		//
		// 		// Assign profit share tiers based on contributed TVL
		// 		const wrapperData = Object.values(_wrapperTotals).map((item): TChartBar => ({
		// 			...item,
		// 			data: {...item.data, profitShare: DEFAULT_PROFIT_SHARE * 100}
		// 		}));
		//
		// 		performBatchedUpdates((): void => {
		// 			set_balanceTVLs(partnerBalanceTVL);
		// 			set_wrapperTotals(wrapperData);
		// 			set_aggregationStep((prevStep): number => (prevStep + 1));
		// 		});
		// 	});
		//
		// 	
		// const partnerPayoutTotals: TDict<TChartBar[]> = {};
		//
		// Promise.all(payoutEndpoints.map(async (endpoint): Promise<AxiosResponse> => axios.get(endpoint))).then(
		// 	(responses): void => {
		// 		responses.forEach(({data}): void => {
		// 			const vaultsAllNetworksOject = Object.values(data || {})[0] as TPartnerVaultsByNetwork;
		//
		// 			for (const [networkName, vaultsForNetwork] of Object.entries(vaultsAllNetworksOject || {})) {
		// 				const	chainID = NETWORK_CHAINID[networkName];
		//
		// 				for (const [vaultAddress, currentVault] of Object.entries(vaultsForNetwork || {})) {
		// 					const vaultPayoutArray = partnerPayoutTotals[`${toAddress(vaultAddress)}_${chainID}`];
		// 					const date = unix(data.ts).format('MMM DD YYYY');
		// 					const shortDate = unix(data.ts).format('MMM DD');
		// 					const {token} = currentVault;
		// 					
		// 					if (currentVault.tvl > 0) {
		// 						const dataPoint = {name: date, shortDate, data: {feePayout: currentVault.tvl}, token};
		//
		// 						if(vaultPayoutArray){
		// 							partnerPayoutTotals[`${toAddress(vaultAddress)}_${chainID}`].push(dataPoint);
		// 						}else{
		// 							const missingData = [];
		//
		// 							if(data.ts > earliestTimestamp){
		// 								const numToAdd = Math.floor((data.ts - earliestTimestamp) / 86400);
		// 								for (let i = 0; i < numToAdd; i++) {
		// 									const ts = earliestTimestamp + (86400 * i);
		// 									const _date = unix(ts).format('MMM DD YYYY');
		// 									const _shortDate = unix(ts).format('MMM DD');
		//
		// 									const _datapoint = {name: _date, shortDate: _shortDate, data: {feePayout: 0}, token};
		// 									missingData.push(_datapoint);
		// 								}
		// 							}
		//
		// 							missingData.push(dataPoint);
		//
		// 							partnerPayoutTotals[`${toAddress(vaultAddress)}_${chainID}`] = missingData;
		// 						}
		// 					}
		// 				}
		// 			}
		// 		});
		//
		// 		performBatchedUpdates((): void => {
		// 			set_payoutTotals(partnerPayoutTotals);
		// 			set_aggregationStep((prevStep): number => (prevStep + 1));
		// 		});
		// 	});

	}, []);


	if (aggregationStep === 2 && Object.values(balanceTVLs || []).length === 0) {
		return (
			<h1>{'No Vaults Found'}</h1>
		);
	}

	return (
		<div aria-label={'Vault Details'} className={'col-span-12 mb-4 flex flex-col bg-neutral-100'}>
			{isLoadingData ? (
				<div className={'mx-4 mt-6 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 md:mx-8'}>
					{'Loading vault data...'}
				</div>
			) : null}

			{isEmptyState ? (
				<div className={'mx-4 mt-6 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 md:mx-8'}>
					{'No vault data available yet for this partner.'}
				</div>
			) : null}

			{apiErrors.length > 0 ? (
				<div className={'mx-4 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 md:mx-8'}>
					{apiErrors[0]}
				</div>
			) : null}

			{hasVaults ? (
				<>
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
								onClick={(): void => {
									void copyToClipboard(selectedAddress);
								}}
								className={ selectedIndex === -1 ? 'hidden' : ''}>
								<span className={'sr-only'}>{'Copy address'}</span>
								<IconCopy className={'h-5 w-5 text-neutral-600 transition-colors hover:text-neutral-900 md:h-6 md:w-6'} />
							</button>
						</div>
					</div>

					<div className={'-mt-0.5 h-0.5 w-full bg-neutral-300'} />
				</>
			) : null}

			{shouldShowVaultDropdown ? (
				<div className={'mt-6 px-4 md:px-8'}>
					<label className={'text-sm font-medium text-neutral-700'}>{'Vault'}</label>
					<Listbox
						value={selectedVaultKey}
						onChange={(value: string): void => setSelectedVaultKey(value)}>
						{({open}): ReactElement => (
							<div className={'relative mt-2 w-80'}>
								<Listbox.Button
									className={'flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm hover:border-neutral-300'}>
									{selectedCombo ? (
										<VaultOptionLabel
											tokenLogoSrc={selectedTokenLogoSrc}
											chainLogoSrc={selectedChainLogoSrc}
											label={vaultDropdownLabel}
										/>
									) : (
										<span>{vaultDropdownLabel}</span>
									)}
									<IconChevronDown
										className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
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
									<Listbox.Options
										className={'absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg'}>
										<Listbox.Option
											className={'cursor-pointer px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100'}
											value={'total'}>
											{'Total'}
										</Listbox.Option>
										{vaultComboData.map((combo) => {
											const comboLabel = getVaultDropdownLabel(combo);
											const comboTokenLogoSrc = getComboTokenLogoSrc(combo);
											const comboChainLogoSrc = getComboChainLogoSrc(combo);
											return (
											<Listbox.Option
												key={combo.key}
												className={'cursor-pointer px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100'}
												value={combo.key}>
												<VaultOptionLabel
													tokenLogoSrc={comboTokenLogoSrc}
													chainLogoSrc={comboChainLogoSrc}
													label={comboLabel}
												/>
											</Listbox.Option>
											);
										})}
									</Listbox.Options>
								</Transition>
							</div>
						)}
					</Listbox>
				</div>
			) : null}

			<div className={'mt-10 flex flex-row space-x-4'}>
				{dataWindows.map((window): ReactElement => (
					<Button
						disabled={window.value === 365}
						key={window.name}
						name={window.name}
						value={window.value}
						className={'w-[90px] whitespace-nowrap text-xs md:w-[100px] md:text-base'}
						variant={window.name === activeWindow ? 'filled' : 'outlined'}
						onClick={handleWindowChange}>
						{window.name}
					</Button>
				))}
			</div>

			<SummaryMetrics
				vaults={vaults}
				vault={selectedVault}
				selectedIndex={selectedIndex}
				tvlOverride={selectedCombo ? (typeof selectedTvl === 'number' ? selectedTvl : undefined) : tvlOverride}
				feesOverride={selectedCombo ? (typeof selectedFees === 'number' ? selectedFees : undefined) : feesOverride}
				userCount={selectedUserCount}
				isLoadingFees={selectedLoadingFees}/>

			<div className={'mt-8 px-4 md:px-8'}>
				<BalanceProfitChart snapshots={selectedCombo ? selectedSnapshots : chartSnapshots} isLoading={selectedLoadingChart} />
			</div>

			<div className={'mt-8 px-4 md:px-8'}>
				<AccountFeesTable accountFees={selectedCombo ? selectedAccountFees : accountFees} />
			</div>

			{aggregationStep < 2 || !balanceTVLs || !wrapperTotals || !payoutTotals ?
				null : (
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
