# Days: getting it on your phone

You don't need to write any code. There are three stages. Stage 1 is enough to try Days on your phone today.

---

## Stage 1: Put it online (about 10 minutes)

This gives you a web address you open on your phone. It runs in **demo mode** at first: everything works, but photos are saved only on that phone and there's no real login.

1. Go to **netlify.com** and sign up with your GitHub account.
2. Click **Add new site → Import an existing project → GitHub**, then pick the **heart-collage** repository.
3. Choose the branch with the Days work on it (or `main` once it's merged).
4. Netlify reads the settings automatically (from `netlify.toml`). Just click **Deploy**.
5. After a minute or two you'll get an address like `https://something.netlify.app`. You can rename it under **Site configuration → Change site name** (for example `days-app.netlify.app`).

### Save it to your home screen
- **iPhone (Safari):** open the address, tap the **Share** button, then **Add to Home Screen**.
- **Android (Chrome):** open the address, tap the **⋮** menu, then **Install app** or **Add to Home screen**.

Open it from the home-screen icon. Allow **camera** and **location** when asked.

---

## Stage 2: Real accounts and cloud storage with Supabase (about 15 minutes)

This turns on real sign-up, photos saved in the cloud, and following other people.

1. Go to **supabase.com**, sign up, and click **New project**. Pick a name (e.g. `days`), a database password (save it somewhere), and the region nearest you (e.g. London). Wait about 2 minutes while it sets up.
2. In the left menu, open **SQL Editor → New query**. Open the file `days/supabase/schema.sql` from this repository, copy **everything** in it, paste it in, and press **Run**. You should see "Success". This creates the tables, the security rules and the photo storage.
3. In the left menu, open **Project Settings → API** (sometimes called **Data API / API Keys**). Copy two things:
   - the **Project URL** (looks like `https://abcd1234.supabase.co`)
   - the **anon public** key (a long string; this one is safe to put in an app)
4. Back in **Netlify**: **Site configuration → Environment variables → Add a variable**. Add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
5. In Netlify go to **Deploys → Trigger deploy → Deploy site**. When it finishes, the "demo mode" note disappears and accounts are real.
6. In Supabase, open **Authentication → URL Configuration** and set **Site URL** to your Netlify address. This makes email links come back to your app.

**Tip while testing:** Supabase asks new users to confirm their email by default. To skip that while it's just you and friends, go to **Authentication → Sign In / Providers → Email** and switch off **Confirm email**.

---

## Stage 3: Google and Facebook sign-in (optional, 20–30 minutes each)

These need you to register Days with Google and Facebook. Supabase has step-by-step guides with screenshots:

- **Google:** in Supabase open **Authentication → Sign In / Providers → Google** and follow the linked guide. You'll create an "OAuth client" in Google Cloud Console and paste its Client ID and Secret into Supabase.
- **Facebook:** same place, **Facebook**. You'll create an app at developers.facebook.com and paste its App ID and Secret.

In both cases, the "redirect URL" they ask for is shown on that Supabase page; copy it across exactly. Until these are set up, the Google/Facebook buttons show an error message, and email sign-up works fine.

---

## How it works (for reference)

| Thing | Where it lives |
|---|---|
| The app | `days/` folder in this repository |
| Database setup | `days/supabase/schema.sql` |
| Hosting settings | `netlify.toml` (repository root) or `days/vercel.json` if you prefer Vercel |
| Daily minimum for a streak | Settings screen in the app (default 1) |
| Which capture shows first in a day | `START_AT` at the top of `days/src/screens/DayView.jsx` (currently first of the day) |

**Using Vercel instead of Netlify:** import the repository at vercel.com, set **Root Directory** to `days`, add the same two environment variables, and deploy.

**Running it on a computer (for developers):** inside `days/`, run `npm install` then `npm run dev`.
