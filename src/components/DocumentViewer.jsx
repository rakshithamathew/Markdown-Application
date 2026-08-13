import { forwardRef, memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TableOfContents from './TableOfContents.jsx'
import CodeBlock from './CodeBlock.jsx'
import TaskCheckbox from './TaskCheckbox.jsx'
import { buildHeadingTree, extractHeadings, remarkHeadingIds } from '../utils/headings.js'

const remarkPlugins = [remarkGfm, remarkHeadingIds]
const markdownComponents = {
  pre: CodeBlock,
  input: TaskCheckbox,
  a: ({ children, node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
}

const DocumentViewer = memo(forwardRef(function DocumentViewer({ content }, ref) {
  const headings = useMemo(() => extractHeadings(content), [content])
  const headingTree = useMemo(() => buildHeadingTree(headings), [headings])
  return (
    <div className={`viewer-layout ${headings.length ? '' : 'viewer-layout--without-toc'}`}>
      <TableOfContents headings={headingTree} />

      <article ref={ref} className="document-card markdown-body">
        <ReactMarkdown
          skipHtml
          remarkPlugins={remarkPlugins}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  )
}))

export default DocumentViewer
