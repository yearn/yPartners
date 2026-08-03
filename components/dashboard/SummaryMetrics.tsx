import {formatAmount} from 'lib/yearn/utils/format.number';

import type {ReactElement} from 'react';

type TProps = {
	tvlOverride?: number,
	userCount?: number,
	feesOverride?: number,
	isLoadingFees?: boolean,
}

function SummaryMetrics(props: TProps): ReactElement {
	const {tvlOverride, userCount, feesOverride, isLoadingFees} = props;

	const hasUserCount = typeof userCount === 'number';
	const tvlValue = tvlOverride ?? 0;
	const feeValue = feesOverride ?? 0;
	const earningsValue = Math.ceil(feeValue * 50) / 100; // 50% of fees, rounded up to 2 decimals

	return (
		<div>
			<div className={'my-10 hidden w-[80%] justify-between bg-good-ol-grey-100 md:flex'}>
				<div>
					<p>{'Contributed TVL'}</p>
					<b className={'text-2xl tabular-nums'}>
						{'$ '}{formatAmount(tvlValue)}
					</b>
				</div>

				<div>
					<p>{'Fees earned to date'}</p>
					<b className={'text-2xl tabular-nums'}>
						{isLoadingFees ? (
							<span className={'text-neutral-400'}>{'Loading...'}</span>
						) : (
							`$ ${formatAmount(feeValue, 0, 2)} `
						)}
					</b>
				</div>

				<div>
					<p>{'Your earnings'}</p>
					<b className={'text-2xl tabular-nums'}>
						{isLoadingFees ? (
							<span className={'text-neutral-400'}>{'Loading...'}</span>
						) : (
							`$ ${formatAmount(earningsValue, 0, 2)} `
						)}
					</b>
				</div>

				<div>
					<p>{'User count'}</p>
					<b className={'text-2xl tabular-nums'}>
						{hasUserCount ? userCount : '-'}
					</b>
				</div>
			</div>

			<div className={'my-10 grid grid-cols-2 bg-good-ol-grey-100 md:hidden'}>
				<div>
					<div className={'mb-5'}>
						<p>{'Contributed TVL'}</p>
						<b className={'text-2xl tabular-nums'}>
							{'$ '}{formatAmount(tvlValue)}
						</b>
					</div>

					<div className={'mb-5'}>
						<p>{'Fees earned to date'}</p>
						<b className={'text-2xl tabular-nums'}>
							{isLoadingFees ? (
								<span className={'text-neutral-400'}>{'Loading...'}</span>
							) : (
								`$ ${formatAmount(feeValue, 0, 2)} `
							)}
						</b>
					</div>
				</div>

				<div>
					<div className={'mb-5 ml-8'}>
						<p>{'Your earnings'}</p>
						<b className={'text-2xl tabular-nums'}>
							{isLoadingFees ? (
								<span className={'text-neutral-400'}>{'Loading...'}</span>
							) : (
								`$ ${formatAmount(earningsValue, 0, 2)} `
							)}
						</b>
					</div>

					<div className={'ml-8'}>
						<p>{'User count'}</p>
						<b className={'text-2xl tabular-nums'}>
							{hasUserCount ? userCount : '-'}
						</b>
					</div>
				</div>

			</div>
		</div>
	);
}

export default SummaryMetrics;
