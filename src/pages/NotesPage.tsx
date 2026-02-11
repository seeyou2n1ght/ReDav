import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { useExportStore } from '../hooks/useExportStore';
import { type UnifiedBook, type UnifiedNote } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { NoteCard } from '@/components/NoteCard';
import { CheckSquare, Download, X, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep imports clean

export function NotesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { books, notes, isLoading, refresh } = useLibrary();
    const { openModal } = useExportStore();

    // 从 URL 获取当前选中的书名
    const selectedBookTitle = searchParams.get('book');
    const [searchQuery, setSearchQuery] = useState('');

    // Selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

    // 过滤笔记
    const filteredNotes = useMemo(() => {
        if (!selectedBookTitle) return [];
        return notes.filter(n => n.bookTitle === selectedBookTitle);
    }, [selectedBookTitle, notes]);

    // Apply search filter
    const displayedNotes = useMemo(() => {
        return filteredNotes.filter(note =>
            !searchQuery ||
            note.highlight?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.note?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [filteredNotes, searchQuery]);

    // 当前选中的书对象
    const currentBook = books.find(b => b.title === selectedBookTitle);

    // Handlers
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedNoteIds(new Set());
    };

    const toggleNoteSelection = (note: UnifiedNote) => {
        const newSelected = new Set(selectedNoteIds);
        // Assuming Note has a unique ID. If not, we might need a composite key or index. 
        // UnifiedNote usually has 'id' (from DB or hash).
        const id = note.id || `${note.bookTitle}-${note.createdAt}-${note.highlight?.slice(0, 10)}`;

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
            const allIds = new Set(displayedNotes.map(n => n.id || `${n.bookTitle}-${n.createdAt}-${n.highlight?.slice(0, 10)}`));
            setSelectedNoteIds(allIds);
        }
    };

    const handleExport = () => {
        // Find notes ensuring we match IDs correctly
        const selectedNotes = displayedNotes.filter(n => {
            const id = n.id || `${n.bookTitle}-${n.createdAt}-${n.highlight?.slice(0, 10)}`;
            return selectedNoteIds.has(id);
        });

        if (selectedNotes.length === 0) return;

        openModal({
            source: 'notes',
            items: selectedNotes.map(n => ({
                id: n.id || `${n.bookTitle}-${n.createdAt}`,
                title: n.bookTitle, // Use book title as main title for note context
                author: currentBook?.author, // We try to get author from book context
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
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* 顶部 Header - 移除了 sticky，改为 flex 布局的一部分 */}
                <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
                    <div className="flex-1 min-w-0 mr-4">
                        <h1 className="text-xl font-bold text-gray-900 line-clamp-1" title={currentBook?.title}>
                            {currentBook?.title || selectedBookTitle}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                {currentBook?.author ? `${currentBook.author} · ` : ''}
                                {filteredNotes.length} 条笔记
                            </span>
                            <div className="flex gap-1 overflow-hidden">
                                {currentBook?.sourceApps.map(app => (
                                    <Badge key={app} variant="secondary" className="text-[10px] px-1 h-4 whitespace-nowrap">
                                        {app}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 items-center">
                        {/* Selection Controls */}
                        {isSelectionMode ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 mr-2">
                                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md">
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

                {/* 笔记列表 ScrollArea - 占据剩余空间 */}
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
                                <div className="text-center py-20 text-gray-400">
                                    <p>{searchQuery ? "没有找到匹配的笔记" : "暂无笔记"}</p>
                                </div>
                            ) : (
                                displayedNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        showBookTitle={!selectedBookTitle}
                                        selectionMode={isSelectionMode}
                                        isSelected={selectedNoteIds.has(note.id || `${note.bookTitle}-${note.createdAt}-${note.highlight?.slice(0, 10)}`)}
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


