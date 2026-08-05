import {describe, expect, it} from 'vitest';
import {BigNumber, ethers} from 'ethers';

import {
	aggregateSnapshots,
	calculateIncrementalProfitAndFees,
	getCurrentPricePerShare,
	getEffectiveFeeCutoff,
	getMillisecondsPerBlock,
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

	it('seeds a short chart window without timestamp RPCs', async (): Promise<void> => {
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
			200,
			null,
			0,
			1000
		);

		expect(chart.map((snapshot) => snapshot.shares)).toEqual([100, 100]);
	});

	it('anchors the partner fee line at zero until the accrual start', async (): Promise<void> => {
		// Frankencoin scenario: a position exists before the fee start date and
		// no events occur after it. The chart must stay flat at zero until the
		// accrual cutoff block instead of drawing a straight diagonal from the
		// window origin to today's accrued fee.
		const scale = BigNumber.from(10).pow(18);
		const shares = scale.mul(100);
		const ppsByBlock = new Map<number, BigNumber>([
			[100, scale],
			[200, scale.mul(11).div(10)]
		]);
		const provider = {
			connection: {url: 'fee-accrual-anchor-regression'},
			call: async (_request: unknown, block?: number): Promise<string> => {
				const pps = block === undefined ? undefined : ppsByBlock.get(block);
				if (!pps) {
					throw new Error(`Missing PPS fixture for block ${block}`);
				}
				return pps.toHexString();
			},
			getBlockNumber: async (): Promise<number> => 300
		} as unknown as ethers.providers.JsonRpcProvider;

		const chart = await prepareChartSnapshots(
			provider,
			[{blockNumber: 100, eventType: 'deposit', sharesBalance: shares}],
			18,
			scale.mul(13).div(10),
			shares,
			'0x0000000000000000000000000000000000000001',
			1,
			provider,
			100, // plotCutoff: window start
			200, // accrualCutoff: fee start date
			1000, // performanceFeeBps
			0, // managementFeeBps
			300 // currentBlock
		);

		// A zero-fee anchor exists exactly at the accrual start block.
		const anchor = chart.find((snapshot) => snapshot.block === 200);
		expect(anchor).toBeDefined();
		expect(anchor?.feeSplit).toBe(0);

		// Every point before the accrual start is clamped to zero fees.
		const preAccrual = chart.filter((snapshot) => snapshot.block < 200);
		expect(preAccrual.length).toBeGreaterThan(0);
		expect(preAccrual.every((snapshot) => snapshot.feeSplit === 0)).toBe(true);

		// The fixed 50% partner share yields half of the computed $2.222… fee.
		expect(chart[chart.length - 1].feeSplit).toBeCloseTo(1.1111111111111112, 6);
		expect(anchor?.profit).toBeCloseTo(10, 6);
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

	it('accrues management fees from average block time without timestamp RPCs', async (): Promise<void> => {
		const scale = BigNumber.from(10).pow(18);
		const shares = scale.mul(100);
		const year = 31_556_952;
		const blocksPerYear = year * 1000 / getMillisecondsPerBlock(1);
		const firstYearBlock = 100 + blocksPerYear;
		const currentBlock = 100 + blocksPerYear * 2;
		const pps = new Map<number, BigNumber>([
			[100, scale],
			[firstYearBlock, scale],
		]);
		const provider = {
			connection: {url: 'management-fee-regression'},
			call: async (_request: unknown, block?: number): Promise<string> => {
				const value = pps.get(block ?? -1);
				if (!value) {
					throw new Error(`Missing PPS fixture for block ${block}`);
				}
				return value.toHexString();
			}
		} as unknown as ethers.providers.JsonRpcProvider;

		const result = await calculateIncrementalProfitAndFees(
			provider,
			[
				{blockNumber: 100, eventType: 'deposit', sharesBalance: shares},
				{blockNumber: firstYearBlock, eventType: 'deposit', sharesBalance: shares}
			],
			0,
			scale,
			18,
			'0x0000000000000000000000000000000000000005',
			100,
			100,
			currentBlock,
			1
		);

		expect(result.netProfit.eq(0)).toBe(true);
		expect(result.totalFees.eq(scale.mul(2))).toBe(true);
	});

	it('rejects unsupported chains instead of using an arbitrary block time', (): void => {
		expect(() => getMillisecondsPerBlock(999999)).toThrow(
			'Unsupported chain 999999'
		);
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
