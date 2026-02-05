/**
 * 配置表单组件（重构版）
 * 支持多阅读器独立配置
 */

import { useState } from 'react';
import { useConfig } from '../hooks/useConfig';
import { READER_DEFAULTS, type AppConfig, type ReaderType, type ReaderConfig } from '../types';

// 默认 Proxy URL
const DEFAULT_PROXY_URL = '/proxy';

// 所有支持的阅读器类型
const READER_TYPES: ReaderType[] = ['anxReader', 'moonReader', 'koReader'];

export function ConfigForm() {
    const { updateConfig } = useConfig();

    // 当前选中的阅读器 Tab
    const [activeTab, setActiveTab] = useState<ReaderType>('anxReader');

    // 每个阅读器的配置状态
    const [readersConfig, setReadersConfig] = useState<Partial<Record<ReaderType, ReaderConfig>>>({});

    // Proxy 配置
    const [proxyUrl, setProxyUrl] = useState(DEFAULT_PROXY_URL);
    const [proxyToken, setProxyToken] = useState('');

    // UI 状态
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 获取当前阅读器配置
    const getCurrentReaderConfig = (): ReaderConfig => {
        return readersConfig[activeTab] || {
            enabled: false,
            webdav: { url: '', username: '', password: '' },
            syncPath: READER_DEFAULTS[activeTab].defaultPath,
        };
    };

    // 更新当前阅读器配置
    const updateReaderConfig = (updates: Partial<ReaderConfig>) => {
        const current = getCurrentReaderConfig();
        setReadersConfig(prev => ({
            ...prev,
            [activeTab]: { ...current, ...updates },
        }));
    };

    // 更新 WebDAV 配置
    const updateWebDav = (field: 'url' | 'username' | 'password', value: string) => {
        const current = getCurrentReaderConfig();
        updateReaderConfig({
            webdav: { ...current.webdav, [field]: value },
        });
    };

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 检查是否至少启用了一个阅读器
        const enabledReaders = Object.entries(readersConfig).filter(
            ([, config]) => config?.enabled
        );

        if (enabledReaders.length === 0) {
            setError('请至少启用并配置一个阅读器');
            return;
        }

        // 验证每个启用的阅读器配置
        for (const [readerType, config] of enabledReaders) {
            if (!config?.webdav.url || !config?.webdav.username || !config?.webdav.password) {
                const meta = READER_DEFAULTS[readerType as ReaderType];
                setError(`${meta.name} 的 WebDAV 配置不完整`);
                return;
            }
            try {
                new URL(config.webdav.url);
            } catch {
                const meta = READER_DEFAULTS[readerType as ReaderType];
                setError(`${meta.name} 的 WebDAV URL 格式不正确`);
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const config: AppConfig = {
                readers: readersConfig,
                proxy: {
                    url: proxyUrl.trim() || DEFAULT_PROXY_URL,
                    token: proxyToken.trim() || undefined,
                },
            };

            await updateConfig(config);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存配置失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentConfig = getCurrentReaderConfig();
    const meta = READER_DEFAULTS[activeTab];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">ReDav 配置</h1>
                        <p className="text-gray-600">配置你的阅读器数据源</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 阅读器 Tabs */}
                        <div className="flex border-b border-gray-200">
                            {READER_TYPES.map((type) => {
                                const readerMeta = READER_DEFAULTS[type];
                                const isActive = activeTab === type;
                                const isEnabled = readersConfig[type]?.enabled;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setActiveTab(type)}
                                        className={`flex-1 py-3 text-sm font-medium transition-all ${isActive
                                                ? 'border-b-2 border-indigo-500 text-indigo-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <span className="mr-1">{readerMeta.icon}</span>
                                        <span className="hidden sm:inline">{readerMeta.name}</span>
                                        {isEnabled && <span className="ml-1 text-green-500">✓</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 当前阅读器配置 */}
                        <div className="space-y-4">
                            {/* 启用开关 */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentConfig.enabled}
                                    onChange={(e) => updateReaderConfig({ enabled: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-gray-700">
                                    启用 {meta.icon} {meta.name}
                                </span>
                            </label>

                            {currentConfig.enabled && (
                                <>
                                    {/* WebDAV URL */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            WebDAV 地址 *
                                        </label>
                                        <input
                                            type="url"
                                            value={currentConfig.webdav.url}
                                            onChange={(e) => updateWebDav('url', e.target.value)}
                                            placeholder="https://dav.example.com"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* 用户名 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            用户名 *
                                        </label>
                                        <input
                                            type="text"
                                            value={currentConfig.webdav.username}
                                            onChange={(e) => updateWebDav('username', e.target.value)}
                                            placeholder="your-username"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* 密码 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            密码 *
                                        </label>
                                        <input
                                            type="password"
                                            value={currentConfig.webdav.password}
                                            onChange={(e) => updateWebDav('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* 同步路径 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            同步路径
                                        </label>
                                        <input
                                            type="text"
                                            value={currentConfig.syncPath}
                                            onChange={(e) => updateReaderConfig({ syncPath: e.target.value })}
                                            placeholder={meta.defaultPath}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            默认: {meta.defaultPath}（会拼接到 WebDAV 地址后）
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Proxy 配置（全局） */}
                        <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600">
                                全局代理设置
                            </summary>
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Proxy URL
                                    </label>
                                    <input
                                        type="text"
                                        value={proxyUrl}
                                        onChange={(e) => setProxyUrl(e.target.value)}
                                        placeholder={DEFAULT_PROXY_URL}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Proxy Token
                                    </label>
                                    <input
                                        type="password"
                                        value={proxyToken}
                                        onChange={(e) => setProxyToken(e.target.value)}
                                        placeholder="仅自建代理需要"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </details>

                        {/* 错误/成功提示 */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">❌ {error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-600">✅ 配置保存成功！</p>
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '保存中...' : '保存配置'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-500">
                        配置将安全地存储在浏览器本地
                    </p>
                </div>
            </div>
        </div>
    );
}
