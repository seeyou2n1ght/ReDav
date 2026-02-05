/**
 * 应用主入口
 * 路由配置和全局状态判断
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useConfig } from './hooks/useConfig';
import { Layout } from './components/Layout';
import { WelcomePage } from './pages/WelcomePage';
import { ShelfPage } from './pages/ShelfPage';
import { NotesPage } from './pages/NotesPage';
import { ConfigPage } from './pages/ConfigPage';

function AppRoutes() {
  const { config, isLoading } = useConfig();

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 判断是否已配置（至少启用一个阅读器）
  const hasConfig = config?.readers && Object.values(config.readers).some(r => r?.enabled);

  return (
    <Routes>
      {/* 欢迎页 - 未配置时访问 */}
      <Route
        path="/welcome"
        element={hasConfig ? <Navigate to="/shelf" replace /> : <WelcomePage />}
      />

      {/* 主应用布局 */}
      <Route path="/" element={hasConfig ? <Layout /> : <Navigate to="/welcome" replace />}>
        <Route index element={<Navigate to="/shelf" replace />} />
        <Route path="shelf" element={<ShelfPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="config" element={<ConfigPage />} />
      </Route>

      {/* 404 重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
