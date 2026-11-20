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
   2. Set **Site URL** to the address where students will open the app: your Cloudflare Pages address (see Publishing below) or your own domain.
   3. Add the same address under **Redirect URLs**.

   Google sign-in needs a normal web address, so set up the Cloudflare Pages site (Publishing, below) before this step.
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

The full content with the answers (`js/content/fizz.js`, `js/content/signal.js`) stays in this private repository. The site build (`tools/build-site.sh`) leaves every pack that has a `-public.js` version off the website in school mode.

Trade-off: in school mode each tap needs an internet connection.

## Publishing the app (free private repository + Cloudflare Pages)

Plan: keep this repository **private** on GitHub's free plan, keep Supabase on its free plan, and publish the student site with **Cloudflare Pages** (free). GitHub Pages can't publish a private repository on the free plan, and in school mode the full content with the answers (`js/content/fizz.js`, `js/content/signal.js`) must not be readable on a public GitHub page.

**The student link will change**, from `https://jkhobson.github.io/globalvisions/` to `https://perspectagp.com` (or a `….pages.dev` address until the domain is set up). Each site keeps its own saved data in the browser, so demo progress and home-screen icons don't carry over. The best moment to move is the day you switch on school sign-in, because from then on progress is saved on the server, not the device.

**Do these in order. Don't make the repository private until step 3 works,** or students lose the app in between.

1. **Make the Cloudflare Pages site.**
   1. Sign up or sign in at https://dash.cloudflare.com (free plan).
   2. Go to **Workers & Pages → Create → Pages → Connect to Git** (Cloudflare moves these buttons now and then; look for "Pages" and "Connect to Git").
   3. Connect your GitHub account `jkhobson`. When GitHub asks which repositories Cloudflare may see, choose **Only select repositories → globalvisions**. This keeps working after the repository goes private.
   4. Pick the `globalvisions` repository, production branch `main`.
   5. Project name: `perspecta`. This becomes the backup address, `perspecta.pages.dev` (Cloudflare adds a few letters if the name is taken).
   6. Build settings: Framework preset **None**, Build command `sh tools/build-site.sh`, Build output directory `site`.
   7. Click **Save and Deploy**.
2. **Check the new address.** Open `https://<name>.pages.dev` on your phone. It should look the same as the current site. Every merge to `main` now publishes there within a minute or two.
3. **Tell Supabase about the new address** (if school sign-in is set up): put the `pages.dev` address (or your domain) in Supabase **Authentication → URL Configuration** as Site URL and Redirect URL (step 5 above).
4. **Make the repository private:** GitHub, **Settings → General → Danger Zone → Change repository visibility → Make private**. GitHub Pages stops at this point, so the old `github.io` link stops working.
5. **Share the new link** with students and ask them to add it to their home screen again.

**Your own domain: perspectagp.com.** Domains cost money every year; the price is shown before you pay. The simplest route is to buy it from Cloudflare, because then Cloudflare sets up the address for you:
1. In the Cloudflare dashboard, open **Domain Registration → Register Domains** (it may be called **Buy a domain**), search for `perspectagp.com` and buy it. If it's taken, try another name and tell Claude.
2. Open the Pages project, then **Custom domains → Set up a custom domain**, type `perspectagp.com` and confirm. Cloudflare adds the DNS record itself. The https certificate can take a few minutes to an hour.
3. Optional: add `www.perspectagp.com` the same way, so both spellings work.
4. In Supabase, **Authentication → URL Configuration**: set Site URL to `https://perspectagp.com` and add it under Redirect URLs (keep the `pages.dev` address there too).
5. Share `https://perspectagp.com` with students instead of the `pages.dev` address.

If you buy the domain somewhere else, step 2 shows the DNS record to add at that registrar instead.

**Free plan limits, as Cloudflare listed them in November 2026:** 500 builds a month and 20,000 files per site. Both are far more than this app needs. Limits change, so check https://developers.cloudflare.com/pages/platform/limits if something stops publishing.

**Supabase free plan: pausing.** Supabase pauses a free project after about 7 days with little database activity, and emails you first. During term, students using the app keep it awake. Over a long holiday it will probably pause. Students then can't sign in until you open the Supabase dashboard, pick the project and click **Resume project**. Your data and settings come back, and a paused project can be resumed for up to a year. Resuming can take a few minutes, so open the dashboard the day before classes start again. Check the current rules at https://supabase.com/docs/guides/platform/free-project-pausing.

## Checking the database rules

`tests/db.test.mjs` runs all three SQL files on a local Postgres with a stand-in for Supabase sign-in, then plays a teacher, students in two classes, an outside Gmail account and an anonymous visitor. It checks that outsiders are turned away, students can't read the answer key, other students' work or other classes, can't write their own XP, and that the server's XP and leaderboard numbers come out right. It is skipped unless `GV_PG` points at a Postgres server where it may make a scratch database, for example `GV_PG="postgresql://postgres@localhost:5432/postgres" npm test`.
