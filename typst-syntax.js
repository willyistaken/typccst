// src/typst-syntax.js

// 此檔案定義了 Typst 語言的 Monarch 語法高亮規則
export function registerTypstLanguage(monaco) {
  // 1. 註冊語言 ID
  monaco.languages.register({ id: 'typst' });

  // 2. 設定語言配置 (例如註解符號、括號配對)
  monaco.languages.setLanguageConfiguration('typst', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '`', close: '`' },
      { open: '*', close: '*' },
      { open: '_', close: '_' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '`', close: '`' },
      { open: '*', close: '*' },
      { open: '_', close: '_' },
    ],
  });

  // 3. 設定 Monarch Tokenizer (核心高亮規則)
  monaco.languages.setMonarchTokensProvider('typst', {
    keywords: [
      '#import', '#include', '#let', '#set', '#show', '#if', '#else', 
      '#for', '#in', '#while', '#break', '#continue', '#return',
      'and', 'or', 'not', 'in', 'as',
    ],
    constants: [
      'auto', 'none', 'true', 'false',
    ],
    typeKeywords: [
      'left', 'right', 'top', 'bottom', 'center', 'horizon',
      'ltr', 'rtl', 'start', 'end',
      'serif', 'sans-serif', 'monospace',
    ],
    operators: [
      '+', '-', '*', '/', '=', '==', '!=', '<', '<=', '>', '>=', '=>',
      '+=', '-=', '*=', '/=', '..',
    ],
    symbols: /[=><!~?:&|+\-*/^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    
    tokenizer: {
      root: [
        // 【新增】在 root 狀態下也能辨識註解
        [/\/\/.*/, 'comment'],
        [/\/\*/, 'comment', '@comment'],

        // 標題 (Headings)
        [/^=+\s+.*/, 'keyword'],

        // 列表 (Lists)
        [/^[\s]*[-\+]\s+/, 'keyword'],
        [/^[\s]*[0-9]+\.\s+/, 'keyword'],
        // 程式碼區塊
        [/```typst/, { token: 'string', next: '@codeblock' }],
        [/```/, { token: 'string', next: '@codeblock' }],
        
        // 數學模式
        [/\$/, { token: 'string.special', next: '@math' }],

        // 程式碼模式 (Code mode)
        [/#/, { token: 'keyword.expr', next: '@code' }],
        
        // 標記語法 (Markup)
        [/\*[^\s*][^*]*[^\s*]\*/, 'strong'], // Bold
        [/_[^\s_][^_]*[^\s_]_/, 'emphasis'], // Italic
        [/`[^`]*`/, 'string.monospace'], // Raw text
        [/https?:\/\/[^\s)]+/, 'string.link'],
      ],

      codeblock: [
          [/```/, { token: 'string', next: '@pop' }],
          [/.*/, ''], // 程式碼區塊內維持預設
      ],

      math: [
        [/\$/, { token: 'string.special', next: '@pop' }],
        [/[^$]+/, 'string.special'],
      ],

      code: [
        // 註解
        [/\/\/.*/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        
        // 關鍵字和運算子
        [/[a-zA-Z_][\w-]*/, {
            cases: {
                '@keywords': 'keyword',
                '@constants': 'constant',
                '@typeKeywords': 'type',
                '@default': 'identifier'
            }
        }],

        // 數字
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/\d+/, 'number'],
        
        // 分隔符
        [/[;,.]/, 'delimiter'],
        [/[\[\]()]/, '@brackets'],

        // 字串
        [/"/, 'string', '@string_double'],
        
        // 運算子
        [/@symbols/, {
            cases: {
                '@operators': 'operator',
                '@default': ''
            }
        }],

        // Code mode ends with a space, newline, or some punctuation
        [/[\s,;.)\]]/, { token: '@rematch', next: '@pop' }],
        [/$/, { token: '@rematch', next: '@pop' }],
      ],

      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment']
      ],

      string_double: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, 'string', '@pop']
      ],
    },
  });

  console.log("Typst language syntax highlighting registered.");
}
