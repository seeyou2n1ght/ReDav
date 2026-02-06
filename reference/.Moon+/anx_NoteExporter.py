# -*- coding: utf-8 -*-
"""
Anx Note Exporter
-----------------
Export notes and highlights from Anx library database.
Dependencies: None (uses only standard library)
"""

import os
import sys
import json
import sqlite3
import re
import argparse
from collections import defaultdict
from contextlib import closing

# --- Configuration ---
DEFAULT_CONFIG = {
    'output_dir': 'exported_notes',
}

# --- Output Functions ---
def log_event(event_type: str, **kwargs) -> None:
    """
    输出结构化日志事件
    
    Args:
        event_type: 事件类型（config, scan, export, complete, error等）
        **kwargs: 事件相关数据
    """
    print(json.dumps({"type": event_type, **kwargs}, ensure_ascii=False))

# --- Path Functions ---
def get_db_path(library_path):
    """获取数据库路径"""
    return os.path.join(library_path, 'database7.db')

def check_database(db_path):
    """检查数据库是否存在"""
    # 安全验证：防止路径遍历
    abs_db_path = os.path.abspath(db_path)
    abs_cwd = os.path.abspath(os.getcwd())
    if not abs_db_path.startswith(abs_cwd) and not os.path.isabs(db_path):
        log_event("error", message="Invalid database path: path traversal detected")
        return False
    
    if not os.path.exists(db_path):
        log_event("error", message=f"Database not found: {db_path}")
        log_event("error", message="Please provide a valid Anx library path.")
        return False
    return True

# --- Filename Sanitization ---
def sanitize_filename(name):
    """
    清洗文件名，移除操作系统不允许的字符。
    """
    if not name:
        return "unknown_book"
    # 替换 Windows/Linux 文件系统非法字符
    sanitized = re.sub(r'[\\/*?:"<>|]', '_', str(name)).strip()
    # 限制文件名长度，避免路径过长
    max_length = 100
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + "..."
    return sanitized

# --- Core Export Logic ---
def export_notes(library_path, output_dir):
    """
    从 Anx 书库导出笔记
    
    Args:
        library_path: 书库根目录路径
        output_dir: 输出目录路径
        
    Returns:
        dict: 导出统计信息
    """
    db_path = get_db_path(library_path)
    
    # 检查数据库
    if not check_database(db_path):
        return {"books": 0, "notes": 0, "error": True}
    
    # 创建输出目录
    try:
        os.makedirs(output_dir, exist_ok=True)
        # 检查写入权限
        test_file = os.path.join(output_dir, '.write_test')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
    except OSError as e:
        log_event("error", message=f"Failed to create or write to output directory: {e}")
        return {"books": 0, "notes": 0, "error": True}
    
    stats = {"books": 0, "notes": 0, "error": False}
    
    try:
        with closing(sqlite3.connect(db_path)) as conn:
            cursor = conn.cursor()
            
            # 查询笔记数据（包含位置信息用于排序）
            sql = """
                SELECT 
                    b.id as book_id,
                    b.title,
                    n.content,
                    n.reader_note,
                    n.chapter,
                    n.create_time
                FROM tb_notes n
                JOIN tb_books b ON n.book_id = b.id
                ORDER BY b.title, n.create_time, n.id
            """
            
            cursor.execute(sql)
            rows = cursor.fetchall()
            
            if not rows:
                log_event("scan", message="No notes found in database")
                return stats
            
            log_event("scan", notes_found=len(rows))
            
            # 按书名分组
            notes_by_book = defaultdict(list)
            for book_id, title, content, reader_note, chapter, create_time in rows:
                notes_by_book[title].append({
                    'content': content,
                    'reader_note': reader_note,
                    'chapter': chapter,
                    'create_time': create_time
                })
            
            # 导出每本书的笔记
            for title, notes in notes_by_book.items():
                safe_title = sanitize_filename(title)
                file_path = os.path.join(output_dir, f"{safe_title}.md")
                
                # 检查是否覆盖
                is_overwrite = os.path.exists(file_path)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    # 写入该书的所有笔记
                    for note in notes:
                        content_str = str(note['content']) if note['content'] is not None else ""
                        note_str = str(note['reader_note']).strip() if note['reader_note'] is not None else ""
                        
                        # 格式化输出
                        f.write(f"> {content_str}\n\n")
                        
                        if note_str:
                            f.write(f"{note_str}\n\n")
                
                log_event("export", 
                         book=title, 
                         notes=len(notes), 
                         file=f"{safe_title}.md",
                         overwrite=is_overwrite)
                
                stats["books"] += 1
                stats["notes"] += len(notes)
            
    except sqlite3.Error as e:
        log_event("error", message=f"Database error: {e}")
        stats["error"] = True
    except Exception as e:
        log_event("error", message=f"Export failed: {e}")
        stats["error"] = True
    
    return stats

# --- Main CLI ---
def main():
    parser = argparse.ArgumentParser(description="Anx Note Exporter - Export notes from Anx library")
    parser.add_argument("--library", type=str, required=True, 
                       help="Anx library root path (contains database7.db)")
    parser.add_argument("--output", type=str, 
                       help="Output directory for exported notes (default: ./exported_notes)")
    parser.add_argument("--dry-run", action="store_true", 
                       help="Preview mode, count notes without exporting")
    args = parser.parse_args()
    
    library_path = args.library
    output_dir = args.output or DEFAULT_CONFIG['output_dir']
    
    # 验证书库路径
    if not os.path.exists(library_path):
        log_event("error", message=f"Library path does not exist: {library_path}")
        sys.exit(1)
    
    # 输出配置信息
    log_event("config", library=library_path, output=output_dir, dry_run=args.dry_run)
    
    # 预览模式：只统计不导出
    if args.dry_run:
        db_path = get_db_path(library_path)
        if not check_database(db_path):
            sys.exit(1)
        
        try:
            with closing(sqlite3.connect(db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT COUNT(*), COUNT(DISTINCT book_id) 
                    FROM tb_notes
                """)
                total_notes, total_books = cursor.fetchone()
                log_event("preview", notes=total_notes, books=total_books)
                log_event("complete", books=0, notes=0, exported=0, error=False)
                return
        except sqlite3.Error as e:
            log_event("error", message=f"Database error: {e}")
            sys.exit(1)
    
    # 执行导出
    stats = export_notes(library_path, output_dir)
    
    # 输出完成信息
    log_event("complete", 
             books=stats["books"], 
             notes=stats["notes"],
             output_dir=os.path.abspath(output_dir),
             error=stats["error"])
    
    if stats["error"]:
        sys.exit(1)

if __name__ == "__main__":
    main()
