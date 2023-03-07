# Yearn B2B Partners Dashboard

Have you ever found yourself thinking:

> “Wow! Yearn’s yield generating vaults are a work of DeFi art. I WISH I could integrate them into what we’re building.”

Well friend, you’ve come to the right place!

- Check [Yearn B2B Parners Dashboard](https://b2b-dashboard.yearn.farm)

<img width="400" alt="Screenshot 2023-03-07 at 10 36 52 AM" src="https://user-images.githubusercontent.com/7863230/223503425-6de7c859-a497-4cc2-a76c-9f657a37fe85.png">

## Development Instructions

### Install and run

1. Clone as template from GitHub
2. Run `yarn`
3. Run `yarn run dev`
4. Open the browser and navigate to `http://localhost:3000`

### Stack

The stack used for this project is the following:
- 💙 [Yearn Web Lib](https://github.com/yearn/web-lib) — Base for our web-lib
- 🚀 [Next](https://nextjs.org) — JavaScript library for user interfaces
- ▲ [Vercel](https://vercel.com) — Cloud deployment platform
- 📄 [TypeScript](https://www.typescriptlang.org/) for static type checking
- 💄 [ESLint](https://eslint.org/) for code linting

### Tags

You can change the meta tags in the `next.config.js` file:

- Update `WEBSITE_URI` with the base path of your project. This will be used for link sharing and OG image.
- Update `WEBSITE_NAME` and `WEBSITE_TITLE` with your project name
- Update `WEBSITE_DESCRIPTION` with your project description
- Update `PROJECT_GITHUB_URL` with your project GitHub link

Then, you can go in `pages/_app.tsx` and update some more info: 

- Update the content of the meta `theme-color` with your primary color
- Update `og.jpeg` by the OG image name in the `public` folder
- Update twitter handle if required

Then, you can update the `public/manifest.json` file which will be use for the Gnosis wallet support:

- Update `name` with your project name
- Update `description` with your project description
- Update `iconPath` with the relative path to your SVG icon (ideally, it should stay as is)
