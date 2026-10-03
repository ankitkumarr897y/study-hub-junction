import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ENV_FILE = ROOT / ".env"
PAGE_SIZE = 8
CACHE_SECONDS = 90
SUPABASE_PAGE_SIZE = 500
SEARCH_FETCH_LIMIT = 100
REQUIRED_CHANNEL = "@pickzenloots"
REQUIRED_CHANNEL_URL = "https://t.me/pickzenloots"

CATEGORIES = [
    ("class-9", "Class 9"),
    ("class-10", "Class 10"),
    ("class-11", "Class 11"),
    ("class-12", "Class 12"),
    ("jee-main", "JEE Main"),
    ("jee-advanced", "JEE Advanced"),
    ("neet", "NEET"),
    ("ssc", "SSC"),
]
BOARDS = [
    ("cbse", "CBSE"),
    ("icse", "ICSE"),
    ("jac-board", "JAC Board"),
    ("up-board", "UP Board"),
    ("bihar-board", "Bihar Board"),
]
TYPE_LABELS = {"pyqs": "Previous Year Questions (PYQs)", "notes": "Notes", "chapter": "Chapter-wise"}


def load_dotenv():
    if not ENV_FILE.exists():
        return
    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip("\"'")
        os.environ.setdefault(key.strip(), value)


load_dotenv()
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
WEBSITE_URL = os.getenv("WEBSITE_URL", "").strip().rstrip("/")


class ApiError(Exception):
    pass


