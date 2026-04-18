import React, { useState, useEffect } from "react";
import { Target, Clock, Trophy, ChevronRight, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getRankInfo } from "../lib/rankColor";

/**
 * Constants & Helpers
 */
const STATUS = {
  PENDING: "pending",
  JOINED: "joined",
  EXPIRED: "expired",
};

const ROLES = {
  Admin: { label: "管理员" },
  Player: { label: "球手" },
  Spectator: { label: "观众" },
};

const GAME_TYPES = {
  "8ball": { label: "八球" },
  "9ball": { label: "九球" },
  "10ball": { label: "十球" },
  "straight": { label: "直线球" },
  "default": { label: "自定义" },
};

/**
 * Sub-components
 */
const RoleBadge = ({ role }) => {
  const r = ROLES[role] || ROLES.Player;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-label px-2 py-0.5"
      style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', color: '#9e9e99' }}
    >
      {r.label}
    </span>
  );
};

const CountdownBadge = ({ seconds }) => {
  const isUrgent = seconds <= 300;
  const isMid = seconds > 300 && seconds <= 600;

  const format = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div
      className={`px-2 py-1 text-[10px] font-mono font-bold flex items-center gap-1.5 uppercase tracking-label ${isUrgent ? 'animate-pulse' : ''}`}
      style={{
        border: `1px solid ${isUrgent ? '#8b3a3a' : isMid ? '#7a6020' : '#2a2a2a'}`,
        color: isUrgent ? '#8b3a3a' : isMid ? '#7a6020' : '#9e9e99',
        backgroundColor: 'transparent',
      }}
    >
      <Clock className="w-3 h-3" />
      {format(seconds)}
    </div>
  );
};

/**
 * Main Component
 */
const SmartInviteCard = ({
  inviter = "玩家",
  inviterRating = null,
  gameType = "8ball",
  location = "球馆",
  startTime = "今晚 20:00",
  entryFee = "Free",
  status: initialStatus = STATUS.PENDING,
  role = "Player",
  inviteUrl = "https://nextup.rank/match/123",
  expiresInSeconds = 3600,
  inviteCode,
  onAccept,
  matchId,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, expiresInSeconds));
  const [currentStatus, setCurrentStatus] = useState(() =>
    expiresInSeconds <= 0 ? STATUS.EXPIRED : initialStatus
  );

  useEffect(() => {
    if (currentStatus !== STATUS.PENDING) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStatus]);

  useEffect(() => {
    if (timeLeft === 0 && currentStatus === STATUS.PENDING) {
      setCurrentStatus(STATUS.EXPIRED);
    }
  }, [timeLeft, currentStatus]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const isExpired = currentStatus === STATUS.EXPIRED || timeLeft <= 0;
  const gameLabel = isExpired ? "已过期" : (GAME_TYPES[gameType] || GAME_TYPES.default).label;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`overflow-hidden w-full ${isExpired ? "opacity-50" : ""}`}
      style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}
    >
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#1e1e1e' }}
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: '#c45c1a' }} />
          <span className="font-bold uppercase tracking-industrial text-xs" style={{ color: '#e8e8e4' }}>
            {gameLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isExpired && currentStatus === STATUS.PENDING && (
            <CountdownBadge seconds={timeLeft} />
          )}
          {inviteCode && (
            <span className="text-[10px] font-mono px-2 py-0.5 uppercase" style={{ color: '#5c5c58', border: '1px solid #2a2a2a' }}>
              #{inviteCode}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Inviter Info */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              backgroundColor: isExpired ? '#1e1e1e' : '#2a2a2a',
              border: `1px solid ${isExpired ? '#2a2a2a' : '#c45c1a'}`,
              color: isExpired ? '#5c5c58' : '#e8e8e4',
            }}
          >
            {typeof inviter === 'string' ? inviter[0]?.toUpperCase() : '?'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] uppercase tracking-label font-semibold" style={{ color: '#5c5c58' }}>
                {currentStatus === STATUS.JOINED ? "已匹配" : "发起者"}
              </p>
              <RoleBadge role={role} />
            </div>
            <h3 className="text-base font-bold" style={{ color: '#e8e8e4' }}>{inviter}</h3>
            {inviterRating !== null && (() => {
              const rank = getRankInfo(inviterRating)
              return (
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 inline-block"
                    style={{ backgroundColor: rank.color }}
                  />
                  <span className="text-[11px] font-semibold font-mono" style={{ color: rank.color }}>
                    {rank.label} · {Math.round(inviterRating)}
                  </span>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-2 mb-4">
          <DetailItem icon={<Clock className="w-3.5 h-3.5" style={{ color: '#c45c1a' }} />} text={startTime} />
          {entryFee && entryFee !== "Free" && (
            <DetailItem icon={<Trophy className="w-3.5 h-3.5" style={{ color: '#4a7c59' }} />} text={`报名费: ${entryFee}`} />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {renderActions(currentStatus, handleCopy, copied, onAccept, isExpired)}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Helper renderers
 */
const DetailItem = ({ icon, text }) => (
  <div className="flex items-center gap-3 px-3 py-2" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
    {icon}
    <span className="text-sm" style={{ color: '#9e9e99' }}>{text}</span>
  </div>
);

const renderActions = (status, onCopy, copied, onAccept, isExpired) => {
  if (status === STATUS.JOINED) {
    return (
      <div
        className="w-full py-3 font-bold text-center text-sm uppercase tracking-industrial"
        style={{ backgroundColor: '#4a7c59', color: '#e8e8e4' }}
      >
        对局已确认 ✓
      </div>
    );
  }

  if (status === STATUS.EXPIRED) {
    return (
      <div
        className="w-full py-3 font-bold text-center text-sm uppercase tracking-industrial"
        style={{ backgroundColor: '#1e1e1e', color: '#5c5c58', border: '1px solid #2a2a2a' }}
      >
        邀请已过期
      </div>
    );
  }

  return (
    <>
      <button
        onClick={onAccept}
        disabled={!onAccept || isExpired}
        className="flex-[2] py-3 font-bold transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-industrial disabled:opacity-40 min-h-[44px]"
        style={{ backgroundColor: '#c45c1a', color: '#e8e8e4' }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#e07a3a' }}
        onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#c45c1a' }}
      >
        接受 <ChevronRight className="w-4 h-4" />
      </button>
      <button
        className="flex-1 py-3 font-bold transition-colors relative group text-sm uppercase tracking-industrial min-h-[44px]"
        onClick={onCopy}
        style={{ backgroundColor: '#1e1e1e', color: '#9e9e99', border: '1px solid #2a2a2a' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e1e1e'}
      >
        <div className="flex items-center justify-center gap-2">
          <Copy className="w-4 h-4" /> 复制
        </div>

        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -40 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold flex items-center gap-1"
              style={{ backgroundColor: '#e8e8e4', color: '#0a0a0a' }}
            >
              <Check className="w-3 h-3" style={{ color: '#4a7c59' }} /> 已复制
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  );
};

export default SmartInviteCard;
