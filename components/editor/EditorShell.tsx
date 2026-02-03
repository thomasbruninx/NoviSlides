'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  AppShell,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Text
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ScreenDto, SlideDto, SlideElementDto, SlideshowDto, TemplateSummary } from '@/lib/types';
import { apiFetch, apiFetchForm } from '@/lib/utils/api';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import SlideshowSidebar from './SlideshowSidebar';
import ScreensSidebar from './ScreensSidebar';
import SlidesSidebar from './SlidesSidebar';
import KonvaStage from './canvas/KonvaStage';
import SlidePropsPanel from './panels/SlidePropsPanel';
import ElementPropsPanel from './panels/ElementPropsPanel';
import SlideshowPropsPanel from './panels/SlideshowPropsPanel';

const defaultLabelData = {
  text: 'New label',
  fontSize: 36,
  fontFamily: 'Plus Jakarta Sans, Segoe UI, Arial',
  color: '#ffffff',
  align: 'left'
};

export default function EditorShell() {
  const queryClient = useQueryClient();
  const [selectedSlideshowId, setSelectedSlideshowId] = useState<string | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const undoStack = useRef<{ id: string; prev: Partial<SlideElementDto> }[]>([]);
  const redoStack = useRef<{ id: string; prev: Partial<SlideElementDto> }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiFetch<TemplateSummary[]>('/api/templates')
  });

  const slideshowsQuery = useQuery({
    queryKey: ['slideshows'],
    queryFn: () => apiFetch<SlideshowDto[]>('/api/slideshows')
  });

  const screensQuery = useQuery({
    queryKey: ['screens', selectedSlideshowId],
    queryFn: () => apiFetch<ScreenDto[]>(`/api/slideshows/${selectedSlideshowId}/screens`),
    enabled: !!selectedSlideshowId
  });

  const slidesQuery = useQuery({
    queryKey: ['slides', selectedScreenId],
    queryFn: () => apiFetch<SlideDto[]>(`/api/screens/${selectedScreenId}/slides`),
    enabled: !!selectedScreenId
  });

  const slideshows = slideshowsQuery.data ?? [];
  const screens = screensQuery.data ?? [];
  const slides = slidesQuery.data ?? [];

  const selectedSlideshow = slideshows.find((item) => item.id === selectedSlideshowId) ?? null;
  const selectedScreen = screens.find((item) => item.id === selectedScreenId) ?? null;
  const selectedSlide = slides.find((item) => item.id === selectedSlideId) ?? null;
  const selectedElement = selectedSlide?.elements?.find((item) => item.id === selectedElementId) ?? null;

  useEffect(() => {
    if (!selectedSlideshowId && slideshows.length) {
      setSelectedSlideshowId(slideshows[0].id);
    }
  }, [selectedSlideshowId, slideshows]);

  useEffect(() => {
    if (!selectedScreenId && screens.length) {
      setSelectedScreenId(screens[0].id);
    }
  }, [selectedScreenId, screens]);

  useEffect(() => {
    if (!selectedSlideId && slides.length) {
      setSelectedSlideId(slides[0].id);
    }
  }, [selectedSlideId, slides]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId) {
        event.preventDefault();
        deleteElementMutation.mutate(selectedElementId);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        const last = undoStack.current.pop();
        if (last) {
          redoStack.current.push(last);
          updateElementMutation.mutate({ id: last.id, attrs: last.prev });
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        const last = redoStack.current.pop();
        if (last) {
          undoStack.current.push(last);
          updateElementMutation.mutate({ id: last.id, attrs: last.prev });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedElementId]);

  const createSlideshowMutation = useMutation({
    mutationFn: (payload: { name: string; templateKey?: string }) =>
      apiFetch<SlideshowDto>('/api/slideshows', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: (slideshow) => {
      queryClient.invalidateQueries({ queryKey: ['slideshows'] });
      setSelectedSlideshowId(slideshow.id);
      notifications.show({ color: 'green', message: 'Slideshow created' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const createDemoMutation = useMutation({
    mutationFn: () => apiFetch<SlideshowDto>('/api/slideshows/demo', { method: 'POST' }),
    onSuccess: (slideshow) => {
      queryClient.invalidateQueries({ queryKey: ['slideshows'] });
      setSelectedSlideshowId(slideshow.id);
      notifications.show({ color: 'green', message: 'Demo slideshow created' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiFetch<SlideshowDto>(`/api/slideshows/${id}/activate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slideshows'] });
      notifications.show({ color: 'green', message: 'Slideshow activated' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const deleteSlideshowMutation = useMutation({
    mutationFn: (id: string) => apiFetch<SlideshowDto>(`/api/slideshows/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slideshows'] });
      setSelectedSlideshowId(null);
      notifications.show({ color: 'green', message: 'Slideshow deleted' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const createScreenMutation = useMutation({
    mutationFn: (payload: { key: string; width: number; height: number }) =>
      apiFetch<ScreenDto>(`/api/slideshows/${selectedSlideshowId}/screens`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: (screen) => {
      queryClient.invalidateQueries({ queryKey: ['screens', selectedSlideshowId] });
      setSelectedScreenId(screen.id);
      notifications.show({ color: 'green', message: 'Screen created' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const deleteScreenMutation = useMutation({
    mutationFn: (id: string) => apiFetch<ScreenDto>(`/api/screens/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens', selectedSlideshowId] });
      setSelectedScreenId(null);
      notifications.show({ color: 'green', message: 'Screen deleted' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const createSlideMutation = useMutation({
    mutationFn: () =>
      apiFetch<SlideDto>(`/api/screens/${selectedScreenId}/slides`, {
        method: 'POST',
        body: JSON.stringify({ title: 'New Slide' })
      }),
    onSuccess: (slide) => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      setSelectedSlideId(slide.id);
      notifications.show({ color: 'green', message: 'Slide created' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const deleteSlideMutation = useMutation({
    mutationFn: (id: string) => apiFetch<SlideDto>(`/api/slides/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      setSelectedSlideId(null);
      notifications.show({ color: 'green', message: 'Slide deleted' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const reorderSlidesMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiFetch<SlideDto[]>(`/api/screens/${selectedScreenId}/slides/reorder`, {
        method: 'POST',
        body: JSON.stringify({ orderedIds })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      notifications.show({ color: 'green', message: 'Slides reordered' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const handleReorderSlides = (orderedIds: string[]) => {
    queryClient.setQueryData<SlideDto[]>(['slides', selectedScreenId], (current) => {
      if (!current) return current;
      const lookup = new Map(current.map((slide) => [slide.id, slide]));
      return orderedIds
        .map((id, index) => {
          const slide = lookup.get(id);
          return slide ? { ...slide, orderIndex: index } : null;
        })
        .filter((item): item is SlideDto => Boolean(item));
    });
    reorderSlidesMutation.mutate(orderedIds);
  };

  const updateSlideMutation = useMutation({
    mutationFn: ({ id, attrs }: { id: string; attrs: Partial<SlideDto> }) =>
      apiFetch<SlideDto>(`/api/slides/${id}`, {
        method: 'PUT',
        body: JSON.stringify(attrs)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      setIsDirty(false);
    },
    onError: (error: Error) => {
      setIsDirty(false);
      notifications.show({ color: 'red', message: error.message });
    }
  });

  const updateSlideshowMutation = useMutation({
    mutationFn: ({ id, attrs }: { id: string; attrs: Partial<SlideshowDto> }) =>
      apiFetch<SlideshowDto>(`/api/slideshows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(attrs)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slideshows'] });
      setIsDirty(false);
    },
    onError: (error: Error) => {
      setIsDirty(false);
      notifications.show({ color: 'red', message: error.message });
    }
  });

  const updateElementMutation = useMutation({
    mutationFn: ({ id, attrs }: { id: string; attrs: Partial<SlideElementDto> }) =>
      apiFetch<SlideElementDto>(`/api/elements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(attrs)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      setIsDirty(false);
    },
    onError: (error: Error) => {
      setIsDirty(false);
      notifications.show({ color: 'red', message: error.message });
    }
  });

  const deleteElementMutation = useMutation({
    mutationFn: (id: string) => apiFetch<SlideElementDto>(`/api/elements/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      setSelectedElementId(null);
      notifications.show({ color: 'green', message: 'Element deleted' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const createElementMutation = useMutation({
    mutationFn: (payload: Partial<SlideElementDto>) =>
      apiFetch<SlideElementDto>(`/api/slides/${selectedSlideId}/elements`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: (element) => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      setSelectedElementId(element.id);
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetchForm<{ path: string; mediaAssetId: string; width: number; height: number }>(
        '/api/upload',
        {
          method: 'POST',
          body: formData
        }
      );
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const updateSlideLocal = (slideId: string, attrs: Partial<SlideDto>) => {
    queryClient.setQueryData<SlideDto[]>(['slides', selectedScreenId], (current) => {
      if (!current) return current;
      return current.map((slide) => (slide.id === slideId ? { ...slide, ...attrs } : slide));
    });
  };

  const updateSlideshowLocal = (slideshowId: string, attrs: Partial<SlideshowDto>) => {
    queryClient.setQueryData<SlideshowDto[]>(['slideshows'], (current) => {
      if (!current) return current;
      return current.map((slideshow) =>
        slideshow.id === slideshowId ? { ...slideshow, ...attrs } : slideshow
      );
    });
  };

  const updateElementLocal = (elementId: string, attrs: Partial<SlideElementDto>) => {
    queryClient.setQueryData<SlideDto[]>(['slides', selectedScreenId], (current) => {
      if (!current) return current;
      return current.map((slide) => {
        if (slide.id !== selectedSlideId) return slide;
        return {
          ...slide,
          elements: (slide.elements ?? []).map((element) =>
            element.id === elementId ? { ...element, ...attrs } : element
          )
        };
      });
    });
  };

  const debouncedSlideCommit = useDebouncedCallback((slideId: string, attrs: Partial<SlideDto>) => {
    updateSlideMutation.mutate({ id: slideId, attrs });
  }, 400);

  const debouncedElementCommit = useDebouncedCallback(
    (elementId: string, attrs: Partial<SlideElementDto>) => {
      updateElementMutation.mutate({ id: elementId, attrs });
    },
    200
  );

  const handleSelectSlide = (id: string) => {
    if (isDirty && !window.confirm('You have unsaved changes. Continue?')) return;
    setSelectedSlideId(id);
    setSelectedElementId(null);
  };

  const handleSelectScreen = (id: string) => {
    if (isDirty && !window.confirm('You have unsaved changes. Continue?')) return;
    setSelectedScreenId(id);
    setSelectedSlideId(null);
    setSelectedElementId(null);
  };

  const handleSelectSlideshow = (id: string) => {
    if (isDirty && !window.confirm('You have unsaved changes. Continue?')) return;
    setSelectedSlideshowId(id);
    setSelectedScreenId(null);
    setSelectedSlideId(null);
    setSelectedElementId(null);
  };

  const handleSlideChange = (attrs: Partial<SlideDto>) => {
    if (!selectedSlide) return;
    setIsDirty(true);
    updateSlideLocal(selectedSlide.id, attrs);
    debouncedSlideCommit(selectedSlide.id, attrs);
  };

  const handleElementChange = (attrs: Partial<SlideElementDto>) => {
    if (!selectedElement) return;
    setIsDirty(true);
    updateElementLocal(selectedElement.id, attrs);
    debouncedElementCommit(selectedElement.id, attrs);
  };

  const handleElementCommit = (id: string, attrs: Partial<SlideElementDto>) => {
    if (snapToGrid) {
      const snap = (value?: number) => (typeof value === 'number' ? Math.round(value / 10) * 10 : value);
      attrs = {
        ...attrs,
        x: snap(attrs.x),
        y: snap(attrs.y),
        width: snap(attrs.width),
        height: snap(attrs.height)
      };
    }
    const currentElement = selectedSlide?.elements?.find((item) => item.id === id);
    if (currentElement) {
      undoStack.current.push({
        id,
        prev: {
          type: currentElement.type,
          x: currentElement.x,
          y: currentElement.y,
          width: currentElement.width,
          height: currentElement.height,
          rotation: currentElement.rotation,
          opacity: currentElement.opacity,
          zIndex: currentElement.zIndex,
          animation: currentElement.animation,
          dataJson: currentElement.dataJson
        }
      });
    }
    setIsDirty(true);
    updateElementLocal(id, attrs);
    updateElementMutation.mutate({ id, attrs });
  };

  const handleAddLabel = () => {
    if (!selectedSlideId) return;
    const nextZ = (selectedSlide?.elements ?? []).reduce((max, el) => Math.max(max, el.zIndex), 0) + 1;
    createElementMutation.mutate({
      type: 'label',
      x: 120,
      y: 120,
      width: 400,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: nextZ,
      animation: 'none',
      dataJson: defaultLabelData
    });
  };

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSlideId) return;
    const upload = await uploadMutation.mutateAsync(file);
    const nextZ = (selectedSlide?.elements ?? []).reduce((max, el) => Math.max(max, el.zIndex), 0) + 1;
    createElementMutation.mutate({
      type: 'image',
      x: 120,
      y: 120,
      width: upload.width || 480,
      height: upload.height || 270,
      rotation: 0,
      opacity: 1,
      zIndex: nextZ,
      animation: 'none',
      dataJson: {
        path: upload.path,
        mediaAssetId: upload.mediaAssetId
      }
    });
    event.target.value = '';
  };

  const handleBringForward = () => {
    if (!selectedElement) return;
    handleElementCommit(selectedElement.id, { zIndex: selectedElement.zIndex + 1 });
  };

  const handleSendBackward = () => {
    if (!selectedElement) return;
    handleElementCommit(selectedElement.id, { zIndex: Math.max(0, selectedElement.zIndex - 1) });
  };

  const handleSlideshowChange = (attrs: Partial<SlideshowDto>) => {
    if (!selectedSlideshow) return;
    setIsDirty(true);
    updateSlideshowLocal(selectedSlideshow.id, attrs);
    updateSlideshowMutation.mutate({ id: selectedSlideshow.id, attrs });
  };

  return (
    <AppShell padding={0} className="editor-shell">
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleImageSelected} />
      <AppShell.Main>
        <Group align="stretch" gap={0} style={{ height: '100vh' }}>
          <Paper withBorder radius={0} style={{ width: 300, background: '#0f1420' }}>
            <SlideshowSidebar
              slideshows={slideshows}
              selectedId={selectedSlideshowId}
              templates={templatesQuery.data ?? []}
              onSelect={handleSelectSlideshow}
              onCreate={(payload) => createSlideshowMutation.mutate(payload)}
              onActivate={(id) => activateMutation.mutate(id)}
              onDelete={(id) => deleteSlideshowMutation.mutate(id)}
              onCreateDemo={() => createDemoMutation.mutate()}
            />
          </Paper>

          <Paper withBorder radius={0} style={{ width: 260, background: '#111725' }}>
            <ScreensSidebar
              slideshow={selectedSlideshow}
              screens={screens}
              selectedScreenId={selectedScreenId}
              onSelect={handleSelectScreen}
              onCreate={(payload) => createScreenMutation.mutate(payload)}
              onDelete={(id) => deleteScreenMutation.mutate(id)}
            />
          </Paper>

          <Paper withBorder radius={0} style={{ width: 260, background: '#111a2a' }}>
            <SlidesSidebar
              slides={slides}
              selectedSlideId={selectedSlideId}
              onSelect={handleSelectSlide}
              onAdd={() => createSlideMutation.mutate()}
              onDelete={(id) => deleteSlideMutation.mutate(id)}
              onReorder={handleReorderSlides}
            />
          </Paper>

          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" px="lg" py="sm" style={{ background: '#0b0f18' }}>
              <Group>
                <Button size="xs" onClick={handleAddLabel} disabled={!selectedSlideId}>
                  Add Label
                </Button>
                <Button size="xs" variant="light" onClick={handleAddImage} disabled={!selectedSlideId}>
                  Add Image
                </Button>
                <Button size="xs" variant="subtle" onClick={handleBringForward} disabled={!selectedElement}>
                  Bring Forward
                </Button>
                <Button size="xs" variant="subtle" onClick={handleSendBackward} disabled={!selectedElement}>
                  Send Back
                </Button>
              </Group>
              <Group>
                <Switch
                  label="Snap to 10px grid"
                  checked={snapToGrid}
                  onChange={(event) => setSnapToGrid(event.currentTarget.checked)}
                />
                {isDirty ? <Text size="xs" c="yellow">Unsaved changes</Text> : null}
              </Group>
            </Group>

            <Group align="stretch" gap={0} style={{ flex: 1 }}>
              <Box style={{ flex: 1, padding: 24 }}>
                {selectedScreen ? (
                  <KonvaStage
                    screen={selectedScreen}
                    slide={selectedSlide}
                    selectedElementId={selectedElementId}
                    onSelectElement={setSelectedElementId}
                    onElementCommit={handleElementCommit}
                  />
                ) : (
                  <Paper p="xl" radius="md" withBorder>
                    <Text c="dimmed">Select a screen to start editing.</Text>
                  </Paper>
                )}
              </Box>
              <Divider orientation="vertical" />
              <ScrollArea style={{ width: 320, padding: 16 }}>
                <Stack gap="lg">
                  <SlideshowPropsPanel
                    slideshow={selectedSlideshow}
                    screenKeys={screens.map((screen) => screen.key)}
                    onChange={handleSlideshowChange}
                  />
                  <SlidePropsPanel slide={selectedSlide} onChange={handleSlideChange} />
                  <ElementPropsPanel element={selectedElement} onChange={handleElementChange} />
                </Stack>
              </ScrollArea>
            </Group>
          </Box>
        </Group>
      </AppShell.Main>
      {(slideshowsQuery.isLoading || screensQuery.isLoading || slidesQuery.isLoading) && (
        <Box style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Loader />
        </Box>
      )}
    </AppShell>
  );
}
