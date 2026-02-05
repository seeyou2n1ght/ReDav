/**
 * 配置表单组件
 * 用于设置 WebDAV 和 Proxy 配置
 */

import { useState } from 'react';
import { useConfig } from '../hooks/useConfig';
import type { AppConfig } from '../types';

// 默认 Proxy URL（官方代理）
const DEFAULT_PROXY_URL = '/proxy';

export function ConfigForm() {
    const { updateConfig } = useConfig();

    // 表单状态
    const [webdavUrl, setWebdavUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [proxyUrl, setProxyUrl] = useState(DEFAULT_PROXY_URL);
    const [proxyToken, setProxyToken] = useState('');

    // UI 状态
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证必填字段
        if (!webdavUrl || !username || !password) {
            setError('请填写所有必填字段');
            return;
        }

        // 验证 URL 格式
        try {
            new URL(webdavUrl);
        } catch {
            setError('WebDAV URL 格式不正确');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const config: AppConfig = {
                webdav: {
                    url: webdavUrl.trim(),
                    username: username.trim(),
                    password: password,
                },
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">ReDav 配置</h1>
                        <p className="text-gray-600">连接你的 WebDAV 存储</p>
                    </div>

                    {/* 表单 */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* WebDAV 配置区 */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-700">WebDAV 设置</h2>

                            {/* WebDAV URL */}
                            <div>
                                <label htmlFor="webdav-url" className="block text-sm font-medium text-gray-700 mb-1">
                                    WebDAV 地址 *
                                </label>
                                <input
                                    id="webdav-url"
                                    type="url"
                                    value={webdavUrl}
                                    onChange={(e) => setWebdavUrl(e.target.value)}
                                    placeholder="https://dav.example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            {/* 用户名 */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    用户名 *
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="your-username"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            {/* 密码 */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    密码 *
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Proxy 配置区（可选） */}
                        <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                                高级设置（Proxy）
                            </summary>
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                                <div>
                                    <label htmlFor="proxy-url" className="block text-sm font-medium text-gray-700 mb-1">
                                        Proxy URL
                                    </label>
                                    <input
                                        id="proxy-url"
                                        type="text"
                                        value={proxyUrl}
                                        onChange={(e) => setProxyUrl(e.target.value)}
                                        placeholder={DEFAULT_PROXY_URL}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">默认使用官方代理</p>
                                </div>

                                <div>
                                    <label htmlFor="proxy-token" className="block text-sm font-medium text-gray-700 mb-1">
                                        Proxy Token（可选）
                                    </label>
                                    <input
                                        id="proxy-token"
                                        type="password"
                                        value={proxyToken}
                                        onChange={(e) => setProxyToken(e.target.value)}
                                        placeholder="仅自建代理需要"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </details>

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">❌ {error}</p>
                            </div>
                        )}

                        {/* 成功提示 */}
                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-600">✅ 配置保存成功！</p>
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? '保存中...' : '保存配置'}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-gray-500">
                        配置将安全地存储在浏览器本地
                    </p>
                </div>
            </div>
        </div>
    );
}
