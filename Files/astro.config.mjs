import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  vite: {
    // This small static site uses native ESM; skip Astro's optional dev-tool
    // prebundles so builds also work in restricted Windows workspaces.
    plugins: [{ name: 'aoi-native-esm', configResolved(config) {
      config.optimizeDeps.noDiscovery = true;
      config.optimizeDeps.include = [];
    } }],
  },
});
