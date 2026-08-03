import {beforeAll, describe, expect, it} from 'vitest';

import {
	buildOwnersList,
	JUMPER_FINAL_HOLDER,
	JUMPER_HOP,
	JUMPER_RECEIVER,
	JUMPER_REFERRER,
	JUMPER_REFERRAL_MIN,
	KATANA_VAULT,
	KNOWN_DEPOSIT_ASSETS,
	KNOWN_DEPOSIT_COUNT,
	KNOWN_DEPOSIT_ID,
	KNOWN_DEPOSIT_SHARES,
	KNOWN_REFERRAL_DEPOSIT_ID,
	KNOWN_WITHDRAW_MIN,
	loadEnvFile,
	parseChainIdFromEventId,
	queryEnvioGraphQL
} from './helpers';

const KATANA_CHAIN_ID = 747474;

// --- GraphQL mirrors (must match pages/api/partner-*.ts byte-for-byte) ----

// pages/api/partner-referrals.ts -> getReferralDeposits
const REFERRAL_DEPOSIT_QUERY = `
	query GetReferralDeposits($referrerAddress: String!) {
		ReferralDeposit(
			where: { referrer: { _ilike: $referrerAddress } }
			order_by: { id: asc }
		) { id receiver referrer vault }
	}
`;

// pages/api/partner-fees.ts -> getDepositEventsForAddresses
const DEPOSIT_QUERY = `
	query GetDepositorDeposits($owners: [String!]!, $vaultAddress: String!, $chainId: Int!) {
		Deposit(
			where: {
				owner: { _in: $owners }
				vaultAddress: { _ilike: $vaultAddress }
				chainId: { _eq: $chainId }
			}
			order_by: { id: asc }
		) { id sender owner assets shares }
	}
`;

// pages/api/partner-fees.ts -> getWithdrawEventsForAddresses
const WITHDRAW_QUERY = `
	query GetDepositorWithdrawals($owners: [String!]!, $vaultAddress: String!, $chainId: Int!) {
		Withdraw(
			where: {
				owner: { _in: $owners }
				vaultAddress: { _ilike: $vaultAddress }
				chainId: { _eq: $chainId }
			}
			order_by: { id: asc }
		) { id sender receiver owner assets shares }
	}
`;

// pages/api/partner-referrals.ts -> getTransfersFromSender
const TRANSFER_FROM_QUERY = `
	query GetSenderTransfers($senders: [String!]!, $vaultAddress: String!, $chainId: Int!) {
		Transfer(
			where: {
				sender: { _in: $senders }
				vaultAddress: { _ilike: $vaultAddress }
				chainId: { _eq: $chainId }
			}
			order_by: { id: asc }
		) { id receiver value }
	}
`;

type TReferralRow = {id: string; receiver: string; referrer: string; vault: string};
type TDepositRow = {id: string; sender: string; owner: string; assets: string; shares: string};
type TWithdrawRow = TDepositRow & {receiver: string};

type TTransferRow = {id: string; receiver: string; value: string};

beforeAll((): void => {
	loadEnvFile();
});

describe('Layer 2 — partner-referrals query parity', () => {
	it('returns the known Jumper referral set including the anchor event', async () => {
		const data = await queryEnvioGraphQL<{ReferralDeposit: TReferralRow[]}>(
			REFERRAL_DEPOSIT_QUERY,
			{referrerAddress: JUMPER_REFERRER.toLowerCase()}
		);
		const rows = data.ReferralDeposit;

		expect(rows.length, 'Jumper must have referral activity indexed').toBeGreaterThanOrEqual(
			JUMPER_REFERRAL_MIN
		);

		const ids = rows.map((r) => r.id);
		expect(ids).toContain(KNOWN_REFERRAL_DEPOSIT_ID);

		const anchor = rows.find((r) => r.id === KNOWN_REFERRAL_DEPOSIT_ID);
		expect(anchor, `anchor row ${KNOWN_REFERRAL_DEPOSIT_ID} missing`).toBeDefined();
		if (!anchor) {
			return;
		}

		// Mirrors partner-referrals.ts: chainId is parsed from the event id,
		// and vault/receiver are toAddress()-normalised downstream.
		expect(parseChainIdFromEventId(anchor.id)).toBe(KATANA_CHAIN_ID);
		expect(anchor.vault.toLowerCase()).toBe(KATANA_VAULT.toLowerCase());
		expect(anchor.receiver.toLowerCase()).toBe(JUMPER_RECEIVER.toLowerCase());
		expect(anchor.referrer.toLowerCase()).toBe(JUMPER_REFERRER.toLowerCase());
	});
});

