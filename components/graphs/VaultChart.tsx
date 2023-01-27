import	React, {useMemo, useState}		from	'react';
import dayjs, {unix} from 'dayjs';
import {NETWORK_CHAINID} from 'utils/b2b';
import axios from 'axios';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';

import Chart from '../charts/Chart';
import VaultDetails from '../dashboard/VaultDetails';

import type {AxiosResponse} from 'axios';
import type {MouseEvent, ReactElement} from 'react';
import type {TPartnerVault, TPartnerVaultsByNetwork} from 'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

const dataWindows = [
	{name: '1 week', value: 7},
	{name: '1 month', value: 29},
	{name: '1 year', value: 365},
	{name: 'All time', value: 50}
];

function	VaultChart(props: { vault: TPartnerVault, partnerID: string }): ReactElement {
	const {partnerID, vault} = props;
	const [activeWindow, set_activeWindow] = useState('1 month');
	const [windowValue, set_windowValue] = useState(29);
	const [balanceTVLs, set_balanceTVLs] = useState<TDict<{name: string, balanceTVL: number}[]>>();

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

	function handleWindowChange(e: MouseEvent<HTMLButtonElement>): void {
		const {name, value} = e.currentTarget;
		set_activeWindow(name);
		set_windowValue(+value);
	}

	function getTickInterval(): number | undefined {
		const tickPreferences: {[key: string]: number} = {'1 month': 1, 'All time': 1};
		return tickPreferences[activeWindow];
	}

	return (
		<div className={'mt-6 h-[400px]'}>
			<div className={'mt-4 flex flex-row space-x-4'}>
				{dataWindows.map((window): ReactElement => (
					<Button
						disabled={window.value === 365}
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

			<VaultDetails vault={vault} />
			<Chart
				title={'Wrapper Balance (USD)'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={balanceTVLs ? balanceTVLs[`${vault.address}_${vault.chainID}`] : []}
				bars={[{name: 'balanceTVL', fill: '#8884d8'}]}
				yAxisOptions={{domain: ['auto', 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'balance', symbol: '$'}]}
				legendItems={[{type: 'multi', details: [`${vault.token}`, `Wrapper: ${truncateHex(vault.address, 4)}`], color: '#8884d8'}]}/>

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
