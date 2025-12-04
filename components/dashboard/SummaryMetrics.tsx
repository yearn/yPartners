import {formatAmount} from 'lib/yearn/utils/format.number';

import type {ReactElement} from 'react';
import type {TPartnerVault} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';

type TProps = {
	vaults: TDict<TPartnerVault>,
	vault: TPartnerVault,
	selectedIndex: number,
}

// Always pass metrics vaults as well as selected index? 
//  Give summary metrics vault and the vaults plus the selected index so it knows what to do 

function SummaryMetrics(props: TProps): ReactElement {
	const {vault, vaults} = props;

	const formatPercent = (n: number, min = 2, max = 2): string => `${formatAmount(n || 0, min, max)}%`;

	const allVaultsTVL = Object.values(vaults).reduce(((acc, vault): number => acc + vault.tvl), 0);
	const allVaultsFees = Object.values(vaults).reduce(((acc, vault): number => acc + vault.totalPayout), 0);
	
	return (
		<div>
			<div className={'my-20 hidden w-[80%] justify-between bg-good-ol-grey-100 md:flex'}>
				<div>
					<p>{'TVL'}</p>
					<b className={'text-2xl tabular-nums'}>
						{'$ '}{vault ? formatAmount(props.vault.tvl) : formatAmount(allVaultsTVL)}
					</b>
				</div>

				<div>
					<p>{'Fees earned to date'}</p>
					<b className={'text-2xl tabular-nums'}>
						{`$ ${vault ? formatAmount(props.vault.totalPayout, 0, 2) : formatAmount(allVaultsFees)} `}
					</b>
				</div>

				<div>
					<p>{'Annual Yield'}</p>
					<b className={'text-2xl tabular-nums'}>
						{vault ? formatPercent(props.vault.apy) : '-'}
					</b>
				</div>

				<div>
					<p>{'Risk Score'}</p>
					<b className={'text-2xl tabular-nums'}>
						{vault ? formatAmount(props.vault.riskScore, 0, 2) : '-'}
					</b>
				</div>
			</div>

			<div className={'my-10 grid grid-cols-2 bg-good-ol-grey-100 md:hidden'}>
				<div>
					<div className={'mb-5'}>
						<p>{'TVL'}</p>
						<b className={'text-2xl tabular-nums'}>
							{'$ '}{vault ? formatAmount(props.vault.tvl) : formatAmount(allVaultsTVL)}
						</b>
					</div>

					<div>
						<p>{'Fees earned to date'}</p>
						<b className={'text-2xl tabular-nums'}>
							{`$ ${vault ? formatAmount(props.vault.totalPayout, 0, 2) : formatAmount(allVaultsFees)} `}
						</b>
					</div>
				</div>

				<div>
					<div className={'mb-5 ml-8'}>
						<p>{'Annual Yield'}</p>
						<b className={'text-2xl tabular-nums'}>
							{vault ? formatPercent(props.vault.apy) : '-'}
						</b>
					</div>

					<div className={'ml-8'}>
						<p>{'Risk Score'}</p>
						<b className={'text-2xl tabular-nums'}>
							{vault ? formatAmount(props.vault.riskScore, 0, 2) : '-'}
						</b>
					</div>
				</div>

			</div>
		</div>
	);
}

export default SummaryMetrics;
