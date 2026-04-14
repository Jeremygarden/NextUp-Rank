import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const weekday = WEEKDAYS[d.getDay()]
  return `${mm}-${dd} ${weekday}`
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse bg-slate-800 rounded-2xl h-20" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-8 text-slate-500">
      <p className="text-2xl mb-2">🎱</p>
      <p className="text-sm">最近 7 天暂无比赛记录</p>
      <p className="text-xs mt-1">快去广场发起对局！</p>
    </div>
  )
}

function MatchRow({ match }) {
  const { isWin, opponentNickname, opponentRating, myScore, oppScore, ratingDelta, ratingAfter, createdAt } = match

  const deltaSign = ratingDelta > 0 ? '+' : ''
  const deltaColor = isWin ? 'text-green-400' : 'text-red-400'
  const resultColor = isWin ? 'text-green-400' : 'text-red-400'
  const resultEmoji = isWin ? '🏆' : '😤'
  const resultLabel = isWin ? '胜' : '负'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      {/* Left: result */}
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="text-xl leading-none">{resultEmoji}</span>
        <span className={`text-xs font-bold mt-0.5 ${resultColor}`}>{resultLabel}</span>
      </div>

      {/* Middle: opponent + score */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 truncate">
          vs <span className="font-medium text-slate-100">{opponentNickname}</span>
          {opponentRating != null && (
            <span className="text-slate-500 ml-1">({Math.round(opponentRating)})</span>
          )}
        </p>
        <p className="text-lg font-mono font-bold text-slate-100 leading-tight">
          {myScore} <span className="text-slate-500">:</span> {oppScore}
        </p>
      </div>

      {/* Right: date + rating delta */}
      <div className="flex flex-col items-end shrink-0">
        <p className="text-xs text-slate-500">{formatDate(createdAt)}</p>
        <p className={`text-sm font-mono font-bold ${deltaColor}`}>
          {deltaSign}{Math.round(ratingDelta)} → {Math.round(ratingAfter)}
        </p>
      </div>
    </div>
  )
}

export default function RecentMatchList({ userId }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) fetchRecentMatches()
  }, [userId])

  async function fetchRecentMatches() {
    setLoading(true)
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: snapshots, error } = await supabase
        .from('rating_snapshots')
        .select(`
          id,
          match_id,
          rating_before,
          rating_after,
          rating_delta,
          created_at,
          opponent:opponent_id (nickname, rating),
          match:match_id (player_a_id, racks_won, racks_lost)
        `)
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const parsed = (snapshots || []).map(s => {
        const isWin = (s.rating_delta ?? 0) > 0
        const isPlayerA = s.match?.player_a_id === userId
        const racksWon = s.match?.racks_won ?? 0
        const racksLost = s.match?.racks_lost ?? 0
        const myScore = isPlayerA ? racksWon : racksLost
        const oppScore = isPlayerA ? racksLost : racksWon

        return {
          id: s.id,
          isWin,
          opponentNickname: s.opponent?.nickname ?? '未知对手',
          opponentRating: s.opponent?.rating ?? null,
          myScore,
          oppScore,
          ratingDelta: s.rating_delta ?? 0,
          ratingAfter: s.rating_after ?? 0,
          createdAt: s.created_at,
        }
      })

      setMatches(parsed)
    } catch (e) {
      console.error('Failed to fetch recent matches', e)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSkeleton />
  if (matches.length === 0) return <EmptyState />

  return (
    <div className="space-y-3">
      {matches.map(m => <MatchRow key={m.id} match={m} />)}
    </div>
  )
}
