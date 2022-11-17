/* eslint-disable @typescript-eslint/naming-convention */
import	React, {ReactElement}		from	'react';

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
	const {active, items, payload, label} = props;

	if (active && payload) {
		return (
			<div className={'p-2 bg-good-ol-grey-300 rounded opacity-90'}>
				<p>{`Day ${(label || 0) + 1}`}</p>

				{items.map((item: TTooltipItem, idx: number): ReactElement => {
					const {name, symbol} = item;
					return (
						<p key={name}><span className={'font-semibold'}>{`${name}: `}</span>{`${payload[idx].value} ${symbol}`}</p>
					);
				})}
			</div>
		);
	}

	return null;
}

export default ToolTip;