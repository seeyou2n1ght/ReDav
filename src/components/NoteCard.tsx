import type { UnifiedNote } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
    Copy,
    Share2,
    Quote,
    Clock,
    MapPin,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteCardProps {
    note: UnifiedNote;
    showBookTitle?: boolean;
}

export function NoteCard({ note, showBookTitle }: NoteCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // 复制内容到剪贴板
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${note.highlight}\n\n— ${note.bookTitle}`);
            // TODO: Show toast
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Card
            className="group relative overflow-visible transition-all duration-300 hover:shadow-md border-transparent hover:border-gray-200 bg-white"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 装饰性引用符号 */}
            <div className="absolute top-4 left-4 text-gray-100 dark:text-gray-800 -z-0 select-none">
                <Quote size={48} className="opacity-50" />
            </div>

            <div className="p-6 relative z-10 space-y-4">
                {/* 主要高亮内容 */}
                <div className="relative">
                    <blockquote className="text-lg leading-relaxed text-gray-800 font-serif border-l-4 border-indigo-500/30 pl-4 py-1 my-2">

                        {/* 模拟荧光笔效果 */}
                        <span className="bg-gradient-to-r from-yellow-50 to-orange-50 decoration-clone px-1 rounded-sm">
                            {note.highlight}
                        </span>
                    </blockquote>
                </div>

                {/* 用户想法 (如果有) */}
                {note.note && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                        <div className="flex gap-2 items-start text-sm text-gray-600">
                            <span className="text-indigo-500 mt-1">💭</span>
                            <p className="italic">{note.note}</p>
                        </div>
                    </div>
                )}

                {/* 底部元数据 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-2">
                    <div className="flex items-center gap-3">
                        {/* 章节信息 */}
                        {note.chapter && (
                            <span className="flex items-center gap-1 max-w-[200px] sm:max-w-[300px] truncate" title={note.chapter}>
                                <MapPin size={12} className="flex-shrink-0" />
                                {note.chapter}
                            </span>
                        )}

                        {/* 页码/进度 */}
                        {note.page !== undefined && (
                            <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-[10px]">
                                {note.page}%
                            </span>
                        )}

                        {/* 时间 */}
                        <span className="flex items-center gap-1" title={new Date(note.createdAt).toLocaleString()}>
                            <Clock size={12} />
                            {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {/* 来源应用图标 */}
                    <Badge variant="outline" className="text-[10px] h-5 border-gray-100 text-gray-400 font-normal">
                        {note.sourceApp}
                    </Badge>
                </div>
            </div>

            {/* 悬浮操作栏 */}
            <div
                className={cn(
                    "absolute top-2 right-2 flex gap-1 transition-opacity duration-200",
                    isHovered ? "opacity-100" : "opacity-0"
                )}
            >
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={handleCopy} title="复制文本">
                    <Copy size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" title="生成分享卡片">
                    <Share2 size={14} />
                </Button>
            </div>

            {/* 关联书名 (可选显示) */}
            {showBookTitle && (
                <div className="absolute -top-3 left-4">
                    <Badge variant="secondary" className="bg-white shadow-sm border text-[10px] hover:bg-white cursor-pointer group-hover:border-indigo-100 transition-colors">
                        <BookOpen size={10} className="mr-1" />
                        {note.bookTitle}
                    </Badge>
                </div>
            )}

        </Card>
    );
}
