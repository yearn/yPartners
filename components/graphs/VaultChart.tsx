import {useMemo}		from	'react';
import {truncateHex} from 'lib/yearn/utils/address';

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

	const payouts = useMemo((): TChartBar[] => {
		const _data: TChartBar[] = [];

		let lastPayout = 0;
		Object.values(payoutTotal).forEach((dailyPayoutTotal, idx): void => {
			if(idx === 0){
				lastPayout = dailyPayoutTotal.data.feePayout;
			}else {
				const _currentPayout = dailyPayoutTotal.data.feePayout;
				const payoutDiff = _currentPayout - lastPayout;
				if(payoutDiff > 0){
					lastPayout = _currentPayout;
					const harvestEvent: TChartBar = {...dailyPayoutTotal, data: {harvestAmount : payoutDiff}};
					_data.push(harvestEvent);
				}
			}
		});

		return _data;

	}, [payoutTotal]);

	return (
		<div>
			<Chart
				title={'Harvest Events (USD)'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={payouts}
				bars={[{name: 'data.harvestAmount', fill: fillColor}]}
				yAxisOptions={{domain: ['auto', 'auto'], hideRightAxis: true}}
				xAxisOptions={{interval: undefined}}
				tooltipItems={[{name: 'harvested', symbol: {pre: '$', post: ''}}]}
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
				tooltipItems={[{name: 'balance', symbol: {pre: '$', post: ''}}]}
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
