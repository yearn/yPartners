import React from 'react';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';

type TTooltip = {
	active?: boolean,
	items: TTooltipItem[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: any
	label?: number
};

type TTooltipItem = {
	name: string,
	symbol: string
}

function ToolTip(props: TTooltip): ReactElement | null {
	const {active: isActive, items, payload} = props;

	if (isActive && payload) {
		return (
			<div className={'rounded bg-good-ol-grey-300 p-2 opacity-90'}>
				<p>{`${payload[0].payload.name}`}</p>

				{payload[1] ? 
					<>
						<p>
							<span className={'font-semibold'}>{`${items[1].name}:  `}</span>{` ${items[1].symbol} ${formatAmount(payload[1].value, 2, 2)}`} 
						</p>
						<p><span className={'font-semibold'}>{`${items[0].name}:  `}</span>{`${payload[0].value} %`}</p>
					</>
					: 
					<p><span className={'font-semibold'}>{`${items[0].name}:  `}</span>{`${items[0].symbol} ${formatAmount(payload[0].value, 2, 2)}`}</p>}

			</div>
		);
	}

	return null;
}

export default ToolTip;
