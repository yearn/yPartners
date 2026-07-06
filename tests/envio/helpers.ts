import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ethers} from 'ethers';

import {getRpcUrlLatest} from '../../lib/crypto/rpc';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * Load `.env` into `process.env` without pulling in a dependency.
 * Existing environment values win (mirrors dotenv semantics) so CI secrets or
 * shell overrides are respected. Vitest does not load `.env` automatically
 * (unlike Next.js), so tests must opt in here.
 */
export function loadEnvFile(path = resolve(process.cwd(), '.env')): void {
	if (!existsSync(path)) {
		return;
	}
	const raw = readFileSync(path, 'utf8');
	for (const line of raw.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}
		const eq = trimmed.indexOf('=');
		if (eq === -1) {
			continue;
		}
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		// Strip surrounding quotes (single or double) as Next.js / dotenv do.
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) {
			process.env[key] = value;
		}
	}
}

loadEnvFile();

// ---------------------------------------------------------------------------
// Envio GraphQL client (mirrors queryEnvioGraphQL in pages/api/partner-*.ts)
// ---------------------------------------------------------------------------

export async function queryEnvioGraphQL<T>(
	query: string,
	variables: Record<string, unknown> = {}
): Promise<T> {
	const envioUrl = process.env.ENVIO_GRAPHQL_URL;
	if (!envioUrl) {
		throw new Error('ENVIO_GRAPHQL_URL must be configured (set in .env)');
	}

	const headers: Record<string, string> = {'Content-Type': 'application/json'};
	if (process.env.ENVIO_PASSWORD) {
		headers.Authorization = `Bearer ${process.env.ENVIO_PASSWORD}`;
	}

	const response = await fetch(envioUrl, {
		method: 'POST',
		headers,
		body: JSON.stringify({query, variables})
	});

	if (!response.ok) {
		throw new Error(`GraphQL query failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as {data?: T; errors?: unknown};
	if (data.errors) {
		throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
	}
	if (!data.data) {
		throw new Error('GraphQL response had no `data`');
	}
	return data.data;
}

// ---------------------------------------------------------------------------
// RPC helpers (reuse the app's own chain config)
// ---------------------------------------------------------------------------

export async function getRpcBlockNumber(chainId: number): Promise<number> {
	const url = getRpcUrlLatest(chainId);
	if (!url) {
		throw new Error(`No RPC URL configured for chain ${chainId}`);
	}
	const provider = new ethers.providers.JsonRpcProvider(url, chainId);
	return provider.getBlockNumber();
}

// ---------------------------------------------------------------------------
// Query-logic mirrors (must stay byte-for-byte equivalent to the app)
// ---------------------------------------------------------------------------

/**
 * Mirror of `buildOwnersList` in pages/api/partner-fees.ts.
 *
 * Envio stores addresses EIP-55 checksummed; `_in` / `_eq` are case-sensitive.
 * The app therefore sends BOTH the lowercased and checksummed forms so the
 * match stays case-insensitive. Tests reuse this to prove that contract.
 */
export function buildOwnersList(addresses: string[]): string[] {
	const owners = new Set<string>();
	for (const addr of addresses) {
		owners.add(addr.toLowerCase());
		try {
			owners.add(ethers.utils.getAddress(addr));
		} catch {
			// Ignore malformed addresses.
		}
	}
	return Array.from(owners);
}

/**
 * Mirror of `parseChainIdFromEventId` in pages/api/partner-referrals.ts.
 * Envio multi-chain event IDs are "{chainId}_{blockNumber}_{logIndex}".
 */
export function parseChainIdFromEventId(eventId: string): number | null {
	const parts = eventId.split('_');
	if (parts.length < 3) {
		return null;
	}
	const chainId = parseInt(parts[0], 10);
	if (!Number.isFinite(chainId) || chainId <= 0) {
		return null;
	}
	return chainId;
}

// ---------------------------------------------------------------------------
// Fixtures (grounded in on-chain / Envio reality; refresh quarterly)
// ---------------------------------------------------------------------------

/** Chains the partner dashboard actively queries. */
export const SUPPORTED_CHAIN_IDS = [1, 8453, 42161, 747474] as const;

/**
 * Cached minimum `block_height` per chain that Envio's `chain_metadata` must
 * exceed. Set from RPC heads observed 2026-07-06 with a buffer so a frozen or
 * wiped indexer (the outage class observed earlier) fails loudly. Bump these
 * periodically; if the indexer is healthy it will always be ahead.
 */
export const CACHED_MIN_BLOCK_HEIGHT: Record<number, number> = {
	1: 24_000_000,
	8453: 47_000_000,
	42161: 470_000_000,
	747474: 35_000_000
};

/** Jumper treasury / referrer address. */
export const JUMPER_REFERRER = '0x3610486BD4975F5C3dC838A36E897bF97fAE15DD';

/** Real depositor referred by Jumper (receiver of the referral deposit). */
export const JUMPER_RECEIVER = '0x81cfb09a90f427841A14B460192b41d86eA8855E';

/** Katana vault the receiver deposited into via the Jumper referral. */
export const KATANA_VAULT = '0xE007CA01894c863d7898045ed5A3B4Abf0b18f37';

/** The referral deposit from tx 0x1bc2…dc619 (block 31743730, logIndex 12). */
export const KNOWN_REFERRAL_DEPOSIT_ID = '747474_31743730_12';

/** Matching ERC4626 Deposit log (same tx, logIndex 11). */
export const KNOWN_DEPOSIT_ID = '747474_31743730_11';

/** On-chain assets/shares for KNOWN_DEPOSIT_ID (decoded from the tx receipt). */
export const KNOWN_DEPOSIT_ASSETS = '44419000000000000000';
export const KNOWN_DEPOSIT_SHARES = '43863018170588892564';

/** Immutable historical event counts for KNOWN receiver/vault on Katana. */
export const KNOWN_DEPOSIT_COUNT = 2;
export const KNOWN_WITHDRAW_COUNT = 5;

/** Lower bound for Jumper referral rows on Katana (observed 19 on 2026-07-06). */
export const JUMPER_REFERRAL_MIN = 19;
