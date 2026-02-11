import { NavLink } from "react-router-dom";
import { useConfig } from "../hooks/useConfig";
import { useSidebar } from "../hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Library, LayoutGrid, Settings, BookOpen, PanelLeftClose, PanelLeftOpen, Pin, PinOff } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

interface SidebarProps {
    onClose?: () => void;
    className?: string;
}

export function Sidebar({ onClose, className }: SidebarProps) {
    const { config } = useConfig();
    const { isPinned, togglePin, isHovered } = useSidebar();

    // 侧边栏展开状态：固定 或 鼠标悬停
    const isExpanded = isPinned || isHovered;

    const navItems = [
        { to: "/shelf", icon: <LayoutGrid size={20} />, label: "书架" },
        { to: "/notes", icon: <Library size={20} />, label: "笔记" },
        { to: "/config", icon: <Settings size={20} />, label: "配置" },
    ];

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-card border-r dark:border-border transition-all duration-300", className)}>
            {/* Desktop Header */}
            <div className={cn("p-4 border-b dark:border-border hidden lg:flex items-center justify-between transition-all duration-300 overflow-hidden whitespace-nowrap h-16",
                !isExpanded ? "justify-center px-2" : ""
            )}>
                {/* Logo Area */}
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={cn("flex items-center justify-center transition-all duration-300", !isExpanded ? "w-full" : "")}>
                        <BookOpen className="text-indigo-600 flex-shrink-0 w-6 h-6" />
                    </div>

                    {/* Title - Only visible when expanded */}
                    <h1 className={cn(
                        "text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent transition-all duration-300 origin-left",
                        !isExpanded ? "opacity-0 w-0 scale-90 translate-x-[-20px]" : "opacity-100 w-auto scale-100 translate-x-0"
                    )}>
                        ReDav
                    </h1>
                </div>

                {/* Pin Toggle Button - Only visible when expanded (or hovered) */}
                <div className={cn("transition-opacity duration-200", !isExpanded ? "hidden" : "block")}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); togglePin(); }}
                        title={isPinned ? "取消固定 (自动收起)" : "固定侧边栏"}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        {isPinned ? <PanelLeftClose size={16} /> : <Pin size={16} />}
                    </Button>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-2 space-y-1 lg:block flex lg:flex-col justify-around lg:justify-start items-center lg:items-stretch overflow-x-hidden">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        title={!isExpanded ? item.label : undefined}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group lg:w-full whitespace-nowrap",
                                // Mobile styles: icon only or stacked
                                "flex-col lg:flex-row text-xs lg:text-sm",
                                !isExpanded && "lg:justify-center lg:px-0",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 font-medium shadow-sm dark:bg-indigo-900/20 dark:text-indigo-300"
                                    : "text-muted-foreground hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                            )
                        }
                    >
                        <span className={cn("transition-transform duration-200 flex-shrink-0", !isExpanded && "group-hover:scale-110")}>
                            {item.icon}
                        </span>
                        <span className={cn(
                            "transition-all duration-300 origin-left",
                            !isExpanded ? "lg:hidden opacity-0 w-0 translate-x-[-10px]" : "opacity-100 w-auto translate-x-0"
                        )}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Info (Desktop Only) */}
            <div className={cn("p-4 border-t dark:border-border text-xs text-muted-foreground hidden lg:flex flex-col gap-3 transition-all duration-300 overflow-hidden",
                !isExpanded && "items-center px-2"
            )}>
                {!isExpanded ? (
                    <div className="flex flex-col gap-4 items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/20" title="已连接" />
                        <ThemeToggle />
                    </div>
                ) : (
                    <div className="flex items-center justify-between whitespace-nowrap w-full">
                        <div className="flex flex-col gap-1 overflow-hidden">
                            {config?.readers && (
                                <div className="flex gap-2">
                                    {Object.values(config.readers).some((r) => r?.enabled) ? (
                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 truncate">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            <span className="truncate">已连接</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 truncate">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            <span className="truncate">未连接</span>
                                        </span>
                                    )}
                                </div>
                            )}
                            <p className="truncate">© ReDav</p>
                        </div>
                        <div className="flex-shrink-0">
                            <ThemeToggle />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
