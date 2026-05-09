# NextUp-Rank Design System

> **Agent 读取指引：** 在任何涉及 UI 改动的任务开始前，必须读取本文件。
> 所有组件、样式、动效决策均以本文件为准，不得随意引入新的设计语言。

**决策日期：** 2026-04-21
**当前版本：** v3+v2 Hybrid（最终方案）
**产品地址：** https://nextup-rank.vercel.app

---

## 1. 设计方向

### 核心哲学
**v3 打底（温度感）+ v2 做味精（竞技感）**

| 来源 | 职责 | 体现在 |
|------|------|--------|
| v3 | 温度、圆角、pill 形、玻璃态卡片 | 按钮、卡片、登录页 |
| v2 | Mono 数字、竞技感、indigo 权威感 | 积分数字、排行榜、结算页 |

### 品牌色
**保留 `indigo-400/600`，不改。** 这是唯一品牌色。

---

## 2. Color Tokens

定义在 `src/index.css` `:root` 中，所有组件优先使用 CSS 变量，避免硬编码 Tailwind 颜色。

```css
/* Accent */
--accent:       #4f46e5;              /* indigo-600 — 主 CTA、active 态 */
--accent-light: #818cf8;              /* indigo-400 — 次要强调 */
--accent-hover: #6366f1;              /* indigo-500 — hover 态 */
--accent-glow:  rgba(79,70,229,0.15); /* glow 光晕 */

/* Surfaces */
--bg-base:  #020617;                  /* slate-950 — 全局背景 */
--bg-card:  #0f172a;                  /* slate-900 — 卡片、弹层 */
--bg-input: #1e293b;                  /* slate-800 — 输入框 */
--border:   rgba(148,163,184,0.12);   /* slate-400/12 — 边框 */

/* Text */
--text-primary:   #f1f5f9;  /* slate-100 — 主文字 */
--text-secondary: #cbd5e1;  /* slate-300 — 次要文字 */
--text-muted:     #94a3b8;  /* slate-400 — 辅助文字 */
--text-subtle:    #64748b;  /* slate-500 — 极弱文字 */
```

### 语义色（不可随意新增）
| 用途 | 颜色 | Tailwind |
|------|------|----------|
| 成功/胜利 | `#4ade80` | `green-400` |
| 失败/负局 | `#f87171` | `red-400` |
| 警告/定级 | `#fbbf24` | `amber-400` |
| 在线状态 | `#34d399` | `emerald-400` |

---

## 3. Typography

### 字体
| 用途 | 字体 | 加载方式 |
|------|------|----------|
| 正文、UI | Inter | `@fontsource/inter`（本地，PR #41） |
| 数字、积分、排名 | IBM Plex Mono | `@fontsource/ibm-plex-mono`（本地，PR #41） |

**规则：**
- 所有积分数字、排名数字、比分 → 必须 `font-mono`（IBM Plex Mono）
- 正文、按钮、标签 → Inter（默认，不需要显式声明）
- 禁止使用系统字体作为数字展示字体

### 字号规范
| 用途 | 尺寸 |
|------|------|
| 结算页大积分 | `text-3xl font-black font-mono` |
| Profile 积分数字 | `text-5xl font-black font-mono` |
| 段位标签 | `text-xs font-bold` |
| 正文 | `text-sm` / `text-base` |
| 辅助说明 | `text-xs text-slate-500` |

---

## 4. Radius（圆角）

```css
--radius-btn:   9999px;  /* pill — 所有按钮 rounded-full */
--radius-card:  1.5rem;  /* 24px — rounded-3xl — 卡片、弹层 */
--radius-input: 0.75rem; /* 12px — rounded-xl — 输入框 */
--radius-badge: 9999px;  /* pill — 徽章、标签 */
```

**铁律：** 按钮必须 `rounded-full`（pill 形），不允许方角或小圆角按钮。

---

## 5. 全局组件类

定义在 `src/index.css` `@layer components`，直接用类名，不要重复写 Tailwind 样式：

```
.btn-primary   — 主 CTA 按钮（indigo-600，pill，全宽）
.btn-secondary — 次要按钮（边框，pill，全宽）
.btn-danger    — 危险操作按钮（red-600，pill，全宽）
```

---

## 6. 段位系统

定义在 `src/lib/rankColor.js`，共 10 段：

