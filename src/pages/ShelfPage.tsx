/**
 * 书架页
 * 展示书籍列表
 */

import { useState } from 'react';
import { READER_DEFAULTS, type ReaderType } from '../types';
import { useConfig } from '../hooks/useConfig';

// 筛选选项
type FilterType = 'all' | ReaderType;

export function ShelfPage() {
    const { config } = useConfig();
    const [filter, setFilter] = useState<FilterType>('all');

    // 获取已启用的阅读器
    const enabledReaders = config?.readers
        ? Object.entries(config.readers).filter(([, cfg]) => cfg?.enabled)
        : [];

    // 筛选选项
    const filterOptions: { value: FilterType; label: string; icon: string }[] = [
        { value: 'all', label: '全部', icon: '📚' },
        ...enabledReaders.map(([type]) => ({
            value: type as ReaderType,
            label: READER_DEFAULTS[type as ReaderType].name,
            icon: READER_DEFAULTS[type as ReaderType].icon,
        })),
    ];

    return (
        <div className="p-6">
            {/* 页面标题 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">书架</h1>
                <p className="text-gray-500 mt-1">你的阅读笔记库</p>
            </div>

            {/* 筛选栏 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {filterOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setFilter(option.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${filter === option.value
                                ? 'bg-indigo-100 text-indigo-700 font-medium'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                    </button>
                ))}
            </div>

            {/* 书籍列表（占位） */}
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                <p className="text-4xl mb-4">📚</p>
                <p className="text-lg font-medium mb-2">暂无书籍</p>
                <p className="text-sm">完成配置后，书籍将在这里显示</p>
            </div>
        </div>
    );
}
