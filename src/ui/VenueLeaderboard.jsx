import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import useLeaderboard from "../hooks/useLeaderboard";

/**
 * NextUp-Rank: VenueLeaderboard
 * 展示某个球房的玩家排行榜，包含段位、昨日涨跌和近25场走势。
 *
 * Props:
 *  - venueId: string
 *  - venueName: string
 *  - players: Array<{
 *      id: string,
 *      nickname: string,
 *      rating: number,
 *      recent_delta: number,       // today's rating change (from GET /api/leaderboard)
 *      recent_25_snapshots: Array<{ rating: number }>,  // INTERFACE.md: users.recent_25_snapshots
 *    }>
 */

const MiniSparkline = ({ snapshots = [] }) => {
  if (!snapshots || snapshots.length === 0) return <span className="text-slate-600 text-xs">—</span>;

  const data = snapshots.map((s, i) => ({
    i,
    rating: typeof s === "number" ? s : s.rating ?? 0,
  }));

  const first = data[0]?.rating ?? 0;
  const last = data[data.length - 1]?.rating ?? 0;
  const trending = last >= first;

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />
          <Line
            type="monotone"
            dataKey="rating"
            stroke={trending ? "#34d399" : "#f87171"}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const DeltaBadge = ({ delta }) => {
  if (delta === undefined || delta === null || delta === 0) {
    return <span className="text-slate-500 text-xs font-mono">—</span>;
  }
  const positive = delta > 0;
  return (
    <span
      className={`text-xs font-mono font-bold ${
        positive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {positive ? "+" : ""}
      {delta.toFixed(1)}
      {positive ? "△" : "▽"}
    </span>
  );
};

/**
 * Map leaderboard API response items to the players array format.
 * API: { user_id, nickname, rating, recent_delta, recent_25_snapshots }
 * Component: { id, nickname, rating, recent_delta, recent_25_snapshots }
 */
const mapApiToPlayers = (apiData) =>
  (apiData ?? []).map((item) => ({
    id: item.user_id,
    nickname: item.nickname,
    rating: item.rating,
    recent_delta: item.recent_delta,
    recent_25_snapshots: item.recent_25_snapshots ?? [],
  }));

const VenueLeaderboard = ({ venueId, venueName, players: playersProp }) => {
  // Self-fetch when venueId is provided and no players prop given
  const shouldSelfFetch = venueId != null && playersProp == null;
  const { data: fetchedData, loading: fetchLoading } = useLeaderboard(shouldSelfFetch ? venueId : undefined);

  const players = shouldSelfFetch
    ? mapApiToPlayers(fetchedData)
    : (playersProp ?? []);

  if (shouldSelfFetch && fetchLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
        加载中…
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-slate-100 font-bold text-base">
            {venueName ?? "球房排行榜"}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">今日涨跌 · 近25场走势</p>
        </div>
        <span className="text-indigo-400 font-mono text-xs border border-indigo-500/30 bg-indigo-500/10 rounded-full px-2 py-1">
          {players.length} 人
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2rem_1fr_5rem_4rem_4rem] gap-2 px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 border-b border-slate-800/60">
        <span>#</span>
        <span>昵称</span>
        <span className="text-right">积分</span>
        <span className="text-right">今日</span>
        <span className="text-center">走势</span>
      </div>

      {/* Rows */}
      {players.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-3xl mb-3">🏆</p>
          <p className="text-slate-400 font-medium">排行榜暂无数据</p>
          <p className="text-slate-600 text-sm mt-1">完成对局后即可上榜</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/60">
          {players.map((player, idx) => {
            const rank = idx + 1;
            const rankStyle =
              rank === 1
                ? "text-amber-400 font-black"
                : rank === 2
                ? "text-slate-300 font-bold"
                : rank === 3
                ? "text-amber-700 font-bold"
                : "text-slate-500";

            return (
              <li
                key={player.id ?? idx}
                className="grid grid-cols-[2rem_1fr_5rem_4rem_4rem] gap-2 items-center px-4 py-3 hover:bg-slate-800/40 transition-colors"
              >
                {/* Rank */}
                <span className={`text-sm ${rankStyle}`}>{rank}</span>

                {/* Nickname */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(player.nickname ?? "?")[0]}
                  </div>
                  <span className="text-slate-200 text-sm font-medium truncate">
                    {player.nickname ?? "—"}
                  </span>
                </div>

                {/* Rating */}
                <span className="text-right text-amber-400 font-mono font-bold text-sm">
                  {typeof player.rating === "number"
                    ? player.rating.toFixed(0)
                    : "—"}
                </span>

                {/* Delta */}
                <span className="text-right">
                  <DeltaBadge delta={player.recent_delta} />
                </span>

                {/* Sparkline */}
                <div className="flex justify-center">
                  <MiniSparkline snapshots={player.recent_25_snapshots} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default VenueLeaderboard;
