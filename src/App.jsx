import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import Header from './components/Header.jsx'
import EmptyState from './components/EmptyState.jsx'
import ErrorState from './components/ErrorState.jsx'
import DocumentViewer from './components/DocumentViewer.jsx'
import { copyMarkdownDocument } from './utils/clipboard.js'
import { readMarkdownFile } from './utils/file.js'
import { clearSearchHighlights } from './utils/search.js'

function App() {
  const inputRef = useRef(null)
  const documentRef = useRef(null)
  const copyTimerRef = useRef(null)
  const [document, setDocument] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)

  const openFilePicker = () => {
    if (!inputRef.current) return
    clearSearchHighlights(documentRef.current)
    inputRef.current.value = ''
    inputRef.current.click()
  }

  const loadFiles = async (files) => {
    setIsDragging(false)

    if (!files?.length) return
    if (files.length !== 1) {
      setDocument(null)
      setError('Please upload one Markdown file at a time.')
      return
    }

    try {
      clearSearchHighlights(documentRef.current)
      const nextDocument = await readMarkdownFile(files[0])
      setDocument({
        ...nextDocument,
        key: `${files[0].name}-${files[0].size}-${files[0].lastModified}`,
      })
      setError('')
      setCopied(false)
    } catch (readError) {
      setDocument(null)
      setError(readError.message)
    }
  }

  const copyDocument = async () => {
    if (!document || !documentRef.current) return

    try {
      await copyMarkdownDocument({
        markdown: document.content,
        html: documentRef.current.innerHTML,
        plainText: documentRef.current.innerText,
      })

      window.clearTimeout(copyTimerRef.current)
      setCopied(true)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const state = document ? 'viewer' : error ? 'error' : 'empty'

  return (
    <div className="app-shell">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".md,.markdown,text/markdown"
        onChange={(event) => loadFiles(event.target.files)}
      />

      <Header
        document={document}
        documentRef={documentRef}
        copied={copied}
        onCopy={copyDocument}
        onUpload={openFilePicker}
      />

      <main className={`app-main app-main--${state}`}>
        {state === 'empty' && (
          <EmptyState
            isDragging={isDragging}
            onBrowse={openFilePicker}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              loadFiles(event.dataTransfer.files)
            }}
          />
        )}

        {state === 'error' && <ErrorState message={error} onUpload={openFilePicker} />}

        {state === 'viewer' && (
          <DocumentViewer key={document.key} ref={documentRef} content={document.content} />
        )}
      </main>

      <div className={`copy-toast ${copied ? 'copy-toast--visible' : ''}`} role="status" aria-live="polite">
        <Check size={15} strokeWidth={2.5} />
        Document copied
      </div>
    </div>
  )
}

export default App
