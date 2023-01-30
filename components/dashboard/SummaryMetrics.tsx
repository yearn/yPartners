import React from 'react';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';
import type {TPartnerVault} from 'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

type TProps = {
	vaults: TDict<TPartnerVault>,
	vault: TPartnerVault,
	selectedIndex: number,
}

// Always pass metrics vaults as well as selected index? 
//  Give summary metrics vault and the vaults plus the selected index so it knows what to do 

function SummaryMetrics(props: TProps): ReactElement {
	const {balance, tvl, apy, riskScore} = props.vault;

	const formatPercent = (n: number, min = 2, max = 2): string => `${formatAmount(n || 0, min, max)}%`;

	return (
		<div className={'my-20 flex w-[80%] justify-between bg-good-ol-grey-100'}>
			<div>
				<p>{'TVL'}</p>
				<h1>{`$ ${formatAmount(tvl, 0, 2)}`}</h1>
			</div>

			<div>
				<p>{'Fees earned to date'}</p>
				<h1>{`$ ${formatAmount(balance, 0, 2)}`}</h1>
			</div>

			{apy ? 
				<div>
					<p>{'Annual Yield'}</p>
					<h1>{formatPercent(apy)}</h1>
				</div> : null }

			{riskScore ? 
				<div>
					<p>{'Risk Score'}</p>
					<h1>{formatAmount(riskScore, 0, 2)}</h1>
				</div> : null }
		</div>
	);
}

export default SummaryMetrics;
