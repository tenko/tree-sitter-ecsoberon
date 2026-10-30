/**
 * @file Parser for the ECS Oberon variant (Oberon-2)
 * @author Runar Tenfjord <runar.tenfjord@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  primary: 7,
  unary: 6,
  multiplicative: 5,
  additive: 4,
  comparative: 3,
  and: 2,
  or: 1,
  composite_literal: -1,
};

const multiplicativeOperators = ['*', '/', 'DIV', 'MOD'];
const additiveOperators = ['+', '-'];
const comparativeOperators = ['=', '#', '<', '<=', '>', '>=', 'IN', 'IS'];

const terminator = ';';

const hexDigit = /[0-9a-fA-F]/;
const octalDigit = /[0-7]/;
const decimalDigit = /[0-9]/;
const binaryDigit = /[01]/;

const hexDigits = seq(decimalDigit, repeat(hexDigit));
const octalDigits = seq(octalDigit, repeat(octalDigit));
const decimalDigits = seq(decimalDigit, repeat(seq(optional("'"), decimalDigit)));
const binaryDigits = seq(binaryDigit, repeat(binaryDigit));

const hexLiteral = seq(hexDigits, 'H');
const octalLiteral = seq(octalDigits, 'O');
const decimalLiteral = choice('0', seq(/[1-9]/, optional(decimalDigits)));
const binaryLiteral = seq(binaryDigits, 'B');

const intLiteral = choice(binaryLiteral, decimalLiteral, octalLiteral, hexLiteral);
const charLiteral = seq(decimalDigit, hexDigit, 'X');

const decimalExponent = seq(choice('D', 'E'), optional(choice('+', '-')), seq(decimalDigit, repeat(decimalDigit)));
const floatLiteral = choice(
  seq(decimalDigits, '.', optional(decimalDigits), optional(decimalExponent)),
  seq(decimalDigits, decimalExponent),
  seq('.', decimalDigits, optional(decimalExponent)),
);

export default grammar({
  name: "ecsoberon",

  extras: $ => [
      $.comment,
      /\s/,
  ],

  inline: $ => [
    $._base_type_identifier,
    $._type_identifier,
    $._module_identifier,
    $._template_identifier,
    $._package_identifier,
    $._import_identifier,
    $._import_alias_identifier,
  ],

  word: $ => $.identifier,

  reserved: {
      global: $ => [
      'MODULE', 'END', 'IN', 'IMPORT', 'CONST', 'TYPE', 'VAR', 'ARRAY', 'OF', 'POINTER',
      'BEGIN', 'RECORD', 'PROCEDURE', 'IS', 'FOR', 'TO', 'BY', 'REPEAT', 'UNTIL', 'WHILE',
      'LOOP', 'EXIT', 'RETURN', 'CASE', 'IF', 'THEN', 'ELSE', 'ELSIF', 'WITH', 'DO'
      ],
      properties: $ => [],
    },

  supertypes: $ => [
    $._basic_type,
    $._expression,
    $._statement,
    $._simple_statement,
  ],

  rules: {
    source_file: $ => seq(
      $.module_header,
      repeat($.import_declaration),
      seq(
        repeat($.const_declaration),
        repeat($.type_declaration),
        repeat($.var_declaration),
        repeat($.procedure_declaration),
      ),
      optional($.module_body),
      $.module_footer,
      optional($.module_prolog)
    ),

    module_header: $ => seq(
      'MODULE',
      field('name', $._module_identifier),
      optional(seq('(', field('template', commaSep1($._template_identifier)), ')')),
      optional(seq('IN', field('package', $._package_identifier))),
      terminator
    ),

    module_body: $ => seq(
      'BEGIN',
      $.statement_list
    ),

    module_footer: $ => seq(
      'END',
      $._module_identifier,
      $.dot
    ),
    dot: _ => '.',

    module_prolog: $ => field('prolog', /.+/),

    import_declaration: $ => choice(
      seq(
        'IMPORT',
        commaSep1(seq($.import_spec, optional(seq('IN', field('package', $._package_identifier))))),
        terminator
      ),
      seq(
        'IN',
        field('package', $._package_identifier),
        'IMPORT',
        commaSep1($.import_spec),
        terminator
      )
    ),

    import_spec: $ => choice(
      seq(field('name', $._import_alias_identifier), ':=', $._import_identifier),
      field('name', $._import_identifier)
    ),

    const_declaration: $ => seq(
        'CONST',
        repeat1(seq($.const_spec, terminator))
    ),

    const_spec: $ => prec.left(seq(
      field('name',$.identifier_exported),
      '=',
      field('value', $._expression),
    )),

    type_declaration: $ => seq(
        'TYPE',
        repeat1(seq($.type_spec, terminator))
    ),

    type_spec: $ => prec.left(seq(
      field('name',$.identifier_exported),
      '=',
      field('type', $._type),
    )),

    var_declaration: $ => seq(
        'VAR',
        repeat1(seq($.var_spec, terminator))
    ),

    var_spec: $ => prec.left(seq(
      optional('^'),
      field('name', $.identifier_field),
      optional(seq("[", $._expression, "]")),
      ':',
      field('type', $._type),
    )),

    _type: $ => choice(
      $._basic_type,
      $._qualified_type,
      $._structural_type,
    ),

    _basic_type: $ => $._base_type_identifier,

    _structural_type: $ => choice(
      $._array_type,
      $._pointer_type,
      $.record_type,
      $._procedure_type
    ),

    _qualified_type: $ => seq(
      repeat1(seq(field('package', $._package_identifier), '.')),
      field('name', $._type_identifier),
    ),

    _array_type: ($) => seq(
      'ARRAY',
      optional(commaSep1($._expression)),
      'OF',
      $._type
    ),

    _pointer_type: ($) => seq(
      'POINTER',
      'TO',
      choice(
        seq('VAR', optional('-'), $.identifier),
        $._type
      )
    ),

    record_type: ($) => seq(
      'RECORD',
      optional(choice('*', '-')),
      optional(seq('(', $._type, ')')),
      optional(seq($._record_field, repeat(seq(terminator, $._record_field)))),
      'END',
    ),

    _record_field: ($) => seq($.identifier_field, ':', $._type),

    _procedure_type: ($) => prec.left(seq(
      'PROCEDURE',
      field('parameters', optional($._formal_parameter_list)),
      field('return_type', optional(seq(':', $._basic_type))),
    )),

    procedure_header: ($) => seq(
      'PROCEDURE',
      field('receiver', optional(seq('(', $._receiver_parameter, ')'))),
      field('name', $.identifier_exported),
      optional(
        seq(
          field('parameters', $._formal_parameter_list),
          field('return_type', optional(seq(':', $._basic_type))),
        ),
      ),
    ),

    procedure_body: ($) => $.statement_list,

    _procedure_footer: ($) => seq(
      'END',
      field('name', $.identifier),
    ),

    procedure_declaration: $ => prec.right(1, seq(
      $.procedure_header,
      terminator,
      optional($.const_declaration),
      optional($.type_declaration),
      optional($.var_declaration),
      optional($.procedure_declaration),
      'BEGIN',
      optional($.procedure_body),
      $._procedure_footer,
      terminator
    )),

    _formal_parameter_list: ($) => prec.left(seq(
      '(',
      sep1($._formal_parameter, terminator),
      ')',
      optional(seq(':', $._type))
    )),

    _formal_parameter: ($) => seq(
      optional('VAR'),
      commaSep1($.identifier_parameter),
      ':', $._type,
    ),

    _receiver_parameter: ($) => seq(
      optional('VAR'),
      $._receiver_identifier,
      ':',
      $._type,
    ),

    _expression: $ => choice(
      $.unary_expression,
      $.binary_expression,
      $.selector_expression,
      $.index_expression,
      $.set_literal,
      $.string_literal,
      $.int_literal,
      $.float_literal,
      $.char_literal,
      $.inf,
      $.nan,
      $.nil,
      $.true,
      $.false,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')',
    ),

    set_literal: ($) => seq(
      "{",
      commaSep(seq($._expression, optional(seq('..', $._expression)))),
      "}"
    ),

    selector_expression: $ => prec(PREC.primary, seq(
      field('qualiden', $.qualified_identifier),
      field('parameters', optional(seq('(', commaSep($._expression), ')')))
    )),

    index_expression: $ => prec(PREC.primary, seq(
      field('qualiden', $.qualified_identifier),
      '[',
      field('field', commaSep1($._expression)),
      ']'
    )),

    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('+', '-', '~')),
      field('operand', $._expression),
    )),

    binary_expression: $ => {
      const table = [
            [PREC.multiplicative, choice(...multiplicativeOperators)],
            [PREC.additive, choice(...additiveOperators)],
            [PREC.comparative, choice(...comparativeOperators)],
            [PREC.and, '&'],
            [PREC.or, 'OR'],
          ];
          return choice(...table.map(([precedence, operator]) =>
            // @ts-ignore
            prec.left(precedence, seq(
              field('left', $._expression),
              // @ts-ignore
              field('operator', operator),
              field('right', $._expression),
            )),
          ));
    },

    statement_list: $ => seq(
      $._statement,
      repeat(seq(terminator, $._statement)),
      optional(terminator),
    ),

    _statement: $ => choice(
      $._simple_statement,
      $.empty_statement,
      $.exit_statement,
      $.return_statement,
      $.loop_statement,
      $.for_statement,
      $.repeat_statement,
      $.while_statement,
      $.case_statement,
      $.with_statement,
      $.if_statement,
    ),

    empty_statement: _ => terminator,

    _simple_statement: $ => choice(
      $.assignment_statement,
    ),

    assignment_statement: $ => seq(
      field('left', $.identifier),
      field('operator', ":="),
      field('right', $._expression),
    ),

    exit_statement: $ => seq('EXIT'),

    return_statement: $ => seq(
      'RETURN',
      $._expression,
    ),

    loop_statement: $ => seq(
      'LOOP',
      $.statement_list,
      'END'
    ),

    while_statement: $ => seq(
      'WHILE',
      $._expression,
      'DO',
      $.statement_list,
      'END'
    ),

    for_statement: $ => seq(
      'FOR',
      $.assignment_statement,
      'TO',
      $._expression,
      optional(seq('BY', $._expression)),
      'DO',
      $.statement_list,
      'END'
    ),

    repeat_statement: $ => seq(
      'REPEAT',
      $.statement_list,
      'UNTIL',
      $._expression
    ),

    case_statement: $ => seq(
      'CASE',
      $._expression,
      'OF',
      $.cause_clause,
      repeat(seq("|", $.cause_clause)),
      optional(seq('ELSE', $.statement_list)),
      'END'
    ),

    cause_clause: ($) => seq(
      commaSep1($.case_range),
      ':',
      $.statement_list
    ),

    case_range: ($) => seq(
      $.case_label,
      optional(seq('..', $.case_label))
    ),

    case_label: ($) => choice(
      $.int_literal, $.string_literal, $.char_literal, $.case_field
    ),

    case_field: $ => seq(
      field('operand', optional(seq(sep1($.identifier, '.'), '.'))),
      field('field', $.identifier)
    ),

    with_statement: $ => seq(
      'WITH',
      $._expression,
      ':',
      $._expression,
      'DO',
      $.statement_list,
      repeat(seq(
        "|",
        $._expression,
        ':',
        $._expression,
        'DO',
        $.statement_list
      )),
      optional(seq('ELSE', $.statement_list)),
      'END'
    ),

    if_statement: $ => seq(
      'IF',
      $._expression,
      'THEN',
      $.statement_list,
      repeat(seq(
        'ELSIF',
        $._expression,
        'THEN',
        $.statement_list,
      )),
      optional(seq(
        'ELSE',
        $.statement_list,
      )),
      'END'
    ),

    identifier: _ => /[a-zA-Z][_a-zA-Z0-9]*/,

    qualified_identifier: ($) => prec.left(
      choice(
        seq($.identifier),
        seq(
          field("qualifier", repeat1(seq($.identifier, $.dot))),
          field("property", $.identifier),
        )
      ),
    ),

    identifier_exported: ($) => seq($.identifier, optional("*")),
    identifier_field: ($) => seq($.identifier, optional(choice("*","-"))),
    identifier_parameter: ($) => seq($.identifier, optional("-")),

    _base_type_identifier: $ => alias($.identifier, $.base_type_identifier),
    _type_identifier: $ => alias($.identifier, $.type_identifier),
    _receiver_identifier: $ => alias($.identifier, $.receiver_identifier),
    _module_identifier: $ => alias($.identifier, $.module_identifier),
    _template_identifier: $ => alias($.identifier_exported, $.template_identifier),
    _package_identifier: $ => alias($.identifier, $.package_identifier),
    _import_identifier: $ => alias($.identifier, $.import_identifier),
    _import_alias_identifier: $ => alias($.identifier, $.import_alias_identifier),

    string_literal: $ => choice(/"[^"]*"/, /'[^']*'/),
    int_literal: _ => token(intLiteral),
    float_literal: _ => token(floatLiteral),
    char_literal: _ => token(charLiteral),
    inf: _ => 'INF',
    nan: _ => 'NAN',
    nil: _ => 'NIL',
    true: _ => 'TRUE',
    false: _ => 'FALSE',

    comment: ($) => token(/[(][*]([^*]*[*]+[^)*])*[^*]*[*]+[)]/),
  }
});

/* Creates a rule to match one or more occurrences of `rule` separated by `sep` */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

/* Creates a rule to match one or more of the rules separated by a comma */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/* Creates a rule to optionally match one or more of the rules separated by a comma */
function commaSep(rule) {
  return optional(commaSep1(rule));
}
