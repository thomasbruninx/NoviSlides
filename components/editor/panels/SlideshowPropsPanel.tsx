'use client';

import { Stack, Text, NumberInput, Select, Switch } from '@mantine/core';
import type { SlideshowDto } from '@/lib/types';

const transitions = [
  { value: 'slide', label: 'Slide' },
  { value: 'fade', label: 'Fade' },
  { value: 'convex', label: 'Convex' },
  { value: 'concave', label: 'Concave' },
  { value: 'zoom', label: 'Zoom' }
];

export default function SlideshowPropsPanel({
  slideshow,
  screenKeys,
  onChange
}: {
  slideshow: SlideshowDto | null;
  screenKeys: string[];
  onChange: (attrs: Partial<SlideshowDto>) => void;
}) {
  if (!slideshow) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Text fw={700}>Slideshow</Text>
      <NumberInput
        label="Default auto-slide (ms)"
        value={slideshow.defaultAutoSlideMs}
        onChange={(val) =>
          onChange({ defaultAutoSlideMs: typeof val === 'number' && !Number.isNaN(val) ? val : 0 })
        }
        min={0}
      />
      <Select
        label="Transition"
        data={transitions}
        value={slideshow.revealTransition}
        onChange={(value) => onChange({ revealTransition: value ?? 'slide' })}
      />
      <Select
        label="Default screen key"
        data={screenKeys.map((key) => ({ value: key, label: key }))}
        value={slideshow.defaultScreenKey}
        onChange={(value) => onChange({ defaultScreenKey: value ?? slideshow.defaultScreenKey })}
      />
      <Switch
        label="Loop"
        checked={slideshow.loop}
        onChange={(event) => onChange({ loop: event.currentTarget.checked })}
      />
      <Switch
        label="Controls"
        checked={slideshow.controls}
        onChange={(event) => onChange({ controls: event.currentTarget.checked })}
      />
      <Switch
        label="Timer"
        checked={slideshow.autoSlideStoppable}
        onChange={(event) => onChange({ autoSlideStoppable: event.currentTarget.checked })}
      />
    </Stack>
  );
}
