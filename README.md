# Markview

Markview is a focused, browser-only viewer for Markdown documents. It accepts one local Markdown file, validates and reads it entirely in the browser, and renders it using GitHub-Flavored Markdown (GFM). No file content is uploaded to a server.

## Setup

Requirements: a current Node.js release and npm.

```bash
npm install
npm run dev
```

Vite prints the local development URL. To create and inspect a production build:

```bash
npm run build
npm run preview
```

Run the automated test suite with:

```bash
npm test
```

## Architecture

The application deliberately uses a small component and utility structure:

```text
src/
  components/
    DocumentViewer.jsx  GFM rendering and safe link behavior
    EmptyState.jsx      File-picker and drop-zone presentation
    ErrorState.jsx      Validation/read error presentation
    Header.jsx          File information, Copy, and Upload new actions
  utils/
    clipboard.js        Rich and plain clipboard representations
    file.js             File validation and browser-side reading
  test/                 Rendering, security, file, UI, and clipboard tests
  App.jsx               Small state coordinator
  index.css             Figma-aligned responsive design and Markdown typography
```

`App.jsx` owns only the current document, error, drag, and copy-confirmation state. File rules and clipboard behavior are kept outside the UI, while each visual state has a focused component.

## Main technical decisions

- React, JavaScript, Vite, and Tailwind CSS satisfy the required client-only stack.
- Files are read with the browser `File` API. The app accepts one `.md` or `.markdown` file at a time with a 10 MB limit.
- The interface follows the supplied Figma screens: compact header, centered reading sheet, restrained monochrome palette, purple accent, clear upload/error states, and an edge-to-edge mobile document view.
- Assignment behavior takes priority where the specification differs from a mockup. For example, Copy and Upload remain accessible on mobile.
- Wide tables and long code lines scroll within the document instead of widening the page. The memoized document viewer avoids re-parsing a large document when only copy feedback changes.
- There is no backend, persistence, editor, search, table of contents, or other out-of-scope feature.

## Markdown rendering and security

Markdown is rendered with [`react-markdown`](https://github.com/remarkjs/react-markdown), with [`remark-gfm`](https://github.com/remarkjs/remark-gfm) for GFM tables, strikethrough, autolinks, and task-list parsing. `rehype-highlight` provides syntax highlighting for fenced code blocks.

Uploaded Markdown is treated as untrusted input. `ReactMarkdown` builds React elements rather than injecting an HTML string, and `skipHtml` explicitly disables embedded raw HTML. Scripts, event-handler attributes, and raw HTML elements in uploaded files are therefore not mounted. The library's safe URL transformation also removes unsafe link protocols. External links use `rel="noreferrer"`.

Malformed or incomplete Markdown is parsed as ordinary text or incomplete Markdown structures; it does not pass through `dangerouslySetInnerHTML` and does not crash the viewer.

## Clipboard implementation

The single Copy action delegates to `src/utils/clipboard.js`. It prepares:

- `text/html`: rendered semantic HTML with inline presentation styles so headings, lists, tables, blockquotes, links, and code remain useful when pasted into Word, Google Docs, or another rich-text editor;
- `text/plain`: the rendered document's readable text;
- `text/markdown`: the original Markdown source when `ClipboardItem` reports support for that MIME type.

If a browser rejects the optional Markdown representation, the utility retries HTML plus plain text. If rich clipboard writes are unavailable, it falls back to copying the raw Markdown as text.

## Error handling

Validation happens before reading. The app reports clear errors for:

- unsupported extensions;
- multiple dropped files;
- files larger than 10 MB;
- missing/unreadable file input.

After an error, the user can immediately choose a different file. Choosing the same filename again also works because the hidden file input is reset before reopening.

## Accessibility and responsive behavior

- State regions use semantic `header`, `main`, `section`, and `article` elements.
- Upload and clipboard actions are native buttons and remain keyboard accessible.
- The error card uses `role="alert"`; copy confirmation uses a polite live region.
- Controls have visible focus treatment and explicit accessible labels where icon-only presentation is used on mobile.
- Filename text truncates safely, document tables and code blocks scroll horizontally, and the reading sheet becomes edge-to-edge below 700 px.
- The file input includes an `accept` hint while validation still occurs in application code.

## Testing

The Vitest/jsdom suite covers the representative sample document, headings, paragraphs, nested ordered/unordered lists, tables, blockquotes, inline and fenced code, bold, italic, strikethrough, links, a 600-section technical document, malformed Markdown, raw-HTML and unsafe-link input, invalid formats, oversized/unreadable files, multiple-file rejection, upload-to-viewer behavior, accessible controls, and all clipboard representations and fallbacks.

Production compilation and CSS processing are verified with `npm run build`. Responsive rules cover desktop and the supplied 390 px mobile layout; final visual comparison should also be performed in a real browser when a browser automation surface is available.

## AI coding assistant usage

An AI coding assistant was used to inspect the supplied design references, scaffold and implement the React UI, separate utilities and components, write the automated tests, and draft this documentation. Its output was checked through source inspection, automated tests, dependency audit, production builds, and comparison against the stated assignment requirements. Design references and assignment constraints remained the source of truth.

## Possible improvements with additional time

- Add real-browser visual regression snapshots at desktop and mobile breakpoints.
- Test paste output directly in Word and Google Docs across major browsers.
- Profile multi-megabyte documents on lower-powered mobile hardware and consider incremental rendering only if measurements justify the added complexity.
- Add an application-level error boundary for unexpected third-party rendering failures.

These are intentionally deferred so the current implementation stays within the assignment scope.
