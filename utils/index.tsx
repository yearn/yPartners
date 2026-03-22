export const NETWORK_LABELS: { [key: number]: string } = {
	1: 'ETH',
	8453: 'BASE',
	42161: 'ARB',
	747474: 'KATANA'
};

export const NETWORK_CHAINID: { [key: string]: number } = {
	'ETH': 1,
	'BASE': 8453,
	'ARB': 42161,
	'KATANA': 747474
};

export function getExplorerURL(chainID: number): string {
	switch (chainID) {
		case 1:
			return 'https://etherscan.io';
		case 8453:
			return 'https://basescan.org';
		case 42161:
			return 'https://arbiscan.io';
		case 747474:
			return 'https://katanascan.com';
		default:
			return ('https://etherscan.io');
	}
}
