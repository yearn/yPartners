import {useEffect, useMemo, useState} from 'react';
import {DashboardTabsWrapper} from 'components/dashboard/DashboardTabsWrapper';
import {PartnerContextApp, usePartner} from 'contexts/usePartner';
import {LOGOS, SHAREABLE_ADDRESSES} from 'utils/Partners';

import type {GetStaticPathsResult, GetStaticPropsResult} from 'next';
import type {ReactElement} from 'react';

function Index({partnerID, windowValue, onWindowChange}: {partnerID: string, windowValue: number, onWindowChange: (value: number) => void}): ReactElement {
	const {isLoadingVaults} = usePartner();
	const [lastSync, set_lastSync] = useState('');

	const currentPartner = SHAREABLE_ADDRESSES[partnerID];
	const currentPartnerName = currentPartner ? currentPartner.name : '';
	const currentPartnerShortname = currentPartner ? currentPartner.shortName : '';

	useEffect((): void => {
		const latestSync = new Date().toLocaleString('default',
			{month: 'long', day: '2-digit', year: 'numeric', hour: 'numeric', minute:'numeric', timeZone: 'UTC'});

		set_lastSync(`${latestSync} UTC`);
	}, [set_lastSync]);


	const	VaultGraphs = useMemo((): ReactElement => {
		if (currentPartner && isLoadingVaults) {
			return (
				<h1>{'Loading...'}</h1>
			);
		}

		return (
			<DashboardTabsWrapper
				partnerID={currentPartnerShortname}
				windowValue={windowValue}
				onWindowChange={onWindowChange} />
		);
	}, [currentPartner, isLoadingVaults, currentPartnerShortname, windowValue, onWindowChange]);

	return (
		<main className={'mb-20 pb-20'}>
			<section aria-label={'hero'} className={'mb-8 mt-3 grid grid-cols-8 md:mb-14 md:mt-[75px] md:grid-cols-12'}>

				<div className={'col-span-3 md:hidden'}>
					{LOGOS[currentPartnerName]}
				</div>

				<div className={'col-span-8 lg:col-span-9'}>
					<h1 className={`my-4 text-neutral-900 md:text-8xl ${currentPartner?.name === 'Abracadabra.Money' ? 'text-[3.5rem]':'text-6xl'}`}>
						{currentPartner?.name === 'Abracadabra.Money' ? 'Abracadabra': currentPartner?.name}
					</h1>

					<p className={'mb-6 w-3/4 text-neutral-500 md:mb-10'}>{`Last updated ${lastSync}`}</p>
				</div>

				<div className={'hidden md:col-span-4 md:block lg:col-span-3'}>
					{LOGOS[currentPartnerName]}
				</div>

			</section>

			<section aria-label={'tabs'}>
				{VaultGraphs}
			</section>
		</main>
	);
}


function	PartnerDashboardWrapper({partnerID}: {partnerID: string}): ReactElement {
	const [windowValue, set_windowValue] = useState(29); // Default to 1 month

	return (
		<PartnerContextApp partnerID={partnerID} windowDays={windowValue}>
			<Index
				partnerID={partnerID}
				windowValue={windowValue}
				onWindowChange={set_windowValue} />
		</PartnerContextApp>
	);
}


export async function getStaticPaths(): Promise<GetStaticPathsResult> {
	const	addrs = Object.keys(SHAREABLE_ADDRESSES);
	const addressPaths = addrs.map((addr): {params: {partnerID: string}} => ({params: {partnerID: addr}}));
	return {
		paths: addressPaths,
		fallback: false
	};
}

export async function getStaticProps(context: {params: {partnerID: string}}): Promise<GetStaticPropsResult<{partnerID: string}>>{
	return ({props: {partnerID: context.params.partnerID}});
}

export default PartnerDashboardWrapper;
