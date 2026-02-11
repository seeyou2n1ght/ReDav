import { useState } from 'react';
import { useExportStore } from '@/hooks/useExportStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Star } from 'lucide-react';
import { EXPORT_VARIABLES, type ExportTemplate } from '@/types/export';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

export function TemplateManager() {
    const { savedTemplates, addTemplate, removeTemplate, updateTemplate, currentTemplateId, setCurrentTemplateId } = useExportStore();
    const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tempContent, setTempContent] = useState('');
    const [tempName, setTempName] = useState('');

    const handleEdit = (template: ExportTemplate) => {
        setEditingTemplate(template);
        setTempContent(template.content);
        setTempName(template.name);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        const newTemplate: ExportTemplate = {
            id: crypto.randomUUID(),
            name: '新模板',
            content: '{{highlight}}\n\n-- {{bookTitle}}',
            extension: 'txt',
            isDefault: false
        };
        setEditingTemplate(newTemplate);
        setTempContent(newTemplate.content);
        setTempName(newTemplate.name);
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!editingTemplate) return;

        if (savedTemplates.some(t => t.id === editingTemplate.id)) {
            updateTemplate(editingTemplate.id, tempContent);
        } else {
            addTemplate({ ...editingTemplate, name: tempName, content: tempContent });
        }
        setIsDialogOpen(false);
        setEditingTemplate(null);
        toast.success("模板已保存");
    };

    const handleDelete = (id: string) => {
        removeTemplate(id);
        toast.success("模板已删除");
    };

    return (
        <>
            {/* 与 ConfigForm 视觉一致的卡片容器 */}
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6 sm:p-8 border dark:border-border">
                <div className="space-y-5">
                    {/* 模板列表 */}
                    <div className="grid grid-cols-1 gap-3">
                        {savedTemplates.map(template => (
                            <div
                                key={template.id}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                                    currentTemplateId === template.id
                                        ? "border-indigo-500 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm"
                                        : "border-border hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-muted/30"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 flex-shrink-0",
                                            currentTemplateId === template.id
                                                ? "text-yellow-500"
                                                : "text-muted-foreground/40 hover:text-yellow-500"
                                        )}
                                        onClick={() => setCurrentTemplateId(template.id)}
                                        title={currentTemplateId === template.id ? "当前默认模板" : "设为默认"}
                                    >
                                        <Star fill={currentTemplateId === template.id ? "currentColor" : "none"} size={16} />
                                    </Button>
                                    <div className="min-w-0">
                                        <div className="font-medium flex items-center gap-2 text-foreground">
                                            <span className="truncate">{template.name}</span>
                                            <Badge variant="secondary" className="text-[10px] h-4 flex-shrink-0">{template.extension}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-mono">
                                            {template.content.slice(0, 40)}...
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(template)}>
                                        <Edit2 size={14} />
                                    </Button>
                                    {!template.isDefault && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(template.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 新建模板按钮 */}
                    <Button
                        variant="outline"
                        className="w-full h-auto py-6 border-dashed border-2 flex flex-col gap-2 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 dark:hover:border-indigo-600 transition-colors"
                        onClick={handleCreate}
                    >
                        <Plus size={20} />
                        <span className="text-sm">新建模板</span>
                    </Button>

                    {/* 使用提示 */}
                    <p className="text-center text-xs text-muted-foreground">
                        在导出笔记时，⭐ 标记的模板将作为默认模板
                    </p>
                </div>
            </div>

            {/* 编辑对话框 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">编辑模板</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">模板名称</label>
                            <Input value={tempName} onChange={e => setTempName(e.target.value)} placeholder="输入模板名称" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">模板内容</label>
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {EXPORT_VARIABLES.map(v => (
                                    <Badge
                                        key={v.key}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                        onClick={() => setTempContent(prev => prev + `{{${v.key}}}`)}
                                    >
                                        {`{{${v.key}}}`}
                                    </Badge>
                                ))}
                            </div>
                            <Textarea
                                value={tempContent}
                                onChange={e => setTempContent(e.target.value)}
                                className="font-mono min-h-[200px]"
                                placeholder="在此编写模板内容..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
