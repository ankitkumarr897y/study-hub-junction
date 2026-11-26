# Study Hub Junction — Vercel-ready Website Pack (v3 — PDF Upload Button)

Ye ZIP current Study Hub Junction website ka fresh rebuild hai —
naya premium UI, client ka chuna hua Option 3 Junction logo, Hero
Option 3 Minimal Growth visual, AUR naya asli PDF upload button
(admin material form me), llms.txt, Open Graph, sitemap, robots aur
Bing verification ke saath. Ye ek dusre client ki website hai
(Apna School se alag).

## ZIP ke andar kya hai

- `index.html` — poori website (root par). Ye self-contained hai:
  CSS aur JavaScript isi file ke andar hain, isliye ye akele hi chalti hai.
- `assets/` — saari assets:
  - `assets/logo.png` — chuna hua Option 3 Junction logo (neele, hare
    aur narangi rangon wali khuli kitab ka junction mark, neeche
    "study hub junction" dark blue me, 1600 × 1600). Yehi header, hero,
    footer, favicon aur share (Open Graph) image hai.
  - `assets/hero.png` — chuna hua Hero Option 3 Minimal Growth visual
    (kitabon ka stack aur upar badhta hua teer with graduation cap).
    Yehi home page ke hero section me dikhta hai.
  - `assets/logo-option1.png` — Logo Option 1 (Minimal: kitab + cap).
  - `assets/logo-option2.png` — Logo Option 2 (Shield crest).
  - `assets/logo-redesigned.png` — pichla redesigned logo (cap + book).
  - `assets/logo.svg` — pichle redesigned logo ka vector version.
  - `assets/study-hub-logo.jpg` — purana original circular logo.
    Admin panel me "Restore original" dabane par yehi logo wapas aata hai.
  - `assets/llms.txt`, `assets/sitemap.xml`, `assets/robots.txt`,
    `assets/BingSiteAuth.xml` — SEO files (inki copy ZIP ke root par bhi hai,
    kyunki search engines inhe root par dhundhte hain).
- `llms.txt`, `sitemap.xml`, `robots.txt`, `BingSiteAuth.xml` — root copies.
- `404.html` — galat / purane link ke liye not-found page.
- `styles.css`, `app.js`, `config.js`, `materials.js` — index.html ke andar
  wale CSS/JS ki alag copies, sirf reference aur alag editing ke liye.
  Inhe index.html me dobara link/load MAT karna — site self-contained hai,
  code pehle se index.html ke andar chalta hai, dobara load karne se
  do baar chalega.
- `README.md` — ye file.

## Deploy kaise karein (GitHub + Vercel)

1. ZIP ko kholo (extract karo).
2. Andar ki SAARI files aur `assets` folder ko apne GitHub repo ke
   ROOT par upload karo. Dhyaan: ZIP file khud upload nahi karni,
   uske andar ki files upload karni hain. `index.html` repo ke root
   par hona chahiye.
3. Vercel par usi repo ko import / deploy karo:
   - Framework Preset: **Other**
   - Build Command: **khaali chhodo** (empty)
   - Output / Install settings: default rehne do, koi install step nahi hai.
4. Deploy hone ke baad site live ho jayegi. Koi `package.json`,
   server code ya `node_modules` is pack me nahi hai — ye 100% static hai.

## PDF Upload — Admin se PDF kaise add karein (NAYA)

Admin material form me ab asli **Upload PDF** button hai:

1. Live site par `#/admin` kholo aur admin account se sign in karo
   (Supabase sign-in zaroori hai).
2. Add / Edit Material form me **Upload PDF** picker se apne device
   se PDF choose karo — maximum size **25 MB**, sirf PDF file.
3. PDF seedha **Supabase Storage** ke **"study-materials"** bucket me
   upload hota hai. Form me **progress bar aur status** dikhta hai.
4. Upload pura hote hi PDF ka public URL **file URL field me apne
   aap bhar jata hai**. Phir baaki details (title, class, subject,
   licence wagera) bhar ke material Save / Publish karo.
5. **Paste-URL fallback bhi hai:** agar PDF kahin aur hosted hai to
   uska direct HTTPS PDF link file URL field me paste karke bhi
   save kar sakte ho — upload karna compulsory nahi hai.

Dhyaan do:
- PDF upload ke liye **admin sign-in (Supabase) zaroori hai** —
  bina sign-in ke upload nahi hoga.
- Upload **sirf live (deploy ki hui) site par** kaam karta hai.
  **Tab-preview mode me upload nahi hota** — preview me kiye gaye
  changes sirf usi tab me rehte hain, live nahi hote.
- Licence (original / licensed / public_domain) chune bina material
  publish nahi hota.

## Bing Webmaster Tools verification (client ko khud karna hai)

Is pack me Bing ka koi asli code NAHI dala gaya hai — placeholder hai.
Client ko apna code khud dalna hoga:

- Option A (meta tag): Bing Webmaster Tools > Settings > Verify ownership
  se code copy karo, phir `index.html` me ye line dhundho:
  `PASTE_YOUR_BING_VERIFICATION_CODE_HERE`
  aur uski jagah apna code paste karke dobara deploy karo.
- Option B (XML file): Bing se mili code ko `BingSiteAuth.xml`
  (root wali aur `assets/BingSiteAuth.xml` dono) me
  `PASTE_YOUR_BING_CODE_HERE` ki jagah paste karo.

Ek hi option kaafi hai. Code paste karne ke baad Bing me "Verify" dabao.

## Dhyaan dene wali baatein

- Google verification, AdSense, GTM aur Analytics IDs pehle wale hi hain,
  unhe badla nahi gaya hai.
- Is pack me koi secret key nahi hai. `config.js` / `index.html` me jo
  Supabase key hai wo sirf public (publishable/anon) key hai, jo browser
  me chalne ke liye hoti hai — service-role / secret key kabhi is pack
  me mat dalna.
- Admin sign-in ke liye site owner ke apne Supabase admin account ki
  zaroorat hoti hai; bina uske admin login test nahi hoga.
- PDF download/preview tabhi chalega jab kisi material ke saath PDF
  attach hoga (admin se upload / link kiya hua).
- Logo badalna ho to admin panel se hota hai — wahan 5 choices safe
  hain: Junction (Option 3, abhi wala default), Option 1 Minimal,
  Option 2 Shield, pichla redesigned logo, aur purana original
  circular logo ("Restore original").
