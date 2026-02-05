'use client';

import { useEffect, useState } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput, Select, ScrollArea, Paper, Badge, NumberInput, Switch } from '@mantine/core';
import type { DisplayDto, SlideshowDto, TemplateSummary } from '@/lib/types';
import { apiFetch } from '@/lib/utils/api';

export default function SlideshowSidebar({
  slideshows,
  selectedId,
  templates,
  displays,
  onSelect,
  onCreate,
  onMount,
  onUnmount,
  onUnmountAll,
  onDelete,
  onCreateDemo,
  onExport,
  onImport
}: {
  slideshows: SlideshowDto[];
  selectedId: string | null;
  templates: TemplateSummary[];
  displays: DisplayDto[];
  onSelect: (id: string) => void;
  onCreate: (payload: { name: string; templateKey?: string; initialScreen: { key: string; width: number; height: number } }) => void;
  onMount: (slideshowId: string, displayId: string) => void;
  onUnmount: (slideshowId: string) => void;
  onUnmountAll: () => void;
  onDelete: (id: string) => void;
  onCreateDemo: () => void;
  onExport?: (id: string) => void;
  onImport?: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(540);
  const [mountTarget, setMountTarget] = useState<SlideshowDto | null>(null);
  const [mountDisplayId, setMountDisplayId] = useState<string | null>(null);
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(true);
  const [mountResolution, setMountResolution] = useState<{ width: number; height: number } | null>(null);
  const [mountLoading, setMountLoading] = useState(false);
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

  useEffect(() => {
    if (!templateKey) return;
    const template = templates.find((item) => item.key === templateKey);
    if (!template) return;
    setWidth(template.width);
    setHeight(template.height);
  }, [templateKey, templates]);

  const handleOpenMount = async (slideshow: SlideshowDto) => {
    setMountTarget(slideshow);
    setMountResolution(null);
    setShowCompatibleOnly(true);
    const currentlyMounted = displays.find((display) => display.mountedSlideshowId === slideshow.id);
    setMountDisplayId(currentlyMounted?.id ?? null);
    setMountLoading(true);
    try {
      const screen = await apiFetch<{ width: number; height: number }>(`/api/slideshows/${slideshow.id}/screen`);
      setMountResolution({ width: screen.width, height: screen.height });
    } catch {
      setMountResolution(null);
    } finally {
      setMountLoading(false);
    }
  };

  const mountOptions = displays
    .map((display) => {
      const isCompatible =
        mountResolution == null ||
        (display.width === mountResolution.width && display.height === mountResolution.height);
      return {
        value: display.id,
        label: `${display.name} (${display.width} x ${display.height})`,
        incompatible: !isCompatible
      };
    })
    .filter((option) => (showCompatibleOnly ? !option.incompatible : true));
  const hasMountedDisplays = displays.some((display) => Boolean(display.mountedSlideshowId));

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
      <Group grow>
        <Button variant="light" size="xs" onClick={onCreateDemo}>
          Create Demo
        </Button>
        <Button variant="light" size="xs" color="red" onClick={onUnmountAll} disabled={!hasMountedDisplays}>
          Unmount All
        </Button>
      </Group>
      <ScrollArea h={280}>
        <Stack gap="xs">
          {slideshows.map((slideshow) => {
            const mountedDisplay = displays.find((display) => display.mountedSlideshowId === slideshow.id);
            return (
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
                      {mountedDisplay ? <Badge color="blue">Mounted to {mountedDisplay.name}</Badge> : null}
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
                    <Button
                      size="xs"
                      variant="light"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleOpenMount(slideshow);
                      }}
                    >
                      Mount
                    </Button>
                    {mountedDisplay ? (
                      <Button
                        size="xs"
                        variant="subtle"
                        color="orange"
                        onClick={(event) => {
                          event.stopPropagation();
                          onUnmount(slideshow.id);
                        }}
                      >
                        Unmount
                      </Button>
                    ) : null}
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(slideshow.id);
                      }}
                    >
                      Delete
                    </Button>
                  </Group>
                </Group>
              </Paper>
            );
          })}
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
          <Group grow>
            <NumberInput
              label="Width"
              value={width}
              onChange={(val) => setWidth(typeof val === 'number' && !Number.isNaN(val) ? val : 0)}
              min={1}
            />
            <NumberInput
              label="Height"
              value={height}
              onChange={(val) => setHeight(typeof val === 'number' && !Number.isNaN(val) ? val : 0)}
              min={1}
            />
          </Group>
          <Button
            onClick={() => {
              onCreate({
                name: name.trim() || 'Untitled slideshow',
                templateKey: templateKey ?? undefined,
                initialScreen: {
                  key: 'main',
                  width,
                  height
                }
              });
              setOpened(false);
              setName('');
            }}
          >
            Create
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!mountTarget}
        onClose={() => setMountTarget(null)}
        title={mountTarget ? `Mount "${mountTarget.name}"` : 'Mount slideshow'}
        centered
      >
        <Stack>
          <Switch
            checked={showCompatibleOnly}
            onChange={(event) => setShowCompatibleOnly(event.currentTarget.checked)}
            label="Show compatible displays only"
          />
          <Select
            label="Display"
            data={mountOptions}
            value={mountDisplayId}
            onChange={setMountDisplayId}
            disabled={mountLoading}
            renderOption={({ option }) => {
              const typed = option as typeof option & { incompatible?: boolean };
              return (
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm">{option.label}</Text>
                  {typed.incompatible ? (
                    <Text size="sm" c="red" fw={700}>
                      *
                    </Text>
                  ) : null}
                </Group>
              );
            }}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setMountTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!mountTarget || !mountDisplayId) return;
                onMount(mountTarget.id, mountDisplayId);
                setMountTarget(null);
              }}
              disabled={!mountDisplayId}
            >
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
