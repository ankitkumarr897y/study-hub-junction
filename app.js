import { categories, demoMaterials, makeSlug, materialPath } from "./materials.js";

const config = window.STUDY_HUB_CONFIG || {};
let siteCategories = [...categories];
let categoryBySlug = new Map(siteCategories.map((category) => [category.slug, category]));
const storageKey = "study-hub-demo-materials-v1";
const categoryStorageKey = "study-hub-demo-categories-v1";
const sessionKey = "study-hub-admin-session-v1";
const publicPageSize = 40;
const maxPdfBytes = 25 * 1024 * 1024;
const storageBucket = "study-materials";
const materialColumns = "id,category_slug,subject_slug,subject_name,chapter_slug,type,year,slug,title,description,file_url,thumbnail_url,tags,seo_title,seo_description,license_status,license_note,is_published,created_at,updated_at";
const main = document.querySelector("#main");
const toastRegion = document.querySelector("#toast-region");
const safeTelegramUrl = getSafeExternalUrl(config.telegramUrl) || "";
const appBase = detectAppBase();
let localMaterials = null;
let currentRoute = "/";
let toastTimer;
let remoteError = "";
let adminUser = null;
let adminMaterials = [];
let adminMaterialsLoaded = false;
const categoryPageCache = new Map();
const searchResultCache = new Map();
const routeLoadsInFlight = new Set();

function detectAppBase() {
  const configuredBase = typeof config.basePath === "string" ? config.basePath.replace(/\/+$/, "") : "";
  if (configuredBase && location.pathname.startsWith(`${configuredBase}/`)) return configuredBase;
  if (configuredBase && location.pathname === configuredBase) return configuredBase;
  return "";
}

async function uploadPdf(file, categorySlug) {
  if (!isSupabaseReady() || !adminUser) throw new Error("Sign in with a configured Supabase admin account to upload PDF files.");
  if (!(file instanceof File) || !file.size) throw new Error("Choose a PDF file to upload.");
  if (file.size > maxPdfBytes) throw new Error("This PDF is larger than 25 MB. Please choose a smaller file.");
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files can be uploaded here.");
  }
  const session = await refreshSessionIfNeeded();
  const objectPath = `${categorySlug}/${crypto.randomUUID()}.pdf`;
  const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${storageBucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/pdf",
      "x-upsert": "false"
    },
    body: file
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || "The PDF upload failed. Check your storage setup and try again.");
  }
  const fileUrl = `${config.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${storageBucket}/${objectPath}`;
  return { fileUrl, objectPath };
}

async function removeUploadedPdf(objectPath) {
  if (!isSupabaseReady() || !adminUser || !objectPath) return;
  const session = await refreshSessionIfNeeded();
  const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${storageBucket}/${objectPath}`, {
    method: "DELETE",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`
    }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || "The file could not be removed from storage.");
  }
}

function uploadedObjectPath(fileUrl) {
  if (!fileUrl || !isSupabaseReady()) return null;
  try {
    const file = new URL(fileUrl);
    const project = new URL(config.supabaseUrl);
    const prefix = `/storage/v1/object/public/${storageBucket}/`;
    if (file.origin !== project.origin || !file.pathname.startsWith(prefix)) return null;
    return file.pathname.slice(prefix.length).split("/").map((part) => decodeURIComponent(part)).join("/");
  } catch {
    return null;
  }
}

function routeIsPrivate(route) {
  return route === "/admin" || route.startsWith("/search");
}

function setCategories(items) {
  siteCategories = items;
  categoryBySlug = new Map(items.map((category) => [category.slug, category]));
}

function activeCategories() {
  return siteCategories;
}

function loadDemoCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(categoryStorageKey) || "[]");
    if (Array.isArray(saved)) {
      const existing = new Set(siteCategories.map((category) => category.slug));
      setCategories([...siteCategories, ...saved.filter((category) => !existing.has(category.slug))]);
    }
  } catch (error) {
    console.error("Could not load locally saved demo categories.", error);
    notify("Saved demo categories could not be loaded.", true);
  }
}

function mergePublicMaterials(rows) {
  const known = new Map(allPublicMaterials().map((item) => [item.id, item]));
  for (const row of rows) {
    const item = normalizeMaterial(row);
    known.set(item.id, item);
  }
  localMaterials = [...known.values()];
}

async function fetchCategoryPage(route, offset = 0) {
  const parts = route.split("/").filter(Boolean);
  const params = new URLSearchParams({
    select: materialColumns,
    category_slug: `eq.${parts[0]}`,
    is_published: "eq.true",
    order: "updated_at.desc",
    limit: String(publicPageSize),
    offset: String(offset)
  });
  const section = parts[1];
  if (section === "notes" || section === "pyqs" || section === "chapter" || section === "chapters") {
    params.set("type", `eq.${section === "chapters" ? "chapter" : section}`);
    if (section === "pyqs" && /^\d{4}$/.test(parts[2] || "")) {
      params.set("year", `eq.${parts[2]}`);
      if (parts[3]) params.set("subject_slug", `eq.${parts[3]}`);
    } else if (parts[2]) {
      params.set("subject_slug", `eq.${parts[2]}`);
    }
  } else if (parts[1]) {
    params.set("subject_slug", `eq.${parts[1]}`);
  }
  const rows = await supabaseRequest(`materials?${params}`);
  const items = rows.map(normalizeMaterial);
  mergePublicMaterials(items);
  const previous = categoryPageCache.get(route)?.items || [];
  const merged = offset ? [...previous, ...items] : items;
  categoryPageCache.set(route, { items: merged, hasMore: items.length === publicPageSize });
  return items;
}

async function loadRouteData(route) {
  if (!isSupabaseReady()) return;
  if (route === "/admin" && adminUser && !adminMaterialsLoaded) {
    if (routeLoadsInFlight.has("admin-materials")) return;
    routeLoadsInFlight.add("admin-materials");
    try {
      adminMaterials = await loadAdminMaterials();
      adminMaterialsLoaded = true;
      remoteError = "";
      if (routeFromLocation() === "/admin") render();
    } catch (error) {
      remoteError = `Could not load admin materials: ${error.message}`;
      console.error(remoteError, error);
      if (routeFromLocation() === "/admin") render();
    } finally {
      routeLoadsInFlight.delete("admin-materials");
    }
    return;
  }
  const query = new URLSearchParams(location.search).get("q")?.trim() || "";
  const loadKey = query && route.startsWith("/search")
    ? `search:${query}`
    : `${route.split("?")[0]}`;
  if (routeLoadsInFlight.has(loadKey)) return;
  if (query && route.startsWith("/search") && searchResultCache.has(query)) return;
  const parts = route.split("?")[0].split("/").filter(Boolean);
  if (!query && parts.length === 0) return;
  if (!query && categoryBySlug.has(parts[0]) && categoryPageCache.has(route.split("?")[0])) return;
  if (!query && parts.length > 1 && allPublicMaterials().some((item) => materialPath(item) === route.split("?")[0])) return;
  routeLoadsInFlight.add(loadKey);
  try {
    if (query && route.startsWith("/search")) {
      const rows = await supabaseRequest("rpc/search_materials", {
        method: "POST",
        body: JSON.stringify({ search_query: query, result_limit: 30, result_offset: 0 })
      });
      const items = rows.map(normalizeMaterial);
      searchResultCache.set(query, items);
      mergePublicMaterials(items);
    } else if (parts.length > 1 && categoryBySlug.has(parts[0])) {
      const slug = parts.slice(1).join("/");
      const params = new URLSearchParams({ select: materialColumns, slug: `eq.${slug}`, is_published: "eq.true", limit: "1" });
      const direct = (await supabaseRequest(`materials?${params}`)).map(normalizeMaterial);
      if (direct.length) {
        mergePublicMaterials(direct);
      } else {
        await fetchCategoryPage(route.split("?")[0]);
      }
    } else if (parts.length === 1 && categoryBySlug.has(parts[0])) {
      await fetchCategoryPage(route.split("?")[0]);
    }
    remoteError = "";
    if (routeFromLocation() === route.split("?")[0] || routeFromLocation() === route) render();
  } catch (error) {
    remoteError = `Could not load this selection: ${error.message}`;
    console.error(remoteError, error);
    if (routeFromLocation().split("?")[0] === route.split("?")[0]) render();
  } finally {
    routeLoadsInFlight.delete(loadKey);
  }
}

