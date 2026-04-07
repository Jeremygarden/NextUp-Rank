import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import SmartInviteCard from "./SmartInviteCard";
import VenueLeaderboard from "./VenueLeaderboard";
import { getRankInfo } from "../lib/rankColor";
import { supabase } from "../lib/supabaseClient";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 py-4 text-base font-bold tracking-wide transition-colors relative ${
              activeTab === tab.key ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
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
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <span className="text-sm">加载中…</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
        <span className="text-5xl">🎱</span>
        <p className="text-base font-medium text-slate-300">暂无活动对局</p>
        <p className="text-sm text-slate-500 text-center px-8">周边暂时没有人发起对局，成为第一个发起者吧！</p>
        <button
          onClick={() => navigate('/create-match')}
          className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
        >
          发起对局
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-6 space-y-4">
      {matches.map((match, idx) => {
        const inviterRating = match.inviterRating ?? match.rating ?? match.player_a_rating
        const rankInfo = typeof inviterRating === 'number' ? getRankInfo(inviterRating) : null
        const EXPIRE_MS = 30 * 60 * 1000
        const createdAt = match.created_at ? new Date(match.created_at).getTime() : null
        const secondsLeft = createdAt
          ? Math.max(0, Math.round((createdAt + EXPIRE_MS - Date.now()) / 1000))
          : 1800
        return (
          <div key={match.id ?? idx}>
            {match.distanceMeters !== undefined && (
              <p className="text-xs text-slate-500 mb-1 pl-1">
                📍 {match.distanceMeters < 1000
                  ? `${match.distanceMeters}m`
                  : `${(match.distanceMeters / 1000).toFixed(1)}km`}
              </p>
            )}
            {rankInfo && (
              <div className="flex items-center gap-1.5 mb-1 pl-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: rankInfo.color }} />
                <span className="text-xs font-medium" style={{ color: rankInfo.color }}>
                  {rankInfo.label} · {inviterRating.toFixed(0)}
                </span>
              </div>
            )}
            {match.isOwn && (
              <div className="flex items-center gap-1.5 mb-1 pl-1">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  ✦ 我发起
                </span>
              </div>
            )}
            <SmartInviteCard {...match} expiresInSeconds={secondsLeft} onAccept={match.isOwn ? undefined : () => handleAccept(match)} />
          </div>
        )
      })}
    </div>
  );
};

export default SquareLayout;
