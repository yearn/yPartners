
import React, {useEffect, useMemo, useState} from 'react';
import router from 'next/router';
import {DashboardTabsWrapper} from 'components/dashboard/DashboardTabsWrapper';
import {useAuth} from 'contexts/useAuth';
import {PartnerContextApp, usePartner} from 'contexts/usePartner';
import {LOGOS, PARTNERS} from 'utils/b2b/Partners';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {GetStaticPathsResult, GetStaticPropsResult} from 'next';
import type {ChangeEvent, FormEvent, ReactElement} from 'react';

function formatDate(date: Date): string {
	return date.toLocaleDateString('en-CA');
}

function Index({partnerID}: {partnerID: string}): ReactElement {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const lastMonth = currentDate.getMonth() - 1;
	const today = formatDate(currentDate);
	const firstDayLastMonth = formatDate(new Date(new Date().setFullYear(currentYear, lastMonth, 1)));

	const {isLoggedIn} = useAuth();
	const {isLoadingVaults, vaults} = usePartner();
	const [lastSync, set_lastSync] = useState('');
	const [reportStart, set_reportStart] = useState(firstDayLastMonth);
	const [reportEnd, set_reportEnd] = useState(today);

	const currentPartner = PARTNERS[partnerID];
	const currentPartnerName = currentPartner ? currentPartner.name : '';

	useEffect((): void => {
		if(!isLoggedIn){
			router.push('/');
		}
	}, [isLoggedIn]);

	useEffect((): void => {
		const latestSync = new Date().toLocaleString('default',
			{month: 'long', day: '2-digit', year: 'numeric', hour: 'numeric', minute:'numeric'});

		set_lastSync(latestSync);
	}, []);


	function downloadReport(e: FormEvent<HTMLFormElement>): void {
		e.preventDefault();
		alert('Feature currently unavailable');
	}

	function handleReportDateChange(e: ChangeEvent<HTMLInputElement>): void {
		const rangeValue = e.target.value;

		if(e.target.name === 'range-start'){
			set_reportStart(rangeValue);
		}else {
			set_reportEnd(rangeValue);
		}
	}

	const	VaultGraphs = useMemo((): ReactElement => {
		if (currentPartner && isLoadingVaults) {
			return (
				<h1>{'Loading...'}</h1>
			);
		}

		if (currentPartner && !isLoadingVaults && Object.values(vaults || []).length === 0) {
			return (
				<h1>{'No Vaults Found'}</h1>
			);
		}

		return (
			<DashboardTabsWrapper partnerID={partnerID} />
		);
	}, [currentPartner, vaults, isLoadingVaults, partnerID]);

	return (
		<main className={'mb-20 pb-20'}>
			<section aria-label={'hero'} className={'mt-3 mb-8 grid grid-cols-8 md:mb-14 md:mt-[75px] md:grid-cols-12'}>

				<div className={'col-span-3 md:hidden'}>
					{LOGOS[currentPartnerName]}
				</div>

				<div className={'col-span-8 lg:col-span-9'}>
					<h1 className={'my-4 text-6xl text-neutral-900 md:text-8xl'}>
						{currentPartner?.name === 'Abracadabra.Money' ? 'Abracadabra': currentPartner?.name}
					</h1>

					<p className={'mb-6 w-3/4 text-neutral-500 md:mb-10'}>{`Last updated ${lastSync}`}</p>

					<form onSubmit={downloadReport}>
						<div className={'mt-2 flex flex-row items-end space-x-4'}>
							<div>
								<label className={'block text-neutral-500'} htmlFor={'start'}>{'From'}</label>
								<input
									className={'text-neutral-500'}
									type={'date'}
									id={'start'}
									name={'range-start'}
									value={reportStart}
									onChange={handleReportDateChange}
									min={'2021-01-01'}
									max={reportEnd} />
							</div>

							<div>
								<label className={'block text-neutral-500'} htmlFor={'end'}>{'To'}</label>
								<input
									className={'text-neutral-500'}
									type={'date'}
									id={'end'}
									name={'range-end'}
									value={reportEnd}
									onChange={handleReportDateChange}
									min={'2021-01-01'}
									max={today} />
							</div>

							<Button
								className={'w-[200px] text-sm  md:text-base'}
								variant={'filled'}>
								{'Download Report'}
							</Button>
						</div>
					</form>
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
	return (
		<PartnerContextApp partnerID={partnerID}>
			<Index partnerID={partnerID} />
		</PartnerContextApp>
	);
}


export async function getStaticPaths(): Promise<GetStaticPathsResult> {
	const	partners = Object.values(PARTNERS);
	return {
		paths: partners.map((partner): {params: {partnerID: string}} => ({params: {partnerID: partner.shortName}})),
		fallback: false
	};
}

export async function getStaticProps(context: {params: {partnerID: string}}): Promise<GetStaticPropsResult<{partnerID: string}>>{
	return ({props: {partnerID: context.params.partnerID}});
}

export default PartnerDashboardWrapper;
