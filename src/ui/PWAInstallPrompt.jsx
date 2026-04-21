import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DISMISS_KEY = 'pwa-install-dismissed'
const IOS_DISMISS_KEY = 'pwa-ios-prompt-dismissed'
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

// ── iOS "Add to Home Screen" guide banner ──────────────────────────────────
function IOSInstallBanner({ onDismiss }) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-[90] bg-slate-900 border-t border-slate-700 rounded-t-2xl px-6 py-5"
    >
      {/* Close button */}
      <button
        onClick={onDismiss}
        aria-label="关闭提示"
        className="absolute top-3 right-4 text-slate-400 hover:text-white text-xl leading-none transition-colors"
      >
        ✕
      </button>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl select-none">🎱</span>
        <div>
          <p className="text-white font-semibold text-base leading-tight">添加到主屏幕</p>
          <p className="text-slate-400 text-sm mt-0.5">像 App 一样使用，打开更快</p>
        </div>
      </div>

      {/* Step-by-step guide */}
      <ol className="space-y-2 text-sm text-slate-300">
        <li className="flex items-center gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
          <span>
            点击底部{' '}
            <span className="inline-flex items-center gap-0.5 text-white font-medium">
              分享按钮{' '}
              <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </span>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          <span>向下滚动，点击「<span className="text-white font-medium">添加到主屏幕</span>」</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
          <span>点击右上角「<span className="text-white font-medium">添加</span>」确认</span>
        </li>
      </ol>
    </motion.div>
  )
}

// ── Android "Install App" bottom sheet ────────────────────────────────────
function AndroidInstallSheet({ onInstall, onDismiss }) {
  return (
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
          onClick={onDismiss}
          className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          以后再说
        </button>
        <button
          onClick={onInstall}
          className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          立即添加
        </button>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (isInStandaloneMode()) return

    if (isIOS()) {
      // iOS: check if user already dismissed
      const dismissed = localStorage.getItem(IOS_DISMISS_KEY)
      if (dismissed && Date.now() - Number(dismissed) < SEVEN_DAYS) return
      setShowIOS(true)
      return
    }

    if (isAndroid()) {
      // Android: wait for beforeinstallprompt
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed && Date.now() - Number(dismissed) < SEVEN_DAYS) return

      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowAndroid(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    localStorage.setItem(DISMISS_KEY, Date.now())
    setDeferredPrompt(null)
    setShowAndroid(false)
    if (outcome === 'accepted') {
      console.log('[PWA] Install accepted')
    }
  }

  const handleAndroidDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now())
    setShowAndroid(false)
  }

  const handleIOSDismiss = () => {
    localStorage.setItem(IOS_DISMISS_KEY, Date.now())
    setShowIOS(false)
  }

  return (
    <AnimatePresence>
      {showIOS && (
        <IOSInstallBanner key="ios" onDismiss={handleIOSDismiss} />
      )}
      {showAndroid && (
        <AndroidInstallSheet
          key="android"
          onInstall={handleAndroidInstall}
          onDismiss={handleAndroidDismiss}
        />
      )}
    </AnimatePresence>
  )
}
