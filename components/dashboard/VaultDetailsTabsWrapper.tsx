import React, {Fragment, useState} from 'react';
import {usePartner} from 'contexts/usePartner';
import {Listbox, Transition} from '@headlessui/react';
import Chevron from '@yearn-finance/web-lib/icons/IconChevron';
import IconCopy from '@yearn-finance/web-lib/icons/IconCopy';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';

import Overview from '../graphs/Overview';

import type {ReactElement} from 'react';

type TProps = {
	selectedIndex: number,
	set_selectedIndex: (arg0: number) => void
};

function	Tabs({selectedIndex, set_selectedIndex}: TProps): ReactElement {
	const	{vaults} = usePartner();

	return (
		<>
			<nav className={'hidden flex-row items-center space-x-10 md:flex'}>
				{vaults.map((vault, idx): ReactElement => (
					<button
						key={`desktop-${idx}`}
						onClick={(): void => set_selectedIndex(idx)}>
						<p
							title={`${vault.token} - ${vault.network}`}
							aria-selected={selectedIndex === idx}
							className={'hover-fix tab'}>
							{`${vault.token} - ${vault.network}`}
						</p>
					</button>	
				))}
			</nav>
			<div className={'relative z-50'}>
				<Listbox
					value={selectedIndex}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					onChange={(value: any): void => {
						set_selectedIndex(value.index);
					}}>
					{({open}): ReactElement => (
						<>
							<Listbox.Button
								className={'flex h-10 w-40 flex-row items-center border-0 border-b-2 border-neutral-900 bg-neutral-100 p-0 font-bold focus:border-neutral-900 md:hidden'}>
								<div className={'relative flex flex-row items-center'}>
									{vaults[selectedIndex]?.token || 'Vaults'}
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
									{vaults.map((vault, idx): ReactElement => (
										<Listbox.Option
											className={'yearn--listbox-menu-item'}
											key={idx}
											value={vault}>
											{`${vault.token} - ${vault.network}`}
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

function	VaultDetailsTabsWrapper(): ReactElement {
	const	{vaults} = usePartner();

	const [selectedIndex, set_selectedIndex] = useState(0);

	return (
		<div aria-label={'Vault Details'} className={'col-span-12 mb-4 flex flex-col bg-neutral-100'}>
			<div className={'relative flex w-full flex-row items-center justify-between px-4 pt-4 md:px-8'}>
				<Tabs
					selectedIndex={selectedIndex}
					set_selectedIndex={set_selectedIndex} />
				
				<div className={'flex flex-row items-center justify-end space-x-2 pb-0 md:pb-4 md:last:space-x-4'}>
					<a
						href={'https://etherscan.io/'}
						target={'_blank'}
						rel={'noopener noreferrer'}>
						<span className={'sr-only'}>{'Open in explorer'}</span>
						<IconLinkOut className={'h-5 w-5 cursor-alias text-neutral-600 transition-colors hover:text-neutral-900 md:h-6 md:w-6'} />
					</a>
					<button
						onClick={(): void => {
							alert('Feature currently unavailable');
						}
						}>
						<span className={'sr-only'}>{'Copy address'}</span>
						<IconCopy className={'h-5 w-5 text-neutral-600 transition-colors hover:text-neutral-900 md:h-6 md:w-6'} />
					</button>
				</div>
			</div>

			<div className={'-mt-0.5 h-0.5 w-full bg-neutral-300'} />

			{vaults.map((_, idx): ReactElement | null => {
				return idx === selectedIndex ? <Overview key={idx}/> : null;
			})}

		</div>
	);
}

export {VaultDetailsTabsWrapper};
