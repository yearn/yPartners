import	React, {ReactElement}		from	'react';
import {Bar, ComposedChart, ResponsiveContainer, XAxis, YAxis} from 'recharts';
import {TChartProps} from 'types/chart';

function	Composed(props: TChartProps): ReactElement {

	function getBarSize(): number {
		if(!props.windowValue){
			return -1;
		}

		return props.windowValue < 29 ? 30 : 7;
	}

	return (
		<ResponsiveContainer width={'85%'} height={'100%'}>
			<ComposedChart
				width={500}
				height={300}
				data={props.data}
				barCategoryGap={-0.4}
				margin={{
					top: 10,
					right: 80,
					left: 0,
					bottom: 5
				}}>
				<XAxis xAxisId={1} />
				<XAxis xAxisId={2} hide={true} />

				<YAxis yAxisId={0} dataKey={'profitShare'}/>
				<YAxis
					yAxisId={1}
					orientation={'right'}
					dataKey={'awb'}/>

				<Bar
					xAxisId={1}
					dataKey={'profitShare'}
					fill={props.bars[0].fill} />
				<Bar
					xAxisId={2}
					dataKey={'awb'}
					fill={props.bars[1].fill} 
					barSize={getBarSize()} />
			</ComposedChart>
		</ResponsiveContainer>
	);
}

export default Composed;