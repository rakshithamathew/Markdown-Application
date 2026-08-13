import { Component } from 'react'
import ErrorState from './ErrorState.jsx'

class RenderErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  reset = () => {
    this.setState({ failed: false })
    this.props.onReset?.()
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="render-error-fallback">
          <ErrorState
            message="This document could not be rendered safely. Try uploading it again or choose a different Markdown file."
            onUpload={this.reset}
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default RenderErrorBoundary
