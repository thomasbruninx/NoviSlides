'use client';

import { useEffect, useState } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput, Select, ScrollArea, Paper, Badge, Tooltip } from '@mantine/core';
import type { SlideshowDto, TemplateSummary } from '@/lib/types';

export default function SlideshowSidebar({
  slideshows,
  selectedId,
  templates,
  onSelect,
  onCreate,
  onActivate,
  onDelete,
  onCreateDemo,
  onExport,
  onImport
}: {
  slideshows: SlideshowDto[];
  selectedId: string | null;
  templates: TemplateSummary[];
  onSelect: (id: string) => void;
  onCreate: (payload: { name: string; templateKey?: string }) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateDemo: () => void;
  onExport?: (id: string) => void;
  onImport?: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const defaultTemplate = templates.find((template) => template.isDefault);
  const [templateKey, setTemplateKey] = useState<string | null>(defaultTemplate?.key ?? null);

  const templateOptions = templates.map((template) => ({
    value: template.key,
    label: template.isDefault ? `${template.name} (Default)` : template.name
  }));

  useEffect(() => {
    if (!templateKey && defaultTemplate) {
      setTemplateKey(defaultTemplate.key);
    }
  }, [defaultTemplate, templateKey]);

  return (
    <Stack gap="sm" p="md">
      <Group justify="space-between">
        <Text fw={700}>Slideshows</Text>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={onImport} disabled={!onImport}>
            Import
          </Button>
          <Button size="xs" onClick={() => setOpened(true)}>
            Create
          </Button>
        </Group>
      </Group>
      <Button variant="light" size="xs" onClick={onCreateDemo}>
        Create Demo
      </Button>
      <ScrollArea h={280}>
        <Stack gap="xs">
          {slideshows.map((slideshow) => (
            <Paper
              key={slideshow.id}
              p="sm"
              radius="md"
              withBorder
              onClick={() => onSelect(slideshow.id)}
              style={{
                cursor: 'pointer',
                borderColor: slideshow.id === selectedId ? '#54b3ff' : undefined
              }}
            >
              <Group justify="space-between" wrap="wrap">
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    {slideshow.name}
                  </Text>
                  <Group gap={6}>
                    {slideshow.isActive ? <Badge color="green">Active</Badge> : null}
                  </Group>
                </Stack>
                <Group gap={4}>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={(event) => {
                      event.stopPropagation();
                      onExport?.(slideshow.id);
                    }}
                    disabled={!onExport}
                  >
                    Export
                  </Button>
                  <Button size="xs" variant="light" onClick={(event) => {
                    event.stopPropagation();
                    onActivate(slideshow.id);
                  }}>
                    Activate
                  </Button>
                  <Button size="xs" variant="subtle" color="red" onClick={(event) => {
                    event.stopPropagation();
                    onDelete(slideshow.id);
                  }}>
                    Delete
                  </Button>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Create slideshow" centered>
        <Stack>
          <TextInput label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} />
          <Select
            label="Template"
            data={templateOptions}
            value={templateKey}
            onChange={setTemplateKey}
            placeholder="Default template"
            allowDeselect
          />
          <Button
            onClick={() => {
              onCreate({ name: name.trim() || 'Untitled slideshow', templateKey: templateKey ?? undefined });
              setOpened(false);
              setName('');
            }}
          >
            Create
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
