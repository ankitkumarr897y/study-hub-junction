// Study Hub Junction — app.js
// Rebuilt site ka poora JavaScript, index.html ke inline scripts se
// nikala gaya. DHYAAN: index.html self-contained hai aur ye code usi ke
// andar pehle se chalta hai — is file ko index.html me dobara <script>
// se load MAT karna, warna code do baar chalega. Ye file sirf source
// reference / alag editing ke liye hai.

"use strict";
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

/* ================= Catalogue (from the site's materials.js — content unchanged) ================= */
var CATEGORIES = [
  { slug:"class-9", title:"Class 9", description:"Build strong foundations with clear notes and chapter-wise practice.", color:"mint", kind:"Class" },
  { slug:"class-10", title:"Class 10", description:"Revise smarter with subject notes and board exam practice.", color:"blue", kind:"Class" },
  { slug:"class-11", title:"Class 11", description:"Make the transition to higher-level concepts feel manageable.", color:"violet", kind:"Class" },
  { slug:"class-12", title:"Class 12", description:"Organise final-year revision and prepare for what comes next.", color:"amber", kind:"Class" },
  { slug:"jee-main", title:"JEE Main", description:"Practice Physics, Chemistry and Mathematics by topic and year.", color:"blue", kind:"Entrance exam" },
  { slug:"jee-advanced", title:"JEE Advanced", description:"Go deeper with challenging concepts and focused practice.", color:"violet", kind:"Entrance exam" },
  { slug:"neet", title:"NEET", description:"Prepare Biology, Physics and Chemistry in one organised place.", color:"mint", kind:"Entrance exam" },
  { slug:"ssc", title:"SSC", description:"Find study notes and previous year practice for SSC exams.", color:"amber", kind:"Competitive exam" }
];
var BOARDS = [
  { slug:"cbse", name:"CBSE", description:"Central Board of Secondary Education study material for Classes 9–12." },
  { slug:"icse", name:"ICSE", description:"Council for the Indian School Certificate Examinations" },
  { slug:"jac-board", name:"JAC Board", description:"Jharkhand Academic Council study material for Classes 9–12." },
  { slug:"up-board", name:"UP Board", description:"Uttar Pradesh Board" },
  { slug:"bihar-board", name:"Bihar Board", description:"Bihar School Examination Board study material for Classes 9–12." }
];
var SEED_MATERIALS = [
  { id:"demo-neet-biology-2025", category_slug:"neet", board_slug:null, type:"pyqs", year:2025, subject_slug:"biology", subject_name:"Biology", chapter_slug:null, title:"NEET Biology Previous Year Questions 2025", description:"A sample listing for NEET Biology previous year questions. Add a PDF you have permission to distribute from the admin dashboard.", tags:["NEET","Biology","PYQ","2025"], seo_title:"NEET Biology PYQs 2025 PDF | Study Hub Junction", seo_description:"Browse NEET Biology previous year questions for 2025 on Study Hub Junction.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-10T10:00:00Z" },
  { id:"demo-neet-physics-2025", category_slug:"neet", board_slug:null, type:"pyqs", year:2025, subject_slug:"physics", subject_name:"Physics", chapter_slug:null, title:"NEET Physics Previous Year Questions 2025", description:"A sample listing for NEET Physics question practice. This demo listing does not include a PDF.", tags:["NEET","Physics","PYQ","2025"], seo_title:"NEET Physics PYQs 2025 | Study Hub Junction", seo_description:"Browse NEET Physics previous year questions for 2025.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-09T10:00:00Z" },
  { id:"demo-neet-chem-2025", category_slug:"neet", board_slug:null, type:"pyqs", year:2025, subject_slug:"chemistry", subject_name:"Chemistry", chapter_slug:null, title:"NEET Chemistry Previous Year Questions 2025", description:"A sample listing for NEET Chemistry question practice. Add your authorised file when ready.", tags:["NEET","Chemistry","PYQ","2025"], seo_title:"NEET Chemistry PYQs 2025 | Study Hub Junction", seo_description:"Browse NEET Chemistry previous year questions for 2025.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-08T10:00:00Z" },
  { id:"demo-jee-main-physics-2025", category_slug:"jee-main", board_slug:null, type:"pyqs", year:2025, subject_slug:"physics", subject_name:"Physics", chapter_slug:null, title:"JEE Main Physics Previous Year Questions 2025", description:"A sample JEE Main Physics PYQ page. Add a permitted PDF URL in the admin dashboard.", tags:["JEE Main","Physics","PYQ","2025"], seo_title:"JEE Main Physics PYQs 2025 | Study Hub Junction", seo_description:"Practice JEE Main Physics previous year questions from 2025.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-07T10:00:00Z" },
  { id:"demo-jee-main-chem-2025", category_slug:"jee-main", board_slug:null, type:"pyqs", year:2025, subject_slug:"chemistry", subject_name:"Chemistry", chapter_slug:null, title:"JEE Main Chemistry Previous Year Questions 2025", description:"A sample JEE Main Chemistry PYQ listing for the site preview.", tags:["JEE Main","Chemistry","PYQ","2025"], seo_title:"JEE Main Chemistry PYQs 2025 | Study Hub Junction", seo_description:"Practice JEE Main Chemistry previous year questions from 2025.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-06T10:00:00Z" },
  { id:"demo-jee-main-maths-2025", category_slug:"jee-main", board_slug:null, type:"pyqs", year:2025, subject_slug:"mathematics", subject_name:"Mathematics", chapter_slug:null, title:"JEE Main Mathematics Previous Year Questions 2025", description:"A sample JEE Main Mathematics PYQ listing. Real downloads are added by the site owner.", tags:["JEE Main","Mathematics","PYQ","2025"], seo_title:"JEE Main Mathematics PYQs 2025 | Study Hub Junction", seo_description:"Practice JEE Main Mathematics previous year questions from 2025.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-05T10:00:00Z" },
  { id:"demo-jee-physics-notes", category_slug:"jee-main", board_slug:null, type:"notes", year:null, subject_slug:"physics", subject_name:"Physics", chapter_slug:null, title:"JEE Main Physics Notes", description:"An example notes page at the predictable URL /jee-main/notes/physics.", tags:["JEE Main","Physics","Notes"], seo_title:"JEE Main Physics Notes | Study Hub Junction", seo_description:"Find JEE Main Physics notes on Study Hub Junction.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-04T10:00:00Z" },
  { id:"demo-class10-maths-chapter1", category_slug:"class-10", board_slug:null, type:"chapter", year:null, subject_slug:"maths", subject_name:"Maths", chapter_slug:"chapter-1", title:"Class 10 Maths Chapter 1", description:"A sample chapter-wise listing with its direct URL /class-10/maths/chapter-1.", tags:["Class 10","Maths","Chapter 1"], seo_title:"Class 10 Maths Chapter 1 | Study Hub Junction", seo_description:"Find Class 10 Maths Chapter 1 study resources.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-03T10:00:00Z" },
  { id:"demo-class12-chem-notes", category_slug:"class-12", board_slug:null, type:"notes", year:null, subject_slug:"chemistry", subject_name:"Chemistry", chapter_slug:null, title:"Class 12 Chemistry Important Notes", description:"A sample Class 12 Chemistry notes listing for the site preview.", tags:["Class 12","Chemistry","Notes"], seo_title:"Class 12 Chemistry Notes | Study Hub Junction", seo_description:"Explore Class 12 Chemistry notes and revision resources.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-02T10:00:00Z" },
  { id:"demo-ssc-pyq-2025", category_slug:"ssc", board_slug:null, type:"pyqs", year:2025, subject_slug:"general-awareness", subject_name:"General Awareness", chapter_slug:null, title:"SSC Previous Year Questions 2025", description:"A sample SSC previous year questions listing. Add only material that is cleared for redistribution.", tags:["SSC","PYQ","2025"], seo_title:"SSC PYQs 2025 | Study Hub Junction", seo_description:"Browse SSC previous year question resources for 2025.", file_url:"", license_status:"not_verified", is_published:true, updated_at:"2026-11-01T10:00:00Z" }
];

/* ================= State (in-memory for this session) ================= */
var state = {
  categories: CATEGORIES.slice(),
  boards: BOARDS.slice(),
  materials: SEED_MATERIALS.slice(),
  liveLoaded: false,
  adminUser: null,
  adminSession: null,
  logoUrl: CONFIG.defaultLogo,
  comments: {},   /* materialId -> [{name, text, when}] this session only */
  ratings: {}     /* materialId -> chosen stars this session only */
};
var MATERIAL_COLUMNS = "id,category_slug,board_slug,subject_slug,subject_name,chapter_slug,type,year,slug,title,description,file_url,thumbnail_url,tags,seo_title,seo_description,license_status,license_note,is_published,created_at,updated_at";

