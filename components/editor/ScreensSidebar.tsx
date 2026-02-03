'use client';

import { useState } from 'react';
import { Badge, Button, Group, Modal, NumberInput, Paper, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import type { ScreenDto, SlideshowDto } from '@/lib/types';

export default function ScreensSidebar({
  slideshow,
  screens,
  selectedScreenId,
  onSelect,
  onCreate,
  onDelete
}: {
  slideshow: SlideshowDto | null;
  screens: ScreenDto[];
  selectedScreenId: string | null;
  onSelect: (id: string) => void;
  onCreate: (payload: { key: string; width: number; height: number }) => void;
  onDelete: (id: string) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [keyValue, setKeyValue] = useState('main');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(540);

  return (
    <Stack gap="sm" p="md">
      <Group justify="space-between">
        <Text fw={700}>Screens</Text>
        <Button size="xs" onClick={() => setOpened(true)} disabled={!slideshow}>
          Add
        </Button>
      </Group>
      <ScrollArea h={240}>
        <Stack gap="xs">
          {screens.map((screen) => (
            <Paper
              key={screen.id}
              p="sm"
              radius="md"
              withBorder
              onClick={() => onSelect(screen.id)}
              style={{
                cursor: 'pointer',
                borderColor: screen.id === selectedScreenId ? '#54b3ff' : undefined
              }}
            >
              <Group justify="space-between">
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    {screen.key}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {screen.width} x {screen.height}
                  </Text>
                  {slideshow?.defaultScreenKey === screen.key ? (
                    <Badge color="blue" size="xs">
                      Default
                    </Badge>
                  ) : null}
                </Stack>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(screen.id);
                  }}
                >
                  Delete
                </Button>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Create screen" centered>
        <Stack>
          <TextInput label="Screen key" value={keyValue} onChange={(event) => setKeyValue(event.currentTarget.value)} />
          <Group grow>
            <NumberInput
              label="Width"
              value={width}
              onChange={(val) => setWidth(typeof val === 'number' && !Number.isNaN(val) ? val : 0)}
              min={1}
            />
            <NumberInput
              label="Height"
              value={height}
              onChange={(val) => setHeight(typeof val === 'number' && !Number.isNaN(val) ? val : 0)}
              min={1}
            />
          </Group>
          <Button
            onClick={() => {
              onCreate({ key: keyValue.trim(), width, height });
              setOpened(false);
            }}
          >
            Create
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
