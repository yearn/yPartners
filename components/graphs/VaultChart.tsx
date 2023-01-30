import	React, {useMemo, useState}		from	'react';
import dayjs, {unix} from 'dayjs';
import {NETWORK_CHAINID} from 'utils/b2b';
import axios from 'axios';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';

import Chart from '../charts/Chart';

import type {AxiosResponse} from 'axios';
import type {ReactElement} from 'react';
import type {TPartnerVaultsByNetwork} from 'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

const chartColors = [
	'#8884d8', '#82ca9d', '#79A7D9', '#BB8FD9', '#D99F9A',
	'#D9C76F', '#8555A6', '#A68855', '#C98581', '#43597D'
];

type TVaultChartProps = {
	address: string,
	chainID: number,
	token: string,
	partnerID: string,
	idx: number,
	windowValue: number,
	activeWindow: string
}

function	VaultChart(props: TVaultChartProps): ReactElement {
	const {address, chainID, token, partnerID, idx, windowValue, activeWindow} = props;
	const [balanceTVLs, set_balanceTVLs] = useState<TDict<{name: string, balanceTVL: number}[]>>();

	const fillColor = chartColors[idx % chartColors.length] ;

	useMemo((): void => {
		const baseURI = `${process.env.YVISION_BASE_URI}/partners/${partnerID}/balance`;

		const now = dayjs().unix();
		const startOfToday = dayjs().startOf('D').unix();

		const endpoints = [`${baseURI}?ts=${now}`];
			
		for (let i = 1; i < windowValue; i++) {
			const ts = startOfToday - (86400 * i);
			endpoints.push(`${baseURI}?ts=${ts}`);
		}

		// reverse so requests resolve with first elements being the oldest
		endpoints.reverse();
		const partnerBalanceTVL: TDict<{name: string, balanceTVL: number}[]> = {};

		Promise.all(endpoints.map(async (endpoint): Promise<AxiosResponse> => axios.get(endpoint))).then(
			(responses): void => {
				responses.forEach(({data}): void => {
					const vaultsAllNetworksOject = Object.values(data || {})[0] as TPartnerVaultsByNetwork;

					for (const [networkName, vaultsForNetwork] of Object.entries(vaultsAllNetworksOject || {})) {
						const	chainID = NETWORK_CHAINID[networkName];

						for (const [vaultAddress, currentVault] of Object.entries(vaultsForNetwork || {})) {
							const vaultBalanceArray = partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`];
							
							const dataPoint = {name: unix(data.ts).format('MMM DD YYYY'), balanceTVL: currentVault.tvl};

							if(vaultBalanceArray){
								partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`].push(dataPoint);
							}else{
								partnerBalanceTVL[`${toAddress(vaultAddress)}_${chainID}`] = [dataPoint];
							}
						}
					}
				});

				set_balanceTVLs(partnerBalanceTVL);
			});

	}, [partnerID, windowValue]);

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
				data={balanceTVLs ? balanceTVLs[`${address}_${chainID}`] : []}
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
