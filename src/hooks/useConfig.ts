/**
 * useConfig Hook
 * 简化 ConfigContext 的使用
 */

import { useContext } from 'react';
import { ConfigContext, type ConfigContextValue } from '../contexts/ConfigContextDefinition';

/**
 * 获取配置 Context
 * @throws 如果在 ConfigProvider 外部调用则抛出错误
 */
export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);

  if (context === undefined) {
    throw new Error('useConfig 必须在 ConfigProvider 内部使用');
  }

  return context;
}
