import	React, {ReactElement}		from	'react';

type TTooltip = {
	active?: boolean,
	symbol?: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: any
};

function ToolTip({active, symbol, payload}: TTooltip): ReactElement | null {
	if (active) {
		return (
			<div className={'p-2 bg-good-ol-grey-300 rounded opacity-90'}>
				<p><span className={'font-semibold'}>{'USDC: '}</span>{`${payload[0].value} ${symbol}`}</p>
				<p><span className={'font-semibold'}>{'WBTC: '}</span>{`${payload[1].value} ${symbol}`}</p>
			</div>
		);
	}

	return null;
}

export default ToolTip;