/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Group,
  Loader,
  Modal,
  ScrollArea,
  SimpleGrid,
  Text,
  TextInput,
  Select,
  UnstyledButton
} from '@mantine/core';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { apiFetch } from '@/lib/utils/api';
import { getIconUrl, iconStyles, type IconStyle } from '@/lib/utils/icons';
import type { PaginatedResult } from '@/lib/types';

const PAGE_SIZE = 72;

type IconResult = PaginatedResult<string>;

export default function IconLibraryModal({
  opened,
  onClose,
  onSelect
}: {
  opened: boolean;
  onClose: () => void;
  onSelect: (payload: { name: string; style: IconStyle }) => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [style, setStyle] = useState<IconStyle>('filled');
  const [items, setItems] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const debounced = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 250);

  useEffect(() => {
    if (!opened) return;
    setQuery('');
    setDebouncedQuery('');
    setPage(1);
    setItems([]);
    setTotal(0);
  }, [opened]);

  const styleOptions = useMemo(
    () => iconStyles.map((value) => ({ value, label: value.replace('-', ' ') })),
    []
  );

  const fetchPage = useCallback(async (nextPage: number, replace = false) => {
    setLoading(true);
    try {
      const result = await apiFetch<IconResult>(
        `/api/icons?query=${encodeURIComponent(debouncedQuery)}&style=${style}&page=${nextPage}&pageSize=${PAGE_SIZE}`
      );
      setTotal(result.total);
      setPage(result.page);
      setItems((current) => (replace ? result.items : [...current, ...result.items]));
    } catch {
      if (replace) {
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, style]);

  useEffect(() => {
    if (!opened) return;
    setItems([]);
    setPage(1);
    void fetchPage(1, true);
  }, [debouncedQuery, style, opened, fetchPage]);

  const canLoadMore = items.length < total;

  return (
    <Modal opened={opened} onClose={onClose} title="Icon Library" size="xl" centered>
      <Group align="end" mb="sm">
        <TextInput
          label="Search"
          value={query}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setQuery(value);
            debounced(value);
          }}
          placeholder="Search icons"
          style={{ flex: 1 }}
        />
        <Select
          label="Style"
          data={styleOptions}
          value={style}
          onChange={(value) => setStyle((value as IconStyle) ?? 'filled')}
        />
      </Group>
      <ScrollArea h={420} type="always">
        {items.length === 0 && !loading ? (
          <Text size="sm" c="dimmed">
            No icons found.
          </Text>
        ) : (
          <SimpleGrid cols={6} spacing="xs">
            {items.map((name) => (
              <UnstyledButton
                key={`${style}-${name}`}
                onClick={() => onSelect({ name, style })}
                style={{
                  border: '1px solid #232a3b',
                  borderRadius: 8,
                  padding: 8,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#0b0f18'
                }}
              >
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <img src={getIconUrl(style, name, '#ffffff')} alt={name} width={28} height={28} />
                </Box>
                <Text size="xs" c="dimmed" lineClamp={1} style={{ textAlign: 'center' }}>
                  {name.replace(/_/g, ' ')}
                </Text>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        )}
        {loading ? (
          <Group justify="center" mt="sm">
            <Loader size="sm" />
          </Group>
        ) : null}
        {canLoadMore ? (
          <Group justify="center" mt="sm">
            <Button size="xs" variant="light" onClick={() => void fetchPage(page + 1)}>
              Load more
            </Button>
          </Group>
        ) : null}
      </ScrollArea>
    </Modal>
  );
}
