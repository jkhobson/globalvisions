# Notes for Claude

- Phone first. Test at 390px wide in dark mode and at tablet width, with no console errors and no sideways scrolling.
- No build step. Engines are pure functions (js/engine.js); content is data (js/content/). Run `npm test` before every PR.
- Tag every item with a block, and every block with real Stage 8 codes from js/content/curriculum.js.
- Content rules: the right option is listed first in the data and must not usually be the longest (a test checks this).
  The app places it on screen with dealSlots, so right answers are spread evenly (A, B, C, D) and never 3 in a row. Never use plain random shuffle for this;
  every item has a simple and a standard stem, a thinking hint and an explanation; every source has short and long text.
- Language help never costs XP. Reflection is never marked wrong.
- All places, people and companies in missions are fictional. Original content only.
- Never put student names, rosters or secret keys in this repo. Only a Supabase publishable key may go in js/config.js.
- XP must be computed on the server once there is a server. Expect students to try to game it.
- Work on a branch and open a PR; the teacher (J K) merges.
