# Architecture of Co-Intelligence
Editable Astro portfolio. The site content lives in src/ and the published media in public/.
Use Node 24 and the pnpm version in package.json. Run pnpm install --frozen-lockfile, then pnpm dev for a local preview or pnpm build to produce dist/.

## Publish updates to the existing Cloudflare Worker
Before connecting GitHub, set name in wrangler.json to the exact existing Worker name shown in Cloudflare. Keep assets.directory set to ./dist.
In the existing Worker, open Settings > Build and connect this repository. Use main for production, the repository root for the project directory, pnpm build for the build command, and npx wrangler deploy for the deploy command.
After a successful production build, commits to main update the same public site.
