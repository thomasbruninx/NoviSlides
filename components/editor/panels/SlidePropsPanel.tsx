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

const backgroundSizeOptions = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'center', label: 'Center' }
];

const backgroundPositionOptions = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'center-left', label: 'Center left' },
  { value: 'center', label: 'Center' },
  { value: 'center-right', label: 'Center right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' }
];

export default function SlidePropsPanel({
  slide,
  onChange,
  onChooseBackgroundImage,
  showTitle = true
}: {
  slide: SlideDto | null;
  onChange: (attrs: Partial<SlideDto>) => void;
  onChooseBackgroundImage?: () => void;
  showTitle?: boolean;
}) {
  if (!slide) {
    return (
      <Stack gap="xs">
        {showTitle ? <Text fw={700}>Slide</Text> : null}
        <Text size="sm" c="dimmed">
          Select a slide to edit its properties.
        </Text>
      </Stack>
    );
  }

  const backgroundSize = slide.backgroundImageSize ?? 'cover';
  const backgroundPosition = slide.backgroundImagePosition ?? 'center';
  const hasBackgroundImage = Boolean(slide.backgroundImagePath);

  return (
    <Stack gap="sm">
      {showTitle ? <Text fw={700}>Slide</Text> : null}
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
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
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
      <Select
        label="Background size"
        data={backgroundSizeOptions}
        value={backgroundSize}
        onChange={(value) => onChange({ backgroundImageSize: (value ?? 'cover') as SlideDto['backgroundImageSize'] })}
        disabled={!hasBackgroundImage}
      />
      <Select
        label="Background position"
        data={backgroundPositionOptions}
        value={backgroundPosition}
        onChange={(value) =>
          onChange({ backgroundImagePosition: (value ?? 'center') as SlideDto['backgroundImagePosition'] })
        }
        disabled={!hasBackgroundImage}
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
