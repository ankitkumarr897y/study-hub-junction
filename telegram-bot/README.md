# Telegram bot — Study Hub Junction

Yeh bot students ko Telegram buttons se school board → class ya exam, PYQ year, subject ya chapter chunne deta hai. Aakhri button unhe website ke usi material page par le jaata hai. Bot **sirf published materials jinke paas HTTPS PDF/file URL hai** dikhata hai; website ke admin dashboard mein naye materials publish karne par woh bot menu mein aa jaate hain.

Bot Python ke built-in modules use karta hai. Alag Python packages ya paid service ki zaroorat nahi. Bot ko chalane ke liye Windows computer aur internet chalu rehna chahiye.

## Shuru karne se pehle

Yeh cheezein taiyar rakhein:

- Telegram bot ka API token (BotFather se)
- Supabase Project URL
- Supabase **publishable/anon** key — kabhi `service_role` key nahi
- Live website URL: `https://study-hub-junction.vercel.app`
- Channel `@pickzenloots` mein bot ko **administrator** banane ki permission
- Kam se kam ek aisa PDF material jo website par Supabase se upload karke publish kiya ho

Bot ko wahi Supabase project padhna hoga jo website use karti hai. Supabase RLS ke karan draft materials bot ko nazar nahi aate.

## Windows par setup — ek-ek step

### 1. Python install karein

