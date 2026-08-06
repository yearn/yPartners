export const NETWORK_LABELS: {[key: number]: string} = {
	1: 'Ethereum',
	8453: 'Base',
	42161: 'Arbitrum',
	747474: 'Katana'
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
