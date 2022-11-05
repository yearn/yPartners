import	React, {ReactElement}		from	'react';
import	{Button}					from	'@yearn-finance/web-lib/components';
import	{Chevron}					from	'@yearn-finance/web-lib/icons';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

import CustomTooltip from './CustomTooltip';
import VaultDetails from './VaultDetails';

type TChartData = {
	name: string,
	WBTC: number,
	USDC: number,
	rsWBTC: string,
	rsUSDC: string,
};

function generateData(): TChartData[]{
	const data = [];

	for (let i = 0; i < 29; i++) {
		const fees = {WBTC: ~~(Math.random()* 300), USDC: ~~(Math.random()* 300)};
		const revShare = {rsWBTC: ((Math.random()%0.3).toFixed(2)), rsUSDC: ((Math.random()%0.3)).toFixed(2)};

		data.push({name: `${i+1}`, ...fees, ...revShare});
	} 

	return data;
}


function	Overview(): ReactElement {
	return (
		<div className={'mt-6 h-[400px]'}>
			<div className={'flex flex-row mt-4 space-x-4'}>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'1 day'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'1 week'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'filled'}>
					{'1 month'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'1 year'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'All time'}
				</Button>
			</div>

			<VaultDetails/>

			<h2 className={'mt-10 text-lg font-semibold'}>{'Fees Earned'}</h2>
			<div className={'flex justify-start items-center mt-2 mb-4 h-[350px]'}>
				<ResponsiveContainer width={'85%'} height={'100%'}>
					<BarChart
						width={500}
						height={300}
						data={generateData()}
						margin={{
							top: 10,
							right: 80,
							left: 0,
							bottom: 5
						}}
					>
						<XAxis />
						<YAxis />
						<Tooltip content={<CustomTooltip symbol={'K'} />}/>
						<Bar
							dataKey={'USDC'}
							stackId={'a'}
							fill={'#8884d8'} />
						<Bar
							dataKey={'WBTC'}
							stackId={'a'}
							fill={'#82ca9d'} />
					</BarChart>
				</ResponsiveContainer>

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
				<Chevron className={'cursor-pointer'}/>
				<span className={'ml-10 text-neutral-500'}>{'May'}</span> 
				<span className={'mx-10 font-semibold'}>{'June'}</span>
				<span className={'mr-10 text-neutral-500'}>{'July'}</span>
				<Chevron className={'rotate-180 cursor-pointer'} />
			</div>


			<h2 className={'mt-10 text-lg font-semibold'}>{'Revenue Shared'}</h2>
			<div className={'flex justify-start items-center mt-2 mb-4 h-[350px]'}>
				<ResponsiveContainer width={'85%'} height={'100%'}>
					<BarChart
						width={500}
						height={300}
						data={generateData()}
						margin={{
							top: 10,
							right: 80,
							left: 0,
							bottom: 5
						}}
					>
						<XAxis />
						<YAxis />
						<Tooltip content={<CustomTooltip symbol={'%'} />}/>
						<Bar
							dataKey={'rsUSDC'}
							stackId={'a'}
							fill={'#8884d8'} />
						<Bar
							dataKey={'rsWBTC'}
							stackId={'a'}
							fill={'#82ca9d'} />
					</BarChart>
				</ResponsiveContainer>

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

			<div className={'flex justify-center items-center mb-20 w-3/4' }>
				<Chevron className={'cursor-pointer'} />
				<span className={'ml-10 text-neutral-500'}>{'April'}</span> 
				<span className={'mx-10 font-semibold'}>{'May'}</span>
				<span className={'mr-10 text-neutral-500'}>{'June'}</span>
				<Chevron className={'rotate-180 cursor-pointer'} />
			</div>
		</div>
	);
}

export default Overview;
