import {Fragment, memo, useState} from 'react';
import IconChevronDown from 'components/icons/IconChevronDown';
import BalanceProfitChart from 'components/charts/BalanceProfitChart';
import AccountFeesTable from 'components/dashboard/AccountFeesTable';
import {NETWORK_LABELS} from 'utils';
import {Listbox, Transition} from '@headlessui/react';
import {Button} from 'lib/yearn/components/Button';
import IconLinkOut from 'lib/yearn/icons/IconLinkOut';
import performBatchedUpdates from 'lib/yearn/utils/performBatchedUpdates';
import Image from 'next/image';
import {getTokenLogoUrl} from 'lib/crypto/tokenLogos';

import {usePartner} from '../../contexts/usePartner';
import type {TVaultComboData} from '../../contexts/usePartner';
import SummaryMetrics from './SummaryMetrics';
import {useYDaemonVault, getCleanVaultName} from 'lib/yearn/useYDaemonVault';

import type {MouseEvent, ReactElement} from 'react';

const dataWindows = [
	{name: '1 week', value: 7},
	{name: '1 month', value: 30},
	{name: '3 month', value: 90},
	{name: 'Since start', value: 0},
];

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function getComboAssetAddress(combo?: TVaultComboData): string | undefined {
	return combo?.assetAddress ?? combo?.fees?.assetAddress ?? combo?.tvl?.assetAddress;
}

