import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Bundled third-party code whose license must ship with the build.
const LICENSES = [
  ['three.js r128 (MIT)', 'node_modules/three/LICENSE'],
  ['Bowlby One font (SIL OFL 1.1)', 'node_modules/@fontsource/bowlby-one/LICENSE'],
  ['Barlow Semi Condensed font (SIL OFL 1.1)', 'node_modules/@fontsource/barlow-semi-condensed/LICENSE'],
];
const thirdPartyLicenses = () => ({
  name: 'third-party-licenses',
  generateBundle() {
    const source = LICENSES.map(([name, file]) => `== ${name} ==\n\n${readFileSync(file, 'utf8').trim()}\n`).join('\n\n');
    this.emitFile({ type: 'asset', fileName: 'THIRD_PARTY_LICENSES.txt', source });
  },
});

// Production build is one self-contained index.html (JS, CSS, fonts inlined) so it runs from
// file:// and drops straight into an itch.io zip.
export default defineConfig({
  base: './',
  build: { outDir: 'dist/web', emptyOutDir: true },
  plugins: [viteSingleFile(), thirdPartyLicenses()],
});
