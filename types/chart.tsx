export type TAxisDomainItem = string | number | 'auto' | 'dataMin' | 'dataMax';

export type TLegendItem = {
	type: string,
	color: string
	details: string | string[],
	isThin?: boolean
};

export type TChartBar = {
	name: string;
	data: { [prop: string]: number}; 
}

export type TChartProps = {
	children?: React.ReactNode,
	className?: string,
	type: string,
	title: string,
	tooltipItems: {
		name: string
		symbol: string
	}[],
	windowValue: number | undefined,
	data: TChartBar[] | undefined
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
