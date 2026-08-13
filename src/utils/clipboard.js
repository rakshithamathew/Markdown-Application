const INLINE_STYLES = {
  H1: 'font-size:26px;line-height:1.25;margin:0 0 18px;font-weight:700;color:#171923;border-bottom:1px solid #e8e9ed;padding-bottom:14px;',
  H2: 'font-size:19px;line-height:1.3;margin:26px 0 10px;font-weight:700;color:#171923;border-bottom:1px solid #e8e9ed;padding-bottom:8px;',
  H3: 'font-size:16px;line-height:1.35;margin:22px 0 8px;font-weight:700;color:#171923;',
  P: 'margin:0 0 14px;line-height:1.7;',
  BLOCKQUOTE: 'margin:18px 0;border-left:3px solid #6258ee;background:#fafaff;padding:10px 14px;color:#626977;',
  PRE: 'margin:16px 0;padding:16px 18px;background:#12141a;color:#e3e5eb;border-radius:6px;white-space:pre-wrap;font-family:Consolas,monospace;font-size:12px;',
  CODE: 'font-family:Consolas,monospace;background:#f1f0ff;color:#5145d7;padding:2px 4px;border-radius:3px;',
  TABLE: 'width:100%;border-collapse:collapse;margin:16px 0;',
  TH: 'border:1px solid #dfe1e6;background:#f5f5f7;padding:8px 10px;text-align:left;color:#252831;font-weight:700;',
  TD: 'border:1px solid #dfe1e6;padding:8px 10px;text-align:left;',
  A: 'color:#5145d7;text-decoration:underline;',
  UL: 'margin:0 0 14px;padding-left:24px;',
  OL: 'margin:0 0 14px;padding-left:24px;',
  LI: 'margin:4px 0;',
}

function createRichHtml(html) {
  const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = parsed.body.firstElementChild

  root.querySelectorAll('mark[data-search-match]').forEach((mark) => mark.replaceWith(mark.textContent))
  root.querySelectorAll('[data-clipboard-exclude]').forEach((element) => element.remove())

  root.setAttribute('style', 'font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#616876;')
  root.querySelectorAll('*').forEach((element) => {
    const style = INLINE_STYLES[element.tagName]
    if (style) element.setAttribute('style', style)
  })

  root.querySelectorAll('pre code').forEach((code) => {
    code.setAttribute('style', 'font:inherit;background:transparent;color:inherit;padding:0;')
  })

  return root.outerHTML
}

export async function copyMarkdownDocument({ markdown, html, plainText }) {
  const richHtml = createRichHtml(html)

  if (navigator.clipboard?.write && window.ClipboardItem) {
    const standardRepresentations = {
      'text/html': new Blob([richHtml], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    }
    const representations = { ...standardRepresentations }

    if (!window.ClipboardItem.supports || window.ClipboardItem.supports('text/markdown')) {
      representations['text/markdown'] = new Blob([markdown], { type: 'text/markdown' })
    }

    try {
      await navigator.clipboard.write([new window.ClipboardItem(representations)])
      return
    } catch {
      try {
        await navigator.clipboard.write([new window.ClipboardItem(standardRepresentations)])
        return
      } catch {
        // Some browsers expose ClipboardItem but reject rich clipboard writes.
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(markdown)
    return
  }

  const textarea = window.document.createElement('textarea')
  textarea.value = markdown
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  window.document.body.appendChild(textarea)
  textarea.select()
  const copied = window.document.execCommand('copy')
  textarea.remove()

  if (!copied) throw new Error('Clipboard access is unavailable.')
}
