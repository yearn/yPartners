export const NETWORK_LABELS: { [key: number]: string } = {
	1: 'ETH',
	250: 'FTM',
	10: 'OPT',
	42161: 'ARRB'
};

export function getExplorerURL(chainID: number): string {
	switch (chainID) {
	case 1:
		return 'https://etherscan.io';
	case 250:
		return 'https://ftmscan.com';
	case 10:
		return 'https://optimistic.etherscan.io';
	case 42161:
		return 'https://arbiscan.io';
	default:
		return ('https://etherscan.io');
	}
}