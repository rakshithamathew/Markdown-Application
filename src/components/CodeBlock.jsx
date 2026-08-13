import { Children, isValidElement, useState } from 'react'
import { Check, Copy } from 'lucide-react'

function textFromChildren(children) {
  return Children.toArray(children).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child)
    if (isValidElement(child)) return textFromChildren(child.props.children)
    return ''
  }).join('')
}

function CodeBlock({ children, node: _node, ...props }) {
  const [copied, setCopied] = useState(false)
  const code = textFromChildren(children).replace(/\n$/, '')

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const succeeded = document.execCommand('copy')
      textarea.remove()
      if (!succeeded) return
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="code-block">
      <button
        type="button"
        className={`code-copy-button ${copied ? 'code-copy-button--copied' : ''}`}
        onClick={copyCode}
        aria-label={copied ? 'Code copied' : 'Copy code block'}
        data-clipboard-exclude="true"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <pre {...props}>{children}</pre>
    </div>
  )
}

export default CodeBlock
