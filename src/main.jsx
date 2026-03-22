import React from "react";
import ReactDOM from "react-dom/client";
import PerformancePulseGraph from "./ui/PerformancePulseGraph.jsx";
import SmartInviteCard from "./ui/SmartInviteCard.jsx";
import "./index.css";

const App = () => (
  <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
    {/* B 组件：智能邀请卡 */}
    <div className="flex flex-wrap gap-6 justify-center">
      <SmartInviteCard
        inviter="Mikey"
        gameType="9ball"
        startTime="Tonight 20:00"
        entryFee="Loser Payout"
      />
      <SmartInviteCard
        inviter="Coach"
        gameType="straight"
        startTime="Sat 14:00"
        entryFee="Training Session"
      />
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
