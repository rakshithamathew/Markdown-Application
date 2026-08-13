import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, X } from 'lucide-react'
import { clearSearchHighlights, searchDocument } from '../utils/search.js'

function DocumentSearch({ documentRef, documentKey }) {
  const inputRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)

  const activateResult = (index, closePanel = false) => {
    if (!results.length) return
    const nextIndex = (index + results.length) % results.length
    results.forEach(({ element }) => element.classList.remove('search-match--active'))
    const result = results[nextIndex]
    result.element.classList.add('search-match--active')
    const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height || 66
    const top = result.element.getBoundingClientRect().top + window.scrollY - headerHeight - 28
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
    setActiveIndex(nextIndex)
    if (closePanel) setIsOpen(false)
  }

  const runSearch = (value) => {
    setQuery(value)
    const nextResults = searchDocument(documentRef.current, value)
    setResults(nextResults)
    setActiveIndex(-1)
  }

  const clearSearch = () => {
    clearSearchHighlights(documentRef.current)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
    setIsOpen(false)
  }

  useEffect(() => {
    clearSearch()
  }, [documentKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearSearchHighlights(documentRef.current), [documentRef])

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [isOpen])

  useEffect(() => {
    const openWithShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', openWithShortcut)
    return () => window.removeEventListener('keydown', openWithShortcut)
  }, [])

  const handleKeys = (event) => {
    if (event.key === 'Escape') setIsOpen(false)
    if (event.key === 'ArrowDown') { event.preventDefault(); activateResult(activeIndex + 1) }
    if (event.key === 'ArrowUp') { event.preventDefault(); activateResult(activeIndex - 1) }
    if (event.key === 'Enter' && results.length) { event.preventDefault(); activateResult(activeIndex < 0 ? 0 : activeIndex, true) }
  }

  return (
    <>
      <div className={`header-search ${query ? 'header-search--active' : ''}`}>
        <button type="button" className="search-trigger" onClick={() => setIsOpen(true)} aria-label="Search document">
          <Search size={14} />
          <span>{query || 'Search...'}</span>
          {!query && <kbd>⌘K</kbd>}
        </button>
        {query && (
          <>
            <span className="search-count">{results.length ? activeIndex + 1 || 1 : 0} of {results.length}</span>
            <button type="button" onClick={() => activateResult(activeIndex - 1)} disabled={!results.length} aria-label="Previous result"><ChevronUp size={13} /></button>
            <button type="button" onClick={() => activateResult(activeIndex + 1)} disabled={!results.length} aria-label="Next result"><ChevronDown size={13} /></button>
            <button type="button" onClick={clearSearch} aria-label="Clear search"><X size={12} /></button>
          </>
        )}
      </div>

      {isOpen && createPortal(
        <div className="search-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false) }}>
          <section className="search-panel" role="dialog" aria-modal="true" aria-label="Search document" onKeyDown={handleKeys}>
            <div className="search-panel-header">
              <Search size={19} />
              <input ref={inputRef} value={query} onChange={(event) => runSearch(event.target.value)} placeholder="Search document..." aria-label="Search query" />
              <span>{results.length} results</span>
              <button type="button" onClick={() => activateResult(activeIndex - 1)} disabled={!results.length} aria-label="Previous result"><ChevronLeft size={15} /></button>
              <button type="button" onClick={() => activateResult(activeIndex + 1)} disabled={!results.length} aria-label="Next result"><ChevronRight size={15} /></button>
            </div>
            <div className="search-results" role="listbox" aria-label="Search results">
              {query.trim().length < 2 && <p className="search-message">Enter at least 2 characters to search this document.</p>}
              {query.trim().length >= 2 && !results.length && <p className="search-message">No results found.</p>}
              {results.map((result, index) => (
                <button
                  key={`${result.breadcrumb}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-result ${index === activeIndex ? 'search-result--active' : ''}`}
                  onClick={() => activateResult(index, true)}
                >
                  <strong>{result.breadcrumb || 'Document'}</strong>
                  <span>{result.context}</span>
                </button>
              ))}
            </div>
            <footer className="search-panel-footer"><span>↑↓ Navigate</span><span>↵ Select</span><span>ESC to close</span></footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  )
}

export default DocumentSearch
