module.exports = ({
	images: {
		remotePatterns: [{
			protocol: 'https',
			hostname: 'rawcdn.githack.com'
		}, {
			protocol: 'https',
			hostname: 'token-assets-one.vercel.app'
		}]
	},
	env: {
		/* 🔵 - Yearn Finance **************************************************
		** Stuff used for the SEO or some related elements, like the title, the
		** github url etc.
		**********************************************************************/
		PROJECT_GITHUB_URL: 'https://github.com/yearn/yearn-template',

		/* 🔵 - Yearn Finance **************************************************
		** Some config used to control the behaviour of the web library. By
		** default, all of theses are set to false.
		** USE_WALLET: should we allow the user to connect a wallet via
		**             metamask or wallet connect?
		** USE_PRICES: should we fetch the prices for a list of tokens? If true
		**             the CG_IDS array should be populated with the tokens
		**             to fetch.
		** USE_PRICE_TRI_CRYPTO: should we fetch the special Tri Crypto token
		** 			   price? (require blockchain call)
		** USE_NETWORKS: indicate if the app should be able to change networks
		**********************************************************************/
		USE_WALLET: 'true',
		USE_PRICES: 'false',
		USE_PRICE_TRI_CRYPTO: 'false',
		USE_NETWORKS: 'false',
		CG_IDS: '[]',
		TOKENS: '[]',

		/* 🔵 - Yearn Finance **************************************************
		** Config over the RPC
		**********************************************************************/
		JSON_RPC_URL: JSON.stringify({
			1: process.env.RPC_URL_MAINNET
		}),
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
		YVISION_BASE_URI: 'https://api.yearn.vision'
	}
});
