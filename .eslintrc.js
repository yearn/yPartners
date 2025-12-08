module.exports = {
	extends: ['next/core-web-vitals', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	ignorePatterns: ['yearn.fi/**'],
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
};
