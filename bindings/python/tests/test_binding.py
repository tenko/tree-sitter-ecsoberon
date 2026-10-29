from unittest import TestCase

from tree_sitter import Language, Parser
import tree_sitter_ecsoberon


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            Parser(Language(tree_sitter_ecsoberon.language()))
        except Exception:
            self.fail("Error loading ECSOberon parser grammar")
