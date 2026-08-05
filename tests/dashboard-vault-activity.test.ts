import {describe, expect, it} from 'vitest';

import {hasVaultActivity} from '../components/dashboard/DashboardTabsWrapper';

describe('dashboard vault dropdown activity', (): void => {
	it('keeps zero-only partners out of the vault selector', (): void => {
		expect(hasVaultActivity(0, 0, [
			{currentSharesNormalized: 0, totalFeesNormalized: 0}
		])).toBe(false);
	});

	it('shows the selector when a partner has TVL, shares, or fees', (): void => {
		expect(hasVaultActivity(1, 0, [])).toBe(true);
		expect(hasVaultActivity(0, 1, [])).toBe(true);
		expect(hasVaultActivity(0, 0, [
			{currentSharesNormalized: 1, totalFeesNormalized: 0}
		])).toBe(true);
	});
});
