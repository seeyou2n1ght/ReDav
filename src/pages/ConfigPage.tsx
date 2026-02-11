/**
 * 配置页
 * 包装 ConfigForm 组件
 */

import { ConfigForm } from '../components/ConfigForm';
import { TemplateManager } from '../components/Export/TemplateManager';

export function ConfigPage() {
    return (
        <div className="space-y-8 pb-20">
            <ConfigForm />
            <div className="max-w-lg mx-auto px-4">
                <TemplateManager />
            </div>
        </div>
    );
}
