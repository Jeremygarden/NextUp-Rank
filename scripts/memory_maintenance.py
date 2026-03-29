import os
import glob
from datetime import datetime, timedelta

WORKSPACE = "/home/azureuser/.openclaw/workspace"
MEMORY_DIR = os.path.join(WORKSPACE, "memory")
MAIN_MEMORY = os.path.join(WORKSPACE, "MEMORY.md")

def weekly_merge():
    """每周合并 Daily 记忆到 Weekly 文件并提炼到主 MEMORY.md"""
    today = datetime.now()
    weekly_file = os.path.join(MEMORY_DIR, f"weekly-{today.strftime('%Y-W%W')}.md")
    
    # 收集过去 7 天的 daily 文件
    daily_files = []
    for i in range(7):
        date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        path = os.path.join(MEMORY_DIR, f"{date_str}-memory.md")
        if os.path.exists(path):
            daily_files.append(path)
    
    if not daily_files:
        return

    content = f"# Weekly Memory: {today.strftime('%Y-W%W')}\n\n"
    for df in daily_files:
        with open(df, 'r') as f:
            content += f"## From {os.path.basename(df)}\n" + f.read() + "\n"
    
    with open(weekly_file, "w") as f:
        f.write(content)
    
    # 执行 QMD 索引 (假设系统中已配置 qmd 工具)
    os.system(f"qmd index {WORKSPACE}") 
    
    # 提炼到主 MEMORY.md (简化演示：追加周报标题)
    with open(MAIN_MEMORY, "a") as f:
        f.write(f"\n- {today.strftime('%Y-%m-%d')}: Completed weekly merge to {os.path.basename(weekly_file)}\n")

def cleanup_old_memory():
    """清理 40 天前的记忆"""
    threshold = datetime.now() - timedelta(days=40)
    files = glob.glob(os.path.join(MEMORY_DIR, "*.md"))
    for f in files:
        try:
            # 简单从文件名判断日期 %Y-%m-%d-memory.md
            basename = os.path.basename(f)
            if "-memory.md" in basename:
                date_part = basename.replace("-memory.md", "")
                file_date = datetime.strptime(date_part, "%Y-%m-%d")
                if file_date < threshold:
                    os.remove(f)
                    print(f"Removed old memory: {f}")
        except:
            pass

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "weekly":
            weekly_merge()
        elif sys.argv[1] == "cleanup":
            cleanup_old_memory()
