'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppShell,
  Box,
  Button,
  Drawer,
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
import type { MediaAssetDto, ScreenDto, SlideDto, SlideElementDto, SlideshowDto, TemplateSummary } from '@/lib/types';
import { apiFetch } from '@/lib/utils/api';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { resolveMediaPath } from '@/lib/utils/media';
import SlideshowSidebar from './SlideshowSidebar';
import ScreensSidebar from './ScreensSidebar';
import SlidesSidebar from './SlidesSidebar';
import KonvaStage from './canvas/KonvaStage';
import SlidePropsPanel from './panels/SlidePropsPanel';
import ElementPropsPanel from './panels/ElementPropsPanel';
import SlideshowPropsPanel from './panels/SlideshowPropsPanel';
import MediaLibraryModal from './media/MediaLibraryModal';

const defaultLabelData: SlideElementDto['dataJson'] = {
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
  const gridSize = 25;
  const [showSlideshows, setShowSlideshows] = useState(true);
  const [showScreens, setShowScreens] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaIntent, setMediaIntent] = useState<
    | { type: 'add-element' }
    | { type: 'slide-background' }
    | { type: 'element-image'; elementId: string }
    | null
  >(null);
  const undoStack = useRef<{ id: string; prev: Partial<SlideElementDto> }[]>([]);
  const redoStack = useRef<{ id: string; prev: Partial<SlideElementDto> }[]>([]);

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

  const slideshows = useMemo(() => slideshowsQuery.data ?? [], [slideshowsQuery.data]);
  const screens = useMemo(() => screensQuery.data ?? [], [screensQuery.data]);
  const slides = useMemo(() => slidesQuery.data ?? [], [slidesQuery.data]);

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

  const calculateMediaPlacement = (asset: MediaAssetDto) => {
    if (!selectedScreen) {
      return { x: 120, y: 120, width: 480, height: 270 };
    }

    const padding = 80;
    const maxWidth = Math.max(120, selectedScreen.width - padding * 2);
    const maxHeight = Math.max(120, selectedScreen.height - padding * 2);

    let width = asset.width ?? Math.round(selectedScreen.width * 0.5);
    let height = asset.height ?? Math.round(selectedScreen.height * 0.5);

    if (asset.width == null || asset.height == null) {
      const fallbackAspect = asset.kind === 'video' ? 16 / 9 : 4 / 3;
      width = Math.min(width, maxWidth);
      height = Math.round(width / fallbackAspect);
    }

    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    return {
      width,
      height,
      x: Math.round((selectedScreen.width - width) / 2),
      y: Math.round((selectedScreen.height - height) / 2)
    };
  };

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
  }, [selectedElementId, deleteElementMutation, updateElementMutation]);

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
      const snap = (value?: number) =>
        typeof value === 'number' ? Math.round(value / gridSize) * gridSize : value;
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

  const handleAddMedia = () => {
    setMediaIntent({ type: 'add-element' });
    setShowMediaLibrary(true);
  };

  const handleMediaSelected = (asset: MediaAssetDto) => {
    if (!mediaIntent) return false;
    if (mediaIntent.type === 'slide-background') {
      if (asset.kind !== 'image') {
        notifications.show({ color: 'red', message: 'Please select an image asset.' });
        return false;
      }
      handleSlideChange({ backgroundImagePath: resolveMediaPath(asset.path) || null });
      return true;
    }

    if (mediaIntent.type === 'element-image') {
      if (asset.kind !== 'image') {
        notifications.show({ color: 'red', message: 'Please select an image asset.' });
        return false;
      }
      const targetElement = selectedSlide?.elements?.find((item) => item.id === mediaIntent.elementId) ?? null;
      if (!targetElement) return false;
      const data = (targetElement.dataJson as Record<string, unknown>) ?? {};
      handleElementChange({
        dataJson: {
          ...data,
          path: resolveMediaPath(asset.path),
          mediaAssetId: asset.id,
          originalName: asset.originalName
        }
      });
      return true;
    }

    if (!selectedSlideId) return false;
    const nextZ = (selectedSlide?.elements ?? []).reduce((max, el) => Math.max(max, el.zIndex), 0) + 1;
    const placement = calculateMediaPlacement(asset);
    const isVideo = asset.kind === 'video';
    const resolvedPath = resolveMediaPath(asset.path);
    createElementMutation.mutate({
      type: isVideo ? 'video' : 'image',
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      rotation: 0,
      opacity: 1,
      zIndex: nextZ,
      animation: 'none',
      dataJson: isVideo
        ? {
            path: resolvedPath,
            mediaAssetId: asset.id,
            autoplay: false,
            loop: true,
            muted: true,
            controls: false
          }
        : {
            path: resolvedPath,
            mediaAssetId: asset.id,
            originalName: asset.originalName
          }
    });
    return true;
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
      <AppShell.Main>
        <Drawer
          opened={showSlideshows}
          onClose={() => setShowSlideshows(false)}
          title="Slideshows"
          position="left"
          size={320}
          overlayProps={{ opacity: 0.35, blur: 1 }}
        >
          <SlideshowSidebar
            slideshows={slideshows}
            selectedId={selectedSlideshowId}
            templates={templatesQuery.data ?? []}
            onSelect={(id) => {
              handleSelectSlideshow(id);
              setShowSlideshows(false);
            }}
            onCreate={(payload) => createSlideshowMutation.mutate(payload)}
            onActivate={(id) => activateMutation.mutate(id)}
            onDelete={(id) => deleteSlideshowMutation.mutate(id)}
            onCreateDemo={() => createDemoMutation.mutate()}
          />
        </Drawer>

        <Drawer
          opened={showScreens}
          onClose={() => setShowScreens(false)}
          title="Screens"
          position="left"
          size={300}
          overlayProps={{ opacity: 0.35, blur: 1 }}
        >
          <ScreensSidebar
            slideshow={selectedSlideshow}
            screens={screens}
            selectedScreenId={selectedScreenId}
            onSelect={(id) => {
              handleSelectScreen(id);
              setShowScreens(false);
            }}
            onCreate={(payload) => createScreenMutation.mutate(payload)}
            onDelete={(id) => deleteScreenMutation.mutate(id)}
          />
        </Drawer>

        <Drawer
          opened={showSlides}
          onClose={() => setShowSlides(false)}
          title="Slides"
          position="left"
          size={300}
          overlayProps={{ opacity: 0.35, blur: 1 }}
        >
          <SlidesSidebar
            slides={slides}
            selectedSlideId={selectedSlideId}
            onSelect={(id) => {
              handleSelectSlide(id);
              setShowSlides(false);
            }}
            onAdd={() => createSlideMutation.mutate()}
            onDelete={(id) => deleteSlideMutation.mutate(id)}
            onReorder={handleReorderSlides}
          />
        </Drawer>

        <Box
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          <Group
            justify="space-between"
            px="lg"
            py="sm"
            style={{ background: '#0b0f18', flex: '0 0 auto' }}
          >
              <Group>
                <Button size="xs" variant="light" onClick={() => setShowSlideshows(true)}>
                  Slideshows
                </Button>
                <Button size="xs" variant="light" onClick={() => setShowScreens(true)} disabled={!selectedSlideshowId}>
                  Screens
                </Button>
                <Button size="xs" variant="light" onClick={() => setShowSlides(true)} disabled={!selectedScreenId}>
                  Slides
                </Button>
                <Button size="xs" onClick={handleAddLabel} disabled={!selectedSlideId}>
                  Add Label
                </Button>
                <Button size="xs" variant="light" onClick={handleAddMedia} disabled={!selectedSlideId}>
                  Add Media
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
                  label="Snap to 25px grid"
                  checked={snapToGrid}
                  onChange={(event) => setSnapToGrid(event.currentTarget.checked)}
                />
                {isDirty ? <Text size="xs" c="yellow">Unsaved changes</Text> : null}
              </Group>
          </Group>

          <Group align="stretch" gap={0} style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <Box style={{ flex: 1, padding: 24, minHeight: 0, minWidth: 0, overflow: 'hidden', height: 'calc(100vh - 48px)' }}>
              {selectedScreen ? (
                <KonvaStage
                  screen={selectedScreen}
                  slide={selectedSlide}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onElementCommit={handleElementCommit}
                  showGrid={snapToGrid}
                  gridSize={gridSize}
                />
              ) : (
                <Paper p="xl" radius="md" withBorder>
                  <Text c="dimmed">Select a screen to start editing.</Text>
                </Paper>
              )}
            </Box>
            <Divider orientation="vertical" />
            <Box style={{ width: 320, minHeight: 0 }}>
              <ScrollArea style={{ height: 'calc(100vh - 48px)', padding: 16 }}>
                <Stack gap="lg">
                  <SlideshowPropsPanel
                    slideshow={selectedSlideshow}
                    screenKeys={screens.map((screen) => screen.key)}
                    onChange={handleSlideshowChange}
                  />
                  <SlidePropsPanel
                    slide={selectedSlide}
                    onChange={handleSlideChange}
                    onChooseBackgroundImage={
                      selectedSlideId
                        ? () => {
                            setMediaIntent({ type: 'slide-background' });
                            setShowMediaLibrary(true);
                          }
                        : undefined
                    }
                  />
                  <ElementPropsPanel
                    element={selectedElement}
                    onChange={handleElementChange}
                    onChooseImage={
                      selectedElement && selectedElement.type === 'image'
                        ? () => {
                            setMediaIntent({ type: 'element-image', elementId: selectedElement.id });
                            setShowMediaLibrary(true);
                          }
                        : undefined
                    }
                  />
                </Stack>
              </ScrollArea>
            </Box>
          </Group>
        </Box>
      </AppShell.Main>
      {(slideshowsQuery.isLoading || screensQuery.isLoading || slidesQuery.isLoading) && (
        <Box style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Loader />
        </Box>
      )}
      <MediaLibraryModal
        opened={showMediaLibrary}
        onClose={() => {
          setShowMediaLibrary(false);
          setMediaIntent(null);
        }}
        onSelect={(asset) => {
          const shouldClose = handleMediaSelected(asset);
          if (shouldClose) {
            setShowMediaLibrary(false);
            setMediaIntent(null);
          }
        }}
        initialFilter={
          mediaIntent?.type === 'slide-background' || mediaIntent?.type === 'element-image' ? 'image' : 'all'
        }
        lockFilter={mediaIntent?.type === 'slide-background' || mediaIntent?.type === 'element-image'}
      />
    </AppShell>
  );
}