function getComboAssetSymbol(combo?: TVaultComboData): string | undefined {
	return combo?.assetSymbol ?? combo?.fees?.assetSymbol ?? combo?.tvl?.assetSymbol;
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

function shortenAddress(address: string): string {
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatFeeRate(feeBps?: number): string {
	return typeof feeBps === 'number' ? `${(feeBps / 100).toFixed(2)}%` : '—';
}


export function shouldRenderVaultDropdown(vaultComboCount: number): boolean {
	return vaultComboCount > 0;
}

type TVaultOptionLabelProps = {
	tokenLogoSrc: string | null;
	assetSymbol: string;
	chainLabel: string;
	vaultAddress: string;
};

const VaultOptionLabel = memo(function VaultOptionLabel({
	tokenLogoSrc,
	assetSymbol,
	chainLabel,
	vaultAddress
}: TVaultOptionLabelProps): ReactElement {
	return (
		<span className={'flex min-w-0 flex-1 items-center gap-3 text-left'}>
			{tokenLogoSrc ? (
				<Image src={tokenLogoSrc} alt={''} width={32} height={32} className={'h-8 w-8 shrink-0'} />
			) : (
				<span aria-hidden={true} className={'h-8 w-8 shrink-0 rounded-full bg-neutral-100'} />
			)}
			<span className={'min-w-0 flex-1'}>
				<span className={'block truncate font-medium text-neutral-900'}>{assetSymbol}</span>
				<span className={'block truncate font-mono text-xs text-neutral-500'}>{`Vault · ${shortenAddress(vaultAddress)}`}</span>
			</span>
			<span className={'shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600'}>{chainLabel}</span>
		</span>
	);
});

function DashboardTabsContent({onWindowChange}: {onWindowChange: (value: number) => void}): ReactElement {
	const {tvlOverride, userCount, feesOverride, isLoadingFees, isLoadingChart, chartSnapshots, accountFees, vaultComboData, apiErrors, selectedVaultKey, setSelectedVaultKey, feeStartTimestamp} = usePartner();
	const [activeWindow, set_activeWindow] = useState('1 month');
	const [sinceStartDays, set_sinceStartDays] = useState(0);
	const activeWindowDays = activeWindow === 'Since start'
		? sinceStartDays
		: dataWindows.find((window) => window.name === activeWindow)?.value ?? 30;

	const selectedCombo = vaultComboData.find((combo) => combo.key === selectedVaultKey);
	const selectedTvl = selectedCombo?.tvl?.totalCurrentValueNormalized;
	const selectedFees = selectedCombo?.fees?.totalFeesNormalized;
	const selectedAccountFees = selectedCombo?.fees?.accounts || [];
	const selectedSnapshots = selectedCombo?.chart?.snapshots || [];
	const selectedLoadingFees = selectedCombo ? selectedCombo.isLoadingFees : isLoadingFees;
	const selectedLoadingChart = selectedCombo ? selectedCombo.isLoadingChart : isLoadingChart;
	const selectedUserCount = selectedCombo ? selectedCombo.addresses.length : userCount;
	const hasConfiguredVaults = vaultComboData.length > 0;
	const shouldShowVaultDropdown = shouldRenderVaultDropdown(vaultComboData.length);
	const isLoadingTVL = vaultComboData.some((combo) => combo.isLoadingTVL);
	const selectedLoadingTVL = selectedCombo ? selectedCombo.isLoadingTVL : isLoadingTVL;
	const isLoadingAssets = vaultComboData.some((combo) => combo.isLoadingAsset);
	const isLoadingData = isLoadingFees || isLoadingChart || isLoadingTVL || isLoadingAssets;
	const isEmptyState = !isLoadingData && !hasConfiguredVaults && apiErrors.length === 0;
	const selectedTokenLogoSrc = getComboTokenLogoSrc(selectedCombo);
	const selectedAssetSymbol = getComboAssetSymbol(selectedCombo) || 'Vault';
	const selectedChainLabel = selectedCombo ? (NETWORK_LABELS[selectedCombo.chainId] || 'Chain') : '';

	// Fetch vault name from yDaemon API
	const {vault: yDaemonVaultData} = useYDaemonVault(
		selectedCombo?.chainId,
		selectedCombo?.vaultAddress
	);
	const vaultDisplayName = yDaemonVaultData ? getCleanVaultName(yDaemonVaultData.name) : null;

	function handleWindowChange(e: MouseEvent<HTMLButtonElement>): void {
		const {name, value} = e.currentTarget;
		const isSinceStart = name === 'Since start';
		const requestedDays = isSinceStart && feeStartTimestamp > 0
			? Math.max(1, Math.ceil((Date.now() / 1000 - feeStartTimestamp) / 86400))
			: 0;
		performBatchedUpdates((): void => {
			set_activeWindow(name);
			set_sinceStartDays(requestedDays);
			onWindowChange(isSinceStart ? 0 : +value);
		});
	}

	function handleVaultChange(value: string): void {
		setSelectedVaultKey(value);
	}
	return (
		<div aria-label={'Vault Details'} className={'col-span-12 mb-4 flex flex-col bg-neutral-100'}>
			{isLoadingData ? (
				<div className={'mx-4 mt-6 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 md:mx-8'} role={'status'}>
					<p className={'text-lg font-medium'}>{'Loading vault data...'}</p>
					<p className={'mt-1 text-neutral-500'}>{'Initial loads may take longer while historical vault data is fetched and cached.'}</p>
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

			{shouldShowVaultDropdown ? (
						<div className={'mt-6 px-4 md:px-8'}>
							<label className={'text-sm font-medium text-neutral-700'}>{'Vault'}</label>
							<Listbox
								value={selectedVaultKey}
								onChange={handleVaultChange}>
								{({open}): ReactElement => (
									<div className={'relative mt-2 w-full md:max-w-2xl'}>
										<Listbox.Button
											className={'flex min-h-14 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm hover:border-neutral-300'}>
											{selectedCombo ? (
												<VaultOptionLabel
													tokenLogoSrc={selectedTokenLogoSrc}
													assetSymbol={selectedAssetSymbol}
													chainLabel={selectedChainLabel}
													vaultAddress={selectedCombo.vaultAddress}
												/>
											) : (
												<span className={'min-w-0 flex-1 text-left'}>
													<span className={'block font-medium text-neutral-900'}>{'All vaults'}</span>
													<span className={'block text-xs text-neutral-500'}>{'Combined partner totals'}</span>
												</span>
											)}
											<IconChevronDown
												className={`shrink-0 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
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
													className={'cursor-pointer px-3 py-2.5 text-sm text-neutral-900 hover:bg-neutral-100'}
													value={'total'}>
													<span className={'block'}>
														<span className={'block font-medium text-neutral-900'}>{'All vaults'}</span>
														<span className={'block text-xs text-neutral-500'}>{'Combined partner totals'}</span>
													</span>
												</Listbox.Option>
												{vaultComboData.map((combo) => {
													const comboTokenLogoSrc = getComboTokenLogoSrc(combo);
													const comboAssetSymbol = getComboAssetSymbol(combo) || 'Vault';
													const comboChainLabel = NETWORK_LABELS[combo.chainId] || 'Chain';
													return (
													<Listbox.Option
														key={combo.key}
														className={'cursor-pointer px-3 py-2.5 text-sm text-neutral-900 hover:bg-neutral-100'}
														value={combo.key}>
														<VaultOptionLabel
															tokenLogoSrc={comboTokenLogoSrc}
															assetSymbol={comboAssetSymbol}
															chainLabel={comboChainLabel}
															vaultAddress={combo.vaultAddress}
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

				<div className={'mt-10 flex flex-wrap gap-2 md:flex-nowrap md:gap-4'}>
					{dataWindows.map((window): ReactElement => (
						<Button
							key={window.name}
							name={window.name}
							value={window.value}
							className={'w-auto min-w-[84px] whitespace-nowrap text-xs md:w-[100px] md:text-base'}
							variant={window.name === activeWindow ? 'filled' : 'outlined'}
							onClick={handleWindowChange}>
							{window.name}
					</Button>
				))}
			</div>

			{selectedCombo && selectedVaultKey !== 'total' ? (
				<div className={'mt-6 px-4 md:px-8'}>
					<div className={'flex flex-wrap items-center gap-3'}>
						<h2 className={'text-2xl font-bold text-neutral-900'}>
							{vaultDisplayName || getComboAssetSymbol(selectedCombo) || 'Vault'}
						</h2>
						<a
							href={`https://yearn.fi/vaults/${selectedCombo.chainId}/${selectedCombo.vaultAddress}`}
							target={'_blank'}
							rel={'noopener noreferrer'}
							className={'inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 hover:underline'}>
							{'View on Yearn'}
							<IconLinkOut className={'h-4 w-4'} />
						</a>
					</div>
					<div className={'mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500'}>
						<span>
							{'Management fee: '}
							<span className={'font-medium text-neutral-700'}>
								{selectedCombo.isLoadingFees ? 'Loading...' : formatFeeRate(selectedCombo.fees?.managementFeeBps)}
							</span>
						</span>
						<span>
							{'Performance fee: '}
							<span className={'font-medium text-neutral-700'}>
								{selectedCombo.isLoadingFees ? 'Loading...' : formatFeeRate(selectedCombo.fees?.performanceFeeBps)}
							</span>
						</span>
					</div>
				</div>
			) : null}

			<SummaryMetrics
				tvlOverride={selectedCombo ? (typeof selectedTvl === 'number' ? selectedTvl : undefined) : tvlOverride}
				feesOverride={selectedCombo ? (typeof selectedFees === 'number' ? selectedFees : undefined) : feesOverride}
				userCount={selectedUserCount}
				isLoadingTVL={selectedLoadingTVL}
				isLoadingFees={selectedLoadingFees}/>

			<div className={'mt-8 px-4 md:px-8'}>
				<BalanceProfitChart snapshots={selectedCombo ? selectedSnapshots : chartSnapshots} isLoading={selectedLoadingChart} feeStartTimestamp={feeStartTimestamp} windowDays={activeWindowDays} />
			</div>

			<div className={'mt-8 px-4 md:px-8'}>
			<AccountFeesTable accountFees={selectedCombo ? selectedAccountFees : accountFees} />
			</div>
		</div>
	);
}

function DashboardTabsWrapper({partnerID, onWindowChange}: {partnerID: string, onWindowChange: (value: number) => void}): ReactElement {
	return <DashboardTabsContent key={partnerID} onWindowChange={onWindowChange} />;
}

export {DashboardTabsWrapper};
