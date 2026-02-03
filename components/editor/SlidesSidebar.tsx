'use client';

import { useState } from 'react';
import { Button, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import type { SlideDto } from '@/lib/types';

export default function SlidesSidebar({
  slides,
  selectedSlideId,
  onSelect,
  onAdd,
  onDelete,
  onReorder
}: {
  slides: SlideDto[];
  selectedSlideId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const ids = slides.map((slide) => slide.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggingId);
    onReorder(ids);
    setDraggingId(null);
  };

  return (
    <Stack gap="sm" p="md">
      <Group justify="space-between">
        <Text fw={700}>Slides</Text>
        <Button size="xs" onClick={onAdd}>
          Add
        </Button>
      </Group>
      <ScrollArea h={280}>
        <Stack gap="xs">
          {slides.map((slide, index) => (
            <Paper
              key={slide.id}
              p="sm"
              radius="md"
              withBorder
              draggable
              onDragStart={() => setDraggingId(slide.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(slide.id)}
              onClick={() => onSelect(slide.id)}
              style={{
                cursor: 'pointer',
                borderColor: slide.id === selectedSlideId ? '#54b3ff' : undefined
              }}
            >
              <Group justify="space-between">
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    {slide.title || `Slide ${index + 1}`}
                  </Text>
                  <Text size="xs" c="dimmed">
                    #{slide.orderIndex}
                  </Text>
                </Stack>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(slide.id);
                  }}
                >
                  Delete
                </Button>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
