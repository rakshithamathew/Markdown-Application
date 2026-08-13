import { AlertCircle } from 'lucide-react'

function ErrorState({ message, onUpload }) {
  return (
    <section className="error-card" aria-labelledby="error-title" role="alert">
      <span className="state-icon state-icon--error"><AlertCircle size={23} /></span>
      <h1 id="error-title">Unable to open file</h1>
      <p>{message}</p>
      <button className="button button--primary" type="button" onClick={onUpload}>
        Upload a different file
      </button>
      <span className="supported-note">Supported formats: .md, .markdown / Maximum 10MB</span>
    </section>
  )
}

export default ErrorState
