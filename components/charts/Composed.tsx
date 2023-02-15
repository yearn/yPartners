import React, {useState} from 'react';
import CustomTooltip from 'components/charts/CustomTooltip';
import {Bar, Cell, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {formatXAxis, formatYAxis} from 'utils/b2b/Chart';

import type {ReactElement} from 'react';
import type {TChartProps} from 'types/chart';

function	Composed(props: TChartProps): ReactElement {
	const {tooltipItems, data, bars, windowValue, yAxisOptions, xAxisOptions} = props;
	const firstSymbol = tooltipItems[0].symbol;
	// const secondSymbol = tooltipItems[1].symbol;

	const [focusBar, set_focusBar] = useState(-1);

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
				barCategoryGap={-0.3}
				onMouseMove={(state): void => {
					if (state.isTooltipActive) {
						set_focusBar(state.activeTooltipIndex as number);
					} else {
						set_focusBar(-1);
					}
				}}
				margin={{
					top: 10,
					right: 80,
					left: 30,
					bottom: 5
				}}>
				<XAxis
					xAxisId={'main'}
					tickFormatter={formatXAxis}
					interval={xAxisOptions.interval} />
				<XAxis xAxisId={'hidden'} hide={true} />

				<YAxis
					yAxisId={'left'}
					dataKey={'data.totalTVL'}
					domain={yAxisOptions.domain}
					tickCount={yAxisOptions.tickCount}
					ticks={yAxisOptions.ticks}
					tickFormatter={(value): string => formatYAxis(firstSymbol, value)}/>

				<YAxis
					yAxisId={'right'}
					orientation={'right'}
					dataKey={'data.profitShare'}
					domain={yAxisOptions.domain}
					tickCount={yAxisOptions.tickCount}
					ticks={yAxisOptions.ticks} 
					tickFormatter={(value): string => formatYAxis('%', value)}
					hide={yAxisOptions.hideRightAxis} />

				<Tooltip
					cursor={{strokeWidth: `${100/(windowValue || 1)}%`}}
					content={<CustomTooltip items={tooltipItems} />}/>

				<Bar
					xAxisId={'main'}
					yAxisId={'right'}
					dataKey={'data.profitShare'}
					fill={bars[1].fill} >
					{(data || []).map((_, index): ReactElement => (
						<Cell key={`cell-${index}`} fill={focusBar === index ? `${bars[1].fill}aa` : bars[1].fill} />
					))}
				</Bar>
				<Bar
					xAxisId={'hidden'}
					yAxisId={'left'}
					dataKey={'data.totalTVL'}
					fill={bars[0].fill}
					barSize={getBarSize()} />
			</ComposedChart>
		</ResponsiveContainer>
	);
}

export default Composed;
