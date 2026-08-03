import {describe, expect, it} from 'vitest';
import {BigNumber, ethers} from 'ethers';

import {
	aggregateSnapshots,
	calculateIncrementalProfitAndFees,
	getCurrentPricePerShare,
	getEffectiveFeeCutoff,
	getPerformanceFeeBps,
	prepareChartSnapshots
} from '../pages/api/partner-fees';

describe('partner fee accrual', (): void => {
	it('uses the later partner start cutoff without discarding the existing position', async (): Promise<void> => {
		expect(getEffectiveFeeCutoff(100, 200)).toBe(200);
		expect(getEffectiveFeeCutoff(null, 200)).toBe(200);

		const scale = BigNumber.from(10).pow(18);
		const shares = scale.mul(100);
		const ppsByBlock = new Map<number, BigNumber>([
			[100, scale],
			[200, scale.mul(11).div(10)],
			[300, scale.mul(12).div(10)]
		]);
		const provider = {
			connection: {url: 'fee-accrual-regression'},
			call: async (_request: unknown, block?: number): Promise<string> => {
				const pps = ppsByBlock.get(block ?? -1);
				if (!pps) {
					throw new Error(`Missing PPS fixture for block ${block}`);
				}
				return pps.toHexString();
			}
		} as unknown as ethers.providers.JsonRpcProvider;

		const result = await calculateIncrementalProfitAndFees(
			provider,
			[{blockNumber: 100, eventType: 'deposit', sharesBalance: shares}, {blockNumber: 300, eventType: 'deposit', sharesBalance: shares}],
			1000,
			scale.mul(13).div(10),
			18,
			'0x0000000000000000000000000000000000000001',
			200
		);

		expect(result.netProfit.eq(scale.mul(20))).toBe(true);
		expect(result.totalFees.gt(0)).toBe(true);
	});
	it('uses the Kong PPS fallback when the latest RPC read fails', async (): Promise<void> => {
		const provider = {
			connection: {url: 'latest-pps-fallback-regression'},
			call: async (): Promise<string> => {
				throw new Error('transient latest RPC failure');
			}
		} as unknown as ethers.providers.JsonRpcProvider;

		await expect(
			getCurrentPricePerShare(
				provider,
				'0x0000000000000000000000000000000000000007',
				'1234567890000000000',
			)
		).resolves.toEqual(BigNumber.from('1234567890000000000'));
	});
	it('carries each position balance through aggregate chart snapshots', (): void => {
		const scale = BigNumber.from(10).pow(6);
		const snapshots = aggregateSnapshots([
			{
				address: '0x0000000000000000000000000000000000000001',
				snapshot: {blockNumber: 100, eventType: 'deposit', sharesBalance: scale.mul(100)}
			},
			{
				address: '0x0000000000000000000000000000000000000002',
				snapshot: {blockNumber: 200, eventType: 'deposit', sharesBalance: scale.mul(10)}
			},
			{
				address: '0x0000000000000000000000000000000000000001',
				snapshot: {blockNumber: 300, eventType: 'withdraw', sharesBalance: scale.mul(80)}
			}
		]);

		expect(snapshots.map((snapshot) => snapshot.sharesBalance.toString())).toEqual([
			scale.mul(100).toString(),
			scale.mul(110).toString(),
			scale.mul(90).toString()
		]);
	});

	it('seeds a short chart window with balances from older deposits', async (): Promise<void> => {
		const scale = BigNumber.from(10).pow(6);
		const shares = scale.mul(100);
		const provider = {
			connection: {url: 'chart-window-baseline-regression'},
			call: async (_request: unknown, block?: number): Promise<string> => {
				if (block !== 200) {
					throw new Error(`Missing PPS fixture for block ${block}`);
				}
				return scale.toHexString();
			},
			getBlock: async (block: number): Promise<{timestamp: number}> => ({
				timestamp: block * 100
			}),
			getBlockNumber: async (): Promise<number> => 300
		} as unknown as ethers.providers.JsonRpcProvider;

		const chart = await prepareChartSnapshots(
			provider,
			[{blockNumber: 100, eventType: 'deposit', sharesBalance: shares}],
			6,
			scale,
			shares,
			'0x0000000000000000000000000000000000000001',
			1,
			provider,
			200
		);

		expect(chart.map((snapshot) => snapshot.shares)).toEqual([100, 100]);
	});

	it('accepts a standard accountant with a non-zero management fee', async (): Promise<void> => {
		const accountantAddress = '0x0000000000000000000000000000000000000002';
		const config = ethers.utils.defaultAbiCoder.encode(
			['uint256', 'uint256', 'uint256', 'uint256'],
			[25, 1000, 0, 5000]
		);
		const provider = {
			connection: {url: 'katana-fee-config-regression'},
			call: async (request: {data?: string}): Promise<string> => {
				if (request.data === '0x4fb3ccc5') {
					return ethers.utils.hexZeroPad(accountantAddress, 32);
				}
				if (request.data?.startsWith('0xde1eb9a3')) {
					return config;
				}
				throw new Error('global performanceFee() must not be used');
			}
		} as unknown as ethers.providers.JsonRpcProvider;

		await expect(
			getPerformanceFeeBps(
				provider,
				'0x0000000000000000000000000000000000000003'
			)
		).resolves.toBe(1000);
	});

	it('accrues management fees on the partner position over time', async (): Promise<void> => {
		const scale = BigNumber.from(10).pow(18);
		const shares = scale.mul(100);
		const year = 31_556_952;
		const pps = new Map<number, BigNumber>([[100, scale], [200, scale], [300, scale]]);
		const timestamps = new Map<number, number>([[100, 0], [200, year], [300, year * 2]]);
		const provider = {
			connection: {url: 'management-fee-regression'},
			call: async (_request: unknown, block?: number): Promise<string> => {
				const value = pps.get(block ?? -1);
				if (!value) {
					throw new Error(`Missing PPS fixture for block ${block}`);
				}
				return value.toHexString();
			},
			getBlock: async (block: number): Promise<{timestamp: number}> => ({
				timestamp: timestamps.get(block) ?? 0
			})
		} as unknown as ethers.providers.JsonRpcProvider;

		const result = await calculateIncrementalProfitAndFees(
			provider,
			[{blockNumber: 100, eventType: 'deposit', sharesBalance: shares}, {blockNumber: 300, eventType: 'deposit', sharesBalance: shares}],
			0,
			scale,
			18,
			'0x0000000000000000000000000000000000000005',
			200,
			100,
			year * 3
		);

		expect(result.netProfit.eq(0)).toBe(true);
		expect(result.totalFees.eq(scale.mul(2))).toBe(true);
	});

	it('reads performanceFee directly from legacy vaults without accountant()', async (): Promise<void> => {
		const provider = {
			connection: {url: 'legacy-vault-fee-regression'},
			call: async (request: {to?: string, data?: string}): Promise<string> => {
				if (request.data === '0x87788782' && request.to?.toLowerCase() === '0x0000000000000000000000000000000000000004') {
					return ethers.utils.hexZeroPad('0x3e8', 32);
				}
				throw new Error('unsupported selector');
			}
		} as unknown as ethers.providers.JsonRpcProvider;

		await expect(
			getPerformanceFeeBps(
				provider,
				'0x0000000000000000000000000000000000000004'
			)
		).resolves.toBe(1000);
	});
	it('treats empty fee selectors as a zero-fee vault', async (): Promise<void> => {
		const provider = {
			connection: {url: 'empty-fee-selector-regression'},
			call: async (): Promise<string> => '0x'
		} as unknown as ethers.providers.JsonRpcProvider;

		await expect(
			getPerformanceFeeBps(
				provider,
				'0x0000000000000000000000000000000000000006'
			)
		).resolves.toBe(0);
	});
});