def require_configuration():
    missing = [
        name
        for name, value in (
            ("TELEGRAM_BOT_TOKEN", BOT_TOKEN),
            ("SUPABASE_URL", SUPABASE_URL),
            ("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
            ("WEBSITE_URL", WEBSITE_URL),
        )
        if not value
    ]
    if missing:
        raise RuntimeError("Fill in these settings in telegram-bot/.env: " + ", ".join(missing))
    for label, value in (("SUPABASE_URL", SUPABASE_URL), ("WEBSITE_URL", WEBSITE_URL)):
        parsed = urllib.parse.urlparse(value)
        if parsed.scheme != "https" or not parsed.netloc:
            raise RuntimeError(label + " must be a complete https URL.")


def request_json(url, payload=None, headers=None, timeout=40):
    request_headers = {"Accept": "application/json"}
    if headers:
        request_headers.update(headers)
    data = None
    method = "GET"
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
        method = "POST"
    request = urllib.request.Request(url, data=data, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
    except urllib.error.HTTPError as error:
        raise ApiError("Remote service returned HTTP " + str(error.code)) from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise ApiError("Could not connect to a required online service.") from None
    try:
        return json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ApiError("Online service returned an invalid response.") from None


def telegram(method, payload):
    url = "https://api.telegram.org/bot" + BOT_TOKEN + "/" + method
    result = request_json(url, payload, timeout=45 if method == "getUpdates" else 25)
    if not isinstance(result, dict) or not result.get("ok"):
        description = result.get("description", "Telegram request failed.") if isinstance(result, dict) else "Telegram request failed."
        raise ApiError(description)
    return result.get("result")


materials_cache = {}


def get_materials(force=False, *, category_slug=None, material_type=None, year=None, subject_slug=None, board_slug=None, limit=None):
    cache_key = (category_slug, material_type, year, subject_slug, board_slug, limit)
    cached = materials_cache.get(cache_key)
    if not force and cached and time.time() - cached[0] < CACHE_SECONDS:
        return cached[1]

    selected = "category_slug,board_slug,type,year,subject_slug,subject_name,chapter_slug,title,description,tags,slug,file_url,updated_at"
    filters = {
        "select": selected,
        "is_published": "eq.true",
        "file_url": "not.is.null",
        "order": "updated_at.desc",
    }
    if category_slug:
        filters["category_slug"] = "eq." + category_slug
    if material_type:
        filters["type"] = "eq." + material_type
    if year is not None:
        filters["year"] = "eq." + str(year)
    if subject_slug:
        filters["subject_slug"] = "eq." + subject_slug
    if board_slug == "jac-board":
        filters["board_slug"] = "in.(jac-board,jac)"
    elif board_slug:
        filters["board_slug"] = "eq." + board_slug
    else:
        filters["board_slug"] = "is.null"
    if limit is not None:
        filters["limit"] = str(max(1, min(limit, SUPABASE_PAGE_SIZE)))
    query = urllib.parse.urlencode(filters)
    endpoint = SUPABASE_URL + "/rest/v1/materials?" + query
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    }
    rows = []
    offset = 0
    while True:
        page_headers = dict(headers)
        if limit is None:
            page_headers["Range"] = str(offset) + "-" + str(offset + SUPABASE_PAGE_SIZE - 1)
        page = request_json(endpoint, headers=page_headers)
        if not isinstance(page, list):
            raise ApiError("Supabase returned an unexpected materials response.")
        for row in page:
            if not isinstance(row, dict) or not str(row.get("file_url") or "").startswith("https://"):
                continue
            if board_slug == "jac-board" and row.get("board_slug") == "jac":
                row = {**row, "board_slug": "jac-board"}
            rows.append(row)
        if limit is not None or len(page) < SUPABASE_PAGE_SIZE:
            break
        offset += SUPABASE_PAGE_SIZE

    if len(materials_cache) >= 64:
        expired = [key for key, (cached_at, _) in materials_cache.items()
                   if time.time() - cached_at >= CACHE_SECONDS]
        for key in expired:
            materials_cache.pop(key, None)
        while len(materials_cache) >= 64:
            materials_cache.pop(next(iter(materials_cache)))
    materials_cache[cache_key] = (time.time(), rows)
    return rows


def button(text, callback=None, url=None):
    global alias_sequence
    item = {"text": text[:60]}
    if url:
        item["url"] = url
    else:
        if callback and len(callback.encode("utf-8")) > 64:
            alias_sequence += 1
            token = "a|" + format(alias_sequence, "x")
            callback_aliases[token] = callback
            if len(callback_aliases) > 5000:
                callback_aliases.pop(next(iter(callback_aliases)))
            callback = token
        item["callback_data"] = callback
    return item


def markup(rows):
    return {"inline_keyboard": rows}


def nav_row(callback="home", label="🏠 Main menu"):
    return [button(label, callback=callback)]


def website_link(material):
    slug = str(material.get("slug", "")).strip("/")
    slug = re.sub(r"^jac(?:-board)?/", "jac-board/", slug)
    return WEBSITE_URL + "/" + slug


def display_material_title(material):
    title = str(material.get("title") or "Study material").strip()
    return "📄 " + title[:57]


def home_screen():
    rows = []
    category_buttons = [button(label, callback="c|" + slug) for slug, label in CATEGORIES]
    for index in range(0, len(category_buttons), 2):
        rows.append(category_buttons[index:index + 2])
    rows.insert(0, [button("🏫 School boards", callback="boards")])
    rows.append([button("🆕 Latest materials", callback="latest"), button("🔎 Search", callback="search")])
    rows.append([
        button("📢 Join study channel", url=REQUIRED_CHANNEL_URL),
        button("🌐 Open website", url=WEBSITE_URL),
    ])
    return (
        "Study Hub Junction par swagat hai!\n\nClass ya exam chuniye. Agle buttons se PYQs, notes, subject aur year select karein. Aakhir mein material ka direct website link milega.",
        markup(rows),
    )


def send_message(chat_id, text, keyboard=None):
    payload = {"chat_id": chat_id, "text": text, "disable_web_page_preview": True}
    if keyboard:
        payload["reply_markup"] = keyboard
    telegram("sendMessage", payload)


def edit_message(chat_id, message_id, text, keyboard=None):
    payload = {"chat_id": chat_id, "message_id": message_id, "text": text, "disable_web_page_preview": True}
    if keyboard:
        payload["reply_markup"] = keyboard
    try:
        telegram("editMessageText", payload)
    except ApiError as error:
        if "message is not modified" not in str(error).lower():
            raise


def show_home(chat_id, message_id=None):
    text, keyboard = home_screen()
    if message_id is None:
        send_message(chat_id, text, keyboard)
    else:
        edit_message(chat_id, message_id, text, keyboard)


def category_screen(category_slug, chat_id, message_id):
    label = dict(CATEGORIES).get(category_slug)
    if not label:
        show_home(chat_id, message_id)
        return
    category_screen_for_board(category_slug, None, chat_id, message_id)


def board_screen(chat_id, message_id):
    buttons = [button(label, callback="b|" + slug) for slug, label in BOARDS]
    rows = [buttons[index:index + 2] for index in range(0, len(buttons), 2)]
    rows.append(nav_row())
    edit_message(chat_id, message_id, "Apna school board chuniye:", markup(rows))


def board_classes_screen(board_slug, chat_id, message_id):
    board_name = dict(BOARDS).get(board_slug)
    if not board_name:
        show_home(chat_id, message_id)
        return
    buttons = [
        button(label, callback="c|" + slug + "|" + board_slug)
        for slug, label in CATEGORIES[:4]
    ]
    rows = [buttons[index:index + 2] for index in range(0, len(buttons), 2)]
    rows.extend([nav_row("boards", "⬅️ Boards"), nav_row()])
    edit_message(chat_id, message_id, board_name + "\n\nClass chuniye:", markup(rows))


def category_screen_for_board(category_slug, board_slug, chat_id, message_id):
    label = dict(CATEGORIES).get(category_slug)
    if not label or (board_slug and (board_slug not in dict(BOARDS) or category_slug not in dict(CATEGORIES[:4]))):
        show_home(chat_id, message_id)
        return
    suffix = "|" + board_slug if board_slug else ""
    rows = [
        [button("📄 PYQs", callback="t|" + category_slug + "|pyqs" + suffix),
         button("📝 Notes", callback="t|" + category_slug + "|notes" + suffix)],
        [button("📚 Chapters", callback="t|" + category_slug + "|chapter" + suffix)],
    ]
    if board_slug:
        rows.append(nav_row("b|" + board_slug, "⬅️ Classes"))
    rows.append(nav_row())
    edit_message(chat_id, message_id, label + "\n\nKaunsa material chahiye?", markup(rows))


def type_screen(category_slug, material_type, chat_id, message_id, board_slug=None):
    if material_type not in TYPE_LABELS:
        show_home(chat_id, message_id)
        return
    rows = get_materials(category_slug=category_slug, material_type=material_type, board_slug=board_slug)
    matching = rows
    if material_type == "pyqs":
        years = sorted({row.get("year") for row in matching if row.get("year") is not None}, reverse=True)
        suffix = "|" + board_slug if board_slug else ""
        buttons = [button(str(year), callback="y|" + category_slug + "|" + str(year) + suffix) for year in years]
        keyboard_rows = [buttons[index:index + 3] for index in range(0, len(buttons), 3)]
        if not years:
            text = "Is category ke liye abhi koi published PYQ available nahi hai."
        else:
            text = "PYQ ka year chuniye:"
        keyboard_rows.append(nav_row("c|" + category_slug + suffix, "⬅️ Back"))
        keyboard_rows.append(nav_row())
        edit_message(chat_id, message_id, text, markup(keyboard_rows))
        return
    show_subjects(category_slug, material_type, None, rows, chat_id, message_id, board_slug=board_slug)


def show_subjects(category_slug, material_type, year, rows, chat_id, message_id, page_number=0, board_slug=None):
    matches = [
        row for row in rows
        if row.get("category_slug") == category_slug
        and row.get("type") == material_type
        and row.get("board_slug") == board_slug
        and (year is None or str(row.get("year")) == str(year))
    ]
    subjects = {}
    for row in matches:
        slug = row.get("subject_slug")
        if slug:
            name = str(row.get("subject_name") or slug.replace("-", " ").title()).strip()
            subjects.setdefault(slug, name.title() if name == name.lower() else name)
    items = [(slug, name) for slug, name in sorted(subjects.items(), key=lambda pair: pair[1].lower())]
    start = page_number * PAGE_SIZE
    visible = items[start:start + PAGE_SIZE]
    suffix = "|" + board_slug if board_slug else ""
    rows_of_buttons = [
        [button(name, callback="s|" + category_slug + "|" + material_type + "|" + slug + "|" + (str(year) if year is not None else "x") + suffix)]
        for slug, name in visible
    ]
    if not items:
        text = "Is selection ke liye abhi koi published material nahi hai."
    else:
        text = "Subject chuniye:"
    if start > 0 or start + PAGE_SIZE < len(items):
        page_buttons = []
        if start > 0:
            page_buttons.append(button("⬅️ Previous", callback="sp|" + category_slug + "|" + material_type + "|" + (str(year) if year is not None else "x") + "|" + str(page_number - 1) + suffix))
        if start + PAGE_SIZE < len(items):
            page_buttons.append(button("Next ➡️", callback="sp|" + category_slug + "|" + material_type + "|" + (str(year) if year is not None else "x") + "|" + str(page_number + 1) + suffix))
        rows_of_buttons.append(page_buttons)
    back = "t|" + category_slug + "|" + material_type + suffix
    rows_of_buttons.append(nav_row(back, "⬅️ Back"))
    rows_of_buttons.append(nav_row())
    edit_message(chat_id, message_id, text, markup(rows_of_buttons))


def show_materials(category_slug, material_type, subject_slug, year, chat_id, message_id, page_number=0, board_slug=None):
    matches = get_materials(
        category_slug=category_slug,
        material_type=material_type,
        year=year,
        subject_slug=subject_slug,
        board_slug=board_slug,
    )
    start = page_number * PAGE_SIZE
    visible = matches[start:start + PAGE_SIZE]
    label = dict(CATEGORIES).get(category_slug, category_slug)
    heading = label + " · " + TYPE_LABELS.get(material_type, material_type)
    if year is not None:
        heading += " · " + str(year)
    if visible:
        heading += "\n\nMaterial kholne ke liye uska button dabayein:"
    else:
        heading += "\n\nIs selection ke liye material nahi mila."

    keyboard_rows = [
        [button(display_material_title(row), callback="dl|" + str(row.get("slug") or ""))]
        for row in visible
    ]
    suffix = "|" + board_slug if board_slug else ""
    if start > 0 or start + PAGE_SIZE < len(matches):
        page_buttons = []
        if start > 0:
            page_buttons.append(button("⬅️ Previous", callback="p|" + category_slug + "|" + material_type + "|" + subject_slug + "|" + (str(year) if year is not None else "x") + "|" + str(page_number - 1) + suffix))
        if start + PAGE_SIZE < len(matches):
            page_buttons.append(button("Next ➡️", callback="p|" + category_slug + "|" + material_type + "|" + subject_slug + "|" + (str(year) if year is not None else "x") + "|" + str(page_number + 1) + suffix))
        keyboard_rows.append(page_buttons)
    back_callback = ("y|" + category_slug + "|" + str(year) if year is not None else "t|" + category_slug + "|" + material_type) + suffix
    keyboard_rows.append(nav_row(back_callback, "⬅️ Back"))
    keyboard_rows.append(nav_row())
    edit_message(chat_id, message_id, heading, markup(keyboard_rows))


def show_chapters(category_slug, subject_slug, chat_id, message_id, page_number=0, board_slug=None):
    rows = get_materials(
        category_slug=category_slug,
        material_type="chapter",
        subject_slug=subject_slug,
        board_slug=board_slug,
    )
    chapters = {}
    for row in rows:
        if not row.get("chapter_slug"):
            continue
        chapters.setdefault(row["chapter_slug"], row)
    ordered = sorted(chapters.items(), key=lambda pair: pair[0])
    start = page_number * PAGE_SIZE
    visible = ordered[start:start + PAGE_SIZE]
    suffix = "|" + board_slug if board_slug else ""
    keyboard_rows = [
        [button(
            str(row.get("title") or chapter_slug.replace("-", " ").title())[:60],
            callback="ch|" + category_slug + "|" + subject_slug + "|" + chapter_slug + suffix,
        )]
        for chapter_slug, row in visible
    ]
    if start > 0 or start + PAGE_SIZE < len(ordered):
        page_buttons = []
        if start > 0:
            page_buttons.append(button("⬅️ Previous", callback="cp|" + category_slug + "|" + subject_slug + "|" + str(page_number - 1) + suffix))
        if start + PAGE_SIZE < len(ordered):
            page_buttons.append(button("Next ➡️", callback="cp|" + category_slug + "|" + subject_slug + "|" + str(page_number + 1) + suffix))
        keyboard_rows.append(page_buttons)
    text = "Chapter chuniye:" if ordered else "Is subject ke liye abhi koi published chapter PDF nahi hai."
    keyboard_rows.append(nav_row("t|" + category_slug + "|chapter" + suffix, "⬅️ Back"))
    keyboard_rows.append(nav_row())
    edit_message(chat_id, message_id, text, markup(keyboard_rows))


def show_chapter_material(category_slug, subject_slug, chapter_slug, chat_id, message_id, board_slug=None):
    matches = [
        row for row in get_materials(
            category_slug=category_slug,
            material_type="chapter",
            subject_slug=subject_slug,
            board_slug=board_slug,
        )
        if row.get("chapter_slug") == chapter_slug
    ]
    keyboard_rows = [
        [button(display_material_title(row), callback="dl|" + str(row.get("slug") or ""))]
        for row in matches
    ]
    text = "Is chapter ka study page kholiye:" if matches else "Is chapter ke liye PDF available nahi hai."
    keyboard_rows.append(nav_row("s|" + category_slug + "|chapter|" + subject_slug + "|x" + (("|" + board_slug) if board_slug else ""), "⬅️ Back"))
    keyboard_rows.append(nav_row())
    edit_message(chat_id, message_id, text, markup(keyboard_rows))


def show_latest(chat_id, message_id):
    rows = get_materials(limit=PAGE_SIZE)
    text = "🆕 Latest published materials:"
    keyboard_rows = [
        [button(display_material_title(row), callback="dl|" + str(row.get("slug") or ""))]
        for row in rows
    ]
    if not rows:
        text = "Abhi koi published material available nahi hai."
    keyboard_rows.append(nav_row())
    edit_message(chat_id, message_id, text, markup(keyboard_rows))


def search_materials(query):
    terms = re.findall(r"[a-z0-9]+", query.casefold())
    terms = ["pyq" if term == "pyqs" else "main" if term == "mains" else term for term in terms]
    if not terms:
        return []
    endpoint = SUPABASE_URL + "/rest/v1/rpc/search_materials?file_url=not.is.null"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    }
    result = request_json(
        endpoint,
        payload={
            "search_query": " ".join(terms),
            "result_limit": SEARCH_FETCH_LIMIT,
            "result_offset": 0,
        },
        headers=headers,
    )
    if not isinstance(result, list):
        raise ApiError("Supabase returned an unexpected search response.")
    return [
        row for row in result
        if isinstance(row, dict) and str(row.get("file_url") or "").startswith("https://")
    ][:PAGE_SIZE]


