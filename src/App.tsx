import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>ReDav</h1>
        <p className="slogan">Re-read your journey. Your private Readwise on WebDAV.</p>
      </header>
      
      <main className="main">
        <div className="welcome">
          <h2>欢迎使用 ReDav</h2>
          <p>你的阅读笔记聚合工具</p>
          
          <div className="features">
            <div className="feature">
              <h3>📚 多阅读器支持</h3>
              <p>支持 AnxReader、MoonReader 等主流阅读应用</p>
            </div>
            <div className="feature">
              <h3>🔒 数据自主</h3>
              <p>笔记永远在你自己的 WebDAV 中</p>
            </div>
            <div className="feature">
              <h3>🚀 一键部署</h3>
              <p>基于 Cloudflare Pages，零服务器维护成本</p>
            </div>
          </div>
          
          <div className="cta">
            <button className="btn-primary">开始使用</button>
          </div>
        </div>
      </main>
      
      <footer className="footer">
        <p>ReDav © 2024 - Local-First, Privacy-Focused</p>
      </footer>
    </div>
  )
}

export default App
