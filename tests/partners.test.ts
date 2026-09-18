import {describe, expect, it} from 'vitest';

import {PARTNERS} from '../utils/Partners';

describe('partner config invariants', (): void => {
	// getPartnerFeeShare and the client context index PARTNERS by shortName.
	// A key that drifts from its shortName would silently fall back to the
	// default 50/50 split, so lock the two together.
	it('uses the shortName as every partner dict key', (): void => {
		for (const [key, partner] of Object.entries(PARTNERS)) {
			expect(partner.shortName, `partner key "${key}"`).toBe(key);
		}
	});

	it('configures fee shares strictly between 0 and 1', (): void => {
		for (const [key, partner] of Object.entries(PARTNERS)) {
			if (partner.feeShare !== undefined) {
				expect(partner.feeShare, `partner "${key}" feeShare`).toBeGreaterThan(0);
				expect(partner.feeShare, `partner "${key}" feeShare`).toBeLessThan(1);
			}
		}
	});
});
