import	React, {useMemo}	from	'react';
import Chart from 'components/charts/Chart';
import {NETWORK_LABELS} from 'utils/b2b';
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

const chartColors = [
	'#79A7D9', '#D9AE64', '#89C977', '#8555A6', '#D99F9A',
	'#A68855', '#C98581', '#7A94F0', '#7A75E6', '#E68F5E',
	'#D9C76F', '#79A34B', '#59522E', '#4D3B59', '#43597D'
];


function	OverviewChart(props: TOverviewChartProps): ReactElement {
	const {wrapperTotals, balanceTVLs, windowValue, activeWindow} = props;

	const wrapperPercentages = useMemo((): TChartBar[] => {
		const _data: TChartBar[] = wrapperTotals.map((item): TChartBar => {
			return {...item, data: {}};
		});

		Object.keys(balanceTVLs).forEach((key): void => {
			const asset = balanceTVLs[key]; 
			const [address, network] = key.split('_');

			asset.forEach((dataPoint, i): void => {
				const {token} = dataPoint;
				const {balanceTVL} = dataPoint.data;
				const {totalTVL} = wrapperTotals[i].data;
				const _percent = totalTVL === 0 ? 0 : +formatAmount((balanceTVL / totalTVL) * 100, 0, 2);

				// Distinction by address required as some partners have equivalent asset vaults on the same network
				// not separation this way causes later instances of the asset to override values for the first instances
				_data[i] = {..._data[i], data: {..._data[i].data, [`${token}_${network}_${address}`]: _percent}};
			});
		});

		return _data;

	}, [wrapperTotals, balanceTVLs]);

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

			<Chart
				title={'Wrapper Balance Distribution'}
				type={'stacked'}
				className={'mb-20'}
				windowValue={windowValue}
				data={wrapperPercentages}
				bars={wrapperPercentages.map((item, idx): {name: string, fill: string} => {
					const asset = Object.keys(item.data)[idx];
					return {name: `data.${asset}`, fill: chartColors[idx % chartColors.length]};
				})}
				yAxisOptions={{domain: [0, 'auto'], hideRightAxis: true}}
				xAxisOptions={{interval: getTickInterval(activeWindow)}}
				tooltipItems={Object.keys(wrapperPercentages[0].data).map((asset): {name: string, symbol: string} => {
					const [name, network] = asset.split('_');
					const networkShort = NETWORK_LABELS[+network];
					
					return {name: `${name} - ${networkShort}`, symbol: '%'};
				})}
				legendItems={dummyLegendSingle}/>
		</div>
	);
}

export default OverviewChart;
