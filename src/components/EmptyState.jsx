import { ClipboardCopy, CloudUpload, ListTree, Table2 } from 'lucide-react'

const features = [
  { icon: Table2, label: 'GFM tables' },
  { icon: ListTree, label: 'Table of contents' },
  { icon: ClipboardCopy, label: 'Rich clipboard copy' },
]

function EmptyState({ isDragging, onBrowse, onDragEnter, onDragLeave, onDrop }) {
  return (
    <section className="empty-state" aria-labelledby="empty-title">
      <h1 id="empty-title">Markview</h1>
      <p className="empty-subtitle">Preview Markdown files instantly — upload, read, done.</p>

      <ul className="empty-features" aria-label="Markview features">
        {features.map(({ icon: Icon, label }) => (
          <li key={label}><Icon size={14} aria-hidden="true" />{label}</li>
        ))}
      </ul>

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
