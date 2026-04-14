import React, { useRef, useState, lazy, Suspense } from 'react'

// Lazy-load ShareCard so html-to-image + card code is split into a separate chunk
const ShareCard = lazy(() => import('./ShareCard'))

export default function ShareCardButton({ myNickname, opponentNickname, ratingBefore, ratingAfter, racksWon, racksLost, isWin }) {
  const cardRef = useRef(null)
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    if (!cardRef.current) return
    setLoading(true)
    try {
      // Dynamically import html-to-image only when user taps share
      const { toPng } = await import('html-to-image')

      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })

      const blob = await fetch(dataUrl).then(r => r.blob())
      const file = new File([blob], 'nextup-rank-result.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'NextUp-Rank 战绩',
        })
      } else {
        // Fallback: trigger download
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'nextup-rank-result.png'
        a.click()
      }
    } catch (e) {
      // User cancelled share or error — silently ignore cancel
      if (e.name !== 'AbortError') {
        console.error('Share failed:', e)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Hidden card for screenshot — lazy loaded, renders off-screen */}
      <Suspense fallback={null}>
        <ShareCard
          cardRef={cardRef}
          myNickname={myNickname}
          opponentNickname={opponentNickname}
          ratingBefore={ratingBefore}
          ratingAfter={ratingAfter}
          racksWon={racksWon}
          racksLost={racksLost}
          isWin={isWin}
        />
      </Suspense>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            生成中...
          </>
        ) : (
          <>📸 分享战绩</>
        )}
      </button>
    </>
  )
}
