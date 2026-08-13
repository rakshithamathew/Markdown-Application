import { describe, expect, it } from 'vitest'
import { clearSearchHighlights, searchDocument } from '../utils/search.js'

describe('document search', () => {
  it('finds every case-insensitive occurrence and adds heading context', () => {
    const root = document.createElement('article')
    root.innerHTML = '<h1>Guide</h1><h2>Setup</h2><p>Redis config uses REDIS safely.</p>'
    document.body.appendChild(root)

    const results = searchDocument(root, 'redis')

    expect(results).toHaveLength(2)
    expect(results[0].breadcrumb).toBe('Guide → Setup')
    expect(root.querySelectorAll('mark[data-search-match]')).toHaveLength(2)
    root.remove()
  })

  it('removes highlight markup without changing document text', () => {
    const root = document.createElement('article')
    root.innerHTML = '<p>Search this searchable text.</p>'
    const original = root.textContent
    searchDocument(root, 'search')

    clearSearchHighlights(root)

    expect(root.querySelector('mark')).toBeNull()
    expect(root.textContent).toBe(original)
  })

  it('does not search for one-character terms', () => {
    const root = document.createElement('article')
    root.innerHTML = '<p>A technical document.</p>'
    expect(searchDocument(root, 'a')).toEqual([])
  })
})
