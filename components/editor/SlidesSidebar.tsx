'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Button, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import {
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon
} from '@nine-thirty-five/material-symbols-react/outlined';
import type { SlideDto } from '@/lib/types';

type SlideCardProps = {
  slide: SlideDto;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  dragHandleRef?: (node: HTMLElement | null) => void;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
};

function SlideCard({
  slide,
  index,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
  dragHandleRef,
  dragHandleAttributes,
  dragHandleListeners,
  isDragging = false
}: SlideCardProps) {
  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      onClick={() => onSelect(slide.id)}
      style={{
        cursor: 'pointer',
        borderColor: selected ? '#54b3ff' : undefined,
        opacity: isDragging ? 0.35 : 1
      }}
    >
      <Group align="center" gap="md" wrap="nowrap">
        <Box
          ref={dragHandleRef}
          className="slide-drag-handle"
          aria-label="Reorder slide"
          title="Drag to reorder"
          {...dragHandleAttributes}
          {...dragHandleListeners}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
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
              <ContentCopyIcon />
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
              <DeleteIcon />
            </Button>
          </Group>
        </Group>
      </Group>
    </Paper>
  );
}

function SortableSlideItem({
  slide,
  index,
  selected,
  onSelect,
  onDelete,
  onDuplicate
}: Omit<SlideCardProps, 'dragHandleRef' | 'dragHandleAttributes' | 'dragHandleListeners'>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'transform 120ms ease',
        willChange: 'transform'
      }}
    >
      <SlideCard
        slide={slide}
        index={index}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragHandleRef={setActivatorNodeRef}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>(() => slides.map((slide) => slide.id));
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }
    })
  );

  useEffect(() => {
    const nextIds = slides.map((slide) => slide.id);
    setOrderedIds((previousIds) => {
      const filteredExisting = previousIds.filter((id) => nextIds.includes(id));
      const missing = nextIds.filter((id) => !filteredExisting.includes(id));
      const merged = [...filteredExisting, ...missing];
      if (
        merged.length === previousIds.length &&
        merged.every((id, index) => id === previousIds[index])
      ) {
        return previousIds;
      }
      return merged;
    });
  }, [slides]);

  const slidesById = useMemo(() => new Map(slides.map((slide) => [slide.id, slide])), [slides]);
  const orderedSlides = useMemo(
    () => orderedIds.map((id) => slidesById.get(id)).filter((slide): slide is SlideDto => Boolean(slide)),
    [orderedIds, slidesById]
  );
  const activeSlide = activeId ? slidesById.get(String(activeId)) ?? null : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const from = orderedIds.indexOf(String(active.id));
    const to = orderedIds.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    const nextOrderedIds = arrayMove(orderedIds, from, to);
    setOrderedIds(nextOrderedIds);
    onReorder(nextOrderedIds);
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            <Stack gap="xs">
              {orderedSlides.map((slide, index) => (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  index={index}
                  selected={slide.id === selectedSlideId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                />
              ))}
            </Stack>
          </SortableContext>
          <DragOverlay adjustScale dropAnimation={{ duration: 140, easing: 'ease-out' }}>
            {activeSlide ? (
              <div style={{ width: '100%' }}>
                <SlideCard
                  slide={activeSlide}
                  index={orderedSlides.findIndex((slide) => slide.id === activeSlide.id)}
                  selected={activeSlide.id === selectedSlideId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </ScrollArea>
    </Stack>
  );
}
