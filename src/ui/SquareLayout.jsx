import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import SmartInviteCard from "./SmartInviteCard";
import VenueLeaderboard from "./VenueLeaderboard";

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
      <div className="flex-1 overflow-hidden relative">
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
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <span className="text-4xl">🎱</span>
        <p className="text-base font-medium">暂无活动邀请</p>
        <p className="text-xs text-slate-600">周边暂时没有人发起对局，稍后再来看看</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {matches.map((match, idx) => (
        <div key={match.id ?? idx}>
          {match.distanceMeters !== undefined && (
            <p className="text-xs text-slate-500 mb-1 pl-1">
              📍 {match.distanceMeters < 1000
                ? `${match.distanceMeters}m`
                : `${(match.distanceMeters / 1000).toFixed(1)}km`}
            </p>
          )}
          <SmartInviteCard {...match} />
        </div>
      ))}
    </div>
  );
};

export default SquareLayout;