function pathFor(route) {
  return `${appBase}${route.startsWith("/") ? route : `/${route}`}` || "/";
}

function routeFromLocation() {
  const params = new URLSearchParams(location.search);
  const restored = params.get("__route");
  if (restored) {
    const clean = restored.startsWith("/") ? restored : `/${restored}`;
    params.delete("__route");
    const suffix = params.toString();
    history.replaceState({}, "", `${pathFor(clean)}${suffix ? `?${suffix}` : ""}`);
    return clean;
  }
  let path = location.pathname;
  if (appBase && path.startsWith(appBase)) path = path.slice(appBase.length) || "/";
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function getSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function isSupabaseReady() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

function notify(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " error" : ""}`;
  toast.textContent = message;
  toastRegion.replaceChildren(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 4200);
}

function demoStore() {
  if (localMaterials) return localMaterials;
  try {
    const saved = localStorage.getItem(storageKey);
    localMaterials = saved ? JSON.parse(saved) : [...demoMaterials];
    if (!Array.isArray(localMaterials)) throw new Error("Invalid local demo data");
  } catch (error) {
    console.error("Could not read local demo materials.", error);
    localMaterials = [...demoMaterials];
    notify("Demo materials could not be loaded from this browser. Showing examples instead.", true);
  }
  return localMaterials;
}

function allPublicMaterials() {
  const items = demoStore().filter((item) => item.is_published !== false);
  return items;
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(sessionKey) || "null");
  } catch {
    return null;
  }
}

function setSession(session) {
  if (!session) {
    sessionStorage.removeItem(sessionKey);
    return;
  }
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
}

async function refreshSessionIfNeeded() {
  const session = getSession();
  if (!session || !session.refresh_token || session.expires_at > Date.now() / 1000 + 60) return session;
  const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, "")}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: config.supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  const data = await response.json();
  if (!response.ok) {
    setSession(null);
    throw new Error(data.msg || data.message || "Your admin session expired. Please sign in again.");
  }
  const next = { ...data, expires_at: Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600) };
  setSession(next);
  return next;
}

async function supabaseRequest(path, options = {}) {
  if (!isSupabaseReady()) throw new Error("Supabase is not configured.");
  const session = await refreshSessionIfNeeded();
  const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session?.access_token || config.supabaseAnonKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = text; }
  }
  if (!response.ok) {
    const message = data?.message || data?.details || data?.hint || "The database request failed.";
    throw new Error(message);
  }
  return data;
}

async function loadAdminMaterials() {
  if (!isSupabaseReady()) return [...demoStore()];
  const rows = [];
  let offset = 0;
  while (true) {
    const params = new URLSearchParams({ select: materialColumns, order: "updated_at.desc", limit: "1000", offset: String(offset) });
    const batch = await supabaseRequest(`materials?${params}`);
    rows.push(...batch);
    if (batch.length < 1000) return rows;
    offset += batch.length;
  }
}

function normalizeMaterial(item) {
  return {
    ...item,
    category_slug: item.category_slug || "neet",
    subject_slug: item.subject_slug || "general",
    subject_name: item.subject_name || item.subject_slug || "General",
    type: item.type || "notes",
    tags: Array.isArray(item.tags) ? item.tags : [],
    is_published: item.is_published === true
  };
}

function materialCard(item) {
  const category = categoryBySlug.get(item.category_slug);
  const destination = pathFor(materialPath(item));
  const kind = item.type === "pyqs" ? "Previous year questions" : item.type === "chapter" ? "Chapter material" : "Study notes";
  return `<a class="material-card" href="${escapeHtml(destination)}" data-link>
    <div class="material-labels">
      <span class="pill">${escapeHtml(category?.title || item.category_slug)}</span>
      <span class="pill pill-muted">${escapeHtml(item.subject_name || item.subject_slug)}</span>
    </div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description || "Open this study resource for details.")}</p>
    <div class="material-card-foot"><span>${escapeHtml(kind)}${item.year ? ` · ${escapeHtml(item.year)}` : ""}</span><span aria-hidden="true">→</span></div>
  </a>`;
}

function categoryCard(category) {
  return `<a class="category-card ${category.color}" href="${pathFor(`/${category.slug}`)}" data-link>
    <div class="category-card-top"><span class="category-icon">${escapeHtml(category.icon)}</span><span class="category-kind">${escapeHtml(category.kind)}</span></div>
    <h3>${escapeHtml(category.title)}</h3><p>${escapeHtml(category.description)}</p>
    <span class="category-arrow" aria-hidden="true">Explore →</span>
  </a>`;
}

function adSlot(label = "Advertisement") {
  return `<div class="ad-slot" aria-label="Advertisement placeholder">${escapeHtml(label)} · reserved space</div>`;
}

function sectionHeading(title, description, href, linkText = "View all") {
  return `<div class="section-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${href ? `<a class="text-link" href="${pathFor(href)}" data-link>${escapeHtml(linkText)} →</a>` : ""}</div>`;
}

function homePage() {
  const items = allPublicMaterials();
  const recent = items.slice(0, 6);
  const popular = [...items].sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0)).slice(0, 3);
  return `<section class="home-hero"><div class="container hero-layout">
    <div>
      <span class="eyebrow"><i class="eyebrow-dot"></i> Your next chapter starts here</span>
      <h1 class="hero-title">Make every study session <em>count.</em></h1>
      <p class="hero-copy">Find organised notes and practice material for school, entrance exams and competitive tests — all in one student-friendly place.</p>
      <form class="search-form" data-search-form role="search"><span class="search-icon" aria-hidden="true">⌕</span><input name="q" type="search" placeholder="Try “NEET Biology” or “Class 10 Maths”" aria-label="Search study material"><button class="button button-primary" type="submit">Search</button></form>
      <div class="benefit-row"><span>Quick subject-wise search</span><span>Direct links to every resource</span></div>
    </div>
    <div class="hero-visual" aria-hidden="true"><div class="hero-logo-card"><img src="${pathFor("/assets/study-hub-logo.jpg")}" alt="" loading="eager"></div><div class="hero-badge"><strong>${activeCategories().length} learning paths</strong>one clear place to start</div></div>
  </div></section>
  <div class="container">${adSlot()}</div>
  <div class="container home-content">
    <section class="section">${sectionHeading("Explore your path", "Choose a class or exam to see all its resources.", "/class-9")}<div class="category-grid">${activeCategories().map(categoryCard).join("")}</div></section>
    <section class="section">${sectionHeading("Popular study material", "A few useful places to get started.", "/neet/pyqs")}<div class="material-grid">${popular.map(materialCard).join("")}</div></section>
    <section class="section">${sectionHeading("Latest materials", "Recently added sample listings and resources.", "/search")}<div class="material-grid">${recent.map(materialCard).join("")}</div></section>
    <section class="section">${sectionHeading("Previous year questions", "Browse exam practice by year and subject.", "/jee-main/pyqs")}<div class="material-grid">${items.filter((item) => item.type === "pyqs").slice(0, 3).map(materialCard).join("")}</div></section>
    <section class="section">${sectionHeading("Important notes", "Quick access to subject notes and revision.", "/jee-main/notes")}<div class="material-grid">${items.filter((item) => item.type === "notes").slice(0, 3).map(materialCard).join("")}</div></section>
    <section class="section"><div class="feature-strip">
      <div class="feature-item"><span class="feature-item-icon">⌕</span><div><h3>Find the right topic</h3><p>Search across exams, subjects, years and material names.</p></div></div>
      <div class="feature-item"><span class="feature-item-icon">↗</span><div><h3>Open a direct link</h3><p>Share a permanent page from Telegram without extra steps.</p></div></div>
      <div class="feature-item"><span class="feature-item-icon">✓</span><div><h3>Materials with care</h3><p>Only publish files you have the right to share.</p></div></div>
    </div></section>
    <section class="section"><div class="telegram-banner"><div><h2>Study together on Telegram</h2><p>Follow Study Hub Junction for updates and new learning resources.</p></div><a class="button" href="${escapeHtml(safeTelegramUrl)}" target="_blank" rel="noopener noreferrer">Join Telegram ↗</a></div></section>
  </div>`;
}

