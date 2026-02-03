'use client';

import { Button, Group, Modal, Text } from '@mantine/core';

export default function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Text mb="md">{message}</Text>
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm}>
          Confirm
        </Button>
      </Group>
    </Modal>
  );
}
