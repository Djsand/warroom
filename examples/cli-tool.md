# CLI Tool

> Task: "Build a CLI that converts CSV files to JSON"

---

🏗️ **Architect**: Simple and focused:

```
src/
  cli.js      — argument parsing (commander)
  convert.js  — CSV parsing and JSON output
  stream.js   — streaming for large files
```

Design:
- Stream-based processing: handles files larger than available memory
- Auto-detect delimiter (comma, tab, semicolon, pipe)
- Output to stdout by default (pipe-friendly), `--output` flag for file
- `--pretty` flag for formatted JSON

Usage: `csv2json input.csv > output.json`

@Challenger?

---

😈 **Challenger**: Three issues:

1. **No stdin support.** `cat data.csv | csv2json` should work. Unix tools accept both file args and stdin — without this, it can't be composed in pipelines.

2. **Auto-detect delimiter is fragile.** What if a comma-delimited file has semicolons in values? Heuristic: count delimiters in the first 5 lines, pick the most consistent one. But also add `--delimiter` flag for when heuristics fail.

3. **Encoding.** CSV files from Excel on Windows are often UTF-16 LE with BOM. Your stream reader will produce garbage. At minimum: detect and strip UTF-8 BOM. Ideally: accept `--encoding` flag.

---

🏗️ **Architect**: Agreed on all three.

1. If no file arg and stdin is not a TTY, read from stdin
2. Auto-detect with `--delimiter` override. Heuristic: most frequent consistent delimiter across first 5 lines
3. Strip BOM automatically. Add `--encoding` flag defaulting to utf-8. Full encoding support via Node's built-in TextDecoder

@Builder: go.

---

💻 **Builder**: Done. 3 files, 180 lines total.

Key details:
- `convert.js` uses a hand-rolled parser (no dependencies) — handles quoted fields, escaped quotes, newlines inside quotes
- Streaming: processes line-by-line, emits JSON array with `[` on first row, `,\n` between rows, `]` on last
- BOM detection: checks first 3 bytes for `EF BB BF`

No external dependencies. Zero. Ships as a single file after bundling.

@Reviewer @Breaker

---

🔍 **Reviewer**: The hand-rolled CSV parser concerns me. CSV parsing has dozens of edge cases (RFC 4180). But checking the implementation: it handles quoted fields, escaped double quotes (`""`), CRLF vs LF, and fields containing delimiters. That covers the real-world cases.

One issue: the streaming output writes `[` before any rows are validated. If the first row has a parse error, the output is `[\n` followed by an error — not valid JSON. Should buffer until the first row succeeds.

Otherwise clean. Good decision on zero dependencies.

---

🧪 **Breaker**: Torture-testing the parser:

1. **Empty file**: outputs `[]` — correct.
2. **Header only, no rows**: outputs `[]` — should this be an error? At minimum a `--strict` flag should warn.
3. **10GB file**: streaming works, memory stays at ~50MB. Good.
4. **Mixed line endings** (CRLF + LF in same file): parser handles it. Good.
5. **Field with literal newline inside quotes**: `"line1\nline2"` — parsed correctly as a single field.
6. **Malformed quote** (`"unclosed`): **hangs**. The parser keeps reading looking for the closing quote, consuming the entire file into memory. This defeats the streaming architecture. Need a max-field-size limit or a timeout on unclosed quotes.

Bug 6 is critical for production use — a single malformed row causes an OOM on large files.

---

📊 **5 agents** · 6 messages · 1 revision · 2 bugs caught · 3 files · 85s
