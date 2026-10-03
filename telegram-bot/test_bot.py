import unittest
from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

import bot


class MaterialQueryTests(unittest.TestCase):
    def setUp(self):
        bot.materials_cache.clear()
        bot.SUPABASE_URL = "https://project.example"
        bot.SUPABASE_ANON_KEY = "test-publishable-key"

    @patch("bot.request_json")
    def test_material_query_is_filtered_and_cached_by_selection(self, request_json):
        expected = [{
            "category_slug": "neet",
            "type": "pyqs",
            "year": 2025,
            "subject_slug": "biology",
            "file_url": "https://files.example/neet.pdf",
        }]
        request_json.return_value = expected

        first = bot.get_materials(
            force=True,
            category_slug="neet",
            material_type="pyqs",
            year=2025,
            subject_slug="biology",
        )
        second = bot.get_materials(
            category_slug="neet",
            material_type="pyqs",
            year=2025,
            subject_slug="biology",
        )

        self.assertEqual(first, expected)
        self.assertEqual(second, expected)
        self.assertEqual(request_json.call_count, 1)
        filters = parse_qs(urlparse(request_json.call_args.args[0]).query)
        self.assertEqual(filters["category_slug"], ["eq.neet"])
        self.assertEqual(filters["type"], ["eq.pyqs"])
        self.assertEqual(filters["year"], ["eq.2025"])
        self.assertEqual(filters["subject_slug"], ["eq.biology"])
        self.assertEqual(filters["board_slug"], ["is.null"])

    @patch("bot.request_json")
    def test_board_material_query_is_scoped_to_selected_board(self, request_json):
        request_json.return_value = [{
            "category_slug": "class-10",
            "board_slug": "cbse",
            "type": "pyqs",
            "year": 2025,
            "subject_slug": "maths",
            "file_url": "https://files.example/cbse-maths.pdf",
        }]

        rows = bot.get_materials(
            force=True,
            category_slug="class-10",
            material_type="pyqs",
            year=2025,
            subject_slug="maths",
            board_slug="cbse",
        )

        self.assertEqual(rows[0]["board_slug"], "cbse")
        filters = parse_qs(urlparse(request_json.call_args.args[0]).query)
        self.assertEqual(filters["board_slug"], ["eq.cbse"])

    @patch("bot.request_json")
    def test_jac_board_query_uses_database_slug(self, request_json):
        request_json.return_value = [{
            "category_slug": "class-10",
            "board_slug": "jac-board",
            "type": "pyqs",
            "year": 2026,
            "subject_slug": "maths",
            "title": "JAC Class 10 Maths Model Question Paper 2026",
            "slug": "jac-board/class-10/pyqs/2026/maths",
            "file_url": "https://files.example/jac-maths.pdf",
        }]

        rows = bot.get_materials(
            force=True,
            category_slug="class-10",
            material_type="pyqs",
            year=2026,
            subject_slug="maths",
            board_slug="jac-board",
        )

        self.assertEqual(rows[0]["title"], "JAC Class 10 Maths Model Question Paper 2026")
        filters = parse_qs(urlparse(request_json.call_args.args[0]).query)
        self.assertEqual(filters["board_slug"], ["in.(jac-board,jac)"])
        self.assertEqual(bot.website_link(rows[0]), bot.WEBSITE_URL + "/jac-board/class-10/pyqs/2026/maths")

    @patch("bot.request_json")
    def test_jac_board_menu_includes_legacy_jac_materials(self, request_json):
        request_json.return_value = [{
            "category_slug": "class-10",
            "board_slug": "jac",
            "type": "pyqs",
            "year": 2026,
            "subject_slug": "maths",
            "file_url": "https://files.example/jac-maths.pdf",
        }]

        rows = bot.get_materials(force=True, category_slug="class-10", board_slug="jac-board")

        self.assertEqual(rows[0]["board_slug"], "jac-board")

    @patch("bot.request_json")
    def test_latest_material_query_requests_only_eight_rows(self, request_json):
        request_json.return_value = []

        self.assertEqual(bot.get_materials(force=True, limit=bot.PAGE_SIZE), [])

        filters = parse_qs(urlparse(request_json.call_args.args[0]).query)
        self.assertEqual(filters["limit"], [str(bot.PAGE_SIZE)])

    @patch("bot.request_json")
    def test_search_uses_database_rpc_and_only_returns_pdf_links(self, request_json):
        request_json.return_value = [
            {"title": "NEET Biology PYQ", "file_url": "https://files.example/neet.pdf"},
            {"title": "NEET Biology listing", "file_url": None},
        ]

        result = bot.search_materials("NEET Biology PYQs 2025")

        self.assertEqual([row["title"] for row in result], ["NEET Biology PYQ"])
        self.assertIn("/rest/v1/rpc/search_materials", request_json.call_args.args[0])
        self.assertEqual(request_json.call_args.kwargs["payload"]["search_query"], "neet biology pyq 2025")
        self.assertEqual(request_json.call_args.kwargs["payload"]["result_limit"], bot.SEARCH_FETCH_LIMIT)

    def test_material_button_title_is_scannable_and_limited(self):
        title = bot.display_material_title({
            "title": "JAC Class 10 Maths Model Question Paper 2026",
        })

        self.assertEqual(title, "📄 JAC Class 10 Maths Model Question Paper 2026")
        self.assertLessEqual(len(title), 60)
        self.assertEqual(bot.display_material_title({"title": "x" * 100}), "📄 " + "x" * 57)

    @patch("bot.WEBSITE_URL", "https://study.example")
    def test_home_menu_includes_direct_channel_and_website_links(self):
        _, keyboard = bot.home_screen()
        buttons = [item for row in keyboard["inline_keyboard"] for item in row]
        links = {item["url"] for item in buttons if "url" in item}

        self.assertIn(bot.REQUIRED_CHANNEL_URL, links)
        self.assertIn("https://study.example", links)


