import useSWR from 'swr';
import {baseFetcher} from '@yearn-finance/web-lib/utils/fetchers';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';
import type {SWRResponse} from 'swr';

function	SectionStats(): ReactElement {
	const	{data: count} = useSWR(
		`${process.env.YVISION_BASE_URI}/partners/count`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;

	const	{data: fees} = useSWR(
		`${process.env.YVISION_BASE_URI}/partners/total`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;

	const	{data: tvl} = useSWR(
		`${process.env.YVISION_BASE_URI}/tvl/total`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;
	

	return (
		<section aria-label={'stats'} className={'mb-28 flex flex-row flex-wrap items-center md:mb-50'}>
			<div className={'mt-4 mr-4 flex flex-col space-y-2 pr-5 md:mt-0 md:mr-8'}>
				<p>{'TVL by all Partners'}</p>
				<b className={'text-3xl tabular-nums'}>
					{tvl ? `$ ${formatAmount(tvl.tvl_total, 0, 2)}` : '-'}
				</b>
			</div>
			<div className={'mt-4 mr-4 flex flex-col space-y-2 pr-5 md:mt-0 md:mr-8'}>
				<p>{'Fees earned by Partners'}</p>
				<b className={'text-3xl tabular-nums'}>
					{fees ? `$ ${formatAmount(fees.partners_total, 0, 2)}` : '-'}
				</b>
			</div>
			{/* <div className={'mt-4 mr-8 flex flex-col space-y-2 pr-5 md:mt-0'}>
				<p>{'Share of Revenue'}</p>
				<b className={'text-3xl tabular-nums'}>
					{`${formatAmount(shares, 0, 2)}%`}
				</b>
			</div> */}
			<div className={'mt-4 flex flex-col space-y-2 pr-5 md:mt-0'}>
				<p>{'Partners'}</p>
				<b className={'text-3xl tabular-nums'}>
					{count ? count.partners_count : '-'}
				</b>
			</div>
		</section>
	);
}

export default SectionStats;
