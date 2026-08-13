import { describe, expect, it } from 'vitest'
import { buildHeadingTree, extractHeadings } from '../utils/headings.js'

describe('extractHeadings', () => {
  it('extracts all ATX and setext headings with levels and unique IDs', () => {
    const markdown = '# Introduction\n\n## Setup\n\nDetails\n---\n\n# API **Guide**'

    expect(extractHeadings(markdown)).toEqual([
      { text: 'Introduction', level: 1, id: 'introduction' },
      { text: 'Setup', level: 2, id: 'setup' },
      { text: 'Details', level: 2, id: 'details' },
      { text: 'API Guide', level: 1, id: 'api-guide' },
    ])
  })

  it('ignores heading-like content inside fenced code blocks', () => {
    const markdown = '# Real section\n\n```md\n# Code example\n```'
    expect(extractHeadings(markdown)).toEqual([{ text: 'Real section', level: 1, id: 'real-section' }])
  })

  it('builds submodules from heading levels', () => {
    const headings = extractHeadings('# Module\n## Submodule\n### Topic\n# Next module')
    const tree = buildHeadingTree(headings)

    expect(tree).toHaveLength(2)
    expect(tree[0].children[0]).toMatchObject({ text: 'Submodule', level: 2 })
    expect(tree[0].children[0].children[0]).toMatchObject({ text: 'Topic', level: 3 })
  })
})
