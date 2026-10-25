import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const SHELL_FILES = ['src/lib/components/GameShell.svelte', 'src/lib/components/SoundToggle.svelte'];

const SCAN_DIRS = [
  { dir: 'src/lib/penguin-code', extensions: ['.svelte', '.js'] },
  { dir: 'src/routes/games/penguin-code', extensions: ['.svelte'] },
];

const EMOJI_SOURCE = String.raw`\p{Extended_Pictographic}|[\uFE0E\uFE0F\u200D\u20E3]`;

function emojiPattern() {
  return new RegExp(EMOJI_SOURCE, 'gu');
}

function walk(directory, extensions) {
  const found = [];
  if (!fs.existsSync(directory)) return found;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(entryPath, extensions));
    } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      found.push(entryPath);
    }
  }
  return found;
}

function scannedFiles() {
  const files = SCAN_DIRS.flatMap(({ dir, extensions }) => walk(path.join(ROOT, dir), extensions));
  files.push(...SHELL_FILES.map((file) => path.join(ROOT, file)));
  return [...new Set(files)].sort((a, b) => a.localeCompare(b));
}

function describeCodePoints(text) {
  return [...text]
    .map((char) => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ');
}

function findEmojiLines(source) {
  const hits = [];
  source.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(emojiPattern())) {
      hits.push({ line: index + 1, codePoints: describeCodePoints(match[0]) });
    }
  });
  return hits;
}

const SCANNED_FILES = scannedFiles();

describe('penguin code emoji guard', () => {
  it('scans the Penguin Code sources and the shared shell files', () => {
    for (const { dir } of SCAN_DIRS) {
      expect(fs.existsSync(path.join(ROOT, dir)), `missing scan directory: ${dir}`).toBe(true);
    }
    for (const file of SHELL_FILES) {
      expect(SCANNED_FILES, `missing shared shell file: ${file}`).toContain(path.join(ROOT, file));
    }
    expect(SCANNED_FILES.length).toBeGreaterThanOrEqual(8);
  });

  it('keeps emoji out of every scanned file', () => {
    for (const file of SCANNED_FILES) {
      const relative = path.relative(ROOT, file);
      const hits = findEmojiLines(fs.readFileSync(file, 'utf8'));
      const detail = hits.map((hit) => `${relative}:${hit.line} ${hit.codePoints}`);
      expect(detail, `emoji found in ${relative} - use inline SVG or CSS shapes instead`).toEqual([]);
    }
  });

  it('detects emoji code points with 1-based line numbers', () => {
    expect(findEmojiLines('const fish = "\u{1F41F}";')).toEqual([{ line: 1, codePoints: 'U+1F41F' }]);
    expect(findEmojiLines('first line\nsecond line \u{1F41F}')).toEqual([{ line: 2, codePoints: 'U+1F41F' }]);
    expect(findEmojiLines('icon\uFE0F join\u200D key\u20E3 side\uFE0E')).toEqual([
      { line: 1, codePoints: 'U+FE0F' },
      { line: 1, codePoints: 'U+200D' },
      { line: 1, codePoints: 'U+20E3' },
      { line: 1, codePoints: 'U+FE0E' },
    ]);
  });

  it('allows plain text symbols such as stars and arrows', () => {
    expect(findEmojiLines('stars ★ and arrows ← ↑ ↓ →')).toEqual([]);
    expect(findEmojiLines('level <svg class="icon" aria-hidden="true"></svg>')).toEqual([]);
  });
});