function breadcrumb(items) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${pathFor("/")}" data-link>Home</a>${items.map((item, index) => `<span class="crumb-separator" aria-hidden="true">›</span>${item.href && index !== items.length - 1 ? `<a href="${pathFor(item.href)}" data-link>${escapeHtml(item.label)}</a>` : `<span aria-current="page">${escapeHtml(item.label)}</span>`}`).join("")}</nav>`;
}

function detailPage(item) {
  const category = categoryBySlug.get(item.category_slug);
  const subject = item.subject_name || item.subject_slug;
  const related = allPublicMaterials().filter((candidate) => candidate.id !== item.id && (candidate.category_slug === item.category_slug || candidate.subject_slug === item.subject_slug)).slice(0, 4);
  const fileUrl = getSafeExternalUrl(item.file_url);
  const crumbs = [
    { label: category?.title || item.category_slug, href: `/${item.category_slug}` },
    { label: item.type === "pyqs" ? "PYQs" : item.type === "chapter" ? "Chapters" : "Notes", href: `/${item.category_slug}/${item.type}` },
    ...(item.year ? [{ label: String(item.year), href: `/${item.category_slug}/pyqs/${item.year}` }] : []),
    { label: subject }
  ];
  const canonicalPath = pathFor(materialPath(item));
  const shortDescription = item.description || `Study ${subject} with this ${category?.title || item.category_slug} resource.`;
  const statusNotice = item.license_status === "not_verified" ? `<div class="notice">This is a sample resource listing. A downloadable file is not available until the owner adds an authorised PDF.</div>` : "";
  const preview = fileUrl
    ? `<iframe class="pdf-frame" src="${escapeHtml(fileUrl)}#toolbar=1" title="Preview: ${escapeHtml(item.title)}" loading="lazy" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>`
    : `<div class="empty-preview"><div><span aria-hidden="true" style="font-size:25px">▤</span><strong>PDF preview not added yet</strong><span>The page link is ready. The site owner can add a permitted PDF from the admin dashboard.</span></div></div>`;
  const previousNext = allPublicMaterials().filter((candidate) => candidate.category_slug === item.category_slug);
  const position = previousNext.findIndex((candidate) => candidate.id === item.id);
  const prev = position > 0 ? previousNext[position - 1] : null;
  const next = position >= 0 && position < previousNext.length - 1 ? previousNext[position + 1] : null;
  return `<div class="container page-content">${breadcrumb(crumbs)}
    <div class="page-heading"><span class="eyebrow">${escapeHtml(category?.title || item.category_slug)}${item.year ? ` · ${escapeHtml(item.year)}` : ""}</span><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(shortDescription)}</p></div>
    ${adSlot("Advertisement · material page")}
    <div class="material-detail-grid"><article class="detail-panel">
      <h2>About this study material</h2><p>${escapeHtml(shortDescription)}</p>
      ${statusNotice}
      <div class="meta-list"><div class="meta-item"><small>Exam / class</small><strong>${escapeHtml(category?.title || item.category_slug)}</strong></div><div class="meta-item"><small>Subject</small><strong>${escapeHtml(subject)}</strong></div><div class="meta-item"><small>Material</small><strong>${escapeHtml(item.type === "pyqs" ? "Previous year questions" : item.type === "chapter" ? "Chapter material" : "Study notes")}</strong></div><div class="meta-item"><small>Year</small><strong>${escapeHtml(item.year || "All years")}</strong></div></div>
      <div class="detail-actions">${fileUrl ? `<a class="button button-primary" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer">View material ↗</a><a class="button button-outline" href="${escapeHtml(fileUrl)}" download>Download material</a>` : `<button class="button button-primary" disabled title="The owner has not added an authorised file yet">PDF not available yet</button>`}<a class="button button-telegram" href="${escapeHtml(safeTelegramUrl)}" target="_blank" rel="noopener noreferrer">Join Telegram ↗</a></div>
      ${preview}
      <div class="detail-actions">${prev ? `<a class="button button-outline" href="${pathFor(materialPath(prev))}" data-link>← Previous</a>` : ""}${next ? `<a class="button button-outline" href="${pathFor(materialPath(next))}" data-link>Next →</a>` : ""}</div>
    </article><aside><section class="side-panel"><h2>Related materials</h2>${related.length ? `<div class="related-list">${related.map((entry) => `<a class="related-item" href="${pathFor(materialPath(entry))}" data-link><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.subject_name || entry.subject_slug)}${entry.year ? ` · ${escapeHtml(entry.year)}` : ""}</small></a>`).join("")}</div>` : `<p>More resources will appear here as they are added.</p>`}</section>${adSlot("Advertisement · sidebar")}<section class="side-panel"><h2>Share this page</h2><p>This permanent address can be sent directly in your Telegram bot.</p><button class="button button-outline" type="button" data-copy-url>Copy page link</button></section></aside></div>
  </div>`;
}

function categoryPage(category, route) {
  const parts = route.split("/").filter(Boolean);
  const section = parts[1];
  let year = null;
  let subject = null;
  if (section === "pyqs") {
    if (/^\d{4}$/.test(parts[2] || "")) year = parts[2];
    subject = parts[3] || null;
  } else if (section === "notes" || section === "chapter" || section === "chapters") {
    subject = parts[2] || null;
  } else if (parts[1]) {
    subject = parts[1];
  }
  let items = categoryPageCache.get(route)?.items || allPublicMaterials().filter((item) => item.category_slug === category.slug);
  if (section === "notes" || section === "pyqs" || section === "chapter" || section === "chapters") {
    const type = section === "chapters" ? "chapter" : section;
    items = items.filter((item) => item.type === type);
  }
  if (year && /^\d{4}$/.test(year)) items = items.filter((item) => String(item.year) === year);
  if (subject && subject !== "all") items = items.filter((item) => item.subject_slug === subject);
  if (parts.length > 1 && !section) items = items.filter((item) => item.subject_slug === parts[1]);
  const label = section === "pyqs" ? "Previous year questions" : section === "notes" ? "Study notes" : section ? `${section.replace(/-/g, " ")} resources` : "Study materials";
  const crumbs = [{ label: category.title }, ...(section ? [{ label: section.toUpperCase(), href: `/${category.slug}/${section}` }] : []), ...(year ? [{ label: year }] : []), ...(subject ? [{ label: subject }] : [])];
  return `<div class="container page-content">${breadcrumb(crumbs)}
    <div class="page-heading"><span class="eyebrow">${escapeHtml(category.kind)}</span><h1>${escapeHtml(category.title)} ${section ? `· ${escapeHtml(label)}` : "study material"}</h1><p>${escapeHtml(category.description)} Browse notes, PYQs and topic-wise resources. Every material has a direct link you can share from Telegram.</p></div>
    <div class="category-tabs"><a class="${!section ? "active" : ""}" href="${pathFor(`/${category.slug}`)}" data-link>All materials</a><a class="${section === "notes" ? "active" : ""}" href="${pathFor(`/${category.slug}/notes`)}" data-link>Notes</a><a class="${section === "pyqs" ? "active" : ""}" href="${pathFor(`/${category.slug}/pyqs`)}" data-link>Previous year questions</a>${category.kind === "Class" ? `<a href="${pathFor(`/${category.slug}/chapters`)}" data-link>Chapters</a>` : ""}</div>
    ${items.length ? `<div class="material-grid">${items.map(materialCard).join("")}</div>${categoryPageCache.get(route)?.hasMore ? `<div class="form-actions"><button class="button button-outline" type="button" data-load-more="${escapeHtml(route)}">Load more materials</button></div>` : ""}` : emptyState("No materials here yet", "We haven’t added a resource for this selection. Try another subject or browse all available categories.", `/${category.slug}`)}
    ${adSlot()}<section class="section"><div class="telegram-banner"><div><h2>Get new resource updates</h2><p>Join the official Study Hub Junction Telegram bot.</p></div><a class="button" href="${escapeHtml(safeTelegramUrl)}" target="_blank" rel="noopener noreferrer">Join Telegram ↗</a></div></section>
  </div>`;
}

function emptyState(title, description, backHref = "/") {
  return `<div class="empty-state"><div class="empty-mark" aria-hidden="true">⌕</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><a class="button button-outline" href="${pathFor(backHref)}" data-link>Browse materials</a></div>`;
}

function searchPage(query) {
  const q = (query || "").trim();
  if (isSupabaseReady() && q && !searchResultCache.has(q)) {
    return `<div class="container page-content">${breadcrumb([{ label: "Search" }])}<div class="page-heading"><span class="eyebrow">Find a resource</span><h1>Search study material</h1></div><div class="empty-state" role="status"><div class="empty-mark" aria-hidden="true">⌕</div><h2>Searching materials…</h2><p>Looking through published resources for “${escapeHtml(q)}”.</p></div></div>`;
  }
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = searchResultCache.get(q) || (!terms.length ? [] : allPublicMaterials().filter((item) => {
    const category = categoryBySlug.get(item.category_slug);
    const haystack = [item.title, item.description, item.category_slug, category?.title, item.subject_name, item.subject_slug, item.year, item.type, ...(item.tags || [])].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }));
  return `<div class="container page-content">${breadcrumb([{ label: "Search" }])}
    <div class="page-heading"><span class="eyebrow">Find a resource</span><h1>Search study material</h1><p>Search by exam, class, subject, year or topic.</p></div>
    <form class="search-form" data-search-form role="search"><span class="search-icon" aria-hidden="true">⌕</span><input name="q" type="search" value="${escapeHtml(q)}" placeholder="Try “NEET Biology” or “Class 10 Maths”" aria-label="Search study material"><button class="button button-primary" type="submit">Search</button></form>
    <section class="section">${q ? `<div class="section-heading"><div><h2>${results.length ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "No results found"}</h2><p>Showing matches for “${escapeHtml(q)}”</p></div></div>${results.length ? `<div class="material-grid">${results.map(materialCard).join("")}</div>` : emptyState("Try another search", "Check the spelling, use a shorter phrase, or browse by class or exam.", "/")}` : emptyState("What are you studying today?", "Enter an exam, class, subject or topic to find relevant study material.", "/")}
    </section>${adSlot()}
  </div>`;
}

const policyContent = {
  about: {
    title: "About Study Hub Junction",
    description: "A simple place to find organised learning resources.",
    body: `<p>Study Hub Junction is designed to help students discover study notes and practice resources for school classes, entrance exams and competitive tests. Resources are organised by category, subject, year and chapter so each page can be linked directly.</p><p>We aim to publish only resources that are original, authorised, appropriately licensed or in the public domain. If you spot a rights or accuracy concern, please contact the site owner.</p>`
  },
  contact: {
    title: "Contact us",
    description: "Get in touch with Study Hub Junction.",
    body: `<p>For questions, corrections, accessibility feedback or copyright concerns, contact the site owner.</p>${config.adminEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminEmail) ? `<p>Email: <a class="text-link" href="mailto:${escapeHtml(config.adminEmail)}">${escapeHtml(config.adminEmail)}</a></p>` : `<p>Configure a public contact email before publishing this page.</p>`}<p>Telegram: <a class="text-link" href="${escapeHtml(safeTelegramUrl)}" target="_blank" rel="noopener noreferrer">Study Hub Junction ↗</a></p>`
  },
  "privacy-policy": {
    title: "Privacy policy",
    description: "How this website handles information.",
    body: `<h2>Information and search</h2><p>In demo mode, search runs in your browser. With Supabase configured, search queries are sent to the site's database to return published materials. Admin sign-in and published study material are processed by Supabase according to its privacy policy.</p><h2>Cookies and local storage</h2><p>The site uses browser session storage for a signed-in admin session and local storage for local demo changes. It does not use these features to track students across websites.</p><h2>Advertising</h2><p>Advertisement spaces are placeholders until the owner configures an advertising provider. Third-party advertising providers may use cookies under their own policies. A live site should publish an accurate, jurisdiction-appropriate privacy policy before enabling ads.</p><h2>Your choices</h2><p>You can clear site data in your browser settings. For privacy questions, contact the site owner using the configured contact details.</p>`
  },
  terms: {
    title: "Terms & conditions",
    description: "Terms for using Study Hub Junction.",
    body: `<h2>Use of the site</h2><p>Use this site lawfully and do not disrupt its operation, attempt unauthorised access, or misuse its content.</p><h2>Study materials</h2><p>Resources are provided for educational reference. The site owner is responsible for confirming permission, licences and attribution before publishing any file. Do not re-upload or redistribute a resource unless its rights permit it.</p><h2>Availability and accuracy</h2><p>Materials may be changed or removed. Exam information and study resources are not a substitute for official exam notices or professional advice. The site is provided without a guarantee that every resource is error-free or continuously available.</p><h2>Contact</h2><p>Contact the site owner through the official Telegram link or the site's configured contact address.</p>`
  },
  disclaimer: {
    title: "Disclaimer",
    description: "Important information about study resources.",
    body: `<p>Study Hub Junction is an independent educational resource directory and is not affiliated with or endorsed by any examination board, government department, school, coaching provider or university unless explicitly stated.</p><p>Names of exams, institutions and subjects are used only to identify relevant study resources. Always verify current syllabus, exam schedules and official requirements with the relevant authority.</p><p>PDFs and other third-party resources should be published only when the site owner has the necessary distribution rights. Contact the owner to report a suspected rights issue.</p>`
  }
};

