import { useState, useEffect } from 'react'

export default function OfflineToast() {
  const [status, setStatus] = useState(null) // null | 'offline' | 'reconnected'

  useEffect(() => {
    let timer = null

    const handleOffline = () => {
      if (timer) clearTimeout(timer)
      setStatus('offline')
    }

    const handleOnline = () => {
      if (timer) clearTimeout(timer)
      setStatus('reconnected')
      timer = setTimeout(() => setStatus(null), 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Detect if already offline on mount
    if (!navigator.onLine) setStatus('offline')

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!status) return null

  const isOffline = status === 'offline'

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center px-4 py-2.5 text-sm font-semibold transition-colors ${
        isOffline
          ? 'bg-amber-400 text-slate-950'
          : 'bg-green-400 text-slate-950'
      }`}
    >
      {isOffline ? '⚡ 当前离线，部分功能不可用' : '✓ 已恢复网络连接'}
    </div>
  )
}
