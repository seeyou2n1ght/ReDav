import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
    isPinned: boolean;
    isHovered: boolean;
    togglePin: () => void;
    setHovered: (hovered: boolean) => void;
}

export const useSidebar = create<SidebarState>()(
    persist(
        (set) => ({
            isPinned: true,
            isHovered: false,
            togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
            setHovered: (hovered) => set({ isHovered: hovered }),
        }),
        {
            name: 'sidebar-storage',
            partialize: (state) => ({ isPinned: state.isPinned }), // Only persist isPinned
        }
    )
);