function policyPage(key) {
  const page = policyContent[key];
  if (!page) return notFoundPage();
  return `<div class="container page-content">${breadcrumb([{ label: page.title }])}<div class="page-heading"><span class="eyebrow">Study Hub Junction</span><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p></div><article class="policy-panel privacy-copy">${page.body}</article></div>`;
}

function loginPanel() {
  return `<div class="form-panel"><h2>Admin sign in</h2><p class="field-hint">Sign in with the administrator account configured in Supabase. Admin access is enforced by database policies.</p><form id="login-form"><div class="form-grid"><div class="field full"><label for="admin-email">Email</label><input id="admin-email" name="email" type="email" autocomplete="username" required></div><div class="field full"><label for="admin-password">Password</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Sign in</button></div></form></div>`;
}

function materialForm(item = {}) {
  const editing = Boolean(item.id);
  const licenseOptions = [["not_verified", "Not verified — cannot publish"], ["original", "Original work"], ["licensed", "Licensed for distribution"], ["public_domain", "Public domain"]];
  const categoryOptions = activeCategories().map((category) => `<option value="${category.slug}" ${item.category_slug === category.slug ? "selected" : ""}>${escapeHtml(category.title)}</option>`).join("");
  const licenseOptionsHtml = licenseOptions.map(([value, label]) => `<option value="${value}" ${item.license_status === value || (!item.license_status && value === "not_verified") ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
  const generatedPath = item.id ? materialPath(item) : "";
  return `<form id="material-form" data-edit-id="${escapeHtml(item.id || "")}">
    <div class="form-grid">
      <div class="field full"><label for="material-title">Material title *</label><input id="material-title" name="title" value="${escapeHtml(item.title || "")}" required maxlength="180" placeholder="NEET Biology PYQs 2025"></div>
      <div class="field"><label for="material-category">Exam / class *</label><select id="material-category" name="category_slug" required>${categoryOptions}</select></div>
      <div class="field"><label for="material-type">Material type *</label><select id="material-type" name="type"><option value="notes" ${item.type === "notes" ? "selected" : ""}>Notes</option><option value="pyqs" ${item.type === "pyqs" ? "selected" : ""}>Previous year questions (PYQs)</option><option value="chapter" ${item.type === "chapter" ? "selected" : ""}>Chapter material</option></select></div>
      <div class="field"><label for="material-subject">Subject *</label><input id="material-subject" name="subject_name" value="${escapeHtml(item.subject_name || "")}" required maxlength="80" placeholder="Biology"></div>
      <div class="field"><label for="material-year">Year</label><input id="material-year" name="year" value="${escapeHtml(item.year || "")}" inputmode="numeric" pattern="\\d{4}" placeholder="2025"></div>
      <div class="field"><label for="material-chapter">Chapter slug (for class pages)</label><input id="material-chapter" name="chapter_slug" value="${escapeHtml(item.chapter_slug || "")}" placeholder="chapter-1" maxlength="80"></div>
      <div class="field full"><label for="material-description">Description *</label><textarea id="material-description" name="description" required maxlength="2000">${escapeHtml(item.description || "")}</textarea></div>
      <div class="field full"><label for="material-file">Upload PDF (optional)</label><input id="material-file" name="pdf_file" type="file" accept="application/pdf,.pdf"><span class="field-hint">Maximum 25 MB. Upload requires Supabase configuration. In local demo mode, paste an HTTPS file link below instead.</span>${item.file_url ? `<span class="field-hint">Current file: <a class="text-link" href="${escapeHtml(item.file_url)}" target="_blank" rel="noopener noreferrer">Open current PDF ↗</a></span>` : ""}</div>
      <div class="field full"><label for="material-url">PDF / file URL (optional alternative)</label><input id="material-url" name="file_url" value="${escapeHtml(item.file_url || "")}" type="url" placeholder="https://..."><span class="field-hint">Choose a PDF above to upload it to your Supabase Storage, or paste a direct HTTPS URL.</span></div>
      <div class="field full"><label for="material-thumbnail">Thumbnail URL (optional)</label><input id="material-thumbnail" name="thumbnail_url" value="${escapeHtml(item.thumbnail_url || "")}" type="url" placeholder="https://..."></div>
      <div class="field full"><label for="material-tags">Tags (comma separated)</label><input id="material-tags" name="tags" value="${escapeHtml((item.tags || []).join(", "))}" placeholder="NEET, Biology, PYQ"></div>
      <div class="field full"><label for="material-license">Source / redistribution permission *</label><select id="material-license" name="license_status" required>${licenseOptionsHtml}</select></div>
      <div class="field full"><label for="material-license-note">Source, licence or permission details</label><textarea id="material-license-note" name="license_note" maxlength="1000" placeholder="Author/source, licence name, permission reference…">${escapeHtml(item.license_note || "")}</textarea></div>
      <div class="field full"><label for="material-seo-title">SEO title</label><input id="material-seo-title" name="seo_title" value="${escapeHtml(item.seo_title || "")}" maxlength="180"></div>
      <div class="field full"><label for="material-seo-description">SEO description</label><textarea id="material-seo-description" name="seo_description" maxlength="300">${escapeHtml(item.seo_description || "")}</textarea></div>
      <div class="field full"><label class="form-check"><input name="is_published" type="checkbox" ${item.is_published ? "checked" : ""}><span>Publish this material (requires a verified right to distribute)</span></label></div>
      <div class="field full"><span class="field-hint">Permanent URL (generated automatically): <strong id="generated-path">${escapeHtml(generatedPath || "Choose the fields above")}</strong></span></div>
    </div>
    <div class="form-actions"><button class="button button-primary" type="submit">${editing ? "Save changes" : "Add material"}</button><button class="button button-outline" type="reset" data-reset-form>Clear form</button></div>
  </form>`;
}

function adminPage() {
  const demo = !isSupabaseReady();
  const banner = demo
    ? `<div class="demo-alert"><strong>Local demo mode.</strong> Changes made here are saved only in this browser and do not become a secure, shared website database. Configure a Supabase project for persistent storage and authenticated admin access. <button class="small-button" type="button" data-reset-demo>Reset demo data</button></div>`
    : "";
  const alert = remoteError ? `<div class="error-banner" role="alert">${escapeHtml(remoteError)}</div>` : "";
  const authPanel = isSupabaseReady() && !adminUser
    ? loginPanel()
    : "";
  const signedIn = adminUser ? `<span class="field-hint">Signed in as ${escapeHtml(adminUser.email || config.adminEmail || "administrator")}</span><button class="button button-outline" type="button" data-admin-logout>Sign out</button>` : "";
  const form = (demo || adminUser) ? materialForm() : "";
  const categoryForm = (demo || adminUser) ? `<section class="form-panel"><h2>Add a class or exam</h2><form id="category-form"><div class="form-grid"><div class="field"><label for="category-name">Name *</label><input id="category-name" name="name" required placeholder="NEET"></div><div class="field"><label for="category-slug">URL slug *</label><input id="category-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="neet"></div><div class="field"><label for="category-kind">Category type</label><select id="category-kind" name="kind"><option>Class</option><option>Entrance exam</option><option>Competitive exam</option></select></div><div class="field full"><label for="category-description">Description</label><textarea id="category-description" name="description"></textarea></div></div><div class="form-actions"><button class="button button-outline" type="submit">Add category</button></div></form></section>` : "";
  const list = (demo || adminUser) ? `<section class="form-panel"><div class="admin-toolbar"><div><h2>Materials</h2><span class="field-hint">${adminMaterials.length} item(s)</span></div><label class="field"><span class="field-hint">View</span><select id="admin-filter"><option value="all">All</option><option value="published">Published</option><option value="draft">Drafts</option></select></label></div><div class="admin-list" id="admin-list"></div></section>` : "";
  return `<div class="container page-content">${breadcrumb([{ label: "Admin" }])}<div class="page-heading"><span class="eyebrow">Site owner tools</span><h1>Material dashboard</h1><p>Add, update and manage study materials. New pages get predictable URLs automatically.</p></div>${banner}${alert}${authPanel}
    ${(demo || adminUser) ? `<div class="admin-toolbar">${signedIn}${adminUser ? `<button class="button button-outline" type="button" data-admin-refresh>Refresh list</button>` : ""}</div><div class="admin-layout"><div style="display:grid;gap:14px"><section class="form-panel"><h2 id="form-heading">Add a study material</h2>${form}</section>${categoryForm}</div>${list}</div>` : ""}
    ${adSlot("Advertisement · dashboard")}
  </div>`;
}

function adminListMarkup() {
  const filter = document.querySelector("#admin-filter")?.value || "all";
  const items = adminMaterials.filter((item) => filter === "all" || (filter === "published" ? item.is_published : !item.is_published));
  const target = document.querySelector("#admin-list");
  if (!target) return;
  target.innerHTML = items.length ? items.map((item) => `<div class="admin-item"><div><h3>${escapeHtml(item.title)}</h3><small>${escapeHtml(materialPath(item))} · ${item.is_published ? "Published" : "Draft"} · ${escapeHtml(item.license_status || "not verified")}</small></div><div class="admin-actions"><button class="small-button" type="button" data-edit="${escapeHtml(item.id)}">Edit</button><button class="small-button" type="button" data-toggle="${escapeHtml(item.id)}">${item.is_published ? "Unpublish" : "Publish"}</button><button class="small-button danger" type="button" data-delete="${escapeHtml(item.id)}">Delete</button></div></div>`).join("") : `<div class="empty-state"><h2>No materials yet</h2><p>Add a resource using the form.</p></div>`;
}

function notFoundPage() {
  return `<div class="container page-content">${breadcrumb([{ label: "Page not found" }])}${emptyState("We couldn’t find that page", "The link may be out of date. Browse the classes and exams below to find the material you need.")}<section class="section"><div class="category-grid">${activeCategories().map(categoryCard).join("")}</div></section></div>`;
}

function errorPage() {
  return `<div class="container page-content">${breadcrumb([{ label: "Something went wrong" }])}<div class="empty-state"><div class="empty-mark" aria-hidden="true">!</div><h1>We hit a temporary problem</h1><p>Please refresh the page or browse to a category. If the problem continues, contact the site owner.</p><button class="button button-primary" type="button" data-retry>Try again</button></div><section class="section"><div class="category-grid">${activeCategories().map(categoryCard).join("")}</div></section></div>`;
}

function buildSeo(title, description, canonical, route, structuredData = null) {
  const name = config.websiteName || "Study Hub Junction";
  document.title = title.toLowerCase().endsWith(name.toLowerCase()) ? title : `${title} | ${name}`;
  setMeta("description", description);
  setMeta("og:title", document.title, "property");
  setMeta("og:description", description, "property");
  setMeta("og:site_name", name, "property");
  setMeta("og:type", structuredData?.["@type"] === "LearningResource" ? "article" : "website", "property");
  setMeta("twitter:title", document.title);
  setMeta("og:url", canonical, "property");
  const origin = getSafeExternalUrl(config.websiteUrl) ? new URL(config.websiteUrl).origin : location.origin;
  setMeta("og:image", `${origin}${pathFor("/assets/study-hub-logo.jpg")}`, "property");
  setMeta("robots", routeIsPrivate(route) ? "noindex,follow" : "index,follow");
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) canonicalLink.href = canonical;
  const existing = document.querySelector("#structured-data");
  if (existing) existing.remove();
  if (structuredData) {
    const script = document.createElement("script");
    script.id = "structured-data";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData).replace(/</g, "\\u003c");
    document.head.append(script);
  }
}

