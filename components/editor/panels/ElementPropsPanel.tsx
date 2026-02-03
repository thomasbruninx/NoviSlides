'use client';

import { Stack, Text, NumberInput, Select, TextInput, ColorInput, SegmentedControl } from '@mantine/core';
import type { SlideElementDto } from '@/lib/types';

const animationOptions = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'appear', label: 'Appear' }
];

export default function ElementPropsPanel({
  element,
  onChange
}: {
  element: SlideElementDto | null;
  onChange: (attrs: Partial<SlideElementDto>) => void;
}) {
  if (!element) {
    return (
      <Stack gap="xs">
        <Text fw={700}>Element</Text>
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
      <Text fw={700}>Element</Text>
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
      <Select label="Animation" data={animationOptions} value={element.animation} onChange={(val) => onChange({ animation: val ?? 'none' })} />

      {element.type === 'label' ? (
        <>
          <TextInput label="Text" value={(data.text as string) ?? ''} onChange={(event) => updateData({ text: event.currentTarget.value })} />
          <NumberInput label="Font size" value={(data.fontSize as number) ?? 32} onChange={(val) => updateData({ fontSize: toNumber(val) })} />
          <TextInput label="Font family" value={(data.fontFamily as string) ?? ''} onChange={(event) => updateData({ fontFamily: event.currentTarget.value })} />
          <ColorInput label="Color" value={(data.color as string) ?? '#ffffff'} onChange={(val) => updateData({ color: val })} />
          <SegmentedControl
            fullWidth
            data={['left', 'center', 'right'].map((value) => ({ label: value, value }))}
            value={(data.align as string) ?? 'left'}
            onChange={(value) => updateData({ align: value })}
          />
        </>
      ) : (
        <>
          <TextInput label="Image path" value={(data.path as string) ?? ''} onChange={(event) => updateData({ path: event.currentTarget.value })} />
        </>
      )}
    </Stack>
  );
}
