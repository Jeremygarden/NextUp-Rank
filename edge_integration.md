# NextUp-Rank: Supabase Edge Function & Python 集成方案

为了保持算法的精确性 (Python) 并利用 Supabase 的高并发能力，我们采用以下架构：

## 1. 架构概览
- **Database (Supabase)**: 负责数据存储与行级锁 (`FOR UPDATE`)。
- **Edge Function (Deno/TS)**: 负责权限校验、数据库事务编排及调用 Python 微服务。
- **Math Service (Python)**: 运行 `math_prototype.py`，暴露计算接口。

## 2. Python 微服务实现 (FastAPI 包装)
在生产环境中，我们将 `math_prototype.py` 包装为 REST 接口：

```python
# main.py
from fastapi import FastAPI
from math_prototype import BilliardGlicko

app = FastAPI()
bg = BilliardGlicko()

@app.post("/calculate-rating")
async def calculate(data: dict):
    # 输入: player_a, player_b, score_w, score_l
    res = bg.update_rating(
        data['rating'], data['rd'], data['vol'],
        data['racks_won'], data['racks_lost'],
        data['opp_rating'], data['opp_rd']
    )
    return {"new_rating": res[0], "new_rd": res[1], "new_vol": res[2]}
```

## 3. Edge Function 调用逻辑 (TypeScript)
Edge Function 充当“事务官”，确保计算前后的数据一致性：

```typescript
// supabase/functions/process-match/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { match_id } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 1. 开启数据库事务并加锁 (调用之前写的 concurrency_fix.sql)
  const { data: match } = await supabase.rpc('lock_and_get_match_data', { mid: match_id })

  // 2. 调用 Python 算法微服务
  const response = await fetch('https://your-python-service/calculate-rating', {
    method: 'POST',
    body: JSON.stringify({
      rating: match.player_a.rating,
      rd: match.player_a.rd,
      // ... 其他参数
    })
  })
  const { new_rating, new_rd, new_vol } = await response.json()

  // 3. 原子更新数据库 (调用之前写的 atomic_update_user_rating)
  await supabase.rpc('atomic_update_user_rating', {
    target_user_id: match.player_a.id,
    new_rating, new_rd, new_vol
  })

  return new Response(JSON.stringify({ status: 'success' }))
})
```

## 4. 部署建议
- **计算隔离**：将 Python 服务部署在华为云/Azure 的弹性容器（CCI/ACI）中，以获得稳定的数学计算环境。
- **安全校验**：在 Edge Function 和 Python 服务之间添加 `API_KEY` 校验，防止算法接口被恶意调用。
- **超时处理**：Edge Function 设置 10s 超时，防止网络波动导致数据库锁死。

---
*NextUp-Rank Integrated Engineering Solution.*