function setMeta(name, content, attribute = "name") {
  let node = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, name);
    document.head.append(node);
  }
  node.content = content;
}

function canonicalUrl(route) {
  const base = getSafeExternalUrl(config.websiteUrl) ? new URL(config.websiteUrl).origin : (location.protocol.startsWith("http") ? location.origin : "");
  return base ? `${base}${pathFor(route)}` : pathFor(route);
}

function pageData(route) {
  if (route === "/") return { html: homePage(), title: "Learn with confidence", description: "Find class notes, exam preparation resources and previous year questions.", route };
  if (route === "/search") {
    const query = new URLSearchParams(location.search).get("q") || "";
    return { html: searchPage(query), title: query ? `Search: ${query}` : "Search study material", description: "Search study materials by exam, class, subject, year or topic.", route };
  }
  if (route === "/admin") return { html: adminPage(), title: "Material dashboard", description: "Manage study material listings.", route };
  if (route === "/error") return { html: errorPage(), title: "Something went wrong", description: "A temporary site error occurred.", route };
  const material = allPublicMaterials().find((item) => materialPath(item) === route);
  if (material) {
    const category = categoryBySlug.get(material.category_slug);
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: category?.title || material.category_slug, item: canonicalUrl(`/${material.category_slug}`) },
        { "@type": "ListItem", position: 3, name: material.title, item: canonicalUrl(route) }
      ]
    };
    const structured = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: material.title,
      description: material.seo_description || material.description,
      learningResourceType: material.type === "pyqs" ? "Practice problem" : "Study guide",
      educationalLevel: category?.title || material.category_slug,
      inLanguage: "en",
      url: canonicalUrl(route),
      isAccessibleForFree: true,
      breadcrumb: breadcrumbData
    };
    return { html: detailPage(material), title: material.seo_title || material.title, description: material.seo_description || material.description, route, structured };
  }
  const parts = route.split("/").filter(Boolean);
  if (isSupabaseReady() && parts.length > 1 && categoryBySlug.has(parts[0]) && !categoryPageCache.has(route) && !remoteError) {
    return { html: `<div class="container page-content">${breadcrumb([{ label: "Loading material" }])}<div class="empty-state" role="status"><div class="empty-mark" aria-hidden="true">▤</div><h2>Opening your study material…</h2><p>Loading this direct link.</p></div></div>`, title: "Loading study material", description: "Loading the requested study resource.", route };
  }
  if (parts.length && categoryBySlug.has(parts[0])) {
    const category = categoryBySlug.get(parts[0]);
    const html = categoryPage(category, route);
    const structured = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: category.title, item: canonicalUrl(`/${category.slug}`) }
      ]
    };
    return { html, title: `${category.title} study material`, description: category.description, route, structured };
  }
  if (policyContent[route.slice(1)]) {
    const key = route.slice(1);
    return { html: policyPage(key), title: policyContent[key].title, description: policyContent[key].description, route };
  }
  if (route === "/404") return { html: notFoundPage(), title: "Page not found", description: "The requested page could not be found.", route };
  return { html: notFoundPage(), title: "Page not found", description: "The requested page could not be found.", route };
}

