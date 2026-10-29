import XCTest
import SwiftTreeSitter
import TreeSitterEcsoberon

final class TreeSitterEcsoberonTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_ecsoberon())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ECSOberon parser grammar")
    }
}
