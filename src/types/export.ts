export interface ExportContext {
    source: 'shelf' | 'notes';
    items: ExportItem[];
}

export interface ExportItem {
    id: string; // Book ID or Note ID based on source
    title: string;
    author?: string;
    cover?: string;
    // For notes
    chapterTitle?: string;
    selection?: string;
    note?: string;
    style?: string; // color or style of the highlight
    date?: string;
    originalContent?: string; // Full content for context if needed
}

export interface ExportTemplate {
    id: string;
    name: string;
    content: string; // The template string with {{variables}}
    extension: string; // .md, .txt, .csv, etc.
    isDefault?: boolean; // If true, cannot be deleted
}

export interface ExportVariable {
    key: string;
    description: string;
    scope: 'book' | 'note' | 'global';
}

export const DEFAULT_TEMPLATES: ExportTemplate[] = [
    {
        id: 'markdown',
        name: 'Markdown (Standard)',
        extension: 'md',
        isDefault: true,
        content: `> {{selection}}

{{note}}

---
*{{bookTitle}} - {{chapterTitle}}*
`
    },
    {
        id: 'obsidian',
        name: 'Obsidian Callout',
        extension: 'md',
        isDefault: true,
        content: `> [!QUOTE] {{bookTitle}}
> {{selection}}
> 
> **Note:** {{note}}
`
    },
    {
        id: 'notion',
        name: 'Notion Style',
        extension: 'md', // Notion imports md well
        isDefault: true,
        content: `## {{chapterTitle}}
> {{selection}}

💡 {{note}}
`
    },
    {
        id: 'plain',
        name: 'Plain Text',
        extension: 'txt',
        isDefault: true,
        content: `{{selection}}
-------------------
Note: {{note}}
Source: {{bookTitle}}
`
    }
];

export const EXPORT_VARIABLES: ExportVariable[] = [
    { key: 'bookTitle', description: 'Book Title', scope: 'book' },
    { key: 'author', description: 'Author Name', scope: 'book' },
    { key: 'chapterTitle', description: 'Chapter Title', scope: 'note' },
    { key: 'selection', description: 'Highlighted Text', scope: 'note' },
    { key: 'note', description: 'User Comment', scope: 'note' },
    { key: 'date', description: 'Created Date', scope: 'note' },
    { key: 'style', description: 'Highlight Style/Color', scope: 'note' },
];
