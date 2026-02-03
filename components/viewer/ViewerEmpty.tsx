'use client';

import { Container, Paper, Stack, Text, Title, Button } from '@mantine/core';
import Link from 'next/link';

export default function ViewerEmpty({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Container size="sm" py={80}>
      <Paper withBorder p="xl" radius="md">
        <Stack gap="md">
          <Title order={2}>{title}</Title>
          <Text c="dimmed">{description}</Text>
          <Button component={Link} href="/edit" variant="light">
            Open Editor
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
