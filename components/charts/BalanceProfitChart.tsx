import {useMemo} from 'react';
import {ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine} from 'recharts';

import type {ReactElement} from 'react';

type TChartSnapshot = {
	block: number;
	timestamp: number;
	shares: number;
	profit: number;
	feeSplit: number;
};

type TProps = {
	snapshots: TChartSnapshot[];
	isLoading: boolean;
	feeStartTimestamp?: number;
};

// Format a snapshot timestamp (Unix seconds) as "July 4, 2026".
function formatChartDate(timestamp: number): string {
	if (!timestamp) {
		return '';
	}
	return new Date(timestamp * 1000).toLocaleString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	});
}

// Format a snapshot timestamp as "July 4, 2026 14:52 UTC".
function formatChartDateTime(timestamp: number): string {
	if (!timestamp) {
		return '';
	}
	const date = new Date(timestamp * 1000);
	const datePart = date.toLocaleString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	});
	const hh = String(date.getUTCHours()).padStart(2, '0');
	const mm = String(date.getUTCMinutes()).padStart(2, '0');
	return `${datePart} ${hh}:${mm} UTC`;
}

function BalanceProfitChart({snapshots, isLoading, feeStartTimestamp}: TProps): ReactElement {
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

	// Only draw the partner fee-split line when there is accrued fee to show
	// (e.g. skip vaults whose performance fee isn't active yet).
	const hasFeeSplit = chartData.some((d) => d.feeSplit > 0);

	if (snapshots.length === 0) {
		return (
			<div className={'flex h-96 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50'}>
				<p className={'text-neutral-500'}>{isLoading ? 'Chart is loading...' : 'No chart data available'}</p>
			</div>
		);
	}

	return (
		<div className={'w-full'}>
			<h3 className={'mb-1 text-xl font-semibold text-neutral-900'}>
				{'Balance and Profit Over Time'}
			</h3>
			{feeStartTimestamp ? (
				<p className={'mb-4 mt-1 flex flex-wrap items-center gap-x-2 text-sm text-neutral-500'}>
					<span className={'inline-block h-2 w-4 rounded-sm bg-[#ef4444]'} />
					<span>
						{'Fee accrual starts '}
						<span className={'font-medium text-neutral-700'}>{formatChartDate(feeStartTimestamp)}</span>
					</span>
				</p>
			) : null}
			<ResponsiveContainer width={'100%'} height={400}>
				<ComposedChart data={chartData} margin={{top: 10, right: 80, left: 0, bottom: 0}}>
					<CartesianGrid strokeDasharray={'3 3'} stroke={'#e5e7eb'} />
					<XAxis
						dataKey={'timestamp'}
						type={'number'}
						domain={['dataMin', 'dataMax']}
						ticks={[chartData[0].timestamp, chartData[chartData.length - 1].timestamp]}
						tickFormatter={(ts: number): string => formatChartDate(ts)}
						tick={{fontSize: 12}}
						stroke={'#6b7280'}
					/>
					{feeStartTimestamp && feeStartTimestamp > 0 &&
						chartData[0].timestamp <= feeStartTimestamp &&
						feeStartTimestamp <= chartData[chartData.length - 1].timestamp && (
						<ReferenceLine
							yAxisId={'left'}
							stroke={'#ef4444'}
							strokeWidth={2}
							label={{value: `Fee start ${formatChartDate(feeStartTimestamp)}`, position: 'top', fill: '#ef4444', fontSize: 11}} />
					)}
					<YAxis
						yAxisId={'left'}
						label={{value: 'Shares', angle: -90, position: 'insideLeft'}}
						tick={{fontSize: 12}}
						stroke={'#3b82f6'}
					/>
					<YAxis
						yAxisId={'right'}
						orientation={'right'}
						label={{value: 'Profit (USD)', angle: 90, position: 'insideRight'}}
						tick={{fontSize: 12}}
						stroke={'#10b981'}
					/>
					{hasFeeSplit ? (
						<YAxis
							yAxisId={'fee'}
							orientation={'right'}
							label={{value: 'Fee (USD)', angle: 90, position: 'insideRight', offset: 25}}
							tick={{fontSize: 12}}
							stroke={'#ef4444'}
						/>
					) : null}
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
						return [`$${value.toFixed(2)}`, name];
						}}
						labelFormatter={(label: number): string => formatChartDateTime(label)}
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
						name={'Profit (USD)'}
						isAnimationActive={false}
					/>
					{hasFeeSplit ? (
						<Line
							yAxisId={'fee'}
							type={'monotone'}
							dataKey={'feeSplit'}
							stroke={'#ef4444'}
							strokeWidth={2}
							dot={false}
							name={'Partner fee split'}
							isAnimationActive={false}
						/>
					) : null}
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
}

export default BalanceProfitChart;
