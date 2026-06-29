const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');

module.exports = [
	{
		ignores: ['yearn.fi/**', '.next/**', 'node_modules/**', 'internal-docs/**']
	},
	...nextCoreWebVitals,
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname
			}
		},
		rules: {
			'@typescript-eslint/prefer-optional-chain': 'error'
		}
	},
	{
		rules: {
			'no-multi-spaces': ['error', {ignoreEOLComments: false}],
			'no-mixed-spaces-and-tabs': 'error'
		}
	},
	{
		// Config files legitimately use CommonJS require()
		files: ['*.config.js', '*.config.mjs', '*.config.cjs', '*.config.ts'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	}
];
