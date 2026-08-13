import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RenderErrorBoundary from '../components/RenderErrorBoundary.jsx'

function BrokenDocument() {
  throw new Error('Unexpected render failure')
}

describe('RenderErrorBoundary', () => {
  it('shows a recoverable fallback when document rendering throws', () => {
    const onReset = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <RenderErrorBoundary onReset={onReset}>
        <BrokenDocument />
      </RenderErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('could not be rendered safely')
    fireEvent.click(screen.getByRole('button', { name: 'Upload a different file' }))
    expect(onReset).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })
})
