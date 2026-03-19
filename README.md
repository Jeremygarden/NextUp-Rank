# NextUp-Rank: 下一代台球竞技评分系统

> **不仅是分数，更是你的台球身价。**

NextUp-Rank 是一款专为业余与职业台球竞技设计的排名系统。它基于改进的 **Billiard-Glicko (BG-1)** 算法，旨在通过精准的数据分析与地理位置验证，解决传统排名系统（如 FargoRate, APA）反馈滞后、无法精准区分微小实力差距的问题。

## 核心产品逻辑：BG-1 算法

传统的系统往往只看“胜”或“负”。在 NextUp-Rank 中，我们认为 **7:0 的零封**与 **7:6 的险胜**有着本质的区别：

*   **局分敏感度 (Rack-Level Sensitivity)**：BG-1 算法将每一局的表现都计入权重。如果你在落后的情况下连续追分，系统会捕捉到你竞技状态的实时提升。
*   **不确定性监测 (RD - Rating Deviation)**：系统不仅记录你的分值，还计算对你分值的“信心”。长期不比赛，系统会自动增加你的分值波动性（RD），确保排名真实反映当前水平。
*   **波动率调节 (Volatility Tracking)**：如果你最近表现突飞猛进，系统会识别出这种“爆发”，并加速你的段位提升。

## 三大核心功能

### 1. LBS 地理位置验证
杜绝远程“刷分”。每一场计入排名的比赛必须通过现场地理位置握手验证（基于 PostGIS 技术），确保每一场对局都发生在真实的球房，由真实的选手参与。

### 2. Karma 信任分系统
除了技术分，我们还有一份“信任分”。频繁产生比分争议、违规操作的玩家，其分数权重将降低，从而保护高素质竞技环境。

### 3. 历史瞬间溯源 (Snapshotting)
我们记录你台球生涯的每一个闪光点。你可以回溯到两年前的某场具体比赛，看当年的你是如何通过那场关键对决跨入高段位的。

## 技术栈预览
- **Engine**: Python / Billiard-Glicko (BG-1)
- **Database**: PostgreSQL with PostGIS (Event Sourcing)
- **Verification**: GPS-based Handshake Logic

---
© 2026 NextUp-Rank Team. Built for the competitive pool community.
