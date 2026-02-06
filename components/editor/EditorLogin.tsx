'use client';

import { useState } from 'react';
import { Button, Checkbox, Container, Paper, PasswordInput, Stack, Text, Title } from '@mantine/core';
import type { ApiResponse } from '@/lib/types';

export default function EditorLogin() {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, rememberMe })
      });
      const payload = (await response.json()) as ApiResponse<{ authenticated: boolean }>;
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? 'Failed to login' : payload.error.message);
        return;
      }
      window.location.reload();
    } catch {
      setErrorMessage('Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size="xs" py={72}>
      <Paper withBorder radius="md" p="xl">
        <Stack gap="md">
          <Title order={3}>Editor Login</Title>
          <Text size="sm" c="dimmed">
            Enter the editor password to continue.
          </Text>
          <PasswordInput
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && password.trim()) {
                void submit();
              }
            }}
          />
          <Checkbox
            label="Remember me for 30 days"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.currentTarget.checked)}
          />
          {errorMessage ? (
            <Text size="sm" c="red">
              {errorMessage}
            </Text>
          ) : null}
          <Button onClick={() => void submit()} disabled={!password.trim()} loading={isSubmitting}>
            Login
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
