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
   2. Paste in the whole of `supabase/schema.sql` from the repo.
   3. Click **Run**.
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

## What this step does not do yet

Practice progress is still saved only on each device. The next step saves every answer to the database and works out XP on the server, so students can't fake it. After that, the teacher page heat map will show your real class instead of the demo one.