| 段位 | 积分区间 | 颜色 | Emoji |
|------|---------|------|-------|
| 入门 | < 1100 | `#86EFAC` | 🌱 |
| 新手 | 1100–1199 | `#A7F3D0` | 🆕 |
| 爱好 | 1200–1299 | `#6EE7B7` | 🎱 |
| 进阶 | 1300–1399 | `#93C5FD` | 🔵 |
| 白银 | 1400–1499 | `#CBD5E1` | 🥈 |
| 黄金 | 1500–1699 | `#FFDD94` | 🥇 |
| 精英 | 1700–1899 | `#FA897B` | 💎 |
| 大师 | 1900–2199 | `#CCABD8` | 🏆 |
| 王者 | 2200–2399 | `#E2E8F0` | 👑 |
| 传奇 | ≥ 2400 | `#FCD34D` | 🔥 |

**初始积分：** 1500（黄金段位）

**段位展示规则（积分盲盒，2026-05-09 起）：**
- 对局前：只显示段位 emoji + 名称（不显示具体积分数字）
- 结算页：先显示 `???`，1.5s 后揭示积分变化，1.8s 后揭示新积分
- 个人 Profile：始终显示完整积分数字
- 排行榜：显示完整积分数字

---

## 7. 页面结构规范

### 全局布局
- 背景：`bg-slate-950`（`--bg-base`）
- 底部 Tab Bar：`GlobalTabBar`（`src/ui/GlobalTabBar.jsx`）
- 卡片：`bg-slate-900 border border-slate-800 rounded-3xl`

### 广场页（PlazaPage）
- 默认 Tab：**排行榜**（2026-05-09 起，避免空屏冷清感）
- 空状态：脉冲雷达动效 + 附近球友卡片 + 在线人数
- 有球局时：SmartInviteCard 列表（按距离排序）

### 结算页（SubmitResultPage）
- 深色背景 + indigo glow orb
- WIN/LOSS 大字：`font-mono font-black`
- 积分变化：先 `???` → 揭示动效（framer-motion scale bounce）
- 自动 8 秒后跳转广场

### 登录/注册页
- Glassmorphism 卡片（`bg-white/5 backdrop-blur`）
- Ambient glow 背景
- Pill CTA 按钮

---

## 8. 动效规范

使用 **framer-motion**，已安装。

| 场景 | 动效 |
|------|------|
| 卡片出现 | `initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}` |
| Tab 切换 | AnimatePresence + x 方向平移（60px），duration 0.25s |
| 积分揭示 | `scale: [0.8, 1.1, 1]`，delay 1.5s / 1.8s |
| 广场雷达 | 3 层同心圆环，`scale: [1,1.4,1] opacity: [0.6,0,0.6]`，repeat Infinity，各层 delay +0.6s |
| 数字计数 | `AnimatedNumber` 组件（已封装在 SubmitResultPage） |

**规则：**
- 禁止 CSS transition 做复杂动效，统一用 framer-motion
- 所有动效必须有 cleanup（clearTimeout / clearInterval）
- `repeat: Infinity` 的动效由 framer-motion 管理，组件卸载自动停止

---

## 9. 图标规范

使用 **Lucide React**，已安装。

**禁止使用 emoji 作为 UI 图标**（除段位系统和特殊语境外）。

已完成替换（PR #41）：
- ⚠️ → `<AlertTriangle />` (lucide)
- 📋 → `<ClipboardList />` (lucide)
- 💡 → `<Lightbulb />` (lucide)
- 🎱 → `<Target />` (lucide，球局相关场景)

---

## 10. 未来设计方向（已规划，未实现）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| Soul 雷达首屏 | 浮动头像泡泡表示在线球友，产品 wow moment | 下阶段 |
| 用户自选透明度 | Profile 设置积分公开/隐藏 | 后续迭代 |
| 战绩分享卡 v2 | 积分盲盒揭示后可分享 | 待定 |
| Profile Stats 三格 | Mono 24px，总场次/胜场/积分 | 第三批 |
| Grain 纹理叠加 | 可选，增加竞技质感 | 第三批 |

---

## 11. 禁止事项

- ❌ 禁止引入新的主题色（只允许 indigo 系列 + 语义色）
- ❌ 禁止方角按钮（必须 `rounded-full`）
- ❌ 禁止用 emoji 做功能图标（段位系统除外）
- ❌ 禁止在对局前显示对手具体积分数字
- ❌ 禁止重复定义已在 `index.css` 中定义的样式类
- ❌ 禁止在排行榜之外的场景显示其他用户的积分（除结算页揭示）

---

*本文件由 AI Agent 于 2026-05-09 根据实际代码和历史决策整理。如设计方向有重大变更，必须同步更新本文件。*
