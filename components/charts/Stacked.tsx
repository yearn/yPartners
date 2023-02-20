import React from 'react';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {formatXAxis, formatYAxis} from 'utils/b2b/Chart';

import CustomTooltip from './CustomTooltip';

import type {ReactElement} from 'react';
import type {TChartProps} from 'types/chart';

function StackedChart(props: TChartProps): ReactElement {
	const {tooltipItems, data, bars, yAxisOptions, xAxisOptions} = props;
	const tooltipSymbol = tooltipItems[0].symbol;

	return (
		<ResponsiveContainer width={'85%'} height={'100%'}>
			<BarChart
				width={500}
				height={300}
				data={data}
				margin={{
					top: 10,
					right: 80,
					left: 30,
					bottom: 5
				}}
			>
				<XAxis tickFormatter={formatXAxis} interval={xAxisOptions.interval}/>
				<YAxis
					domain={yAxisOptions.domain}
					tickCount={yAxisOptions.tickCount}
					ticks={yAxisOptions.ticks}
					tickFormatter={(value): string => formatYAxis(tooltipSymbol, value)}
					interval={yAxisOptions.interval} />
				<Tooltip content={<CustomTooltip items={tooltipItems} />}/>

				{bars.map((bar): ReactElement => {
					return (
						<Bar
							key={bar.name}
							dataKey={bar.name}
							stackId={'a'}
							fill={bar.fill} />
					);
				})}
			</BarChart>
		</ResponsiveContainer>

	);
}

export default StackedChart;
