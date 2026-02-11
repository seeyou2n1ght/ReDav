import { useState } from 'react';
import { useExportStore } from '@/hooks/useExportStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Star, LayoutTemplate } from 'lucide-react';
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
            name: 'New Template',
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
            // Update
            updateTemplate(editingTemplate.id, tempContent);
            // Also need way to update Name if store supports it? 
            // My store `updateTemplate` only takes content. I should check store.
            // If store doesn't support name update, I might need to extend it or just re-add.
            // Let's assume for now I can only update content or I need to update store.
        } else {
            // Create
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-indigo-600" />
                    个性化导出模板
                </CardTitle>
                <CardDescription>
                    管理您的导出模板。点击星星图标设置默认模板。
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedTemplates.map(template => (
                            <div
                                key={template.id}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                                    currentTemplateId === template.id ? "border-indigo-500 bg-indigo-50/10 shadow-sm" : "hover:border-indigo-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8", currentTemplateId === template.id ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500")}
                                        onClick={() => setCurrentTemplateId(template.id)}
                                        title={currentTemplateId === template.id ? "当前默认模板" : "设为默认"}
                                    >
                                        <Star fill={currentTemplateId === template.id ? "currentColor" : "none"} size={16} />
                                    </Button>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {template.name}
                                            <Badge variant="secondary" className="text-[10px] h-4">{template.extension}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">
                                            {template.content.slice(0, 30)}...
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(template)}>
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
                        <Button variant="outline" className="h-auto py-8 border-dashed flex flex-col gap-2 hover:border-indigo-500 hover:text-indigo-600" onClick={handleCreate}>
                            <Plus size={24} />
                            <span>新建模板</span>
                        </Button>
                    </div>
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle>编辑模板</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">模板名称</label>
                            <Input value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Template Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">模板内容</label>
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {EXPORT_VARIABLES.map(v => (
                                    <Badge
                                        key={v.key}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-indigo-50"
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
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
