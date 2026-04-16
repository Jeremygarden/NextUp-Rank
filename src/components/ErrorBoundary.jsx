import React from 'react'

/**
 * Top-level ErrorBoundary — catches uncaught render errors (e.g. lazy() load failure)
 * and shows a friendly recovery UI instead of a white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-4xl mb-4">😵</div>
          <h2 className="text-white text-xl font-bold mb-2">页面出错了</h2>
          <p className="text-slate-400 text-sm mb-6">遇到了一个意外错误，请刷新重试</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
