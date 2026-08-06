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
});
