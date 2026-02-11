/**
 * 笔记页
 * 双栏布局：左侧图书列表/章节目录，右侧笔记流
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { type UnifiedBook } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteCard } from '@/components/NoteCard';

export function NotesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { books, notes, isLoading, refresh } = useLibrary();

    // 从 URL 获取当前选中的书名
    const selectedBookTitle = searchParams.get('book');
    const [searchQuery, setSearchQuery] = useState('');

    // 过滤笔记
    const filteredNotes = useMemo(() => {
        if (!selectedBookTitle) return [];
        return notes.filter(n => n.bookTitle === selectedBookTitle);
    }, [selectedBookTitle, notes]);

    // 当前选中的书对象
    const currentBook = books.find(b => b.title === selectedBookTitle);

    // 未选中书籍时显示引导
    if (!selectedBookTitle) {
        return (
            <div className="flex bg-gray-50 h-full">
                <BookSidebar books={books} onSelect={(title) => setSearchParams({ book: title })} selectedTitle={null} />
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <p className="text-6xl mb-4">👈</p>
                        <p className="text-xl">请在左侧选择一本书</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* 左侧边栏：图书列表（或章节目录，暂未实现章节树，先显示图书列表以便切换） */}
            <div className="hidden md:block w-72 border-r bg-white flex-shrink-0">
                <BookSidebar
                    books={books}
                    onSelect={(title) => setSearchParams({ book: title })}
                    selectedTitle={selectedBookTitle}
                />
            </div>

            {/* 右侧：笔记流 */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* 顶部 Header */}
                <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 line-clamp-1" title={currentBook?.title}>
                            {currentBook?.title || selectedBookTitle}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                                {currentBook?.author ? `${currentBook.author} · ` : ''}
                                {filteredNotes.length} 条笔记
                            </span>
                            {currentBook?.sourceApps.map(app => (
                                <Badge key={app} variant="secondary" className="text-[10px] px-1 h-4">
                                    {app}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="搜索笔记..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-48 h-8 text-sm"
                        />
                        <Button variant="ghost" size="sm" onClick={() => refresh()}>
                            ↻
                        </Button>
                    </div>
                </header>

                {/* 笔记列表 ScrollArea */}
                <ScrollArea className="flex-1 p-6">
                    <div className="max-w-3xl mx-auto space-y-6 pb-20">
                        {isLoading && filteredNotes.length === 0 ? (
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <p>暂无笔记</p>
                            </div>
                        ) : (
                            filteredNotes
                                .filter(note => !searchQuery || note.highlight?.includes(searchQuery) || note.note?.includes(searchQuery))
                                .map((note) => (
                                    <NoteCard key={note.id} note={note} showBookTitle={!selectedBookTitle} />
                                ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

function BookSidebar({ books, onSelect, selectedTitle }: { books: UnifiedBook[], onSelect: (t: string) => void, selectedTitle: string | null }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-700">图书列表</h2>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {books.map(book => (
                        <button
                            key={book.title}
                            onClick={() => onSelect(book.title)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedTitle === book.title
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <div className="line-clamp-1">{book.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5 flex justify-between">
                                <span>{book.noteCount} 笔记</span>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}


