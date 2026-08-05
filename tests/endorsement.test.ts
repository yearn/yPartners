import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ethers} from 'ethers';

import type {TMulticallCall, TMulticallResult} from 'lib/yearn/multicall';

const mocks = vi.hoisted(() => ({
	aggregate3: vi.fn(),
	getRpcUrlLatest: vi.fn()
}));

vi.mock('lib/yearn/multicall', () => ({
	aggregate3: mocks.aggregate3
}));
vi.mock('lib/crypto/rpc', () => ({
	getRpcUrlLatest: mocks.getRpcUrlLatest
}));

import {checkVaultsEndorsement} from '../lib/yearn/endorsement';

const ENDORSEMENT_INTERFACE = new ethers.utils.Interface([
	'function isEndorsed(address vault) view returns (bool)'
]);

const vaultA = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204';
const vaultB = '0x028eC7330ff87667b6dfb0D94b954c820195336c';
const vaultC = '0xAe7d8Db82480E6d8e3873ecbF22cf17b3D8A7308';

describe('vault endorsement batching', (): void => {
	beforeEach((): void => {
		vi.resetAllMocks();
		mocks.getRpcUrlLatest.mockReturnValue('https://rpc.example');
		mocks.aggregate3.mockImplementation(async (
			_provider: unknown,
			calls: TMulticallCall[]
		): Promise<TMulticallResult[]> => calls.map((_, index): TMulticallResult => ({
			success: true,
			returnData: ENDORSEMENT_INTERFACE.encodeFunctionResult('isEndorsed', [index === 0])
		})));
	});

	it('uses one Multicall3 request per chain and preserves endorsement results', async (): Promise<void> => {
		const endorsements = await checkVaultsEndorsement([
			{chainId: 1, vaultAddress: vaultA},
			{chainId: 1, vaultAddress: vaultB},
			{chainId: 10, vaultAddress: vaultC}
		]);

		expect(mocks.aggregate3).toHaveBeenCalledTimes(2);
		expect(mocks.aggregate3.mock.calls[0][1]).toHaveLength(2);
		expect(mocks.aggregate3.mock.calls[1][1]).toHaveLength(1);
		expect(endorsements).toEqual(new Map([
			[`1:${vaultA.toLowerCase()}`, true],
			[`1:${vaultB.toLowerCase()}`, false],
			[`10:${vaultC.toLowerCase()}`, true]
		]));
	});
});
