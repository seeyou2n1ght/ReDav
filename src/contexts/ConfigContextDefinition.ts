/**
 * Config Context 定义
 * 将 Context 定义与 Provider 实现分离以支持 Fast Refresh
 */

import { createContext } from 'react';
import type { AppConfig } from '../types';

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
