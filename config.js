// Study Hub Junction — config.js
// Ye wahi public config hai jo rebuilt index.html ke andar chalti hai.
// Isme koi secret / service-role key NAHI hai — sirf browser me chalne
// wali public values hain (Supabase publishable/anon key public hoti hai).
// index.html self-contained hai, isliye ye file alag se load karna zaroori nahi hai.

/* ================= Config (from the site's config.js — values unchanged) ================= */
var CONFIG = {
  websiteName: "Study Hub Junction",
  websiteUrl: "https://study-hub-junction-eight.vercel.app",
  telegramUrl: "https://t.me/Study_hub_junction_bot",
  telegramChannelUrl: "https://t.me/pickzenloots",
  contactEmail: "ankittkumar864@gmail.com",
  supabaseUrl: "https://ljhcssagxfdvlzgbanrp.supabase.co",
  supabaseAnonKey: "sb_publishable_RjAVzZicTcGmzblzRD4Q9Q_x7E53xPX",
  storageBucket: "study-materials",
  defaultLogo: "assets/logo.png",
  originalLogo: "assets/study-hub-logo.jpg",
  redesignedLogo: "assets/logo-redesigned.png",
  option1Logo: "assets/logo-option1.png",
  option2Logo: "assets/logo-option2.png"
};

// Browser ke purane structure ke liye bhi uplabdh:
if (typeof window !== "undefined") { window.STUDY_HUB_CONFIG = CONFIG; }
