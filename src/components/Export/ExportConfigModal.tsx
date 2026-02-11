import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, FileText, LayoutTemplate, RefreshCw } from 'lucide-react';
import { useExportStore } from '@/hooks/useExportStore';
import { EXPORT_VARIABLES } from '@/types/export';
import type { ExportItem } from '@/types/export';

// --- Template Engine Utility ---
const compileTemplate = (template: string, item: ExportItem): string => {
    let result = template;

    // Replace standard variables
    // Simple regex for {{variable}}
    EXPORT_VARIABLES.forEach(v => {
        const regex = new RegExp(`{{${v.key}}}`, 'g');
        const value = item[v.key as keyof ExportItem] || '';
        result = result.replace(regex, String(value));
    });

    return result;
};

export function ExportConfigModal() {
    const {
        isOpen,
        closeModal,
        context,
        savedTemplates,
        setCurrentTemplateId,
        updateTemplate,
        getActiveTemplate
    } = useExportStore();

    const activeTemplate = getActiveTemplate();
    const [previewContent, setPreviewContent] = useState('');
    const [localTemplateContent, setLocalTemplateContent] = useState('');

    // Initialize active template content when opened or switched
    useEffect(() => {
        if (isOpen && activeTemplate) {
            setLocalTemplateContent(activeTemplate.content);
        }
    }, [isOpen, activeTemplate.id]);

    // Live Preview Logic
    const previewItem = useMemo(() => context?.items[0], [context]);

    useEffect(() => {
        if (previewItem && localTemplateContent) {
            setPreviewContent(compileTemplate(localTemplateContent, previewItem));
        } else if (!previewItem) {
            setPreviewContent("No items selected for preview.");
        }
    }, [localTemplateContent, previewItem]);

    // Handlers
    const handleTemplateChange = (val: string) => {
        setCurrentTemplateId(val);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setLocalTemplateContent(newContent);
        // Debounce update to store if needed, or update on close/save
        // For now, we update the store immediately to persist edits to the current template
        updateTemplate(activeTemplate.id, newContent);
    };

    const insertVariable = (key: string) => {
        const variable = `{{${key}}}`;
        const textarea = document.getElementById('template-editor') as HTMLTextAreaElement;

        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = localTemplateContent;
            const newText = text.substring(0, start) + variable + text.substring(end);

            setLocalTemplateContent(newText);
            updateTemplate(activeTemplate.id, newText);

            // Restore focus and cursor (setTimeout needed for React render cycle)
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    const handleCopy = async () => {
        if (!context?.items.length) return;

        const fullText = context.items.map(item => compileTemplate(localTemplateContent, item)).join('\n\n');
        try {
            await navigator.clipboard.writeText(fullText);
            // Could add toast here
            alert("已复制到剪贴板！");
        } catch (err) {
            console.error('Failed to copy keys', err);
        }
    };

    const handleDownload = () => {
        if (!context?.items.length) return;

        // Simple download logic for now (single file)
        // If multiple items, we join them. If we want zip, that's complex (JSZip).
        // User requirements said "bulk export", usually implies one file per note OR one merged file.
        // For MVP, let's offer "Merged File".

        const fullText = context.items.map(item => compileTemplate(localTemplateContent, item)).join('\n\n');
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${new Date().toISOString().slice(0, 10)}.${activeTemplate.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 border-b flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        导出配置 ({context?.items.length} 项)
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Configuration */}
                    <div className="w-1/2 p-6 border-r flex flex-col gap-6 overflow-y-auto bg-gray-50/50 dark:bg-card/50">
                        {/* Template Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4" />
                                导出模板
                            </label>
                            <Select value={activeTemplate.id} onValueChange={handleTemplateChange}>
                                <SelectTrigger className="w-full bg-background">
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground">模板编辑器</label>
                                <span className="text-xs text-muted-foreground">支持 Markdown 语法</span>
                            </div>
                            <Textarea
                                id="template-editor"
                                value={localTemplateContent}
                                onChange={handleContentChange}
                                className="flex-1 font-mono text-sm bg-background resize-none p-4 leading-relaxed"
                                placeholder="Design your template here..."
                            />
                        </div>

                        {/* Variables */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">可用变量 (点击插入)</label>
                            <div className="flex flex-wrap gap-2">
                                {EXPORT_VARIABLES.map(v => (
                                    <Badge
                                        key={v.key}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                                        onClick={() => insertVariable(v.key)}
                                        title={v.description}
                                    >
                                        {`{{${v.key}}}`}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Live Preview */}
                    <div className="w-1/2 flex flex-col bg-background">
                        <div className="p-4 border-b bg-gray-50/30 dark:bg-muted/10 flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                <RefreshCw className="w-3 h-3" />
                                实时预览 (第 1 项)
                            </span>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {activeTemplate.extension}
                            </Badge>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap font-mono">
                                {previewContent}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-gray-50/30 dark:bg-muted/10">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-muted-foreground">
                            {/* Potential extra info here */}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCopy} className="gap-2">
                                <Copy className="w-4 h-4" />
                                复制内容
                            </Button>
                            <Button onClick={handleDownload} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <Download className="w-4 h-4" />
                                导出文件
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
