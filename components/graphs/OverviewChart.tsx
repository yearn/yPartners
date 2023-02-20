import	React, {useMemo}	from	'react';
import Chart from 'components/charts/Chart';
import {getTickInterval} from 'utils/b2b/Chart';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';
import type {TChartBar} from 'types/chart';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

type TOverviewChartProps = {
	windowValue: number,
	activeWindow: string,
	wrapperTotals: TChartBar[],
	balanceTVLs: TDict<TChartBar[]>
}

const dummyLegendSingle = [
	{type: 'single', details: 'Aggregate Wrapper Balance', color: '#8884d8', isThin: true},
	{type: 'single', details: 'Profit Share', color: '#82ca9d'}
];

function	OverviewChart(props: TOverviewChartProps): ReactElement {
	const {wrapperTotals, balanceTVLs, windowValue, activeWindow} = props;

	const wrapperPercentages = useMemo((): TDict<TChartBar[]> => {
		const _percentages: TDict<TChartBar[]> = {};

		Object.keys(balanceTVLs).forEach((address): void => {
			const asset = balanceTVLs[address];

			const result = asset.map((dataPoint, i): TChartBar => {
				const {balanceTVL} = dataPoint.data;
				const {totalTVL} = wrapperTotals[i].data;
				const _percent = totalTVL === 0 ? 0 : +formatAmount((balanceTVL / totalTVL) * 100, 0, 2);
				
				return ({...dataPoint, data: {percentage: _percent, balanceTVL, totalTVL}});
			});

			_percentages[address] = result;
		});

		return _percentages;

	}, [wrapperTotals, balanceTVLs]);

	console.log(wrapperPercentages);
	
	return (
		<div className={'h-[400px]'}>
			<Chart
				title={'Aggregate Wrapper Balance (USD)'}
				type={'composed'}
				className={'mb-10'}
				windowValue={windowValue}
				data={wrapperTotals}
				bars={[{name: 'data.totalTVL', fill: '#8884d8'}, {name: 'data.profitShare', fill: '#82ca9d'}]}
				yAxisOptions={{domain: [0, 'auto'], hideRightAxis: false}}
				xAxisOptions={{interval: getTickInterval(activeWindow)}}
				tooltipItems={[{name: 'profit share', symbol: ''}, {name: 'balance', symbol: '$'}]}
				legendItems={dummyLegendSingle}/>

			{/* <Chart
				title={'Wrapper Balance Distribution'}
				type={'composed'}
				className={'mb-20'}
				windowValue={windowValue}
				data={wrapperTotals}
				bars={[{name: 'data.totalTVL', fill: '#8884d8'}, {name: 'data.profitShare', fill: '#82ca9d'}]}
				yAxisOptions={{domain: [0, 'auto'], hideRightAxis: true}}
				xAxisOptions={{interval: getTickInterval(activeWindow)}}
				tooltipItems={[{name: 'profit share', symbol: ''}, {name: 'balance', symbol: '$'}]}
				legendItems={dummyLegendSingle}/> */}
		</div>
	);
}

export default OverviewChart;
