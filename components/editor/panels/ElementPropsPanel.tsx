/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Stack, Text, NumberInput, Select, TextInput, ColorInput, SegmentedControl, Switch, Group, Button, Box, Loader } from '@mantine/core';
import type { SlideElementAnimation, SlideElementDto, SlideElementDataShape } from '@/lib/types';
import { resolveMediaPath } from '@/lib/utils/media';
import { apiFetch } from '@/lib/utils/api';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { useGoogleFonts } from '@/lib/hooks/useGoogleFonts';

const animationOptions: Array<{ value: SlideElementAnimation; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'appear', label: 'Appear' }
];

type FontOption = {
  value: string;
  label: string;
  fontFamily: string;
  kind: 'system' | 'google' | 'custom';
};

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
  const data = (element?.dataJson ?? {}) as Record<string, unknown>;

  const toNumber = (value: string | number | null) =>
    typeof value === 'number' && !Number.isNaN(value) ? value : 0;

  const updateData = (patch: Record<string, unknown>) => {
    onChange({ dataJson: { ...data, ...patch } });
  };

  const [fontSearch, setFontSearch] = useState('');
  const [fontQuery, setFontQuery] = useState('');
  const [googleFonts, setGoogleFonts] = useState<string[]>([]);
  const [googleFontsAvailable, setGoogleFontsAvailable] = useState(true);
  const [fontsLoading, setFontsLoading] = useState(false);

  useEffect(() => {
    setFontSearch('');
    setFontQuery('');
  }, [element?.id]);

  const debouncedQuery = useDebouncedCallback((value: string) => {
    setFontQuery(value);
  }, 300);

  useEffect(() => {
    if (!element || element.type !== 'label') {
      setGoogleFonts([]);
      setFontsLoading(false);
      return;
    }
    let isActive = true;

    const loadFonts = async () => {
      setFontsLoading(true);
      try {
        const result = await apiFetch<{ items: string[]; hasGoogleFonts: boolean }>(
          `/api/fonts?query=${encodeURIComponent(fontQuery)}&limit=40`
        );
        if (!isActive) return;
        setGoogleFonts(result.items);
        setGoogleFontsAvailable(result.hasGoogleFonts);
      } catch {
        if (!isActive) return;
        setGoogleFonts([]);
        setGoogleFontsAvailable(false);
      } finally {
        if (isActive) {
          setFontsLoading(false);
        }
      }
    };

    loadFonts();
    return () => {
      isActive = false;
    };
  }, [element, fontQuery]);

  const systemFonts = useMemo<FontOption[]>(
    () => [
      { value: 'sans-serif', label: 'Sans-serif', fontFamily: 'sans-serif', kind: 'system' as const },
      { value: 'serif', label: 'Serif', fontFamily: 'serif', kind: 'system' as const },
      { value: 'monospace', label: 'Monospace', fontFamily: 'monospace', kind: 'system' as const }
    ],
    []
  );

  const googleFontOptions = useMemo<FontOption[]>(
    () =>
      googleFonts.map((font) => ({
        value: font,
        label: font,
        fontFamily: `'${font}', sans-serif`,
        kind: 'google' as const
      })),
    [googleFonts]
  );

  const currentFont = (data.fontFamily as string | undefined) ?? 'sans-serif';
  const hasCurrent =
    systemFonts.some((option) => option.value === currentFont) ||
    googleFontOptions.some((option) => option.value === currentFont);

  const customOption: FontOption[] = !hasCurrent
    ? [
        {
          value: currentFont,
          label: currentFont,
          fontFamily: currentFont,
          kind: 'custom' as const
        }
      ]
    : [];

  const fontOptions = [
    ...(customOption.length ? [{ group: 'Custom', items: customOption }] : []),
    { group: 'System', items: systemFonts },
    ...(googleFontOptions.length ? [{ group: 'Google Fonts', items: googleFontOptions }] : [])
  ];
  const googleFontFamilies = useMemo(() => googleFontOptions.map((option) => option.value), [googleFontOptions]);
  const fontsToLoad = useMemo(() => {
    const set = new Set<string>([...googleFontFamilies, currentFont]);
    return Array.from(set);
  }, [googleFontFamilies, currentFont]);
  useGoogleFonts(fontsToLoad);

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
          <Select
            label="Font"
            searchable
            data={fontOptions}
            value={currentFont}
            onChange={(value) => updateData({ fontFamily: value ?? 'sans-serif' })}
            searchValue={fontSearch}
            onSearchChange={(value) => {
              setFontSearch(value);
              debouncedQuery(value);
            }}
            nothingFoundMessage={fontsLoading ? 'Loading fonts...' : 'No fonts found'}
            rightSection={fontsLoading ? <Loader size="xs" /> : undefined}
            styles={{ input: { fontFamily: currentFont } }}
            renderOption={({ option }) => {
              const typed = option as FontOption;
              return (
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Text style={{ fontFamily: typed.fontFamily }}>{typed.label}</Text>
                  <Text size="xs" c="dimmed">
                    {typed.kind === 'google' ? 'Google' : typed.kind === 'custom' ? 'Custom' : 'System'}
                  </Text>
                </Group>
              );
            }}
          />
          {!googleFontsAvailable ? (
            <Text size="xs" c="dimmed">
              Google Fonts unavailable. Set `GOOGLE_FONTS_API_KEY` on the server to enable full list.
            </Text>
          ) : null}
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
      ) : element.type === 'shape' ? (
        <>
          <Select
            label="Shape"
            data={[
              { value: 'rectangle', label: 'Rectangle' },
              { value: 'circle', label: 'Circle' },
              { value: 'triangle', label: 'Triangle' }
            ]}
            value={(data.shape as SlideElementDataShape['shape']) ?? 'rectangle'}
            onChange={(value) => updateData({ shape: (value ?? 'rectangle') as SlideElementDataShape['shape'] })}
          />
          <ColorInput
            label="Fill"
            value={(data.fill as string) ?? '#2b3447'}
            onChange={(value) => updateData({ fill: value })}
          />
          <ColorInput
            label="Border color"
            value={(data.stroke as string) ?? '#6b7aa6'}
            onChange={(value) => updateData({ stroke: value })}
          />
          <NumberInput
            label="Border width"
            value={(data.strokeWidth as number) ?? 2}
            onChange={(val) => updateData({ strokeWidth: toNumber(val) })}
            min={0}
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
