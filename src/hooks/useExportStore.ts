import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_TEMPLATES } from '../types/export';
import type { ExportContext, ExportTemplate } from '../types/export';

interface ExportState {
    // UI State
    isOpen: boolean;
    openModal: (context: ExportContext) => void;
    closeModal: () => void;

    // Data State
    context: ExportContext | null; // The current items being exported

    // Template State
    savedTemplates: ExportTemplate[];
    currentTemplateId: string; // ID of the currently selected template
    showConfigInModal: boolean; // Whether to show the config panel in the modal

    // Actions
    addTemplate: (template: ExportTemplate) => void;
    removeTemplate: (id: string) => void;
    updateTemplate: (id: string, content: string) => void;
    setCurrentTemplateId: (id: string) => void;
    toggleShowConfig: (show?: boolean) => void;

    // Helper to get active template
    getActiveTemplate: () => ExportTemplate;
}

export const useExportStore = create<ExportState>()(
    persist(
        (set, get) => ({
            isOpen: false,
            context: null,
            savedTemplates: [...DEFAULT_TEMPLATES],
            currentTemplateId: DEFAULT_TEMPLATES[0].id,
            showConfigInModal: true, // Default to showing config

            openModal: (context) => set({ isOpen: true, context }),
            closeModal: () => set({ isOpen: false, context: null }),

            toggleShowConfig: (show) => set((state) => ({
                showConfigInModal: show !== undefined ? show : !state.showConfigInModal
            })),

            addTemplate: (template) =>
                set((state) => ({
                    savedTemplates: [...state.savedTemplates, template],
                    currentTemplateId: template.id,
                })),

            removeTemplate: (id) =>
                set((state) => ({
                    savedTemplates: state.savedTemplates.filter((t) => t.id !== id),
                    // If removed active, switch to default
                    currentTemplateId: state.currentTemplateId === id
                        ? DEFAULT_TEMPLATES[0].id
                        : state.currentTemplateId,
                })),

            updateTemplate: (id, content) =>
                set((state) => ({
                    savedTemplates: state.savedTemplates.map((t) =>
                        t.id === id ? { ...t, content } : t
                    ),
                })),

            setCurrentTemplateId: (id) => set({ currentTemplateId: id }),

            getActiveTemplate: () => {
                const state = get();
                return (
                    state.savedTemplates.find((t) => t.id === state.currentTemplateId) ||
                    DEFAULT_TEMPLATES[0]
                );
            },
        }),
        {
            name: 'export-store',
            partialize: (state) => ({
                savedTemplates: state.savedTemplates,
                currentTemplateId: state.currentTemplateId,
                showConfigInModal: state.showConfigInModal,
            }), // Only persist templates and preference
        }
    )
);
