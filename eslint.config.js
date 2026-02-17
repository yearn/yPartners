const js = require('@eslint/js');
const {FlatCompat} = require('@eslint/eslintrc');

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

module.exports = [
	{
		ignores: ['yearn.fi/**', '.next/**', 'node_modules/**']
	},
	...compat.config({
		extends: ['next/core-web-vitals', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
		parser: '@typescript-eslint/parser',
		parserOptions: {
			ecmaFeatures: {
				jsx: true
			},
			tsconfigRootDir: __dirname,
			ecmaVersion: 2022,
			sourceType: 'module',
			project: ['./tsconfig.json']
		},
		rules: {
			'@typescript-eslint/prefer-optional-chain': 'error',
			'no-multi-spaces': ['error', {ignoreEOLComments: false}],
			'no-mixed-spaces-and-tabs': 'error'
		}
	})
];
