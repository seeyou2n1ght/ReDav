import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, FileText, LayoutTemplate, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useExportStore } from '@/hooks/useExportStore';
import { EXPORT_VARIABLES } from '@/types/export';
import type { ExportItem } from '@/types/export';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

// --- 模板引擎 ---
// 模板变量 → ExportItem 字段的映射
// 解决 EXPORT_VARIABLES 的 key 与 ExportItem 属性名不一致的问题
const VARIABLE_TO_FIELD: Record<string, keyof ExportItem> = {
    bookTitle: 'title',
    author: 'author',
    chapterTitle: 'chapterTitle',
    selection: 'selection',
    note: 'note',
    date: 'date',
    style: 'style',
};

const compileTemplate = (template: string, item: ExportItem): string => {
    let result = template;
    EXPORT_VARIABLES.forEach(v => {
        const regex = new RegExp(`{{${v.key}}}`, 'g');
        const fieldKey = VARIABLE_TO_FIELD[v.key] || (v.key as keyof ExportItem);
        const value = item[fieldKey] || '';
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
    const [localTemplateContent, setLocalTemplateContent] = useState('');
    // 全量预览 vs 单条预览
    const [showFullPreview, setShowFullPreview] = useState(false);

    // 初始化编辑器内容
    useEffect(() => {
        if (isOpen && activeTemplate) {
            setLocalTemplateContent(activeTemplate.content);
            setShowFullPreview(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeTemplate?.id]);

    // 编译预览内容
    const previewItems = useMemo(() => {
        if (!context?.items.length || !localTemplateContent) return [];
        return context.items.map(item => compileTemplate(localTemplateContent, item));
    }, [localTemplateContent, context]);

    const previewContent = useMemo(() => {
        if (previewItems.length === 0) return '暂无可预览内容';
        if (showFullPreview) {
            return previewItems.join('\n\n---\n\n');
        }
        return previewItems[0];
    }, [previewItems, showFullPreview]);

    // 全文导出内容（无分隔符）
    const fullExportText = useMemo(() => {
        return previewItems.join('\n\n');
    }, [previewItems]);

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

    // 复制后自动关闭
    const handleCopy = async () => {
        if (!fullExportText) return;

        try {
            await navigator.clipboard.writeText(fullExportText);
            toast.success("已复制到剪贴板！", {
                description: `共 ${context?.items.length} 条，${fullExportText.length} 字符`,
            });
            // 延迟关闭 Modal
            setTimeout(() => closeModal(), 600);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error("复制失败");
        }
    };

    // 下载后自动关闭
    const handleDownload = () => {
        if (!fullExportText) return;

        const blob = new Blob([fullExportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${new Date().toISOString().slice(0, 10)}.${activeTemplate.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("文件已开始下载", {
            description: `export_${new Date().toISOString().slice(0, 10)}.${activeTemplate.extension}`,
        });
        // 延迟关闭 Modal
        setTimeout(() => closeModal(), 600);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className={cn(
                "flex flex-col p-0 gap-0 overflow-hidden bg-background transition-all duration-300",
                showConfigInModal ? "max-w-5xl h-[80vh]" : "max-w-3xl h-[65vh]"
            )}>
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        个性化导出
                        <Badge variant="secondary" className="ml-1 text-xs font-normal">
                            {context?.items.length} 项
                        </Badge>
                    </DialogTitle>

                    {/* 精简模式下的快速模板选择 */}
                    {!showConfigInModal && (
                        <div className="flex items-center gap-2 mr-8">
                            <Select value={activeTemplate.id} onValueChange={handleTemplateChange}>
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                    <SelectValue placeholder="选择模板" />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="sm" onClick={() => toggleShowConfig(true)} className="h-8 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                                编辑模板
                            </Button>
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* 左面板：模板编辑器（条件渲染） */}
                    {showConfigInModal && (
                        <div className="w-1/2 p-6 border-r flex flex-col gap-4 overflow-y-auto bg-muted/20 dark:bg-muted/5 transition-all">
                            {/* 模板选择器 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <LayoutTemplate className="w-4 h-4" />
                                        导出模板
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => toggleShowConfig(false)} className="h-6 text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 px-2">
                                        收起配置
                                    </Button>
                                </label>
                                <Select value={activeTemplate.id} onValueChange={handleTemplateChange}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue placeholder="选择模板" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {savedTemplates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 编辑器 */}
                            <div className="flex-1 flex flex-col gap-2 min-h-[250px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-muted-foreground">模板编辑器</label>
                                    <span className="text-xs text-muted-foreground">支持 Markdown 语法</span>
                                </div>
                                <Textarea
                                    id="template-editor"
                                    value={localTemplateContent}
                                    onChange={handleContentChange}
                                    className="flex-1 font-mono text-sm bg-background resize-none p-4 leading-relaxed"
                                    placeholder="在此设计你的模板..."
                                />
                            </div>

                            {/* 可用变量 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">可用变量 (点击插入)</label>
                                <div className="flex flex-wrap gap-2">
                                    {EXPORT_VARIABLES.map(v => (
                                        <Badge
                                            key={v.key}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
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

                    {/* 右面板：实时预览 */}
                    <div className={cn(
                        "flex flex-col bg-background transition-all duration-300",
                        showConfigInModal ? "w-1/2" : "w-full"
                    )}>
                        <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                <RefreshCw className="w-3 h-3" />
                                实时预览
                            </span>
                            <div className="flex items-center gap-2">
                                {/* 全量预览切换 */}
                                {(context?.items.length ?? 0) > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => setShowFullPreview(!showFullPreview)}
                                    >
                                        {showFullPreview ? (
                                            <>
                                                <ChevronUp className="w-3 h-3" />
                                                仅首条
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3 h-3" />
                                                全部 ({context?.items.length})
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {activeTemplate.extension}
                                </Badge>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                {previewContent}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-muted/10">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            {/* 内容统计 */}
                            <span className="text-xs text-muted-foreground">
                                {fullExportText.length.toLocaleString()} 字符
                            </span>
                            {/* "下次直接使用" 选项 */}
                            {showConfigInModal && (
                                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
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
}