function renderFooter() {
  const footer = document.querySelector("#site-footer");
  footer.className = "site-footer";
  footer.innerHTML = `<div class="container"><div class="footer-main"><div class="footer-brand"><a class="brand" href="${pathFor("/")}" data-link><img src="${pathFor("/assets/study-hub-logo.jpg")}" width="40" height="40" alt="" loading="lazy"><span class="brand-name">study hub <b>junction</b></span></a><p>Simple, organised study material for your next step.</p></div><nav class="footer-links" aria-label="Footer">${[["About us", "/about"], ["Privacy policy", "/privacy-policy"], ["Terms & conditions", "/terms"], ["Disclaimer", "/disclaimer"], ["Contact us", "/contact"], ["Admin", "/admin"]].map(([label, href]) => `<a href="${pathFor(href)}" data-link>${label}</a>`).join("")}</nav></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${escapeHtml(config.websiteName || "Study Hub Junction")}</span><span>Independent learning resource directory</span></div></div>`;
}

function applyBranding() {
  document.querySelectorAll(".brand-name").forEach((brand) => {
    const name = (config.websiteName || "Study Hub Junction").trim();
    const lastSpace = name.lastIndexOf(" ");
    const primary = lastSpace > 0 ? name.slice(0, lastSpace) : name;
    const secondary = lastSpace > 0 ? name.slice(lastSpace + 1) : "";
    brand.innerHTML = `${escapeHtml(primary)}${secondary ? ` <b>${escapeHtml(secondary)}</b>` : ""}`;
  });
}

function render() {
  currentRoute = routeFromLocation();
  const page = pageData(currentRoute);
  main.innerHTML = `${remoteError && currentRoute !== "/admin" ? `<div class="container page-content"><div class="error-banner" role="alert">${escapeHtml(remoteError)}</div></div>` : ""}${page.html}`;
  document.querySelectorAll("[data-telegram-link]").forEach((link) => { link.href = safeTelegramUrl; });
  document.querySelector(".main-nav")?.classList.remove("open");
  document.querySelector(".menu-toggle")?.setAttribute("aria-expanded", "false");
  buildSeo(page.title, page.description, canonicalUrl(page.route), page.route, page.structured);
  renderFooter();
  applyBranding();
  bindAdminEvents();
  if (currentRoute === "/admin" && (!isSupabaseReady() || adminUser)) {
    adminMaterials = isSupabaseReady() ? adminMaterials : [...demoStore()];
    adminListMarkup();
  }
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  else window.scrollTo({ top: 0, behavior: "instant" });
  void loadRouteData(currentRoute);
}

function navigate(route, options = {}) {
  const url = new URL(route, location.origin);
  let pathname = url.pathname;
  if (appBase && pathname.startsWith(`${appBase}/`)) pathname = pathname.slice(appBase.length);
  else if (appBase && pathname === appBase) pathname = "/";
  const nextRoute = `${pathname}${url.search}` || "/";
  if (options.replace) history.replaceState({}, "", pathFor(nextRoute));
  else history.pushState({}, "", pathFor(nextRoute));
  render();
}

function slugForMaterial(fields) {
  const category = fields.category_slug;
  const subject = makeSlug(fields.subject_name);
  if (fields.type === "chapter" && fields.chapter_slug) return `/${category}/${subject}/${makeSlug(fields.chapter_slug)}`;
  if (fields.type === "pyqs") return `/${category}/pyqs/${fields.year || "all-years"}/${subject}`;
  return `/${category}/${fields.type}/${subject}`;
}

function updateGeneratedPath(form) {
  const values = new FormData(form);
  const fields = {
    category_slug: values.get("category_slug"),
    type: values.get("type"),
    subject_name: values.get("subject_name") || "subject",
    year: values.get("year"),
    chapter_slug: values.get("chapter_slug")
  };
  const label = form.querySelector("#generated-path");
  if (label) label.textContent = slugForMaterial(fields);
}

