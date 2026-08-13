import { Children, isValidElement, useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import xml from 'highlight.js/lib/languages/xml'

hljs.registerLanguage('javascript', javascript)
hljs.registerAliases(['js', 'jsx'], { languageName: 'javascript' })
hljs.registerLanguage('python', python)
hljs.registerAliases(['py'], { languageName: 'python' })
hljs.registerLanguage('bash', bash)
hljs.registerAliases(['sh', 'shell'], { languageName: 'bash' })
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerAliases(['xml'], { languageName: 'html' })
hljs.registerLanguage('markdown', markdown)
hljs.registerAliases(['md'], { languageName: 'markdown' })

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
  const codeElement = Children.toArray(children).find(isValidElement)
  const language = codeElement?.props?.className?.match(/language-([^\s]+)/)?.[1]?.toLowerCase()
  const eagerMarkup = useMemo(() => (
    language && hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : ''
  ), [code, language])
  const [highlightedMarkup, setHighlightedMarkup] = useState(eagerMarkup)

  useEffect(() => {
    setHighlightedMarkup(eagerMarkup)
    if (!language || eagerMarkup) return undefined

    let active = true
    import('../utils/loadHighlightLanguage.js').then(({ loadHighlightLanguage }) => (
      loadHighlightLanguage(language)
    )).then((languageDefinition) => {
      if (!languageDefinition) return
      if (!active) return
      hljs.registerLanguage(language, languageDefinition)
      setHighlightedMarkup(hljs.highlight(code, { language }).value)
    }).catch(() => {})

    return () => { active = false }
  }, [code, eagerMarkup, language])

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
      <pre {...props}>
        {highlightedMarkup ? (
          <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedMarkup }} />
        ) : children}
      </pre>
    </div>
  )
}

export default CodeBlock
