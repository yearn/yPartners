import	React, {ReactElement}		from	'react';
import {Bar, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {TChartProps} from 'types/chart';
import {formatXAxis, formatYAxis} from 'utils/b2b/Chart';

import CustomTooltip from '../CustomTooltip';

function	Composed(props: TChartProps): ReactElement {
	const {tooltipItems, data, bars, windowValue, yAxisOptions, xAxisOptions} = props;
	const firstSymbol = tooltipItems[0].symbol;
	const secondSymbol = tooltipItems[1].symbol;

	function getBarSize(): number {
		if(!windowValue){
			return -1;
		}

		return windowValue < 29 ? 30 : 7;
	}

	return (
		<ResponsiveContainer width={'85%'} height={'100%'}>
			<ComposedChart
				width={500}
				height={300}
				data={data}
				barCategoryGap={-0.4}
				margin={{
					top: 10,
					right: 80,
					left: 0,
					bottom: 5
				}}>
				<XAxis
					xAxisId={1}
					tickFormatter={formatXAxis}
					interval={xAxisOptions.interval}  />
				<XAxis xAxisId={2} hide={true} />

				<YAxis
					yAxisId={0}
					dataKey={'profitShare'}
					domain={yAxisOptions.domain}
					tickCount={yAxisOptions.tickCount}
					ticks={yAxisOptions.ticks}
					tickFormatter={(value): string => formatYAxis(firstSymbol, value)}/>
				<YAxis
					yAxisId={1}
					orientation={'right'}
					dataKey={'awb'}
					domain={yAxisOptions.domain}
					tickCount={yAxisOptions.tickCount}
					ticks={yAxisOptions.ticks}
					tickFormatter={(value): string => formatYAxis(secondSymbol, value)}/>
				<Tooltip content={<CustomTooltip items={tooltipItems} />}/>

				<Bar
					xAxisId={1}
					dataKey={'profitShare'}
					fill={bars[0].fill} />
				<Bar
					xAxisId={2}
					dataKey={'awb'}
					fill={bars[1].fill} 
					barSize={getBarSize()} />
			</ComposedChart>
		</ResponsiveContainer>
	);
}

export default Composed;