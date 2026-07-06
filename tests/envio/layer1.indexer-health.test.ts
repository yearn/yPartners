import {beforeAll, describe, expect, it} from 'vitest';

import {
	CACHED_MIN_BLOCK_HEIGHT,
	SUPPORTED_CHAIN_IDS,
	getRpcBlockNumber,
	loadEnvFile,
	queryEnvioGraphQL
} from './helpers';

beforeAll((): void => {
	loadEnvFile();
});

type TChainMetadata = {
	chain_metadata: Array<{chain_id: number | string; block_height: number | string}>;
};

describe('Layer 1 — Envio indexer health', () => {
	// Query once for every chain; the indexer exposes one row per indexed chain.
	const fetchChainMetadata = async (): Promise<Map<number, number>> => {
		const data = await queryEnvioGraphQL<TChainMetadata>(
			'{ chain_metadata { chain_id block_height } }'
		);
		const byChain = new Map<number, number>();
		for (const row of data.chain_metadata) {
			byChain.set(Number(row.chain_id), Number(row.block_height));
		}
		return byChain;
	};

	describe.each(SUPPORTED_CHAIN_IDS)('chain %i', (chainId) => {
		it('RPC current block height is ahead of the cached baseline', async () => {
			const rpcHeight = await getRpcBlockNumber(chainId);
			expect(
				rpcHeight,
				`RPC height for chain ${chainId} must exceed cached baseline`
			).toBeGreaterThan(CACHED_MIN_BLOCK_HEIGHT[chainId]);
		});

		it('Envio chain_metadata.block_height is ahead of the cached baseline', async () => {
			const metadata = await fetchChainMetadata();
			const envioHeight = metadata.get(chainId);
			expect(
				envioHeight,
				`Envio has no chain_metadata row for chain ${chainId} — indexer not configured or table empty`
			).toBeDefined();
			expect(
				envioHeight,
				`Envio block_height for chain ${chainId} (${envioHeight}) must exceed cached baseline (${CACHED_MIN_BLOCK_HEIGHT[chainId]}); indexer may be frozen or wiped`
			).toBeGreaterThan(CACHED_MIN_BLOCK_HEIGHT[chainId]);
		});
	});

	it('Envio reports every chain the dashboard depends on', async () => {
		const metadata = await fetchChainMetadata();
		const missing = SUPPORTED_CHAIN_IDS.filter((id) => !metadata.has(id));
		expect(missing, `Envio is missing chain_metadata for: ${missing.join(', ')}`).toEqual([]);
	});
});
