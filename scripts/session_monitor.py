import os
import json
import subprocess
from datetime import datetime, timedelta

WORKSPACE = "/home/azureuser/.openclaw/workspace"
MEMORY_DIR = os.path.join(WORKSPACE, "memory")

def get_sessions():
    """获取所有 session 列表"""
    try:
        # 使用 openclaw CLI 获取 session 列表，limit 设置大一点
        result = subprocess.run(["openclaw", "sessions", "list", "--limit", "100", "--json"], capture_output=True, text=True)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception as e:
        print(f"Error fetching sessions: {e}")
    return []

def summarize_session(session_key):
    """请求模型总结特定 session"""
    # 这里通过 openclaw exec 调用内置的总结逻辑或发送指令给 main agent
    # 简化版：我们记录 session 的基本信息和最后几条消息作为存根
    try:
        result = subprocess.run(["openclaw", "sessions", "history", session_key, "--limit", "20", "--json"], capture_output=True, text=True)
        if result.returncode == 0:
            history = json.loads(result.stdout)
            # 提取文本内容进行简单格式化（实际生产中可调用 LLM 进一步提炼）
            summary = f"### Session: {session_key}\n"
            for msg in history:
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                summary += f"- **[{role}]**: {content[:200]}...\n"
            return summary
    except Exception as e:
        return f"Error summarizing {session_key}: {e}"
    return ""

def main():
    today_str = datetime.now().strftime("%Y-%m-%d")
    target_file = os.path.join(MEMORY_DIR, f"{today_str}-memory.md")
    
    sessions = get_sessions()
    
    with open(target_file, "a") as f:
        f.write(f"\n## Daily Summary - {datetime.now().isoformat()}\n")
        for s in sessions:
            # 过滤逻辑：可以根据最后活跃时间过滤
            s_key = s.get('sessionKey')
            if s_key:
                summary = summarize_session(s_key)
                f.write(summary + "\n")
    
    print(f"Daily summary written to {target_file}")

if __name__ == "__main__":
    main()
