import React, { useState, useEffect } from "react";
import { Target, Clock, Trophy, ChevronRight, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Constants & Helpers
 */
const STATUS = {
  PENDING: "Pending",
  JOINED: "Joined",
  EXPIRED: "Expired",
};

const ROLES = {
  Admin: { label: "Admin", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  Player: { label: "Player", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  Spectator: { label: "Spectator", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
};

const GAME_TYPES = {
  "8ball": { label: "8-Ball", color: "bg-slate-800", text: "text-slate-100", border: "border-slate-700" },
  "9ball": { label: "9-Ball", color: "bg-yellow-500/20", text: "text-yellow-500", border: "border-yellow-500/30" },
  "10ball": { label: "10-Ball", color: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500/30" },
  "straight": { label: "Straight Pool", color: "bg-red-500/20", text: "text-red-500", border: "border-red-500/30" },
  "default": { label: "Custom", color: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" },
};

/**
 * Sub-components for better decoupling
 */
const RoleBadge = ({ role }) => {
  const r = ROLES[role] || ROLES.Player;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.bg} ${r.border} ${r.text}`}>
      {r.label}
    </span>
  );
};

const CountdownBadge = ({ seconds }) => {
  const getStyles = (s) => {
    if (s > 600) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (s > 300) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse";
  };

  const format = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border ${getStyles(seconds)} transition-colors duration-500`}>
      <Clock className="w-3 h-3" />
      {format(seconds)}
    </div>
  );
};

/**
 * Main Component
 */
const SmartInviteCard = ({
  inviter = "Alex",
  gameType = "8ball",
  location = "Golden Break Club",
  startTime = "Tonight 20:00",
  entryFee = "Free",
  status: initialStatus = STATUS.PENDING,
  role = "Player",
  inviteUrl = "https://nextup.rank/match/123",
  expiresInSeconds = 3600,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  useEffect(() => {
    if (currentStatus !== STATUS.PENDING || timeLeft <= 0) {
      if (timeLeft <= 0) setCurrentStatus(STATUS.EXPIRED);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [currentStatus, timeLeft]);

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
  const gameStyle = isExpired 
    ? { label: "Expired", color: "bg-slate-950/80", text: "text-slate-500", border: "border-slate-800" }
    : (GAME_TYPES[gameType] || GAME_TYPES.default);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-sm ${isExpired ? "grayscale contrast-75" : ""}`}
    >
      {/* Header */}
      <div className={`p-4 ${gameStyle.color} border-b ${gameStyle.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Target className={`w-5 h-5 ${gameStyle.text}`} />
          <span className={`font-bold tracking-wider uppercase text-sm ${gameStyle.text}`}>
            {gameStyle.label}
          </span>
        </div>
        
        {!isExpired && currentStatus === STATUS.PENDING && (
          <CountdownBadge seconds={timeLeft} />
        )}

        <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white/60 font-mono">
          #INV-2024
        </div>
      </div>

      <div className="p-6">
        {/* Inviter Info */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-12 h-12 rounded-2xl ${isExpired ? "bg-slate-800" : "bg-gradient-to-br from-indigo-500 to-purple-600"} flex items-center justify-center text-xl shadow-lg text-white`}>
            {inviter[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
                {currentStatus === STATUS.JOINED ? "Confirmed With" : "Request From"}
              </p>
              <RoleBadge role={role} />
            </div>
            <h3 className="text-xl text-white font-bold">{inviter}</h3>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-3 mb-8">
          <DetailItem icon={<Clock className="w-4 h-4 text-indigo-400" />} text={startTime} />
          <DetailItem icon={<Trophy className="w-4 h-4 text-emerald-400" />} text={`Entry: ${entryFee}`} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {renderActions(currentStatus, handleCopy, copied)}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Helper renderers for readability
 */
const DetailItem = ({ icon, text }) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
    {icon}
    <span className="text-slate-200 text-sm font-medium">{text}</span>
  </div>
);

const renderActions = (status, onCopy, copied) => {
  if (status === STATUS.JOINED) {
    return (
      <div className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-4 rounded-2xl font-bold text-center">
        Matched Successfully
      </div>
    );
  }
  
  if (status === STATUS.EXPIRED) {
    return (
      <div className="w-full bg-slate-800/50 text-slate-500 border border-slate-700/50 py-4 rounded-2xl font-bold text-center italic">
        Invitation Expired
      </div>
    );
  }

  return (
    <>
      <button className="flex-[2] bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
        Accept <ChevronRight className="w-4 h-4" />
      </button>
      <button 
        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold transition-all active:scale-95 relative group" 
        onClick={onCopy}
      >
        <div className="flex items-center justify-center gap-2">
          <Copy className="w-4 h-4" /> Copy
        </div>
        
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -45 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute left-1/2 -translate-x-1/2 bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-emerald-500" /> Copied
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  );
};

export default SmartInviteCard;
