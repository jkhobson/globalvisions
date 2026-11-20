# Perspecta

A phone-first practice app for Cambridge Lower Secondary Global Perspectives, starting with Grade 7 (Stage 8).
Students are field agents on a made-up island chain. Each island is one Grade 7 challenge. They train the six GP
skills through missions, a Think Gym and games, earning XP, ranks and passport stamps.

**Status: live in demo mode.** With no server settings, everything is stored in the browser, with a made-up class. The school version (Google sign-in with school emails, class codes, XP worked out on the server, real class leaderboards and teacher view) is built and switches on when `js/config.js` gets the Supabase settings. See docs/setup-school-login.md.

## Try it

Open `index.html` through any static web server (for example `python3 -m http.server`), or turn on GitHub Pages
for this repo. Open `teacher.html` for the teacher view (there is also a link on the sign-in page and the Me page). To switch on school Google sign-in and class codes, follow docs/setup-school-login.md.

## What is in this prototype

- **Harvest Key (C2, Beliefs about food): "The Fizz Files" mission**: Briefing (research question), Field Dossier
  (6 sources, some unreliable on purpose), Evidence Board (strength of evidence, judging arguments), Debrief (reflection, never marked wrong).
- **Evaluation strand** E1 to E5, tagged to 78E.01 and 78E.02, plus R2 (78Rs.01) and F2 (78Rf.03).
- **Two dials**: a GP skill level per block, and a separate English support level (Full, Guided, Light, Open).
  Same thinking task at every level; only the wrapping changes. Language help never costs XP.
  At Light and Open, a wrong answer first gets "Say it simpler"; right after that counts as a language barrier, not a thinking miss.
- **Thinking traps** on every wrong option, a trap tracker, and adaptive Think Gym practice.
- **Trust or Bust** game, leaderboards (nicknames only, weekly reset, growth board, class goal), Agent ID, passport.
- **Phone first**: bottom tab bar (Map, Gym, Game, Ranks, Me), feedback and Next button scroll into view,
  Normal/Large text switch, a short how-to-play card on first visit, and it can be added to the home screen like an app.
- **Teacher view**: both dials side by side, block heat map, top trap per student, island and leaderboard switches.

## How it is built

Plain HTML, CSS and JavaScript modules. No build step.

```
index.html, teacher.html
js/app.js            student screens
js/teacher.js        teacher view
js/engine.js         skills engine, support dial, XP (pure functions, tested)
js/store.js          demo-mode storage (browser only)
js/content/          curriculum (the 18 Stage 8 codes), islands, mission content
js/kit/              gamification kit from Checkpoint Quest (sounds, celebrations, reward rules)
tests/               npm test
```

Design follows the Checkpoint Quest blueprint (shared by a colleague), adapted to this school's Stage 8 objectives,
rubric and yearly plan.

## Next steps

Supabase backend with server-side XP and rate limits (after school approval for student data), more islands and strands,
team missions, and AI feedback for written answers.
