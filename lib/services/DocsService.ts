import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { HelpDoc, HelpDocMetadata } from '@/lib/types';
import { helpDocMetadataSchema } from '@/lib/validation';

const DOCS_DIR = path.join(process.cwd(), 'docs');

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const slugFromFileName = (fileName: string) => fileName.replace(/\.md$/i, '');

const parseMetaLine = (line: string) => {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex < 0) {
    throw new Error(`Invalid metadata line "${line}". Expected "key: value".`);
  }
  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  if (!key) {
    throw new Error(`Invalid metadata line "${line}". Missing key.`);
  }
  return { key, value };
};

const parseMarkdownDocument = (fileName: string, rawContent: string): { metadata: HelpDocMetadata; markdown: string } => {
  const content = normalizeLineEndings(rawContent).replace(/^\uFEFF/, '');
  const lines = content.split('\n');

  if (lines[0]?.trim() !== '```meta') {
    throw new Error(`"${fileName}" must start with a metadata block: \`\`\`meta`);
  }

  const metadataRaw: Record<string, string> = {};
  let closingFenceIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (line.trim() === '```') {
      closingFenceIndex = index;
      break;
    }
    if (!line.trim()) {
      continue;
    }
    const { key, value } = parseMetaLine(line);
    metadataRaw[key] = value;
  }

  if (closingFenceIndex < 0) {
    throw new Error(`"${fileName}" has an unterminated metadata block.`);
  }

  const parsedMetadata = helpDocMetadataSchema.safeParse({
    title: metadataRaw.title,
    summary: metadataRaw.summary,
    icon: metadataRaw.icon || undefined,
    order: metadataRaw.order || undefined
  });

  if (!parsedMetadata.success) {
    throw new Error(`"${fileName}" has invalid metadata: ${parsedMetadata.error.issues[0]?.message ?? 'Unknown error'}.`);
  }

  const markdown = lines.slice(closingFenceIndex + 1).join('\n').trim();
  if (!markdown) {
    throw new Error(`"${fileName}" has no markdown content after metadata.`);
  }

  return {
    metadata: parsedMetadata.data,
    markdown
  };
};

export class DocsService {
  async listDocs(): Promise<HelpDoc[]> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(DOCS_DIR);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        return [];
      }
      throw error;
    }

    const fileNames = entries
      .filter((entry) => entry.toLowerCase().endsWith('.md'))
      .sort((a, b) => a.localeCompare(b));

    const docs: HelpDoc[] = [];
    for (const fileName of fileNames) {
      const filePath = path.join(DOCS_DIR, fileName);
      try {
        const rawContent = await fs.readFile(filePath, 'utf8');
        const { metadata, markdown } = parseMarkdownDocument(fileName, rawContent);
        docs.push({
          slug: slugFromFileName(fileName),
          fileName,
          metadata,
          markdown
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[DocsService] Skipping "${fileName}": ${message}`);
      }
    }

    docs.sort((a, b) => {
      const aOrder = a.metadata.order;
      const bOrder = b.metadata.order;
      if (aOrder !== undefined && bOrder !== undefined && aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      if (aOrder !== undefined && bOrder === undefined) {
        return -1;
      }
      if (aOrder === undefined && bOrder !== undefined) {
        return 1;
      }

      const titleComparison = a.metadata.title.localeCompare(b.metadata.title, undefined, {
        sensitivity: 'base'
      });
      if (titleComparison !== 0) {
        return titleComparison;
      }
      return a.fileName.localeCompare(b.fileName, undefined, { sensitivity: 'base' });
    });

    return docs;
  }
}
