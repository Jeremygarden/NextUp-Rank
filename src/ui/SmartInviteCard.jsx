import React from "react";
import { Target, Clock, Trophy, Users, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const SmartInviteCard = ({
  inviter = "Alex",
  gameType = "8ball", // 8ball, 9ball, 10ball, straight
  location = "Golden Break Club",
  startTime = "Tonight 20:00",
  entryFee = "Free",
}) => {
  // 根据对局类型返回不同的视觉样式
  const getGameStyles = (type) => {
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

  const style = getGameStyles(gameType);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-sm"
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
            {style.label}
          </span>
        </div>
        <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white/60 font-mono">
          #INV-2024
        </div>
      </div>

      <div className="p-6">
        {/* 邀请人 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">
            {inviter[0]}
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
              Match Request From
            </p>
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
          <button className="flex-[2] bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
            Accept <ChevronRight className="w-4 h-4" />
          </button>
          <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold transition-all">
            Decline
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartInviteCard;