def begin_search(chat_id, message_id=None):
    waiting_for_search.add(chat_id)
    text = "Search ke liye exam, class, subject ya material ka naam bhejiye.\nMisal: NEET Biology PYQ 2025"
    if message_id is None:
        send_message(chat_id, text, markup([nav_row()]))
    else:
        edit_message(chat_id, message_id, text, markup([nav_row()]))


waiting_for_search = set()


def process_search(chat_id, query):
    waiting_for_search.discard(chat_id)
    found = search_materials(query)
    if not found:
        send_message(
            chat_id,
            "Is search ke liye koi published material nahi mila. Doosre shabd try karein ya menu kholiye.",
            markup([[button("🔎 Search again", callback="search")], nav_row()]),
        )
        return
    keyboard_rows = [
        [button(display_material_title(row), callback="dl|" + str(row.get("slug") or ""))]
        for row in found
    ]
    keyboard_rows.append(nav_row())
    send_message(chat_id, "Search results (" + str(len(found)) + " tak dikhaye gaye):", markup(keyboard_rows))


def answer_callback(callback_id):
    telegram("answerCallbackQuery", {"callback_query_id": callback_id})


def is_channel_member(user_id):
    member = telegram("getChatMember", {"chat_id": REQUIRED_CHANNEL, "user_id": user_id})
    if not isinstance(member, dict) or not isinstance(member.get("status"), str):
        raise ApiError("Telegram returned an unexpected channel membership response.")
    status = member["status"]
    return status in ("creator", "administrator", "member") or (
        status == "restricted" and member.get("is_member") is True
    )


