import	React		from	'react';
import {getTickInterval} from 'utils/b2b/Chart';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';

import Chart from '../charts/Chart';

import type {ReactElement} from 'react';
import type {TChartBar} from 'types/chart';

// const chartColors = [
// 	'#79A7D9', '#BB8FD9', '#D99F9A', '#D9C76F', '#8555A6',
// 	'#A68855', '#C98581', '#43597D'
// ];


type TVaultChartProps = {
	address: string,
	token: string,
	windowValue: number,
	activeWindow: string,
	balanceTVL: TChartBar[]
}

function	VaultChart(props: TVaultChartProps): ReactElement {
	const {address, token, windowValue, activeWindow, balanceTVL} = props;
	
	// const fillColor = chartColors[idx % chartColors.length];
	// Purple reserved for normal / aggregate wrapper balance for now
	// Chart color array will be used in future charts
	const fillColor = '#8884d8';

	return (
		<div className={'h-[400px]'}>

			<Chart
				title={'Wrapper Balance (USD)'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={balanceTVL}
				bars={[{name: 'data.balanceTVL', fill: fillColor}]}
				yAxisOptions={{domain: ['auto', 'auto']}}
				xAxisOptions={{interval: getTickInterval(activeWindow)}}
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
