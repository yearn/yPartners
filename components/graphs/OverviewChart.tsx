import	React	from	'react';
import Chart from 'components/charts/Chart';
import {getTickInterval} from 'utils/b2b/Chart';

import type {ReactElement} from 'react';
import type {TChartBar} from 'types/chart';

type TOverviewChartProps = {
	windowValue: number,
	activeWindow: string,
	wrapperTotals: TChartBar[]
}

const dummyLegendSingle = [
	{type: 'single', details: 'Aggregate Wrapper Balance', color: '#8884d8', isThin: true},
	{type: 'single', details: 'Profit Share', color: '#82ca9d'}
];

function	OverviewChart(props: TOverviewChartProps): ReactElement {
	const {wrapperTotals, windowValue, activeWindow} = props;

	return (
		<div className={'h-[400px]'}>
			<Chart
				title={'Aggregate Wrapper Balance (USD)'}
				type={'composed'}
				className={'mb-20'}
				windowValue={windowValue}
				data={wrapperTotals}
				bars={[{name: 'data.totalTVL', fill: '#8884d8'}, {name: 'data.profitShare', fill: '#82ca9d'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: getTickInterval(activeWindow)}}
				tooltipItems={[{name: 'profit share', symbol: ''}, {name: 'balance', symbol: '$'}]}
				legendItems={dummyLegendSingle}/>
		</div>
	);
}

export default OverviewChart;
