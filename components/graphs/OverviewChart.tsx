import	React, {useMemo, useState}	from	'react';
import Chart from 'components/charts/Chart';
import {NETWORK_LABELS} from 'utils/b2b';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';
import type {TChartBar, TLegendItem, TTooltipItem} from 'types/chart';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

type TOverviewChartProps = {
	windowValue: number,
	activeWindow: string,
	wrapperTotals: TChartBar[],
	balanceTVLs: TDict<TChartBar[]>
	payoutTotals: TDict<TChartBar[]>
}

const chartColors = [
	'#79A7D9', '#D9AE64', '#89C977', '#8555A6', '#D99F9A',
	'#A68855', '#C98581', '#7A94F0', '#7A75E6', '#E68F5E',
	'#D9C76F', '#79A34B', '#59522E', '#4D3B59', '#43597D'
];


function	OverviewChart(props: TOverviewChartProps): ReactElement {
	const {wrapperTotals, balanceTVLs, windowValue, payoutTotals} = props;
	const [assetsList, set_assetsList] = useState<string[]>([]);

	const harvestEvents = useMemo((): TChartBar[] => {
		if(Object.values(payoutTotals).length === 0 ){
			return [{name: 'no data', shortDate: 'n/a', data: {}}];
		}

		const _data: TChartBar[] = Object.values(payoutTotals)[0].map((item): TChartBar => {
			const {name, shortDate} = item;
			return {name, shortDate, data: {}};
		});

		const _assets = new Set<string>();

		Object.keys(payoutTotals).forEach((key): void => {
			const dailyPayoutTotals = payoutTotals[key]; 
			const [address, network] = key.split('_');

			let lastPayout = 0;
			Object.values(dailyPayoutTotals).forEach((dailyPayoutTotal, idx): void => {
				const {token} = dailyPayoutTotal;
				const assetId = `${token}_${network}_${address}`;

				if(!_assets.has(assetId)){
					_assets.add(assetId);
				}

				if(idx === 0){
					lastPayout = dailyPayoutTotal.data.feePayout;
				}else {
					const _currentPayout = dailyPayoutTotal.data.feePayout;
					const payoutDiff = _currentPayout - lastPayout;
					if(payoutDiff > 0){
						lastPayout = _currentPayout;
						// Distinction by address required as some partners have equivalent asset vaults on the same network
						// not separation this way causes later instances of the asset to override values for the first instances
						_data[idx] = {..._data[idx], data: {..._data[idx].data, [assetId]: payoutDiff}};
					} else {
						_data[idx] = {..._data[idx], data: {..._data[idx].data, [assetId]: 0}};
					}
				}
			});
		});

		set_assetsList(Array.from(_assets));

		// Remove first element as it will contain no data and cause errors
		_data.shift();
		
		return _data;
		
	}, [payoutTotals]);

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
				const _percent = totalTVL === 0 ? 0 : +formatAmount((balanceTVL / totalTVL) * 100, 0, 4).slice(0, -1);

				// Distinction by address required as some partners have equivalent asset vaults on the same network
				// not separation this way causes later instances of the asset to override values for the first instances
				_data[i] = {..._data[i], data: {..._data[i].data, [`${token}_${network}_${address}`]: _percent}};
			});
		});

		return _data;

	}, [wrapperTotals, balanceTVLs]);
	
	return (
		<div>
			<Chart
				title={'Individual Harvest Events (USD)'}
				type={'stacked'}
				className={'mb-20'}
				windowValue={windowValue}
				data={harvestEvents}
				bars={assetsList.map((asset, idx): {name: string, fill: string} => {
					const bar = {name: `data.${asset}`, fill: chartColors[idx % chartColors.length]};
					return bar;
				})}
				yAxisOptions={{domain: [0, 'auto'], hideRightAxis: true}}
				xAxisOptions={{interval: undefined}}
				tooltipItems={assetsList.map((asset, idx): TTooltipItem => {
					const [name, network] = asset.split('_');
					const networkShort = NETWORK_LABELS[+network];
					const fill = chartColors[idx % chartColors.length];
						
					return {name: `${name} - ${networkShort}`, symbol: {pre: '$', post: ''}, fill};
				}).reverse()}
				legendItems={assetsList.map((asset, idx): TLegendItem => {
					const [token, ,] = asset.split('_');
		
					const legendItem = {
						type: 'single',
						details: `${token}`,
						color: chartColors[idx % chartColors.length],
						isCondensed: true
					};
					return legendItem;
				}).reverse()} />

	

			<Chart
				title={'Aggregate Wrapper Balance (USD)'}
				type={'composed'}
				className={'mb-20'}
				windowValue={windowValue}
				data={wrapperTotals}
				bars={[{name: 'data.totalTVL', fill: '#8884d8'}, {name: 'data.profitShare', fill: '#82ca9d'}]}
				yAxisOptions={{domain: [0, 'auto'], hideRightAxis: false}}
				xAxisOptions={{interval: undefined}}
				tooltipItems={[{name: 'profit share', symbol: {pre: '', post: '%'}}, {name: 'balance', symbol: {pre: '$', post: ''}}].reverse()}
				legendItems={[
					{type: 'single', details: 'Aggregate Wrapper Balance', color: '#8884d8', isThin: true},
					{type: 'single', details: 'Profit Share', color: '#82ca9d'}
				].reverse()}/>

			{wrapperPercentages && (			
				<Chart
					title={'Wrapper Balance Distribution'}
					type={'stacked'}
					className={'mb-20'}
					windowValue={windowValue}
					data={wrapperPercentages}
					bars={Object.keys(wrapperPercentages[0].data).map((asset, idx): {name: string, fill: string} => {
						return {name: `data.${asset}`, fill: chartColors[idx % chartColors.length]};
					})}
					yAxisOptions={{domain: [0, 'auto'], hideRightAxis: true}}
					xAxisOptions={{interval: undefined}}
					tooltipItems={Object.keys(wrapperPercentages[0].data).map((asset, idx): TTooltipItem => {
						const [name, network] = asset.split('_');
						const networkShort = NETWORK_LABELS[+network];
						const fill = chartColors[idx % chartColors.length];
					
						return {name: `${name} - ${networkShort}`, symbol: {pre: '', post: '%'}, fill};
					}).reverse()}
					legendItems={Object.keys(wrapperPercentages[0].data).map((asset, idx): TLegendItem => {
						const [token, ,] = asset.split('_');

						const legendItem = {
							type: 'single',
							details: `${token}`,
							color: chartColors[idx % chartColors.length],
							isCondensed: true
						};
						return legendItem;
					}).reverse()} />)}

		</div>
	);
}

export default OverviewChart;
