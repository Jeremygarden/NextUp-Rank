import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronLeft, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function Counter({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-slate-400 text-sm font-medium">{label}</p>
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

// Settlement result display (shared by player_a and player_b)
function SettlementResult({ result, navigate }) {
  const delta = result ? (result.rating_after - result.rating_before) : 0

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 2000)
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
      </div>

      <button onClick={() => navigate('/')} className="w-full border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-3 rounded-2xl transition-colors">
        返回广场
      </button>
      <p className="text-slate-500 text-xs mt-3 text-center">2 秒后自动跳转...</p>
    </motion.div>
  )
}

// Player A: waiting for player_b to confirm
function PendingConfirmation({ matchId, submitResult, navigate, onConfirmed }) {
  const [confirmState, setConfirmState] = useState('waiting') // waiting | slow
  const pollRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    // Listen for RESULT_CONFIRMED broadcast from plaza_events
    const channel = supabase
      .channel('plaza_events')
      .on('broadcast', { event: 'RESULT_CONFIRMED' }, ({ payload }) => {
        if (payload?.match_id === matchId) {
          // payload.player_a contains settlement data for player_a
          const playerAResult = payload?.player_a || submitResult
          onConfirmed(playerAResult)
        }
      })
      .subscribe()
    channelRef.current = channel

    // Polling fallback: check match status every 5s
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('matches')
          .select('status, player_a_rating_after, player_a_rating_before')
          .eq('id', matchId)
          .single()

        if (data?.status === 'completed') {
          clearInterval(pollRef.current)
          const polledResult = {
            rating_after: data.player_a_rating_after ?? submitResult?.rating_after,
            rating_before: data.player_a_rating_before ?? submitResult?.rating_before,
          }
          onConfirmed(polledResult)
        }
      } catch (e) {
        // silently ignore poll errors
      }
    }, 5000)

    // Show slow message after 10s
    const slowTimer = setTimeout(() => setConfirmState('slow'), 10000)

    return () => {
      clearInterval(pollRef.current)
      clearTimeout(slowTimer)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [matchId, submitResult, onConfirmed])

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

      {confirmState === 'slow' && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <p className="text-slate-400 text-sm">对手确认中，通常当面很快完成</p>
        </motion.div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6 text-left">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">比赛 ID</span>
          <span className="font-mono text-slate-300 text-xs">{matchId?.slice(0, 8)}...</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">状态</span>
          <span className="text-amber-400 font-medium">等待确认</span>
        </div>
      </div>

      <button onClick={() => navigate('/')} className="w-full border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-3 rounded-2xl transition-colors">
        返回广场
      </button>
    </motion.div>
  )
}

