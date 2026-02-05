/**
 * 配置管理 Context
 * 提供全局配置状态和更新方法
 */

import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { AppConfig } from '../types';
import { loadConfig, saveConfig, clearConfig } from '../utils/config-storage';

/**
 * Context 值类型定义
 */
export interface ConfigContextValue {
  /** 当前配置，未配置时为 null */
  config: AppConfig | null;
  /** 是否正在加载配置 */
  isLoading: boolean;
  /** 加载或操作过程中的错误 */
  error: Error | null;
  /** 更新配置（同步到状态和 IndexedDB） */
  updateConfig: (config: AppConfig) => Promise<void>;
  /** 清除配置 */
  clearConfig: () => Promise<void>;
}

/**
 * ConfigContext 实例
 */
export const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

/**
 * ConfigProvider Props
 */
interface ConfigProviderProps {
  children: ReactNode;
}

/**
 * 配置管理 Provider 组件
 * 
 * 职责：
 * 1. 组件挂载时从 IndexedDB 自动加载配置
 * 2. 提供配置更新方法（同步到状态 + IndexedDB）
 * 3. 错误状态管理
 */
export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 组件挂载时加载配置
  useEffect(() => {
    async function initConfig() {
      try {
        setIsLoading(true);
        setError(null);
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('加载配置失败'));
      } finally {
        setIsLoading(false);
      }
    }

    initConfig();
  }, []);

  // 更新配置
  const handleUpdateConfig = async (newConfig: AppConfig) => {
    try {
      setError(null);
      await saveConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('保存配置失败');
      setError(error);
      throw error; // 向上抛出，让 UI 组件处理
    }
  };

  // 清除配置
  const handleClearConfig = async () => {
    try {
      setError(null);
      await clearConfig();
      setConfig(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('清除配置失败');
      setError(error);
      throw error;
    }
  };

  const value: ConfigContextValue = {
    config,
    isLoading,
    error,
    updateConfig: handleUpdateConfig,
    clearConfig: handleClearConfig,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}