def deliver_material(chat_id, message_id, user_id, slug):
    if not is_channel_member(user_id):
        keyboard = markup([
            [button("📢 Join @pickzenloots", url=REQUIRED_CHANNEL_URL)],
            [button("✅ Joined — check again", callback="dl|" + slug)],
            nav_row(),
        ])
        edit_message(
            chat_id,
            message_id,
            "Material link se pehle hamara Telegram channel join karein. Join karne ke baad “Joined — check again” dabayein.",
            keyboard,
        )
        return

    material_url = website_link({"slug": slug})
    keyboard = markup([
        [button("📥 Open material", url=material_url)],
        nav_row(),
    ])
    edit_message(chat_id, message_id, "✅ Channel membership verify ho gayi. Material yahan kholiye:", keyboard)


callback_aliases = {}
alias_sequence = 0


def handle_callback(callback):
    answer_callback(callback["id"])
    message = callback.get("message") or {}
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    message_id = message.get("message_id")
    sender = callback.get("from") or {}
    user_id = sender.get("id")
    if chat_id is None or message_id is None:
        return
    data = str(callback.get("data") or "")
    if data.startswith("a|"):
        data = callback_aliases.get(data, "")
    parts = data.split("|")
    action = parts[0]
    if action != "search":
        waiting_for_search.discard(chat_id)
    try:
        if action == "home":
            show_home(chat_id, message_id)
        elif action == "boards":
            board_screen(chat_id, message_id)
        elif action == "b" and len(parts) == 2:
            board_classes_screen(parts[1], chat_id, message_id)
        elif action == "search":
            begin_search(chat_id, message_id)
        elif action == "latest":
            show_latest(chat_id, message_id)
        elif action == "dl" and len(parts) == 2 and user_id is not None:
            deliver_material(chat_id, message_id, user_id, parts[1])
        elif action == "c" and len(parts) == 2:
            category_screen(parts[1], chat_id, message_id)
        elif action == "c" and len(parts) == 3:
            category_screen_for_board(parts[1], parts[2], chat_id, message_id)
        elif action == "t" and len(parts) == 3:
            type_screen(parts[1], parts[2], chat_id, message_id)
        elif action == "t" and len(parts) == 4:
            type_screen(parts[1], parts[2], chat_id, message_id, parts[3])
        elif action == "y" and len(parts) == 3:
            year = int(parts[2])
            show_subjects(
                parts[1],
                "pyqs",
                year,
                get_materials(category_slug=parts[1], material_type="pyqs", year=year),
                chat_id,
                message_id,
            )
        elif action == "y" and len(parts) == 4:
            year = int(parts[2])
            board_slug = parts[3]
            show_subjects(
                parts[1],
                "pyqs",
                year,
                get_materials(category_slug=parts[1], material_type="pyqs", year=year, board_slug=board_slug),
                chat_id,
                message_id,
                board_slug=board_slug,
            )
        elif action == "sp" and len(parts) == 5:
            year = None if parts[3] == "x" else int(parts[3])
            page_number = max(0, min(int(parts[4]), 10000))
            show_subjects(
                parts[1],
                parts[2],
                year,
                get_materials(category_slug=parts[1], material_type=parts[2], year=year),
                chat_id,
                message_id,
                page_number,
            )
        elif action == "sp" and len(parts) == 6:
            year = None if parts[3] == "x" else int(parts[3])
            board_slug = parts[5]
            show_subjects(
                parts[1],
                parts[2],
                year,
                get_materials(category_slug=parts[1], material_type=parts[2], year=year, board_slug=board_slug),
                chat_id,
                message_id,
                max(0, min(int(parts[4]), 10000)),
                board_slug,
            )
        elif action == "s" and len(parts) == 5:
            year = None if parts[4] == "x" else int(parts[4])
            if parts[2] == "chapter":
                show_chapters(parts[1], parts[3], chat_id, message_id)
            else:
                show_materials(parts[1], parts[2], parts[3], year, chat_id, message_id)
        elif action == "s" and len(parts) == 6:
            year = None if parts[4] == "x" else int(parts[4])
            board_slug = parts[5]
            if parts[2] == "chapter":
                show_chapters(parts[1], parts[3], chat_id, message_id, board_slug=board_slug)
            else:
                show_materials(parts[1], parts[2], parts[3], year, chat_id, message_id, board_slug=board_slug)
        elif action == "cp" and len(parts) == 4:
            page_number = max(0, min(int(parts[3]), 10000))
            show_chapters(parts[1], parts[2], chat_id, message_id, page_number)
        elif action == "cp" and len(parts) == 5:
            show_chapters(parts[1], parts[2], chat_id, message_id, max(0, min(int(parts[3]), 10000)), parts[4])
        elif action == "ch" and len(parts) == 4:
            show_chapter_material(parts[1], parts[2], parts[3], chat_id, message_id)
        elif action == "ch" and len(parts) == 5:
            show_chapter_material(parts[1], parts[2], parts[3], chat_id, message_id, parts[4])
        elif action == "p" and len(parts) == 6:
            year = None if parts[4] == "x" else int(parts[4])
            page_number = max(0, min(int(parts[5]), 10000))
            show_materials(parts[1], parts[2], parts[3], year, chat_id, message_id, page_number)
        elif action == "p" and len(parts) == 7:
            year = None if parts[4] == "x" else int(parts[4])
            page_number = max(0, min(int(parts[5]), 10000))
            show_materials(parts[1], parts[2], parts[3], year, chat_id, message_id, page_number, parts[6])
        else:
            show_home(chat_id, message_id)
    except (ApiError, ValueError) as error:
        print("Could not handle menu selection:", str(error))
        send_message(chat_id, "Abhi request poori nahi ho saki. Thodi der baad phir try karein.", markup([nav_row()]))


