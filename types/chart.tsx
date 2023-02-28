export type TAxisDomainItem = string | number | 'auto' | 'dataMin' | 'dataMax';

export type TLegendItem = {
	type: string,
	color: string
	details: string | string[],
	isThin?: boolean
	isCondensed?: boolean
};

export type TChartBar = {
	name: string;
	shortDate: string;
	data: { [prop: string]: number}; 
	token?: string;
}

export type TTooltipItem = {
	name: string
	symbol: {
		pre: string,
		post: string,
	}
	fill?: string
}

export type TChartProps = {
	children?: React.ReactNode,
	className?: string,
	type: string,
	title: string,
	tooltipItems: TTooltipItem[],
	windowValue: number | undefined,
	data: TChartBar[]
	bars: {name: string, fill: string}[]
	yAxisOptions: {
		domain?: string[] | number[] | [TAxisDomainItem, TAxisDomainItem] 
		tickCount?: number,
		ticks?: string[] | number[]	
		// interval prop allows tick to be skipped, 0 - shows all, 1 - hides half (skips every other)
		interval?: number,
		hideRightAxis: boolean
	}
	xAxisOptions: {
		interval?: number
	},
	legendItems: TLegendItem[]
}
