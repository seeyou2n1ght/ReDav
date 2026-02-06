/**
 * SQLite 数据库加载器
 * 使用 sql.js (WASM) 在浏览器中解析 SQLite 数据库
 * 
 * 采用 Dynamic Import 按需加载，避免影响首屏性能
 */

import type { Database, SqlJsStatic } from 'sql.js';

// sql.js 单例，避免重复加载 WASM
let SQL: SqlJsStatic | null = null;

/**
 * 按需加载 sql.js
 * 首次调用时加载 WASM，后续调用直接返回缓存
 */
async function getSqlJs(): Promise<SqlJsStatic> {
    if (SQL) {
        return SQL;
    }

    // Dynamic Import - 只有使用时才加载
    const initSqlJs = (await import('sql.js')).default;

    // 从 CDN 加载 WASM 文件（约 1MB）
    // 生产环境可考虑自托管
    SQL = await initSqlJs({
        locateFile: (file: string) =>
            `https://sql.js.org/dist/${file}`
    });

    return SQL;
}

/**
 * 从 ArrayBuffer 加载 SQLite 数据库
 * @param buffer - 数据库文件的二进制内容
 * @returns sql.js Database 实例
 */
export async function loadDatabase(buffer: ArrayBuffer): Promise<Database> {
    const SQL = await getSqlJs();
    const uint8Array = new Uint8Array(buffer);
    return new SQL.Database(uint8Array);
}

/**
 * 关闭数据库连接
 * @param db - Database 实例
 */
export function closeDatabase(db: Database): void {
    db.close();
}

/**
 * 执行 SQL 查询并返回结果
 * @param db - Database 实例
 * @param sql - SQL 查询语句
 * @returns 查询结果数组，每行是一个对象
 */
export function executeQuery<T extends Record<string, unknown>>(
    db: Database,
    sql: string
): T[] {
    const result = db.exec(sql);

    if (result.length === 0) {
        return [];
    }

    const { columns, values } = result[0];

    // 将列名和值组合为对象数组
    return values.map(row => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj as T;
    });
}
