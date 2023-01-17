import	React		from	'react';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';
import type {TPartnerVault} from 'types/types';


function	VaultDetails(props: {vault: TPartnerVault}): ReactElement {
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

			<div>
				<p>{'Annual Yield'}</p>
				<h1>{formatPercent(apy)}</h1>
			</div>

			<div>
				<p>{'Risk Score'}</p>
				<h1>{formatAmount(riskScore, 0, 2)}</h1>
			</div>
		</div>
	);
}

export default VaultDetails;