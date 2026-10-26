import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const CONFIG = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8');

describe('PWA build config', () => {
  it('lets the SPA fallback revision change with each build', () => {
    // A constant fallback revision makes Workbox keep the first precached
    // HTML forever, so old documents request hashed chunks that no longer
    // exist after a deploy.
    expect(CONFIG).not.toMatch(/fallbackRevision\s*:/);
  });

  it('does not cache navigations in a runtime HTML cache', () => {
    expect(CONFIG).not.toMatch(/handler:\s*'NetworkFirst'/);
    expect(CONFIG).not.toMatch(/cacheName:\s*'frost-pages'/);
  });

  it('serves the precached shell only as an offline fallback', () => {
    expect(CONFIG).toMatch(/handler:\s*'NetworkOnly'/);
    expect(CONFIG).toMatch(/precacheFallback:\s*\{\s*fallbackURL:\s*'\/'\s*\}/);
  });
});
