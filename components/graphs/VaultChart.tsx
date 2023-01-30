import	React		from	'react';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';

import Chart from '../charts/Chart';

import type {ReactElement} from 'react';
import type {TBalanceTVL} from 'types/chart';

const chartColors = [
	'#8884d8', '#82ca9d', '#79A7D9', '#BB8FD9', '#D99F9A',
	'#D9C76F', '#8555A6', '#A68855', '#C98581', '#43597D'
];


type TVaultChartProps = {
	address: string,
	token: string,
	idx: number,
	windowValue: number,
	activeWindow: string,
	balanceTVL: TBalanceTVL[]
}

function	VaultChart(props: TVaultChartProps): ReactElement {
	const {address, token, idx, windowValue, activeWindow, balanceTVL} = props;


	const fillColor = chartColors[idx % chartColors.length] ;

	function getTickInterval(): number | undefined {
		const tickPreferences: {[key: string]: number} = {'1 month': 1, 'All time': 1};
		return tickPreferences[activeWindow];
	}

	return (
		<div className={'h-[400px]'}>

			<Chart
				title={'Wrapper Balance (USD)'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={balanceTVL}
				bars={[{name: 'balanceTVL', fill: fillColor}]}
				yAxisOptions={{domain: ['auto', 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'balance', symbol: '$'}]}
				legendItems={[{type: 'multi', details: [`${token}`, `Wrapper: ${truncateHex(address, 4)}`], color: fillColor}]}/>

			{/* <Chart
				title={'Fees Earned'}
				type={'bar'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'USDC', fill: '#82ca9d'}, {name: 'WBTC', fill: '#8884d8'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'USDC', symbol: 'K'}, {name: 'WBTC', symbol: 'K'}]}
				legendItems={dummyLegendMulti}/>

			<Chart
				title={'Revenue Shared'}
				type={'bar'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'rsUSDC', fill: '#82ca9d'}, {name: 'rsWBTC', fill: '#8884d8'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'USDC', symbol: '%'}, {name: 'WBTC', symbol: '%'}]}
				legendItems={dummyLegendMulti}/> */}

			{/* <Chart
				title={'Aggregate Wrapper Balance'}
				type={'composed'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'awb', fill: '#82ca9d'}, {name: 'profitShare', fill: '#8884d8'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'aggregated', symbol: 'M'}, {name: 'profit shared', symbol: '%'}]}
				legendItems={dummyLegendSingle}/> */}

			{/* <Chart
				title={'Wrapper Balance Distribution'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'rbdUSDC', fill: '#82ca9d'}, {name: 'rbdWBTC', fill: '#8884d8'}]}
				yAxisOptions={{tickCount: 6}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'USDC', symbol: '%'}, {name: 'WBTC', symbol: '%'}]}
				legendItems={dummyLegendMulti}/> */}
		</div>
	);
}

export default VaultChart;
