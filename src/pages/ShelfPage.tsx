/**
 * 书架页
 * 展示书籍列表，使用 shadcn/ui 组件
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLibrary } from '../hooks/useLibrary';
import { useExportStore } from '../hooks/useExportStore';
import { READER_DEFAULTS, type ReaderType, type UnifiedBook } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookCard } from '@/components/BookCard';
import { LayoutGrid, List, CheckSquare, Download, X } from 'lucide-react';

export function ShelfPage() {
    const navigate = useNavigate();
    const { books, isLoading, errors, refresh } = useLibrary();
    const { openModal } = useExportStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | ReaderType>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Selection Mode State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

    // 过滤书籍
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' ||
            book.sourceApps.some(app => app.toLowerCase().includes(activeFilter.toLowerCase()) ||
                (activeFilter === 'anxReader' && app === 'AnxReader') ||
                (activeFilter === 'moonReader' && app === 'MoonReader'));

        return matchesSearch && matchesFilter;
    });

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedBookIds(new Set()); // Clear selection on toggle
    };

    const toggleBookSelection = (book: UnifiedBook) => {
        const newSelected = new Set(selectedBookIds);
        // We use title as ID for now since UnifiedBook might not have a unique stable ID across syncs, 
        // but typically 'id' or 'isbn' is better. Using title for MVP as per existing code patterns.
        // Wait, UnifiedBook interface usually has an ID? Let's assume title is unique enough for now or use implicit index.
        const id = book.title;

        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedBookIds(newSelected);
    };

    const handleExport = () => {
        const selectedBooks = books.filter(b => selectedBookIds.has(b.title));
        if (selectedBooks.length === 0) return;

        openModal({
            source: 'shelf',
            items: selectedBooks.map(b => ({
                id: b.title,
                title: b.title,
                author: b.author,
                cover: undefined, // Could pass cover URL if available
                date: b.lastReading ? new Date(b.lastReading).toISOString() : undefined,
                note: `Books from ${b.sourceApps.join(', ')}`,
                originalContent: `Exported from ReDav Shelf`
            }))
        });
        setIsSelectionMode(false);
        setSelectedBookIds(new Set());
    };

    // 渲染加载骨架屏
    if (isLoading && books.length === 0) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            {/* 顶部栏 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">书架</h1>
                    <p className="text-muted-foreground mt-1">
                        共 {books.length} 本书，{filteredBooks.length} 结果
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Selection Actions */}
                    {isSelectionMode ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md">
                                已选 {selectedBookIds.size} 本
                            </span>
                            <Button variant="default" size="sm" onClick={handleExport} disabled={selectedBookIds.size === 0} className="bg-indigo-600 hover:bg-indigo-700">
                                <Download className="w-4 h-4 mr-1" />
                                导出
                            </Button>
                            <Button variant="ghost" size="sm" onClick={toggleSelectionMode}>
                                <X className="w-4 h-4 mr-1" />
                                取消
                            </Button>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" onClick={toggleSelectionMode} className="gap-1">
                            <CheckSquare className="w-4 h-4" />
                            批量操作
                        </Button>
                    )}

                    <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1 mx-2">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            className={cn("h-7 w-7", viewMode === 'grid' && "bg-white text-black shadow-sm hover:bg-white/90")}
                            onClick={() => setViewMode('grid')}
                            title="网格视图"
                        >
                            <LayoutGrid size={14} />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            className={cn("h-7 w-7", viewMode === 'list' && "bg-white text-black shadow-sm hover:bg-white/90")}
                            onClick={() => setViewMode('list')}
                            title="列表视图"
                        >
                            <List size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 错误提示 */}
            {errors.length > 0 && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center justify-between">
                    <span>⚠️ {errors.length} 个错误发生 (可能是网络问题或解析失败)</span>
                    <Button variant="ghost" size="sm" onClick={() => refresh()} className="text-destructive hover:bg-destructive/20">重试</Button>
                </div>
            )}

            {/* 筛选与搜索 */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border">
                <Input
                    placeholder="搜索书名或作者..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                    <Button
                        variant={activeFilter === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveFilter('all')}
                    >
                        全部
                    </Button>
                    {Object.entries(READER_DEFAULTS).map(([type, meta]) => (
                        <Button
                            key={type}
                            variant={activeFilter === type ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter(type as ReaderType)}
                            className="flex items-center gap-1"
                        >
                            <span>{meta.icon}</span>
                            <span>{meta.name}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* 书籍列表/网格 */}
            {filteredBooks.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                    <p className="text-5xl mb-4">📚</p>
                    <p className="text-xl font-medium">没有找到相关书籍</p>
                    <p className="mt-2">请检查你的搜索条件或前往配置页检查数据源</p>
                    <Button className="mt-6" variant="outline" onClick={() => navigate('/config')}>
                        前往配置
                    </Button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredBooks.map((book) => (
                        <BookCard
                            key={book.title}
                            book={book}
                            onClick={() => navigate(`/notes?book=${encodeURIComponent(book.title)}`)}
                            selectionMode={isSelectionMode}
                            isSelected={selectedBookIds.has(book.title)}
                            onToggleSelect={toggleBookSelection}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredBooks.map((book) => (
                        <div
                            key={book.title}
                            className={cn(
                                "flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer group select-none",
                                selectedBookIds.has(book.title) && "border-indigo-500 bg-indigo-50/50"
                            )}
                            onClick={() => {
                                if (isSelectionMode) {
                                    toggleBookSelection(book);
                                } else {
                                    navigate(`/notes?book=${encodeURIComponent(book.title)}`)
                                }
                            }}
                        >
                            {/* List View Selection Checkbox */}
                            {isSelectionMode && (
                                <div className={cn(
                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                    selectedBookIds.has(book.title)
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-gray-300 bg-white"
                                )}>
                                    {selectedBookIds.has(book.title) && <CheckSquare size={14} />}
                                </div>
                            )}

                            <div className="h-16 w-12 flex-shrink-0">
                                {/* We reuse BookCover but maybe not Full BookCard for list view to keep it compact */}
                                <div className="h-full w-full rounded shadow-sm overflow-hidden relative">
                                    {/* Simple cover placeholder or BookCover component if it supports small size well */}
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[8px] text-center p-1 leading-tight text-gray-500">
                                        {book.title.slice(0, 2)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                                <p className="text-sm text-gray-500 truncate">{book.author}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="hidden sm:flex items-center gap-1">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{book.noteCount} 笔记</span>
                                </div>
                                <div className="flex gap-1">
                                    {book.sourceApps.map(app => (
                                        <Badge key={app} variant="secondary" className="text-[10px] h-5 font-normal">
                                            {app}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="hidden md:block w-24 text-right text-xs">
                                    {book.lastReading ? new Date(book.lastReading).toLocaleDateString() : '-'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
