'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container, Group, Stack, Text, Title, Button, Divider } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="md" py={80}>
      <Stack gap="xl">
        <Image src="/assets/NoviSlides.png" alt="NoviSlides Logo" height={100} width={300} style={{ objectFit: "contain" }}/>
        <Title order={1}>Digital signage content provider</Title>
        <Text c="dimmed">
          Manage your digital signage content and resources.
        </Text>
        <Group>
          <Button component={Link} href="/edit" size="md">
            Open Editor
          </Button>
          <Button component={Link} href="/show" variant="light" size="md">
            View Shows and Displays
          </Button>
          <Button component={Link} href="/help" variant="light" size="md">
            View Help
          </Button>
        </Group>
        <Divider/>
        <Text c="dimmed">
          NoviSlides &copy; 2026 Thomas Bruninx. All rights reserved.
        </Text>
      </Stack>
    </Container>
  );
}
