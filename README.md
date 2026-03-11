# Events App (MVP)

Web app to list, search, and create events. Exportable to Android APK via Capacitor.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Configuration (required to see data)

The app needs **Supabase** to store events and users. Without it you’ll see the UI and a yellow “Setup required” banner.

1. Create a project at [supabase.com](https://supabase.com).
2. In the project: **Settings → API** — copy **Project URL** and **anon public** key.
3. In this repo root, create a file `.env`:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Apply the database schema: in Supabase dashboard go to **SQL Editor** and run the contents of `supabase/migrations/20240304000000_create_events.sql`.
5. Restart the dev server (`npm run dev`).

After that, you can sign up, log in, create events, and see them on the list and map.

## Build for production

```bash
npm run build
```

## Export to Android APK

```bash
npm run build
npx cap add android   # only first time
npm run cap:sync
npm run cap:open:android
```

Then build the APK from Android Studio.

## Tech

- React + Vite + TypeScript
- Supabase (auth + PostgreSQL)
- React Router, Leaflet (map)
- Capacitor (Android)
