const {join} = require('path');
const defaultTheme = require('tailwindcss/defaultTheme');


module.exports = {
	presets: [require('@yearn-finance/web-lib/tailwind.config.cjs')],
	content: [
		join(__dirname, 'pages', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'components', 'icons', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'components', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'utils', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'node_modules', '@yearn-finance', 'web-lib', 'layouts', '**', '*.js'),
		join(__dirname, 'node_modules', '@yearn-finance', 'web-lib', 'components', '**', '*.js'),
		join(__dirname, 'node_modules', '@yearn-finance', 'web-lib', 'contexts', '**', '*.js'),
		join(__dirname, 'node_modules', '@yearn-finance', 'web-lib', 'icons', '**', '*.js'),
		join(__dirname, 'node_modules', '@yearn-finance', 'web-lib', 'utils', '**', '*.js')
	],
	theme: {
		extend: {
			fontFamily: {
				aeonik: ['Aeonik', ...defaultTheme.fontFamily.sans],
				mono: ['Aeonik Mono', ...defaultTheme.fontFamily.mono]
			},
			height: {
				'inherit': 'inherit'
			},
			fontSize: {
				'3xl': ['32px', '40px'],
				'8xl': ['88px', '104px']
			},
			spacing: {
				'50': '12.5rem',
				'66': '16.5rem'
			},
			width: {
				'5xl': '1120px'
			},
			maxWidth: {
				'5xl': '1120px'
			}
		}
	},
	plugins: []
};
