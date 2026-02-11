/**
 * 笔记页
 * 左侧书籍侧边栏 + 右侧笔记流
 * 支持"全部笔记"、移动端书籍选择器、Dark Mode
 */

import { useState, useMemo } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useSearchParams } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { useExportStore } from '../hooks/useExportStore';
import { type UnifiedBook, type UnifiedNote } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteCard } from '@/components/NoteCard';
import { CheckSquare, Download, X, BookOpen } from 'lucide-react';

export function NotesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { books, notes, isLoading, refresh } = useLibrary();
    const { openModal } = useExportStore();

    // 从 URL 获取当前选中的书名，null 表示"全部"
    const selectedBookTitle = searchParams.get('book');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebouncedValue(searchQuery, 250);

    // Selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

    // 过滤笔记：未选书时显示全部笔记
    const filteredNotes = useMemo(() => {
        if (!selectedBookTitle) return notes;
        return notes.filter(n => n.bookTitle === selectedBookTitle);
    }, [selectedBookTitle, notes]);

    // 用 debounced 搜索词过滤
    const displayedNotes = useMemo(() => {
        const q = debouncedSearch.toLowerCase();
        return filteredNotes.filter(note =>
            !q ||
            note.highlight?.toLowerCase().includes(q) ||
            note.note?.toLowerCase().includes(q)
        );
    }, [filteredNotes, debouncedSearch]);

    // 当前选中的书对象
    const currentBook = books.find(b => b.title === selectedBookTitle);

    // Helper: 获取笔记唯一 ID
    const getNoteId = (note: UnifiedNote) =>
        note.id || `${note.bookTitle}-${note.createdAt}-${note.highlight?.slice(0, 10)}`;

    // Handlers
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedNoteIds(new Set());
    };

    const toggleNoteSelection = (note: UnifiedNote) => {
        const newSelected = new Set(selectedNoteIds);
        const id = getNoteId(note);

        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedNoteIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedNoteIds.size === displayedNotes.length) {
            setSelectedNoteIds(new Set());
        } else {
            const allIds = new Set(displayedNotes.map(n => getNoteId(n)));
            setSelectedNoteIds(allIds);
        }
    };

    const handleExport = () => {
        const selectedNotes = displayedNotes.filter(n => selectedNoteIds.has(getNoteId(n)));
        if (selectedNotes.length === 0) return;

        openModal({
            source: 'notes',
            items: selectedNotes.map(n => ({
                id: n.id || `${n.bookTitle}-${n.createdAt}`,
                title: n.bookTitle,
                author: currentBook?.author,
                cover: undefined,
                chapterTitle: n.chapter,
                selection: n.highlight,
                note: n.note,
                date: new Date(n.createdAt).toISOString(),
                originalContent: `${n.highlight}\n\n${n.note || ''}`
            }))
        });

        setIsSelectionMode(false);
        setSelectedNoteIds(new Set());
    };

    // 选择书籍的处理
    const handleSelectBook = (title: string) => {
        if (title === '__all__') {
            setSearchParams({});
        } else {
            setSearchParams({ book: title });
        }
    };

    // 页面标题和计数信息
    const pageTitle = selectedBookTitle
        ? (currentBook?.title || selectedBookTitle)
        : '全部笔记';
    const pageSubtitle = selectedBookTitle
        ? `${currentBook?.author ? `${currentBook.author} · ` : ''}${filteredNotes.length} 条笔记`
        : `共 ${filteredNotes.length} 条笔记`;

    return (
        <div className="flex h-full bg-gray-50 dark:bg-background overflow-hidden transition-colors">
            {/* 左侧边栏：图书列表 (桌面端) */}
            <div className="hidden md:block w-72 border-r dark:border-border bg-white dark:bg-card flex-shrink-0 transition-colors">
                <BookSidebar
                    books={books}
                    onSelect={handleSelectBook}
                    selectedTitle={selectedBookTitle}
                />
            </div>

            {/* 右侧：笔记流 */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* 顶部 Header */}
                <header className="bg-white dark:bg-card border-b dark:border-border px-6 py-4 flex justify-between items-center shadow-sm z-10 flex-shrink-0 transition-colors">
                    <div className="flex-1 min-w-0 mr-4">
                        <h1 className="text-xl font-bold text-foreground line-clamp-1" title={pageTitle}>
                            {pageTitle}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {pageSubtitle}
                            </span>
                            {currentBook && (
                                <div className="flex gap-1 overflow-hidden">
                                    {currentBook.sourceApps.map(app => (
                                        <Badge key={app} variant="secondary" className="text-[10px] px-1 h-4 whitespace-nowrap">
                                            {app}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 items-center">
                        {/* 移动端：书籍选择下拉 */}
                        <div className="md:hidden">
                            <Select
                                value={selectedBookTitle || '__all__'}
                                onValueChange={handleSelectBook}
                            >
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="选择书籍" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">
                                        <span className="flex items-center gap-1">
                                            <BookOpen size={12} />
                                            全部笔记
                                        </span>
                                    </SelectItem>
                                    {books.map(book => (
                                        <SelectItem key={book.title} value={book.title}>
                                            <span className="truncate">{book.title}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selection Controls */}
                        {isSelectionMode ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 mr-2">
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-md">
                                    {selectedNoteIds.size} / {displayedNotes.length}
                                </span>
                                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                    {selectedNoteIds.size === displayedNotes.length ? "全不选" : "全选"}
                                </Button>
                                <Button variant="default" size="sm" onClick={handleExport} disabled={selectedNoteIds.size === 0} className="bg-indigo-600 hover:bg-indigo-700">
                                    <Download className="w-4 h-4 mr-1" />
                                    导出
                                </Button>
                                <Button variant="ghost" size="sm" onClick={toggleSelectionMode}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={toggleSelectionMode} className="gap-1 mr-2" disabled={displayedNotes.length === 0}>
                                <CheckSquare className="w-4 h-4" />
                                批量
                            </Button>
                        )}

                        {!isSelectionMode && (
                            <Input
                                placeholder="搜索笔记..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-32 md:w-48 h-8 text-sm transition-all focus:w-64"
                            />
                        )}

                        <Button variant="ghost" size="sm" onClick={() => refresh()}>
                            ↻
                        </Button>
                    </div>
                </header>

                {/* 笔记列表 ScrollArea */}
                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        <div className="p-6 max-w-3xl mx-auto space-y-6 pb-20">
                            {isLoading && filteredNotes.length === 0 ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-32 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-40 w-full" />
                                </div>
                            ) : displayedNotes.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <p className="text-6xl mb-4">{selectedBookTitle ? '📝' : '👈'}</p>
                                    <p className="text-xl">
                                        {searchQuery
                                            ? "没有找到匹配的笔记"
                                            : selectedBookTitle
                                                ? "暂无笔记"
                                                : notes.length === 0
                                                    ? "请先在书架页同步笔记"
                                                    : "请在左侧选择一本书或查看全部"}
                                    </p>
                                </div>
                            ) : (
                                displayedNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        showBookTitle={!selectedBookTitle}
                                        selectionMode={isSelectionMode}
                                        isSelected={selectedNoteIds.has(getNoteId(note))}
                                        onToggleSelect={toggleNoteSelection}
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}

function BookSidebar({ books, onSelect, selectedTitle }: { books: UnifiedBook[], onSelect: (t: string) => void, selectedTitle: string | null }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b dark:border-border">
                <h2 className="font-semibold text-foreground">图书列表</h2>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {/* "全部笔记" 入口 */}
                    <button
                        onClick={() => onSelect('__all__')}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedTitle === null
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-medium'
                            : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={14} />
                            <span>全部笔记</span>
                        </div>
                    </button>

                    {/* 分割线 */}
                    <div className="border-t dark:border-border mx-2 my-2" />

                    {books.map(book => (
                        <button
                            key={book.title}
                            onClick={() => onSelect(book.title)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedTitle === book.title
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-medium'
                                : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted'
                                }`}
                        >
                            <div className="line-clamp-1">{book.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex justify-between">
                                <span>{book.noteCount} 笔记</span>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
