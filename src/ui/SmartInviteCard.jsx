import React, { useState } from "react";
import { Target, Clock, Trophy, Users, ChevronRight, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SmartInviteCard = ({
  inviter = "Alex",
  gameType = "8ball", // 8ball, 9ball, 10ball, straight
  location = "Golden Break Club",
  startTime = "Tonight 20:00",
  entryFee = "Free",
  status = "Pending", // Pending, Joined, Expired
  role = "Player", // Player, Admin, Spectator
  inviteUrl = "https://nextup.rank/match/123",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };
  // 根据对局类型返回不同的视觉样式
  const getGameStyles = (type) => {
    if (status === "Expired") {
      return {
        label: "Link Expired",
        color: "bg-slate-950/80",
        text: "text-slate-500",
        border: "border-slate-800",
      };
    }
    switch (type) {
      case "8ball":
        return {
          label: "8-Ball",
          color: "bg-slate-800",
          text: "text-slate-100",
          border: "border-slate-700",
        };
      case "9ball":
        return {
          label: "9-Ball",
          color: "bg-yellow-500/20",
          text: "text-yellow-500",
          border: "border-yellow-500/30",
        };
      case "10ball":
        return {
          label: "10-Ball",
          color: "bg-blue-500/20",
          text: "text-blue-500",
          border: "border-blue-500/30",
        };
      case "straight":
        return {
          label: "Straight Pool",
          color: "bg-red-500/20",
          text: "text-red-500",
          border: "border-red-500/30",
        };
      default:
        return {
          label: "Custom",
          color: "bg-indigo-500/20",
          text: "text-indigo-400",
          border: "border-indigo-500/30",
        };
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      Admin: { text: "Admin", bg: "bg-red-500/10", border: "border-red-500/30", color: "text-red-400" },
      Player: { text: "Player", bg: "bg-blue-500/10", border: "border-blue-500/30", color: "text-blue-400" },
      Spectator: { text: "Spectator", bg: "bg-purple-500/10", border: "border-purple-500/30", color: "text-purple-400" },
    };
    const r = roles[role] || roles.Player;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.bg} ${r.border} ${r.color}`}>
        {r.text}
      </span>
    );
  };

  const style = getGameStyles(gameType);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-sm ${status === "Expired" ? "grayscale contrast-75" : ""}`}
    >
      {/* 顶部：玩法标识 */}
      <div
        className={`p-4 ${style.color} border-b ${style.border} flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <Target className={`w-5 h-5 ${style.text}`} />
          <span
            className={`font-bold tracking-wider uppercase text-sm ${style.text}`}
          >
            {status === "Expired" ? "Expired" : style.label}
          </span>
        </div>
        <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white/60 font-mono">
          #INV-2024
        </div>
      </div>

      <div className="p-6">
        {/* 邀请人 */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-12 h-12 rounded-2xl ${status === "Expired" ? "bg-slate-800" : "bg-gradient-to-br from-indigo-500 to-purple-600"} flex items-center justify-center text-xl shadow-lg`}>
            {inviter[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
                {status === "Joined" ? "Match Confirmed With" : "Match Request From"}
              </p>
              {getRoleBadge(role)}
            </div>
            <h3 className="text-xl text-white font-bold">{inviter}</h3>
          </div>
        </div>

        {/* 详情卡片区 */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-200 text-sm font-medium">
              {startTime}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 text-sm font-medium">
              Entry: {entryFee}
            </span>
          </div>
        </div>

        {/* 操作区 */}
        <div className="flex gap-3">
          {status === "Pending" ? (
            <>
              <button className="flex-[2] bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                Accept <ChevronRight className="w-4 h-4" />
              </button>
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold transition-all active:scale-95 relative group" onClick={handleCopy}>
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
          ) : status === "Joined" ? (
            <div className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-4 rounded-2xl font-bold text-center">
              Matched Successfully
            </div>
          ) : (
            <div className="w-full bg-slate-800/50 text-slate-500 border border-slate-700/50 py-4 rounded-2xl font-bold text-center italic">
              Invitation Expired
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SmartInviteCard;
