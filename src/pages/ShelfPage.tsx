/**
 * 书架页
 * 展示书籍列表，使用 shadcn/ui 组件
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { READER_DEFAULTS, type ReaderType, type UnifiedBook } from '../types';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function ShelfPage() {
    const navigate = useNavigate();
    const { books, isLoading, errors, refresh } = useLibrary();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | ReaderType>('all');

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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* 顶部栏 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">书架</h1>
                    <p className="text-muted-foreground mt-1">
                        共 {books.length} 本书，{filteredBooks.length} 结果
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refresh()}>
                        ↻ 刷新
                    </Button>
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

            {/* 书籍网格 */}
            {filteredBooks.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                    <p className="text-5xl mb-4">📚</p>
                    <p className="text-xl font-medium">没有找到相关书籍</p>
                    <p className="mt-2">请检查你的搜索条件或前往配置页检查数据源</p>
                    <Button className="mt-6" variant="outline" onClick={() => navigate('/config')}>
                        前往配置
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredBooks.map((book) => (
                        <BookCard key={book.title} book={book} onClick={() => navigate(`/notes?book=${encodeURIComponent(book.title)}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BookCard({ book, onClick }: { book: UnifiedBook; onClick: () => void }) {
    return (
        <Card
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-transparent hover:border-gray-200 bg-white"
            onClick={onClick}
        >
            <div className="aspect-[2/3] bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
                {/* 封面占位 - 后续可做成真实封面 */}
                <div className="text-center transform group-hover:scale-105 transition-transform duration-500">
                    <h3 className="font-bold text-gray-800 line-clamp-3 leading-tight mb-2">
                        {book.title}
                    </h3>
                    {book.author && (
                        <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
                    )}
                </div>

                {/* 来源标记 */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {book.sourceApps.map(app => (
                        <Badge key={app} variant="secondary" className="text-[10px] px-1 h-5 bg-white/80 backdrop-blur-sm">
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
