import	React, {ReactElement}		from	'react';
import {Chevron} from '@yearn-finance/web-lib/icons';
import {TChartProps} from 'types/chart';

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

				{props.type === 'bar' ?  <Bar {...props} /> : <Composed /> }

				<div className={'flex flex-col justify-center items-center -mt-8 -ml-4 w-[15%] h-full'}>
					<div className={'flex flex-row -mt-8 -ml-8'}>
						<div className={'w-4 h-5 bg-[#8884d8]'} />
						<div>
							<p className={'mt-2 ml-2 text-xs underline md:text-sm'}>{'USDC'}</p>
							<p className={'mt-2 ml-2 text-xs underline md:text-sm'}>{'Wrapper: 0x23a...089ca'}</p>
						</div>
					</div>

					<div className={'flex flex-row mt-7 -ml-8' }>
						<div className={'w-4 h-5 bg-[#82ca9d]'} />
						<div>
							<p className={'mt-2 ml-2 text-xs underline md:text-sm'}>{'WBTC'}</p>
							<p className={'mt-2 ml-2 text-xs underline md:text-sm'}>{'Wrapper: 0x23a...089ca'}</p>
						</div>
					</div>
				</div>
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