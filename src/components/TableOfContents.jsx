import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, MoonStar, Upload, X } from 'lucide-react'
import { restoreFocus, trapFocus } from '../utils/focus.js'

function withoutNumberPrefix(text) {
  return text.replace(/^\d+(?:\.\d+)*\.?\s+/, '')
}

function ContentsList({ headings, onNavigate, activeId, depth = 0, mainId, numberPath = [] }) {
  return (
    <ol className="toc-list">
      {headings.map((heading, index) => {
        const itemNumber = [...numberPath, index + 1]
        return <li key={heading.id}>
          <a
            className={activeId === heading.id ? 'toc-link--active' : ''}
            href={`#${heading.id}`}
            onClick={(event) => onNavigate(event, heading, mainId || heading.id)}
            style={{ '--toc-indent': `${9 + Math.min(depth, 4) * 12}px` }}
            aria-current={activeId === heading.id ? 'location' : undefined}
          >
            <span className="toc-number">
              {itemNumber.join('.')}{itemNumber.length === 1 ? '.' : ''}
            </span>
            <span className="toc-label">{withoutNumberPrefix(heading.text)}</span>
          </a>
          {heading.children.length > 0 && (
            <ContentsList
              headings={heading.children}
              onNavigate={onNavigate}
              activeId={activeId}
              depth={depth + 1}
              mainId={mainId || heading.id}
              numberPath={itemNumber}
            />
          )}
        </li>
      })}
    </ol>
  )
}

function TableOfContents({ headings }) {
  const mainHeadings = useMemo(() => (
    headings.length === 1 && headings[0].level === 1 && headings[0].children.length
      ? headings[0].children
      : headings
  ), [headings])
  const [activeMainId, setActiveMainId] = useState(mainHeadings[0]?.id)
  const [activeId, setActiveId] = useState(mainHeadings[0]?.id)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const drawerRef = useRef(null)
  const menuTriggerRef = useRef(null)

  useEffect(() => {
    setActiveMainId(mainHeadings[0]?.id)
    setActiveId(mainHeadings[0]?.id)
  }, [mainHeadings])

  useEffect(() => {
    const toggle = (event) => setMobileOpen((open) => {
      if (!open) menuTriggerRef.current = event.detail?.trigger || document.activeElement
      else restoreFocus(menuTriggerRef.current)
      return !open
    })
    window.addEventListener('markview:toggle-navigation', toggle)
    return () => window.removeEventListener('markview:toggle-navigation', toggle)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return undefined
    window.setTimeout(() => drawerRef.current?.querySelector('button')?.focus(), 0)
    const handleKeyDown = (event) => {
      trapFocus(event, drawerRef.current)
      if (event.key === 'Escape') closeMobileMenu()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const closeMobileMenu = (shouldRestoreFocus = true) => {
    setMobileOpen(false)
    if (shouldRestoreFocus) restoreFocus(menuTriggerRef.current)
  }

  const activeMainIndex = Math.max(0, mainHeadings.findIndex((heading) => heading.id === activeMainId))
  const activeMain = mainHeadings[activeMainIndex] || mainHeadings[0] || { id: '', text: 'document', children: [] }

  const navigateToHeading = (event, heading, mainId) => {
    event.preventDefault()
    const target = document.getElementById(heading.id)
    if (!target) return

    setActiveMainId(mainId)
    setActiveId(heading.id)
    target.setAttribute('tabindex', '-1')
    const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height || 66
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' })
    target.focus({ preventScroll: true })
    window.history.replaceState(null, '', `#${encodeURIComponent(heading.id)}`)
    setAnnouncement(`Jumped to ${withoutNumberPrefix(heading.text)}`)
    closeMobileMenu(false)
  }

  return (
    <>
      <aside className="toc-sidebar toc-sidebar--main">
        <p className="toc-title">Table of contents</p>
        <nav aria-label="Main table of contents">
          <ContentsList
            headings={mainHeadings.map((heading) => ({ ...heading, children: [] }))}
            onNavigate={navigateToHeading}
            activeId={activeMainId}
          />
        </nav>
      </aside>

      <aside className="toc-sidebar toc-sidebar--submodules">
        <p className="toc-title">In this section</p>
        {activeMain.children.length > 0 ? (
          <nav aria-label={`Sections in ${activeMain.text}`}>
            <ContentsList
              headings={activeMain.children}
              onNavigate={navigateToHeading}
              activeId={activeId}
              mainId={activeMain.id}
              numberPath={[activeMainIndex + 1]}
            />
          </nav>
        ) : (
          <p className="toc-empty">No submodules</p>
        )}
      </aside>

      {mobileOpen && <div
        className="mobile-nav-overlay mobile-nav-overlay--open"
        onMouseDown={(event) => { if (event.target === event.currentTarget) closeMobileMenu() }}
      >
        <aside ref={drawerRef} className="mobile-nav-drawer" aria-label="Document menu">
          <div className="mobile-nav-header">
            <strong>Document menu</strong>
            <button type="button" onClick={() => closeMobileMenu()} aria-label="Close document menu"><X size={18} /></button>
          </div>
          <div className="mobile-nav-actions" aria-label="Document actions">
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('markview:copy-document'))}>
              <Copy size={16} aria-hidden="true" />
              <span>Copy page</span>
            </button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('markview:toggle-theme'))}>
              <MoonStar size={16} aria-hidden="true" />
              <span>Appearance</span>
            </button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('markview:upload-document'))}>
              <Upload size={16} aria-hidden="true" />
              <span>Upload new</span>
            </button>
          </div>
          <p className="mobile-nav-section-title">Table of contents</p>
          <nav aria-label="Table of contents">
            {mainHeadings.length > 0 ? (
              <ContentsList headings={mainHeadings} onNavigate={navigateToHeading} activeId={activeId} />
            ) : (
              <p className="toc-empty">No headings in this document</p>
            )}
          </nav>
        </aside>
      </div>}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    </>
  )
}

export default TableOfContents
