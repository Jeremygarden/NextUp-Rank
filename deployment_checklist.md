# NextUp-Rank 上线部署最终 Check-list (Deployment Guide)

在将项目正式推向生产环境（Supabase + Python Service）之前，请逐一核对以下五大板块，确保系统的稳定性、安全性和数学严谨性。

---

## 1. 数据库层 (Supabase/PostgreSQL) - [ ]
- [ ] **PostGIS 扩展**：确认已执行 `CREATE EXTENSION IF NOT EXISTS postgis;`。
- [ ] **核心架构加载**：顺序执行 `schema.sql` -> `advanced_features.sql` -> `square_analytics.sql` -> `concurrency_fix.sql`。
- [ ] **索引校验**：
    - `idx_venues_geo` (GIST) 是否生效？（影响广场发现性能）。
    - `idx_snapshots_user_recent` (B-Tree) 是否生效？（影响前端 25 场滚动显示）。
- [ ] **并发测试**：在 SQL 控制台手动模拟两个并发事务锁定同一个 `user_id`，确认 `FOR UPDATE` 锁定逻辑正常。

## 2. 计算层 (Python Math Service) - [ ]
- [ ] **算法版本一致性**：确认生产环境 `math_prototype.py` 包含 `Illinois Algorithm`（标准 Glicko-2 波动率计算）。
- [ ] **API 封装**：使用 FastAPI 或 Flask 封装计算逻辑，并设置 `API_KEY` 进行握手认证。
- [ ] **数值精度测试**：使用 `test_logic.py` 在计算服务器上跑一遍回归测试，确保无环境导致的浮点数溢出。
- [ ] **超时与重试**：确认计算接口平均响应时间 < 200ms。

## 3. 编排层 (Supabase Edge Function) - [ ]
- [ ] **环境变量**：在 Supabase Dashboard 配置：
    - `MATH_SERVICE_URL`
    - `MATH_SERVICE_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **错误处理**：确认在 `fetch` 失败时有正确的 `rollback` 策略（不更新 Rating）。
- [ ] **触发器配置**：确认对局状态从 `locked` 变为 `completed` 时，能正确触发 Edge Function 异步更新请求。

## 4. 业务与安全 (Security & Logic) - [ ]
- [ ] **LBS 阈值校验**：确认 `advanced_features.sql` 中的 200 米判定逻辑符合球房实际物理尺度。
- [ ] **Anti-Farming 参数**：确认“24小时内同对手超过3场开始衰减”的系数（0.5）符合当前运营预期。
- [ ] **隐私隔离**：确认 `introduction.md` 和 `improvement.md` 仅保存在本地/私有 Git，未被泄露。

## 5. 前端集成 (Next.js / Client) - [ ]
- [ ] **历史展示权重**：前端展示 Rating 历史曲线时，是否应用了 $\omega_i = e^{-\lambda(25 - i)}$ 的加权平滑处理？
- [ ] **LBS 握手 UI**：确认用户在点击“录入比分”前，前端已正确获取并上报经纬度。

---

### **紧急回滚操作建议**
- 如果发现积分出现异常波动，立即将 `matches` 表的触发器禁用：
  `ALTER TABLE matches DISABLE TRIGGER trigger_match_weight_calculation;`
- 使用 `rating_snapshots` 表的记录进行全量回滚。

---
© 2026 NextUp-Rank Deployment Team.