function formPayload(form) {
  const values = new FormData(form);
  const category_slug = String(values.get("category_slug") || "");
  const type = String(values.get("type") || "notes");
  const subject_name = String(values.get("subject_name") || "").trim();
  const yearString = String(values.get("year") || "").trim();
  const chapter_slug = String(values.get("chapter_slug") || "").trim();
  const file_url = String(values.get("file_url") || "").trim();
  const thumbnail_url = String(values.get("thumbnail_url") || "").trim();
  const license_status = String(values.get("license_status") || "not_verified");
  const is_published = values.get("is_published") === "on";
  if (!subject_name || !String(values.get("title") || "").trim() || !String(values.get("description") || "").trim()) {
    throw new Error("Title, subject and description are required.");
  }
  if (yearString && !/^\d{4}$/.test(yearString)) throw new Error("Enter a four-digit year.");
  if ((file_url && !getSafeExternalUrl(file_url)) || (thumbnail_url && !getSafeExternalUrl(thumbnail_url))) {
    throw new Error("File and thumbnail links must use HTTPS.");
  }
  if (is_published && !["original", "licensed", "public_domain"].includes(license_status)) {
    throw new Error("Confirm that you have the right to distribute this material before publishing.");
  }
  const license_note = String(values.get("license_note") || "").trim() || null;
  if (is_published && !license_note) throw new Error("Add the source or licence details before publishing.");
  return {
    category_slug,
    type,
    subject_name,
    subject_slug: makeSlug(subject_name),
    year: yearString ? Number(yearString) : null,
    chapter_slug: chapter_slug ? makeSlug(chapter_slug) : null,
    title: String(values.get("title")).trim(),
    description: String(values.get("description")).trim(),
    file_url: file_url || null,
    thumbnail_url: thumbnail_url || null,
    tags: String(values.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
    seo_title: String(values.get("seo_title") || "").trim() || null,
    seo_description: String(values.get("seo_description") || "").trim() || null,
    license_status,
    license_note,
    is_published,
    slug: slugForMaterial({ category_slug, type, subject_name, year: yearString, chapter_slug }).replace(/^\//, "")
  };
}

async function ensureMaterialReferences(payload) {
  if (!isSupabaseReady()) return;
  await supabaseRequest("subjects?on_conflict=category_slug,slug", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ category_slug: payload.category_slug, slug: payload.subject_slug, name: payload.subject_name })
  });
  if (payload.chapter_slug) {
    await supabaseRequest("chapters?on_conflict=category_slug,subject_slug,slug", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({
        category_slug: payload.category_slug,
        subject_slug: payload.subject_slug,
        slug: payload.chapter_slug,
        name: payload.chapter_slug.replace(/-/g, " "),
        sort_order: 0
      })
    });
  }
}

async function addCategory(form) {
  const values = new FormData(form);
  const name = String(values.get("name") || "").trim();
  const slug = makeSlug(String(values.get("slug") || name));
  const kind = String(values.get("kind") || "Class");
  const description = String(values.get("description") || "").trim();
  if (!name || !slug) throw new Error("Category name and URL slug are required.");
  if (categoryBySlug.has(slug)) throw new Error("A category with that URL slug already exists.");
  const category = { slug, title: name, name, kind, description, icon: kind === "Class" ? "▤" : "◈", color: "blue" };
  if (isSupabaseReady()) {
    if (!adminUser) throw new Error("Sign in as an administrator before adding a category.");
    await supabaseRequest("categories", { method: "POST", body: JSON.stringify({ slug, name, kind, description }) });
  } else {
    try {
      const existing = JSON.parse(localStorage.getItem(categoryStorageKey) || "[]");
      localStorage.setItem(categoryStorageKey, JSON.stringify([...existing, category]));
    } catch (error) {
      console.error("Could not save the demo category.", error);
      throw new Error("Could not save this category in browser storage.");
    }
  }
  setCategories([...activeCategories(), category]);
}

function resetDemoData() {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(categoryStorageKey);
  localMaterials = [...demoMaterials];
  adminMaterials = [...demoMaterials];
  setCategories([...categories]);
}

async function checkAdminUser() {
  if (!isSupabaseReady()) return;
  const session = getSession();
  if (!session?.access_token) { adminUser = null; return; }
  const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
    headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${session.access_token}` }
  });
  if (!response.ok) {
    setSession(null);
    adminUser = null;
    return;
  }
  const user = await response.json();
  const isRoleAdmin = user.app_metadata?.role === "admin";
  const matchesAdminEmail = !config.adminEmail || user.email?.toLowerCase() === config.adminEmail.toLowerCase();
  adminUser = isRoleAdmin && matchesAdminEmail ? user : null;
  if (!adminUser) {
    setSession(null);
    remoteError = "This account is not authorised as a site administrator.";
  }
}

async function loadRemotePublicMaterials() {
  if (!isSupabaseReady()) return;
  try {
    const params = new URLSearchParams({ select: materialColumns, is_published: "eq.true", order: "updated_at.desc", limit: String(publicPageSize) });
    const rows = await supabaseRequest(`materials?${params}`);
    localMaterials = rows.map(normalizeMaterial);
    remoteError = "";
  } catch (error) {
    remoteError = `Could not load live study materials: ${error.message}`;
    console.error(remoteError, error);
  }
}

async function signIn(form) {
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (config.adminEmail && email.toLowerCase() !== config.adminEmail.toLowerCase()) {
    throw new Error("This email does not match the configured admin email.");
  }
  const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: config.supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.message || "Sign-in failed. Check your email and password.");
  setSession({ ...data, expires_at: Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600) });
  await checkAdminUser();
  if (!adminUser) throw new Error(remoteError || "This account does not have administrator permission.");
  adminMaterials = await loadAdminMaterials();
  adminMaterialsLoaded = true;
  remoteError = "";
  render();
  notify("Signed in successfully.");
}

async function saveMaterial(form) {
  let payload = formPayload(form);
  const editId = form.dataset.editId;
  const fileInput = form.querySelector('[name="pdf_file"]');
  const selectedFile = fileInput?.files?.[0];
  if (!categoryBySlug.has(payload.category_slug)) throw new Error("Select a valid class or exam category.");
  if (selectedFile && !isSupabaseReady()) {
    throw new Error("PDF upload works after Supabase is connected. For a local preview, paste a direct HTTPS PDF link instead.");
  }
  if (!isSupabaseReady()) {
    const items = demoStore();
    const collision = items.find((item) => item.slug === payload.slug && item.id !== editId);
    if (collision) throw new Error("That URL is already in use. Choose a different subject or chapter.");
    const updated = { ...payload, id: editId || `local-${crypto.randomUUID()}`, is_published: payload.is_published };
    localMaterials = editId ? items.map((item) => item.id === editId ? updated : item) : [updated, ...items];
    localStorage.setItem(storageKey, JSON.stringify(localMaterials));
    adminMaterials = [...localMaterials];
    return;
  }
  if (!adminUser) throw new Error("Sign in as an administrator before saving.");
  const oldFileUrl = editId ? adminMaterials.find((item) => item.id === editId)?.file_url : null;
  let uploaded = null;
  try {
    if (selectedFile) {
      uploaded = await uploadPdf(selectedFile, payload.category_slug);
      payload = { ...payload, file_url: uploaded.fileUrl };
    }
    await ensureMaterialReferences(payload);
    const request = editId
      ? supabaseRequest(`materials?id=eq.${encodeURIComponent(editId)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) })
      : supabaseRequest("materials", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
    const saved = await request;
    if (!saved?.length) throw new Error("The material was not saved. Check its URL and permissions, then try again.");
  } catch (error) {
    if (uploaded) {
      try { await removeUploadedPdf(uploaded.objectPath); }
      catch (cleanupError) {
        console.error("Could not clean up the newly uploaded file after a failed save.", cleanupError);
        throw new Error(`${error.message} The uploaded file remains in Supabase Storage and may need manual cleanup.`);
      }
    }
    throw error;
  }
  adminMaterials = await loadAdminMaterials();
  adminMaterialsLoaded = true;
  if (uploaded && oldFileUrl && oldFileUrl !== uploaded.fileUrl) {
    const oldObjectPath = uploadedObjectPath(oldFileUrl);
    if (oldObjectPath) {
      try { await removeUploadedPdf(oldObjectPath); }
      catch (error) {
        console.error("The material was saved, but its previous file could not be cleaned up.", error);
        throw new Error(`Material saved, but the previous PDF could not be removed from storage: ${error.message}`);
      }
    }
  }
}

