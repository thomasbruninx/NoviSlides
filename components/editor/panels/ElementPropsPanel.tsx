/* eslint-disable @next/next/no-img-element */
'use client';

import { Stack, Text, NumberInput, Select, TextInput, ColorInput, SegmentedControl, Switch, Group, Button, Box } from '@mantine/core';
import type { SlideElementAnimation, SlideElementDto } from '@/lib/types';
import { resolveMediaPath } from '@/lib/utils/media';

const animationOptions: Array<{ value: SlideElementAnimation; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'appear', label: 'Appear' }
];

export default function ElementPropsPanel({
  element,
  onChange,
  onChooseImage,
  showTitle = true
}: {
  element: SlideElementDto | null;
  onChange: (attrs: Partial<SlideElementDto>) => void;
  onChooseImage?: () => void;
  showTitle?: boolean;
}) {
  if (!element) {
    return (
      <Stack gap="xs">
        {showTitle ? <Text fw={700}>Element</Text> : null}
        <Text size="sm" c="dimmed">
          Select an element to edit its properties.
        </Text>
      </Stack>
    );
  }

  const data = element.dataJson as Record<string, unknown>;

  const toNumber = (value: string | number | null) =>
    typeof value === 'number' && !Number.isNaN(value) ? value : 0;

  const updateData = (patch: Record<string, unknown>) => {
    onChange({ dataJson: { ...data, ...patch } });
  };

  return (
    <Stack gap="sm">
      {showTitle ? <Text fw={700}>Element</Text> : null}
      <NumberInput label="X" value={element.x} onChange={(val) => onChange({ x: toNumber(val) })} />
      <NumberInput label="Y" value={element.y} onChange={(val) => onChange({ y: toNumber(val) })} />
      <NumberInput label="Width" value={element.width} onChange={(val) => onChange({ width: toNumber(val) })} />
      <NumberInput label="Height" value={element.height} onChange={(val) => onChange({ height: toNumber(val) })} />
      <NumberInput label="Rotation" value={element.rotation} onChange={(val) => onChange({ rotation: toNumber(val) })} />
      <NumberInput
        label="Opacity"
        value={element.opacity}
        onChange={(val) => onChange({ opacity: toNumber(val) })}
        min={0}
        max={1}
        step={0.05}
      />
      <NumberInput label="Z Index" value={element.zIndex} onChange={(val) => onChange({ zIndex: toNumber(val) })} />
      <Select
        label="Animation"
        data={animationOptions}
        value={element.animation}
        onChange={(val) => onChange({ animation: (val ?? 'none') as SlideElementAnimation })}
      />

      {element.type === 'label' ? (
        <>
          <TextInput label="Text" value={(data.text as string) ?? ''} onChange={(event) => updateData({ text: event.currentTarget.value })} />
          <NumberInput label="Font size" value={(data.fontSize as number) ?? 32} onChange={(val) => updateData({ fontSize: toNumber(val) })} />
          <TextInput label="Font family" value={(data.fontFamily as string) ?? ''} onChange={(event) => updateData({ fontFamily: event.currentTarget.value })} />
          <ColorInput label="Color" value={(data.color as string) ?? '#ffffff'} onChange={(val) => updateData({ color: val })} />
          <Group gap="xs">
            <Switch
              label="Bold"
              checked={(data.bold as boolean | undefined) ?? false}
              onChange={(event) => updateData({ bold: event.currentTarget.checked })}
            />
            <Switch
              label="Italic"
              checked={(data.italic as boolean | undefined) ?? false}
              onChange={(event) => updateData({ italic: event.currentTarget.checked })}
            />
            <Switch
              label="Underline"
              checked={(data.underline as boolean | undefined) ?? false}
              onChange={(event) => updateData({ underline: event.currentTarget.checked })}
            />
          </Group>
          <SegmentedControl
            fullWidth
            data={['left', 'center', 'right'].map((value) => ({ label: value, value }))}
            value={(data.align as string) ?? 'left'}
            onChange={(value) => updateData({ align: value })}
          />
        </>
      ) : element.type === 'video' ? (
        <>
          <TextInput label="Video path" value={(data.path as string) ?? ''} onChange={(event) => updateData({ path: event.currentTarget.value })} />
          <Switch
            label="Autoplay"
            checked={(data.autoplay as boolean | undefined) ?? false}
            onChange={(event) => updateData({ autoplay: event.currentTarget.checked })}
          />
          <Switch
            label="Loop"
            checked={(data.loop as boolean | undefined) ?? true}
            onChange={(event) => updateData({ loop: event.currentTarget.checked })}
          />
          <Switch
            label="Muted"
            checked={(data.muted as boolean | undefined) ?? true}
            onChange={(event) => updateData({ muted: event.currentTarget.checked })}
          />
          <Switch
            label="Controls"
            checked={(data.controls as boolean | undefined) ?? false}
            onChange={(event) => updateData({ controls: event.currentTarget.checked })}
          />
        </>
      ) : (
        <>
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Image
            </Text>
            {(data.path as string) ? (
              <Box
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#0b0f18',
                  border: '1px solid #232a3b'
                }}
              >
                <img
                  src={resolveMediaPath(data.path as string)}
                  alt="Image preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ) : null}
            <Text size="xs" c="dimmed" lineClamp={1}>
              {(data.path as string) ?? 'No image selected'}
            </Text>
            <Group justify="space-between" align="center">
              <Button size="xs" variant="light" onClick={onChooseImage} disabled={!onChooseImage}>
                Choose image
              </Button>
              {(data.path as string) ? (
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => updateData({ path: '', mediaAssetId: undefined, originalName: undefined })}
                >
                  Clear
                </Button>
              ) : null}
            </Group>
          </Stack>
        </>
      )}
    </Stack>
  );
}