class ChannelMembershipTests(unittest.TestCase):
    @patch("bot.telegram")
    def test_channel_membership_accepts_members_and_channel_admins(self, telegram):
        for status in ("creator", "administrator", "member"):
            with self.subTest(status=status):
                telegram.return_value = {"status": status}
                self.assertTrue(bot.is_channel_member(123))

        telegram.assert_called_with("getChatMember", {"chat_id": "@pickzenloots", "user_id": 123})

    @patch("bot.telegram")
    def test_restricted_user_must_still_be_a_member(self, telegram):
        telegram.side_effect = [{"status": "restricted", "is_member": True}, {"status": "restricted", "is_member": False}]

        self.assertTrue(bot.is_channel_member(123))
        self.assertFalse(bot.is_channel_member(123))

    @patch("bot.edit_message")
    @patch("bot.is_channel_member", return_value=False)
    def test_nonmember_gets_join_and_retry_buttons(self, is_member, edit_message):
        bot.deliver_material(10, 20, 30, "neet-biology")

        keyboard = edit_message.call_args.args[3]
        self.assertEqual(keyboard["inline_keyboard"][0][0]["url"], "https://t.me/pickzenloots")
        self.assertEqual(keyboard["inline_keyboard"][1][0]["callback_data"], "dl|neet-biology")
        self.assertFalse(any("url" in item and item["url"] == bot.WEBSITE_URL + "/neet-biology"
                             for row in keyboard["inline_keyboard"] for item in row))
        is_member.assert_called_once_with(30)

    @patch("bot.edit_message")
    @patch("bot.is_channel_member", return_value=True)
    def test_member_gets_material_link_only_after_verification(self, is_member, edit_message):
        bot.deliver_material(10, 20, 30, "neet-biology")

        keyboard = edit_message.call_args.args[3]
        self.assertEqual(keyboard["inline_keyboard"][0][0]["url"], bot.WEBSITE_URL + "/neet-biology")
        is_member.assert_called_once_with(30)


class BoardNavigationTests(unittest.TestCase):
    @patch("bot.edit_message")
    def test_board_menu_lists_board_choices_and_classes(self, edit_message):
        bot.board_screen(10, 20)
        keyboard = edit_message.call_args.args[3]["inline_keyboard"]
        board_callbacks = {button["callback_data"] for row in keyboard for button in row}
        board_labels = {button["text"] for row in keyboard for button in row}
        self.assertIn("b|cbse", board_callbacks)
        self.assertIn("b|jac-board", board_callbacks)
        self.assertIn("JAC Board", board_labels)
        self.assertNotIn("JAC", board_labels)

        bot.board_classes_screen("cbse", 10, 20)
        keyboard = edit_message.call_args.args[3]["inline_keyboard"]
        class_callbacks = {button["callback_data"] for row in keyboard for button in row}
        self.assertIn("c|class-10|cbse", class_callbacks)

    @patch("bot.edit_message")
    def test_subject_names_are_presented_in_title_case(self, edit_message):
        bot.show_subjects(
            "class-10",
            "pyqs",
            2026,
            [{
                "category_slug": "class-10",
                "board_slug": "jac-board",
                "type": "pyqs",
                "year": 2026,
                "subject_slug": "maths",
                "subject_name": "maths",
            }],
            10,
            20,
            board_slug="jac-board",
        )

        keyboard = edit_message.call_args.args[3]["inline_keyboard"]
        subject_button = keyboard[0][0]
        self.assertEqual(subject_button["text"], "Maths")
        self.assertEqual(subject_button["callback_data"], "s|class-10|pyqs|maths|2026|jac-board")

    @patch("bot.edit_message")
    @patch("bot.get_materials", return_value=[{
        "category_slug": "class-10",
        "board_slug": "cbse",
        "type": "pyqs",
        "year": 2025,
    }])
    @patch("bot.answer_callback")
    def test_board_pyq_selection_filters_data_and_keeps_board_in_callback(self, answer, get_materials, edit_message):
        bot.handle_callback({
            "id": "callback-1",
            "from": {"id": 123},
            "message": {"chat": {"id": 10}, "message_id": 20},
            "data": "t|class-10|pyqs|cbse",
        })

        get_materials.assert_called_once_with(
            category_slug="class-10",
            material_type="pyqs",
            board_slug="cbse",
        )
        keyboard = edit_message.call_args.args[3]["inline_keyboard"]
        year_callbacks = {button["callback_data"] for row in keyboard for button in row}
        self.assertIn("y|class-10|2025|cbse", year_callbacks)



if __name__ == "__main__":
    unittest.main()