/* ================= Helpers ================= */
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function $(s,r){return (r||document).querySelector(s);}
function $all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function catBySlug(s){return state.categories.filter(function(c){return c.slug===s;})[0]||null;}
function boardBySlug(s){if(s==="jac")s="jac-board";return state.boards.filter(function(b){return b.slug===s;})[0]||null;}
function visibleBoards(){var hidden={icse:1,"up-board":1};return state.boards.filter(function(b){return !hidden[b.slug];});}
function visibleCategories(){return state.categories.filter(function(c){return c.slug!=="ssc";});}
function makeSlug(v){return String(v||"").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function materialPath(m){
  var bp = m.board_slug ? "/"+m.board_slug : "";
  if(m.type==="chapter" && m.chapter_slug) return bp+"/"+m.category_slug+"/"+(m.subject_slug||"general")+"/"+m.chapter_slug;
  if(m.type==="pyqs") return bp+"/"+m.category_slug+"/pyqs/"+(m.year||"all-years")+"/"+(m.subject_slug||"general");
  if(m.type==="model-paper") return bp+"/"+m.category_slug+"/model-question-paper/"+(m.year||"all-years")+"/"+(m.subject_slug||"general");
  if(m.type==="solved-paper") return bp+"/"+m.category_slug+"/solved-paper/"+(m.year||"all-years")+"/"+(m.subject_slug||"general");
  return bp+"/"+m.category_slug+"/"+(m.type||"notes")+"/"+(m.subject_slug||"general");
}
function typeLabel(t){return {notes:"Study notes","short-notes":"Short notes",pyqs:"Previous year questions",chapter:"Chapter material","model-paper":"Model question paper","solved-paper":"Solved paper"}[t]||"Study material";}
function safeHttps(v){try{var u=new URL(v);return u.protocol==="https:"?u.href:"";}catch(e){return "";}}
function publicMaterials(){return state.materials.filter(function(m){return m.is_published!==false;});}
function canonicalFor(route){return CONFIG.websiteUrl + (route==="/"?"/":route);}
function toast(msg,isErr){
  var t=document.createElement("div");t.className="toast"+(isErr?" error":"");t.textContent=msg;
  var region=$("#toast-region");region.replaceChildren(t);
  setTimeout(function(){if(t.parentNode)t.remove();},4200);
}
var ICONS = {
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  cap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5M22 9v5"/></svg>',
  flask:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7 15h10"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 21C7 17.5 3 13.6 3 9.3A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 9 3.3c0 4.3-4 8.2-9 11.7Z"/><path d="M4 12h4l2-3 3 5 2-2h5"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
  atom:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/></svg>',
  layers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
  school:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  tg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m21 3-7.1 18-3.7-7.2L3 10.1 21 3Zm-10.8 10.8L21 3"/></svg>',
  megaphone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 13V9a2 2 0 0 1 2-2h2l9-4v16l-9-4H6a2 2 0 0 1-2-2Zm4-6v10m2 0 1.5 4H15l-2-5m8-8a4 4 0 0 1 0 8"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z"/></svg>',
  code:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 6-6 6 6 6M16 6l6 6-6 6"/></svg>'
};
function catIcon(slug){
  return {"class-9":ICONS.book,"class-10":ICONS.book,"class-11":ICONS.layers,"class-12":ICONS.cap,"jee-main":ICONS.atom,"jee-advanced":ICONS.flask,"neet":ICONS.heart,"ssc":ICONS.target}[slug]||ICONS.book;
}

"use strict";
/* ================= Supabase (public reads + admin auth, same project as live site) ================= */
function sbHeaders(extra){
  var h = { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" };
  h.Authorization = "Bearer " + ((state.adminSession && state.adminSession.access_token) || CONFIG.supabaseAnonKey);
  if(extra) for(var k in extra) h[k]=extra[k];
  return h;
}
function sbFetch(path, options){
  options = options || {};
  var ctrl = ("AbortController" in window) ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, 9000) : null;
  return fetch(CONFIG.supabaseUrl.replace(/\/+$/,"") + "/rest/v1/" + path, {
    method: options.method || "GET",
    headers: sbHeaders(options.headers),
    body: options.body || undefined,
    signal: ctrl ? ctrl.signal : undefined
  }).then(function(res){
    if(timer) clearTimeout(timer);
    return res.text().then(function(text){
      var data = null;
      if(text){ try{ data = JSON.parse(text); }catch(e){ data = text; } }
      if(!res.ok) throw new Error((data && (data.message || data.details || data.hint)) || "Database request failed.");
      return data;
    });
  }).catch(function(err){ if(timer) clearTimeout(timer); throw err; });
}
function normalizeMaterial(item){
  return {
    id: item.id, category_slug: item.category_slug || "neet",
    board_slug: item.board_slug === "jac" ? "jac-board" : (item.board_slug || null),
    subject_slug: item.subject_slug || "general", subject_name: item.subject_name || item.subject_slug || "General",
    chapter_slug: item.chapter_slug || null, type: item.type || "notes", year: item.year || null,
    title: item.title || "Untitled material", description: item.description || "",
    file_url: item.file_url || "", tags: Array.isArray(item.tags) ? item.tags : [],
    seo_title: item.seo_title || "", seo_description: item.seo_description || "",
    license_status: item.license_status || "not_verified", is_published: item.is_published === true,
    updated_at: item.updated_at || item.created_at || ""
  };
}
function hydrateFromSupabase(){
  var params = "select=" + MATERIAL_COLUMNS + "&is_published=eq.true&order=updated_at.desc&limit=200";
  return Promise.allSettled([
    sbFetch("categories?select=slug,name,kind,description&order=name.asc"),
    sbFetch("boards?select=slug,name,description&order=name.asc"),
    sbFetch("materials?" + params)
  ]).then(function(results){
    var changed = false;
    if(results[0].status === "fulfilled" && results[0].value && results[0].value.length){
      var colors = ["blue","mint","violet","amber"];
      state.categories = results[0].value.map(function(c, i){
        var old = catBySlug(c.slug);
        return { slug: c.slug, title: c.name, kind: c.kind || "Class", description: c.description || (old ? old.description : ""), color: old ? old.color : colors[i % colors.length] };
      });
      changed = true;
    }
    if(results[1].status === "fulfilled" && results[1].value && results[1].value.length){
      state.boards = results[1].value.map(function(b){ return { slug: b.slug === "jac" ? "jac-board" : b.slug, name: b.name, description: b.description || "" }; });
      changed = true;
    }
    if(results[2].status === "fulfilled" && results[2].value && results[2].value.length){
      state.materials = results[2].value.map(normalizeMaterial);
      changed = true;
    }
    if(changed){ state.liveLoaded = true; render(); }
  }).catch(function(){ /* bundled catalogue stays — site keeps working offline of the DB */ });
}

/* ================= Search (same ranking approach as the original app.js) ================= */
function normText(v){
  var aliases = { bio:"biology", math:"math", maths:"math", mathematics:"math", pyqs:"pyq", questions:"question" };
  return String(v || "").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(Boolean).map(function(w){ return aliases[w] || w; }).join(" ");
}
function searchFields(item){
  var cat = catBySlug(item.category_slug), board = item.board_slug ? boardBySlug(item.board_slug) : null;
  var typeWords = item.type === "pyqs" ? "pyq pyqs previous year questions" : item.type === "chapter" ? "chapter chapters topic" : item.type === "model-paper" ? "model question paper sample paper" : item.type === "solved-paper" ? "solved paper answer key solutions" : "notes revision";
  return {
    title: normText(item.title), subject: normText((item.subject_name || "") + " " + (item.subject_slug || "")),
    category: normText((cat ? cat.title : "") + " " + item.category_slug), board: normText((board ? board.name : "") + " " + (item.board_slug || "")),
    type: normText(item.type + " " + typeWords), tags: normText((item.tags || []).join(" ")),
    year: normText(item.year), chapter: normText(item.chapter_slug), description: normText(item.description)
  };
}
function scoreMaterial(item, query){
  var terms = normText(query).split(" ").filter(Boolean);
  if(!terms.length) return 0;
  var f = searchFields(item);
  var weights = { title:8, subject:7, category:7, board:7, type:6, tags:5, year:8, chapter:5, description:1 };
  var score = 0;
  for(var i = 0; i < terms.length; i++){
    var term = terms[i], best = 0, found = false;
    for(var key in f){ if(f[key].split(" ").indexOf(term) !== -1 || f[key].indexOf(term) !== -1){ found = true; if(weights[key] > best) best = weights[key]; } }
    if(!found) return 0;
    score += best;
  }
  var phrase = normText(query);
  if(f.title === phrase) score += 24; else if(f.title.indexOf(phrase) !== -1) score += 12;
  if(f.subject === phrase) score += 10;
  if(safeHttps(item.file_url)) score += 3;
  return score;
}
function rankMaterials(items, query){
  return items.map(function(item, i){ return { item: item, i: i, s: scoreMaterial(item, query) }; })
    .filter(function(e){ return e.s > 0; })
    .sort(function(a, b){ return b.s - a.s || a.i - b.i; })
    .map(function(e){ return e.item; });
}
function recommended(items, limit){
  var ranked = items.slice().sort(function(a, b){
    function comp(m){ return (safeHttps(m.file_url) ? 5 : 0) + (m.seo_title ? 1 : 0) + (m.description ? 1 : 0); }
    function ts(m){ return Date.parse(m.updated_at || "") || 0; }
    return comp(b) - comp(a) || ts(b) - ts(a);
  });
  var out = [], used = {};
  for(var i = 0; i < ranked.length && out.length < limit; i++){ if(!used[ranked[i].category_slug]){ out.push(ranked[i]); used[ranked[i].category_slug] = 1; } }
  for(var j = 0; j < ranked.length && out.length < limit; j++){ if(out.indexOf(ranked[j]) === -1) out.push(ranked[j]); }
  return out;
}

/* ================= Shared fragments ================= */
function breadcrumbs(items){
  var html = '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/" data-link>Home</a>';
  items.forEach(function(it, i){
    html += '<span class="crumb-sep" aria-hidden="true">›</span>';
    if(it.href && i !== items.length - 1) html += '<a href="#' + esc(it.href) + '" data-link>' + esc(it.label) + '</a>';
    else html += '<span aria-current="page">' + esc(it.label) + '</span>';
  });
  return html + '</nav>';
}
function sectionHead(title, desc, href, linkText){
  return '<div class="section-head reveal"><div><h2>' + esc(title) + '</h2>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + '</div>' +
    (href ? '<a class="text-link" href="#' + esc(href) + '" data-link>' + esc(linkText || "View all") + ' <span aria-hidden="true">→</span></a>' : '') + '</div>';
}
function materialCard(m){
  var cat = catBySlug(m.category_slug), board = m.board_slug ? boardBySlug(m.board_slug) : null;
  var label = board ? board.name + " · " + (cat ? cat.title : m.category_slug) : (cat ? cat.title : m.category_slug);
  return '<a class="material-card reveal" href="#' + esc(materialPath(m)) + '" data-link>' +
    '<div class="pills"><span class="pill">' + esc(label) + '</span><span class="pill">' + esc(m.subject_name) + '</span><span class="pill pill-type">' + esc(typeLabel(m.type)) + '</span></div>' +
    '<h3>' + esc(m.title) + '</h3><p>' + esc(m.description || "Open this study resource for details.") + '</p>' +
    '<div class="material-foot"><span>' + (m.year ? "Year " + esc(m.year) : "Any year") + (safeHttps(m.file_url) ? " · PDF ready" : "") + '</span><span class="material-cta">Open material →</span></div></a>';
}
function pathCard(c){
  return '<a class="path-card accent-' + esc(c.color || "blue") + ' reveal" href="#/' + esc(c.slug) + '" data-link>' +
    '<div class="path-top"><span class="path-icon">' + catIcon(c.slug) + '</span><span class="path-kind">' + esc(c.kind) + '</span></div>' +
    '<h3>' + esc(c.title) + '</h3><p>' + esc(c.description) + '</p><span class="path-arrow">Explore resources →</span></a>';
}
function boardCard(b){
  return '<a class="path-card accent-blue reveal" href="#/boards/' + esc(b.slug) + '" data-link>' +
    '<div class="path-top"><span class="path-icon">' + ICONS.school + '</span><span class="path-kind">School board</span></div>' +
    '<h3>' + esc(b.name) + '</h3><p>' + esc(b.description || "Browse board-wise classes, notes and question papers.") + '</p><span class="path-arrow">Choose class →</span></a>';
}
function emptyState(title, desc, href){
  return '<div class="empty-state reveal"><div class="empty-mark">' + ICONS.search + '</div><h2>' + esc(title) + '</h2><p>' + esc(desc) + '</p>' +
    '<a class="btn btn-outline" href="#' + esc(href || "/") + '" data-link>Browse materials</a></div>';
}
function telegramBanner(){
  return '<section class="section"><div class="telegram-banner reveal"><div><span class="tk">Study Hub Junction on Telegram</span><h2>Study together on Telegram</h2><p>Get direct study links from the bot and follow the channel for new notes, PYQs and updates.</p></div>' +
    '<div class="telegram-actions"><a class="btn btn-telegram" href="' + CONFIG.telegramUrl + '" target="_blank" rel="noopener noreferrer">' + ICONS.tg + '<span>Open study bot</span><span aria-hidden="true">↗</span></a>' +
    '<a class="btn btn-channel" href="' + CONFIG.telegramChannelUrl + '" target="_blank" rel="noopener noreferrer">' + ICONS.megaphone + '<span>Join Telegram channel</span><span aria-hidden="true">↗</span></a></div></div></section>';
}
function searchForm(value, big){
  return '<form class="search-form" data-search-form role="search">' + ICONS.search.replace('viewBox','class="s-icon" viewBox') +
    '<input name="q" type="search" value="' + esc(value || "") + '" placeholder="Try “NEET Biology” or “Class 10 Maths”" aria-label="Search study material">' +
    '<button class="btn btn-primary" type="submit">Search</button></form>';
}

"use strict";
/* ================= Pages ================= */
function homePage(){
  var items = publicMaterials();
  var recent = items.slice().sort(function(a, b){ return (Date.parse(b.updated_at || "") || 0) - (Date.parse(a.updated_at || "") || 0); }).slice(0, 6);
  var picked = recommended(items, 3);
  var exams = visibleCategories().filter(function(c){ return !/^class-/.test(c.slug); });
  var classes = visibleCategories().filter(function(c){ return /^class-/.test(c.slug); });
  var pyqs = items.filter(function(m){ return m.type === "pyqs"; }).slice(0, 3);
  var notes = items.filter(function(m){ return m.type === "notes"; }).slice(0, 3);
  var chips = ["NEET Biology","JEE Physics","Class 10 Maths"].map(function(q){
    return '<a class="chip" href="#/search?q=' + encodeURIComponent(q) + '" data-link>' + esc(q) + ' ↗</a>';
  }).join("");
  var hero =
  '<section class="hero"><div class="container hero-layout"><div>' +
    '<span class="hero-eyebrow"><span class="dot"></span> Notes · PYQs · Model papers · Instant PDFs</span>' +
    '<h1>Make every study session <span class="hl">count.</span></h1>' +
    '<p class="hero-copy">Find organised notes, previous year questions, model papers and solved papers for Classes 9–12, JEE, NEET and SSC — subject-wise, chapter-wise, in one clear place.</p>' +
    searchForm("") +
    '<div class="search-chips"><span>Popular:</span>' + chips + '</div>' +
    '<ul class="hero-points"><li>' + ICONS.check + ' 10 years of PYQs, organised by year</li><li>' + ICONS.check + ' Subject-wise &amp; chapter-wise access</li><li>' + ICONS.check + ' Direct links from the Telegram bot</li></ul>' +
    '<div class="hero-stats"><div><strong>' + state.categories.length + '</strong><small>Learning paths</small></div><div><strong>' + state.boards.length + '</strong><small>School boards</small></div><div><strong>6</strong><small>Material types</small></div><div><strong>100%</strong><small>Free to browse</small></div></div>' +
  '</div>' +
  '<div class="hero-visual" aria-hidden="true">' +
    '<div class="float-card fc-ring"><span class="fc-icon" style="background:#e9eefc;color:#1f55c4">' + ICONS.book + '</span><div><strong>Class 10 Maths Chapter 1</strong><small>Chapter-wise material · Real Numbers</small></div></div>' +
    '<div class="hero-art"><img class="hero-art-img" src="assets/hero.png" alt="" width="2048" height="1152"></div>' +
    '<div class="float-card fc-pyq"><span class="fc-icon" style="background:#e7f6ef;color:#12805c">' + ICONS.heart + '</span><div><strong>NEET Biology PYQs 2025</strong><small>Previous year questions · Year-wise practice</small></div></div>' +
    '<div class="float-card fc-notes"><span class="fc-icon" style="background:#fdf3e0;color:#c07f10">' + ICONS.file + '</span><div><strong>Instant PDF notes</strong><small>Open a material and download in one tap</small></div></div>' +
  '</div></div></section>';
  var body = '<div class="container">' +
    '<section class="section">' + sectionHead("School boards", "Pick your board first, then your class — every note and paper stays matched to your syllabus.", "/boards", "All boards") +
      '<div class="grid grid-3">' + visibleBoards().map(boardCard).join("") + '</div></section>' +
    '<section class="section">' + sectionHead("Exam paths", "Competitive exams with topic-wise and year-wise practice.", "/jee-main", "Start with JEE") +
      '<div class="grid grid-4">' + exams.map(pathCard).join("") + '</div></section>' +
    '<section class="section">' + sectionHead("Classes 9 to 12", "Board-ready notes, chapters and model papers for school exams.", "/class-10", "All classes") +
      '<div class="grid grid-4">' + classes.map(pathCard).join("") + '</div></section>' +
    (picked.length ? '<section class="section">' + sectionHead("Picked for your next study session", "A fresh mix across subjects — start here if you are not sure where to begin.", "/search", "Search everything") + '<div class="grid grid-3">' + picked.map(materialCard).join("") + '</div></section>' : '') +
    (recent.length ? '<section class="section">' + sectionHead("Latest materials", "Newly added resources, ready for your next study session.", "/search", "Browse all") + '<div class="grid grid-3">' + recent.map(materialCard).join("") + '</div></section>' : '') +
    (pyqs.length ? '<section class="section">' + sectionHead("Previous year questions", "Practice the papers that actually came in the exam — by year and subject.", "/jee-main/pyqs", "JEE PYQs") + '<div class="grid grid-3">' + pyqs.map(materialCard).join("") + '</div></section>' : '') +
    (notes.length ? '<section class="section">' + sectionHead("Important notes", "Quick access to subject notes and last-minute revision.", "/jee-main/notes", "JEE notes") + '<div class="grid grid-3">' + notes.map(materialCard).join("") + '</div></section>' : '') +
    '<section class="section"><div class="feature-strip">' +
      '<div class="feature-item reveal"><span class="fi-icon">' + ICONS.search + '</span><div><h3>Find the right topic</h3><p>Search across exams, subjects, years and material names in one box.</p></div></div>' +
      '<div class="feature-item reveal"><span class="fi-icon">' + ICONS.tg + '</span><div><h3>Open a direct link</h3><p>Every material has a permanent page you can share straight from Telegram.</p></div></div>' +
      '<div class="feature-item reveal"><span class="fi-icon">' + ICONS.shield + '</span><div><h3>Materials with care</h3><p>Only files the owner has the right to share are published here.</p></div></div>' +
    '</div></section>' +
    telegramBanner() +
  '</div>';
  return hero + body;
}

function boardsPage(board){
  if(!board){
    return '<div class="container page-content">' + breadcrumbs([{label:"School boards"}]) +
      '<div class="page-heading"><span class="eyebrow">Board-wise study</span><h1>Choose your board</h1><p>Select your school board first, then choose your class to find matching study materials.</p></div>' +
      '<div class="grid grid-3">' + state.boards.map(boardCard).join("") + '</div>' +
      '<section class="section"><p class="field-hint">ICSE and UP Board collections open as materials are added for them.</p></section></div>';
  }
  var classes = state.categories.filter(function(c){ return /^class-(9|10|11|12)$/.test(c.slug); })
    .sort(function(a, b){ return Number(a.slug.slice(6)) - Number(b.slug.slice(6)); });
  var cards = classes.map(function(c){
    return '<a class="path-card accent-blue reveal" href="#/' + esc(board.slug) + '/' + esc(c.slug) + '" data-link>' +
      '<div class="path-top"><span class="path-icon">' + ICONS.book + '</span><span class="path-kind">' + esc(board.name) + '</span></div>' +
      '<h3>' + esc(c.title) + '</h3><p>Browse ' + esc(c.title) + ' notes, PYQs and chapters for ' + esc(board.name) + '.</p><span class="path-arrow">Choose class →</span></a>';
  }).join("");
  return '<div class="container page-content">' + breadcrumbs([{label:"Boards", href:"/boards"}, {label:board.name}]) +
    '<div class="page-heading"><span class="eyebrow">School board</span><h1>' + esc(board.name) + ' study material</h1><p>' + esc(board.description || ("Choose a class to browse " + board.name + " materials.")) + ' Each class opens board-specific resources.</p></div>' +
    '<div class="grid grid-4">' + cards + '</div></div>';
}

function parseRoute(route){
  var clean = route.split("?")[0];
  var parts = clean.split("/").filter(Boolean);
  var board = null, idx = 0;
  if(parts.length && boardBySlug(parts[0]) && parts[0] !== "boards"){ board = boardBySlug(parts[0]); idx = 1; }
  return { parts: parts, board: board, idx: idx };
}
function categoryPage(cat, route){
  var pr = parseRoute(route), board = pr.board, parts = pr.parts, idx = pr.idx;
  var section = parts[idx + 1] || null;
  var year = null, subject = null;
  if(section === "pyqs" || ["model-paper","model-question-paper","model-papers","solved-paper","solved-papers"].indexOf(section) !== -1){
    if(/^(\d{4}|\d{4}-\d{2})$/.test(parts[idx + 2] || "")) year = parts[idx + 2];
    subject = parts[idx + 3] || (year ? null : parts[idx + 2]) || null;
    if(!year && parts[idx + 2] && !/^(\d{4})/.test(parts[idx+2])) subject = parts[idx + 2];
  } else if(section){ subject = parts[idx + 2] || null; }
  var prefix = (board ? "/" + board.slug : "") + "/" + cat.slug;
  var items = publicMaterials().filter(function(m){
    return m.category_slug === cat.slug && (board ? m.board_slug === board.slug : !m.board_slug);
  });
  if(section){
    var wantType = section === "chapters" ? "chapter" : section === "short-notes" ? "short-notes" :
      ["model-paper","model-question-paper","model-papers"].indexOf(section) !== -1 ? "model-paper" :
      ["solved-paper","solved-papers"].indexOf(section) !== -1 ? "solved-paper" : section;
    items = items.filter(function(m){ return m.type === wantType || (section === "short-notes" && m.type === "notes"); });
  }
  if(year) items = items.filter(function(m){ return String(m.year) === String(year); });
  if(subject && subject !== "all") items = items.filter(function(m){ return m.subject_slug === subject; });
  var label = section === "pyqs" ? "Previous year questions" : section === "notes" ? "Study notes" : section === "short-notes" ? "Short notes" :
    ["model-paper","model-question-paper","model-papers"].indexOf(section || "") !== -1 ? "Model question papers" :
    ["solved-paper","solved-papers"].indexOf(section || "") !== -1 ? "Solved papers" :
    (section === "chapters" || section === "chapter") ? "Chapters" : "Study materials";
  var crumbs = [];
  if(board) crumbs.push({label:"Boards", href:"/boards"}, {label:board.name, href:"/boards/" + board.slug});
  crumbs.push({label:cat.title, href:prefix});
  if(section) crumbs.push({label:label});
  var tabs = '<nav class="tabs" aria-label="' + esc(cat.title) + ' sections">' +
    '<a class="' + (!section ? "active" : "") + '" href="#' + prefix + '" data-link>All materials</a>' +
    '<a class="' + (section === "notes" ? "active" : "") + '" href="#' + prefix + '/notes" data-link>Notes</a>' +
    '<a class="' + (section === "pyqs" ? "active" : "") + '" href="#' + prefix + '/pyqs" data-link>Previous year questions</a>' +
    (["jee-main","jee-advanced","neet"].indexOf(cat.slug) !== -1 ? '<a class="' + (section === "short-notes" ? "active" : "") + '" href="#' + prefix + '/short-notes" data-link>Short notes</a>' : '') +
    (cat.kind === "Class" ? '<a class="' + (["model-paper","model-question-paper","model-papers"].indexOf(section || "") !== -1 ? "active" : "") + '" href="#' + prefix + '/model-question-paper" data-link>Model papers</a><a class="' + (section === "chapters" ? "active" : "") + '" href="#' + prefix + '/chapters" data-link>Chapters</a>' : '') +
  '</nav>';
  return '<div class="container page-content">' + breadcrumbs(crumbs) +
    '<div class="page-heading"><span class="eyebrow">' + esc(board ? board.name + " · " + cat.title : cat.kind) + '</span>' +
    '<h1>' + (board ? esc(board.name) + " · " : "") + esc(cat.title) + (section ? " · " + esc(label) : " study material") + '</h1>' +
    '<p>' + esc(cat.description) + ' Browse ' + (board ? esc(board.name) + "-specific " : "") + 'notes, PYQs and topic-wise resources — every material has a direct link you can share from Telegram.</p></div>' +
    tabs +
    (items.length ? '<div class="grid grid-3">' + items.map(materialCard).join("") + '</div>'
      : emptyState("No materials here yet", "We haven’t added a resource for this selection yet. Try another subject, or check the Telegram bot for the newest additions.", board ? "/boards/" + board.slug : "/" + cat.slug)) +
    telegramBanner() + '</div>';
}

function searchPage(query){
  var q = (query || "").trim();
  var results = q ? rankMaterials(publicMaterials(), q) : [];
  return '<div class="container page-content">' + breadcrumbs([{label:"Search"}]) +
    '<div class="page-heading"><span class="eyebrow">Find a resource</span><h1>Search study material</h1><p>Search by exam, class, subject, year or topic.</p></div>' +
    searchForm(q) +
    (!q ? '<div class="search-chips"><span>Popular:</span>' + ["NEET Biology","JEE Physics","Class 10 Maths"].map(function(t){ return '<a class="chip" href="#/search?q=' + encodeURIComponent(t) + '" data-link>' + esc(t) + ' ↗</a>'; }).join("") + '</div>' : '') +
    '<section class="section">' +
    (q
      ? '<div class="section-head"><div><h2>' + (results.length ? results.length + (results.length === 1 ? " result" : " results") : "No results found") + '</h2><p>Showing matches for “' + esc(q) + '”</p></div></div>' +
        (results.length ? '<div class="grid grid-3">' + results.map(materialCard).join("") + '</div>' : emptyState("Try another search", "Check the spelling, use a shorter phrase, or browse by class or exam.", "/"))
      : emptyState("What are you studying today?", "Enter an exam, class, subject or topic above to find relevant study material.", "/")) +
    '</section></div>';
}

function detailPage(m){
  var cat = catBySlug(m.category_slug), board = m.board_slug ? boardBySlug(m.board_slug) : null;
  var subject = m.subject_name || m.subject_slug;
  var siblings = publicMaterials().filter(function(x){ return x.category_slug === m.category_slug && x.board_slug === m.board_slug; });
  var pos = -1; siblings.forEach(function(x, i){ if(x.id === m.id) pos = i; });
  var prev = pos > 0 ? siblings[pos - 1] : null, next = (pos >= 0 && pos < siblings.length - 1) ? siblings[pos + 1] : null;
  var related = publicMaterials().filter(function(x){ return x.id !== m.id && x.category_slug === m.category_slug; })
    .map(function(x){ return { x: x, s: (x.subject_slug === m.subject_slug ? 12 : 0) + (x.type === m.type ? 4 : 0) + (String(x.year) === String(m.year) ? 2 : 0) + (safeHttps(x.file_url) ? 1 : 0) }; })
    .sort(function(a, b){ return b.s - a.s; }).slice(0, 4).map(function(e){ return e.x; });
  var fileUrl = safeHttps(m.file_url);
  var dlUrl = fileUrl;
  if(fileUrl && fileUrl.indexOf(CONFIG.supabaseUrl) === 0 && fileUrl.indexOf("/storage/v1/object/public/") !== -1){
    dlUrl = fileUrl + (fileUrl.indexOf("?") === -1 ? "?" : "&") + "download=" + encodeURIComponent(makeSlug(m.title) || "study-material") + ".pdf";
  }
  var crumbs = [];
  if(board) crumbs.push({label:"Boards", href:"/boards"}, {label:board.name, href:"/boards/" + board.slug});
  crumbs.push({label: cat ? cat.title : m.category_slug, href: (board ? "/" + board.slug : "") + "/" + m.category_slug});
  crumbs.push({label: typeLabel(m.type), href: (board ? "/" + board.slug : "") + "/" + m.category_slug + "/" + (m.type === "model-paper" ? "model-question-paper" : m.type)});
  crumbs.push({label: subject});
  var myRating = state.ratings[m.id] || 0;
  var comments = state.comments[m.id] || [];
  var stars = [1,2,3,4,5].map(function(n){ return '<button type="button" data-star="' + n + '" class="' + (n <= myRating ? "on" : "") + '" aria-label="Rate ' + n + ' star' + (n > 1 ? "s" : "") + '">★</button>'; }).join("");
  var commentHtml = comments.length ? comments.map(function(c){
    return '<div class="comment"><strong>' + esc(c.name || "Student") + '</strong><time>' + esc(c.when) + '</time><p>' + esc(c.text) + '</p></div>';
  }).join("") : '<p class="feedback-status">No comments yet. Be the first to share your thoughts.</p>';
  return '<div class="container page-content">' + breadcrumbs(crumbs) +
    '<div class="page-heading"><span class="eyebrow">' + esc(cat ? cat.title : m.category_slug) + (m.year ? " · " + esc(m.year) : "") + '</span><h1>' + esc(m.title) + '</h1><p>' + esc(m.description || "") + '</p></div>' +
    '<div class="detail-grid"><article class="panel"><h2>About this study material</h2><p>' + esc(m.description || "Study " + subject + " with this resource.") + '</p>' +
    (m.license_status === "not_verified" ? '<div class="notice">This is a sample resource listing. A downloadable file is not available until the owner adds an authorised PDF.</div>' : '') +
    '<div class="meta-list">' +
      (board ? '<div class="meta-item"><small>Board</small><strong>' + esc(board.name) + '</strong></div>' : '') +
      '<div class="meta-item"><small>Exam / class</small><strong>' + esc(cat ? cat.title : m.category_slug) + '</strong></div>' +
      '<div class="meta-item"><small>Subject</small><strong>' + esc(subject) + '</strong></div>' +
      '<div class="meta-item"><small>Material</small><strong>' + esc(typeLabel(m.type)) + '</strong></div>' +
      '<div class="meta-item"><small>Year</small><strong>' + esc(m.year || "All years") + '</strong></div></div>' +
    '<div class="detail-actions">' +
      (fileUrl ? '<a class="btn btn-primary" href="' + esc(dlUrl) + '" data-download="' + esc(m.id) + '">' + ICONS.download + '<span>Download PDF</span></a><a class="btn btn-outline" href="' + esc(fileUrl) + '" target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>'
               : '<button class="btn btn-primary" type="button" disabled title="The owner has not added an authorised file yet">PDF not available yet</button>') +
      '<a class="btn btn-telegram" href="' + CONFIG.telegramUrl + '" target="_blank" rel="noopener noreferrer">' + ICONS.tg + '<span>Open study bot</span></a>' +
      '<button class="btn btn-outline" type="button" data-copy-link>Copy page link</button></div>' +
    (fileUrl ? '<div class="pdf-preview"><iframe title="PDF preview — ' + esc(m.title) + '" src="' + esc(fileUrl) + '" loading="lazy"></iframe></div>' : '') +
    '<section class="feedback-panel" data-feedback="' + esc(m.id) + '"><div class="feedback-head"><div><h2>Student feedback</h2><p class="feedback-status" data-fb-status>' + (myRating ? "You rated this " + myRating + " out of 5 in this session. Thank you!" : "Rate this material, or leave a comment for other students.") + '</p></div></div>' +
      '<div class="stars" role="group" aria-label="Rate this material">' + stars + '</div>' +
      '<form class="feedback-form" data-comment-form><label for="c-name">Your name <span style="color:var(--faint)">(optional)</span></label><input id="c-name" name="display_name" maxlength="60" autocomplete="name" placeholder="Student">' +
      '<label for="c-text">Leave a comment</label><textarea id="c-text" name="comment" required maxlength="1000" placeholder="Was this material useful? Share your feedback…"></textarea>' +
      '<div><button class="btn btn-outline" type="submit">Post comment</button></div></form>' +
      '<div data-comments>' + commentHtml + '</div></section>' +
    '<div class="prev-next">' + (prev ? '<a class="btn btn-outline" href="#' + esc(materialPath(prev)) + '" data-link>← Previous material</a>' : '') + (next ? '<a class="btn btn-outline" href="#' + esc(materialPath(next)) + '" data-link>Next material →</a>' : '') + '</div>' +
    '</article>' +
    '<aside><section class="side-panel"><h2>Related materials</h2>' + (related.length ? '<div class="related-list">' + related.map(function(r){
      return '<a class="related-item" href="#' + esc(materialPath(r)) + '" data-link><strong>' + esc(r.title) + '</strong><small>' + esc(r.subject_name) + (r.year ? " · " + esc(r.year) : "") + " · " + esc(typeLabel(r.type)) + '</small></a>';
    }).join("") + '</div>' : '<p>More resources will appear here as they are added.</p>') + '</section>' +
    '<section class="side-panel"><h2>Share this page</h2><p>This permanent address can be sent directly in your Telegram bot.</p><div style="margin-top:12px"><button class="btn btn-outline btn-sm" type="button" data-copy-link>Copy page link</button></div></section></aside></div></div>';
}

"use strict";
var ADMIN_EMAIL = "ankitji933436@gmail.com"; /* from the site's config.js — used only to verify the admin account */
var POLICY = {
  about: { title:"About Study Hub Junction", description:"A student-first platform for notes, PYQs and exam preparation resources.",
    body:'<p>Study Hub Junction is a student-first learning platform for class notes, exam preparation materials, chapter-wise resources, model papers, solved papers and previous year questions for Classes 9–12, JEE Main, JEE Advanced, NEET and SSC. The structure is built for easy discovery, direct access and mobile-friendly study routines.</p><p>We aim to publish only resources that are original, authorised, appropriately licensed or in the public domain. Every material page is designed to be searchable, direct-link friendly and helpful for quick revision. If you spot a rights or accuracy concern, please contact the site owner.</p>' },
  contact: { title:"Contact us", description:"Get in touch with Study Hub Junction for study material support and feedback.",
    body:'<p>For questions, corrections, accessibility feedback, academic resource updates or copyright concerns, contact the site owner.</p><p>Email: <a href="mailto:' + CONFIG.contactEmail + '">' + CONFIG.contactEmail + '</a></p><p>Telegram study bot: <a href="' + CONFIG.telegramUrl + '" target="_blank" rel="noopener noreferrer">Open Study Hub Junction bot ↗</a></p><p>Telegram channel: <a href="' + CONFIG.telegramChannelUrl + '" target="_blank" rel="noopener noreferrer">Join Study Hub Junction channel ↗</a></p>' },
  "privacy-policy": { title:"Privacy policy", description:"How this website handles information.",
    body:'<h2>Information and search</h2><p>Search queries are used only to return published study materials. Admin sign-in and published study material are processed by Supabase according to its privacy policy. If you post material feedback, your comment, optional display name and submission time are stored with that material and shown publicly. Ratings are stored with the material and included in its public average.</p><h2>Analytics</h2><p>This site uses Google Analytics to measure visits and understand how visitors use the site. Google may collect usage and device information through cookies or similar technologies. Learn more in <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s Privacy Policy ↗</a>.</p><h2>Cookies and local storage</h2><p>The site uses browser storage for a signed-in admin session and to remember whether this device has rated a PDF. Analytics and advertising technologies may also use cookies or similar technologies.</p><h2>Advertising</h2><p>This site loads Google AdSense. Google and its partners may use cookies or similar technologies to serve and measure ads, subject to their policies. Learn more in <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google’s advertising policy ↗</a>.</p><h2>Your choices</h2><p>Do not include private or sensitive information in a public comment. You can clear site data in your browser settings. For privacy questions or to request removal of a comment, contact the site owner using the details on the contact page.</p>' },
  terms: { title:"Terms & conditions", description:"Terms for using Study Hub Junction.",
    body:'<h2>Use of the site</h2><p>Use this site lawfully and do not disrupt its operation, attempt unauthorised access, or misuse its content.</p><h2>Study materials</h2><p>Resources are provided for educational reference. The site owner is responsible for confirming permission, licences and attribution before publishing any file. Do not re-upload or redistribute a resource unless its rights permit it.</p><h2>Availability and accuracy</h2><p>Materials may be changed or removed. Exam information and study resources are not a substitute for official exam notices or professional advice. The site is provided without a guarantee that every resource is error-free or continuously available.</p><h2>Contact</h2><p>Contact the site owner through the official Telegram link or the contact page.</p>' },
  disclaimer: { title:"Disclaimer", description:"Important information about study resources.",
    body:'<p>Study Hub Junction is an independent educational resource directory and is not affiliated with or endorsed by any examination board, government department, school, coaching provider or university unless explicitly stated.</p><p>Names of exams, institutions and subjects are used only to identify relevant study resources. Always verify current syllabus, exam schedules and official requirements with the relevant authority.</p><p>PDFs and other third-party resources should be published only when the site owner has the necessary distribution rights. Contact the owner to report a suspected rights issue.</p>' }
};
function policyPage(key){
  var p = POLICY[key];
  return '<div class="container page-content">' + breadcrumbs([{label:p.title}]) +
    '<div class="page-heading"><span class="eyebrow">Study Hub Junction</span><h1>' + esc(p.title) + '</h1><p>' + esc(p.description) + '</p></div>' +
    '<article class="policy-panel">' + p.body + '</article></div>';
}
function notFoundPage(){
  return '<div class="container page-content">' + breadcrumbs([{label:"Page not found"}]) +
    emptyState("We couldn’t find that page", "The link may be out of date. Browse the classes and exams below to find the material you need.", "/") +
    '<section class="section"><div class="grid grid-4">' + visibleCategories().map(pathCard).join("") + '</div></section></div>';
}

/* ================= SEO files page ================= */
var SEO_FILES = [
  { name:"llms.txt", path:"assets/llms.txt", icon:"code", desc:"Tells AI assistants (ChatGPT, Claude, Gemini) what Study Hub Junction is, its sections and its popular material pages." },
  { name:"sitemap.xml", path:"assets/sitemap.xml", icon:"globe", desc:"Every public page — home, boards, classes, exams, materials and policies — for Google and Bing to crawl." },
  { name:"robots.txt", path:"assets/robots.txt", icon:"shield", desc:"Allows all public pages, keeps /admin and /search out of the index, and points crawlers to the sitemap." },
  { name:"BingSiteAuth.xml", path:"assets/BingSiteAuth.xml", icon:"check", desc:"Bing Webmaster Tools ownership file. Paste your Bing code inside it, then place it at the site root." }
];
function seoFilesPage(){
  var rows = SEO_FILES.map(function(f, i){
    return '<div class="file-row reveal"><span class="f-ic">' + ICONS[f.icon] + '</span><div><strong>' + esc(f.name) + '</strong><p>' + esc(f.desc) + '</p></div>' +
      '<div class="f-actions"><button class="btn btn-outline btn-sm" type="button" data-view-file="' + i + '">View</button><a class="btn btn-primary btn-sm" href="' + f.path + '" download="' + esc(f.name) + '">Download</a></div></div>';
  }).join("");
  return '<div class="container page-content">' + breadcrumbs([{label:"SEO files"}]) +
    '<div class="page-heading"><span class="eyebrow">Search &amp; AI discovery</span><h1>SEO files for this site</h1><p>Download these files and place them at the root of the deployed site (next to index.html) so search engines and AI assistants can find every page.</p></div>' +
    '<div class="file-pack">' + rows + '</div>' +
    '<div id="file-view-wrap" style="margin-top:16px" hidden><pre class="file-view" id="file-view" tabindex="0"></pre></div>' +
    '<section class="section"><div class="grid grid-2">' +
    '<div class="panel"><h2>Bing Webmaster Tools — 2 minute setup</h2><p>1. Open Bing Webmaster Tools and add <strong>study-hub-junction-eight.vercel.app</strong>.<br>2. Choose the <strong>XML file</strong> option and download BingSiteAuth.xml — or copy the meta tag code.<br>3. For the file option: replace the code inside the downloaded template here and put the file at the site root.<br>4. For the meta tag option: paste your code into the <code>msvalidate.01</code> tag in index.html (it is already in the head, marked with a comment).<br>5. Click <strong>Verify</strong> in Bing, then submit the sitemap URL.</p></div>' +
    '<div class="panel"><h2>Already active on this site</h2><p>Google Search Console verification, Google Analytics (GA4), Google Tag Manager and AdSense are connected with the site’s original IDs. Open Graph and Twitter cards use the official logo, and every page carries Schema.org structured data (WebSite, Organization, and LearningResource on material pages).</p></div>' +
    '</div></section></div>';
}

/* ================= Admin ================= */
var sessionPreview = false;
function healthRow(ok, title, desc){
  return '<div class="health-row"><span class="h-ic" style="color:' + (ok ? "var(--mint)" : "var(--gold-deep)") + '">' + (ok ? ICONS.check : ICONS.clock) + '</span><div><strong>' + esc(title) + '</strong><p>' + desc + '</p></div></div>';
}
function adminPage(){
  var user = state.adminUser;
  var inManager = user || sessionPreview;
  var html = '<div class="container page-content">' + breadcrumbs([{label:"Admin"}]) +
    '<div class="page-heading"><span class="eyebrow">Site owner tools</span><h1>Material dashboard</h1><p>Add, update and manage study materials. New pages get predictable URLs automatically.</p></div>';
  if(state.adminError) html += '<div class="error-banner" role="alert">' + esc(state.adminError) + '</div>';
  if(!inManager){
    html += '<div class="admin-layout"><section class="form-panel"><h2>Admin sign in</h2><p class="field-hint">Sign in with the administrator account configured in Supabase. Admin access is enforced by database policies.</p>' +
      '<form id="login-form"><div class="form-grid"><div class="field full"><label for="admin-email">Email</label><input id="admin-email" name="email" type="email" autocomplete="username" required></div>' +
      '<div class="field full"><label for="admin-password">Password</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required></div></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Sign in</button>' +
      '<button class="btn btn-outline" type="button" data-session-preview>Preview the manager in this tab</button></div>' +
      '<p class="field-hint" style="margin-top:10px">The preview manager runs only in this browser tab — materials you add there are not published until they are saved through the signed-in dashboard on the live site.</p></form></section>' +
      '<section class="form-panel"><h2>Site health</h2><div class="health-list">' +
      healthRow(true, "Google Search Console", "Verification tag connected — <code>9OMlhvTOkKKcQzEDEyai8x-kosGaONepYuMpAsrcFt4</code>") +
      healthRow(true, "Google Analytics + Tag Manager", "GA4 <code>G-7ERHRGQ8KY</code> · GTM <code>GTM-TCZ73NZS</code> · AdSense <code>ca-pub-8672957876641344</code>") +
      healthRow(true, "Open Graph & Twitter cards", "Live on every page with the Junction logo image (1600 × 1600).") +
      healthRow(true, "llms.txt · sitemap.xml · robots.txt", 'Ready to download from the <a class="text-link" href="#/seo-files" data-link>SEO files page</a> and place at the site root.') +
      healthRow(false, "Bing Webmaster Tools", 'Meta tag slot <code>msvalidate.01</code> is in the head — paste the site owner’s Bing code there, or upload BingSiteAuth.xml. Steps are on the SEO files page.') +
      healthRow(true, "Database", "Supabase project connected for published materials, storage bucket <code>study-materials</code> and admin sign-in.") +
      '</div></section></div>';
    return html;
  }
  var toolbar = '<div class="admin-toolbar"><span class="field-hint">' + (user ? "Signed in as " + esc(user.email || "administrator") : "Session preview — changes stay in this tab only") + '</span><span style="display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="btn btn-outline btn-sm" type="button" data-admin-refresh>Refresh list</button>' +
    '<button class="btn btn-outline btn-sm" type="button" data-admin-logout>Sign out</button></span></div>';
  html += toolbar + '<div class="admin-layout"><div>' +
    '<section class="form-panel"><h2 id="form-heading">Add a study material</h2>' + materialForm({}) + '</section>' +
    '<section class="form-panel"><h2>Site logo</h2><div class="logo-admin"><img data-logo src="' + esc(state.logoUrl) + '" alt="Current site logo" width="96" height="96"><div><p class="field-hint">The Junction logo — blue, green and orange open-book junction mark with “study hub junction” in dark blue — is the default logo in the header, hero, footer, favicon and Open Graph image. The other choices are kept safe here: Option 1 (Minimal), Option 2 (Shield), the previous redesigned cap-and-book logo, and the original circular logo. Changes here preview in this tab; publish the file as <strong>assets/logo.png</strong> on the live site to make a change permanent.</p><div class="form-actions"><label class="btn btn-outline btn-sm" for="logo-file">Upload new logo</label><input id="logo-file" type="file" accept="image/*" hidden><button class="btn btn-outline btn-sm" type="button" data-logo-reset>Use Junction logo (Option 3)</button><button class="btn btn-outline btn-sm" type="button" data-logo-option1>Option 1 — Minimal</button><button class="btn btn-outline btn-sm" type="button" data-logo-option2>Option 2 — Shield</button><button class="btn btn-outline btn-sm" type="button" data-logo-redesigned>Previous redesigned logo</button><button class="btn btn-outline btn-sm" type="button" data-logo-original>Restore original circular logo</button></div></div></div></section>' +
    '</div>' +
    '<section class="form-panel"><div class="admin-toolbar" style="margin-bottom:6px"><div><h2>Materials</h2><span class="field-hint">' + state.materials.length + ' item(s) in this view</span></div>' +
    '<label class="field"><span class="field-hint">View</span><select id="admin-filter"><option value="all">All</option><option value="published">Published</option><option value="draft">Drafts</option></select></label></div>' +
    '<div id="admin-list"></div></section></div>';
  return html;
}
function materialForm(item){
  item = item || {};
  var editing = Boolean(item.id);
  var catOpts = state.categories.map(function(c){ return '<option value="' + c.slug + '"' + (item.category_slug === c.slug ? " selected" : "") + '>' + esc(c.title) + '</option>'; }).join("");
  var boardOpts = '<option value="">No specific board</option>' + state.boards.map(function(b){ return '<option value="' + b.slug + '"' + (item.board_slug === b.slug ? " selected" : "") + '>' + esc(b.name) + '</option>'; }).join("");
  var licOpts = [["not_verified","Not verified — cannot publish"],["original","Original work"],["licensed","Licensed for distribution"],["public_domain","Public domain"]].map(function(o){ return '<option value="' + o[0] + '"' + ((item.license_status || "not_verified") === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("");
  var types = [["notes","Notes"],["short-notes","Short notes"],["pyqs","Previous year questions (PYQs)"],["model-paper","Model question paper"],["solved-paper","Solved paper"],["chapter","Chapter material"]].map(function(o){ return '<option value="' + o[0] + '"' + (item.type === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("");
  return '<form id="material-form" data-edit-id="' + esc(item.id || "") + '"><div class="form-grid">' +
    '<div class="field full"><label for="m-title">Material title *</label><input id="m-title" name="title" required maxlength="180" placeholder="NEET Biology PYQs 2025" value="' + esc(item.title || "") + '"></div>' +
    '<div class="field"><label for="m-cat">Exam / class *</label><select id="m-cat" name="category_slug" required>' + catOpts + '</select></div>' +
    '<div class="field"><label for="m-board">School board</label><select id="m-board" name="board_slug">' + boardOpts + '</select></div>' +
    '<div class="field"><label for="m-type">Material type *</label><select id="m-type" name="type">' + types + '</select></div>' +
    '<div class="field"><label for="m-subject">Subject *</label><input id="m-subject" name="subject_name" required maxlength="80" placeholder="Biology" value="' + esc(item.subject_name || "") + '"></div>' +
    '<div class="field"><label for="m-year">Year</label><input id="m-year" name="year" placeholder="2025 or 2025-26" pattern="\\d{4}(-\\d{2})?" value="' + esc(item.year || "") + '"></div>' +
    '<div class="field"><label for="m-chapter">Chapter slug (class pages)</label><input id="m-chapter" name="chapter_slug" maxlength="80" placeholder="chapter-1" value="' + esc(item.chapter_slug || "") + '"></div>' +
    '<div class="field full"><label for="m-desc">Description *</label><textarea id="m-desc" name="description" required maxlength="2000">' + esc(item.description || "") + '</textarea></div>' +
    '<div class="field full"><label for="m-url">PDF / file URL (HTTPS)</label><input id="m-url" name="file_url" type="url" placeholder="https://…" value="' + esc(item.file_url || "") + '"><span class="field-hint">On the live site, PDFs up to 25 MB upload to Supabase Storage (bucket “study-materials”). Here, paste a direct HTTPS PDF link.</span></div>' +
    '<div class="field full"><label for="m-tags">Tags (comma separated)</label><input id="m-tags" name="tags" placeholder="NEET, Biology, PYQ" value="' + esc((item.tags || []).join(", ")) + '"></div>' +
    '<div class="field full"><label for="m-license">Source / redistribution permission *</label><select id="m-license" name="license_status" required>' + licOpts + '</select></div>' +
    '<div class="field full"><label class="form-check"><input name="is_published" type="checkbox"' + (item.is_published ? " checked" : "") + '><span>Publish this material (requires a verified right to distribute)</span></label></div>' +
    '<div class="field full"><span class="field-hint">Permanent URL (generated automatically): <strong id="generated-path">' + (editing ? esc(materialPath(item)) : "Choose the fields above") + '</strong></span></div>' +
    '</div><div class="form-actions"><button class="btn btn-primary" type="submit">' + (editing ? "Save changes" : "Add material") + '</button><button class="btn btn-outline" type="reset">Clear form</button></div></form>';
}
function adminListMarkup(){
  var target = $("#admin-list"); if(!target) return;
  var filter = ($("#admin-filter") && $("#admin-filter").value) || "all";
  var items = state.materials.filter(function(m){ return filter === "all" || (filter === "published" ? m.is_published : !m.is_published); });
  target.innerHTML = items.length ? items.map(function(m){
    return '<div class="admin-item"><div><h3>' + esc(m.title) + '</h3><small>' + esc(materialPath(m)) + ' · ' + (m.is_published ? "Published" : "Draft") + ' · ' + esc(m.license_status || "not verified") + '</small></div>' +
      '<div class="admin-actions"><button class="small-btn" type="button" data-edit="' + esc(m.id) + '">Edit</button>' +
      '<button class="small-btn" type="button" data-toggle="' + esc(m.id) + '">' + (m.is_published ? "Unpublish" : "Publish") + '</button>' +
      '<button class="small-btn danger" type="button" data-delete="' + esc(m.id) + '">Delete</button></div></div>';
  }).join("") : '<div class="empty-state"><h2>No materials yet</h2><p>Add a resource using the form.</p></div>';
}
function slugForFields(f){
  var bp = f.board_slug ? "/" + f.board_slug : "";
  var subject = makeSlug(f.subject_name || "subject");
  if(f.type === "chapter" && f.chapter_slug) return bp + "/" + f.category_slug + "/" + subject + "/" + makeSlug(f.chapter_slug);
  if(f.type === "pyqs") return bp + "/" + f.category_slug + "/pyqs/" + (f.year || "all-years") + "/" + subject;
  if(f.type === "model-paper") return bp + "/" + f.category_slug + "/model-question-paper/" + (f.year || "all-years") + "/" + subject;
  if(f.type === "solved-paper") return bp + "/" + f.category_slug + "/solved-paper/" + (f.year || "all-years") + "/" + subject;
  return bp + "/" + f.category_slug + "/" + f.type + "/" + subject;
}

"use strict";
/* ================= Router + SEO ================= */
var mainEl = document.getElementById("main");
var lastAnalyticsPage = "";
function parseHash(){
  var raw = (location.hash || "#/").replace(/^#/, "");
  if(!raw) raw = "/";
  var qIndex = raw.indexOf("?");
  var path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  var query = new URLSearchParams(qIndex === -1 ? "" : raw.slice(qIndex + 1));
  if(path.length > 1) path = path.replace(/\/+$/, "");
  if(path === "/boards/jac") path = "/boards/jac-board";
  if(path === "/jac" || path.indexOf("/jac/") === 0) path = "/jac-board" + path.slice(4);
  return { path: path || "/", query: query };
}
function setMeta(attr, name, content){
  var node = document.querySelector("meta[" + attr + '="' + name + '"]');
  if(!node){ node = document.createElement("meta"); node.setAttribute(attr, name); document.head.appendChild(node); }
  node.setAttribute("content", content);
}
function setPageSeo(title, description, route, ld){
  var full = /study hub junction/i.test(title) ? title : title + " | Study Hub Junction";
  document.title = full;
  setMeta("name", "description", description);
  setMeta("property", "og:title", full);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", canonicalFor(route));
  setMeta("name", "twitter:title", full);
  setMeta("name", "twitter:description", description);
  var priv = route === "/admin" || route === "/search";
  setMeta("name", "robots", priv ? "noindex,follow" : "index,follow,max-image-preview:large");
  var link = document.querySelector('link[rel="canonical"]');
  if(link) link.setAttribute("href", canonicalFor(route));
  var old = document.getElementById("page-structured-data");
  if(old) old.remove();
  if(ld){
    var s = document.createElement("script");
    s.type = "application/ld+json"; s.id = "page-structured-data";
    s.textContent = JSON.stringify(ld).replace(/</g, "\\u003c");
    document.head.appendChild(s);
  }
  var page = route + (location.hash.indexOf("?") !== -1 ? location.hash.slice(location.hash.indexOf("?")) : "");
  if(page !== lastAnalyticsPage && typeof window.gtag === "function"){
    lastAnalyticsPage = page;
    try{ window.gtag("event", "page_view", { page_title: document.title, page_path: page }); }catch(e){}
  }
}
function breadcrumbLd(items){
  return { "@context":"https://schema.org", "@type":"BreadcrumbList", "itemListElement": items.map(function(it, i){
    return { "@type":"ListItem", "position": i + 1, "name": it[0], "item": canonicalFor(it[1]) };
  })};
}
function pageData(route, query){
  if(route === "/") return { html: homePage(), title:"Study Hub Junction — learn with confidence", description:"Find class notes, exam preparation resources and previous year questions on Study Hub Junction." };
  if(route === "/boards") return { html: boardsPage(null), title:"Choose your school board", description:"Browse board-specific study materials for CBSE, JAC Board, Bihar Board and more.", ld: breadcrumbLd([["Home","/"],["School boards","/boards"]]) };
  if(route.indexOf("/boards/") === 0){
    var b = boardBySlug(route.split("/").filter(Boolean)[1]);
    if(b) return { html: boardsPage(b), title: b.name + " study materials", description: "Choose a class to browse " + b.name + " study resources.", ld: breadcrumbLd([["Home","/"],["Boards","/boards"],[b.name, "/boards/" + b.slug]]) };
  }
  if(route === "/search"){
    var q = query.get("q") || "";
    return { html: searchPage(q), title: q ? "Search: " + q : "Search study material", description:"Search study materials by exam, class, subject, year or topic." };
  }
  if(route === "/admin") return { html: adminPage(), title:"Material dashboard", description:"Manage study material listings." };
  if(route === "/seo-files") return { html: seoFilesPage(), title:"SEO files — llms.txt, sitemap, robots.txt", description:"Download llms.txt, sitemap.xml, robots.txt and BingSiteAuth.xml for Study Hub Junction." };
  var mat = null;
  publicMaterials().forEach(function(m){ if(materialPath(m) === route) mat = m; });
  if(!mat) state.materials.forEach(function(m){ if(materialPath(m) === route) mat = m; });
  if(mat){
    var cat = catBySlug(mat.category_slug);
    var ld = { "@context":"https://schema.org", "@type":"LearningResource", "name": mat.title,
      "description": mat.seo_description || mat.description, "learningResourceType": mat.type === "pyqs" ? "Practice problem" : "Study guide",
      "educationalLevel": cat ? cat.title : mat.category_slug, "inLanguage":"en", "url": canonicalFor(route), "isAccessibleForFree": true,
      "breadcrumb": breadcrumbLd([["Home","/"],[cat ? cat.title : mat.category_slug, "/" + mat.category_slug],[mat.title, route]]) };
    return { html: detailPage(mat), title: mat.seo_title || mat.title, description: mat.seo_description || mat.description, ld: ld };
  }
  var pr = parseRoute(route);
  var catSlug = pr.parts[pr.idx];
  var cat = catSlug ? catBySlug(catSlug) : null;
  if(cat){
    return { html: categoryPage(cat, route), title: (pr.board ? pr.board.name + " " : "") + cat.title + " study material", description: "Explore " + cat.title + " notes, PYQs and topic-wise resources on Study Hub Junction.",
      ld: breadcrumbLd([["Home","/"],[cat.title, "/" + cat.slug]]) };
  }
  var key = route.slice(1);
  if(POLICY[key]) return { html: policyPage(key), title: POLICY[key].title, description: POLICY[key].description };
  return { html: notFoundPage(), title:"Page not found", description:"The requested page could not be found." };
}
function sectionKey(route){
  if(route === "/") return "home";
  if(route.indexOf("/search") === 0) return "search";
  if(route === "/boards" || route.indexOf("/boards/") === 0) return "boards";
  if(route === "/about") return "about";
  var pr = parseRoute(route);
  var slug = pr.parts[pr.idx] || pr.parts[0];
  var cat = slug ? catBySlug(slug) : null;
  if(cat && cat.kind === "Class") return "classes";
  if(slug && slug.indexOf("jee") === 0) return "jee";
  if(slug === "neet") return "neet";
  return null;
}
var revealObserver = null;
function bindReveals(){
  var els = $all(".reveal");
  if(!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    els.forEach(function(el){ el.classList.add("in"); }); return;
  }
  if(revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); revealObserver.unobserve(en.target); } });
  }, { threshold: 0.08 });
  els.forEach(function(el){ revealObserver.observe(el); });
}
function applyLogo(){
  $all("[data-logo]").forEach(function(img){ img.src = state.logoUrl; });
}
function render(){
  var parsed = parseHash();
  var page = pageData(parsed.path, parsed.query);
  mainEl.innerHTML = page.html;
  setPageSeo(page.title, page.description, parsed.path, page.ld);
  var key = sectionKey(parsed.path);
  $all("[data-nav-key]").forEach(function(a){
    if(a.getAttribute("data-nav-key") === key) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  var nav = $("#main-nav"); if(nav) nav.classList.remove("open");
  var toggle = $("#menu-toggle"); if(toggle){ toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Open navigation"); }
  applyLogo();
  bindReveals();
  bindAdmin();
  if(parsed.path === "/admin") adminListMarkup();
  window.scrollTo({ top: 0, behavior: "auto" });
}

/* ================= Admin actions ================= */
function supabaseSignIn(email, password){
  return fetch(CONFIG.supabaseUrl.replace(/\/+$/, "") + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  }).then(function(res){
    return res.json().then(function(data){
      if(!res.ok) throw new Error(data.msg || data.message || "Sign-in failed. Check your email and password.");
      return data;
    });
  });
}
function checkAdminUser(){
  if(!state.adminSession) return Promise.resolve();
  return fetch(CONFIG.supabaseUrl.replace(/\/+$/, "") + "/auth/v1/user", {
    headers: { apikey: CONFIG.supabaseAnonKey, Authorization: "Bearer " + state.adminSession.access_token }
  }).then(function(res){
    if(!res.ok) throw new Error("Session expired.");
    return res.json();
  }).then(function(user){
    var isRole = user.app_metadata && user.app_metadata.role === "admin";
    var emailOk = !ADMIN_EMAIL || (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if(isRole && emailOk){ state.adminUser = user; state.adminError = ""; }
    else { state.adminSession = null; state.adminError = "This account is not authorised as a site administrator."; }
  }).catch(function(){ state.adminSession = null; state.adminUser = null; });
}
function updateGeneratedPath(form){
  var v = new FormData(form);
  var label = form.querySelector("#generated-path");
  if(label) label.textContent = slugForFields({
    category_slug: v.get("category_slug"), board_slug: v.get("board_slug"), type: v.get("type"),
    subject_name: v.get("subject_name") || "subject", year: v.get("year"), chapter_slug: v.get("chapter_slug")
  });
}
function saveMaterialFromForm(form){
  var v = new FormData(form);
  var editId = form.getAttribute("data-edit-id");
  var yearRaw = String(v.get("year") || "").trim();
  var payload = {
    category_slug: String(v.get("category_slug") || ""), board_slug: String(v.get("board_slug") || "") || null,
    type: String(v.get("type") || "notes"), subject_name: String(v.get("subject_name") || "").trim(),
    year: yearRaw ? (/^\d{4}$/.test(yearRaw) ? Number(yearRaw) : yearRaw) : null,
    chapter_slug: String(v.get("chapter_slug") || "").trim() ? makeSlug(String(v.get("chapter_slug"))) : null,
    title: String(v.get("title") || "").trim(), description: String(v.get("description") || "").trim(),
    file_url: String(v.get("file_url") || "").trim(),
    tags: String(v.get("tags") || "").split(",").map(function(t){ return t.trim(); }).filter(Boolean).slice(0, 20),
    license_status: String(v.get("license_status") || "not_verified"),
    is_published: v.get("is_published") === "on",
    updated_at: new Date().toISOString()
  };
  if(!payload.title || !payload.subject_name || !payload.description) throw new Error("Title, subject and description are required.");
  if(payload.file_url && !safeHttps(payload.file_url)) throw new Error("The file link must use HTTPS.");
  if(payload.is_published && ["original","licensed","public_domain"].indexOf(payload.license_status) === -1) throw new Error("Confirm that you have the right to distribute this material before publishing.");
  payload.subject_slug = makeSlug(payload.subject_name);
  var newPath = slugForFields({ category_slug: payload.category_slug, board_slug: payload.board_slug, type: payload.type, subject_name: payload.subject_name, year: payload.year, chapter_slug: payload.chapter_slug });
  var collision = state.materials.filter(function(m){ return materialPath(m) === newPath && m.id !== editId; })[0];
  if(collision) throw new Error("That URL is already in use. Choose a different subject or chapter.");
  if(state.adminUser && !sessionPreview){
    var body = JSON.stringify({
      category_slug: payload.category_slug, board_slug: payload.board_slug, type: payload.type,
      subject_name: payload.subject_name, subject_slug: payload.subject_slug, year: payload.year ? String(payload.year) : null,
      chapter_slug: payload.chapter_slug, title: payload.title, description: payload.description,
      file_url: payload.file_url || null, tags: payload.tags, license_status: payload.license_status,
      license_note: "Added from redesigned dashboard", is_published: payload.is_published,
      slug: newPath.replace(/^\//, "")
    });
    var req = editId
      ? sbFetch("materials?id=eq." + encodeURIComponent(editId), { method: "PATCH", headers: { Prefer: "return=representation" }, body: body })
      : sbFetch("materials", { method: "POST", headers: { Prefer: "return=representation" }, body: body });
    return req.then(function(){ return hydrateFromSupabase(); });
  }
  if(editId){
    state.materials = state.materials.map(function(m){ return m.id === editId ? Object.assign({}, m, payload) : m; });
  } else {
    payload.id = "local-" + Date.now();
    payload.seo_title = ""; payload.seo_description = "";
    state.materials.unshift(payload);
  }
  return Promise.resolve();
}
function bindAdmin(){
  var login = $("#login-form");
  if(login) login.addEventListener("submit", function(ev){
    ev.preventDefault();
    var fd = new FormData(login);
    var email = String(fd.get("email") || "").trim(), password = String(fd.get("password") || "");
    if(ADMIN_EMAIL && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()){
      state.adminError = "This email does not match the configured admin email. Use the admin account for this deployment.";
      render(); return;
    }
    var btn = login.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Signing in…";
    supabaseSignIn(email, password).then(function(session){
      state.adminSession = session;
      return checkAdminUser();
    }).then(function(){
      if(state.adminUser){ sessionPreview = false; toast("Signed in successfully."); }
      render();
    }).catch(function(err){
      state.adminError = "Could not sign in: " + err.message;
      render();
    });
  });
  var form = $("#material-form");
  if(form){
    form.addEventListener("input", function(){ updateGeneratedPath(form); });
    form.addEventListener("change", function(){ updateGeneratedPath(form); });
    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Saving…";
      Promise.resolve().then(function(){ return saveMaterialFromForm(form); }).then(function(){
        toast("Material saved."); render();
      }).catch(function(err){ btn.disabled = false; btn.textContent = "Save material"; toast(err.message, true); });
    });
  }
  var filter = $("#admin-filter");
  if(filter) filter.addEventListener("change", adminListMarkup);
  var logoFile = $("#logo-file");
  if(logoFile) logoFile.addEventListener("change", function(){
    var f = logoFile.files && logoFile.files[0]; if(!f) return;
    var reader = new FileReader();
    reader.onload = function(){ state.logoUrl = String(reader.result); applyLogo(); toast("Logo updated for this session. Publish the file as assets/logo.png to make it permanent."); };
    reader.readAsDataURL(f);
  });
}

/* ================= Global events ================= */
document.addEventListener("submit", function(ev){
  var form = ev.target;
  if(!(form instanceof HTMLFormElement)) return;
  if(form.matches("[data-search-form]")){
    ev.preventDefault();
    var q = String(new FormData(form).get("q") || "").trim();
    var target = "#/search" + (q ? "?q=" + encodeURIComponent(q) : "");
    if(location.hash === target) render(); else location.hash = target;
    return;
  }
  if(form.matches("[data-comment-form]")){
    ev.preventDefault();
    var panel = form.closest("[data-feedback]");
    var mid = panel.getAttribute("data-feedback");
    var fd = new FormData(form);
    var text = String(fd.get("comment") || "").trim();
    if(!text) return;
    if(!state.comments[mid]) state.comments[mid] = [];
    state.comments[mid].unshift({ name: String(fd.get("display_name") || "").trim(), text: text, when: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }) });
    var wrap = panel.querySelector("[data-comments]");
    wrap.innerHTML = state.comments[mid].map(function(c){
      return '<div class="comment"><strong>' + esc(c.name || "Student") + '</strong><time>' + esc(c.when) + '</time><p>' + esc(c.text) + '</p></div>';
    }).join("");
    form.reset();
    toast("Your comment has been posted.");
  }
});
document.addEventListener("click", function(ev){
  var t = ev.target instanceof Element ? ev.target : null;
  if(!t) return;
  var star = t.closest("[data-star]");
  if(star){
    var panel = star.closest("[data-feedback]");
    var mid = panel.getAttribute("data-feedback");
    var val = Number(star.getAttribute("data-star"));
    state.ratings[mid] = val;
    panel.querySelectorAll("[data-star]").forEach(function(b){ b.classList.toggle("on", Number(b.getAttribute("data-star")) <= val); });
    var status = panel.querySelector("[data-fb-status]");
    if(status) status.textContent = "You rated this " + val + " out of 5 in this session. Thank you!";
    toast("Thanks for your rating!");
    return;
  }
  if(t.closest("[data-copy-link]")){
    var parsed = parseHash();
    var url = canonicalFor(parsed.path);
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){ toast("Page link copied."); }, function(){ toast("Copy this link: " + url, true); });
    } else toast("Copy this link: " + url, true);
    return;
  }
  if(t.closest("[data-download]")){ toast("Your PDF download has started."); return; }
  if(t.closest("[data-session-preview]")){ sessionPreview = true; state.adminError = ""; render(); return; }
  if(t.closest("[data-admin-logout]")){ state.adminUser = null; state.adminSession = null; sessionPreview = false; render(); toast("Signed out."); return; }
  if(t.closest("[data-admin-refresh]")){
    if(state.adminUser && !sessionPreview){ hydrateFromSupabase().then(function(){ toast("Material list refreshed."); }); }
    else { adminListMarkup(); toast("Material list refreshed."); }
    return;
  }
  if(t.closest("[data-logo-reset]")){ state.logoUrl = CONFIG.defaultLogo; applyLogo(); toast("Junction logo is now active."); return; }
  if(t.closest("[data-logo-option1]")){ state.logoUrl = CONFIG.option1Logo; applyLogo(); toast("Option 1 — Minimal logo is now active."); return; }
  if(t.closest("[data-logo-option2]")){ state.logoUrl = CONFIG.option2Logo; applyLogo(); toast("Option 2 — Shield logo is now active."); return; }
  if(t.closest("[data-logo-redesigned]")){ state.logoUrl = CONFIG.redesignedLogo; applyLogo(); toast("Previous redesigned logo is now active."); return; }
  if(t.closest("[data-logo-original]")){ state.logoUrl = CONFIG.originalLogo; applyLogo(); toast("Original circular logo restored."); return; }
  var vf = t.closest("[data-view-file]");
  if(vf){
    var f = SEO_FILES[Number(vf.getAttribute("data-view-file"))];
    var wrap = $("#file-view-wrap"), pre = $("#file-view");
    wrap.hidden = false; pre.textContent = "Loading " + f.name + "…";
    fetch(f.path).then(function(r){ if(!r.ok) throw new Error("nf"); return r.text(); }).then(function(text){
      pre.textContent = text;
    }).catch(function(){ pre.textContent = "Preview could not load here — use the Download button to get " + f.name + "."; });
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  var editBtn = t.closest("[data-edit]");
  if(editBtn){
    var item = state.materials.filter(function(m){ return m.id === editBtn.getAttribute("data-edit"); })[0];
    if(item){
      var old = $("#material-form");
      var tmp = document.createElement("template");
      tmp.innerHTML = materialForm(item);
      old.replaceWith(tmp.content.firstElementChild);
      var heading = $("#form-heading"); if(heading) heading.textContent = "Edit study material";
      bindAdmin();
      var nf = $("#material-form"); if(nf) updateGeneratedPath(nf);
      nf.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }
  var toggleBtn = t.closest("[data-toggle]");
  if(toggleBtn){
    var it2 = state.materials.filter(function(m){ return m.id === toggleBtn.getAttribute("data-toggle"); })[0];
    if(!it2) return;
    var publish = !it2.is_published;
    if(publish && ["original","licensed","public_domain"].indexOf(it2.license_status) === -1){
      toast("Verify distribution permission before publishing this material.", true); return;
    }
    if(state.adminUser && !sessionPreview){
      sbFetch("materials?id=eq." + encodeURIComponent(it2.id), { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ is_published: publish }) })
        .then(function(){ return hydrateFromSupabase(); }).then(function(){ toast(publish ? "Material published." : "Material unpublished."); })
        .catch(function(err){ toast(err.message, true); });
    } else {
      it2.is_published = publish; render(); toast(publish ? "Material published." : "Material unpublished.");
    }
    return;
  }
  var delBtn = t.closest("[data-delete]");
  if(delBtn){
    var it3 = state.materials.filter(function(m){ return m.id === delBtn.getAttribute("data-delete"); })[0];
    if(!it3) return;
    var box = document.createElement("div");
    box.className = "toast error";
    box.innerHTML = "Delete “" + esc(it3.title) + "”? <button type='button' class='small-btn' data-confirm-delete='" + esc(it3.id) + "'>Yes, delete</button>";
    $("#toast-region").replaceChildren(box);
    return;
  }
  var conf = t.closest("[data-confirm-delete]");
  if(conf){
    var id = conf.getAttribute("data-confirm-delete");
    if(state.adminUser && !sessionPreview){
      sbFetch("materials?id=eq." + encodeURIComponent(id), { method: "DELETE" })
        .then(function(){ return hydrateFromSupabase(); }).then(function(){ toast("Material deleted."); })
        .catch(function(err){ toast(err.message, true); });
    } else {
      state.materials = state.materials.filter(function(m){ return m.id !== id; });
      render(); toast("Material deleted.");
    }
  }
});
var menuToggle = document.getElementById("menu-toggle");
menuToggle.addEventListener("click", function(){
  var nav = document.getElementById("main-nav");
  var open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
window.addEventListener("hashchange", render);
window.addEventListener("scroll", function(){
  var h = document.getElementById("site-header");
  if(h) h.classList.toggle("scrolled", window.scrollY > 8);
}, { passive: true });
window.addEventListener("error", function(e){ if(e && e.error) console.error("Study Hub Junction error:", e.error); });

/* ================= Start ================= */
render();
hydrateFromSupabase();
