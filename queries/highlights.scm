; Identifiers

(identifier) @variable

; delimiters

[
  ":"
	";"
	","
	(dot)
] @punctuation.delimiter

; Operators

[
  "+"
  "-"
  "^"
  "*"
  "="
  ":="
  "<"
  "<="
  ">"
  ">="
  "#"
  "["
  "]"
  "{"
  "}"
  "|"
  "~"
  "OR"
  "&"
] @operator

; Keywords
[
 "MODULE"
  "END"
  "IN"
  "IMPORT"
  "CONST"
  "TYPE"
  "VAR"
  "ARRAY"
  "OF"
  "POINTER"
  "TO"
  "BEGIN"
  "RECORD"
  "PROCEDURE"
  "IS"
  "FOR"
  "TO"
  "DO"
  "REPEAT"
  "UNTIL"
  "WHILE"
  "CASE"
  "ELSE"
  "IF"
  "THEN"
  "ELSIF"
  "WITH"
  "RETURN"
  "EXIT"
  "WITH"
] @keyword

; Builting Types
((base_type_identifier) @type.builtin
  (#any-of? @type.builtin
	"SET"
  "LENGTH"
  "INTEGER"
  "LONGINT"
  "SHORTINT"
  "BOOLEAN"
  "REAL"
  "LONGREAL"
  "SHORTREAL"
  "CHAR"
  "CARDINAL"
  "COMPLEX"
  "COMPLEX32"
  "COMPLEX64"
  "HUGECARD"
  "HUGEINT"
  "LENGTH"
  "LONGCARD"
  "LONGCOMPLEX"
  "LONGSET"
  "REAL32"
  "REAL64"
  "SET8"
  "SET16"
  "SET32"
  "SET64"
  "SHORTCARD"
  "SHORTCOMPLEX"
  "SHORTREAL"
  "SIGNED8"
  "SIGNED16"
  "SIGNED32"
  "SIGNED64"
  "UNSIGNED8"
  "UNSIGNED16"
  "UNSIGNED32"
  "UNSIGNED64"
))

; Literals

[
  (char_literal)
] @string.special

[
  (string_literal)
] @string

[
  (int_literal)
  (float_literal)
] @number

[
  (inf)
  (nan)
  (nil)
  (true)
  (false)
] @constant.builtin

(comment) @comment
