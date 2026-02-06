/**
 * AnxReader SQLite 解析测试脚本
 * 用于验证数据库解析功能是否正常
 * 
 * 运行方式：npx tsx src/test-anx.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 动态导入以使用 ESM
async function main() {
    console.log('📖 AnxReader SQLite 解析测试\n');

    // 读取测试数据库
    const dbPath = join(process.cwd(), 'reference', 'database7.db');
    console.log(`📁 数据库路径: ${dbPath}`);

    const buffer = readFileSync(dbPath);
    console.log(`📦 数据库大小: ${(buffer.length / 1024).toFixed(2)} KB\n`);

    // 使用 sql.js 解析（Node.js 环境）
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();

    const db = new SQL.Database(new Uint8Array(buffer));

    // 查询表结构
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 数据库表:', tables[0]?.values.map(v => v[0]).join(', ') || '无');

    // 查询书籍数量
    const bookCount = db.exec("SELECT COUNT(*) FROM tb_books");
    console.log(`📚 书籍数量: ${bookCount[0]?.values[0][0]}`);

    // 查询笔记数量
    const noteCount = db.exec("SELECT COUNT(*) FROM tb_notes");
    console.log(`📝 笔记数量: ${noteCount[0]?.values[0][0]}`);

    // 查询笔记样例
    const sampleNotes = db.exec(`
    SELECT 
      b.title,
      n.content,
      n.reader_note,
      n.chapter
    FROM tb_notes n
    JOIN tb_books b ON n.book_id = b.id
    LIMIT 3
  `);

    console.log('\n📄 笔记样例:');
    if (sampleNotes[0]?.values) {
        const columns = sampleNotes[0].columns;
        sampleNotes[0].values.forEach((row, i) => {
            console.log(`\n--- 笔记 ${i + 1} ---`);
            columns.forEach((col, j) => {
                const value = row[j];
                const display = typeof value === 'string' && value.length > 50
                    ? value.substring(0, 50) + '...'
                    : value;
                console.log(`  ${col}: ${display}`);
            });
        });
    }

    db.close();
    console.log('\n✅ 测试完成!');
}

main().catch(console.error);
