import React from 'react';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';
import type {TTooltipItem} from 'types/chart';

type TTooltip = {
	active?: boolean,
	items: TTooltipItem[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: any
	label?: number
	type?: string
};

function ToolTip(props: TTooltip): ReactElement | null {
	const {active: isActive, items, payload} = props;

	if (isActive && payload) {

		return (
			<div className={'rounded bg-good-ol-grey-300 p-2 opacity-90'}>
				<p className={'mb-1'}>{`${payload[0].payload.name}`}</p>

				{items.map((item, idx): ReactElement => {
					const negativeIndex = payload.length - (idx+1);
					const {symbol} = item;

					return (
						<div key={idx}>
							{payload[idx] && 
								<p>
									<span style={{backgroundColor: `${item.fill}`}} className={'mr-4 inline-block h-4 w-4'}></span>
									<span >{`${item.name}:  `}</span>
									<span className={'ml-2 font-semibold'}>{`${symbol.pre} ${formatAmount(payload[negativeIndex].value, 0, 2)} ${symbol.post}`}</span>
								</p>
							}
						</div>
					);
				})}
			</div>
		);
	}

	return null;
}

export default ToolTip;
