import type {NextApiRequest, NextApiResponse} from 'next';
import {toAddress} from 'lib/yearn/utils/address';

type TReferralDeposit = {
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

async function queryEnvioGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
	const envioUrl = process.env.ENVIO_GRAPHQL_URL;

	if (!envioUrl) {
		throw new Error('ENVIO_GRAPHQL_URL must be configured');
	}

	const payload = JSON.stringify({query, variables});

	const response = await fetch(envioUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
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
	const chainIdParam = req.query.chainId;

	if (!referrerParam) {
		res.status(400).json({error: 'referrer parameter is required'});
		return;
	}

	const referrerAddress = toAddress(Array.isArray(referrerParam) ? referrerParam[0] : referrerParam);
	const parsedChainId = chainIdParam ? parseInt(Array.isArray(chainIdParam) ? chainIdParam[0] : chainIdParam, 10) : NaN;
	const chainId = Number.isFinite(parsedChainId) ? parsedChainId : 1;

	const hasEnvioConfig = Boolean(process.env.ENVIO_GRAPHQL_URL);
	if (!hasEnvioConfig) {
		console.warn('[partner-referrals] ENVIO_GRAPHQL_URL not configured, returning empty config');
		res.status(200).json({});
		return;
	}

	try {
		const deposits = await getReferralDeposits(referrerAddress);

		// Build the vault config structure
		// Since envio doesn't include chain_id in the response, we assume all results are from the requested chain
		const config: TPartnerVaultConfig = {};

		for (const deposit of deposits) {
			const vault = toAddress(deposit.vault);
			const receiver = toAddress(deposit.receiver);

			if (!config[chainId]) {
				config[chainId] = {};
			}

			if (!config[chainId][vault]) {
				config[chainId][vault] = [];
			}

			// Add receiver if not already in the list
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
