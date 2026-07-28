import { toAddress } from "lib/yearn/utils/address";
import {SHAREABLE_ADDRESSES} from 'utils/Partners';
import type { NextApiRequest, NextApiResponse } from "next";

// Chains where YearnReferralWrapper (0x3744Df2673097d738aCaa3E463E6D638867757f2) is deployed
const SUPPORTED_CHAIN_IDS = new Set([1, 8453, 42161, 747474]);
// ysyBOLD (Staked yBOLD, 0x23346B04…) is the Yearn V3 vault used as Frankencoin (ZCHF)
// collateral. The Frankencoin partner has no static depositor list: the tracked
// depositors are the Frankencoin V2 collateral positions, resolved dynamically below.
const YSYBOLD_VAULT = "0x23346B04a7f55b8760E5860AA5A77383D63491cD";
const FRANKENCOIN_PARTNER = "frankencoin";

type TReferralDeposit = {
	id: string;
	receiver: string;
	referrer: string;
	vault: string;
};

type TPartnerVaultConfig = {
	[chainId: number]: {
		[vaultAddress: string]: string[];
	};
};

type TResponseBody = TPartnerVaultConfig | { error: string };

// Envio multi-chain event IDs are formatted as "{chainId}_{blockNumber}_{logIndex}"
function parseChainIdFromEventId(eventId: string): number | null {
	const parts = eventId.split("_");
	if (parts.length < 3) {
		return null;
	}
	const chainId = parseInt(parts[0], 10);
	if (!Number.isFinite(chainId) || !SUPPORTED_CHAIN_IDS.has(chainId)) {
		return null;
	}
	return chainId;
}

async function queryEnvioGraphQL<T>(
	query: string,
	variables: Record<string, unknown>,
): Promise<T> {
	const envioUrl = process.env.ENVIO_GRAPHQL_URL;

	if (!envioUrl) {
		throw new Error("ENVIO_GRAPHQL_URL must be configured");
	}

	const payload = JSON.stringify({ query, variables });

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (process.env.ENVIO_PASSWORD) {
		headers["Authorization"] = `Bearer ${process.env.ENVIO_PASSWORD}`;
	}

	const response = await fetch(envioUrl, {
		method: "POST",
		headers,
		body: payload,
	});

	if (!response.ok) {
		throw new Error(
			`GraphQL query failed: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as { data?: T; errors?: unknown };
	if (data.errors) {
		throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
	}
	return data.data as T;
}

async function getReferralDeposits(
	referrerAddress: string,
): Promise<TReferralDeposit[]> {
	const query = `
		query GetReferralDeposits($referrerAddress: String!) {
			ReferralDeposit(
				where: {
					referrer: { _ilike: $referrerAddress }
				}
				order_by: { id: asc }
			) {
				id
				receiver
				referrer
				vault
			}
		}
	`;

	const result = await queryEnvioGraphQL<{
		ReferralDeposit: TReferralDeposit[];
	}>(query, {
		referrerAddress: referrerAddress.toLowerCase(),
	});

	return result?.ReferralDeposit || [];
}
type TFrankencoinPositionAccount = {
	address: string;
	chainId: number;
};

// Resolve the Frankencoin V2 positions that hold ysyBOLD as ZCHF collateral.
//
// The Envio indexer (yearn-indexing-test, PRs #36/#37) flags every such position via
// FrankencoinMintingHubV2.PositionOpened and maintains a per-account ysyBOLD ledger
// (FrankencoinYsyBoldAccount, isPosition=true). Each flagged account's `address` is a
// collateral position contract; its ysyBOLD balance (driven by Transfer events) is what
// /api/partner-tvl and /api/partner-fees track. We return the same {chain → vault →
// depositors} shape as the referral resolver so the dashboard's merge machinery in
// usePartner consumes it unchanged. This is ground truth and needs no RPC.
async function getFrankencoinCollateralConfig(): Promise<TPartnerVaultConfig> {
	const query = `
		query GetFrankencoinYsyBoldPositions {
			FrankencoinYsyBoldAccount(
				where: { isPosition: { _eq: true } }
				limit: 1000
			) {
				address
				chainId
			}
		}
	`;

	const result = await queryEnvioGraphQL<{
		FrankencoinYsyBoldAccount: TFrankencoinPositionAccount[];
	}>(query, {});

	const config: TPartnerVaultConfig = {};
	const vault = toAddress(YSYBOLD_VAULT);
	for (const account of result?.FrankencoinYsyBoldAccount || []) {
		if (!config[account.chainId]) {
			config[account.chainId] = {};
		}
		if (!config[account.chainId][vault]) {
			config[account.chainId][vault] = [];
		}
		const position = toAddress(account.address);
		if (!config[account.chainId][vault].includes(position)) {
			config[account.chainId][vault].push(position);
		}
	}

	return config;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<TResponseBody>,
): Promise<void> {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

	const referrerParam = req.query.referrer;

	if (!referrerParam) {
		res.status(400).json({ error: "referrer parameter is required" });
		return;
	}

	const referrerAddress = toAddress(
		Array.isArray(referrerParam) ? referrerParam[0] : referrerParam,
	);

	const hasEnvioConfig = Boolean(process.env.ENVIO_GRAPHQL_URL);
	if (!hasEnvioConfig) {
		console.warn(
			"[partner-referrals] ENVIO_GRAPHQL_URL not configured, returning empty config",
		);
		res.status(200).json({});
		return;
	}

	try {
		const partnerShortName = SHAREABLE_ADDRESSES[referrerAddress]?.shortName;
		if (partnerShortName === FRANKENCOIN_PARTNER) {
			const collateralConfig = await getFrankencoinCollateralConfig();
			res.status(200).json(collateralConfig);
			return;
		}
		const deposits = await getReferralDeposits(referrerAddress);

		// Build the vault config structure grouped by chain.
		// Chain ID is parsed from the envio event ID (format: "{chainId}_{blockNumber}_{logIndex}").
		const config: TPartnerVaultConfig = {};

		for (const deposit of deposits) {
			const chainId = parseChainIdFromEventId(deposit.id);
			if (chainId === null) {
				continue;
			}

			const vault = toAddress(deposit.vault);
			const receiver = toAddress(deposit.receiver);

			if (!config[chainId]) {
				config[chainId] = {};
			}

			if (!config[chainId][vault]) {
				config[chainId][vault] = [];
			}

			if (!config[chainId][vault].includes(receiver)) {
				config[chainId][vault].push(receiver);
			}
		}

		res.status(200).json(config);
	} catch (error) {
		console.error(
			"[partner-referrals] Failed to fetch referral deposits",
			error,
		);
		res.status(500).json({ error: "Failed to fetch referral deposits" });
	}
}
