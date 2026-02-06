/**
 * MoonReader (.an) 解析测试脚本
 * 验证 Pako 解压和 Gap Analysis 逻辑
 * 
 * 运行方式: npx tsx src/test-moon.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import pako from 'pako';

// --- 1. 解压逻辑 (复用自 UserScript) ---
function decodeAnFile(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    try {
        return pako.inflateRaw(uint8Array, { to: 'string' });
    } catch (e1) {
        try {
            return pako.inflate(uint8Array, { to: 'string' });
        } catch (e2) {
            try {
                return pako.ungzip(uint8Array, { to: 'string' });
            } catch (e3) {
                return new TextDecoder("utf-8").decode(buffer);
            }
        }
    }
}

// --- 2. Gap Analysis 解析逻辑 (复用自 UserScript) ---
function parseMoonReaderContent(text: string) {
    const sections = text.split(/\n#\r?\n/);
    const notes: any[] = [];

    // 第一部分通常是书籍元数据
    const metaSection = sections[0].trim();
    console.log('📘 书籍路径:', metaSection.split('\n')[1] || 'Unknown');

    for (let i = 1; i < sections.length; i++) {
        let section = sections[i].trim();
        if (!section) continue;

        const lines = section.split(/\n/).map(l => l.trimEnd());
        if (lines.length < 10) continue;

        const id = lines[0];
        const ts = parseInt(lines[9]) || 0;

        const noteData = {
            id,
            chapterIndex: parseInt(lines[4]) || 0,
            startPos: parseInt(lines[6]) || 0,
            timeString: ts > 0 ? new Date(ts).toLocaleString() : "",
            userNote: "",
            highlightText: "",
        };

        // Gap Analysis
        let firstContentIndex = -1;
        for (let k = 10; k < lines.length; k++) {
            const l = lines[k].trim();
            if (l !== "" && l !== "0") {
                firstContentIndex = k;
                break;
            }
        }

        if (firstContentIndex !== -1) {
            let lastContentIndex = lines.length - 1;
            // 从后往前找最后一个非 0 非空行
            while (lastContentIndex >= firstContentIndex &&
                (lines[lastContentIndex].trim() === '0' || lines[lastContentIndex].trim() === '')) {
                lastContentIndex--;
            }

            const contentLines = lines.slice(firstContentIndex, lastContentIndex + 1);
            const gap = firstContentIndex - 10;

            if (gap === 1) {
                // gap=1 表示第一行是用户笔记
                noteData.userNote = contentLines[0].replace(/<BR>/gi, '\n');
                if (contentLines.length > 1) {
                    noteData.highlightText = contentLines.slice(1).join('\n');
                }
            } else {
                // 否则全是高亮
                noteData.highlightText = contentLines.join('\n');
            }
        }

        if (noteData.userNote || noteData.highlightText) {
            notes.push(noteData);
        }
    }

    return { raw: text, notes };
}

// --- 3. 测试主函数 ---
async function main() {
    console.log('🌙 MoonReader .an 解析测试\n');

    // 搜索 .Moon+/Cache 目录下的 .an 文件
    const cacheDir = join(process.cwd(), 'reference', '.Moon+', 'Cache');
    const files = readdirSync(cacheDir).filter(f => f.endsWith('.an'));

    if (files.length === 0) {
        console.error('❌ 未找到 .an 文件');
        return;
    }

    // 取第一个文件测试
    const targetFile = files.find(f => f.includes('逻辑学')) || files[0];
    const filePath = join(cacheDir, targetFile);

    console.log(`📄 解析文件: ${targetFile}`);
    const buffer = readFileSync(filePath);
    console.log(`📦 文件大小: ${buffer.length} bytes`);

    try {
        const text = decodeAnFile(buffer.buffer as ArrayBuffer);
        console.log(`🔓 解压成功! 文本长度: ${text.length}`);
        // console.log('🔍前200字符:', text.substring(0, 200).replace(/\n/g, '\\n'));

        const result = parseMoonReaderContent(text);
        console.log(`\n✅ 解析完成! 提取到 ${result.notes.length} 条笔记`);

        if (result.notes.length > 0) {
            console.log('\n📝 笔记样例:');
            result.notes.slice(0, 3).forEach((n, i) => {
                console.log(`\n--- Note ${i + 1} ---`);
                console.log(`Time: ${n.timeString}`);
                if (n.userNote) console.log(`Note: ${n.userNote}`);
                console.log(`Highlight: ${n.highlightText.substring(0, 50)}...`);
            });
        }

    } catch (e) {
        console.error('❌ 解析失败:', e);
    }
}

main();
