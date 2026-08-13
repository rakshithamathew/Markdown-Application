import { beforeEach, describe, expect, it, vi } from 'vitest'
import { copyMarkdownDocument } from '../utils/clipboard.js'

class ClipboardItemMock {
  static supports = vi.fn(() => true)
  constructor(data) { this.data = data }
}

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

describe('copyMarkdownDocument', () => {
  const write = vi.fn()

  beforeEach(() => {
    write.mockReset().mockResolvedValue(undefined)
    ClipboardItemMock.supports.mockReset().mockReturnValue(true)
    Object.defineProperty(window, 'ClipboardItem', { configurable: true, value: ClipboardItemMock })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write, writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('copies HTML, plain text, and Markdown representations', async () => {
    await copyMarkdownDocument({
      markdown: '# Title',
      html: '<h1>Title</h1><p><strong>Useful</strong> text</p><button data-clipboard-exclude="true">Copy</button>',
      plainText: 'Title\nUseful text',
    })

    const item = write.mock.calls[0][0][0]
    expect(Object.keys(item.data)).toEqual(['text/html', 'text/plain', 'text/markdown'])
    expect(await readBlob(item.data['text/html'])).toContain('font-size:26px')
    expect(await readBlob(item.data['text/html'])).not.toContain('>Copy<')
    expect(await readBlob(item.data['text/plain'])).toBe('Title\nUseful text')
    expect(await readBlob(item.data['text/markdown'])).toBe('# Title')
  })

  it('omits text/markdown when the browser reports it unsupported', async () => {
    ClipboardItemMock.supports.mockReturnValue(false)

    await copyMarkdownDocument({ markdown: '# Title', html: '<h1>Title</h1>', plainText: 'Title' })

    const item = write.mock.calls[0][0][0]
    expect(Object.keys(item.data)).toEqual(['text/html', 'text/plain'])
  })

  it('falls back to plain Markdown when rich clipboard writes fail', async () => {
    write.mockRejectedValue(new Error('not allowed'))

    await copyMarkdownDocument({ markdown: '# Title', html: '<h1>Title</h1>', plainText: 'Title' })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Title')
  })
})
