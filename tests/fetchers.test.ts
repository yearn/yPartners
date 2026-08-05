import {afterEach, describe, expect, it, vi} from 'vitest';

import {baseFetcher} from '../lib/yearn/utils/fetchers';

describe('baseFetcher', (): void => {
	afterEach((): void => {
		vi.unstubAllGlobals();
	});

	it('preserves a typed API error from an unavailable dependency', async (): Promise<void> => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
			JSON.stringify({error: 'No RPC URL configured for chain 1.'}),
			{status: 503, headers: {'Content-Type': 'application/json'}}
		)));

		await expect(baseFetcher('/api/partner-tvl')).rejects.toThrow('No RPC URL configured for chain 1.');
	});
});
