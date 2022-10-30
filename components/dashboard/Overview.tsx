import	React, {ReactElement}		from	'react';
import	{Button}					from	'@yearn-finance/web-lib/components';
import {Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';


type TChartData = {
	name: string,
	WBTC: number,
	USDC: number,
};

function generateData(): TChartData[]{
	const data = [];
	const mult = 300;

	for (let i = 0; i < 29; i++) {
		data.push({name: `${i+1}`, WBTC: ~~(Math.random()* mult), USDC: ~~(Math.random()* mult)});
	} 

	return data;
}

function CustomTooltip(e: any): any {
	if (e.active) {
		return (
			<div className={'p-2 bg-good-ol-grey-300 rounded opacity-90'}>
				<p><span className={'font-semibold'}>{'USDC: '}</span>{`${e.payload[0].value} K`}</p>
				<p><span className={'font-semibold'}>{'WBTC: '}</span>{`${e.payload[1].value} K`}</p>
			</div>
		);
	}

	return null;
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

			<h2 className={'mt-10 text-lg font-semibold'}>{'Fees Earned'}</h2>
			<div className={'flex justify-start items-center mt-2 mb-12 h-[300px]'}>
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
						<Tooltip content={<CustomTooltip />}/>
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

				<div className={'flex flex-col justify-start items-center -mt-8 w-[15%] h-full bg-good-ol-grey-100'}>
					<div className={'flex flex-row mt-7 -ml-8'}>
						<div className={'w-4 h-5 bg-[#8884d8]'} />
						<div>
							<p className={'mt-2 ml-2 text-xs underline'}>{'USDC'}</p>
							<p className={'mt-2 ml-2 text-xs underline'}>{'Wrapper: 0x23a...089ca'}</p>
						</div>
					</div>

					<div className={'flex flex-row mt-7 -ml-8' }>
						<div className={'w-4 h-5 bg-[#82ca9d]'} />
						<div>
							<p className={'mt-2 ml-2 text-xs underline' }>{'WBTC'}</p>
							<p className={'mt-2 ml-2 text-xs underline' }>{'Wrapper: 0x23a...089ca'}</p>
						</div>
					</div>

				</div>
			</div>
		</div>
	);
}

export default Overview;
