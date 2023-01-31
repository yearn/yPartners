import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

export function formatXAxis(value: number): string {
	return `${value+1}`;
}

export function formatYAxis(symbol: string, value: number): string {
	return symbol === '%' ? `${value}${symbol}` : `${formatAmount(value, 0, 0)}`;
}

export function getTickInterval(activeWindow: string): number | undefined {
	const tickPreferences: {[key: string]: number} = {'1 month': 1, 'All time': 1};
	return tickPreferences[activeWindow];
}
