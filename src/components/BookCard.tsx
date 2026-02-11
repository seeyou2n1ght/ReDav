import { useNavigate } from 'react-router-dom';
import type { UnifiedBook } from '../types';
import { Card, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookCover } from '@/components/ui/cover-generator';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface BookCardProps {
    book: UnifiedBook;
    onClick?: () => void;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (book: UnifiedBook) => void;
}

export function BookCard({ book, onClick, selectionMode, isSelected, onToggleSelect }: BookCardProps) {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
        if (selectionMode && onToggleSelect) {
            e.stopPropagation();
            onToggleSelect(book);
        } else if (onClick) {
            onClick();
        } else {
            navigate(`/notes?book=${encodeURIComponent(book.title)}`);
        }
    };

    return (
        <Card
            className={cn(
                "group relative hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-transparent hover:border-gray-200 bg-white",
                isSelected && "ring-2 ring-indigo-600 border-indigo-200 shadow-md"
            )}
            onClick={handleClick}
        >
            {/* Selection Overlay */}
            {selectionMode && (
                <div className={cn(
                    "absolute top-2 left-2 z-40 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 bg-white shadow-sm",
                    isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 text-transparent hover:border-indigo-400"
                )}>
                    <Check size={14} strokeWidth={3} />
                </div>
            )}

            {/* 动态封面 */}
            <div className={cn(
                "relative aspect-[2/3] transition-all duration-500 ease-out",
                !selectionMode && "group-hover:shadow-xl group-hover:-translate-y-1"
            )}>
                {/* Selection Dimmer */}
                {selectionMode && !isSelected && (
                    <div className="absolute inset-0 bg-white/20 z-30 pointer-events-none" />
                )}

                <BookCover title={book.title} author={book.author} className="w-full h-full" />

                {/* 来源标记 - 悬浮在右上角 */}
                <div className="absolute top-2 right-2 flex gap-1 z-30">
                    {book.sourceApps.map(app => (
                        <Badge key={app} variant="secondary" className="text-[10px] px-1 h-5 bg-white/90 backdrop-blur-sm shadow-sm border border-black/5">
                            {app === 'AnxReader' ? '📚' : app === 'MoonReader' ? '🌙' : '📖'}
                        </Badge>
                    ))}
                </div>
            </div>

            <CardFooter className="p-3 bg-white flex justify-between items-center text-xs text-gray-500 border-t">
                <span className="flex items-center gap-1">
                    📝 {book.noteCount} 笔记
                </span>
                <span>
                    {book.lastReading ? new Date(book.lastReading).toLocaleDateString() : '从未阅读'}
                </span>
            </CardFooter>
        </Card>
    );
}