describe('Layer 2 — partner-fees Deposit/Withdraw query parity', () => {
	// buildOwnersList mirrors the app exactly (lowercase + EIP-55 checksum).
	const owners = buildOwnersList([JUMPER_RECEIVER]);

	it('Deposit query returns the known deposits with faithful assets/shares', async () => {
		const data = await queryEnvioGraphQL<{Deposit: TDepositRow[]}>(DEPOSIT_QUERY, {
			owners,
			vaultAddress: KATANA_VAULT.toLowerCase(),
			chainId: KATANA_CHAIN_ID
		});
		const rows = data.Deposit;

		expect(rows.length).toBe(KNOWN_DEPOSIT_COUNT);
		expect(rows.map((r) => r.id)).toContain(KNOWN_DEPOSIT_ID);

		const anchor = rows.find((r) => r.id === KNOWN_DEPOSIT_ID);
		expect(anchor, `anchor deposit ${KNOWN_DEPOSIT_ID} missing`).toBeDefined();
		if (!anchor) {
			return;
		}
		// Cross-checks the decoded on-chain values, proving field fidelity.
		expect(anchor.assets).toBe(KNOWN_DEPOSIT_ASSETS);
		expect(anchor.shares).toBe(KNOWN_DEPOSIT_SHARES);
		expect(anchor.owner.toLowerCase()).toBe(JUMPER_RECEIVER.toLowerCase());
	});

	it('Withdraw query returns the known withdrawals', async () => {
		const data = await queryEnvioGraphQL<{Withdraw: TWithdrawRow[]}>(WITHDRAW_QUERY, {
			owners,
			vaultAddress: KATANA_VAULT.toLowerCase(),
			chainId: KATANA_CHAIN_ID
		});
		// Withdrawals grow over time (the router keeps transacting); assert a lower
		// bound rather than an exact count to avoid fixture drift.
		expect(data.Withdraw.length).toBeGreaterThanOrEqual(KNOWN_WITHDRAW_MIN);
	});
});

describe('Layer 2 — case-sensitivity guard (the silent-zero regression)', () => {
	// Envio stores addresses EIP-55 checksummed, so `_eq`/`_in` are
	// case-sensitive. The app defends by sending BOTH lowercase and checksummed
	// forms (buildOwnersList) and using `_ilike` for referrer. These assertions
	// pin that contract: if the indexer's storage casing ever changes, or the
	// app drops the checksummed form, a partner's data silently goes to zero.

	it('Deposit `_eq` with lowercase-only owner matches nothing', async () => {
		const data = await queryEnvioGraphQL<{Deposit: TDepositRow[]}>(
			`query($owner: String!, $vaultAddress: String!, $chainId: Int!) {
				Deposit(
					where: { owner: { _eq: $owner }, vaultAddress: { _ilike: $vaultAddress }, chainId: { _eq: $chainId } }
					order_by: { id: asc }
				) { id }
			}`,
			{owner: JUMPER_RECEIVER.toLowerCase(), vaultAddress: KATANA_VAULT.toLowerCase(), chainId: KATANA_CHAIN_ID}
		);
		expect(data.Deposit.length, 'lowercase-only _eq should NOT match checksummed storage').toBe(0);
	});

	it('Deposit `_in` with both forms (app logic) returns the full set', async () => {
		const data = await queryEnvioGraphQL<{Deposit: TDepositRow[]}>(DEPOSIT_QUERY, {
			owners: buildOwnersList([JUMPER_RECEIVER]),
			vaultAddress: KATANA_VAULT.toLowerCase(),
			chainId: KATANA_CHAIN_ID
		});
		expect(data.Deposit.length).toBe(KNOWN_DEPOSIT_COUNT);
	});

	it('ReferralDeposit `_eq` with lowercase-only referrer matches nothing', async () => {
		const data = await queryEnvioGraphQL<{ReferralDeposit: TReferralRow[]}>(
			`query($referrerAddress: String!) {
				ReferralDeposit(where: { referrer: { _eq: $referrerAddress } }, order_by: { id: asc }) { id }
			}`,
			{referrerAddress: JUMPER_REFERRER.toLowerCase()}
		);
		expect(data.ReferralDeposit.length).toBe(0);
	});

	it('ReferralDeposit `_ilike` (app logic) returns the full set', async () => {
		const data = await queryEnvioGraphQL<{ReferralDeposit: TReferralRow[]}>(
			REFERRAL_DEPOSIT_QUERY,
			{referrerAddress: JUMPER_REFERRER.toLowerCase()}
		);
		expect(data.ReferralDeposit.length).toBeGreaterThanOrEqual(JUMPER_REFERRAL_MIN);
	});
});

describe('Layer 2 — referral share holder resolution', () => {
	it('the anchor referral shares forward receiver -> hop -> final holder EOA', async () => {
		// The referral `receiver` is an aggregator router; it forwards the minted
		// shares to the end user in the same transaction. partner-referrals traces
		// the exact share amount hop-by-hop and attributes the deposit to the
		// address that ultimately holds the shares.
		const fromReceiver = await queryEnvioGraphQL<{Transfer: TTransferRow[]}>(
			TRANSFER_FROM_QUERY,
			{senders: buildOwnersList([JUMPER_RECEIVER]), vaultAddress: KATANA_VAULT.toLowerCase(), chainId: KATANA_CHAIN_ID}
		);
		const hop = fromReceiver.Transfer.find((t) => t.value === KNOWN_DEPOSIT_SHARES);
		expect(hop, 'receiver must forward the exact minted share amount').toBeDefined();
		expect(hop!.receiver.toLowerCase()).toBe(JUMPER_HOP.toLowerCase());

		const fromHop = await queryEnvioGraphQL<{Transfer: TTransferRow[]}>(
			TRANSFER_FROM_QUERY,
			{senders: buildOwnersList([JUMPER_HOP]), vaultAddress: KATANA_VAULT.toLowerCase(), chainId: KATANA_CHAIN_ID}
		);
		const holder = fromHop.Transfer.find((t) => t.value === KNOWN_DEPOSIT_SHARES);
		expect(holder, 'hop must forward the exact share amount to the holder').toBeDefined();
		expect(holder!.receiver.toLowerCase()).toBe(JUMPER_FINAL_HOLDER.toLowerCase());
	});
});
