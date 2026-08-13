# Markview

Markview is a polished, browser-only Markdown viewer built with React, JavaScript, Vite, and Tailwind CSS. It accepts one local Markdown file, validates and reads it entirely in the browser, and renders safe GitHub-Flavored Markdown (GFM). No document content is uploaded to a server.

## Setup

Requirements: a current Node.js release and npm.

```bash
npm install
npm run dev
```

Vite prints the local development URL. To build and preview the production application:

```bash
npm run build
npm run preview
```

Run the automated test suite with:

```bash
npm test
```

## Current functionality

- Upload or drag and drop one `.md` or `.markdown` file up to 10 MB.
- Read and process the file entirely in the browser.
- Strip valid YAML frontmatter and optionally show its `title` in the header.
- Render headings, paragraphs, nested lists, task lists, tables, blockquotes, inline code, fenced code, bold, italic, strikethrough, links, and autolinks.
- Generate stable, unique heading IDs and a hierarchical table of contents.
- Navigate main sections and deeply nested subsections with one click.
- Search rendered document content with result highlighting and keyboard navigation.
- Copy the whole document in rich HTML, plain text, and Markdown representations where supported.
- Copy individual fenced code blocks.
- Toggle GFM task-list checkboxes locally after upload.
- Switch between polished light and dark themes.
- Use responsive desktop, tablet, and mobile layouts.
- Recover from invalid files, malformed Markdown, clipboard limitations, and unexpected renderer errors.

## Architecture

The project keeps UI components separate from focused document-processing utilities:

```text
src/
  components/
    CodeBlock.jsx               Syntax highlighting and code-block copy
    DocumentSearch.jsx          Search dialog, matches, and result navigation
    DocumentViewer.jsx          Safe GFM rendering and viewer composition
    EmptyState.jsx              File-picker and drag-and-drop landing state
    ErrorState.jsx              Recoverable validation/read error UI
    Header.jsx                  File metadata and document actions
    RenderErrorBoundary.jsx     Unexpected renderer failure fallback
    TableOfContents.jsx         Desktop/mobile hierarchical navigation
    TaskCheckbox.jsx            Interactive GFM task-list checkbox
  utils/
    clipboard.js                Rich, plain-text, and Markdown clipboard output
    file.js                     Validation, reading, and frontmatter preprocessing
    focus.js                    Focus trapping and restoration helpers
    headings.js                 Heading extraction, slugs, IDs, and tree building
    loadHighlightLanguage.js    Deferred uncommon syntax-language loader
    search.js                   Rendered-document search and highlighting
  test/
    fixtures/                   Representative and malformed Markdown samples
    *.test.*                    Unit, component, security, and workflow tests
  App.jsx                       Top-level file and screen-state coordinator
  main.jsx                      React/Vite entry point
  index.css                     Themes, Markdown typography, and responsive UI

test-samples/
  clipboard-rich-content.md     Manual rich-clipboard compatibility sample
```

`App.jsx` owns only application-level state: the current document, validation error, drag state, and copy confirmation. Search, theme, navigation, and code/task interactions remain local to the components that use them. Deterministic operations such as validation, heading generation, focus handling, search, and clipboard formatting live in independently testable utilities.

## Main technical decisions

- React local state is sufficient for the small state graph; a global state library would add unnecessary complexity.
- Files are read with `File.text()` and never sent to a backend.
- `react-markdown` renders Markdown as React elements instead of blindly injecting uploaded HTML.
- `remark-gfm` provides GFM tables, task lists, strikethrough, and autolinks.
- A stack-based `O(n)` algorithm converts flat headings into a nested TOC tree.
- The same deterministic slug algorithm is used during heading extraction and rendering, including duplicate and Unicode headings.
- Search operates on rendered text so results match what the user actually sees.
- Wide tables and long code lines scroll inside the document instead of expanding the page.
- The viewer memoizes heading parsing and keeps static renderer configuration outside the render cycle.
- Search is loaded through `React.lazy`; syntax highlighting uses `highlight.js/core` with common languages registered eagerly and uncommon languages loaded only when requested.

There is intentionally no backend, editor, account system, cloud storage, collaboration, or document persistence.

## File validation and frontmatter

Validation runs before reading and checks:

- a readable browser `File` was supplied;
- exactly one file is selected or dropped;
- its extension is `.md` or `.markdown`, case-insensitively;
- its size does not exceed 10 MB.

File-reading failures produce a clear recoverable error. The hidden input is reset before reopening, so users can select the same filename again.

Valid top-of-file YAML frontmatter delimited by `---` is removed before rendering. The preprocessor supports BOM-prefixed files, LF/CRLF line endings, and quoted or unquoted `title` values. Incomplete frontmatter is left visible rather than silently deleting potentially meaningful content. This is intentionally lightweight frontmatter extraction, not a complete YAML parser.

## Markdown rendering and security

Uploaded Markdown is treated as untrusted input. `ReactMarkdown` builds React elements, and `skipHtml` prevents embedded raw HTML, scripts, and event-handler attributes from being mounted. Unsafe link protocols are not exposed as executable URLs. External links open separately and use `rel="noreferrer"`. Code blocks are displayed and highlighted but never executed.

Syntax highlighting uses `highlight.js/core`. JavaScript/JSX, Python, Bash, JSON, CSS, HTML/XML, and Markdown are available immediately. An explicitly tagged uncommon language is loaded as a deferred production chunk; unknown language tags remain readable as plain code.

