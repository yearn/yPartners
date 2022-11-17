import	React, {MouseEvent, ReactElement, useEffect, useState}		from	'react';
import	{Button}					from	'@yearn-finance/web-lib/components';
import {TChartData} from 'types/chart';

import Chart from './Chart';
import VaultDetails from './VaultDetails';

const dataWindows = [
	{name: '1 day', value: 1},
	{name: '1 week', value: 7}, 
	{name: '1 month', value: 29}, 
	{name: '1 year', value: 365}, 
	{name: 'All time', value: 50}
];

const dummyLegendMulti = [
	{type: 'multi', details: ['USDC', 'Wrapper: 0x23a...089ca'], color: '#8884d8'},
	{type: 'multi', details: ['WBTC', 'Wrapper: 0x23a...089ca'], color: '#82ca9d'}
];

const dummyLegendSingle = [
	{type: 'single', details: 'Aggregate Wrapper Balance', color: '#8884d8', isThin: true},
	{type: 'single', details: 'Profit Share', color: '#82ca9d'}
];

function generateData(window = 29): TChartData[]{
	const data = [];

	for (let i = 0; i < window; i++) {
		const fees = {WBTC: ~~(Math.random()* 300), USDC: ~~(Math.random()* 300)};
		const revShare = {rsWBTC: ((Math.random()%0.3).toFixed(2)), rsUSDC: ((Math.random()%0.3)).toFixed(2)};

		const baseAggBal = 100 - (Math.random()*50);
		const aggregateWrapBal = {awb: (baseAggBal * 0.7).toFixed(0), profitShare: baseAggBal.toFixed(0)}; 
		
		const baseWrapperBalance = Math.random()*100;
		const remWrapBalance = 100-baseWrapperBalance;
		const wrapperBalDist = {rbdWBTC: baseWrapperBalance.toFixed(2), rbdUSDC: remWrapBalance.toFixed(2)};

		data.push({name: `${i+1}`, ...fees, ...revShare, ...aggregateWrapBal, ...wrapperBalDist});
	} 

	return data;
}

function	Overview(): ReactElement {
	const [activeWindow, set_activeWindow] = useState('1 month');
	const [windowValue, set_windowValue] = useState(29);
	const [dummyData, set_dummyData] = useState(generateData());

	useEffect((): void => {
		const data = generateData(windowValue);
		set_dummyData(data);
	}, [windowValue]);

	function handleWindowChange(e: MouseEvent<HTMLButtonElement>): void {
		const {name, value} = e.currentTarget;
		set_activeWindow(name);
		set_windowValue(+value);
	}

	function getTickInterval(): number | undefined {
		const tickPreferences: {[key: string]: number} = {'1 day': 1, '1 month': 1, 'All time': 1};
		return tickPreferences[activeWindow];
	}

	return (
		<div className={'mt-6 h-[400px]'}>
			<div className={'flex flex-row mt-4 space-x-4'}>
				{dataWindows.map((window): ReactElement => (
					<Button
						key={window.name}
						name={window.name}
						value={window.value}
						className={'w-[90px] text-xs md:w-[100px] md:text-base'}
						variant={window.name === activeWindow ? 'filled' : 'outlined'}
						onClick={handleWindowChange}>
						{window.name}
					</Button>
				))}
			</div>

			<VaultDetails/>

			<Chart
				title={'Fees Earned'}
				type={'bar'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'WBTC', fill: '#82ca9d'}, {name: 'USDC', fill: '#8884d8'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'USDC', symbol: 'K'}, {name: 'WBTC', symbol: 'K'}]}
				legendItems={dummyLegendMulti}/>
			
			<Chart
				title={'Revenue Shared'}
				type={'bar'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'rsWBTC', fill: '#82ca9d'}, {name: 'rsUSDC', fill: '#8884d8'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'USDC', symbol: '%'}, {name: 'WBTC', symbol: '%'}]}
				legendItems={dummyLegendMulti}/>

			<Chart
				title={'Aggregate Wrapper Balance'}
				type={'composed'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'awb', fill: '#82ca9d'}, {name: 'profitShare', fill: '#8884d8'}]}
				yAxisOptions={{domain: [0, 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'aggregated', symbol: 'M'}, {name: 'profit shared', symbol: '%'}]}
				legendItems={dummyLegendSingle}/>

			<Chart
				title={'Wrapper Balance Distribution'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={dummyData}
				bars={[{name: 'rbdWBTC', fill: '#82ca9d'}, {name: 'rbdUSDC', fill: '#8884d8'}]}
				yAxisOptions={{tickCount: 6}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'USDC', symbol: '%'}, {name: 'WBTC', symbol: '%'}]}
				legendItems={dummyLegendMulti}/>
		</div>
	);
}

export default Overview;
