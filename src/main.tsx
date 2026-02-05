import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from './contexts/ConfigContext'
import './index.css'
import App from './App.tsx'

// 创建 TanStack Query 客户端实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // 默认重试 3 次
      staleTime: 60000, // 默认 1 分钟内数据视为新鲜
      refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)
