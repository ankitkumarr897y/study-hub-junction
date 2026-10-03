# Study Hub Junction

A mobile-first study-material site for Classes 9–12, JEE Main/Advanced, NEET and SSC. Its permanent, predictable material links are designed to be sent directly by a Telegram bot.

## Architecture

- **Website:** dependency-free HTML, CSS and browser JavaScript. No build step, paid theme, framework download or secret in the browser.
- **Website hosting:** the public site is configured at `https://study-hub-junction.vercel.app`. `vercel.json` sends direct SPA routes to `index.html` so material links return the app instead of an HTTP 404. The included GitHub Pages workflow remains an optional alternative.
- **Persistent database and admin sign-in:** Supabase free tier (PostgreSQL + Auth + Row Level Security). You can preview the whole site before connecting Supabase.
- **Local preview:** a tiny PowerShell static-file server, included in `scripts/preview.ps1`.
- **Materials:** public pages show only published database rows. Drafts and admin CRUD require a signed-in account whose protected `app_metadata.role` is `admin`.
- **Scalability:** category/subject/chapter/material tables, indexed fields and direct slugs are in `supabase/schema.sql`; server-side search is backed by a Postgres RPC. Static hosting has no server process.

### Database schema

`categories` → `subjects` → `chapters` → `materials`, with foreign keys and unique URL slugs. Material rows include year, title, description, file/thumbnail URLs, tags, publication status, source/permission status and SEO title/description. Admin identities and password hashes are managed by Supabase Auth; passwords are never stored in this site. Indexes cover category/year/tag/search use. Row Level Security makes published resources readable and limits writes and draft visibility to admins.

## Folder structure

```text
StudyHubJunction/
├── index.html                 App shell and global metadata
├── 404.html                   GitHub Pages deep-link handoff
├── vercel.json                Direct-route fallback for Vercel
├── app.js                     Routing, search, material pages and admin UI
├── materials.js               Demo content and predictable slug helpers
├── config.js                  Public website/Telegram/Supabase configuration
├── styles.css                 Responsive mobile-first styles
├── assets/study-hub-logo.jpg  Optimized supplied Study Hub Junction logo
├── RUN-LOCAL.bat              Double-click local preview launcher
├── supabase/schema.sql        Tables, indexes, RLS, seed categories and drafts
├── scripts/preview.ps1        Local static preview server (Windows)
├── .github/workflows/pages.yml
├── robots.txt
└── sitemap.xml
```

## Run it locally (Windows)

Either double-click `RUN-LOCAL.bat`, or:

1. Open PowerShell in this folder and run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\preview.ps1
   ```

2. Open **http://localhost:4173/** in a browser.
3. The public site has no Admin link. `/admin` requires the configured Supabase connection and an authenticated administrator; admin editing is deliberately disabled in local demo mode. The homepage has suggested searches; search ranks close matches by title, subject, class/exam, board, year and material type.
4. Stop the preview with **Ctrl+C** in its PowerShell window.

The supplied logo is included as a 512px optimized JPEG in `assets/study-hub-logo.jpg` (about 70 KB). No Node.js, npm, Python, package install or payment is needed to preview the demo.

## Direct links for the Telegram bot

Use the material slug as the path after your deployed site URL:

| Telegram selection | Website path |
|---|---|
| Board → CBSE → Class 10 → PYQs → 2025 → Maths | `/cbse/class-10/pyqs/2025/maths` |
| Board → JAC Board → Class 10 → Notes → Science | `/jac-board/class-10/notes/science` |
| NEET → PYQs → 2025 → Biology | `/neet/pyqs/2025/biology` |
| JEE Main → PYQs → 2025 → Physics | `/jee-main/pyqs/2025/physics` |
| JEE Main → Notes → Physics | `/jee-main/notes/physics` |
| Class 10 → Maths → Chapter 1 | `/class-10/maths/chapter-1` |
| SSC → PYQs → 2025 | `/ssc/pyqs/2025` (a category/year listing) |

For a new material, the admin dashboard generates its URL from category, material type, year, subject and chapter. `slug` is unique in the database. The bot only needs to send `https://YOUR-SITE/<slug>`; it does not need to host the PDF or reproduce the material.

## Free hosted database and secure admin

1. For the current Vercel site, connect the project repository to Vercel or redeploy the updated project files; include `vercel.json` from the project root. The SPA rewrite is needed so a Telegram deep link such as `/neet/pyqs/2025/biology` returns the app directly. If you instead use GitHub Pages, create a **public GitHub repository** named `StudyHubJunction` and upload the contents of this folder to the repository root. Include the hidden `.github` folder (especially `.github/workflows/pages.yml`) and `.nojekyll`; if using Windows File Explorer, enable **View → Show → Hidden items** before selecting the files.
2. **GitHub Pages alternative only:** open **Settings → Pages**, choose **GitHub Actions** as the source. Push to `main`; `.github/workflows/pages.yml` deploys the site. Wait for the Pages deployment link to appear in Actions.
3. Create a Supabase project on its free tier. In **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql). It creates the database, RLS policies, school-board registry, categories and unpublished example drafts. If you previously ran an older version, run the entire updated schema again; it adds the board table and optional `board_slug` column while preserving existing non-board URLs. If you previously saw `generation expression is not immutable`, the current schema uses a trigger-maintained full-text search column instead.
4. In Supabase Auth, create your own admin user and turn off public sign-ups. In SQL Editor, assign the protected admin claim to that exact email (replace the example):

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'you@example.com';
   ```

   Sign in again after assigning the role so Supabase issues a token with the updated claim.
5. In `config.js`, fill in `websiteUrl`, `supabaseUrl`, `supabaseAnonKey` and `adminEmail`. For a repository named `StudyHubJunction` at `https://USERNAME.github.io/StudyHubJunction/`, set:

   ```js
   websiteUrl: "https://USERNAME.github.io/StudyHubJunction",
   basePath: "/StudyHubJunction",
   ```

   Also leave the repository name in `repositoryBase` in `404.html` and the matching base-path check near the top of `index.html` as `/StudyHubJunction`. For a custom domain or `USERNAME.github.io` root site, use `basePath: ""` and set `repositoryBase` to an unused path such as `/unused-repository`.
