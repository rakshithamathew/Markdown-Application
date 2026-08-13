import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DocumentViewer from '../components/DocumentViewer.jsx'
import sampleMarkdown from './fixtures/sample.md?raw'

describe('DocumentViewer', () => {
  it('renders the representative GFM document', () => {
    const { container } = render(<DocumentViewer content={sampleMarkdown} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Technical Guide' })).toBeInTheDocument()
    expect(container.querySelectorAll('article > ol > li')).toHaveLength(2)
    expect(screen.getByText('Deeply nested item')).toBeInTheDocument()
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('blockquote')).toHaveTextContent('inline code')
    expect(container.querySelector('pre code')).toHaveTextContent('const ready = true')
    expect(container.querySelector('article strong')).toHaveTextContent('bold')
    expect(container.querySelector('em')).toHaveTextContent('italic')
    expect(container.querySelector('del')).toHaveTextContent('removed text')
    expect(screen.getByRole('link', { name: 'a safe link' })).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByRole('navigation', { name: 'Main table of contents' })).toBeInTheDocument()
    expect(screen.getByText('No submodules')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '1. Lists' })[0]).toHaveAttribute('href', '#lists')
    expect(screen.getByRole('heading', { level: 1, name: 'Technical Guide' })).toHaveAttribute('id', 'technical-guide')
    expect(screen.getByRole('button', { name: 'Copy code block' })).toBeInTheDocument()
  })

  it('copies one fenced code block and shows confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(<DocumentViewer content={'```javascript\nconst answer = 42\n```'} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy code block' }))

    expect(writeText).toHaveBeenCalledWith('const answer = 42')
    expect(await screen.findByRole('button', { name: 'Code copied' })).toBeInTheDocument()
  })

  it('scrolls and focuses the selected table-of-contents section', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    render(<DocumentViewer content={'# Module\n\n## Submodule\n\nContent'} />)

    screen.getAllByRole('link', { name: '1. Submodule' })[0].click()

    const section = screen.getByRole('heading', { name: 'Submodule' })
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(section).toHaveFocus()
    expect(window.location.hash).toBe('#submodule')
  })

  it('navigates nested submodules at every heading depth', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    render(
      <DocumentViewer
        content={'# Module\n\n## Submodule\n\n### Nested submodule\n\n#### Deep topic\n\nContent'}
      />,
    )

    screen.getAllByRole('link', { name: '1.1 Nested submodule' })[0].click()
    const nestedSection = screen.getByRole('heading', { level: 3, name: 'Nested submodule' })
    expect(nestedSection).toHaveFocus()
    expect(window.location.hash).toBe('#nested-submodule')

    screen.getAllByRole('link', { name: '1.1.1 Deep topic' })[0].click()
    const deepSection = screen.getByRole('heading', { level: 4, name: 'Deep topic' })
    expect(deepSection).toHaveFocus()
    expect(window.location.hash).toBe('#deep-topic')
    expect(scrollTo).toHaveBeenCalledTimes(2)
  })

  it('numbers main sections and their right-sidebar submodules hierarchically', () => {
    render(
      <DocumentViewer
        content={'# Document title\n\n## 1. First section\n\n### 1.1 Existing prefix\n\n### Another topic\n\n## Second section\n\n### Child topic'}
      />,
    )

    expect(screen.getAllByRole('link', { name: '1. First section' })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '2. Second section' })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '1.1 Existing prefix' })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '1.2 Another topic' })[0]).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('link', { name: '2. Second section' })[0])
    expect(screen.getAllByRole('link', { name: '2.1 Child topic' })[0]).toBeInTheDocument()
  })

  it('maps duplicate heading labels to distinct sections on the first click', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    render(<DocumentViewer content={'# Title\n\n## Setup\n\n### Details\n\n## Setup\n\n### Details'} />)

    const setupLinks = screen.getAllByRole('link', { name: '2. Setup' })
    fireEvent.click(setupLinks[0])

    const duplicateHeading = document.getElementById('setup-1')
    expect(duplicateHeading).toHaveFocus()
    expect(window.location.hash).toBe('#setup-1')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('link', { name: '2.1 Details' })[0]).toHaveAttribute('href', '#details-1')
  })

  it('treats embedded HTML as untrusted content', () => {
    const hostile = '# Safe heading\n\n<script>window.pwned = true</script>\n\n<img src=x onerror="window.pwned=true">'
    const { container } = render(<DocumentViewer content={hostile} />)

    expect(screen.getByRole('heading', { name: 'Safe heading' })).toBeInTheDocument()
    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(window.pwned).toBeUndefined()
  })

  it('does not expose unsafe link protocols', () => {
    const { container } = render(<DocumentViewer content="[unsafe](javascript:alert('x'))" />)
    const link = container.querySelector('a')

    expect(link).toHaveTextContent('unsafe')
    expect(link.getAttribute('href') ?? '').not.toMatch(/^javascript:/i)
  })

  it('renders malformed or incomplete Markdown without crashing', () => {
    const { container } = render(<DocumentViewer content={'# Incomplete\n\n**unclosed emphasis\n\n```js\nconst value = {'} />)

    expect(screen.getByRole('heading', { name: 'Incomplete' })).toBeInTheDocument()
    expect(screen.getByText(/unclosed emphasis/)).toBeInTheDocument()
    expect(container.querySelector('pre code')).toHaveTextContent('const value = {')
  })

  it('handles a large technical document', () => {
    const largeDocument = Array.from(
      { length: 600 },
      (_, index) => `## Section ${index + 1}\n\nParagraph ${index + 1} with \`value\`.`,
    ).join('\n\n')

    render(<DocumentViewer content={largeDocument} />)

    expect(screen.getByRole('heading', { name: 'Section 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Section 600' })).toBeInTheDocument()
  })
})
