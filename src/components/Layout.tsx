/**
 * 主布局组件
 * 左侧导航 + 右侧工作区
 * 移动端采用抽屉模式
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* 移动端遮罩 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 侧边栏 - 移动端抽屉 */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shadow-none lg:border-r
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* 移动端顶部栏 */}
                <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800">ReDav</h1>
                </header>

                {/* 页面内容 */}
                <div className="flex-1 overflow-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
