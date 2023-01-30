import	React		from	'react';

import type {ReactElement} from 'react';
import type {TPartnerVault} from 'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

type TVaultChartProps = {
	vaults: TDict<TPartnerVault>,
	partnerID: string,
	windowValue: number,
	activeWindow: string
}

function	VaultChart(props: TVaultChartProps): ReactElement {

	console.log(props);


	return (
		<div className={'h-[400px]'}>

			{'Hello'}

			{/* <SummaryMetrics vault={vault} />
			<Chart
				title={'Wrapper Balance (USD)'}
				type={'bar'}
				className={'mb-20'}
				windowValue={windowValue}
				data={balanceTVLs ? balanceTVLs[`${vault.address}_${vault.chainID}`] : []}
				bars={[{name: 'balanceTVL', fill: fillColor}]}
				yAxisOptions={{domain: ['auto', 'auto']}}
				xAxisOptions={{interval: getTickInterval()}}
				tooltipItems={[{name: 'balance', symbol: '$'}]}
				legendItems={[{type: 'multi', details: [`${vault.token}`, `Wrapper: ${truncateHex(vault.address, 4)}`], color: fillColor}]}/> */}

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
		</div>
	);
}

export default VaultChart;