Malformed Markdown is not repaired, but it remains usable wherever reasonably possible. Dedicated fixtures cover unclosed fences, mismatched emphasis, irregular tables, deep mixed lists, and duplicate Unicode/emoji headings. A renderer error boundary prevents unexpected third-party failures from blanking the application.

## Table of contents and search

Heading extraction creates stable unique IDs such as `setup`, `setup-1`, and `setup-2`. Unicode letters and numbers remain valid, accents are normalized, and empty slugs fall back to `section`.

Desktop shows main sections on the left and active-section subsections on the right. Tablet and mobile use an off-canvas document menu containing the complete nested TOC plus Copy, appearance, and Upload actions. Navigation accounts for the sticky header, updates the URL hash, focuses the destination heading, and announces `Jumped to [heading]` through a polite live region.

Search is lazy-loaded and supports `Ctrl/Cmd + K`, contextual result previews, previous/next traversal, Arrow keys, Enter, Escape, match highlighting, focus trapping, and focus restoration.

## Clipboard implementation

The document-level Copy action delegates to `src/utils/clipboard.js` and attempts one `ClipboardItem` containing:

- `text/html`: safe rendered HTML with semantic headings, tables, nested lists, blockquotes, links, emphasis, and code;
- `text/plain`: readable text from the rendered article;
- `text/markdown`: the preprocessed Markdown when the browser reports support for that MIME type.

Inline styles are added because Word, Google Docs, and other rich-text destinations may discard application CSS classes. Search highlights and interface copy buttons are removed from the copied HTML. If a browser rejects `text/markdown`, the utility retries with HTML and plain text. If rich clipboard writing is unavailable, it falls back to copying Markdown through `writeText()` or the legacy textarea method.

`test-samples/clipboard-rich-content.md` is provided for manual paste testing. Automated tests verify semantic table tags, nested list structure, inline styles, all supported MIME representations, optional Markdown omission, and text fallback.

## Accessibility and responsive behavior

- Semantic `header`, `main`, `section`, `article`, and `nav` regions.
- Native keyboard-operable buttons, links, checkboxes, and file input.
- Explicit accessible names for icon-only controls.
- Focus trapping and restoration in the search dialog and mobile navigation drawer.
- Destination-heading focus and live announcements after TOC navigation.
- Error alerts and polite copy-status announcements.
- Visible focus styles and Escape-key dismissal.
- `prefers-reduced-motion` support for transitions and animations.
- Increased muted-text contrast in light and dark themes.
- Responsive desktop, tablet, 375–390 px mobile layouts.
- Horizontally scrollable tables and code blocks on narrow screens.

## Error handling and resilience

The application handles unsupported formats, multiple files, oversized files, unreadable files, incomplete frontmatter, malformed Markdown, unknown syntax languages, unavailable heading targets, clipboard permission/API failures, and unexpected React rendering errors. Every user-facing failure keeps a path to upload another document.

## Testing

The Vitest/React Testing Library suite currently contains 47 tests across seven test files. Coverage includes:

- file validation, reading failures, and frontmatter extraction;
- all required GFM structures and interactive task lists;
- heading slugs, nesting, duplicates, Unicode, and navigation;
- malformed-input fixtures and a 600-section technical document;
- raw HTML and unsafe-link handling;
- search, highlighting, keyboard behavior, focus restoration, and mobile actions;
- whole-document and code-block clipboard behavior;
- semantic rich clipboard tables and nested lists;
- lazy uncommon-language highlighting;
- error-boundary recovery;
- theme persistence and document replacement.

Production compilation is verified with `npm run build`, and whitespace errors are checked before completion.

## Performance and bundle optimization

The original main JavaScript chunk was 555.11 KB (171.39 KB gzip). After moving Search and uncommon syntax languages out of the initial path, the measured main chunk is approximately 430 KB (136 KB gzip), a reduction of about 22.5%. Search is roughly 4.24 KB deferred, while the uncommon-language registry and requested grammar are downloaded only when needed.

Exact hashed filenames and small size differences may change between builds.

## AI coding assistant usage

An AI coding assistant was used to analyze supplied design references, scaffold and refine the React UI, separate components and utilities, identify edge cases, generate test scenarios, optimize the bundle, and draft documentation. Its output was not accepted without review: implementation decisions were checked through source inspection, targeted tests after each change, the complete automated suite, dependency audits, and production builds. The assignment requirements and design references remained the source of truth.

During review or interview, the implementation can be explained in terms of the complete pipeline:

```text
Upload → validate → read → strip frontmatter → parse headings → render safe GFM
       → build TOC → enable search/navigation → copy in multiple formats
```

## Known limitations and improvements with additional time

- Rich clipboard structure is automated-test verified, but final paste behavior should still be checked manually in current versions of Microsoft Word and Google Docs across major browsers.
- `text/markdown` contains the cleaned Markdown after frontmatter removal, not the byte-for-byte original uploaded source. Preserving both would require storing a separate raw source value.
- The final `writeText()` fallback copies Markdown syntax rather than rendered plain text; the multi-format ClipboardItem still contains the correct `text/plain` representation when supported.
- Frontmatter handling extracts only a simple `title`; a full YAML library would be appropriate if arbitrary nested metadata became a requirement.
- Add real-browser Playwright tests, Axe accessibility checks, and visual regression snapshots for all themes and breakpoints.
- Profile multi-megabyte documents on lower-powered devices and consider Web Worker parsing or incremental rendering only if measurements justify the added complexity.
- Add deployment-level Content Security Policy and automated dependency vulnerability scanning.

These items are documented explicitly so the required, polished core remains clear and the project does not imply support that has not been verified.
