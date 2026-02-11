import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface BookCoverProps {
    title: string;
    author?: string;
    className?: string;
}

// 预设的高级配色方案 (背景色, 文字色, 强调色)
const PALETTES = [
    ['#F3F4F6', '#1F2937', '#9CA3AF'], // 经典灰
    ['#ECFEFF', '#164E63', '#06B6D4'], // 青色
    ['#FFF7ED', '#7C2D12', '#F97316'], // 橙色
    ['#FDF2F8', '#831843', '#DB2777'], // 粉色
    ['#F0FDF4', '#14532D', '#22C55E'], // 绿色
    ['#EFF6FF', '#1E3A8A', '#3B82F6'], // 蓝色
    ['#FAF5FF', '#581C87', '#A855F7'], // 紫色
];

// 简单的字符串哈希函数
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function BookCover({ title, author, className }: BookCoverProps) {
    const { bg, text, accent, pattern } = useMemo(() => {
        const hash = simpleHash(title + (author || ''));
        const paletteIndex = hash % PALETTES.length;
        const [bg, text, accent] = PALETTES[paletteIndex];
        const pattern = hash % 3; // 0: circles, 1: lines, 2: dots
        return { bg, text, accent, pattern };
    }, [title, author]);

    return (
        <div
            className={cn(
                "relative w-full aspect-[2/3] overflow-hidden rounded-md shadow-sm border border-black/5",
                "flex flex-col p-6 transition-all duration-300 group-hover:shadow-md",
                className
            )}
            style={{ backgroundColor: bg }}
        >
            {/* 装饰纹理 */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                {pattern === 0 && (
                    <svg width="100%" height="100%">
                        <pattern id={`circles-${simpleHash(title)}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill={text} />
                        </pattern>
                        <rect width="100%" height="100%" fill={`url(#circles-${simpleHash(title)})`} />
                    </svg>
                )}
                {pattern === 1 && (
                    <svg width="100%" height="100%">
                        <pattern id={`lines-${simpleHash(title)}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="20" stroke={text} strokeWidth="1" />
                        </pattern>
                        <rect width="100%" height="100%" fill={`url(#lines-${simpleHash(title)})`} />
                    </svg>
                )}
                {pattern === 2 && (
                    <svg width="100%" height="100%">
                        <pattern id={`dots-${simpleHash(title)}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect x="0" y="0" width="2" height="2" fill={text} />
                            <rect x="10" y="10" width="2" height="2" fill={text} />
                        </pattern>
                        <rect width="100%" height="100%" fill={`url(#dots-${simpleHash(title)})`} />
                    </svg>
                )}
            </div>

            {/* 脊背阴影效果 (左侧) */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-black/20 to-transparent z-10" />

            {/* 内容区域 */}
            <div className="relative z-20 flex-1 flex flex-col justify-between h-full text-center">

                {/* 书名 (自动缩放) */}
                <div className="flex-1 flex items-center justify-center">
                    <h3
                        className={cn(
                            "font-bold font-serif leading-tight",
                            title.length > 20 ? "text-lg" : title.length > 10 ? "text-xl" : "text-2xl"
                        )}
                        style={{ color: text }}
                    >
                        {title}
                    </h3>
                </div>

                {/* 作者 */}
                {author && (
                    <div className="mt-4 pt-4 border-t border-black/10">
                        <p className="text-xs font-medium tracking-wider uppercase" style={{ color: accent }}>
                            {author}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
