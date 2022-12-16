import	React, {ReactElement}		from	'react';
import Chevron from '@yearn-finance/web-lib/icons/IconChevron';
import {TChartProps} from 'types/chart';

import ChartLegend from './ChartLegend';
import Bar from './chart/Bar';
import Composed from './chart/Composed';

function Chart(props: TChartProps): ReactElement {

	function chartNavigation(): void {
		alert('Feature currently unavailable');
	}

	return (
		<div className={props.className}>
			<h2 className={'mt-10 text-lg font-semibold'}>{props.title}</h2>
			<div className={'flex justify-start items-center mt-2 mb-4 h-[350px]'}>

				{props.type === 'bar' ?  <Bar {...props} /> : <Composed {...props} /> }

				<ChartLegend items={props.legendItems}/>
			</div>

			<div className={'flex justify-center items-center ml-10 w-3/4' }>
				<Chevron className={'cursor-pointer'} onClick={chartNavigation} />
				<span className={'ml-10 text-neutral-500'}>{'May'}</span> 
				<span className={'mx-10 font-semibold'}>{'June'}</span>
				<span className={'mr-10 text-neutral-500'}>{'July'}</span>
				<Chevron className={'rotate-180 cursor-pointer'} onClick={chartNavigation} />
			</div>
		</div>
	);
}

export default Chart;