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
import {getChainLogoUrl, getTokenLogoUrl} from 'lib/crypto/tokenLogos';

import {usePartner} from '../../contexts/usePartner';
import type {TVaultComboData} from '../../contexts/usePartner';
import SummaryMetrics from './SummaryMetrics';
import {useYDaemonVault, getCleanVaultName} from 'lib/yearn/useYDaemonVault';

import type {MouseEvent, ReactElement} from 'react';

const dataWindows = [
	{name: '1 week', value: 7},
	{name: '1 month', value: 29},
	{name: '3 month', value: 90},
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

function	DashboardTabsWrapper({partnerID: _partnerID, onWindowChange}: {partnerID: string, onWindowChange: (value: number) => void}): ReactElement {
	const {tvlOverride, userCount, feesOverride, isLoadingFees, isLoadingChart, chartSnapshots, accountFees, vaultComboData, apiErrors, selectedVaultKey, setSelectedVaultKey, feeStartTimestamp} = usePartner();
	const [activeWindow, set_activeWindow] = useState('1 month');

	void _partnerID;
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
	const isLoadingAssets = vaultComboData.some((combo) => combo.isLoadingAsset);
	const isLoadingData = isLoadingFees || isLoadingChart || isLoadingTVL || isLoadingAssets;
	const isEmptyState = !isLoadingData && vaultComboData.length === 0;
	const getVaultDropdownLabel = (combo: typeof selectedCombo): string => {
		if (!combo) {
			return 'Total';
		}

		const symbol = getComboAssetSymbol(combo);
		const chainLabel = NETWORK_LABELS[combo.chainId] || 'Chain';
		const addressLabel = combo.vaultAddress;
		return symbol ? `${symbol} • ${chainLabel} • ${addressLabel}` : `${chainLabel} • ${addressLabel}`;
	};

	const vaultDropdownLabel = getVaultDropdownLabel(selectedCombo);
	const selectedTokenLogoSrc = getComboTokenLogoSrc(selectedCombo);
	const selectedChainLogoSrc = getComboChainLogoSrc(selectedCombo);

	// Fetch vault name from yDaemon API
	const {vault: yDaemonVaultData} = useYDaemonVault(
		selectedCombo?.chainId,
		selectedCombo?.vaultAddress
	);
	const vaultDisplayName = yDaemonVaultData ? getCleanVaultName(yDaemonVaultData.name) : null;

	function handleWindowChange(e: MouseEvent<HTMLButtonElement>): void {
		const {name, value} = e.currentTarget;
		performBatchedUpdates((): void => {
			set_activeWindow(name);
			onWindowChange(+value);
		});
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

			{shouldShowVaultDropdown ? (
						<div className={'mt-6 px-4 md:px-8'}>
							<label className={'text-sm font-medium text-neutral-700'}>{'Vault'}</label>
							<Listbox
								value={selectedVaultKey}
								onChange={(value: string): void => setSelectedVaultKey(value)}>
								{({open}): ReactElement => (
									<div className={'relative mt-2 w-full md:max-w-2xl'}>
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
											{'Total (all vaults)'}
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
				<div className={'mt-6 flex items-center gap-3 px-4 md:px-8'}>
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
			) : null}

			<SummaryMetrics
				tvlOverride={selectedCombo ? (typeof selectedTvl === 'number' ? selectedTvl : undefined) : tvlOverride}
				feesOverride={selectedCombo ? (typeof selectedFees === 'number' ? selectedFees : undefined) : feesOverride}
				userCount={selectedUserCount}
				isLoadingFees={selectedLoadingFees}/>

			<div className={'mt-8 px-4 md:px-8'}>
				<BalanceProfitChart snapshots={selectedCombo ? selectedSnapshots : chartSnapshots} isLoading={selectedLoadingChart} feeStartTimestamp={feeStartTimestamp} />
			</div>

			<div className={'mt-8 px-4 md:px-8'}>
			<AccountFeesTable accountFees={selectedCombo ? selectedAccountFees : accountFees} />
			</div>
		</div>
	);
}

export {DashboardTabsWrapper};
