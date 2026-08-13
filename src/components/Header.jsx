import { lazy, Suspense, useEffect, useState } from 'react'
import { Check, Copy, FileText, Menu, Moon, Sun, Upload } from 'lucide-react'

const DocumentSearch = lazy(() => import('./DocumentSearch.jsx'))

function Header({ document, documentRef, copied, onCopy, onUpload }) {
  const [theme, setTheme] = useState(() => {
    const saved = window.localStorage.getItem('markview-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    globalThis.document.documentElement.dataset.theme = theme
    window.localStorage.setItem('markview-theme', theme)
  }, [theme])

  useEffect(() => {
    const copy = () => onCopy?.()
    const upload = () => onUpload?.()
    const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light')

    window.addEventListener('markview:copy-document', copy)
    window.addEventListener('markview:upload-document', upload)
    window.addEventListener('markview:toggle-theme', toggleTheme)
    return () => {
      window.removeEventListener('markview:copy-document', copy)
      window.removeEventListener('markview:upload-document', upload)
      window.removeEventListener('markview:toggle-theme', toggleTheme)
    }
  }, [onCopy, onUpload])

  return (
    <header className="app-header">
      <div className="brand" aria-label="Markview">
        <span className="brand-mark"><FileText size={14} strokeWidth={2.3} /></span>
        <span className="brand-name">Markview</span>
      </div>

      {document && (
        <>
          <div className="file-info" title={document.title || document.name}>
            <FileText size={15} aria-hidden="true" />
            <span>{document.title || document.name}</span>
            <span className="read-only">Read-Only</span>
          </div>

          <div className="header-actions">
            <Suspense fallback={<span className="header-search header-search--loading" aria-hidden="true" />}>
              <DocumentSearch key={document.key} documentRef={documentRef} documentKey={document.key} />
            </Suspense>
            <button className="button button--quiet copy-button" type="button" onClick={onCopy} aria-label={copied ? 'Document copied' : 'Copy document'}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className="button button--primary upload-new-button" type="button" onClick={onUpload} aria-label="Upload another file">
              <Upload size={14} />
              <span>Upload new</span>
            </button>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
          <button
            className="mobile-nav-toggle"
            type="button"
            onClick={(event) => window.dispatchEvent(new CustomEvent('markview:toggle-navigation', {
              detail: { trigger: event.currentTarget },
            }))}
            aria-label="Open document menu"
          >
            <Menu size={18} />
          </button>
        </>
      )}

      {!document && (
        <button
          className="theme-toggle theme-toggle--standalone"
          type="button"
          onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      )}
    </header>
  )
}

export default Header
