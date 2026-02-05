function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="text-center py-8 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h1 className="text-5xl font-bold mb-2">ReDav</h1>
        <p className="text-lg opacity-90">Re-read your journey. Your private Readwise on WebDAV.</p>
      </header>
      
      <main className="flex-1 py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-3xl font-semibold mb-2 text-gray-800">欢迎使用 ReDav</h2>
          <p className="text-gray-600 mb-12">你的阅读笔记聚合工具</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="p-8 bg-gray-50 rounded-xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">📚 多阅读器支持</h3>
              <p className="text-gray-600 leading-relaxed">支持 AnxReader、MoonReader 等主流阅读应用</p>
            </div>
            <div className="p-8 bg-gray-50 rounded-xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">🔒 数据自主</h3>
              <p className="text-gray-600 leading-relaxed">笔记永远在你自己的 WebDAV 中</p>
            </div>
            <div className="p-8 bg-gray-50 rounded-xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">🚀 一键部署</h3>
              <p className="text-gray-600 leading-relaxed">基于 Cloudflare Pages，零服务器维护成本</p>
            </div>
          </div>
          
          <div className="mt-12">
            <button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              开始使用
            </button>
          </div>
        </div>
      </main>
      
      <footer className="text-center py-8 bg-gray-50 text-gray-600">
        <p>ReDav © 2024 - Local-First, Privacy-Focused</p>
      </footer>
    </div>
  )
}

export default App
