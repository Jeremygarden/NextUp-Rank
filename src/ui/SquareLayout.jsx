import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import SmartInviteCard from "./SmartInviteCard";
import VenueLeaderboard from "./VenueLeaderboard";
import { getRankInfo } from "../lib/rankColor";
import { supabase } from "../lib/supabaseClient";

function CancelMatchButton({ matchId }) {
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!matchId) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/abandon-match', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      })
    } catch (e) {
      console.error('Cancel match failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-label transition-colors px-2 py-1 disabled:opacity-40"
      style={{ border: '1px solid #8b3a3a', color: '#8b3a3a', background: 'transparent' }}
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
      取消球局
    </button>
  )
}

/**
 * NextUp-Rank: SquareLayout
 * 广场 (Plaza) + 排行榜 (Leaderboard) tab switcher.
 *
 * Props:
 *  - matches: Array<SmartInviteCard props & { distanceMeters: number }>
 *  - loading: boolean
 *  - venueId: string
 *  - venueName: string
 *  - players: Array (passed to VenueLeaderboard)
 */

const TABS = [
  { key: "plaza", label: "广场" },
  { key: "leaderboard", label: "排行榜" },
];

const tabVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const SquareLayout = ({
  matches = [],
  loading = false,
  venueId,
  venueName,
  players = [],
}) => {
  const [activeTab, setActiveTab] = useState("plaza");
  const [direction, setDirection] = useState(1);

  const switchTab = (key) => {
    if (key === activeTab) return;
    setDirection(key === "leaderboard" ? 1 : -1);
    setActiveTab(key);
  };

  const sortedMatches = [...matches].sort(
    (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0a', color: '#e8e8e4' }}>
      {/* Industrial Tab Bar */}
      <div
        className="flex sticky top-0 z-10"
        style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className="flex-1 py-4 text-sm font-bold uppercase tracking-industrial transition-colors duration-200 relative"
            style={{
              color: activeTab === tab.key ? '#e8e8e4' : '#5c5c58',
              background: 'transparent',
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0"
                style={{ height: '2px', backgroundColor: '#c45c1a' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            {activeTab === "plaza" ? (
              <PlazaPane matches={sortedMatches} loading={loading} />
            ) : (
              <div className="p-4">
                <VenueLeaderboard
                  venueId={venueId}
                  venueName={venueName}
                  players={players}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const PlazaPane = ({ matches, loading }) => {
  const navigate = useNavigate();

  async function handleAccept(match) {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    const { data: activeMatch } = await supabase
      .from('matches')
      .select('id, status')
      .or(`player_a_id.eq.${userId},player_b_id.eq.${userId}`)
      .in('status', ['locked', 'awaiting_confirmation', 'processing'])
      .maybeSingle()

    if (activeMatch) {
      alert('你目前已在一场对局中，请先完成或退出当前对局')
      return
    }

    navigate(`/join?code=${match.invite_code}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: '#5c5c58' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c45c1a' }} />
        <span className="text-sm uppercase tracking-label font-semibold">加载中…</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="text-5xl">🎱</span>
        <p className="text-sm font-bold uppercase tracking-industrial" style={{ color: '#e8e8e4' }}>暂无活动对局</p>
        <p className="text-sm text-center px-8" style={{ color: '#5c5c58' }}>周边暂时没有人发起对局，成为第一个发起者吧！</p>
        <button
          onClick={() => navigate('/create-match')}
          className="mt-2 text-sm font-bold uppercase tracking-industrial py-3 px-8 transition-colors"
          style={{ backgroundColor: '#c45c1a', color: '#e8e8e4' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e07a3a'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#c45c1a'}
        >
          发起对局
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-6 space-y-3">
      {matches.map((match, idx) => {
        const inviterRating = match.inviterRating ?? match.rating ?? match.player_a_rating
        const EXPIRE_MS = 15 * 60 * 1000
        const createdAt = match.created_at ? new Date(match.created_at).getTime() : null
        const secondsLeft = createdAt
          ? Math.max(0, Math.round((createdAt + EXPIRE_MS - Date.now()) / 1000))
          : 1800
        return (
          <div key={match.id ?? idx}>
            {match.distanceMeters !== undefined && (
              <p className="text-[11px] font-semibold uppercase tracking-label mb-1 pl-1" style={{ color: '#5c5c58' }}>
                📍 {match.distanceMeters < 1000
                  ? `${match.distanceMeters}m`
                  : `${(match.distanceMeters / 1000).toFixed(1)}km`}
              </p>
            )}
            {match.isOwn && (
              <div className="flex items-center justify-between mb-1 pl-1 pr-1">
                <span
                  className="text-[11px] font-bold uppercase tracking-label px-2 py-0.5"
                  style={{
                    backgroundColor: '#7a3a0f',
                    border: '1px solid #c45c1a',
                    color: '#e07a3a',
                  }}
                >
                  ✦ 我发起
                </span>
                <CancelMatchButton matchId={match.id ?? match.match_id} />
              </div>
            )}
            <SmartInviteCard {...match} inviterRating={typeof inviterRating === 'number' ? inviterRating : null} expiresInSeconds={secondsLeft} onAccept={match.isOwn ? undefined : () => handleAccept(match)} />
          </div>
        )
      })}
    </div>
  );
};

export default SquareLayout;
