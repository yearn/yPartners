import	React, {ReactElement}		from	'react';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {TChartProps} from 'types/chart';
import {formatXAxis} from 'utils/b2b/Chart';

import CustomTooltip from '../CustomTooltip';


function CustomBarChart(props: TChartProps): ReactElement {
	const {tooltipSymbol, data, bars, yAxisOptions, xAxisOptions} = props;

	function formatYAxis(value: number): string {
		return tooltipSymbol === '%' ? `${value}${tooltipSymbol}` : `$ ${value}${tooltipSymbol}`;
	}


	return (
		<ResponsiveContainer width={'85%'} height={'100%'}>
			<BarChart
				width={500}
				height={300}
				data={data}
				margin={{
					top: 10,
					right: 80,
					left: 0,
					bottom: 5
				}}
			>
				<XAxis tickFormatter={formatXAxis} interval={xAxisOptions.interval}/>
				<YAxis
					domain={yAxisOptions.domain}
					tickCount={yAxisOptions.tickCount}
					ticks={yAxisOptions.ticks}
					tickFormatter={formatYAxis}
					interval={yAxisOptions.interval} />
				<Tooltip content={<CustomTooltip symbol={tooltipSymbol} />}/>

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

export default CustomBarChart;