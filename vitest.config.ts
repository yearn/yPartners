import {defineConfig} from 'vitest/config';

// Integration tests that hit the live Envio GraphQL endpoint and chain RPCs.
// They are network-bound, so timeouts are generous.
export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		testTimeout: 30_000,
		hookTimeout: 30_000
	}
});
