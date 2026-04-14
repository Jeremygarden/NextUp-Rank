import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DISMISS_KEY = 'pwa-install-dismissed'
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show on Android — iOS uses its own "Share → Add to Home Screen" flow
    // Windows/macOS desktop should not show this mobile-style bottom sheet
    if (!isAndroid()) return

    // Don't show if already running as standalone (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if dismissed within last 7 days
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed && Date.now() - Number(dismissed) < SEVEN_DAYS) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    localStorage.setItem(DISMISS_KEY, Date.now())
    setDeferredPrompt(null)
    setVisible(false)
    if (outcome === 'accepted') {
      console.log('[PWA] Install accepted')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now())
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[90] bg-slate-900 border-t border-slate-700 rounded-t-2xl px-6 py-5 flex items-center gap-4"
        >
          <span className="text-4xl select-none">🎱</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-base leading-tight">添加到主屏幕</p>
            <p className="text-slate-400 text-sm mt-0.5">像 App 一样使用，打开更快</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              以后再说
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              立即添加
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
