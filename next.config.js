module.exports = ({
	images: {
		/* 🔵 - Yearn Finance **************************************************
		** The partner logos on the homepage are first-party SVGs (generated
		** from scripts/make-logos-dark.py), so we allow next/image to serve
		** them. The CSP disables scripts/sandbox to keep things safe.
		**********************************************************************/
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: 'default-src \'self\'; script-src \'none\'; sandbox;',
		remotePatterns: [{
			protocol: 'https',
			hostname: 'rawcdn.githack.com'
		}, {
			protocol: 'https',
			hostname: 'token-assets-one.vercel.app'
		}]
	},
	env: {
		// Turnstile site keys are intentionally public; the matching secret is
		// consumed only by the contact-form API route at runtime.
		CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.CLOUDFLARE_TURNSTILE_SITE_KEY
	}
});
