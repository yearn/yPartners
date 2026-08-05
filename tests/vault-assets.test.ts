import {beforeEach, describe, expect, it, vi} from 'vitest';

import type {NextApiRequest, NextApiResponse} from 'next';

const mocks = vi.hoisted(() => ({
	getKongVaultMetadataForVaults: vi.fn(),
	getRpcUrlLatest: vi.fn(),
	getTokenSymbol: vi.fn()
}));

vi.mock('lib/yearn/kong', () => ({
	getKongVaultMetadataForVaults: mocks.getKongVaultMetadataForVaults
}));
vi.mock('lib/crypto/rpc', () => ({
	getRpcUrlLatest: mocks.getRpcUrlLatest
}));
vi.mock('lib/crypto/tokenMetadata', () => ({
	getTokenSymbol: mocks.getTokenSymbol
}));

import handler from '../pages/api/vault-assets';

type TResponseBody =
	| {
		vaults: Array<{
			chainId: number;
			vaultAddress: string;
			assetAddress: string | null;
			assetSymbol: string | null;
		}>;
	}
	| {error: string}
	| null;
type TMockResponse = {
	statusCode: number;
	body: TResponseBody;
	headers: Map<string, string>;
	setHeader(name: string, value: string): TMockResponse;
	status(statusCode: number): TMockResponse;
	json(body: TResponseBody): TMockResponse;
};

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

describe('batch vault metadata endpoint', (): void => {
	const vaultA = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';
	const vaultB = '0x028eC7330ff87667b6dfb0D94b954c820195336c';
	const asset = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

	beforeEach((): void => {
		vi.resetAllMocks();
		mocks.getRpcUrlLatest.mockReturnValue('https://rpc.example');
		mocks.getTokenSymbol.mockResolvedValue('USDC');
		mocks.getKongVaultMetadataForVaults.mockResolvedValue(new Map([
			[vaultA.toLowerCase(), {assetAddress: asset, decimals: 6, pricePerShare: '1000000'}],
			[vaultB.toLowerCase(), {assetAddress: asset, decimals: 6, pricePerShare: '1000000'}]
		]));
	});

	it('batches same-chain vaults and deduplicates their asset symbol lookup', async (): Promise<void> => {
		const response = createResponse();
		await handler(
			{
				method: 'GET',
				query: {vaults: `1:${vaultA},1:${vaultB},1:${vaultA.toLowerCase()}`}
			} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(mocks.getKongVaultMetadataForVaults).toHaveBeenCalledTimes(1);
		expect(mocks.getKongVaultMetadataForVaults).toHaveBeenCalledWith(1, [vaultA, vaultB]);
		expect(mocks.getTokenSymbol).toHaveBeenCalledTimes(1);
		expect(response.statusCode).toBe(200);
		expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=3600, stale-while-revalidate=86400');
		expect(response.body).toEqual({
			vaults: [
				{chainId: 1, vaultAddress: vaultA, assetAddress: asset, assetSymbol: 'USDC'},
				{chainId: 1, vaultAddress: vaultB, assetAddress: asset, assetSymbol: 'USDC'}
			]
		});
	});

	it('rejects malformed vault input without external calls', async (): Promise<void> => {
		const response = createResponse();
		await handler(
			{method: 'GET', query: {vaults: 'invalid'}} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(response.statusCode).toBe(400);
		expect(response.body).toEqual({error: 'vaults must be 1-100 comma-separated chainId:address pairs'});
		expect(mocks.getKongVaultMetadataForVaults).not.toHaveBeenCalled();
	});
});
