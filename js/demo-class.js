// A made-up class for demo mode, so the leaderboards and the teacher page have something to show.
// Seeded, so the same "students" appear every time. None of these are real people.
import { BLOCKS, TRAPS } from "./content/curriculum.js";

const NICKS = ["BlueHeron", "MangoComet", "QuietThunder", "LotusRider", "PixelPanda", "NovaKite", "RiverFox",
  "SaltySun", "JadeOtter", "EchoMoth", "LimeRocket", "CloudGecko", "IronLychee", "StarAnchor"];
const AVATARS = ["🦊", "🐼", "🐢", "🦉", "🐬", "🦋", "🐯", "🦜", "🐙", "🦔", "🐳", "🦎", "🐝", "🦩"];

function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function demoClass() {
  const r = rng(42), blocks = Object.keys(BLOCKS), traps = Object.keys(TRAPS);
  return NICKS.map((nick, i) => {
    const p = Object.fromEntries(blocks.map(b => [b, Math.min(0.97, 0.2 + r() * 0.8)]));
    const trapCount = traps.filter(() => r() < 0.35).map(t => [t, 1 + Math.floor(r() * 5)]).sort((a, b) => b[1] - a[1]);
    return { nick, avatar: AVATARS[i], weekXP: Math.round(40 + r() * 400), allXP: Math.round(300 + r() * 2200),
      climbed: Math.floor(r() * 4), support: Math.floor(r() * 4), p, traps: trapCount, demo: true };
  });
}
