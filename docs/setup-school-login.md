# Turning on school sign-in

Until these steps are done, the app stays in **demo mode**. Each browser keeps its own practice data, students use nicknames only, and there is a made-up class.

After setup, students sign in with their **school Google account** and then join your class with a **6-character class code**. Other Google accounts are turned away twice: once by the app and once by the database.

These menus were correct as far as I know in November 2026. Supabase and Google rename their buttons now and then, so a label may look a little different.

## Before you start

1. **Get school approval.** Student emails will be stored in Supabase. Ask your school where that data may live and for how long. Do not use real student accounts until the school says yes.
2. **Check the student email domain.** The app accepts `@vinschool.edu.vn` and any subdomain of it (for example `@st.vinschool.edu.vn`). If students use a different domain, tell Claude. The domain needs changing in two places: `js/config.js` and `school_ok()` in `supabase/schema.sql`.

## Steps

1. **Create the Supabase project.**
   1. Go to https://supabase.com/dashboard and sign in.
   2. Click **New project**.
   3. Name it `globalvisions`.
   4. Choose a strong database password and keep it somewhere safe. Never put it in the repo.
   5. Pick the region closest to the school (Singapore, if it is offered).
2. **Create the tables and rules.**
   1. In the project, open **SQL Editor** and click **New query**.
   2. Paste in the whole of `supabase/schema.sql` from the repo and click **Run**.
   3. Click **New query** again, paste in the whole of `supabase/progress.sql` and click **Run**. This adds saved work, server-side XP and leaderboards.
   4. Click **New query** again, paste in the whole of `supabase/content.sql` and click **Run**. This tells the server which options are right, so it can mark answers and work out XP.

   All three files are safe to run again. Whenever Claude changes the questions, run `supabase/content.sql` again (Claude will remind you in the PR).
3. **Turn on Google sign-in in Supabase.**
   1. Go to **Authentication → Sign In / Providers → Google** and switch it on.
   2. Copy the **Callback URL** shown there. You need it in step 4.
4. **Make a Google sign-in client.**
   1. Go to https://console.cloud.google.com.
   2. Create a project, then open **APIs & Services → OAuth consent screen**.
   3. If you can, choose **Internal**. That lets only school accounts sign in, at Google's end too. Internal is only offered if the project belongs to the school's Google Workspace. If you can't choose it, the school's IT team may need to create the project or allow the app.
   4. Go to **Credentials → Create credentials → OAuth client ID → Web application**.
   5. Under **Authorized redirect URIs**, paste the Supabase Callback URL from step 3.
   6. Copy the **Client ID** and **Client secret** into the Google settings in Supabase, then save. The secret stays in Supabase only. Never put it in the repo or in a chat.
5. **Tell Supabase where the app lives.**
   1. Go to **Authentication → URL Configuration**.
   2. Set **Site URL** to the address where students will open the app, such as your GitHub Pages address.
   3. Add the same address under **Redirect URLs**.

   Google sign-in needs a normal web address, so this is the point where GitHub Pages hosting comes back in.
6. **Make yourself a teacher.**
   1. Open the app's `teacher.html` page and sign in once with your school account.
   2. In Supabase, open **SQL Editor** and run the line below, with your own email in place of the example.

   ```sql
   insert into public.teachers (user_id) select id from auth.users where email = 'your.name@vinschool.edu.vn';
   ```

   Run this in Supabase only. Do not add your email to any file in the repo.
7. **Connect the app.**
   1. In Supabase, open **Project Settings → API Keys**.
   2. Send Claude the **Project URL** and the **publishable** key. Both are safe to share, because the database rules do the protecting.
   3. Never send the **secret** key or the **service_role** key.

   Claude will put the two values in `js/config.js`. That switches off demo mode.
8. **Make your class.**
   1. On the teacher page, type a class name (for example `7A`) and click **Make class and code**.
   2. Give students the code.
   3. Each student signs in with Google, types the code and picks a nickname. Nicknames must be unique within a class.

## What happens to students' work

- Every finished activity is saved to the database. If a student is offline, the app keeps it and sends it when the connection comes back.
- The server marks every answer and works out the XP itself. A student who edits the app on their device can't give themselves more XP.
- A question a student has seen before earns no XP. Replays and extra practice earn less each time on the same day.
- The teacher page shows your real class: both dials, the heat map, top traps, quick guesses and when each student was last active.
- The leaderboards show your class only, with nicknames.

## Where the answers live

In school mode the app never has the answer key. It loads the questions from `js/content/<island>-public.js` (for example `fizz-public.js` and `signal-public.js`), which list the options in alphabetical order and has no reasons or explanations. Each tap goes to the server, which says right or wrong and gives the reason for a wrong choice. After two wrong taps a question is locked until the activity is saved, and the XP is worked out from the server's record of the taps, not from what the app reports.

The full content with the answers (`js/content/fizz.js`, `js/content/signal.js`) stays in this private repository. The publish workflow (`.github/workflows/pages.yml`) leaves it off the website in school mode.

Trade-off: in school mode each tap needs an internet connection.

## Publishing the app (GitHub Pages)

Right now the repository is **public** and the demo is published straight from `main`. That is fine for demo mode, but in school mode the full content with the answers (`js/content/fizz.js`, `js/content/signal.js`) must not be public. Anyone can read a public repository on GitHub, so leaving those files off the website is not enough. Before step 7 (connecting the app), do this:

1. Make the repository private: **Settings → General → Danger Zone → Change repository visibility → Make private**.
2. A private repository needs a paid GitHub plan for Pages (GitHub Pro for a personal account). Check the current price at https://github.com/pricing. Without it, the student site goes offline when the repository goes private.
3. In the repository, open **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**. This switches publishing to the workflow, which leaves the answer files off the website.
4. Open **Settings → Secrets and variables → Actions → Variables**, click **New repository variable**, name it `PAGES_ON` and set it to `true`, so every merge to `main` publishes.
5. Open the **Actions** tab, choose **Publish the student app**, and click **Run workflow** once to publish straight away.

The website address stays the same (`https://jkhobson.github.io/globalvisions/`).

## Checking the database rules

`tests/db.test.mjs` runs all three SQL files on a local Postgres with a stand-in for Supabase sign-in, then plays a teacher, students in two classes, an outside Gmail account and an anonymous visitor. It checks that outsiders are turned away, students can't read the answer key, other students' work or other classes, can't write their own XP, and that the server's XP and leaderboard numbers come out right. It is skipped unless `GV_PG` points at a Postgres server where it may make a scratch database, for example `GV_PG="postgresql://postgres@localhost:5432/postgres" npm test`.
