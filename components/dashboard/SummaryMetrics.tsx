import {formatAmount} from 'lib/yearn/utils/format.number';

import type {ReactElement} from 'react';
import type {TPartnerVault} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';

type TProps = {
	vaults: TDict<TPartnerVault>,
	vault?: TPartnerVault,
	selectedIndex: number,
	tvlOverride?: number,
	userCount?: number,
	feesOverride?: number,
}

// Always pass metrics vaults as well as selected index? 
//  Give summary metrics vault and the vaults plus the selected index so it knows what to do 

function SummaryMetrics(props: TProps): ReactElement {
	const {vault, vaults, tvlOverride, userCount, feesOverride} = props;

	const aggregatedTVL = tvlOverride ?? Object.values(vaults).reduce(((acc, vault): number => acc + vault.tvl), 0);
	const aggregatedFees = feesOverride ?? Object.values(vaults).reduce(((acc, vault): number => acc + vault.totalPayout), 0);
	const hasUserCount = typeof userCount === 'number';
	const tvlValue = vault ? vault.tvl : aggregatedTVL;
	const feeValue = vault ? vault.totalPayout : aggregatedFees;
	const riskScore = vault ? vault.riskScore : undefined;
	
	return (
		<div>
			<div className={'my-20 hidden w-[80%] justify-between bg-good-ol-grey-100 md:flex'}>
				<div>
					<p>{'TVL'}</p>
					<b className={'text-2xl tabular-nums'}>
						{'$ '}{formatAmount(tvlValue)}
					</b>
				</div>

				<div>
					<p>{'Fees earned to date'}</p>
					<b className={'text-2xl tabular-nums'}>
						{`$ ${formatAmount(feeValue, 0, 2)} `}
					</b>
				</div>

				<div>
					<p>{hasUserCount ? 'User count' : 'Risk Score'}</p>
					<b className={'text-2xl tabular-nums'}>
						{hasUserCount ? userCount : (riskScore !== undefined ? formatAmount(riskScore, 0, 2) : '-')}
					</b>
				</div>
			</div>

			<div className={'my-10 grid grid-cols-2 bg-good-ol-grey-100 md:hidden'}>
				<div>
					<div className={'mb-5'}>
						<p>{'TVL'}</p>
						<b className={'text-2xl tabular-nums'}>
							{'$ '}{formatAmount(tvlValue)}
						</b>
					</div>

					<div>
						<p>{'Fees earned to date'}</p>
						<b className={'text-2xl tabular-nums'}>
							{`$ ${formatAmount(feeValue, 0, 2)} `}
						</b>
					</div>
				</div>

				<div>
					<div className={'ml-8'}>
						<p>{hasUserCount ? 'User count' : 'Risk Score'}</p>
						<b className={'text-2xl tabular-nums'}>
							{hasUserCount ? userCount : (riskScore !== undefined ? formatAmount(riskScore, 0, 2) : '-')}
						</b>
					</div>
				</div>

			</div>
		</div>
	);
}

export default SummaryMetrics;
