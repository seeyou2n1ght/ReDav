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
import { toast } from "sonner";
import { cn } from '@/lib/utils';

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
        getActiveTemplate,
        showConfigInModal,
        toggleShowConfig
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
            toast.success("已复制到剪贴板！", {
                description: `共 ${context.items.length} 条笔记`,
            });
        } catch (err) {
            console.error('Failed to copy keys', err);
            toast.error("复制失败");
        }
    };

    const handleDownload = () => {
        if (!context?.items.length) return;

        const fullText = context.items.map(item => compileTemplate(localTemplateContent, item)).join('\n\n');
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${new Date().toISOString().slice(0, 10)}.${activeTemplate.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("文件已开始下载", {
            description: `export_${new Date().toISOString().slice(0, 10)}.${activeTemplate.extension}`,
        });
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className={cn(
                "flex flex-col p-0 gap-0 overflow-hidden bg-background transition-all duration-300",
                showConfigInModal ? "max-w-5xl h-[80vh]" : "max-w-3xl h-[60vh]"
            )}>
                <DialogHeader className="p-6 border-b flex-shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        个性化导出 ({context?.items.length} 项)
                    </DialogTitle>

                    {/* Template Selector in Header for quick access */}
                    {!showConfigInModal && (
                        <div className="flex items-center gap-2 mr-8">
                            <Select value={activeTemplate.id} onValueChange={handleTemplateChange}>
                                <SelectTrigger className="w-[200px] h-8 text-xs">
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="sm" onClick={() => toggleShowConfig(true)} className="h-8 text-xs text-indigo-600">
                                编辑模板
                            </Button>
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Configuration (Conditional) */}
                    {showConfigInModal && (
                        <div className="w-1/2 p-6 border-r flex flex-col gap-6 overflow-y-auto bg-gray-50/50 dark:bg-card/50 transition-all">
                            {/* Template Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <LayoutTemplate className="w-4 h-4" />
                                        导出模板
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => toggleShowConfig(false)} className="h-6 text-xs text-muted-foreground hover:text-indigo-600 px-2">
                                        收起配置
                                    </Button>
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
                    )}

                    {/* Right Panel: Live Preview */}
                    <div className={cn(
                        "flex flex-col bg-background transition-all duration-300",
                        showConfigInModal ? "w-1/2" : "w-full"
                    )}>
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
                        <div className="flex items-center gap-2">
                            {/* "Use directly" checkbox - implies toggling showConfigInModal to FALSE for next time if currently TRUE 
                                Actually, user wants to "check to use directly without prompt". 
                                Does this mean we should start with showConfig=false next time?
                                Yes, that's what persistence effectively does if we toggle it here.
                            */}
                            {showConfigInModal && (
                                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                toggleShowConfig(false);
                                                toast.info("下次将直接进入预览模式");
                                            }
                                        }}
                                    />
                                    下次直接使用此配置
                                </label>
                            )}
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
// End of file