6. Commit `config.js` and push. Supabase's **anon/publishable** key is intended for public browser use; the SQL policies protect the database. **Never put the Supabase service-role key, database password or an admin password in this repository.** The configured admin email is public and is not an authorization boundary; Auth + RLS are.
7. Open `/admin` directly, sign in and add categories/materials. This address is intentionally not linked from public navigation, but the real access control is Supabase Auth and Row Level Security—not the hidden URL. A material's subject and optional chapter rows are created as needed. The database and admin changes persist across browsers.

### Upload a PYQ PDF

1. Finish the Supabase setup above and sign in to `/admin` with the authorised admin account. File uploads are not available in browser-only demo mode.
2. In **Add a study material**, select the exam/class, choose **Previous year questions**, then enter its subject, year and description.
3. Under **Upload PDF**, select a PDF (maximum 25 MB). The app uploads it into the `study-materials` Supabase Storage bucket and saves its public URL with the material. Or paste a direct HTTPS file URL instead.
4. Set the **Source / redistribution permission** correctly and enter the source/licence/permission details. Only then can you publish the material.
5. The dashboard generates its permanent URL automatically. For example, NEET → PYQs → 2025 → Biology is `/neet/pyqs/2025/biology`. Copy that page URL and send it from your Telegram bot.

The bucket and its access policies are created by `supabase/schema.sql`; run the updated SQL in Supabase SQL Editor before uploading. PDF downloads are public to visitors, but only an authenticated admin can upload or remove stored files. Replacing a PDF cleans up the previous file after the updated record saves.

## Telegram bot

The ready-to-run Windows bot is in [`telegram-bot/`](./telegram-bot/). Follow its [step-by-step setup guide](./telegram-bot/README.md): it uses buttons for boards/classes/exams, PYQ years, subjects, chapters, latest materials and search, then sends students straight to the matching website material page. It reads only published Supabase rows with an HTTPS file URL; add/publish materials through `/admin` to make them appear. Category menus fetch only matching rows, search uses the database search function, and repeated selections are cached briefly. Keep the BotFather token in the ignored `telegram-bot/.env` file and never upload/share it. The bot runs on your computer while it is on; Vercel/GitHub Pages only host the website.

Supabase's free-tier limits and availability can change. No service is guaranteed to remain free forever. A custom domain, if you buy one, costs extra; a default GitHub Pages URL does not.

## Configuration

`config.js` is the actual configuration used by this no-build static site. `.env.example` lists the equivalent requested setting names for reference; GitHub Pages cannot read server environment variables because it does not run an application server.

| Setting | Purpose |
|---|---|
| `websiteName` / `WEBSITE_NAME` | Display name and page titles |
| `websiteUrl` / `WEBSITE_URL` | Public site URL used for canonical metadata |
| `telegramUrl` / `TELEGRAM_URL` | Configurable Telegram bot destination |
| `telegramChannelUrl` | Telegram channel destination |
| `adminEmail` / `ADMIN_EMAIL` | Restricts the sign-in form to the intended email; RLS still enforces admin access |
| `supabaseUrl`, `supabaseAnonKey` | Public Supabase endpoint and publishable/anon key |
| `basePath` | Repository prefix for GitHub Pages project sites; blank for root/custom domains |

Only non-secret values belong in `config.js`. The Google AdSense loader remains in `index.html`; the site does not show placeholder ad boxes.

## Copyright, files and publishing

The included listings are **sample placeholders**, not a collection of redistributable PDFs. The database seed examples are unpublished. Upload only a file that you own or have permission/licence to distribute. Before publishing, choose **Original work**, **Licensed for distribution** or **Public domain**, and record the source/permission details. The app and database both reject publishing a `Not verified` resource. Do not assume that exam papers or third-party notes can be redistributed.

## SEO and hosting notes

- Clean direct paths, per-page title/description/canonical/Open Graph metadata and educational/breadcrumb structured data are set for the currently displayed route.
- `robots.txt` and `sitemap.xml` use the current `https://study-hub-junction.vercel.app` domain. `sitemap.xml` is a static file: add newly published material paths there when you want them listed explicitly.
- Vercel's `vercel.json` rewrite serves the SPA shell for direct material URLs; the GitHub Pages 404 handoff remains available for that optional host. This app renders route content and metadata in the browser, not on the server, so it is not equivalent to server-side rendering.
- `/admin` is hidden from navigation, disallowed in `robots.txt`, and marked `noindex`; admin access still requires Supabase Auth and RLS. Search is marked `noindex`; missing paths show a useful 404; runtime errors have a recovery page at `/error`.
- Page metadata, mobile navigation, image loading, responsive layouts and content links work without an external UI library or font download.

## Pages and content

Includes responsive home/category/material/search pages, breadcrumbs, related/previous/next materials, direct PDF upload to Supabase Storage or HTTPS link, PDF preview/view/download, Telegram links, local privacy/terms/disclaimer/about/contact pages, a 404 fallback, and an error recovery page. The legal pages are starter templates; adapt them to your real contact details, data practices and local laws before public launch.
