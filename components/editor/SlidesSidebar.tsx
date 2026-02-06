'use client';

import { useState } from 'react';
import { Box, Button, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { 
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
} from '@nine-thirty-five/material-symbols-react/outlined';
import type { SlideDto } from '@/lib/types';

export default function SlidesSidebar({
  slides,
  selectedSlideId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
  onReorder
}: {
  slides: SlideDto[];
  selectedSlideId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
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
      <ScrollArea h="100%">
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
              <Group align="center" gap="md" wrap="nowrap">
                <Box className="slide-drag-handle" aria-hidden>
                  {Array.from({ length: 8 }).map((_, dotIndex) => (
                    <span key={`${slide.id}-dot-${dotIndex}`} className="slide-drag-handle-dot" />
                  ))}
                </Box>
                <Group justify="space-between" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate="end">
                      {slide.title || `Slide ${index + 1}`}
                    </Text>
                  </Stack>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="subtle"
                      px={2}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDuplicate(slide.id);
                      }}
                    >
                      <ContentCopyIcon/>
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      px={2}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(slide.id);
                      }}
                    >
                      <DeleteIcon/>
                    </Button>
                  </Group>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
