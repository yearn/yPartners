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
});
