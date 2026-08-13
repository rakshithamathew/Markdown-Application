import { CloudUpload } from 'lucide-react'

function EmptyState({ isDragging, onBrowse, onDragEnter, onDragLeave, onDrop }) {
  return (
    <section className="empty-state" aria-labelledby="empty-title">
      <p className="version-label">Version 2.4.0</p>
      <h1 id="empty-title">Markview</h1>
      <p className="empty-subtitle">Preview Markdown files instantly - upload, read, done.</p>

      <div
        className={`drop-zone ${isDragging ? 'drop-zone--active' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); onDragEnter() }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="state-icon state-icon--upload"><CloudUpload size={24} /></span>
        <h2>Drag &amp; drop your .md file here</h2>
        <p>Supports .md and .markdown files up to 10MB</p>
        <button className="button button--primary upload-button" type="button" onClick={onBrowse}>
          Browse files
        </button>
      </div>
    </section>
  )
}

export default EmptyState
