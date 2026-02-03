'use client';

import { Stack, Text, TextInput, NumberInput, Select, ColorInput } from '@mantine/core';
import type { SlideDto } from '@/lib/types';

const transitions = [
  { value: 'slide', label: 'Slide' },
  { value: 'fade', label: 'Fade' },
  { value: 'convex', label: 'Convex' },
  { value: 'concave', label: 'Concave' },
  { value: 'zoom', label: 'Zoom' }
];

export default function SlidePropsPanel({
  slide,
  onChange
}: {
  slide: SlideDto | null;
  onChange: (attrs: Partial<SlideDto>) => void;
}) {
  if (!slide) {
    return (
      <Stack gap="xs">
        <Text fw={700}>Slide</Text>
        <Text size="sm" c="dimmed">
          Select a slide to edit its properties.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Text fw={700}>Slide</Text>
      <TextInput
        label="Title"
        value={slide.title ?? ''}
        onChange={(event) => onChange({ title: event.currentTarget.value })}
      />
      <ColorInput
        label="Background color"
        value={slide.backgroundColor ?? '#0b0f18'}
        onChange={(value) => onChange({ backgroundColor: value })}
      />
      <TextInput
        label="Background image path"
        value={slide.backgroundImagePath ?? ''}
        onChange={(event) => {
          const value = event.currentTarget.value;
          onChange({ backgroundImagePath: value.trim() ? value : null });
        }}
      />
      <NumberInput
        label="Auto-slide override (ms)"
        value={slide.autoSlideMsOverride ?? undefined}
        onChange={(value) => onChange({ autoSlideMsOverride: value === '' ? null : Number(value) })}
        min={0}
      />
      <Select
        label="Transition override"
        data={transitions}
        value={slide.transitionOverride ?? ''}
        onChange={(value) => onChange({ transitionOverride: value || null })}
        placeholder="Use slideshow default"
        clearable
      />
    </Stack>
  );
}
