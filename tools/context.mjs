import { readFileSync } from 'node:fs';
const args = process.argv.slice(2);
const map = {
  game: 'src/game.js',
  campaign: 'src/campaign.js',
  audio: 'src/audio.js',
  bosses: 'src/bosses.js',
  combat: 'src/combat.js',
  equipment: 'src/equipment.js',
  finale: 'src/finale.js',
  graphics: 'src/visuals.js',
  flight: 'src/flight.js',
  encounters: 'src/encounters.js',
  interface: 'src/shell.html',
  styles: 'src/styles.css',
  tests: 'tests/game.test.mjs',
  harness: 'docs/HARNESS.md',
};
if (!args.length || args[0] === '--mapa') {
  console.log(JSON.stringify(map, null, 2));
  console.log('Read AGENTS.md first. Usage: npm run agent:context -- game fire');
} else {
  const file = map[args[0]];
  if (!file) throw new Error('Unknown area; use --mapa');
  const lines = readFileSync(file, 'utf8').split('\n');
  const term = args[1];
  if (!term)
    console.log(
      lines
        .slice(0, 90)
        .map((l, i) => `${i + 1}: ${l}`)
        .join('\n'),
    );
  else {
    const i = lines.findIndex((l) => l.includes(term));
    if (i < 0) throw new Error('Term not found');
    console.log(
      lines
        .slice(Math.max(0, i - 3), i + 77)
        .map((l, j) => `${Math.max(0, i - 3) + j + 1}: ${l}`)
        .join('\n'),
    );
  }
}
