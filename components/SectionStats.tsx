import useSWR from 'swr';
import {baseFetcher} from 'lib/yearn/utils/fetchers';
import {formatAmount} from 'lib/yearn/utils/format.number';

import type {ReactElement} from 'react';
import type {SWRResponse} from 'swr';

async function graphqlFetcher(url: string): Promise<{vaults_count: number}> {
	console.log('[graphqlFetcher] Fetching vaults from:', url);

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: 'query GetYearnV3Vaults { vaults(v3: true, yearn: true) { address } }'
			})
		});

		if (!response.ok) {
			const error = `Failed to fetch ${url}: ${response.status} ${response.statusText}`;
			console.error('[graphqlFetcher] Error:', error);
			throw new Error(error);
		}

		const data = await response.json();
		const count = data?.data?.vaults?.length || 0;
		console.log('[graphqlFetcher] Success: Found', count, 'vaults');
		return {
			vaults_count: count
		};
	} catch (error) {
		console.error('[graphqlFetcher] Exception:', url, error);
		throw error;
	}
}

function	SectionStats(): ReactElement {
	const	{data: count, error: countError} = useSWR(
		'https://kong.yearn.fi/api/gql',
		graphqlFetcher,
		{
			revalidateOnFocus: false,
			onError: (err: Error) => console.error('[SWR] Vaults count fetch error:', err)
		}
	) as SWRResponse;

	const	{data: fees, error: feesError} = useSWR(
		'https://api.llama.fi/summary/fees/yearn',
		baseFetcher,
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
