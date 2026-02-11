import { useState, useEffect } from 'react';

/**
 * 延迟更新值的 Hook
 * 用于搜索输入等场景，减少高频重计算
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
