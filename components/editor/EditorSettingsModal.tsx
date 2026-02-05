'use client';

import { Modal, Stack, Text } from '@mantine/core';

export default function EditorSettingsModal({
  opened,
  onClose
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Settings" centered>
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Settings will appear here in a future update.
        </Text>
      </Stack>
    </Modal>
  );
}
