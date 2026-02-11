import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { useSidebar } from '../hooks/useSidebar';
import { cn } from '@/lib/utils';

export function Layout() {
    const { isPinned, setHovered, isHovered } = useSidebar();
    const isExpanded = isPinned || isHovered;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-background text-foreground transition-colors duration-300 overflow-hidden">

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col border-r bg-card z-20 shadow-sm relative transition-all duration-300 ease-in-out",
                    isExpanded ? "w-56" : "w-[68px]"
                )}
                onMouseEnter={() => !isPinned && setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-50/50 dark:bg-background/50">
                    {/* Mobile Header */}
                    <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b sticky top-0 z-10">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ReDav</h1>
                        <ThemeToggle />
                    </header>

                    {/* Scrollable Page Content */}
                    <div className="flex-1 overflow-auto pb-20 lg:pb-0 scroll-smooth">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation (Hidden on Desktop) */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t z-50 pb-safe">
                    <Sidebar className="flex-row h-16 border-r-0 justify-around items-center" />
                </nav>
        </div>
    );
}
