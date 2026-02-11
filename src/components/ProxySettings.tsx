/**
 * 代理设置组件
 * 独立管理全局代理配置，对所有数据源生效
 */

import { useState, useEffect } from 'react';
import { useConfig } from '../hooks/useConfig';
import { Globe, Shield, Info } from 'lucide-react';

// 默认 Proxy URL（指向本地 Cloudflare Pages Function）
const DEFAULT_PROXY_URL = '/api/proxy';

export function ProxySettings() {
    const { config, updateConfig } = useConfig();

    const [proxyUrl, setProxyUrl] = useState(DEFAULT_PROXY_URL);
    const [proxyToken, setProxyToken] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // 从全局 config 同步状态
    useEffect(() => {
        if (config) {
            setProxyUrl(config.proxy?.url || DEFAULT_PROXY_URL);
            setProxyToken(config.proxy?.token || '');
        }
    }, [config]);

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        setSaved(false);

        try {
            await updateConfig({
                ...config,
                proxy: {
                    url: proxyUrl.trim() || DEFAULT_PROXY_URL,
                    token: proxyToken.trim() || undefined,
                },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('保存代理配置失败:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6 sm:p-8 border dark:border-border space-y-6">
            {/* 说明卡片 */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <Info className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">为什么需要代理？</p>
                    <p>浏览器出于安全限制无法直接访问 WebDAV 服务器（CORS 策略）。代理服务器充当中间人，转发你的请求。</p>
                    <p>默认的 <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">/api/proxy</code> 使用本项目内置的 Cloudflare Pages Function，无需额外配置。</p>
                </div>
            </div>

            {/* Proxy URL */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    代理地址
                </label>
                <input
                    type="text"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    placeholder={DEFAULT_PROXY_URL}
                    className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-background text-foreground transition-shadow"
                />
                <p className="text-xs text-muted-foreground">
                    如使用自建代理，请填写完整 URL（如 <code className="bg-muted px-1 rounded font-mono">https://your-proxy.example.com/api/proxy</code>）
                </p>
            </div>

            {/* Proxy Token */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    代理令牌 <span className="text-muted-foreground font-normal">(可选)</span>
                </label>
                <input
                    type="password"
                    value={proxyToken}
                    onChange={(e) => setProxyToken(e.target.value)}
                    placeholder="仅自建代理需要"
                    className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-background text-foreground transition-shadow"
                />
                <p className="text-xs text-muted-foreground">
                    如果你的代理服务器需要鉴权令牌，在此填写。使用默认代理时可留空。
                </p>
            </div>

            {/* 保存按钮 */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                    🔒 此配置对所有数据源全局生效
                </p>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {isSaving ? '保存中...' : saved ? '✅ 已保存' : '保存代理配置'}
                </button>
            </div>
        </div>
    );
}
