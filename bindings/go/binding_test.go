package tree_sitter_ecsoberon_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_ecsoberon "github.com/tree-sitter/tree-sitter-ecsoberon/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_ecsoberon.Language())
	if language == nil {
		t.Errorf("Error loading ECSOberon parser grammar")
	}
}
