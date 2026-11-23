// Ember Court — the entry program (Node 22, standard library only).
//
// It hands the game in: copies the static game/ folder and the screenshots/
// beside this file into the output directory, then writes dossier.json there
// with the vendored make.fun library, so the judge can read the game.
// The grader runs this program twice in a fresh container and both runs must
// write the same bytes, so every step here is a plain deterministic copy.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the folder this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
// The grader hands us /output; locally the environment variable stands in.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

// The whole game, plain static files, goes over as it is.
mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });

// The screenshots go beside it. The folder is part of the entry, so it is
// always there; the existence check only keeps a stale output folder honest.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier is the judge's view of the entry: the game's source text and
// the screenshots, as the library writes them. The caps below are the
// scorer's own (see the competition's RULES.txt): the text cap shapes the
// bytes, the rest refuse an entry the scorer would refuse.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
