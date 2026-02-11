import { NavLink } from "react-router-dom";
import { useConfig } from "../hooks/useConfig";
import { cn } from "@/lib/utils";
import { Library, LayoutGrid, Settings, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
    onClose?: () => void;
    className?: string;
}

export function Sidebar({ onClose, className }: SidebarProps) {
    const { config } = useConfig();

    const navItems = [
        { to: "/shelf", icon: <LayoutGrid size={24} />, label: "书架" },
        { to: "/notes", icon: <Library size={24} />, label: "笔记" },
        { to: "/config", icon: <Settings size={24} />, label: "配置" },
    ];

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-card border-r dark:border-border transition-all duration-300", className)}>
            {/* Logo Area */}
            <div className="p-4 border-b dark:border-border hidden lg:flex flex-col items-center justify-center gap-1 h-20 min-h-[5rem]">
                <BookOpen className="text-indigo-600 w-6 h-6" />
                <h1 className="text-[10px] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tighter uppercase whitespace-nowrap">
                    ReDav
                </h1>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-2 space-y-2 lg:block flex lg:flex-col items-center pt-6">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        title={item.label}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-900/20 dark:text-indigo-300"
                                    : "text-muted-foreground hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                            )
                        }
                    >
                        <span className="group-hover:scale-110 transition-transform duration-200">
                            {item.icon}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Info (Desktop Only) */}
            <div className="p-4 border-t dark:border-border hidden lg:flex flex-col gap-4 items-center mb-2">
                {config?.readers && (
                    <div title={Object.values(config.readers).some((r) => r?.enabled) ? "已连接" : "未连接"}>
                        {Object.values(config.readers).some((r) => r?.enabled) ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-100 dark:ring-green-900/20 shadow-sm" />
                        ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-900/20 shadow-sm" />
                        )}
                    </div>
                )}
                <ThemeToggle />
            </div>
        </div>
    );
}