async function updateMaterial(id, changes) {
  if (!isSupabaseReady()) {
    localMaterials = demoStore().map((item) => item.id === id ? { ...item, ...changes } : item);
    localStorage.setItem(storageKey, JSON.stringify(localMaterials));
    adminMaterials = [...localMaterials];
    return;
  }
  if (!adminUser) throw new Error("Sign in as an administrator before changing materials.");
  await supabaseRequest(`materials?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(changes) });
  adminMaterials = await loadAdminMaterials();
  adminMaterialsLoaded = true;
}

async function deleteMaterial(id) {
  if (!isSupabaseReady()) {
    localMaterials = demoStore().filter((item) => item.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(localMaterials));
    adminMaterials = [...localMaterials];
    return;
  }
  if (!adminUser) throw new Error("Sign in as an administrator before deleting materials.");
  const fileUrl = adminMaterials.find((item) => item.id === id)?.file_url;
  await supabaseRequest(`materials?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  adminMaterials = await loadAdminMaterials();
  adminMaterialsLoaded = true;
  const objectPath = uploadedObjectPath(fileUrl);
  if (objectPath) await removeUploadedPdf(objectPath);
}

function showEditForm(id) {
  const item = adminMaterials.find((entry) => entry.id === id);
  if (!item) return;
  const panel = document.querySelector("#material-form");
  const replacement = document.createElement("template");
  replacement.innerHTML = materialForm(item);
  panel?.replaceWith(replacement.content.firstElementChild);
  const heading = document.querySelector("#form-heading");
  if (heading) heading.textContent = "Edit study material";
  const editForm = document.querySelector("#material-form");
  if (editForm) {
    updateGeneratedPath(editForm);
    bindMaterialForm(editForm);
  }
  document.querySelector("#material-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindMaterialForm(form) {
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";
  form.addEventListener("input", () => updateGeneratedPath(form));
  form.addEventListener("change", () => updateGeneratedPath(form));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const initialLabel = submitButton?.textContent || "Save material";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = form.querySelector('[name="pdf_file"]')?.files?.length ? "Uploading PDF…" : "Saving…";
    }
    try {
      await saveMaterial(form);
      remoteError = "";
      render();
      notify("Material saved.");
    } catch (error) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = initialLabel;
      }
      notify(error.message, true);
    }
  });
}

function bindAdminEvents() {
  document.querySelector("[data-reset-demo]")?.addEventListener("click", () => {
    resetDemoData();
    render();
    notify("Demo data reset.");
  });
  const categoryForm = document.querySelector("#category-form");
  categoryForm?.addEventListener("input", () => {
    const name = String(new FormData(categoryForm).get("name") || "");
    const slugInput = categoryForm.querySelector('[name="slug"]');
    if (slugInput && !slugInput.dataset.touched) slugInput.value = makeSlug(name);
  });
  categoryForm?.querySelector('[name="slug"]')?.addEventListener("input", (event) => {
    event.currentTarget.dataset.touched = "true";
  });
  categoryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await addCategory(categoryForm);
      render();
      notify("Category added. You can now add materials to it.");
    } catch (error) { notify(error.message, true); }
  });
  const login = document.querySelector("#login-form");
  login?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try { await signIn(login); }
    catch (error) { remoteError = error.message; render(); notify(error.message, true); }
  });
  bindMaterialForm(document.querySelector("#material-form"));
  document.querySelector("#admin-filter")?.addEventListener("change", adminListMarkup);
  document.querySelector("[data-admin-refresh]")?.addEventListener("click", async () => {
    try { adminMaterials = await loadAdminMaterials(); adminListMarkup(); notify("Material list refreshed."); }
    catch (error) { notify(error.message, true); }
  });
  document.querySelector("[data-admin-logout]")?.addEventListener("click", async () => {
    setSession(null);
    adminUser = null;
    adminMaterials = [];
    adminMaterialsLoaded = false;
    render();
    notify("Signed out.");
  });
}

document.addEventListener("click", async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest("a[data-link]");
  if (link && link instanceof HTMLAnchorElement && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
    event.preventDefault();
    navigate(`${link.pathname}${link.search}${link.hash}`);
    return;
  }
  if (target?.closest("[data-copy-url]")) {
    try {
      await navigator.clipboard.writeText(canonicalUrl(currentRoute));
      notify("Page link copied.");
    } catch { notify("Could not copy automatically. Copy the address from your browser.", true); }
  }
  if (target?.closest("[data-retry]")) {
    window.location.reload();
  }
  const loadMore = target?.closest("[data-load-more]");
  if (loadMore) {
    const route = loadMore.getAttribute("data-load-more");
    if (!route) return;
    const existing = categoryPageCache.get(route)?.items.length || 0;
    loadMore.setAttribute("disabled", "");
    try {
      await fetchCategoryPage(route, existing);
      if (routeFromLocation().split("?")[0] === route) render();
    } catch (error) {
      notify(`Could not load more materials: ${error.message}`, true);
    }
  }
  const editButton = target?.closest("[data-edit]");
  if (editButton) {
    showEditForm(editButton.getAttribute("data-edit"));
    return;
  }
  const toggleButton = target?.closest("[data-toggle]");
  if (toggleButton) {
    const item = adminMaterials.find((entry) => entry.id === toggleButton.getAttribute("data-toggle"));
    if (!item) return;
    const publish = !item.is_published;
    if (publish && !["original", "licensed", "public_domain"].includes(item.license_status)) {
      notify("Verify distribution permission before publishing this material.", true);
      return;
    }
    try {
      await updateMaterial(item.id, { is_published: publish });
      render();
      notify(publish ? "Material published." : "Material unpublished.");
    } catch (error) { notify(error.message, true); }
    return;
  }
  const deleteButton = target?.closest("[data-delete]");
  if (deleteButton) {
    const item = adminMaterials.find((entry) => entry.id === deleteButton.getAttribute("data-delete"));
    if (!item || !confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try { await deleteMaterial(item.id); render(); notify("Material deleted."); }
    catch (error) { notify(error.message, true); }
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches("[data-search-form]")) return;
  event.preventDefault();
  const query = String(new FormData(form).get("q") || "").trim();
  navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`);
});

document.querySelector(".menu-toggle")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  const nav = document.querySelector(".main-nav");
  const open = nav.classList.toggle("open");
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

window.addEventListener("popstate", render);
window.addEventListener("error", (event) => {
  if (!event.error || currentRoute === "/error") return;
  console.error("Unexpected application error.", event.error);
  navigate("/error", { replace: true });
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unexpected application error.", event.reason);
  notify("Something went wrong. Please try again.", true);
});

async function start() {
  if (isSupabaseReady()) {
    localMaterials = [];
    try { await checkAdminUser(); }
    catch (error) {
      remoteError = `Could not verify admin sign-in: ${error.message}`;
      console.error(remoteError, error);
    }
    try {
      const remoteCategories = await supabaseRequest("categories?select=slug,name,kind,description&order=name.asc");
      if (remoteCategories.length) {
        setCategories(remoteCategories.map((category) => ({
          ...category, title: category.name, icon: category.kind === "Class" ? "▤" : "◈", color: "blue"
        })));
      }
    } catch (error) {
      remoteError = `Could not load live categories: ${error.message}`;
      console.error(remoteError, error);
    }
    await loadRemotePublicMaterials();
    if (currentRoute === "/admin" || routeFromLocation() === "/admin") {
      if (adminUser) {
        try { adminMaterials = await loadAdminMaterials(); adminMaterialsLoaded = true; }
        catch (error) { remoteError = `Could not load admin materials: ${error.message}`; }
      }
    }
  } else {
    loadDemoCategories();
    adminMaterials = [...demoStore()];
  }
  render();
}

start();
