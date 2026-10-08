import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {NextApiRequest, NextApiResponse} from 'next';

import handler from '../pages/api/partner-referrals';

type TResponseBody = Record<number, Record<string, string[]>> | {error: string} | null;
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

describe('partner referral depositor resolution', (): void => {
	beforeEach((): void => {
		process.env.ENVIO_GRAPHQL_URL = 'https://envio.example/graphql';
	});

	afterEach((): void => {
		vi.unstubAllGlobals();
		delete process.env.ENVIO_GRAPHQL_URL;
	});

	it('excludes the ysyBOLD address from every referral config', async (): Promise<void> => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async (): Promise<{data: {ReferralDeposit: Array<Record<string, string>>}}> => ({
				data: {
					ReferralDeposit: [{
						id: '747474_100_0',
						receiver: '0x23346B04a7f55b8760E5860AA5A77383D63491cD',
						referrer: '0x0000000000000000000000000000000000000001',
						vault: '0x9F4330700a36B29952869fac9b33f45EEdd8A3d8'
					}]
				}
			})
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = createResponse();
		await handler(
			{
				method: 'GET',
				query: {referrer: '0x0000000000000000000000000000000000000001'}
			} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('attributes Inverse FiRM escrows to the vault of the market that created them', async (): Promise<void> => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async (): Promise<{data: {InverseEscrowCreated: Array<Record<string, string | number>>}}> => ({
				data: {
					InverseEscrowCreated: [
						// Live row from the FiRM "Yearn reUSD-sDOLA Market"; Envio
						// stores addresses checksummed.
						{escrow: '0x7E3B9ef8221a819E5497D713d0FD8F6486F2c2Bf', factoryAddress: '0x1fD4985cdd57bDb1eD646B10B7952fCD58946916', chainId: 1},
						// Same market and escrow with a lowercase factoryAddress:
						// the market map keys are lowercase, so attribution must be
						// case-insensitive, and the duplicate escrow must dedupe.
						{escrow: '0x7E3B9ef8221a819E5497D713d0FD8F6486F2c2Bf', factoryAddress: '0x1fd4985cdd57bdb1ed646b10b7952fcd58946916', chainId: 1},
						{escrow: '0x000000000000000000000000000000000000dEaD', factoryAddress: '0x1fD4985cdd57bDb1eD646B10B7952fCD58946916', chainId: 1},
						// Escrow from the FiRM "Yearn ysyBOLD Market" (mapped, but
						// tracked by the second Inverse dashboard): it must never
						// leak into this dashboard's reUSD-sDOLA bucket.
						{escrow: '0x5000000000000000000000000000000000000001', factoryAddress: '0xa95605313EB4544f784e699dE93e9232DbFcf02d', chainId: 1}
					]
				}
			})
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = createResponse();
		await handler(
			{
				method: 'GET',
				query: {referrer: '0x1fD4985cdd57bDb1eD646B10B7952fCD58946916'}
			} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(response.statusCode).toBe(200);
		// Bucketed under the creating market's collateral vault
		// (yvCurve-reUSD-sDOLA-f), deduped across case spellings.
		expect(response.body).toEqual({
			1: {
				'0x7c439Df9ADE8831180EA4D546c1E910D4Ba71a86': [
					'0x7E3B9ef8221a819E5497D713d0FD8F6486F2c2Bf',
					'0x000000000000000000000000000000000000dEaD'
				]
			}
		});
		// The wire query must select factoryAddress; dropping the field fails
		// Envio validation server-side.
		const requestOptions = fetchMock.mock.calls[0]?.[1];
		const requestBody = typeof requestOptions === 'object' && requestOptions !== null && 'body' in requestOptions
			? String(requestOptions.body)
			: '';
		expect(requestBody).toContain('factoryAddress');
	});

	it('skips escrows from unmapped Inverse FiRM markets instead of misattributing them', async (): Promise<void> => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async (): Promise<{data: {InverseEscrowCreated: Array<Record<string, string | number>>}}> => ({
				data: {
					// A market absent from INVERSE_MARKET_VAULTS: its escrows must
					// never be counted against a mapped market's vault.
					InverseEscrowCreated: [
						{escrow: '0x7E3B9ef8221a819E5497D713d0FD8F6486F2c2Bf', factoryAddress: '0x1fD4985cdd57bDb1eD646B10B7952fCD58946916', chainId: 1},
						{escrow: '0x5000000000000000000000000000000000000001', factoryAddress: '0x9999999999999999999999999999999999999999', chainId: 1}
					]
				}
			})
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = createResponse();
		await handler(
			{
				method: 'GET',
				query: {referrer: '0x1fD4985cdd57bDb1eD646B10B7952fCD58946916'}
			} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({
			1: {'0x7c439Df9ADE8831180EA4D546c1E910D4Ba71a86': ['0x7E3B9ef8221a819E5497D713d0FD8F6486F2c2Bf']}
		});
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('Unmapped Inverse FiRM market 0x9999999999999999999999999999999999999999')
		);
		warnSpy.mockRestore();
	});

	it('scopes the second Inverse dashboard to the ysyBOLD FiRM market only', async (): Promise<void> => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async (): Promise<{data: {InverseEscrowCreated: Array<Record<string, string | number>>}}> => ({
				data: {
					// Both mapped FiRM markets have escrows; each dashboard must
					// see only its own market's.
					InverseEscrowCreated: [
						{escrow: '0x7E3B9ef8221a819E5497D713d0FD8F6486F2c2Bf', factoryAddress: '0x1fD4985cdd57bDb1eD646B10B7952fCD58946916', chainId: 1},
						{escrow: '0x5000000000000000000000000000000000000001', factoryAddress: '0xa95605313EB4544f784e699dE93e9232DbFcf02d', chainId: 1}
					]
				}
			})
		});
		vi.stubGlobal('fetch', fetchMock);

		const response = createResponse();
		await handler(
			{
				method: 'GET',
				// Login treasury of the second Inverse dashboard.
				query: {referrer: '0x8F97cCA30Dbe80e7a8B462F1dD1a51C32accDfC8'}
			} as unknown as NextApiRequest,
			response as unknown as NextApiResponse
		);

		expect(response.statusCode).toBe(200);
		// Only the ysyBOLD-market escrow, bucketed under the ysyBOLD vault; the
		// reUSD-sDOLA market's escrow belongs to the first dashboard.
		expect(response.body).toEqual({
			1: {'0x23346B04a7f55b8760E5860AA5A77383D63491cD': ['0x5000000000000000000000000000000000000001']}
		});
		// Skipping the other dashboard's market is silent: it is mapped, so it
		// is not an "unmapped market" warning.
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});
