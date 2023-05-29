export const NETWORK_LABELS: { [key: number]: string } = {
	1: 'ETH',
	10: 'OPT',
	250: 'FTM',
	42161: 'ARRB'
};

export const NETWORK_CHAINID: { [key: string]: number } = {
	'ETH': 1,
	'OPT': 10,
	'FTM': 250,
	'ARRB': 42161
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
