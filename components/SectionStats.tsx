import useSWR from 'swr';
import {baseFetcher} from 'lib/yearn/utils/fetchers';
import {formatAmount} from 'lib/yearn/utils/format.number';

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


	return (
		<section aria-label={'stats'} className={'mb-28 flex flex-row flex-wrap items-center md:mb-50'}>
			<div className={'mr-4 mt-4 flex flex-col space-y-2 pr-5 md:mr-8 md:mt-0'}>
				<p>{'Fees earned by Partners'}</p>
				<b className={'text-3xl tabular-nums'}>
					{fees ? `$ ${formatAmount(fees.partners_total, 0, 2)}` : '-'}
				</b>
			</div>
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
