import React, { useState, useEffect } from "react";
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
      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors px-2 py-0.5 rounded-full border border-red-800/40 hover:bg-red-500/10"
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
  const [activeTab, setActiveTab] = useState("leaderboard"); // Task A1: 默认显示排行榜，永远有内容，缓解广场冷清感
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
            className={`flex-1 py-4 text-base font-bold tracking-wide transition-colors duration-200 relative ${
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

// Task A2 + A3 + A4: 改造后的发现流空状态组件
const EmptyPlazaState = ({ navigate, onlineCount }) => {
  // Task A3: 在线人数文案（由父组件传入真实数据）
  const onlineText = onlineCount > 0 ? `🟢 附近 ${onlineCount} 人在线` : '正在连接球友网络...';

  // Task A4: 附近球友列表
  const [nearbyPlayers, setNearbyPlayers] = useState([]);

  useEffect(() => {
    // Task A4: 拉取最近注册用户作为「附近球友」展示（按 id 倒序近似活跃度）
    const fetchNearbyPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, nickname, rating')
          .order('last_seen_at', { ascending: false })
          .limit(5);
        if (!error && data && data.length > 0) {
          setNearbyPlayers(data);
        }
      } catch (e) {
        // 静默失败，不展示该区域
      }
    };
    fetchNearbyPlayers();
  }, []);

  // Task A2: 脉冲圆环层数配置
  const pulseRings = [0, 1, 2];

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 px-4">
      {/* Task A2: 雷达脉冲动效 — 同心圆环 + 中心🎱 */}
      <div className="relative flex items-center justify-center w-40 h-40">
        {pulseRings.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${(i + 1) * 44}px`,
              height: `${(i + 1) * 44}px`,
              border: i === 0 ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.18)',
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.6, ease: "easeInOut" }}
          />
        ))}
        {/* 中心圆 */}
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center z-10">
          <span className="text-3xl">🎱</span>
        </div>
      </div>

      {/* Task A2: 更新文案 */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-base font-medium text-slate-300">正在扫描附近球友...</p>
        <p className="text-sm text-slate-500 text-center px-8">成为第一个发起对局的人</p>
      </div>

      {/* Task A3: 在线状态文案 */}
      <p className="text-sm text-emerald-400 font-semibold">{onlineText}</p>

      {/* Task A2: CTA 按钮文字改为「发起挑战」 */}
      <button
        onClick={() => navigate('/create-match')}
        className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
      >
        发起挑战
      </button>

      {/* Task A4: 附近球友卡片列表 */}
      {nearbyPlayers.length > 0 && (
        <div className="w-full max-w-sm mt-2 space-y-2">
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase px-1">附近球友</p>
          {nearbyPlayers.map((player) => {
            const rankInfo = typeof player.rating === 'number' ? getRankInfo(player.rating) : null;
            const initial = (player.nickname || '?').charAt(0).toUpperCase();
            return (
              <div
                key={player.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3"
              >
                {/* 头像首字母圆形 */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: rankInfo?.color ?? '#6366f1' }}
                >
                  {initial}
                </div>
                {/* 昵称 + 段位徽章 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {player.nickname || '匿名球友'}
                  </p>
                  {rankInfo && (
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ color: rankInfo.color, backgroundColor: `${rankInfo.color}20` }}
                    >
                      {rankInfo.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PlazaPane = ({ matches, loading }) => {
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(null)

  useEffect(() => {
    async function fetchOnlineCount() {
      try {
        // 30 分钟内活跃的用户视为在线
        const threshold = new Date(Date.now() - 30 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('last_seen_at', threshold)
        setOnlineCount(count ?? 0)
      } catch {
        // 静默失败，保持降级文案
      }
    }
    fetchOnlineCount()
  }, [])

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

  // Task A2/A3/A4: 无对局时展示发现流空状态（含真实在线人数）
  if (matches.length === 0) {
    return <EmptyPlazaState navigate={navigate} onlineCount={onlineCount} />;
  }

  return (
    <div className="p-4 pb-6 space-y-4">
      {matches.map((match, idx) => {
        const inviterRating = match.inviterRating ?? match.rating ?? match.player_a_rating
        const rankInfo = typeof inviterRating === 'number' ? getRankInfo(inviterRating) : null
        const EXPIRE_MS = 15 * 60 * 1000
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
            {match.isOwn && (
              <div className="flex items-center justify-between mb-1 pl-1 pr-1">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
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
