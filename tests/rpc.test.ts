import {JsonRpcProvider, ZeroAddress} from 'ethers';
import {afterEach, describe, expect, it, vi} from 'vitest';

import type {PerformActionRequest} from 'ethers';

import {getLatestProvider} from 'lib/crypto/rpc';

const originalMainnetPublic = process.env.RPC_URL_MAINNET_PUBLIC;

afterEach((): void => {
	vi.restoreAllMocks();
	if (originalMainnetPublic === undefined) {
		delete process.env.RPC_URL_MAINNET_PUBLIC;
	} else {
		process.env.RPC_URL_MAINNET_PUBLIC = originalMainnetPublic;
	}
});

describe('RPC provider failover', (): void => {
	it('tries the next configured endpoint after a provider error', async (): Promise<void> => {
		process.env.RPC_URL_MAINNET_PUBLIC = 'https://primary.example';
		const perform = vi.spyOn(JsonRpcProvider.prototype, '_perform')
			.mockImplementation(async function(this: JsonRpcProvider, req: PerformActionRequest): Promise<unknown> {
				void req;
				if (this._getConnection().url === 'https://primary.example') {
					throw new Error('primary endpoint unavailable');
				}
				return '0x0000000000000000000000000000000000000000000000000000000000000000';
			});

		const provider = getLatestProvider(1);
		expect(provider).not.toBeNull();
		await expect(provider?.call({to: ZeroAddress, data: '0x'})).resolves.toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000000'
		);
		expect(perform).toHaveBeenCalledTimes(2);
	});

	it('caps concurrent JSON-RPC batches at the safe default instead of ethers\' 100', async (): Promise<void> => {
		process.env.RPC_URL_MAINNET_PUBLIC = 'https://primary.example';
		const originalBatchMax = process.env.RPC_BATCH_MAX_COUNT;
		delete process.env.RPC_BATCH_MAX_COUNT;
		const provider = getLatestProvider(1);
		if (originalBatchMax !== undefined) {
			process.env.RPC_BATCH_MAX_COUNT = originalBatchMax;
		}
		if (!provider) {
			throw new Error('provider unexpectedly null');
		}

		const batchSizes: number[] = [];
		const send = vi.spyOn(JsonRpcProvider.prototype, '_send')
			.mockImplementation(async (payload) => {
				const payloads = Array.isArray(payload) ? payload : [payload];
				batchSizes.push(payloads.length);
				return payloads.map((entry) => ({id: entry.id, result: `0x${'00'.repeat(32)}`}));
			});

		// Distinct payloads bypass AbstractProvider's call cache; all seven
		// enqueue within one drain window, so the batch splits are exercised
		// exactly as a concurrent asset()/token() wave would produce them.
		const results = await Promise.all(Array.from({length: 7}, (_, index) =>
			provider.call({to: ZeroAddress, data: `0x${index.toString(16).padStart(2, '0')}`})));
		send.mockRestore();

		expect(results.every((result) => result === `0x${'00'.repeat(32)}`)).toBe(true);
		expect(batchSizes.length).toBeGreaterThan(0);
		// Default of 3 is safe on free-tier RPCs (drpc rejects larger batches).
		expect(Math.max(...batchSizes)).toBeLessThanOrEqual(3);
		expect(batchSizes.reduce((total, size) => total + size, 0)).toBe(7);
	});
});
