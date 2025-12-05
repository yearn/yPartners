/* eslint-disable @typescript-eslint/no-var-requires */
const {join} = require('path');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	content: [
		join(__dirname, 'pages', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'components', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'contexts', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'hooks', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'utils', '**', '*.{js,jsx,ts,tsx}'),
		join(__dirname, 'lib', 'yearn', '**', '*.{js,jsx,ts,tsx}')
	],
	theme: {
		extend: {
			colors: {
				neutral: {
					0: '#FFFFFF',
					100: '#F5F5F5',
					200: '#EBEBEB',
					300: '#E0E0E0',
					400: '#9E9E9E',
					500: '#7F7F7F',
					600: '#5C5C5C',
					700: '#424242',
					800: '#292929',
					900: '#0D0D0D'
				},
				accent: {
					500: '#2663FF',
					600: '#0F46D8'
				},
				primary: {
					100: '#E3ECFF',
					200: '#C2D6FF',
					500: '#2663FF',
					600: '#0F46D8'
				},
				red: {
					200: '#FFE5E5',
					300: '#FFD6D6',
					900: '#FF1F1F'
				},
				pink: {
					200: '#FBD6EA',
					300: '#F6CCE3',
					900: '#D72C91'
				},
				yellow: {
					200: '#FFE4B8',
					300: '#FFEED1',
					900: '#FF7A00'
				}
			},
			fontFamily: {
				aeonik: ['Aeonik', ...defaultTheme.fontFamily.sans],
				mono: ['Aeonik Mono', ...defaultTheme.fontFamily.mono]
			},
			height: {
				inherit: 'inherit'
			},
			fontSize: {
				'3xl': ['32px', '40px'],
				'8xl': ['88px', '104px']
			},
			spacing: {
				50: '12.5rem',
				66: '16.5rem'
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
