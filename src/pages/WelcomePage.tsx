/**
 * 欢迎引导页
 * 首次访问时显示，带入场动画，适配 Dark Mode
 */

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function WelcomePage() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    // 触发入场动画
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const features = [
        {
            emoji: '🔗',
            title: '连接你的阅读器',
            desc: '支持 AnxReader、MoonReader、KOReader',
        },
        {
            emoji: '📖',
            title: '浏览你的笔记',
            desc: '高亮、批注统一展示，按书籍和章节整理',
        },
        {
            emoji: '📤',
            title: '导出你的知识',
            desc: '一键导出 Markdown、JSON 格式',
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 p-6 transition-colors overflow-hidden">
            {/* 背景装饰粒子 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-72 h-72 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl -top-24 -left-24 animate-pulse" />
                <div className="absolute w-96 h-96 bg-purple-200/30 dark:bg-purple-800/10 rounded-full blur-3xl -bottom-32 -right-32 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute w-48 h-48 bg-pink-200/20 dark:bg-pink-800/10 rounded-full blur-3xl top-1/3 right-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div
                className={`max-w-lg text-center relative z-10 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
            >
                {/* Logo 带呼吸光晕 */}
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30 dark:opacity-20 animate-pulse scale-150" />
                    <h1 className="relative text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        ReDav
                    </h1>
                </div>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                    Re-read your journey.<br />
                    <span className="text-base opacity-80">Your private Readwise on WebDAV.</span>
                </p>

                {/* 特性介绍卡片 - 依次滑入 */}
                <div className="grid gap-4 mb-10 text-left">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={`flex items-start gap-4 p-4 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl shadow-sm border dark:border-border transition-all duration-500 ease-out hover:shadow-md hover:-translate-y-0.5 ${isVisible
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 -translate-x-8'
                                }`}
                            style={{ transitionDelay: `${200 + index * 150}ms` }}
                        >
                            <span className="text-2xl mt-0.5">{feature.emoji}</span>
                            <div>
                                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 开始按钮 - 最后出现 */}
                <div
                    className={`transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                    style={{ transitionDelay: '700ms' }}
                >
                    <button
                        onClick={() => navigate('/config')}
                        className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl
                                   hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1
                                   active:translate-y-0 active:shadow-md
                                   transition-all duration-300"
                    >
                        开始配置 →
                    </button>
                </div>

                {/* 底部说明 */}
                <p
                    className={`mt-8 text-sm text-muted-foreground transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ transitionDelay: '900ms' }}
                >
                    🔒 本地优先 · 无需注册 · 数据自主
                </p>
            </div>
        </div>
    );
}
