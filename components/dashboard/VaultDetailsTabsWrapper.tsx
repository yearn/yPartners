import React, {Fragment, useState} from 'react';
import {Listbox, Transition} from '@headlessui/react';
import Chevron from '@yearn-finance/web-lib/icons/IconChevron';
import IconCopy from '@yearn-finance/web-lib/icons/IconCopy';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';

import Overview from './Overview';

import type {ReactElement} from 'react';


function	Tabs({selectedAboutTabIndex, set_selectedAboutTabIndex}: {
	selectedAboutTabIndex: number,
	set_selectedAboutTabIndex: (arg0: number) => void
}): ReactElement {
	const tabs = [
		{value: 0, label: 'Overview'},
		{value: 1, label: 'Vault 1'},
		{value: 2, label: 'Vault 2'},
		{value: 3, label: 'Vault 3'}
	];

	return (
		<>
			<nav className={'hidden flex-row items-center space-x-10 md:flex'}>
				{tabs.map((tab): ReactElement => (
					<button
						key={`desktop-${tab.value}`}
						onClick={(): void => set_selectedAboutTabIndex(tab.value)}>
						<p
							title={tab.label}
							aria-selected={selectedAboutTabIndex === tab.value}
							className={'hover-fix tab'}>
							{tab.label}
						</p>
					</button>	
				))}
			</nav>
			<div className={'relative z-50'}>
				<Listbox
					value={selectedAboutTabIndex}
					onChange={(value: any): void => set_selectedAboutTabIndex(value.value)}>
					{({open}): ReactElement => (
						<>
							<Listbox.Button
								className={'flex h-10 w-40 flex-row items-center border-0 border-b-2 border-neutral-900 bg-neutral-100 p-0 font-bold focus:border-neutral-900 md:hidden'}>
								<div className={'relative flex flex-row items-center'}>
									{tabs[selectedAboutTabIndex]?.label || 'Menu'}
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
									{tabs.map((tab): ReactElement => (
										<Listbox.Option
											className={'yearn--listbox-menu-item'}
											key={tab.value}
											value={tab}>
											{tab.label}
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
	const [selectedAboutTabIndex, set_selectedAboutTabIndex] = useState(0);

	return (
		<div aria-label={'Vault Details'} className={'col-span-12 mb-4 flex flex-col bg-neutral-100'}>
			<div className={'relative flex w-full flex-row items-center justify-between px-4 pt-4 md:px-8'}>
				<Tabs
					selectedAboutTabIndex={selectedAboutTabIndex}
					set_selectedAboutTabIndex={set_selectedAboutTabIndex} />
				
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

			{selectedAboutTabIndex === 0 ? (
				<Overview/>
			) : null}
			{selectedAboutTabIndex === 1 ? (
				<Overview/>
			) : null}
			{selectedAboutTabIndex === 2 ? (
				<Overview/>
			) : null}
			{selectedAboutTabIndex === 3 ? (
				<Overview/>
			) : null}
		</div>
	);
}

export {VaultDetailsTabsWrapper};
