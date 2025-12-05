type FormatAmountOptions = {
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
};

export function formatAmount(
	value: number | string,
	minimumFractionDigits = 0,
	maximumFractionDigits = 2,
	options: FormatAmountOptions = {}
): string {
	const numericValue = typeof value === 'string' ? Number(value) : value;

	if (!Number.isFinite(numericValue)) {
		return '0';
	}

	const formatter = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: options.minimumFractionDigits ?? minimumFractionDigits,
		maximumFractionDigits: options.maximumFractionDigits ?? maximumFractionDigits
	});

	return formatter.format(numericValue);
}
