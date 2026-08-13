import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App.jsx'

function readableFile(content, name) {
  const file = new File([content], name)
  file.text = async () => content
  return file
}

describe('file handling UI', () => {
  it('toggles and persists the monochrome color theme', () => {
    window.localStorage.setItem('markview-theme', 'light')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(window.localStorage.getItem('markview-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('moves from upload state to document viewer for one valid file', async () => {
    const { container } = render(<App />)
    const input = container.querySelector('input[type="file"]')

    fireEvent.change(input, { target: { files: [readableFile('# Uploaded', 'guide.md')] } })

    expect(await screen.findByRole('heading', { name: 'Uploaded' })).toBeInTheDocument()
    expect(screen.getByText('guide.md')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy document' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload another file' })).toBeInTheDocument()
  })

  it('shows a clear error for invalid input', async () => {
    const { container } = render(<App />)
    const input = container.querySelector('input[type="file"]')

    fireEvent.change(input, { target: { files: [readableFile('not markdown', 'notes.txt')] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('Only Markdown')
  })

  it('rejects multiple dropped files', async () => {
    render(<App />)
    const dropZone = screen.getByText(/Drag & drop/).closest('.drop-zone')

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [readableFile('# One', 'one.md'), readableFile('# Two', 'two.md')] },
    })

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('one Markdown file at a time'))
  })

  it('keeps required actions accessible at a mobile viewport', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    window.dispatchEvent(new Event('resize'))
    const { container } = render(<App />)

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [readableFile('# Mobile document', 'mobile.md')] },
    })

    expect(await screen.findByRole('button', { name: 'Open document menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search document' })).toBeInTheDocument()
    expect(screen.getByText('mobile.md')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open document menu' }))
    const menu = screen.getByRole('complementary', { name: 'Document menu' })
    expect(within(menu).getByRole('button', { name: 'Copy page' })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: 'Appearance' })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: 'Upload new' })).toBeInTheDocument()
    expect(within(menu).getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument()
  })

  it('opens and closes the responsive document menu', async () => {
    const { container } = render(<App />)
    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [readableFile('# Guide\n\n## Installation\n\n### Requirements', 'guide.md')] },
    })
    await screen.findByRole('heading', { name: 'Guide' })

    fireEvent.click(screen.getByRole('button', { name: 'Open document menu' }))
    const menu = screen.getByRole('complementary', { name: 'Document menu' })
    expect(menu).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: '1.1 Requirements' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close document menu' }))
    expect(screen.queryByRole('complementary', { name: 'Document menu' })).not.toBeInTheDocument()
  })

  it('keeps mobile document actions available when the Markdown has no headings', async () => {
    const { container } = render(<App />)
    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [readableFile('A document without headings.', 'plain.md')] },
    })
    await screen.findByText('A document without headings.')

    fireEvent.click(screen.getByRole('button', { name: 'Open document menu' }))
    const menu = screen.getByRole('complementary', { name: 'Document menu' })
    expect(within(menu).getByText('No headings in this document')).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: 'Copy page' })).toBeInTheDocument()
  })

  it('searches the uploaded rendered document from the top navigation', async () => {
    const { container } = render(<App />)
    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [readableFile('# Search Guide\n\nRedis config is reliable. Redis is fast.', 'search.md')] },
    })
    await screen.findByRole('heading', { name: 'Search Guide' })

    fireEvent.click(screen.getByRole('button', { name: 'Search document' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Search query' }), { target: { value: 'redis' } })

    expect(screen.getByText('2 results')).toBeInTheDocument()
    expect(container.querySelectorAll('mark[data-search-match]')).toHaveLength(2)
  })

  it('replaces the current document when Upload new selects another file', async () => {
    const { container } = render(<App />)
    const input = container.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [readableFile('# First document\n\nFirst content', 'first.md')] } })
    expect(await screen.findByRole('heading', { name: 'First document' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Search document' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Search query' }), { target: { value: 'first' } })
    expect(container.querySelector('mark[data-search-match]')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Upload another file' }))
    fireEvent.change(input, { target: { files: [readableFile('# Second document\n\nSecond content', 'second.md')] } })

    expect(await screen.findByRole('heading', { name: 'Second document' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'First document' })).not.toBeInTheDocument()
    expect(screen.getByText('second.md')).toBeInTheDocument()
    expect(container.querySelector('mark[data-search-match]')).not.toBeInTheDocument()
  })
})
