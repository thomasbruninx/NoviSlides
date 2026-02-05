'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppShell,
  Accordion,
  Box,
  Button,
  Drawer,
  Divider,
  Group,
  Loader,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Text,
  Tooltip
} from '@mantine/core';
import { 
  FlipToFront as FlipToFrontIcon, 
  FlipToBack as FlipToBackIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  GridGoldenratio as GridGoldenratioIcon,
  Settings as SettingsIcon
} from '@nine-thirty-five/material-symbols-react/outlined';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MediaAssetDto, ScreenDto, SlideDto, SlideElementDto, SlideshowDto, TemplateSummary } from '@/lib/types';
import { apiFetch } from '@/lib/utils/api';
import { resolveMediaPath } from '@/lib/utils/media';
import SlideshowSidebar from './SlideshowSidebar';
import ScreensSidebar from './ScreensSidebar';
import SlidesSidebar from './SlidesSidebar';
import KonvaStage from './canvas/KonvaStage';
import SlidePropsPanel from './panels/SlidePropsPanel';
import ElementPropsPanel from './panels/ElementPropsPanel';
import SlideshowPropsPanel from './panels/SlideshowPropsPanel';
import MediaLibraryModal from './media/MediaLibraryModal';
import EditorSettingsModal from './EditorSettingsModal';

const defaultLabelData: SlideElementDto['dataJson'] = {
  text: 'New label',
  fontSize: 36,
  fontFamily: 'Plus Jakarta Sans, Segoe UI, Arial',
  color: '#ffffff',
  align: 'left',
  bold: false,
  italic: false,
  underline: false
};

const stripUndefined = <T extends Record<string, unknown>>(attrs: T): Partial<T> => {
  return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value !== undefined)) as Partial<T>;
};

