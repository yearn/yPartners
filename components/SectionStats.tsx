import useSWR from 'swr';
import {baseFetcher} from 'lib/yearn/utils/fetchers';
import {formatAmount} from 'lib/yearn/utils/format.number';

import type {ReactElement} from 'react';
import type {SWRResponse} from 'swr';

async function vaultCountFetcher(url: string): Promise<{vaults_count: number}> {
	return baseFetcher(url) as Promise<{vaults_count: number}>;
}

async function feesFetcher(url: string): Promise<{total30d: number}> {
	return baseFetcher(url) as Promise<{total30d: number}>;
}

function	SectionStats(): ReactElement {
	const	{data: count, error: countError} = useSWR(
		'/api/vault-count',
		vaultCountFetcher,
		{
			revalidateOnFocus: false,
			onError: (err: Error) => console.error('[SWR] Vaults count fetch error:', err)
		}
	) as SWRResponse;

	const	{data: fees, error: feesError} = useSWR(
		'/api/fees',
		feesFetcher,
		{
			revalidateOnFocus: false,
			onError: (err: Error) => console.error('[SWR] Fees fetch error:', err)
		}
	) as SWRResponse;

	if (countError) {
		console.error('[SectionStats] Vaults count error:', countError);
	}
	if (feesError) {
		console.error('[SectionStats] Fees error:', feesError);
	}


	return (
		<section aria-label={'stats'} className={'mb-28 flex flex-row flex-wrap items-center md:mb-50'}>
			<div className={'mr-4 mt-4 flex flex-col space-y-2 pr-5 md:mr-8 md:mt-0'}>
				<p>{'Fees earned this month'}</p>
				<b className={'text-3xl tabular-nums'}>
					{fees ? `$ ${formatAmount(fees.total30d, 0, 2)}` : '-'}
				</b>
			</div>
			<div className={'mt-4 flex flex-col space-y-2 pr-5 md:mt-0'}>
				<p>{'Vaults'}</p>
				<b className={'text-3xl tabular-nums'}>
					{count ? count.vaults_count : '-'}
				</b>
			</div>
		</section>
	);
}

export default SectionStats;
