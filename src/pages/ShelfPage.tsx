/**
 * 书架页
 * 展示书籍列表，使用 shadcn/ui 组件
 * 适配 Dark Mode，筛选栏只显示已有数据的阅读器
 */

import { useState, useMemo } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
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
import { BookCover } from '@/components/ui/cover-generator';
import { LayoutGrid, List, CheckSquare, Download, X } from 'lucide-react';

export function ShelfPage() {
    const navigate = useNavigate();
    const { books, isLoading, errors, refresh } = useLibrary();
    const { openModal } = useExportStore();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebouncedValue(searchQuery, 250);
    const [activeFilter, setActiveFilter] = useState<'all' | ReaderType>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Selection Mode State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

    // 只显示有数据的阅读器类型，避免展示未完成的适配器
    const activeReaderTypes = useMemo(() => {
        const types = new Set<string>();
        books.forEach(book => {
            book.sourceApps.forEach(app => types.add(app));
        });
        // 映射 sourceApp 名称回 ReaderType
        return (Object.entries(READER_DEFAULTS) as [ReaderType, typeof READER_DEFAULTS[ReaderType]][])
            .filter(([, meta]) => types.has(meta.name) || types.has(meta.name.split(' ')[0]));
    }, [books]);

    // 过滤书籍（使用 debounced 搜索词减少重计算）
    const filteredBooks = useMemo(() => books.filter(book => {
        const q = debouncedSearch.toLowerCase();
        const matchesSearch = !q || book.title.toLowerCase().includes(q) ||
            book.author?.toLowerCase().includes(q);
        const matchesFilter = activeFilter === 'all' ||
            book.sourceApps.some(app => app.toLowerCase().includes(activeFilter.toLowerCase()) ||
                (activeFilter === 'anxReader' && app === 'AnxReader') ||
                (activeFilter === 'moonReader' && app === 'MoonReader'));

        return matchesSearch && matchesFilter;
    }), [books, debouncedSearch, activeFilter]);

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedBookIds(new Set());
    };

    const toggleBookSelection = (book: UnifiedBook) => {
        const newSelected = new Set(selectedBookIds);
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
                cover: undefined,
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">书架</h1>
                    <p className="text-muted-foreground mt-1">
                        共 {books.length} 本书，{filteredBooks.length} 结果
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Selection Actions */}
                    {isSelectionMode ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-md">
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

                    <div className="bg-gray-100 dark:bg-muted p-1 rounded-lg flex items-center gap-1 mx-2">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            className={cn("h-7 w-7", viewMode === 'grid' && "bg-white dark:bg-card text-foreground shadow-sm hover:bg-white/90 dark:hover:bg-card/90")}
                            onClick={() => setViewMode('grid')}
                            title="网格视图"
                        >
                            <LayoutGrid size={14} />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            className={cn("h-7 w-7", viewMode === 'list' && "bg-white dark:bg-card text-foreground shadow-sm hover:bg-white/90 dark:hover:bg-card/90")}
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
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-card p-4 rounded-xl shadow-sm border dark:border-border transition-colors">
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
                    {activeReaderTypes.map(([type, meta]) => (
                        <Button
                            key={type}
                            variant={activeFilter === type ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter(type)}
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
                <div className="text-center py-20 text-muted-foreground bg-gray-50 dark:bg-muted/30 rounded-xl border border-dashed dark:border-border">
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
                                "flex items-center gap-4 p-4 bg-white dark:bg-card rounded-lg border dark:border-border hover:shadow-md transition-all cursor-pointer group select-none",
                                selectedBookIds.has(book.title) && "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
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
                                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-muted"
                                )}>
                                    {selectedBookIds.has(book.title) && <CheckSquare size={14} />}
                                </div>
                            )}

                            {/* 列表视图复用 BookCover 组件 */}
                            <div className="h-16 w-12 flex-shrink-0">
                                <BookCover title={book.title} author={book.author} className="h-full w-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{book.title}</h3>
                                <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="hidden sm:flex items-center gap-1">
                                    <span className="text-xs bg-gray-100 dark:bg-muted px-2 py-1 rounded-full">{book.noteCount} 笔记</span>
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
