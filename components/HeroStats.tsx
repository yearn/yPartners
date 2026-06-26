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

function	HeroStats(): ReactElement {
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
		console.error('[HeroStats] Vaults count error:', countError);
	}
	if (feesError) {
		console.error('[HeroStats] Fees error:', feesError);
	}


	return (
		<div className={'mb-4 flex flex-row flex-wrap items-center'}>
			<div className={'mr-4 flex flex-col space-y-2 pr-5 md:mr-8'}>
				<p>{'Fees earned this month'}</p>
				<b className={'text-3xl tabular-nums'}>
					{fees ? `$ ${formatAmount(fees.total30d, 0, 2)}` : '-'}
				</b>
			</div>
			<div className={'flex flex-col space-y-2 pr-5'}>
				<p>{'Vaults'}</p>
				<b className={'text-3xl tabular-nums'}>
					{count ? count.vaults_count : '-'}
				</b>
			</div>
		</div>
	);
}

export default HeroStats;
