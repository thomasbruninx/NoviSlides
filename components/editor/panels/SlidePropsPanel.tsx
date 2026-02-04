/* eslint-disable @next/next/no-img-element */
'use client';

import { Stack, Text, TextInput, NumberInput, Select, ColorInput, Group, Button, Box } from '@mantine/core';
import type { SlideDto } from '@/lib/types';
import { resolveMediaPath } from '@/lib/utils/media';

const transitions = [
  { value: 'slide', label: 'Slide' },
  { value: 'fade', label: 'Fade' },
  { value: 'convex', label: 'Convex' },
  { value: 'concave', label: 'Concave' },
  { value: 'zoom', label: 'Zoom' }
];

export default function SlidePropsPanel({
  slide,
  onChange,
  onChooseBackgroundImage
}: {
  slide: SlideDto | null;
  onChange: (attrs: Partial<SlideDto>) => void;
  onChooseBackgroundImage?: () => void;
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
      <Stack gap={6}>
        <Text size="sm" fw={500}>
          Background image
        </Text>
        {slide.backgroundImagePath ? (
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
              src={resolveMediaPath(slide.backgroundImagePath)}
              alt="Background preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        ) : null}
        <Text size="xs" c="dimmed" lineClamp={1}>
          {slide.backgroundImagePath ?? 'No image selected'}
        </Text>
        <Group justify="space-between" align="center">
          <Button size="xs" variant="light" onClick={onChooseBackgroundImage} disabled={!onChooseBackgroundImage}>
            Choose image
          </Button>
          {slide.backgroundImagePath ? (
            <Button size="xs" variant="subtle" color="red" onClick={() => onChange({ backgroundImagePath: null })}>
              Clear
            </Button>
          ) : null}
        </Group>
      </Stack>
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
