import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import useLeaderboard from "../hooks/useLeaderboard";
import { getRankInfo } from "../lib/rankColor";

/**
 * NextUp-Rank: VenueLeaderboard
 * Metro tile grid leaderboard with industrial design system.
 */

const MiniSparkline = ({ snapshots = [] }) => {
  if (!snapshots || snapshots.length === 0) return <span className="text-ink-muted text-xs font-mono">—</span>;

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
            stroke={trending ? "#4a7c59" : "#8b3a3a"}
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
    return <span className="text-ink-muted text-xs font-mono">—</span>;
  }
  const positive = delta > 0;
  return (
    <span
      className={`text-xs font-mono font-bold ${
        positive ? "text-signal-green" : "text-signal-red"
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
  const shouldSelfFetch = venueId != null && playersProp == null;
  const { data: fetchedData, loading: fetchLoading } = useLeaderboard(shouldSelfFetch ? venueId : undefined);

  const players = shouldSelfFetch
    ? mapApiToPlayers(fetchedData)
    : (playersProp ?? []);

  if (shouldSelfFetch && fetchLoading) {
    return (
      <div className="tile-card p-8 text-center text-ink-muted text-sm">
        加载中…
      </div>
    );
  }

  return (
    <div className="bg-forge-dark border border-forge-cinder overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-forge-cinder flex items-center justify-between">
        <div>
          <h2 className="text-ink-primary font-bold text-sm uppercase tracking-industrial">
            {venueName ?? "球房排行榜"}
          </h2>
          <p className="text-ink-muted text-[11px] mt-0.5 uppercase tracking-label">今日涨跌 · 近25场走势</p>
        </div>
        <span className="badge" style={{ backgroundColor: '#7a3a0f', borderColor: '#c45c1a', color: '#e07a3a' }}>
          {players.length} 人
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2rem_1fr_5rem_4rem_4rem] gap-2 px-4 py-2 text-[10px] uppercase tracking-widest text-ink-muted border-b border-forge-cinder">
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
          <p className="text-ink-secondary font-medium">排行榜暂无数据</p>
          <p className="text-ink-muted text-sm mt-1">完成对局后即可上榜</p>
        </div>
      ) : (
        <ul>
          {players.map((player, idx) => {
            const rank = idx + 1;
            // Rank colors: gold/silver/bronze for top 3 using design palette
            const rankColor =
              rank === 1
                ? "#c45c1a"   // rust — top rank
                : rank === 2
                ? "#9e9e99"   // ash — silver
                : rank === 3
                ? "#7a6020"   // caution amber — bronze
                : "#5c5c58";  // muted

            return (
              <li
                key={player.id ?? idx}
                className="grid grid-cols-[2rem_1fr_5rem_4rem_4rem] gap-2 items-center px-4 py-3 border-b border-forge-cinder last:border-b-0 hover:bg-forge-cinder transition-colors"
                style={rank === 1 ? { borderLeft: '2px solid #c45c1a' } : {}}
              >
                {/* Rank */}
                <span className="text-sm font-mono font-bold" style={{ color: rankColor }}>
                  {rank}
                </span>

                {/* Nickname */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #2a2a2a',
                      color: '#9e9e99',
                    }}
                  >
                    {(player.nickname ?? "?")[0]}
                  </div>
                  <span className="text-ink-primary text-sm font-medium truncate">
                    {player.nickname ?? "—"}
                  </span>
                </div>

                {/* Rating */}
                <span className="text-right font-mono font-bold text-sm flex items-center justify-end gap-1">
                  {typeof player.rating === "number" ? (
                    <>
                      <span
                        className="w-1.5 h-1.5 inline-block flex-shrink-0"
                        style={{ backgroundColor: getRankInfo(player.rating).color }}
                      />
                      <span style={{ color: getRankInfo(player.rating).color }}>
                        {player.rating.toFixed(0)}
                      </span>
                    </>
                  ) : "—"}
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
