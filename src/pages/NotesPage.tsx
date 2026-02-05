/**
 * 笔记页
 * 双栏布局：左侧图书/章节，右侧笔记列表
 */

export function NotesPage() {
    return (
        <div className="flex h-full">
            {/* 左栏：图书和章节树 */}
            <div className="w-64 border-r bg-white p-4 hidden md:block">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    图书
                </h2>
                <div className="text-center text-gray-400 py-8">
                    <p className="text-2xl mb-2">📖</p>
                    <p className="text-sm">暂无图书</p>
                </div>
            </div>

            {/* 右栏：笔记列表 */}
            <div className="flex-1 p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">笔记</h1>
                    <p className="text-gray-500 mt-1">浏览和管理你的阅读笔记</p>
                </div>

                {/* 笔记卡片占位 */}
                <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
                    <p className="text-4xl mb-4">📝</p>
                    <p className="text-lg font-medium mb-2">暂无笔记</p>
                    <p className="text-sm">选择左侧的图书查看笔记</p>
                </div>
            </div>
        </div>
    );
}
