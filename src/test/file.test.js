import { describe, expect, it } from 'vitest'
import { readMarkdownFile } from '../utils/file.js'

function readableFile(parts, name, options) {
  const file = new File(parts, name, options)
  file.text = async () => parts.join('')
  return file
}

describe('readMarkdownFile', () => {
  it('reads one valid Markdown file entirely in the browser', async () => {
    const file = readableFile(['# Hello\n', 'Complete document'], 'guide.md', { type: 'text/markdown' })

    await expect(readMarkdownFile(file)).resolves.toEqual({
      name: 'guide.md',
      content: '# Hello\nComplete document',
    })
  })

  it('accepts the .markdown extension case-insensitively', async () => {
    const file = readableFile(['Content'], 'GUIDE.MARKDOWN')
    await expect(readMarkdownFile(file)).resolves.toMatchObject({ name: 'GUIDE.MARKDOWN' })
  })

  it('rejects invalid file formats', async () => {
    const file = readableFile(['<script>alert(1)</script>'], 'unsafe.html', { type: 'text/html' })
    await expect(readMarkdownFile(file)).rejects.toThrow(/Only Markdown/)
  })

  it('rejects files larger than 10 MB', async () => {
    const file = readableFile([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.md')
    await expect(readMarkdownFile(file)).rejects.toThrow(/larger than 10 MB/)
  })

  it('reports browser read failures clearly', async () => {
    const file = readableFile(['content'], 'broken.md')
    file.text = async () => { throw new Error('read failed') }

    await expect(readMarkdownFile(file)).rejects.toThrow(/could not read/)
  })
})
