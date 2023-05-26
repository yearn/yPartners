import Bar from './Bar';
import ChartLegend from './ChartLegend';
import Composed from './Composed';
import Stacked from './Stacked';

import type {ReactElement} from 'react';
import type {TChartProps} from '../../types/chart';

function Chart(props: TChartProps): ReactElement {
	const {type, data} = props; 

	const isLegendShown = data.length > 0 && data[0].name !== 'no data';
	
	// function chartNavigation(): void {
	// 	alert('Feature currently unavailable');
	// }

	return (
		<div className={props.className}>
			<h2 className={'mt-10 mb-7 text-lg font-semibold'}>{props.title}</h2>
			<div className={'mt-2 mb-4 flex h-[350px] items-center justify-start'}>

				{type === 'bar' && (data.length > 0 ?
					<Bar {...props} /> :
					<div className={'flex h-full w-[85%] items-center justify-center bg-[#E1E1E1]'}>
						<div className={'text-center'}>
							<h1>{'Nothing to see here...'}</h1>
							<p>{'Try adjusting the range or viewing another asset'}</p>
						</div>
					</div>
				)}

				{type === 'composed' && <Composed {...props} />}

				{type === 'stacked' && (data[0].name !== 'no data' ?
					<Stacked {...props} /> :
					<div className={'flex h-full w-[85%] items-center justify-center bg-[#E1E1E1]'}>
						<div className={'text-center'}>
							<h1 className={'mb-2'}>{'Nothing to see here...'}</h1>
							<p>{'Your vaults haven\'t earned any payouts yet. Check back later!'}</p>
						</div>
					</div>
				)}
				
				{isLegendShown && <ChartLegend items={props.legendItems}/> }
			</div>

			{/* {data.length > 0 && 
				<div className={'ml-10 flex w-3/4 items-center justify-center' }>
					<Chevron className={'mx-20 cursor-pointer'} onClick={chartNavigation} />
					<span className={'mx-10 text-neutral-500'}>{'Prev'}</span>
					<span className={'mx-10 font-semibold'}>{'June'}</span>
					<span className={'mx-10 text-neutral-500'}>{'Next'}</span>
					<Chevron className={'mx-20 rotate-180 cursor-pointer'} onClick={chartNavigation} />
				</div> 
			} */}

		</div>
	);
}

export default Chart;