1. Browser mein [python.org/downloads](https://www.python.org/downloads/) kholiye aur Windows ke liye Python 3 download kijiye.
2. Installer kholne par **Add python.exe to PATH** checkbox zaroor select karein, phir Install karein.
3. Installation ke baad Start menu se **Command Prompt** kholiye aur `py --version` likhkar Enter dabaiye. Python ka version dikhna chahiye.

### 2. Telegram bot token lein

1. Telegram mein verified **@BotFather** chat kholiye.
2. `/mybots` bhejiye aur apna `Study_hub_junction_bot` select kijiye.
3. **API Token** ya **Bot Settings → API Token** se token dekhiye. Bot naya ho toh BotFather ke `/newbot` steps follow karke pehle bot banaiye.
4. Token ko private rakhein. Use kisi ko forward, screenshot ya chat mein paste na karein. Agar leak ho jaye toh BotFather se token revoke karke naya banayein.

### 3. Channel join verification set karein

Telegram mein `@pickzenloots` channel kholiye aur bot ko channel ka **administrator** banaiye. Bot ko channel membership verify karne ke liye admin access chahiye. Students material button dabayenge toh bot pehle channel join karne ko kahega; join ke baad **Joined — check again** dabane par hi material link dikhayega.

### 4. Supabase details dekhein

1. Apne Supabase project mein **Project Settings → API Keys** (kuch dashboards mein **Project Settings → API**) kholiye.
2. **Project URL** copy karein.
3. Sirf **Publishable key** ya purane dashboard ki **anon/public key** copy karein.
4. **Secret key**, `service_role` key, database password ya admin password yahan kabhi na daalein.

### 5. Private `.env` settings file banayein

1. File Explorer mein project folder kholiye, phir `telegram-bot` folder kholiye.
2. `telegram-bot` folder ke andar `.env.example` file ko VS Code/Notepad mein kholiye.
3. Uski copy isi folder mein `.env` naam se banaiye. VS Code mein `telegram-bot` folder par right-click → **New File** → `.env` bhi bana sakte hain.
4. `.env` mein example values ko apni values se replace karein:

   ```text
   TELEGRAM_BOT_TOKEN=BotFather_se_mila_private_token
   SUPABASE_URL=https://aapka-project-ref.supabase.co
   SUPABASE_ANON_KEY=aapki_publishable_ya_anon_key
   WEBSITE_URL=https://study-hub-junction.vercel.app
   ```

5. File save karein. `=` ke aas-paas extra spaces na rakhein. URL ke aas-paas quotes zaroori nahi hain.
6. `.env` ko GitHub par upload/share **mat** karein. Project ka `.gitignore` ise ignore karta hai; `.env.example` mein asli token ya key kabhi na likhein.

### 6. Website par ek asli material publish karein

Board-wise materials ke liye pehle Supabase SQL Editor mein project ke `supabase/schema.sql` ka **poora updated version** run karein. Isse board list aur optional `board_slug` field add hoti hai. Purana schema rehne par naya bot board filter query nahi kar payega. Site code deploy karne ke baad bot ko band karke dobara start karein.

1. Website ka [`/admin` dashboard](https://study-hub-junction.vercel.app/admin) kholiye.
2. Confirm karein ki **Local demo mode** nahi dikh raha aur Supabase admin sign-in kaam kar raha hai.
3. PDF upload karein ya HTTPS file URL dein. Exam/class, type, subject, year/chapter, description aur source/licence/permission bharien.
4. Sirf us material ko publish karein jise distribute karne ka haq aapke paas ho.
5. Save karke material page kholiye aur PDF ka View/Download button check karein.

Draft, local demo data, ya bina PDF URL ke listing Telegram bot mein nahi dikhegi.

### 7. Bot start karein

1. `telegram-bot` folder ke andar `RUN-BOT.bat` par double-click karein.
2. Ek black Command Prompt window khuli rahegi aur `Study Hub Junction Telegram bot is running` message aayega.
3. Telegram mein apne bot `@Study_hub_junction_bot` ki chat kholiye aur `/start` bhejiye.
4. Class/exam → PYQs/Notes/Chapters → year/subject/chapter chuniye. Aakhir mein material button tap karke confirm karein ki sahi website page aur PDF khul raha hai.
5. Search test ke liye **Search** button dabaiye ya `/search` bhejiye; misal ke liye `NEET Biology 2025` likhiye.

Bot band karne ke liye Command Prompt window mein **Ctrl+C** dabaiye. Window band, computer sleep/off, ya internet disconnect hua toh bot replies rok dega.

## Is flow mein buttons kya karte hain?

- `/start` ya **Main menu**: school board menu aur 8 classes/exams, saath mein channel join aur website ke direct buttons.
- **School boards**: CBSE, ICSE, JAC Board, UP Board ya Bihar Board → Class 9–12 → material.
- Class/exam: PYQs, Notes ya Chapters.
- PYQs: wahi years aur subjects jinke published PDFs available hain.
- Notes: available subjects aur unke material pages.
- Chapters: subject, phir available chapter PDF.
- **Latest materials**: naye published PDFs.
- **Search**: title, class/exam, subject, year ya material text se dhoondhta hai.
- Aakhri PDF-icon material button par bot pehle `@pickzenloots` membership verify karta hai; join ke baad `WEBSITE_URL/<database slug>` kholta hai—Bot home page par nahi chhodta.

Bot har menu ke liye Supabase se sirf us class/exam, material type, year ya subject ki rows padhta hai—poora catalogue nahi. Search database ke indexed search function se hota hai; **Latest materials** sirf 8 recent rows maangta hai. Har selection result 90 seconds tak cache hota hai, isliye dobara wahi menu kholna jaldi hota hai. Naya material turant dekhna ho toh cache expire hone ke liye ek minute tak rukkar menu phir kholiye.

## Bot reply na kare toh

- Command Prompt mein error padhein aur `telegram-bot/.env` mein chaaron values sahi hone ki jaanch karein.
- `py --version` chala kar confirm karein ki Python install hai.
- Supabase Project URL aur publishable/anon key sahi project ki hon; `service_role` key na use karein.
- Website ka admin **Local demo mode** mein na ho. Demo mein save hua material database tak nahi pahunchta.
- Material published ho, usme valid HTTPS PDF/file URL ho aur website par PDF button kaam karta ho.
- Agar JAC Board material dikh raha ho lekin bot mein nahi, latest `bot.py` upload karke bot process restart karein. Bot ka canonical board slug `jac-board` hai; legacy `jac` materials bhi isi JAC Board menu mein dikhte hain. Menu cache 90 seconds tak rehta hai.
- `409 Conflict` ya “webhook” ka error aaye toh isi bot ko chalane wala doosra program/server band karein. Ek Telegram bot token ke liye ek polling instance hi chalayein.
- `.env` ya bot token ka screenshot/contents kisi ko na bhejein. Error share karna ho toh token/key ko chhupa dein.

## 24/7 chalana

`RUN-BOT.bat` ek local test/start method hai. Yeh tabhi chalta rahega jab aapka computer aur internet chalu hon. GitHub Pages aur Vercel static website hosting hain—yeh polling bot ko nahi chalate. Bot ko hamesha online rakhne ke liye baad mein always-on host/server chahiye; free hosts sleep/restrictions laga sakte hain, isliye 24/7 free rehne ki guarantee nahi hai.

### PythonAnywhere par bot host karna

PythonAnywhere bot ko website se alag chalata hai. Website Vercel par hi rahegi; Telegram bot ko PythonAnywhere par upload karna hoga. Is bot mein third-party Python package ki zaroorat nahi hai.

1. [PythonAnywhere](https://www.pythonanywhere.com/) par account banakar **Files** page kholiye.
2. Apne home folder mein `telegram-bot` folder banaiye. Is project ke `telegram-bot` folder se `bot.py` upload karein. `test_bot.py` aur README chalane ke liye zaroori nahi hain.
3. Usi remote folder mein `.env` naam ki file banaiye. Ismein apni local `.env` se values khud bhar kar yeh chaar settings rakhein:

   ```text
   TELEGRAM_BOT_TOKEN=your_private_bot_token
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_publishable_or_anon_key
   WEBSITE_URL=https://study-hub-junction.vercel.app
   ```

   `.env` ko public repository mein upload na karein, aur token/key kisi ke saath share na karein. Supabase `service_role` key yahan kabhi use na karein.

4. **Consoles → Bash** se console kholiye. Apne username ko command mein daal kar bot pehle manually test karein:

   ```bash
   python3.10 /home/YOUR_USERNAME/telegram-bot/bot.py
   ```

   Agar account par `python3.10` command na mile, PythonAnywhere ke console mein available Python 3 version use karein. Bot chalne ka message aaye to Telegram mein `/start` aur ek material link test karein. Test ke baad console mein `Ctrl+C` dabakar is process ko rok dein.

5. **Paid account** par **Tasks → Always-on tasks** mein yeh command add karein:

   ```bash
   python3.10 /home/YOUR_USERNAME/telegram-bot/bot.py
   ```

   PythonAnywhere ke docs ke mutabik Always-on task paid accounts ke liye hai. Free account par permanent polling process ko 24/7 chalane ki suvidha nahi milti; free plan ki networking/usage restrictions bhi account ke hisaab se check karein.

6. Always-on task ka status **Running** hone ke baad Telegram bot test karein. Task ke logs se startup ya connection error dekhe ja sakte hain.

**Zaroori:** PythonAnywhere par bot start karne se pehle apne computer ka `RUN-BOT.bat` band karein. Telegram polling ke liye ek hi bot instance chalna chahiye; do instances par `409 Conflict` aa sakta hai.

**Channel join button:** Bot mein kisi material ka button tap karne par, agar user `@pickzenloots` channel ka member nahi hai, tab bot **Join @pickzenloots** button dikhata hai. Join karne ke baad **Joined — check again** dabane par membership verify hoti hai aur phir **Open material** link milta hai. Is verification ke liye bot ko channel ka administrator rehna chahiye.

**Website ke Telegram links:** Website par **Open study bot** (`https://t.me/Study_hub_junction_bot`) aur **Join channel** (`https://t.me/pickzenloots`) alag buttons ke roop mein hain. Bot se material link paane ke liye channel membership verification pehle ki tarah zaroori hai.
