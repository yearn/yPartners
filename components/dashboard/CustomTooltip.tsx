import	React, {ReactElement}		from	'react';

type TTooltip = {
	active?: boolean,
	symbol?: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: any
};

function ToolTip({active, symbol, payload}: TTooltip): ReactElement | null {
	function formatName(name: string): string {
		return name.length > 4 ? name.substring(name.length - 4) : name;
	}

	if (active && payload !== null) {
		const name1 = formatName(payload[1].name);
		const name0 = formatName(payload[0].name);

		return (
			<div className={'p-2 bg-good-ol-grey-300 rounded opacity-90'}>
				<p><span className={'font-semibold'}>{`${name1}: `}</span>{`${payload[1].value} ${symbol}`}</p>
				<p><span className={'font-semibold'}>{`${name0}: `}</span>{`${payload[0].value} ${symbol}`}</p>
			</div>
		);
	}

	return null;
}

export default ToolTip;