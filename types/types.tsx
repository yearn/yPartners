import type	{ReactElement}	from	'react';
import type {TAddress} from '@yearn-finance/web-lib/utils/address';

export type TPartnerVault = {
	address: string,
	balance: number
	bucket: string
	token: string
	tvl: number
	network: string
	riskScore: number,
	apy: number
};

type TPartnerVaultByAddress = {
	[address: string]: TPartnerVault
}

export type TPartnerVaultsByNetwork = {
	[network: string]: TPartnerVaultByAddress
}

export type TPartnerList = {
	name: string;
	description: string;
	logo: ReactElement;
}

export type TYearnVaultStrategy = {
	address: TAddress,
	name: string,
	description: string,
	details: {
		keeper: TAddress,
		strategist: TAddress,
		rewards: TAddress,
		healthCheck: TAddress,
		totalDebt: string,
		totalLoss: string,
		totalGain: string,
		minDebtPerHarvest: string,
		maxDebtPerHarvest: string,
		estimatedTotalAssets: string,
		creditAvailable: string,
		debtOutstanding: string,
		expectedReturn: string,
		delegatedAssets: string,
		delegatedValue: string,
		protocols: string[],
		version: string,
		apr: number,
		performanceFee: number,
		lastReport: number,
		activation: number,
		keepCRV: number,
		debtRatio: number,
		debtLimit: number,
		withdrawalQueuePosition: number,
		doHealthCheck: boolean,
		inQueue: boolean,
		emergencyExit: boolean,
		isActive: boolean,
	}
	risk: {
		riskGroup: string,
		riskDetails: {
			TVLImpact: number,
			auditScore: number,
			codeReviewScore: number,
			complexityScore: number,
			longevityImpact: number,
			protocolSafetyScore: number,
			teamKnowledgeScore: number,
			testingScore: number,
		}
	}
}

export type TYearnVault = {
	inception: number,
	address: TAddress,
	symbol: string,
	display_symbol: string,
	formated_symbol: string,
	name: string,
	display_name: string,
	formated_name: string,
	icon: string,
	category: string,
	riskScore: number,
	token: {
		address: TAddress,
		name: string,
		display_name: string,
		symbol: string,
		description: string,
		decimals: number,
		icon: string,
	},
	tvl: {
		total_assets: string,
		tvl: number,
		price: number
	},
	apy: {
		type: string,
		gross_apr: number,
		net_apy: number,
		fees: {
			performance: number,
			withdrawal: number,
			management: number,
			keep_crv: number,
			cvx_keep_crv: number
		},
		points: {
			week_ago: number,
			month_ago: number,
			inception: number,
		},
		composite: {
			boost: number,
			pool_apy: number,
			boosted_apr: number,
			base_apr: number,
			cvx_apr: number,
			rewards_apr: number
		}
	},
	strategies: TYearnVaultStrategy[],
	details: {
		management: TAddress,
		governance: TAddress,
		guardian: TAddress,
		rewards: TAddress,
		depositLimit: string,
		comment: string,
		apyTypeOverride: string,
		apyOverride: number,
		performanceFee: number,
		managementFee: number,
		depositsDisabled: boolean,
		withdrawalsDisabled: boolean,
		allowZapIn: boolean,
		allowZapOut: boolean,
		retired: boolean
	},
	endorsed: boolean,
	version: string,
	decimals: number,
	type: string,
	emergency_shutdown: boolean,
	updated: number,
	migration: {
		available: boolean,
		address: TAddress,
		contract: TAddress,
	}
}

export type TFramerTransition = {
	y: number,
	opacity: number,
	transition: {
		delay: number,
		duration: number,
		ease: string
	}
}
