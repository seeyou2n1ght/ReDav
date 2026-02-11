import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// 从 localStorage 读取主题偏好
function getStoredTheme(): "light" | "dark" | "system" {
    const stored = localStorage.getItem("redav-theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "system";
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark" | "system">(getStoredTheme);

    useEffect(() => {
        // 持久化到 localStorage
        localStorage.setItem("redav-theme", theme);

        const isDark =
            theme === "dark" ||
            (theme === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", isDark);
    }, [theme]);

    // 监听系统主题变化
    useEffect(() => {
        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = (e: MediaQueryListEvent) => {
                document.documentElement.classList.toggle("dark", e.matches);
            };
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, [theme]);


    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="切换主题"
            className="rounded-full"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
