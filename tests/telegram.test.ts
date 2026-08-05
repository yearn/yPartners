import {afterAll, beforeEach, describe, expect, it, vi} from 'vitest';

import type {NextApiRequest, NextApiResponse} from 'next';

vi.mock('ioredis', () => ({
	default: vi.fn()
}));

import handler from '../pages/api/telegram';

type TResponseBody = {
	success: boolean;
	error?: string;
};

type TMockResponse = {
	statusCode: number;
	body: TResponseBody | null;
	setHeader(name: string, value: string): TMockResponse;
	status(statusCode: number): TMockResponse;
	json(body: TResponseBody): TMockResponse;
};

const fetchMock = vi.fn();
const originalTurnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET;

function createResponse(): TMockResponse {
	const response: TMockResponse = {
		statusCode: 0,
		body: null,
		setHeader: (): TMockResponse => response,
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

function createRequest(turnstileToken?: string): NextApiRequest {
	return {
		method: 'POST',
		headers: {},
		body: {
			name: 'Example Partner',
			tguser: '@example',
			protocol: 'Example Protocol',
			turnstileToken
		}
	} as unknown as NextApiRequest;
}

describe('contact form Turnstile verification', (): void => {
	beforeEach((): void => {
		vi.resetAllMocks();
		vi.stubGlobal('fetch', fetchMock);
		process.env.TELEGRAM_BOT = 'bot-token';
		process.env.TELEGRAM_RECIPIENT_USERID = 'recipient-id';
		delete process.env.CLOUDFLARE_TURNSTILE_SECRET;
	});

	afterAll((): void => {
		vi.unstubAllGlobals();
		if (originalTurnstileSecret === undefined) {
			delete process.env.CLOUDFLARE_TURNSTILE_SECRET;
		} else {
			process.env.CLOUDFLARE_TURNSTILE_SECRET = originalTurnstileSecret;
		}
	});

	it('allows submissions when Turnstile is disabled', async (): Promise<void> => {
		fetchMock.mockResolvedValue({ok: true});
		const response = createResponse();

		await handler(createRequest(), response as unknown as NextApiResponse);

		expect(response.statusCode).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toContain('api.telegram.org');
	});

	it('rejects a missing token when Turnstile is enabled', async (): Promise<void> => {
		process.env.CLOUDFLARE_TURNSTILE_SECRET = 'turnstile-secret';
		const response = createResponse();

		await handler(createRequest(), response as unknown as NextApiResponse);

		expect(response.statusCode).toBe(400);
		expect(response.body).toEqual({success: false, error: 'Verification is required'});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects an invalid Turnstile token before contacting Telegram', async (): Promise<void> => {
		process.env.CLOUDFLARE_TURNSTILE_SECRET = 'turnstile-secret';
		fetchMock.mockResolvedValue({ok: true, json: async (): Promise<{success: boolean}> => ({success: false})});
		const response = createResponse();

		await handler(createRequest('invalid-token'), response as unknown as NextApiResponse);

		expect(response.statusCode).toBe(403);
		expect(response.body).toEqual({success: false, error: 'Verification failed'});
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toContain('turnstile/v0/siteverify');
	});

	it('returns a retryable error when Turnstile is unavailable', async (): Promise<void> => {
		process.env.CLOUDFLARE_TURNSTILE_SECRET = 'turnstile-secret';
		fetchMock.mockRejectedValue(new Error('network unavailable'));
		const response = createResponse();

		await handler(createRequest('valid-token'), response as unknown as NextApiResponse);

		expect(response.statusCode).toBe(503);
		expect(response.body).toEqual({success: false, error: 'Verification service unavailable'});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('sends verified submissions to Telegram', async (): Promise<void> => {
		process.env.CLOUDFLARE_TURNSTILE_SECRET = 'turnstile-secret';
		fetchMock
			.mockResolvedValueOnce({ok: true, json: async (): Promise<{success: boolean}> => ({success: true})})
			.mockResolvedValueOnce({ok: true});
		const response = createResponse();

		await handler(createRequest('valid-token'), response as unknown as NextApiResponse);

		expect(response.statusCode).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0][0]).toContain('turnstile/v0/siteverify');
		expect(fetchMock.mock.calls[1][0]).toContain('api.telegram.org');
	});
});
