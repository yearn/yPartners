
export function formatXAxis(value: number): string {
	return `${value+1}`;
}

export function formatYAxis(symbol: string, value: number): string {
	return symbol === '%' ? `${value}${symbol}` : `$ ${value}${symbol}`;
}
