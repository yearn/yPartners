import {useMemo} from 'react';
import {ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';

import type {ReactElement} from 'react';

type TChartSnapshot = {
	block: number;
	shares: number;
	profit: number;
};

type TProps = {
	snapshots: TChartSnapshot[];
	isLoading: boolean;
};

function BalanceProfitChart({snapshots, isLoading}: TProps): ReactElement {
	// Sample data if there are too many points (performance optimization)
	const chartData = useMemo(() => {
		if (snapshots.length <= 300) {
			return snapshots;
		}

		const sampledData: TChartSnapshot[] = [];
		const step = snapshots.length / 300;
		for (let i = 0; i < 300; i++) {
			const index = Math.min(Math.floor(i * step), snapshots.length - 1);
			sampledData.push(snapshots[index]);
		}
		return sampledData;
	}, [snapshots]);

	if (snapshots.length === 0) {
		return (
			<div className={'flex h-96 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50'}>
				<p className={'text-neutral-500'}>{isLoading ? 'Chart is loading...' : 'No chart data available'}</p>
			</div>
		);
	}

	return (
		<div className={'w-full'}>
			<h3 className={'mb-4 text-xl font-semibold text-neutral-900'}>
				{'Balance and Profit Over Time'}
			</h3>
			<ResponsiveContainer width={'100%'} height={400}>
				<ComposedChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
					<CartesianGrid strokeDasharray={'3 3'} stroke={'#e5e7eb'} />
					<XAxis
						dataKey={'block'}
						label={{value: 'Block Number', position: 'insideBottom', offset: -5}}
						tick={{fontSize: 12}}
						stroke={'#6b7280'}
					/>
					<YAxis
						yAxisId={'left'}
						label={{value: 'Shares', angle: -90, position: 'insideLeft'}}
						tick={{fontSize: 12}}
						stroke={'#3b82f6'}
					/>
					<YAxis
						yAxisId={'right'}
						orientation={'right'}
						label={{value: 'Profit (USDC)', angle: 90, position: 'insideRight'}}
						tick={{fontSize: 12}}
						stroke={'#10b981'}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: 'white',
							border: '1px solid #e5e7eb',
							borderRadius: '0.5rem',
							padding: '0.75rem'
						}}
						labelStyle={{fontWeight: 'bold', marginBottom: '0.25rem'}}
						formatter={(value: number, name: string) => {
							if (name === 'Shares') {
								return [value.toFixed(2), 'Shares'];
							}
							return [`$${value.toFixed(2)}`, 'Profit (USDC)'];
						}}
						labelFormatter={(label) => `Block: ${label}`}
					/>
					<Legend
						wrapperStyle={{paddingTop: '1rem'}}
						iconType={'line'}
					/>
					<Line
						yAxisId={'left'}
						type={'stepAfter'}
						dataKey={'shares'}
						stroke={'#3b82f6'}
						strokeWidth={2}
						dot={false}
						name={'Shares'}
						isAnimationActive={false}
					/>
					<Line
						yAxisId={'right'}
						type={'monotone'}
						dataKey={'profit'}
						stroke={'#10b981'}
						strokeWidth={2}
						dot={false}
						name={'Profit (USDC)'}
						isAnimationActive={false}
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
}

export default BalanceProfitChart;