export default function EditorShell() {
  const SAVE_DELAY_MS = 15000;
  const queryClient = useQueryClient();
  const [selectedSlideshowId, setSelectedSlideshowId] = useState<string | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [magneticGuides, setMagneticGuides] = useState(true);
  const gridSize = 25;
  const [showSlideshows, setShowSlideshows] = useState(true);
  const [showScreens, setShowScreens] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mediaIntent, setMediaIntent] = useState<
    | { type: 'add-element' }
    | { type: 'slide-background' }
    | { type: 'element-image'; elementId: string }
    | { type: 'element-video'; elementId: string }
    | null
  >(null);
  const undoStack = useRef<{ id: string; prev: Partial<SlideElementDto> }[]>([]);
  const redoStack = useRef<{ id: string; prev: Partial<SlideElementDto> }[]>([]);
  const pendingSlideUpdatesRef = useRef<Map<string, Partial<SlideDto>>>(new Map());
  const pendingElementUpdatesRef = useRef<Map<string, Partial<SlideElementDto>>>(new Map());
  const pendingSlideshowUpdatesRef = useRef<Map<string, Partial<SlideshowDto>>>(new Map());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveDeadlineRef = useRef<number | null>(null);
  const flushPendingSavesRef = useRef<() => Promise<boolean>>(async () => true);
  const [saveCountdownMs, setSaveCountdownMs] = useState<number | null>(null);
  const editVersionRef = useRef(0);

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

  const duplicateSlideMutation = useMutation({
    mutationFn: (id: string) => apiFetch<SlideDto>(`/api/slides/${id}/duplicate`, { method: 'POST' }),
    onSuccess: (slide) => {
      queryClient.invalidateQueries({ queryKey: ['slides', selectedScreenId] });
      setSelectedSlideId(slide.id);
      notifications.show({ color: 'green', message: 'Slide duplicated' });
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
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    }
  });

  const updateSlideshowMutation = useMutation({
    mutationFn: ({ id, attrs }: { id: string; attrs: Partial<SlideshowDto> }) =>
      apiFetch<SlideshowDto>(`/api/slideshows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(attrs)
      }),
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    }
  });

  const updateElementMutation = useMutation({
    mutationFn: ({ id, attrs }: { id: string; attrs: Partial<SlideElementDto> }) =>
      apiFetch<SlideElementDto>(`/api/elements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(attrs)
      }),
    onError: (error: Error) => {
      const code = (error as Error & { code?: string }).code;
      if (code === 'not_found') {
        return;
      }
      notifications.show({ color: 'red', message: error.message });
    }
  });

  const refreshScreenMutation = useMutation({
    mutationFn: (id: string) => apiFetch<{ revision: number }>(`/api/screens/${id}/refresh`, { method: 'POST' }),
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    }
  });

  const deleteElementMutation = useMutation({
    mutationFn: (id: string) => apiFetch<SlideElementDto>(`/api/elements/${id}`, { method: 'DELETE' }),
    onSuccess: (_deleted, id) => {
      pendingElementUpdatesRef.current.delete(id);
      undoStack.current = undoStack.current.filter((entry) => entry.id !== id);
      redoStack.current = redoStack.current.filter((entry) => entry.id !== id);
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

  const updateElementLocal = useCallback((elementId: string, attrs: Partial<SlideElementDto>) => {
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
  }, [queryClient, selectedScreenId, selectedSlideId]);

  const markDirty = useCallback(() => {
    editVersionRef.current += 1;
    setIsDirty(true);
  }, []);

  const clearSaveTimers = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }, []);

  const updateCountdown = useCallback(() => {
    if (!saveDeadlineRef.current) {
      setSaveCountdownMs(null);
      return;
    }
    const remaining = Math.max(0, saveDeadlineRef.current - Date.now());
    setSaveCountdownMs(remaining);
  }, []);

  const scheduleSave = useCallback(() => {
    saveDeadlineRef.current = Date.now() + SAVE_DELAY_MS;
    setSaveCountdownMs(SAVE_DELAY_MS);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void flushPendingSavesRef.current();
    }, SAVE_DELAY_MS);

    if (!saveIntervalRef.current) {
      saveIntervalRef.current = setInterval(updateCountdown, 250);
    }
  }, [updateCountdown, SAVE_DELAY_MS]);

  const flushPendingSaves = useCallback(async (): Promise<boolean> => {
    const slideUpdates = Array.from(pendingSlideUpdatesRef.current.entries());
    const elementUpdates = Array.from(pendingElementUpdatesRef.current.entries());
    const slideshowUpdates = Array.from(pendingSlideshowUpdatesRef.current.entries());

    pendingSlideUpdatesRef.current.clear();
    pendingElementUpdatesRef.current.clear();
    pendingSlideshowUpdatesRef.current.clear();

    clearSaveTimers();
    saveDeadlineRef.current = null;
    setSaveCountdownMs(null);

    if (!slideUpdates.length && !elementUpdates.length && !slideshowUpdates.length) {
      return true;
    }

    const flushVersion = editVersionRef.current;
    const operations: Array<{
      kind: 'slide' | 'element' | 'slideshow';
      id: string;
      attrs: Partial<SlideDto> | Partial<SlideElementDto> | Partial<SlideshowDto>;
      promise: Promise<unknown>;
    }> = [];

    slideUpdates.forEach(([id, attrs]) => {
      operations.push({
        kind: 'slide',
        id,
        attrs,
        promise: updateSlideMutation.mutateAsync({ id, attrs })
      });
    });

    elementUpdates.forEach(([id, attrs]) => {
      operations.push({
        kind: 'element',
        id,
        attrs,
        promise: updateElementMutation.mutateAsync({ id, attrs })
      });
    });

    slideshowUpdates.forEach(([id, attrs]) => {
      operations.push({
        kind: 'slideshow',
        id,
        attrs,
        promise: updateSlideshowMutation.mutateAsync({ id, attrs })
      });
    });

    const results = await Promise.allSettled(operations.map((op) => op.promise));
    const failed = operations.filter((_, index) => results[index]?.status === 'rejected');
    const retriable = failed.filter((_, index) => {
      const result = results[index] as PromiseRejectedResult | undefined;
      const reason = result?.reason as { code?: string } | undefined;
      return reason?.code !== 'not_found';
    });
    const hadError = failed.length > 0;

    if (retriable.length > 0) {
      retriable.forEach((op) => {
        if (op.kind === 'slide') {
          const existing = pendingSlideUpdatesRef.current.get(op.id) ?? {};
          pendingSlideUpdatesRef.current.set(op.id, { ...existing, ...(op.attrs as Partial<SlideDto>) });
        } else if (op.kind === 'element') {
          const existing = pendingElementUpdatesRef.current.get(op.id) ?? {};
          const next: Partial<SlideElementDto> = { ...existing, ...(op.attrs as Partial<SlideElementDto>) };
          if (
            existing.dataJson &&
            (op.attrs as Partial<SlideElementDto>).dataJson &&
            typeof existing.dataJson === 'object' &&
            typeof (op.attrs as Partial<SlideElementDto>).dataJson === 'object'
          ) {
            next.dataJson = {
              ...(existing.dataJson as Record<string, unknown>),
              ...((op.attrs as Partial<SlideElementDto>).dataJson as Record<string, unknown>)
            };
          }
          pendingElementUpdatesRef.current.set(op.id, next);
        } else {
          const existing = pendingSlideshowUpdatesRef.current.get(op.id) ?? {};
          pendingSlideshowUpdatesRef.current.set(op.id, { ...existing, ...(op.attrs as Partial<SlideshowDto>) });
        }
      });
      scheduleSave();
    }
    const hasNewEdits = editVersionRef.current !== flushVersion;
    const hasPending =
      pendingSlideUpdatesRef.current.size > 0 ||
      pendingElementUpdatesRef.current.size > 0 ||
      pendingSlideshowUpdatesRef.current.size > 0;

    if (!hadError && !hasNewEdits && !hasPending) {
      queryClient.invalidateQueries({ queryKey: ['slides'] });
      queryClient.invalidateQueries({ queryKey: ['slideshows'] });
      setIsDirty(false);
    }
    return retriable.length === 0;
  }, [clearSaveTimers, queryClient, scheduleSave, updateElementMutation, updateSlideMutation, updateSlideshowMutation]);

  const queueSlideSave = useCallback(
    (slideId: string, attrs: Partial<SlideDto>) => {
      const sanitized = stripUndefined(attrs as Record<string, unknown>) as Partial<SlideDto>;
      const existing = pendingSlideUpdatesRef.current.get(slideId) ?? {};
      pendingSlideUpdatesRef.current.set(slideId, { ...existing, ...sanitized });
      scheduleSave();
    },
    [scheduleSave]
  );

  const queueElementSave = useCallback(
    (elementId: string, attrs: Partial<SlideElementDto>) => {
      const sanitized = stripUndefined(attrs as Record<string, unknown>) as Partial<SlideElementDto>;
      const existing = pendingElementUpdatesRef.current.get(elementId) ?? {};
      const merged: Partial<SlideElementDto> = { ...existing, ...sanitized };
      if (
        existing.dataJson &&
        sanitized.dataJson &&
        typeof existing.dataJson === 'object' &&
        typeof sanitized.dataJson === 'object'
      ) {
        merged.dataJson = {
          ...(existing.dataJson as Record<string, unknown>),
          ...(sanitized.dataJson as Record<string, unknown>)
        };
      }
      pendingElementUpdatesRef.current.set(elementId, merged);
      scheduleSave();
    },
    [scheduleSave]
  );

  const queueSlideshowSave = useCallback(
    (slideshowId: string, attrs: Partial<SlideshowDto>) => {
      const sanitized = stripUndefined(attrs as Record<string, unknown>) as Partial<SlideshowDto>;
      const existing = pendingSlideshowUpdatesRef.current.get(slideshowId) ?? {};
      pendingSlideshowUpdatesRef.current.set(slideshowId, { ...existing, ...sanitized });
      scheduleSave();
    },
    [scheduleSave]
  );

  useEffect(() => {
    flushPendingSavesRef.current = flushPendingSaves;
  }, [flushPendingSaves]);

  useEffect(() => {
    return () => {
      clearSaveTimers();
    };
  }, [clearSaveTimers]);

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
          markDirty();
          updateElementLocal(last.id, last.prev);
          queueElementSave(last.id, last.prev);
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        const last = redoStack.current.pop();
        if (last) {
          undoStack.current.push(last);
          markDirty();
          updateElementLocal(last.id, last.prev);
          queueElementSave(last.id, last.prev);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedElementId, deleteElementMutation, markDirty, queueElementSave, updateElementLocal]);

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
    const sanitized = stripUndefined(attrs as Record<string, unknown>) as Partial<SlideDto>;
    if (!Object.keys(sanitized).length) return;
    markDirty();
    updateSlideLocal(selectedSlide.id, sanitized);
    queueSlideSave(selectedSlide.id, sanitized);
  };

  const handleElementChange = (attrs: Partial<SlideElementDto>) => {
    if (!selectedElement) return;
    const sanitized = stripUndefined(attrs as Record<string, unknown>) as Partial<SlideElementDto>;
    if (!Object.keys(sanitized).length) return;
    markDirty();
    updateElementLocal(selectedElement.id, sanitized);
    queueElementSave(selectedElement.id, sanitized);
  };

  const handleElementCommit = (
    id: string,
    attrs: Partial<SlideElementDto>,
    options?: { skipGridSnap?: boolean }
  ) => {
    if (snapToGrid && !options?.skipGridSnap) {
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
    const sanitized = stripUndefined(attrs as Record<string, unknown>) as Partial<SlideElementDto>;
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
    markDirty();
    updateElementLocal(id, sanitized);
    queueElementSave(id, sanitized);
  };

  const handleAddLabel = async () => {
    if (!selectedSlideId) return;
    const saved = await flushPendingSavesRef.current();
    if (!saved) {
      notifications.show({ color: 'red', message: 'Save failed. Resolve errors before adding elements.' });
      return;
    }
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

  const handleAddShape = async (shape: 'rectangle' | 'circle' | 'triangle') => {
    if (!selectedSlideId) return;
    const saved = await flushPendingSavesRef.current();
    if (!saved) {
      notifications.show({ color: 'red', message: 'Save failed. Resolve errors before adding elements.' });
      return;
    }
    const nextZ = (selectedSlide?.elements ?? []).reduce((max, el) => Math.max(max, el.zIndex), 0) + 1;
    createElementMutation.mutate({
      type: 'shape',
      x: 160,
      y: 160,
      width: 320,
      height: 220,
      rotation: 0,
      opacity: 1,
      zIndex: nextZ,
      animation: 'none',
      dataJson: {
        shape,
        fill: '#2b3447',
        stroke: '#6b7aa6',
        strokeWidth: 2
      }
    });
  };

  const handleMediaSelected = async (asset: MediaAssetDto) => {
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

    if (mediaIntent.type === 'element-video') {
      if (asset.kind !== 'video') {
        notifications.show({ color: 'red', message: 'Please select a video asset.' });
        return false;
      }
      const targetElement = selectedSlide?.elements?.find((item) => item.id === mediaIntent.elementId) ?? null;
      if (!targetElement) return false;
      const data = (targetElement.dataJson as Record<string, unknown>) ?? {};
      handleElementChange({
        dataJson: {
          ...data,
          path: resolveMediaPath(asset.path),
          mediaAssetId: asset.id
        }
      });
      return true;
    }

    if (!selectedSlideId) return false;
    const saved = await flushPendingSavesRef.current();
    if (!saved) {
      notifications.show({ color: 'red', message: 'Save failed. Resolve errors before adding elements.' });
      return false;
    }
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
            autoplay: true,
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

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElementId) return;
    deleteElementMutation.mutate(selectedElementId);
  }, [deleteElementMutation, selectedElementId]);

  const handleSlideshowChange = (attrs: Partial<SlideshowDto>) => {
    if (!selectedSlideshow) return;
    const sanitized = stripUndefined(attrs as Record<string, unknown>) as Partial<SlideshowDto>;
    if (!Object.keys(sanitized).length) return;
    markDirty();
    updateSlideshowLocal(selectedSlideshow.id, sanitized);
    queueSlideshowSave(selectedSlideshow.id, sanitized);
  };

  const handleManualSave = () => {
    const hasPending =
      pendingSlideUpdatesRef.current.size > 0 ||
      pendingElementUpdatesRef.current.size > 0 ||
      pendingSlideshowUpdatesRef.current.size > 0;

    if (hasPending) {
      void flushPendingSavesRef.current();
      return;
    }

    if (selectedScreenId) {
      refreshScreenMutation.mutate(selectedScreenId);
    }
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
            onDuplicate={(id) => duplicateSlideMutation.mutate(id)}
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
                <Menu position="bottom-start" shadow="md">
                  <Menu.Target>
                    <Button size="xs" variant="light" disabled={!selectedSlideId}>
                      <AddIcon />
                    </Button>
                  </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={handleAddLabel}>Label</Menu.Item>
                  <Menu.Item onClick={handleAddMedia}>Media</Menu.Item>
                  <Menu
                    position="right-start"
                    trigger="hover"
                    withinPortal={false}
                    closeOnItemClick={false}
                    offset={6}
                  >
                    <Menu.Target>
                      <Menu.Item closeMenuOnClick={false} rightSection={<Text size="xs">›</Text>}>
                        Shapes
                      </Menu.Item>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => handleAddShape('rectangle')}>Rectangle</Menu.Item>
                      <Menu.Item onClick={() => handleAddShape('circle')}>Circle</Menu.Item>
                      <Menu.Item onClick={() => handleAddShape('triangle')}>Triangle</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Menu.Dropdown>
              </Menu>
                
                <Tooltip
                  label="Bring element forward"
                  withArrow
                >
                  <Button 
                    size="xs" 
                    variant="subtle" 
                    onClick={handleBringForward} 
                    disabled={!selectedElement}
                  >
                    <FlipToFrontIcon />
                  </Button>
                </Tooltip>
                
                
                <Tooltip
                  label="Send element backward"
                  withArrow
                >
                  <Button 
                    size="xs" 
                    variant="subtle" 
                    onClick={handleSendBackward} 
                    disabled={!selectedElement}
                  >
                    <FlipToBackIcon />
                  </Button>
                </Tooltip>

                <Tooltip
                  label="Delete element"
                  withArrow
                >
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={handleDeleteSelected}
                    disabled={!selectedElement}
                  >
                    <DeleteIcon />
                  </Button>
                </Tooltip>
                
              </Group>
              <Group>
                <Menu position="bottom-end" shadow="md" closeOnItemClick={false}>
                  <Menu.Target>
                    <Button size="xs" variant="light">
                      <GridGoldenratioIcon />
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Box px="sm" py="xs">
                      <Stack gap="xs">
                        <Switch
                          label="Snap to grid"
                          checked={snapToGrid}
                          onChange={(event) => setSnapToGrid(event.currentTarget.checked)}
                        />
                        <Switch
                          label="Show guides"
                          checked={showGuides}
                          onChange={(event) => setShowGuides(event.currentTarget.checked)}
                        />
                        <Switch
                          label="Magnetic guides"
                          checked={magneticGuides}
                          onChange={(event) => setMagneticGuides(event.currentTarget.checked)}
                        />
                      </Stack>
                    </Box>
                  </Menu.Dropdown>
                </Menu>
                <Button size="xs" variant="light" onClick={() => setShowSettings(true)}>
                  <SettingsIcon />
                </Button>
                <Tooltip
                  label="Saves pending changes, or refreshes viewers if none are pending."
                  withArrow
                >
                  <span style={{ display: 'inline-block' }}>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={handleManualSave}
                      disabled={!selectedScreenId}
                    >
                      Save / Refresh
                    </Button>
                  </span>
                </Tooltip>
                {saveCountdownMs !== null ? (
                  <Text size="xs" c="cyan">
                    Saving in {Math.max(1, Math.ceil(saveCountdownMs / 1000))}s
                  </Text>
                ) : null}
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
                  showGuides={showGuides}
                  magneticGuides={magneticGuides}
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
                <Accordion multiple defaultValue={['slideshow', 'slide', 'element']} variant="contained">
                  <Accordion.Item value="slideshow">
                    <Accordion.Control>Slideshow</Accordion.Control>
                    <Accordion.Panel>
                      <SlideshowPropsPanel
                        slideshow={selectedSlideshow}
                        screenKeys={screens.map((screen) => screen.key)}
                        onChange={handleSlideshowChange}
                        showTitle={false}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                  <Accordion.Item value="slide">
                    <Accordion.Control>Slide</Accordion.Control>
                    <Accordion.Panel>
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
                        showTitle={false}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                  <Accordion.Item value="element">
                    <Accordion.Control>Element</Accordion.Control>
                    <Accordion.Panel>
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
                        onChooseVideo={
                          selectedElement && selectedElement.type === 'video'
                            ? () => {
                                setMediaIntent({ type: 'element-video', elementId: selectedElement.id });
                                setShowMediaLibrary(true);
                              }
                            : undefined
                        }
                        showTitle={false}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
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
        onSelect={async (asset) => {
          const shouldClose = await handleMediaSelected(asset);
          if (shouldClose) {
            setShowMediaLibrary(false);
            setMediaIntent(null);
          }
        }}
        initialFilter={
          mediaIntent?.type === 'slide-background' || mediaIntent?.type === 'element-image'
            ? 'image'
            : mediaIntent?.type === 'element-video'
            ? 'video'
            : 'all'
        }
        lockFilter={
          mediaIntent?.type === 'slide-background' ||
          mediaIntent?.type === 'element-image' ||
          mediaIntent?.type === 'element-video'
        }
      />
      <EditorSettingsModal opened={showSettings} onClose={() => setShowSettings(false)} />
    </AppShell>
  );
}
