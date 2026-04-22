import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronLeft, Plus, Minus, TrendingUp, TrendingDown, AlertTriangle, ClipboardList, Lightbulb } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import ShareCardButton from '../ui/ShareCardButton'

function AbandonModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full"
      >
        <div className="text-center mb-6">
          <AlertTriangle size={36} className="text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">确认退出比赛？</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            中途退赛将终止当前对局，双方比赛记录将被取消。
          </p>
          <p className="text-amber-400 text-xs mt-2 font-medium">
            ⚡ 中途退赛会影响你的信誉度评分（Karma）
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-600 text-slate-300 font-bold py-3 rounded-2xl transition-colors hover:border-slate-400"
          >
            继续比赛
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            确认退出
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Counter({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-slate-300 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`减少${label}`}
          className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Minus size={20} />
        </button>
        <span className="text-4xl font-black font-mono w-14 text-center tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          aria-label={`增加${label}`}
          className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}

// Settlement result display (both players)
function SettlementResult({ result, navigate, myNickname, opponentNickname, racksWon, racksLost, totalMatches }) {
  const delta = result ? (result.rating_after - result.rating_before) : 0
  const isWin = racksWon > racksLost
  // totalMatches is the count AFTER this match settled; calibration covers first 8 matches
  const isCalibrating = totalMatches !== null && totalMatches <= 8

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 8000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <motion.div key="settlement" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full max-w-sm">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${delta >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}
      >
        {delta >= 0
          ? <TrendingUp className="text-green-400" size={40} />
          : <TrendingDown className="text-red-400" size={40} />
        }
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">比赛结算完成</h2>
      <p className="text-slate-400 text-sm mb-6">结算已完成</p>
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-400">积分变化</span>
          <motion.span
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className={`text-2xl font-black font-mono ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {delta >= 0 ? '+' : ''}{Math.round(delta)}
          </motion.span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">新积分</span>
          <motion.span
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="text-3xl font-black font-mono text-indigo-400"
          >
            {Math.round(result.rating_after)}
          </motion.span>
        </div>
        {isCalibrating && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-left"
          >
            <span className="text-amber-400 mt-0.5 shrink-0">⚡</span>
            <div>
              <p className="text-amber-400 text-xs font-bold mb-0.5">
                定级赛 {totalMatches}/8 — 校准中
              </p>
              <p className="text-amber-400/70 text-xs leading-relaxed">
                前 8 场积分波动较大，系统正在校准你的真实水平，这是正常现象。
              </p>
            </div>
          </motion.div>
        )}
      </div>
      <ShareCardButton
        myNickname={myNickname || '我'}
        opponentNickname={opponentNickname || '对手'}
        ratingBefore={result.rating_before}
        ratingAfter={result.rating_after}
        racksWon={racksWon ?? 0}
        racksLost={racksLost ?? 0}
        isWin={isWin}
      />
      <button onClick={() => navigate('/')} className="w-full border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-3 rounded-2xl transition-colors mt-3">
        返回广场
      </button>
      <p className="text-slate-500 text-xs mt-3 text-center">8 秒后自动跳转...</p>
    </motion.div>
  )
}

// Submitter: waiting for the other player to confirm
function PendingConfirmation({ matchId, navigate, onConfirmed, myRatingBefore }) {
  const [slow, setSlow] = useState(false)
  const pollRef = useRef(null)
  const channelRef = useRef(null)
  const userId = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      userId.current = session?.user?.id
    })
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('plaza_events')
      .on('broadcast', { event: 'RESULT_CONFIRMED' }, ({ payload }) => {
        if (payload?.match_id !== matchId) return
        // Find our result from payload by user id
        const myResult = payload?.player_a?.user_id === userId.current
          ? payload.player_a
          : payload?.player_b?.user_id === userId.current
            ? payload.player_b
            : null
        onConfirmed(myResult || { rating_before: myRatingBefore, rating_after: myRatingBefore })
      })
      .subscribe()
    channelRef.current = channel

    // Polling fallback every 5s
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('matches')
        .select('status')
        .eq('id', matchId)
        .single()
      if (data?.status === 'completed') {
        clearInterval(pollRef.current)
        // Fetch updated rating for display
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        const { data: userRow } = await supabase.from('users').select('rating').eq('id', uid).single()
        onConfirmed({ rating_before: myRatingBefore, rating_after: userRow?.rating ?? myRatingBefore })
      }
    }, 5000)

    const slowTimer = setTimeout(() => setSlow(true), 10000)

    return () => {
      clearInterval(pollRef.current)
      clearTimeout(slowTimer)
      supabase.removeChannel(channelRef.current)
    }
  }, [matchId, onConfirmed, myRatingBefore])

  return (
    <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full max-w-sm">
      <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-indigo-400"
            />
          ))}
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2">已提交，等待对手确认...</h2>
      {slow && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-400 text-sm mb-4">
          对手确认中，当面确认通常很快
        </motion.p>
      )}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6 text-left">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">比赛 ID</span>
          <span className="font-mono text-slate-300 text-xs">{matchId?.slice(0, 8)}...</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">状态</span>
          <span className="text-amber-400 font-medium">等待对手确认</span>
        </div>
      </div>
      <button onClick={() => navigate('/')} className="w-full border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-3 rounded-full transition-colors">
        返回广场
      </button>
    </motion.div>
  )
}

// Confirmer: show submitted score and confirm
function ConfirmScore({ matchId, racksWonBySubmitter, racksLostBySubmitter, submitterNickname, navigate, onConfirmed, onBackToPending }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)
  const channelRef = useRef(null)
  const myRatingRef = useRef(null)

  // Subscribe to RESULT_CONFIRMED + poll for completed status
  // Handles the case where opponent confirms while submitter is stuck on confirm phase
  useEffect(() => {
    let cancelled = false

    async function setupWatch() {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      const { data: userRow } = await supabase.from('users').select('rating').eq('id', uid).single()
      myRatingRef.current = userRow?.rating ?? 1500

      const channel = supabase
        .channel('plaza_events_confirm_' + matchId)
        .on('broadcast', { event: 'RESULT_CONFIRMED' }, async ({ payload }) => {
          if (payload?.match_id !== matchId) return
          const myResult = payload?.player_a?.user_id === uid
            ? payload.player_a
            : payload?.player_b?.user_id === uid
              ? payload.player_b
              : null
          onConfirmed(myResult || { rating_before: myRatingRef.current, rating_after: myRatingRef.current })
        })
        .subscribe()
      channelRef.current = channel

      pollRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('matches')
          .select('status')
          .eq('id', matchId)
          .single()
        if (data?.status === 'completed' && !cancelled) {
          clearInterval(pollRef.current)
          const { data: { session: s2 } } = await supabase.auth.getSession()
          const uid2 = s2?.user?.id
          const { data: userRow2 } = await supabase.from('users').select('rating').eq('id', uid2).single()
          onConfirmed({ rating_before: myRatingRef.current, rating_after: userRow2?.rating ?? myRatingRef.current })
        }
      }, 5000)
    }

    setupWatch()

    return () => {
      cancelled = true
      clearInterval(pollRef.current)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [matchId, onConfirmed])

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/confirm-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ match_id: matchId }),
      })
      const json = await res.json()
      if (!res.ok) {
        const msg = json.error || '确认失败'
        // Submitter accidentally tapped confirm — gracefully return to pending phase
        if (msg.toLowerCase().includes('cannot confirm your own submission')) {
          onBackToPending?.()
          return
        }
        throw new Error(msg)
      }
      // Find my result: current user may be player_a or player_b in the response
      const { data: { session: s2 } } = await supabase.auth.getSession()
      const uid = s2?.user?.id
      const myResult = json.player_a?.user_id === uid
        ? json.player_a
        : json.player_b || json
      onConfirmed(myResult)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div key="confirm-score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
        <ClipboardList size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-slate-300 text-sm leading-relaxed">
          请核对对手提交的比分，确认无误后完成结算
        </p>
      </div>
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
        <p className="text-slate-400 text-sm text-center mb-5">{submitterNickname ? `${submitterNickname} 提交的比分` : '对手提交的比分'}</p>
        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex justify-between items-center px-2">
            <span className="text-slate-300 text-sm">对手赢</span>
            <span className="text-3xl font-black font-mono text-red-400">{racksLostBySubmitter} 局</span>
          </div>
          <div className="w-full h-px bg-slate-700" />
          <div className="w-full flex justify-between items-center px-2">
            <span className="text-slate-300 text-sm">你赢</span>
            <span className="text-3xl font-black font-mono text-green-400">{racksWonBySubmitter} 局</span>
          </div>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-xl text-center">
          <p>确认失败：{error}</p>
        </motion.div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg mb-3"
      >
        {loading ? <><Loader2 className="animate-spin" size={20} />确认中...</> : '✅ 确认比分，完成结算'}
      </button>
      <button
        disabled
        className="w-full border border-slate-700 text-slate-600 font-bold py-3 rounded-2xl cursor-not-allowed"
        title="功能开发中"
      >
        <AlertTriangle size={16} className="inline mr-1" /> 比分有误，提出争议
      </button>
      <p className="text-slate-600 text-xs text-center mt-2">争议功能开发中</p>
    </motion.div>
  )
}

export default function SubmitResultPage() {
  const navigate = useNavigate()
  const { matchId: paramMatchId } = useParams()
  const { state } = useLocation()
  const matchId = paramMatchId || state?.matchId

  const [matchInfo, setMatchInfo] = useState(null)
  const [myRatingBefore, setMyRatingBefore] = useState(null)
  const [myNickname, setMyNickname] = useState('')
  const [opponentNickname, setOpponentNickname] = useState('')
  const [initLoading, setInitLoading] = useState(true)
  const [initError, setInitError] = useState(null)
  const [opponentAbandoned, setOpponentAbandoned] = useState(false)

  const currentUserIdRef = useRef(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentUserIdRef.current = session?.user?.id
    })
  }, [])

  // Form state
  const [racksWon, setRacksWon] = useState(0)
  const [racksLost, setRacksLost] = useState(0)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // phase: 'form' | 'pending' | 'confirm' | 'settled'
  const [phase, setPhase] = useState(null)
  const [settlementResult, setSettlementResult] = useState(null)
  const [totalMatches, setTotalMatches] = useState(null)

  const [hasInteracted, setHasInteracted] = useState(false)
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [abandonLoading, setAbandonLoading] = useState(false)

  const channelRef = useRef(null)

  // Listen for opponent abandoning the match
  useEffect(() => {
    if (!matchId) return
    const channel = supabase
      .channel('plaza_events_abandon_' + matchId)
      .on('broadcast', { event: 'MATCH_ABANDONED' }, ({ payload }) => {
        if (payload?.match_id !== matchId) return
        if (payload?.abandoned_by === currentUserIdRef.current) return
        setOpponentAbandoned(true)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [matchId])

  function handleBack() {
    if (phase === 'settled' || phase === null) {
      navigate(-1)
      return
    }
    setShowAbandonModal(true)
  }

  async function confirmAbandon() {
    setAbandonLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/abandon-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ match_id: matchId }),
      })
      navigate('/')
    } catch (e) {
      navigate('/')
    } finally {
      setAbandonLoading(false)
      setShowAbandonModal(false)
    }
  }

  const fetchMatch = useCallback(async () => {
    return supabase
      .from('matches')
      .select('player_a_id, player_b_id, status, submitted_by, player_a_racks_won, player_a_racks_lost, player_a:player_a_id(nickname), player_b:player_b_id(nickname)')
      .eq('id', matchId)
      .single()
  }, [matchId])

  // Fetch total completed matches for current user (for calibration badge)
  const fetchTotalMatches = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id
    if (!uid) return
    const { count } = await supabase
      .from('rating_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
    setTotalMatches(count ?? 0)
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id

        const { data: match, error } = await fetchMatch()
        if (error) throw new Error(error.message)

        setMatchInfo(match)

        // Extract nicknames
        const isPlayerA = match.player_a_id === userId
        const myNick = isPlayerA ? match.player_a?.nickname : match.player_b?.nickname
        const oppNick = isPlayerA ? match.player_b?.nickname : match.player_a?.nickname
        setMyNickname(myNick || '')
        setOpponentNickname(oppNick || '')

        // Get current rating for delta display later
        const { data: userRow } = await supabase.from('users').select('rating').eq('id', userId).single()
        setMyRatingBefore(userRow?.rating ?? 1500)

        // Determine phase based on current match status and who I am
        if (match.status === 'completed') {
          // Already done — show settled with current rating (no delta info available)
          setSettlementResult({ rating_before: userRow?.rating, rating_after: userRow?.rating })
          setPhase('settled')
        } else if (match.status === 'awaiting_confirmation') {
          if (match.submitted_by === userId) {
            // I already submitted, waiting
            setPhase('pending')
          } else {
            // Other player submitted, I need to confirm
            setPhase('confirm')
          }
        } else {
          // status === 'locked' — both players see the form
          setPhase('form')
        }
      } catch (e) {
        setInitError(e.message)
      } finally {
        setInitLoading(false)
      }
    }
    if (matchId) init()
  }, [matchId, fetchMatch])

  // Subscribe to SCORE_SUBMITTED while on form phase — jump to confirm if other player submits first
  useEffect(() => {
    if (phase !== 'form' || !matchId) return

    const channel = supabase
      .channel('plaza_events')
      .on('broadcast', { event: 'SCORE_SUBMITTED' }, async ({ payload }) => {
        if (payload?.match_id !== matchId) return
        // Other player submitted — refresh match and go to confirm
        const { data } = await fetchMatch()
        if (data) {
          setMatchInfo(data)
          setPhase('confirm')
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel); channelRef.current = null }
  }, [phase, matchId, fetchMatch])

  async function handleSubmit() {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/process-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ match_id: matchId, racks_won: racksWon, racks_lost: racksLost }),
      })
      const json = await res.json()
      if (!res.ok) {
        // If other player already submitted while we were filling in the form
        if (res.status === 409) {
          const { data } = await fetchMatch()
          if (data) { setMatchInfo(data); setPhase('confirm') }
          return
        }
        throw new Error(json.error || '提交失败')
      }
      setPhase('pending')
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={handleBack} aria-label="返回" className="text-slate-400 hover:text-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">
          {phase === 'confirm' ? '确认比赛结果' : phase === 'settled' ? '比赛结算' : '提交比赛结果'}
        </h1>
      </div>

      {opponentAbandoned && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3"
        >
          <span className="text-xl">👋</span>
          <div>
            <p className="text-amber-400 font-bold text-sm">对手已退出比赛</p>
            <p className="text-slate-400 text-xs mt-1">当前对局已结束，你的比赛记录不受影响</p>
          </div>
          <button onClick={() => navigate('/')} className="ml-auto text-slate-400 hover:text-slate-200 text-xs underline">
            返回广场
          </button>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {initLoading && (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm">加载中...</p>
          </div>
        )}

        {initError && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-4 rounded-xl text-center max-w-sm">
            <p>加载失败：{initError}</p>
            <button onClick={() => navigate(-1)} className="mt-3 text-slate-400 underline text-xs">返回</button>
          </div>
        )}

        {!initLoading && !initError && (
          <AnimatePresence mode="wait">

            {/* Both players see the same form initially */}
            {phase === 'form' && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
                <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6">
                  <Lightbulb size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-sm leading-relaxed">
                    填写比分后提交，等待对手确认后自动结算
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <Counter label="我赢的局数" value={racksWon} onChange={v => { setRacksWon(v); setHasInteracted(true) }} />
                    <div className="w-full h-px bg-slate-700 my-2" />
                    <Counter label="对手赢的局数" value={racksLost} onChange={v => { setRacksLost(v); setHasInteracted(true) }} />
                  </div>
                </div>

                {submitError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-xl text-center">
                    <p>提交失败：{submitError}</p>
                  </motion.div>
                )}

                {hasInteracted && (racksWon === 0 && racksLost === 0) && (
                  <p className="mb-4 text-slate-400 text-sm text-center">请至少输入一方的得分</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitLoading || (racksWon === 0 && racksLost === 0)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-4 rounded-full transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {submitLoading ? <><Loader2 className="animate-spin" size={20} />提交中...</> : '确认提交'}
                </button>
              </motion.div>
            )}

            {/* Submitter: waiting */}
            {phase === 'pending' && (
              <PendingConfirmation
                key="pending"
                matchId={matchId}
                navigate={navigate}
                myRatingBefore={myRatingBefore}
                onConfirmed={(result) => {
                  setSettlementResult(result)
                  fetchTotalMatches()
                  setPhase('settled')
                }}
              />
            )}

            {/* Confirmer: see score and confirm */}
            {phase === 'confirm' && matchInfo && (
              <ConfirmScore
                key="confirm"
                matchId={matchId}
                racksWonBySubmitter={matchInfo.player_a_racks_won ?? 0}
                racksLostBySubmitter={matchInfo.player_a_racks_lost ?? 0}
                submitterNickname={opponentNickname}
                navigate={navigate}
                onConfirmed={(result) => {
                  // Confirmer (Player B) perspective: submitter's racks_won = 对手赢, racks_lost = 你赢
                  // So we flip: my score = player_a_racks_lost, opponent score = player_a_racks_won
                  setRacksWon(matchInfo.player_a_racks_lost ?? 0)
                  setRacksLost(matchInfo.player_a_racks_won ?? 0)
                  setSettlementResult(result)
                  fetchTotalMatches()
                  setPhase('settled')
                }}
                onBackToPending={() => setPhase('pending')}
              />
            )}

            {/* Settlement */}
            {phase === 'settled' && settlementResult && (
              <SettlementResult
                key="settled"
                result={settlementResult}
                navigate={navigate}
                myNickname={myNickname}
                opponentNickname={opponentNickname}
                racksWon={racksWon}
                racksLost={racksLost}
                totalMatches={totalMatches}
              />
            )}

          </AnimatePresence>
        )}
      </div>

      {showAbandonModal && (
        <AbandonModal
          onConfirm={confirmAbandon}
          onCancel={() => setShowAbandonModal(false)}
          loading={abandonLoading}
        />
      )}
    </div>
  )
}
