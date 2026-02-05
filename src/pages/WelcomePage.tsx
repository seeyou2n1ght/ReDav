/**
 * 欢迎引导页
 * 首次访问时显示
 */

import { useNavigate } from 'react-router-dom';

export function WelcomePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
            <div className="max-w-lg text-center">
                {/* Logo */}
                <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    ReDav
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Re-read your journey.<br />
                    Your private Readwise on WebDAV.
                </p>

                {/* 特性介绍 */}
                <div className="grid gap-4 mb-10 text-left">
                    <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <span className="text-2xl">🔗</span>
                        <div>
                            <h3 className="font-semibold text-gray-800">连接你的阅读器</h3>
                            <p className="text-sm text-gray-600">支持 AnxReader、MoonReader、KOReader</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <span className="text-2xl">📖</span>
                        <div>
                            <h3 className="font-semibold text-gray-800">浏览你的笔记</h3>
                            <p className="text-sm text-gray-600">高亮、批注统一展示，按书籍和章节整理</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <span className="text-2xl">📤</span>
                        <div>
                            <h3 className="font-semibold text-gray-800">导出你的知识</h3>
                            <p className="text-sm text-gray-600">一键导出 Markdown、JSON 格式</p>
                        </div>
                    </div>
                </div>

                {/* 开始按钮 */}
                <button
                    onClick={() => navigate('/config')}
                    className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                    开始配置 →
                </button>

                {/* 底部说明 */}
                <p className="mt-8 text-sm text-gray-400">
                    🔒 本地优先 · 无需注册 · 数据自主
                </p>
            </div>
        </div>
    );
}
