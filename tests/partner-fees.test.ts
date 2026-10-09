import {describe, expect, it, vi} from 'vitest';
import {AbiCoder, zeroPadValue} from 'ethers';

import type {Provider} from 'ethers';

import {
	aggregateSnapshots,
	calculateIncrementalProfitAndFees,
	getCurrentPricePerShare,
	getCutoffBlockForTimestamp,
	getEffectiveFeeCutoff,
	getMillisecondsPerBlock,
	prefetchPricePerShare,
	getPerformanceFeeBps,
	getYDaemonFeeConfig,
	prepareChartSnapshots
} from '../pages/api/partner-fees';

describe('partner fee accrual', (): void => {
	it('uses the later partner start cutoff without discarding the existing position', async (): Promise<void> => {
		expect(getEffectiveFeeCutoff(100, 200)).toBe(200);
		expect(getEffectiveFeeCutoff(null, 200)).toBe(200);

		const scale = 10n ** 18n;
		const shares = scale * 100n;
		const ppsByBlock = new Map<number, bigint>([
			[100, scale],
			[200, scale * 11n / 10n],
			[300, scale * 12n / 10n]
		]);
		const provider = {
			connection: {url: 'fee-accrual-regression'},
			call: async ({blockTag}: {blockTag?: number}): Promise<string> => {
				const pps = ppsByBlock.get(blockTag ?? -1);
				if (!pps) {
					throw new Error(`Missing PPS fixture for block ${blockTag}`);
				}
				return `0x${pps.toString(16).padStart(64, '0')}`;
			}
		} as unknown as Provider;
		const result = await calculateIncrementalProfitAndFees(
			provider,
			[{blockNumber: 100, eventType: 'deposit', sharesBalance: shares}, {blockNumber: 300, eventType: 'deposit', sharesBalance: shares}],
			1000,
			scale * 13n / 10n,
			18,
			'0x0000000000000000000000000000000000000001',
			200
		);

		expect(result.netProfit === scale * 20n).toBe(true);
		expect(result.totalFees > 0n).toBe(true);
	});
	it('uses the Kong PPS fallback when the latest RPC read fails', async (): Promise<void> => {
		const provider = {
			connection: {url: 'latest-pps-fallback-regression'},
			call: async (): Promise<string> => {
				throw new Error('transient latest RPC failure');
			}
		} as unknown as Provider;

		await expect(
			getCurrentPricePerShare(
				provider,
				'0x0000000000000000000000000000000000000007',
				'1234567890000000000',
			)
		).resolves.toEqual(1234567890000000000n);
	});
	it('carries each position balance through aggregate chart snapshots', (): void => {
		const scale = 10n ** 6n;
		const snapshots = aggregateSnapshots([
			{
				address: '0x0000000000000000000000000000000000000001',
				snapshot: {blockNumber: 100, eventType: 'deposit', sharesBalance: scale * 100n}
			},
			{
				address: '0x0000000000000000000000000000000000000002',
				snapshot: {blockNumber: 200, eventType: 'deposit', sharesBalance: scale * 10n}
			},
			{
				address: '0x0000000000000000000000000000000000000001',
				snapshot: {blockNumber: 300, eventType: 'withdraw', sharesBalance: scale * 80n}
			}
		]);

		expect(snapshots.map((snapshot) => snapshot.sharesBalance.toString())).toEqual([
			(scale * 100n).toString(),
			(scale * 110n).toString(),
			(scale * 90n).toString()
		]);
	});

	it('seeds a short chart window without timestamp RPCs', async (): Promise<void> => {
		const scale = 10n ** 6n;
		const shares = scale * 100n;
		const provider = {
			connection: {url: 'chart-window-baseline-regression'},
			call: async ({blockTag}: {blockTag?: number}): Promise<string> => {
				if (blockTag !== 200) {
					throw new Error(`Missing PPS fixture for block ${blockTag}`);
				}
				return `0x${scale.toString(16).padStart(64, '0')}`;
			},
			getBlockNumber: async (): Promise<number> => 300
		} as unknown as Provider;

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
		const scale = 10n ** 18n;
		const shares = scale * 100n;
		const ppsByBlock = new Map<number, bigint>([
			[100, scale],
			[200, scale * 11n / 10n]
		]);
		const provider = {
			connection: {url: 'fee-accrual-anchor-regression'},
			call: async ({blockTag}: {blockTag?: number}): Promise<string> => {
				const pps = blockTag === undefined ? undefined : ppsByBlock.get(blockTag);
				if (!pps) {
					throw new Error(`Missing PPS fixture for block ${blockTag}`);
				}
				return `0x${pps.toString(16).padStart(64, '0')}`;
			},
			getBlockNumber: async (): Promise<number> => 300
		} as unknown as Provider;

		const chart = await prepareChartSnapshots(
			provider,
			[{blockNumber: 100, eventType: 'deposit', sharesBalance: shares}],
			18,
			scale * 13n / 10n,
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

	it('applies a partner-specific fee share to chart fee splits', async (): Promise<void> => {
		// Inverse scenario: 65% of accrued fees go to the partner instead of the
		// default 50%. Same fee base, only the share differs.
		const scale = 10n ** 6n;
		const shares = scale * 100n;
		const provider = {
			connection: {url: 'partner-fee-share-regression'},
			call: async ({blockTag}: {blockTag?: number}): Promise<string> => {
				if (blockTag !== 200) {
					throw new Error(`Missing PPS fixture for block ${blockTag}`);
				}
				return `0x${scale.toString(16).padStart(64, '0')}`;
			},
			getBlockNumber: async (): Promise<number> => 300
		} as unknown as Provider;

		const runChart = async (partnerFeeShare?: number) => prepareChartSnapshots(
			provider,
			[{blockNumber: 100, eventType: 'deposit', sharesBalance: shares}],
			6,
			scale * 2n,
			shares,
			'0x0000000000000000000000000000000000000001',
			1,
			provider,
			200, // plotCutoff: window start
			200, // accrualCutoff: fee start date
			1000, // performanceFeeBps
			0, // managementFeeBps
			300, // currentBlock
			1, // chainId
			partnerFeeShare
		);

		const defaultChart = await runChart(undefined);
		const halfChart = await runChart(0.5);
		const inverseChart = await runChart(0.65);

		// Omitting the share behaves exactly like the default 50/50 split.
		expect(defaultChart[defaultChart.length - 1].feeSplit)
			.toBeCloseTo(halfChart[halfChart.length - 1].feeSplit, 6);

		// Fee base is $11.11… (100 * 1/9 performance fee); the shares scale it.
		expect(halfChart[halfChart.length - 1].feeSplit).toBeCloseTo(100 / 9 * 0.5, 6);
		expect(inverseChart[inverseChart.length - 1].feeSplit).toBeCloseTo(100 / 9 * 0.65, 6);
		expect(inverseChart[inverseChart.length - 1].feeSplit / halfChart[halfChart.length - 1].feeSplit).toBeCloseTo(1.3, 6);
	});

	it('accepts a standard accountant with a non-zero management fee', async (): Promise<void> => {
		const accountantAddress = '0x0000000000000000000000000000000000000002';
		const config = AbiCoder.defaultAbiCoder().encode(
			['uint256', 'uint256', 'uint256', 'uint256'],
			[25, 1000, 0, 5000]
		);
		const provider = {
			connection: {url: 'katana-fee-config-regression'},
			call: async (request: {data?: string}): Promise<string> => {
				if (request.data === '0x4fb3ccc5') {
					return zeroPadValue(accountantAddress, 32);
				}
				if (request.data?.startsWith('0xde1eb9a3')) {
					return config;
				}
				throw new Error('global performanceFee() must not be used');
			}
		} as unknown as Provider;

		await expect(
			getPerformanceFeeBps(
				provider,
				'0x0000000000000000000000000000000000000003'
			)
		).resolves.toBe(1000);
	});

	it('converts yDaemon retired-vault fee metadata to basis points', async (): Promise<void> => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async (): Promise<unknown> => ({
				apr: {fees: {management: 0, performance: 0.1}}
			})
		});
		vi.stubGlobal('fetch', fetchMock);
		try {
			await expect(getYDaemonFeeConfig(
				42161,
				'0x6FAF8b7fFeE3306EfcFc2BA9Fec912b4d49834C1',
			)).resolves.toEqual({
				managementFeeBps: 0,
				performanceFeeBps: 1000
			});
			expect(fetchMock).toHaveBeenCalledWith(
				'https://ydaemon.yearn.fi/42161/vaults/0x6FAF8b7fFeE3306EfcFc2BA9Fec912b4d49834C1',
			);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('accrues management fees from average block time without timestamp RPCs', async (): Promise<void> => {
		const scale = 10n ** 18n;
		const shares = scale * 100n;
		const year = 31_556_952;
		const blocksPerYear = year * 1000 / getMillisecondsPerBlock(1);
		const firstYearBlock = 100 + blocksPerYear;
		const currentBlock = 100 + blocksPerYear * 2;
		const pps = new Map<number, bigint>([
			[100, scale],
			[firstYearBlock, scale],
		]);
		const provider = {
			connection: {url: 'management-fee-regression'},
			call: async ({blockTag}: {blockTag?: number}): Promise<string> => {
				const value = pps.get(blockTag ?? -1);
				if (!value) {
					throw new Error(`Missing PPS fixture for block ${blockTag}`);
				}
				return `0x${value.toString(16).padStart(64, '0')}`;
			}
		} as unknown as Provider;

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

		expect(result.netProfit === 0n).toBe(true);
		expect(result.totalFees === scale * 2n).toBe(true);
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
					return zeroPadValue('0x03e8', 32);
				}
				throw new Error('unsupported selector');
			}
		} as unknown as Provider;

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
		} as unknown as Provider;

		await expect(
			getPerformanceFeeBps(
				provider,
				'0x0000000000000000000000000000000000000006'
			)
		).resolves.toBe(0);
	});
	it('resolves the accrual floor to the exact block by timestamp search', async (): Promise<void> => {
		// Blocks arrive every 13s while the configured average is 12s. The old
		// linear estimate (currentBlock - secondsAgo / 12s) resolved a fee start
		// hundreds of blocks before the actual start block and seeded
		// pre-partnership profit into the fee line. The floor must be exact and
		// must not scan every block header.
		const baseTimestamp = 1_700_000_000;
		const head = 20_000;
		const blocksByNumber = new Map<number, {number: number; timestamp: number}>();
		for (let number = 0; number <= head; number += 1) {
			blocksByNumber.set(number, {number, timestamp: baseTimestamp + number * 13});
		}
		let getBlockCalls = 0;
		const provider = {
			connection: {url: 'timestamp-cutoff-regression'},
			getBlockNumber: async (): Promise<number> => head,
			getBlock: async (blockNumber: number): Promise<{number: number; timestamp: number} | null> => {
				getBlockCalls += 1;
				return blocksByNumber.get(blockNumber) ?? null;
			}
		} as unknown as Provider;

		const startBlock = 12_000;
		const startTimestamp = baseTimestamp + startBlock * 13;

		// Exact hit: the partnership tx block lands exactly on the fee start second.
		await expect(getCutoffBlockForTimestamp(provider, startTimestamp)).resolves.toBe(startBlock);
		// Between blocks: the floor is the first block at or after the target.
		await expect(getCutoffBlockForTimestamp(provider, startTimestamp + 1)).resolves.toBe(startBlock + 1);
		// Future target: clamp to the head.
		await expect(getCutoffBlockForTimestamp(provider, baseTimestamp + head * 13 + 60)).resolves.toBe(head);
		// Non-positive target keeps the "no filter" behavior.
		await expect(getCutoffBlockForTimestamp(provider, 0)).resolves.toBeNull();
		// Binary search only: a per-block scan would take 20k header reads.
		expect(getBlockCalls).toBeLessThan(50);
	});

	it('prefetches price-per-share in one concurrent wave and caches results', async (): Promise<void> => {
		// The wave must put (nearly) all blocks in flight at once so the
		// underlying JsonRpcProvider can coalesce them into batched JSON-RPC
		// requests; a concurrency cap here throttles that into many sequential
		// round trips and dashboard loads crawl on rate-limited archive RPCs.
		const vault = '0x0000000000000000000000000000000000000001';
		const blocks = Array.from({length: 24}, (_, i) => 1000 + i);
		const poisonBlock = 500; // Always fails; must not abort the wave.
		// Each call holds until the last block is in flight, so peak
		// concurrency is observed deterministically without real timers.
		const allInFlight = Promise.withResolvers<void>();
		let inFlight = 0;
		let peak = 0;
		let calls = 0;
		let launched = 0;
		const provider = {
			connection: {url: 'pps-prefetch-wave-regression'},
			call: async ({blockTag}: {blockTag?: number}): Promise<string> => {
				calls += 1;
				if (blockTag === poisonBlock) {
					throw new Error('poison block');
				}
				launched += 1;
				inFlight += 1;
				peak = Math.max(peak, inFlight);
				if (launched === blocks.length) {
					allInFlight.resolve();
				}
				await allInFlight.promise;
				inFlight -= 1;
				return '0x' + (BigInt(blockTag ?? 0) * 10n ** 18n).toString(16).padStart(64, '0');
			}
		} as unknown as Provider;

		await prefetchPricePerShare(provider, vault, [...blocks, poisonBlock]);
		expect(peak).toBe(blocks.length);

		// Second pass resolves from the shared cache; only the failed block is
		// retried (and fails again) without aborting the wave.
		await prefetchPricePerShare(provider, vault, [...blocks, poisonBlock]);
		expect(calls).toBe(blocks.length + 2);
	});
});
