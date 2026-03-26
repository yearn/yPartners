import type {NextApiRequest, NextApiResponse} from 'next';
import {toAddress} from 'lib/yearn/utils/address';

// Chains where YearnReferralWrapper (0x3744Df2673097d738aCaa3E463E6D638867757f2) is deployed
const SUPPORTED_CHAIN_IDS = new Set([1, 8453, 42161, 747474]);

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

type TResponseBody = TPartnerVaultConfig | {error: string};

// Envio multi-chain event IDs are formatted as "{chainId}_{blockNumber}_{logIndex}"
function parseChainIdFromEventId(eventId: string): number | null {
	const parts = eventId.split('_');
	if (parts.length < 3) {
		return null;
	}
	const chainId = parseInt(parts[0], 10);
	if (!Number.isFinite(chainId) || !SUPPORTED_CHAIN_IDS.has(chainId)) {
		return null;
	}
	return chainId;
}

async function queryEnvioGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
	const envioUrl = process.env.ENVIO_GRAPHQL_URL;

	if (!envioUrl) {
		throw new Error('ENVIO_GRAPHQL_URL must be configured');
	}

	const payload = JSON.stringify({query, variables});

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (process.env.ENVIO_PASSWORD) {
		headers['Authorization'] = `Bearer ${process.env.ENVIO_PASSWORD}`;
	}

	const response = await fetch(envioUrl, {
		method: 'POST',
		headers,
		body: payload
	});

	if (!response.ok) {
		throw new Error(`GraphQL query failed: ${response.status} ${response.statusText}`);
	}

	const data = await response.json() as {data?: T, errors?: unknown};
	if (data.errors) {
		throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
	}
	return data.data as T;
}

async function getReferralDeposits(referrerAddress: string): Promise<TReferralDeposit[]> {
	const query = `
		query GetReferralDeposits($referrerAddress: String!) {
			ReferralDeposit(
				where: {
					referrer: { _eq: $referrerAddress }
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

	const result = await queryEnvioGraphQL<{ReferralDeposit: TReferralDeposit[]}>(query, {
		referrerAddress: referrerAddress.toLowerCase()
	});

	return result?.ReferralDeposit || [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TResponseBody>): Promise<void> {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		res.status(405).json({error: 'Method not allowed'});
		return;
	}

	res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

	const referrerParam = req.query.referrer;

	if (!referrerParam) {
		res.status(400).json({error: 'referrer parameter is required'});
		return;
	}

	const referrerAddress = toAddress(Array.isArray(referrerParam) ? referrerParam[0] : referrerParam);

	const hasEnvioConfig = Boolean(process.env.ENVIO_GRAPHQL_URL);
	if (!hasEnvioConfig) {
		console.warn('[partner-referrals] ENVIO_GRAPHQL_URL not configured, returning empty config');
		res.status(200).json({});
		return;
	}

	try {
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
		console.error('[partner-referrals] Failed to fetch referral deposits', error);
		res.status(500).json({error: 'Failed to fetch referral deposits'});
	}
}
