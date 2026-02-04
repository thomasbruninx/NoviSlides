/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Menu,
  Modal,
  Pagination,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MediaAssetDto, PaginatedResult } from '@/lib/types';
import { apiFetch, apiFetchForm } from '@/lib/utils/api';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { resolveMediaPath } from '@/lib/utils/media';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const pageSize = 24;
const allowedMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm'
];

type MediaFilter = 'all' | 'image' | 'video';

function buildQuery(params: { q?: string; kind?: MediaFilter; page: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.kind && params.kind !== 'all') search.set('kind', params.kind);
  search.set('page', String(params.page));
  search.set('pageSize', String(pageSize));
  return search.toString();
}

function formatDuration(durationMs: number | null) {
  if (!durationMs || durationMs <= 0) return null;
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function MediaLibraryModal({
  opened,
  onClose,
  onSelect,
  initialFilter = 'all',
  lockFilter = false
}: {
  opened: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAssetDto) => void;
  initialFilter?: MediaFilter;
  lockFilter?: boolean;
}) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<MediaAssetDto | null>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setQuery(value.trim());
    setPage(1);
  }, 300);

  useEffect(() => {
    if (!opened) {
      setSearchInput('');
      setQuery('');
      setFilter(initialFilter);
      setPage(1);
    }
  }, [opened, initialFilter]);

  useEffect(() => {
    if (opened) {
      setFilter(initialFilter);
      setPage(1);
    }
  }, [opened, initialFilter]);

  const mediaQuery = useQuery({
    queryKey: ['media', { query, filter, page }],
    queryFn: () => {
      const qs = buildQuery({ q: query || undefined, kind: filter, page });
      return apiFetch<PaginatedResult<MediaAssetDto>>(`/api/media?${qs}`);
    },
    enabled: opened
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      return apiFetchForm<{ assets: MediaAssetDto[] }>('/api/media/upload', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      notifications.show({ color: 'green', message: `${data.assets.length} file(s) uploaded` });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<MediaAssetDto>(`/api/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      notifications.show({ color: 'green', message: 'Media asset deleted' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const items = useMemo(() => mediaQuery.data?.items ?? [], [mediaQuery.data]);
  const totalPages = mediaQuery.data?.totalPages ?? 1;

  return (
    <>
      <Modal opened={opened} onClose={onClose} title="Media Library" size="xl" centered>
        <Stack gap="md">
          <Dropzone
            accept={allowedMimeTypes}
            multiple
            onDrop={(files) => uploadMutation.mutate(files)}
            loading={uploadMutation.isPending}
          >
            <Group justify="space-between" align="center" p="md">
              <Box>
                <Text fw={600}>Upload files</Text>
                <Text size="sm" c="dimmed">
                  Drop images or videos here, or click to browse.
                </Text>
              </Box>
              <Button variant="light" size="sm">
                Choose files
              </Button>
            </Group>
          </Dropzone>

          <Group justify="space-between" align="center" wrap="wrap">
            <TextInput
              placeholder="Search by filename"
              value={searchInput}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setSearchInput(value);
                debouncedSearch(value);
              }}
              w={260}
            />
            {!lockFilter ? (
              <SegmentedControl
                data={[
                  { label: 'All', value: 'all' },
                  { label: 'Images', value: 'image' },
                  { label: 'Videos', value: 'video' }
                ]}
                value={filter}
                onChange={(value) => {
                  setFilter(value as MediaFilter);
                  setPage(1);
                }}
              />
            ) : null}
          </Group>

          {mediaQuery.isLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : items.length === 0 ? (
            <Card withBorder radius="md" p="xl" style={{ background: '#0b0f18' }}>
              <Stack gap="xs" align="center">
                <Text fw={600}>No media yet</Text>
                <Text size="sm" c="dimmed">
                  Upload images or videos to start building your library.
                </Text>
              </Stack>
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
              {items.map((asset) => {
                const isVideo = asset.kind === 'video';
                const isSvg = asset.mimeType === 'image/svg+xml';
                const duration = formatDuration(asset.durationMs);
                return (
                  <Card key={asset.id} radius="md" withBorder>
                    <Card.Section>
                      <Box
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '16 / 9',
                          background: '#0b0f18'
                        }}
                      >
                        {isVideo ? (
                          <video
                            src={resolveMediaPath(asset.path)}
                            muted
                            playsInline
                            preload="metadata"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <img
                            src={resolveMediaPath(asset.path)}
                            alt={asset.originalName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                        <Group gap={6} style={{ position: 'absolute', left: 8, top: 8 }}>
                          <Badge size="xs" color={isVideo ? 'grape' : 'blue'}>
                            {isVideo ? 'VIDEO' : 'IMAGE'}
                          </Badge>
                          {isSvg ? (
                            <Badge size="xs" variant="light" color="gray">
                              SVG
                            </Badge>
                          ) : null}
                          {duration ? (
                            <Badge size="xs" variant="light" color="dark">
                              {duration}
                            </Badge>
                          ) : null}
                        </Group>
                      </Box>
                    </Card.Section>
                    <Stack gap={6} mt="sm">
                      <Text size="sm" fw={600} lineClamp={1}>
                        {asset.originalName}
                      </Text>
                      <Group justify="space-between" align="center">
                        <Button
                          size="xs"
                          onClick={() => {
                            onSelect(asset);
                            onClose();
                          }}
                        >
                          Select
                        </Button>
                        <Menu position="bottom-end" shadow="md">
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Asset actions">
                              ...
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(asset.path);
                                  notifications.show({ color: 'green', message: 'URL copied' });
                                } catch {
                                  notifications.show({ color: 'red', message: 'Failed to copy URL' });
                                }
                              }}
                            >
                              Copy URL
                            </Menu.Item>
                            <Menu.Item color="red" onClick={() => setPendingDelete(asset)}>
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}

          {totalPages > 1 ? (
            <Group justify="center">
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          ) : null}
        </Stack>
      </Modal>

      <ConfirmDialog
        opened={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
        title="Delete media asset"
        message="This will permanently remove the file if it is not used on any slide. Continue?"
      />
    </>
  );
}
