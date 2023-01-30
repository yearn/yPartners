import React, {Fragment, useState} from 'react';
import OverviewChart from 'components/graphs/OverviewChart';
import {getExplorerURL} from 'utils/b2b';
import {Listbox, Transition} from '@headlessui/react';
import {Button} from '@yearn-finance/web-lib/components/Button';
import Chevron from '@yearn-finance/web-lib/icons/IconChevron';
import IconCopy from '@yearn-finance/web-lib/icons/IconCopy';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';
import {copyToClipboard} from '@yearn-finance/web-lib/utils/helpers';

import {usePartner} from '../../contexts/usePartner';
import VaultChart from '../graphs/VaultChart';

import type {MouseEvent, ReactElement} from 'react';

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

	return (
		<>
			<nav className={'hidden flex-row items-center space-x-10 md:flex'}>
				<button
					onClick={(): void => set_selectedIndex(-1)}>
					<p
						title={'Overview'}
						aria-selected={selectedIndex === -1}
						className={'hover-fix tab'}>
						{'Overview'}
					</p>
				</button>
				{Object.values(vaults || []).map((vault, idx): ReactElement => (
					<button
						key={`desktop-${idx}`}
						onClick={(): void => set_selectedIndex(idx)}>
						<p
							title={vault.token}
							aria-selected={selectedIndex === idx}
							className={'hover-fix tab'}>
							{vault.token}
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
								className={'flex h-10 w-40 flex-row items-center border-0 border-b-2 border-neutral-900 bg-neutral-100 p-0 font-bold focus:border-neutral-900 md:hidden'}>
								<div className={'relative flex flex-row items-center'}>
									{Object.values(vaults || [])[selectedIndex]?.token || 'Overview'}
								</div>
								<div className={'absolute right-0'}>
									<Chevron
										className={`h-6 w-6 transition-transform ${open ? '-rotate-180' : 'rotate-0'}`} />
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
								<Listbox.Options className={'yearn--listbox-menu'}>
									<Listbox.Option
										className={'yearn--listbox-menu-item'}
										value={-1}>
										{'Overview'}
									</Listbox.Option>

									{Object.values(vaults || []).map((vault, idx): ReactElement => (
										<Listbox.Option
											className={'yearn--listbox-menu-item'}
											key={idx}
											value={idx}>
											{vault.token}
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
	const [selectedIndex, set_selectedIndex] = useState(0);
	const [activeWindow, set_activeWindow] = useState('1 month');
	const [windowValue, set_windowValue] = useState(29);

	const selectedVault = Object.values(vaults)[selectedIndex];

	const vaultAddress = selectedVault ? selectedVault.address : '';
	const vaultChainID = selectedVault ? selectedVault.chainID : 1;

	function handleWindowChange(e: MouseEvent<HTMLButtonElement>): void {
		const {name, value} = e.currentTarget;
		set_activeWindow(name);
		set_windowValue(+value);
	}

	return (
		<div aria-label={'Vault Details'} className={'col-span-12 mb-4 flex flex-col bg-neutral-100'}>
			<div className={'relative flex w-full flex-row items-center justify-between px-4 pt-4 md:px-8'}>
				<Tabs
					selectedIndex={selectedIndex}
					set_selectedIndex={set_selectedIndex} />

				<div className={'flex flex-row items-center justify-end space-x-2 pb-0 md:pb-4 md:last:space-x-4'}>
					<a
						className={ selectedIndex === -1 ? 'hidden' : ''}
						href={`${getExplorerURL(vaultChainID)}/address/${vaultAddress}`}
						target={'_blank'}
						rel={'noopener noreferrer'}>
						<span className={'sr-only'}>{'Open in explorer'}</span>
						<IconLinkOut className={'h-5 w-5 cursor-alias text-neutral-600 transition-colors hover:text-neutral-900 md:h-6 md:w-6'} />
					</a>
					<button
						onClick={(): void => copyToClipboard(vaultAddress)}
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

			{Object.values(vaults || []).map((vault, idx): ReactElement | null => {
				return idx === selectedIndex ? <VaultChart
					key={idx}
					vault={vault}
					idx={idx}
					partnerID={partnerID}
					activeWindow={activeWindow}
					windowValue={windowValue}
				/> : null;
			})}

			<OverviewChart
				vaults={vaults || []}
				partnerID={partnerID}
				activeWindow={activeWindow}
				windowValue={windowValue}
			/>
		</div>
	);
}

export {DashboardTabsWrapper};
