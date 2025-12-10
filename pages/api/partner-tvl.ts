import {BigNumber, ethers} from 'ethers';
import type {NextApiRequest, NextApiResponse} from 'next';
import {toAddress} from 'lib/yearn/utils/address';

type TAccountValue = {
	address: string,
	shares: string,
	currentValue: string,
	currentValueNormalized: number
};

type TResponseBody = {
	vaultAddress: string,
	decimals: number,
	pricePerShare: string,
	totalCurrentValue: string,
	totalCurrentValueNormalized: number,
	accounts: TAccountValue[]
} | {error: string};

const DEFAULT_VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';

const VAULT_ABI = [
	'function balanceOf(address) view returns (uint256)',
	'function pricePerShare() view returns (uint256)',
	'function decimals() view returns (uint8)'
];

function	parseAddresses(addressParam: string | string[] | undefined): string[] {
	if (!addressParam) {
		return [];
	}

	const rawAddresses = Array.isArray(addressParam) ? addressParam : addressParam.split(',');
	const uniqueAddresses = new Set<string>();

	for (const addr of rawAddresses) {
		try {
			const formatted = toAddress(addr);
			if (formatted !== ethers.constants.AddressZero) {
				uniqueAddresses.add(formatted);
			}
		} catch {
			// Ignore malformed addresses
		}
	}

	return Array.from(uniqueAddresses);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TResponseBody>): Promise<void> {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		res.status(405).json({error: 'Method not allowed'});
		return;
	}

	const rpcUrl = process.env.RPC_URL_MAINNET;
	const vaultAddress = process.env.V3_VAULT_ADDRESS || DEFAULT_VAULT_ADDRESS;
	const addresses = parseAddresses(req.query.addresses || req.query.address);

	if (!rpcUrl) {
		res.status(500).json({error: 'RPC_URL_MAINNET is not configured'});
		return;
	}

	if (addresses.length === 0) {
		res.status(400).json({error: 'No valid addresses provided'});
		return;
	}

	try {
		const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
		const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, provider);

		const [pricePerShare, decimals] = await Promise.all([
			vaultContract.pricePerShare(),
			vaultContract.decimals()
		]);

		const divisor = BigNumber.from(10).pow(decimals);
		const accounts: TAccountValue[] = [];

		for (const address of addresses) {
			const shares: BigNumber = await vaultContract.balanceOf(address);
			const currentValue = shares.mul(pricePerShare).div(divisor);

			accounts.push({
				address,
				shares: shares.toString(),
				currentValue: currentValue.toString(),
				currentValueNormalized: Number(ethers.utils.formatUnits(currentValue, decimals))
			});
		}

		const totalCurrentValue = accounts.reduce((acc, {currentValue}): BigNumber => {
			return acc.add(BigNumber.from(currentValue));
		}, BigNumber.from(0));

		res.status(200).json({
			vaultAddress,
			decimals: Number(decimals),
			pricePerShare: pricePerShare.toString(),
			totalCurrentValue: totalCurrentValue.toString(),
			totalCurrentValueNormalized: Number(ethers.utils.formatUnits(totalCurrentValue, decimals)),
			accounts
		});
	} catch (error) {
		console.error('[partner-tvl] Failed to fetch balances', error);
		res.status(500).json({error: 'Failed to fetch partner balances'});
	}
}
