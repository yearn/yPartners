import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BigNumber, ethers} from 'ethers';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TMulticallCall, TMulticallResult} from 'lib/yearn/multicall';

const mocks = vi.hoisted(() => ({
	aggregate3: vi.fn(),
	getKongVaultMetadata: vi.fn(),
	getRpcUrlLatest: vi.fn(),
	getTokenPriceUsdWithDebug: vi.fn(),
	getTokenSymbol: vi.fn()
}));

vi.mock('lib/yearn/multicall', () => ({
	aggregate3: mocks.aggregate3
}));
vi.mock('lib/yearn/kong', () => ({
	getKongVaultMetadata: mocks.getKongVaultMetadata
}));
vi.mock('lib/crypto/rpc', () => ({
	getRpcUrlLatest: mocks.getRpcUrlLatest
}));
vi.mock('lib/crypto/defillama', () => ({
	getTokenPriceUsdWithDebug: mocks.getTokenPriceUsdWithDebug
}));
vi.mock('lib/crypto/tokenMetadata', () => ({
	getTokenSymbol: mocks.getTokenSymbol
}));

import handler from '../pages/api/partner-tvl';

type TResponseBody = {
	accounts: Array<{
		address: string,
		shares: string,
		currentValue: string,
		currentValueNormalized: number
	}>,
	totalCurrentValue: string,
	totalCurrentValueNormalized: number
} | {error: string} | null;

type TMockResponse = {
	statusCode: number;
	body: TResponseBody;
	headers: Map<string, string>;
	setHeader(name: string, value: string): TMockResponse;
	status(statusCode: number): TMockResponse;
	json(body: TResponseBody): TMockResponse;
};

const BALANCE_OF_INTERFACE = new ethers.utils.Interface([
	'function balanceOf(address) view returns (uint256)'
]);

const vault = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';
const asset = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const depositorA = '0x028eC7330ff87667b6dfb0D94b954c820195336c';
const depositorB = '0xAe7d8Db82480E6d8e3873ecbF22cf17b3D8A7308';

function createResponse(): TMockResponse {
	const response: TMockResponse = {
		statusCode: 0,
		body: null,
		headers: new Map<string, string>(),
		setHeader(name: string, value: string): TMockResponse {
			response.headers.set(name, value);
			return response;
		},
		status(statusCode: number): TMockResponse {
			response.statusCode = statusCode;
			return response;
		},
		json(body: TResponseBody): TMockResponse {
			response.body = body;
			return response;
		}
	};
	return response;
}

describe('partner TVL balance batching', (): void => {
	beforeEach((): void => {
		vi.resetAllMocks();
		mocks.getRpcUrlLatest.mockReturnValue('https://rpc.example');
		mocks.getKongVaultMetadata.mockResolvedValue({
			assetAddress: asset,
			decimals: 6,
			pricePerShare: '1000000'
		});
		mocks.getTokenPriceUsdWithDebug.mockResolvedValue({price: 1.5});
		mocks.getTokenSymbol.mockResolvedValue('USDC');
		mocks.aggregate3.mockImplementation(async (
			_provider: unknown,
			calls: TMulticallCall[]
		): Promise<TMulticallResult[]> => calls.map((_, index): TMulticallResult => ({
			success: true,
			returnData: BALANCE_OF_INTERFACE.encodeFunctionResult(
				'balanceOf',
				[BigNumber.from(index === 0 ? '2000000' : '4000000')]
			)
		})));
	});

	it('reads all depositor balances through one Multicall3 request', async (): Promise<void> => {
		const response = createResponse();
		await handler(
			{
				method: 'GET',
				query: {vaultAddress: vault, addresses: `${depositorA},${depositorB}`, chainId: '1'}
			} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(mocks.aggregate3).toHaveBeenCalledTimes(1);
		expect(mocks.aggregate3.mock.calls[0][1]).toHaveLength(2);
		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({
		vaultAddress: vault,
		assetAddress: asset,
		assetPriceUsd: 1.5,
		assetSymbol: 'USDC',
		decimals: 6,
		pricePerShare: '1000000',
		totalCurrentValue: '6000000',
		totalCurrentValueNormalized: 9,
		accounts: [
			{address: depositorA, shares: '2000000', currentValue: '2000000', currentValueNormalized: 3},
			{address: depositorB, shares: '4000000', currentValue: '4000000', currentValueNormalized: 6}
		]
	});
	});

	it('returns a typed service error when an RPC is unavailable', async (): Promise<void> => {
		mocks.getRpcUrlLatest.mockReturnValue(null);
		const response = createResponse();
		await handler(
			{
				method: 'GET',
				query: {vaultAddress: vault, addresses: depositorA, chainId: '1'}
			} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(response.statusCode).toBe(503);
		expect(response.body).toEqual({error: 'No RPC URL configured for chain 1.'});
		expect(mocks.aggregate3).not.toHaveBeenCalled();
	});
});
