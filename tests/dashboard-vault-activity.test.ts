import {describe, expect, it} from 'vitest';

import {shouldRenderVaultDropdown} from '../components/dashboard/DashboardTabsWrapper';


describe('dashboard vault dropdown visibility', (): void => {
	it('keeps the selector available when vault choices have no activity', (): void => {
		expect(shouldRenderVaultDropdown(2)).toBe(true);
	});

	it('does not render a selector without any vault choices', (): void => {
		expect(shouldRenderVaultDropdown(0)).toBe(false);
	});
});
