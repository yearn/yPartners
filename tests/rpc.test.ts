import {ethers} from 'ethers';
import {afterEach, describe, expect, it, vi} from 'vitest';
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
		const send = vi.spyOn(ethers.providers.StaticJsonRpcProvider.prototype, 'send')
			.mockImplementation(async function(this: ethers.providers.StaticJsonRpcProvider, method: string, params: Array<unknown>): Promise<string> {
				void method;
				void params;
				if (this.connection.url === 'https://primary.example') {
					throw new Error('primary endpoint unavailable');
				}
				return '0x0000000000000000000000000000000000000000000000000000000000000000';
			});

		const provider = getLatestProvider(1);
		expect(provider).not.toBeNull();
		await expect(provider?.call({to: ethers.constants.AddressZero, data: '0x'})).resolves.toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000000'
		);
		expect(send).toHaveBeenCalledTimes(2);
	});
});
