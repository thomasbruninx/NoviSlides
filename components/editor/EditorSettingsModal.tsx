'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Group,
  Modal,
  NumberInput,
  Paper,
  PasswordInput,
  ScrollArea,
  Stack,
  Text,
  TextInput
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DisplayDto } from '@/lib/types';
import { apiFetch } from '@/lib/utils/api';

const DISPLAY_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

type DisplayFormState = {
  id?: string;
  name: string;
  width: number;
  height: number;
};

export default function EditorSettingsModal({
  opened,
  onClose
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formOpened, setFormOpened] = useState(false);
  const [origin, setOrigin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formState, setFormState] = useState<DisplayFormState>({
    name: '',
    width: 1920,
    height: 540
  });

  const displaysQuery = useQuery({
    queryKey: ['displays'],
    queryFn: () => apiFetch<DisplayDto[]>('/api/displays'),
    enabled: opened
  });

  useEffect(() => {
    if (!opened) {
      setFormOpened(false);
      setFormState({ name: '', width: 1920, height: 540 });
    }
  }, [opened]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; width: number; height: number }) =>
      apiFetch<DisplayDto>('/api/displays', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displays'] });
      notifications.show({ color: 'green', message: 'Display created' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; width: number; height: number } }) =>
      apiFetch<DisplayDto>(`/api/displays/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displays'] });
      notifications.show({ color: 'green', message: 'Display updated' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<DisplayDto>(`/api/displays/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displays'] });
      notifications.show({ color: 'green', message: 'Display deleted' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: { password: string; confirmPassword: string }) =>
      apiFetch<{ updated: boolean }>('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      setNewPassword('');
      setConfirmPassword('');
      notifications.show({ color: 'green', message: 'Password updated' });
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ loggedOut: boolean }>('/api/auth/logout', {
        method: 'POST'
      }),
    onSuccess: () => {
      window.location.reload();
    },
    onError: (error: Error) => notifications.show({ color: 'red', message: error.message })
  });

  const openCreateForm = () => {
    setFormState({ name: '', width: 1920, height: 540 });
    setFormOpened(true);
  };

  const openEditForm = (display: DisplayDto) => {
    setFormState({
      id: display.id,
      name: display.name,
      width: display.width,
      height: display.height
    });
    setFormOpened(true);
  };

  const submitForm = () => {
    if (!isFormValid) {
      return;
    }
    const payload = {
      name: formState.name.trim(),
      width: formState.width,
      height: formState.height
    };
    if (formState.id) {
      updateMutation.mutate({ id: formState.id, payload });
    } else {
      createMutation.mutate(payload);
    }
    setFormOpened(false);
  };

  const trimmedName = formState.name.trim();
  const isValidName =
    trimmedName.length > 0 &&
    trimmedName.length <= 80 &&
    DISPLAY_NAME_PATTERN.test(trimmedName);
  const areDimensionsValid =
    Number.isInteger(formState.width) &&
    Number.isInteger(formState.height) &&
    formState.width > 0 &&
    formState.height > 0;
  const isFormValid = isValidName && areDimensionsValid;
  const showNameError = formState.name.length > 0 && !isValidName;
  const displayPathPreview = trimmedName ? `/display/${encodeURIComponent(trimmedName)}` : '/display/<name>';
  const displayUrlPreview = origin ? `${origin}${displayPathPreview}` : displayPathPreview;
  const isPasswordValid = newPassword.length >= 6;
  const doPasswordsMatch = newPassword === confirmPassword;
  const canUpdatePassword = isPasswordValid && doPasswordsMatch;

  return (
    <>
      <Modal opened={opened} onClose={onClose} title="Settings" centered>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>Displays</Text>
            <Button size="xs" onClick={openCreateForm}>
              Add display
            </Button>
          </Group>
          <ScrollArea h={320}>
            <Stack gap="xs">
              {(displaysQuery.data ?? []).map((display) => (
                <Paper key={display.id} p="sm" radius="md" withBorder>
                  <Group justify="space-between" align="center">
                    <Stack gap={2}>
                      <Text size="sm" fw={600}>
                        {display.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {display.width} x {display.height}
                      </Text>
                      <Text size="xs" c="dimmed" ff="monospace">
                        {origin
                          ? `${origin}/display/${encodeURIComponent(display.name)}`
                          : `/display/${encodeURIComponent(display.name)}`}
                      </Text>
                    </Stack>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={() => openEditForm(display)}>
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => deleteMutation.mutate(display.id)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Group>
                </Paper>
              ))}
              {displaysQuery.data?.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No displays configured.
                </Text>
              ) : null}
            </Stack>
          </ScrollArea>
          <Paper withBorder p="sm" radius="md">
            <Stack gap="xs">
              <Text fw={600} size="sm">
                Editor Authentication
              </Text>
              <PasswordInput
                label="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
                description="Minimum 6 characters."
              />
              <PasswordInput
                label="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                error={confirmPassword.length > 0 && !doPasswordsMatch ? 'Passwords do not match.' : null}
              />
              <Group justify="flex-end">
                <Button
                  onClick={() =>
                    updatePasswordMutation.mutate({
                      password: newPassword,
                      confirmPassword
                    })
                  }
                  disabled={!canUpdatePassword}
                  loading={updatePasswordMutation.isPending}
                >
                  Update password
                </Button>
              </Group>
            </Stack>
          </Paper>
          <Divider />
          <Group justify="flex-end">
            <Button
              color="red"
              variant="light"
              onClick={() => logoutMutation.mutate()}
              loading={logoutMutation.isPending}
            >
              Logout
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        title={formState.id ? 'Edit display' : 'Create display'}
        centered
      >
        <Stack>
          <TextInput
            label="Name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.currentTarget.value }))}
            error={showNameError ? 'Use 1-80 characters: letters, numbers, "-" and "_" only (no spaces).' : null}
          />
          <Text size="xs" c="dimmed">
            Display names are case-sensitive and used directly in the URL.
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">
            URL preview: {displayUrlPreview}
          </Text>
          <Group grow>
            <NumberInput
              label="Width"
              value={formState.width}
              onChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  width: typeof value === 'number' && !Number.isNaN(value) ? value : 0
                }))
              }
              min={1}
              step={1}
              allowDecimal={false}
            />
            <NumberInput
              label="Height"
              value={formState.height}
              onChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  height: typeof value === 'number' && !Number.isNaN(value) ? value : 0
                }))
              }
              min={1}
              step={1}
              allowDecimal={false}
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setFormOpened(false)}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={!isFormValid}>
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
