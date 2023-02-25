import	React		from	'react';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';

import Chart from '../charts/Chart';

import type {ReactElement} from 'react';
import type {TChartBar} from 'types/chart';

type TVaultChartProps = {
	address: string,
	token: string,
	windowValue: number,
	activeWindow: string,
	balanceTVL: TChartBar[]
	payoutTotal: TChartBar[]
}

function	VaultChart(props: TVaultChartProps): ReactElement {
	const {address, token, windowValue, balanceTVL, payoutTotal} = props;
	const fillColor = '#8884d8';

	return (
		<div className={'h-[400px]'}>

			<Chart
				title={'Total Fees Earned (USD)'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={payoutTotal}
				bars={[{name: 'data.feePayout', fill: fillColor}]}
				yAxisOptions={{domain: ['auto', 'auto'], hideRightAxis: true}}
				xAxisOptions={{interval: undefined}}
				tooltipItems={[{name: 'payouts total', symbol: '$'}]}
				legendItems={[{type: 'multi', details: [`${token}`, `Wrapper: ${truncateHex(address, 4)}`], color: fillColor}]}/>

			<Chart
				title={'Wrapper Balance (USD)'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={balanceTVL}
				bars={[{name: 'data.balanceTVL', fill: fillColor}]}
				yAxisOptions={{domain: ['auto', 'auto'], hideRightAxis: true}}
				xAxisOptions={{interval: undefined}}
				tooltipItems={[{name: 'balance', symbol: '$'}]}
				legendItems={[{type: 'multi', details: [`${token}`, `Wrapper: ${truncateHex(address, 4)}`], color: fillColor}]}/>

			{/* <Chart
				title={'Revenue Shared'}
				type={'bar'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'rsUSDC', fill: '#82ca9d'}, {name: 'rsWBTC', fill: '#8884d8'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: undefined}}
				tooltipItems={[{name: 'USDC', symbol: '%'}, {name: 'WBTC', symbol: '%'}]}
				legendItems={dummyLegendMulti}/> */}
		</div>
	);
}

export default VaultChart;
