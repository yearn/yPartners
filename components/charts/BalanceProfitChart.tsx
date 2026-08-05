import {useEffect, useMemo, useState} from 'react';
import {ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import {formatAmount} from 'lib/yearn/utils/format.number';

import type {ReactElement} from 'react';

// Compact tick formatters keep axis labels short so stacked right-side axes stay readable.
const SHARES_TICK_FORMATTER = new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1});
const USD_TICK_FORMATTER = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	notation: 'compact',
	maximumFractionDigits: 1
});

type TChartSnapshot = {
	block: number;
	shares: number;
	profit: number;
	feeSplit: number;
};

type TProps = {
	snapshots: TChartSnapshot[];
	isLoading: boolean;
	feeStartTimestamp?: number;
	windowDays: number;
};

// Format a timestamp as "July 4, 2026".
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

// Generate endpoint labels from the selected window without historical RPC data.
function formatChartWindowDate(block: number, firstBlock: number, lastBlock: number, windowDays: number): string {
	const progress = firstBlock === lastBlock
		? 1
		: Math.min(1, Math.max(0, (block - firstBlock) / (lastBlock - firstBlock)));
	const elapsedDays = Math.round(progress * windowDays);
	const timestamp = Math.floor(Date.now() / 1000) - ((windowDays - elapsedDays) * 86400);
	return formatChartDate(timestamp);
}

function BalanceProfitChart({snapshots, isLoading, feeStartTimestamp, windowDays}: TProps): ReactElement {
	const [isMobile, setIsMobile] = useState(false);

	useEffect((): (() => void) => {
		const mediaQuery = window.matchMedia('(max-width: 767px)');
		const handleChange = (event: MediaQueryListEvent): void => {
			setIsMobile(event.matches);
		};
		setIsMobile(mediaQuery.matches);
		mediaQuery.addEventListener('change', handleChange);
		return (): void => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	const leftAxisWidth = isMobile ? 42 : 70;
	const rightAxisWidth = isMobile ? 48 : 84;
	const axisTick = {fontSize: isMobile ? 10 : 12};
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
	const firstBlock = chartData[0]?.block ?? 0;
	const lastBlock = chartData[chartData.length - 1]?.block ?? firstBlock;

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
				<ComposedChart data={chartData} margin={{top: 10, right: 8, left: 0, bottom: 0}}>
					<CartesianGrid strokeDasharray={'3 3'} stroke={'#e5e7eb'} />
					<XAxis
						dataKey={'block'}
						type={'number'}
						domain={['dataMin', 'dataMax']}
						ticks={[firstBlock, lastBlock]}
						tickFormatter={(block: number): string => formatChartWindowDate(block, firstBlock, lastBlock, windowDays)}
						tick={{fontSize: 12}}
						stroke={'#6b7280'}
					/>
					<YAxis
						yAxisId={'left'}
						width={leftAxisWidth}
						label={{value: 'Shares', angle: -90, position: 'insideLeft', offset: isMobile ? 2 : 10, fill: '#3b82f6'}}
						tickFormatter={(value: number): string => SHARES_TICK_FORMATTER.format(value)}
						tick={axisTick}
						stroke={'#3b82f6'}
					/>
					<YAxis
						yAxisId={'right'}
						orientation={'right'}
						width={rightAxisWidth}
						label={{value: 'Profit (USD)', angle: 90, position: 'insideRight', offset: isMobile ? 2 : 14, fill: '#10b981'}}
						tickFormatter={(value: number): string => USD_TICK_FORMATTER.format(value)}
						tick={axisTick}
						stroke={'#10b981'}
					/>
					{hasFeeSplit ? (
						<YAxis
							yAxisId={'fee'}
							orientation={'right'}
							width={rightAxisWidth}
							label={{value: 'Fee (USD)', angle: 90, position: 'insideRight', offset: isMobile ? 2 : 14, fill: '#ef4444'}}
							tickFormatter={(value: number): string => USD_TICK_FORMATTER.format(value)}
							tick={axisTick}
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
								return [formatAmount(value, 2, 2), 'Shares'];
							}
							return [`$${formatAmount(value, 2, 2)}`, name];
						}}
						labelFormatter={(block: number): string => `Block: ${block}`}
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
