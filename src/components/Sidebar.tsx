/**
 * 侧边栏组件
 * 包含 Logo 和导航菜单
 */

import { NavLink } from 'react-router-dom';

interface SidebarProps {
    onClose?: () => void;
}

const NAV_ITEMS = [
    { to: '/shelf', icon: '📚', label: '书架' },
    { to: '/notes', icon: '📝', label: '笔记' },
    { to: '/config', icon: '⚙️', label: '配置' },
];

export function Sidebar({ onClose }: SidebarProps) {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ReDav
                </h1>
                <p className="text-xs text-gray-500 mt-1">Your private Readwise</p>
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 p-4 space-y-2">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`
                        }
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* 底部信息 */}
            <div className="p-4 border-t text-xs text-gray-400 text-center">
                Local-First · Privacy-Focused
            </div>
        </div>
    );
}
