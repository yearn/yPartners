import {PARTNERS} from 'utils/Partners';

/** Share of accrued vault fees earned by a partner without a custom split. */
export const DEFAULT_PARTNER_FEE_SHARE = 0.5;

/** Partner's share of accrued fees; the remainder goes to Yearn. */
export function getPartnerFeeShare(shortName?: string): number {
	if (!shortName) {
		return DEFAULT_PARTNER_FEE_SHARE;
	}
	const feeShare = PARTNERS[shortName]?.feeShare;
	return (
		typeof feeShare === 'number' &&
		Number.isFinite(feeShare) &&
		feeShare > 0 &&
		feeShare < 1
	) ? feeShare : DEFAULT_PARTNER_FEE_SHARE;
}