// Player B: waiting for player_a to submit
function WaitingForScore({ matchId, onScoreSubmitted }) {
  const channelRef = useRef(null)

  useEffect(() => {
    const channel = supabase
      .channel('plaza_events')
      .on('broadcast', { event: 'SCORE_SUBMITTED' }, ({ payload }) => {
        if (payload?.match_id === matchId) {
          onScoreSubmitted()
        }
      })
      .subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [matchId, onScoreSubmitted])

  return (
    <motion.div key="waiting-score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full max-w-sm">
      <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
      <h2 className="text-xl font-bold mb-2">等待对手提交比分...</h2>
      <p className="text-slate-400 text-sm">对手提交后，你将看到比分并确认</p>
    </motion.div>
  )
}

// Player B: confirm the score submitted by player_a
function ConfirmScore({ matchId, racksWon, racksLost, navigate, onConfirmed }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
      if (!res.ok) throw new Error(json.error || '确认失败')
      // player_b settlement data is in json.player_b
      onConfirmed(json.player_b || json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div key="confirm-score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
        <span className="text-xl">📋</span>
        <p className="text-slate-300 text-sm leading-relaxed">
          请核对对手提交的比分，确认无误后完成结算
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
        <p className="text-slate-400 text-sm text-center mb-4">对手提交的比分</p>
        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex justify-between items-center">
            <span className="text-slate-300 text-sm">对手赢</span>
            <span className="text-3xl font-black font-mono text-red-400">{racksWon}</span>
            <span className="text-slate-500 text-sm">局</span>
          </div>
          <div className="w-full h-px bg-slate-700" />
          <div className="w-full flex justify-between items-center">
            <span className="text-slate-300 text-sm">你赢</span>
            <span className="text-3xl font-black font-mono text-green-400">{racksLost}</span>
            <span className="text-slate-500 text-sm">局</span>
          </div>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-xl text-center">
          <p>确认失败：{error}</p>
          <p className="text-red-400/70 text-xs mt-1">请检查网络连接后重试</p>
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
        className="w-full border border-slate-700 text-slate-600 font-bold py-3 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
        title="功能开发中"
      >
        ⚠️ 比分有误，提出争议
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

  // Match info
  const [matchInfo, setMatchInfo] = useState(null)
  const [isPlayerA, setIsPlayerA] = useState(null)
  const [initLoading, setInitLoading] = useState(true)
  const [initError, setInitError] = useState(null)

  // Player A form state
  const [racksWon, setRacksWon] = useState(0)
  const [racksLost, setRacksLost] = useState(0)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Shared phase state
  // player_a phases: form | pending | settled
  // player_b phases: waiting | confirm | settled
  const [phase, setPhase] = useState(null)
  const [settlementResult, setSettlementResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id

        const { data: match, error } = await supabase
          .from('matches')
          .select('player_a_id, player_b_id, player_a_racks_won, player_a_racks_lost, status')
          .eq('id', matchId)
          .single()

        if (error) throw new Error(error.message)

        setMatchInfo(match)
        const playerA = userId === match.player_a_id
        setIsPlayerA(playerA)

        // Determine initial phase
        if (playerA) {
          if (match.status === 'awaiting_confirmation') {
            setPhase('pending')
          } else if (match.status === 'completed') {
            setPhase('settled')
          } else {
            setPhase('form')
          }
        } else {
          if (match.status === 'awaiting_confirmation') {
            setPhase('confirm')
          } else if (match.status === 'completed') {
            setPhase('settled')
          } else {
            setPhase('waiting')
          }
        }
      } catch (e) {
        setInitError(e.message)
      } finally {
        setInitLoading(false)
      }
    }
    if (matchId) init()
  }, [matchId])

  async function handlePlayerASubmit() {
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
      if (!res.ok) throw new Error(json.error || '提交失败')
      setSubmitResult(json)
      setPhase('pending')
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const pageTitle = isPlayerA === false ? '确认比赛结果' : '提交比赛结果'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} aria-label="返回" className="text-slate-400 hover:text-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">{phase === 'settled' ? '比赛结算' : pageTitle}</h1>
      </div>

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
            {/* Player A: form */}
            {phase === 'form' && isPlayerA && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
                <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6">
                  <span className="text-xl">💡</span>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    由你填写比分，对手确认后完成结算
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <Counter label="我赢的局数" value={racksWon} onChange={setRacksWon} />
                    <div className="w-full h-px bg-slate-700 my-2" />
                    <Counter label="对手赢的局数" value={racksLost} onChange={setRacksLost} />
                  </div>
                </div>

                {submitError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-xl text-center">
                    <p>提交失败：{submitError}</p>
                    <p className="text-red-400/70 text-xs mt-1">请检查网络连接后重试</p>
                  </motion.div>
                )}

                {(racksWon === 0 && racksLost === 0) && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-slate-400 text-sm text-center">
                    请至少输入一方的得分
                  </motion.p>
                )}

                <button
                  onClick={handlePlayerASubmit}
                  disabled={submitLoading || (racksWon === 0 && racksLost === 0)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {submitLoading ? <><Loader2 className="animate-spin" size={20} />提交中...</> : '确认提交'}
                </button>
              </motion.div>
            )}

            {/* Player A: waiting for confirmation */}
            {phase === 'pending' && isPlayerA && (
              <PendingConfirmation
                key="pending"
                matchId={matchId}
                submitResult={submitResult}
                navigate={navigate}
                onConfirmed={(result) => {
                  setSettlementResult(result)
                  setPhase('settled')
                }}
              />
            )}

            {/* Player B: waiting for player_a to submit */}
            {phase === 'waiting' && !isPlayerA && (
              <WaitingForScore
                key="waiting"
                matchId={matchId}
                onScoreSubmitted={async () => {
                  // Refresh match data
                  const { data } = await supabase
                    .from('matches')
                    .select('player_a_racks_won, player_a_racks_lost, status')
                    .eq('id', matchId)
                    .single()
                  if (data) {
                    setMatchInfo(prev => ({ ...prev, ...data }))
                    setPhase('confirm')
                  }
                }}
              />
            )}

            {/* Player B: confirm score */}
            {phase === 'confirm' && !isPlayerA && matchInfo && (
              <ConfirmScore
                key="confirm"
                matchId={matchId}
                racksWon={matchInfo.player_a_racks_won ?? 0}
                racksLost={matchInfo.player_a_racks_lost ?? 0}
                navigate={navigate}
                onConfirmed={(result) => {
                  setSettlementResult(result)
                  setPhase('settled')
                }}
              />
            )}

            {/* Settlement result (both players) */}
            {phase === 'settled' && settlementResult && (
              <SettlementResult
                key="settled"
                result={settlementResult}
                navigate={navigate}
              />
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
