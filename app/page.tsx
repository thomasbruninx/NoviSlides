'use client';

import Link from 'next/link';
import { Container, Group, Paper, Stack, Text, Title, Button } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="md" py={80}>
      <Stack gap="xl">
        <Title order={1}>NoviSlides</Title>
        <Text c="dimmed">
          Build, manage, and run multi-screen slideshows with a lightweight editor and a fast viewer.
        </Text>
        <Group>
          <Button component={Link} href="/edit" size="md">
            Open Editor
          </Button>
          <Button component={Link} href="/show" variant="light" size="md">
            View Active Show
          </Button>
        </Group>
        <Paper withBorder p="lg" radius="md">
          <Text fw={600}>Quick Links</Text>
          <Group mt="md">
            <Button component={Link} href="/show" variant="subtle">
              /show
            </Button>
            <Button component={Link} href="/show/demo" variant="subtle">
              /show/[slideshowId]
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}
