import {describe, expect, it} from 'vitest';

import type {NextApiRequest, NextApiResponse} from 'next';
import partnerFeesHandler from '../pages/api/partner-fees';
import partnerReferralsHandler from '../pages/api/partner-referrals';

type TMockResponse = {
	statusCode: number;
	body: unknown;
	setHeader(name: string, value: string): TMockResponse;
	status(statusCode: number): TMockResponse;
	json(body: unknown): TMockResponse;
};

function createResponse(): TMockResponse {
	const response: TMockResponse = {
		statusCode: 0,
		body: null,
		setHeader(): TMockResponse {
			return response;
		},
		status(statusCode: number): TMockResponse {
			response.statusCode = statusCode;
			return response;
		},
		json(body: unknown): TMockResponse {
			response.body = body;
			return response;
		}
	};
	return response;
}

async function withoutEnvioConfig(run: () => Promise<void>): Promise<void> {
	const original = process.env.ENVIO_GRAPHQL_URL;
	delete process.env.ENVIO_GRAPHQL_URL;
	try {
		await run();
	} finally {
		if (original === undefined) {
			delete process.env.ENVIO_GRAPHQL_URL;
		} else {
			process.env.ENVIO_GRAPHQL_URL = original;
		}
	}
}

const vaultAddress = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';
const depositorAddress = '0x028eC7330ff87667b6dfb0D94b954c820195336c';

describe('API infrastructure configuration errors', (): void => {
	it('reports missing Envio instead of zero partner fees', async (): Promise<void> => {
		await withoutEnvioConfig(async (): Promise<void> => {
			const response = createResponse();
			await partnerFeesHandler(
				{
					method: 'GET',
					query: {vaultAddress, addresses: depositorAddress, chainId: '1'}
				} as unknown as NextApiRequest,
				response as unknown as NextApiResponse
			);

			expect(response.statusCode).toBe(503);
			expect(response.body).toEqual({error: 'ENVIO_GRAPHQL_URL is not configured.'});
		});
	});

	it('reports missing Envio instead of an empty referral configuration', async (): Promise<void> => {
		await withoutEnvioConfig(async (): Promise<void> => {
			const response = createResponse();
			await partnerReferralsHandler(
				{
					method: 'GET',
					query: {referrer: depositorAddress}
				} as unknown as NextApiRequest,
				response as unknown as NextApiResponse
			);

			expect(response.statusCode).toBe(503);
			expect(response.body).toEqual({error: 'ENVIO_GRAPHQL_URL is not configured.'});
		});
	});
});
