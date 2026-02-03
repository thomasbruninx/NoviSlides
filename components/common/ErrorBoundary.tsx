'use client';

import { Component, type ReactNode } from 'react';
import { Button, Paper, Stack, Text, Title } from '@mantine/core';

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state: { hasError: boolean; error?: Error } = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="sm">
            <Title order={3}>Something went wrong</Title>
            <Text c="dimmed">{this.state.error?.message ?? 'Unknown error'}</Text>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </Stack>
        </Paper>
      );
    }

    return this.props.children;
  }
}
