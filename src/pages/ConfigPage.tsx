/**
 * 配置页
 * 三级 Tab 菜单：数据源 | 代理设置 | 导出模板
 * 视觉上统一使用相同的卡片+Tab 风格
 */

import { useState } from 'react';
import { ConfigForm } from '../components/ConfigForm';
import { ProxySettings } from '../components/ProxySettings';
import { TemplateManager } from '../components/Export/TemplateManager';
import { Server, Globe, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConfigTab = 'webdav' | 'proxy' | 'templates';

const TABS: { key: ConfigTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
        key: 'webdav',
        label: '数据源',
        icon: <Server size={18} />,
        desc: '配置 WebDAV 连接和阅读器',
    },
    {
        key: 'proxy',
        label: '代理',
        icon: <Globe size={18} />,
        desc: '全局代理设置，对所有数据源生效',
    },
    {
        key: 'templates',
        label: '导出模板',
        icon: <LayoutTemplate size={18} />,
        desc: '管理个性化导出模板',
    },
];

export function ConfigPage() {
    const [activeTab, setActiveTab] = useState<ConfigTab>('webdav');

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6 pb-24 bg-background transition-colors">
            {/* 页面标题 */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">设置</h1>
                <p className="text-muted-foreground mt-1">管理你的数据源、代理和导出偏好</p>
            </div>

            {/* 二级 Tab 导航 */}
            <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                            activeTab === tab.key
                                ? "bg-white dark:bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-card/50"
                        )}
                    >
                        <span className={cn(
                            "transition-colors",
                            activeTab === tab.key ? "text-indigo-600 dark:text-indigo-400" : ""
                        )}>
                            {tab.icon}
                        </span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab 描述 */}
            <p className="text-xs text-muted-foreground text-center -mt-2">
                {TABS.find(t => t.key === activeTab)?.desc}
            </p>

            {/* Tab 内容区 - 带过渡动画 */}
            <div className="relative">
                {/* 数据源配置 */}
                <div
                    className={cn(
                        "transition-all duration-300 ease-out",
                        activeTab === 'webdav'
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
                    )}
                >
                    {activeTab === 'webdav' && <ConfigForm />}
                </div>

                {/* 代理设置 */}
                <div
                    className={cn(
                        "transition-all duration-300 ease-out",
                        activeTab === 'proxy'
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
                    )}
                >
                    {activeTab === 'proxy' && <ProxySettings />}
                </div>

                {/* 导出模板管理 */}
                <div
                    className={cn(
                        "transition-all duration-300 ease-out",
                        activeTab === 'templates'
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
                    )}
                >
                    {activeTab === 'templates' && <TemplateManager />}
                </div>
            </div>
        </div>
    );
}
