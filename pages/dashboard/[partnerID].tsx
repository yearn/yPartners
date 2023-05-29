import {useEffect, useMemo, useState} from 'react';
import {DashboardTabsWrapper} from 'components/dashboard/DashboardTabsWrapper';
import {PartnerContextApp, usePartner} from 'contexts/usePartner';
import useWindowDimensions from 'hooks/useWindowDimensions';
import {LOGOS, SHAREABLE_ADDRESSES} from 'utils/Partners';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {GetStaticPathsResult, GetStaticPropsResult} from 'next';
import type {ChangeEvent, FormEvent, ReactElement} from 'react';

function formatDate(date: Date): string {
	return date.toLocaleDateString('en-CA');
}

function Index({partnerID}: {partnerID: string}): ReactElement {
	const {width} = useWindowDimensions();
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const lastMonth = currentDate.getMonth() - 1;
	const today = formatDate(currentDate);
	const firstDayLastMonth = formatDate(new Date(new Date().setFullYear(currentYear, lastMonth, 1)));

	const {isLoadingVaults} = usePartner();
	const [lastSync, set_lastSync] = useState('');
	const [reportStart, set_reportStart] = useState(firstDayLastMonth);
	const [reportEnd, set_reportEnd] = useState(today);

	const currentPartner = SHAREABLE_ADDRESSES[partnerID];
	const currentPartnerName = currentPartner ? currentPartner.name : '';
	const currentPartnerShortname = currentPartner ? currentPartner.shortName : '';

	useEffect((): void => {
		const latestSync = new Date().toLocaleString('default',
			{month: 'long', day: '2-digit', year: 'numeric', hour: 'numeric', minute:'numeric'});

		set_lastSync(latestSync);
	}, [set_lastSync]);


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

		return (
			<DashboardTabsWrapper partnerID={currentPartnerShortname} />
		);
	}, [currentPartner, isLoadingVaults, currentPartnerShortname]);

	return (
		<main className={'mb-20 pb-20'}>
			<section aria-label={'hero'} className={'mt-3 mb-8 grid grid-cols-8 md:mb-14 md:mt-[75px] md:grid-cols-12'}>

				<div className={'col-span-3 md:hidden'}>
					{ width < 768 && LOGOS[currentPartnerName]}
				</div>

				<div className={'col-span-8 lg:col-span-9'}>
					<h1 className={`my-4 text-neutral-900 md:text-8xl ${currentPartner?.name === 'Abracadabra.Money' ? 'text-[3.5rem]':'text-6xl'}`}>
						{currentPartner?.name === 'Abracadabra.Money' ? 'Abracadabra': currentPartner?.name}
					</h1>

					<p className={'mb-6 w-3/4 text-neutral-500 md:mb-10'}>{`Last updated ${lastSync}`}</p>

					<form onSubmit={downloadReport}>
						<div className={'mt-2 grid-cols-1 items-end space-y-4 md:flex md:flex-row md:justify-start'}>
							<div className={'grid grid-cols-2'} >
								<div className={'grid grid-rows-2 items-end md:w-[170px] md:pr-4 lg:w-[180px]'}>
									<label className={'text-neutral-500'} htmlFor={'start'}>{'From'}</label>
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

								<div className={'grid grid-rows-2 items-end md:w-[170px] md:pr-4 lg:w-[180px]'}>
									<label className={'text-neutral-500'} htmlFor={'end'}>{'To'}</label>
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
							</div>

							<Button
								className={'w-full md:w-[180px] md:text-base lg:w-[200px]'}
								variant={'filled'}>
								{'Download Report'}
							</Button>
						</div>
					</form>
				</div>

				<div className={'hidden md:col-span-4 md:block lg:col-span-3'}>
					{ width >= 768 && LOGOS[currentPartnerName]}
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