def handle_message(message):
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = str(message.get("text") or "").strip()
    if chat_id is None:
        return
    if text.startswith("/start") or text.startswith("/menu"):
        waiting_for_search.discard(chat_id)
        show_home(chat_id)
        return
    if text.startswith("/search"):
        begin_search(chat_id)
        return
    if text.startswith("/help"):
        send_message(chat_id, "Menu kholne ke liye /start bhejein. Material search karne ke liye /search bhejein.")
        return
    if chat_id in waiting_for_search:
        if len(text) < 2:
            send_message(chat_id, "Kam se kam 2 characters bhejiye, jaise: NEET Biology")
        else:
            try:
                process_search(chat_id, text[:120])
            except ApiError as error:
                waiting_for_search.discard(chat_id)
                print("Search failed:", str(error))
                send_message(chat_id, "Search abhi kaam nahi kar raha. Thodi der baad /search try karein.")
        return
    send_message(chat_id, "/start bhejkar menu kholiye, ya /search se material dhoondhiye.")


def handle_update(update):
    callback = update.get("callback_query")
    if callback:
        handle_callback(callback)
        return
    message = update.get("message")
    if message:
        handle_message(message)


def main():
    require_configuration()
    print("Study Hub Junction Telegram bot is running. Press Ctrl+C to stop.")
    offset = None
    while True:
        payload = {"timeout": 30, "allowed_updates": ["message", "callback_query"]}
        if offset is not None:
            payload["offset"] = offset
        try:
            updates = telegram("getUpdates", payload) or []
            for update in updates:
                offset = int(update["update_id"]) + 1
                try:
                    handle_update(update)
                except (ApiError, KeyError, TypeError, ValueError) as error:
                    print("Could not process an update:", str(error))
        except KeyboardInterrupt:
            print("\nBot stopped.")
            return
        except ApiError as error:
            print("Bot connection error:", str(error), "Retrying in 5 seconds.")
            time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        raise SystemExit(str(error))
