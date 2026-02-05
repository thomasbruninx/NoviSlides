import ViewerEmpty from '@/components/viewer/ViewerEmpty';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core';

export default async function ShowPage() {
  const [displays, slideshows] = await Promise.all([
    prisma.display.findMany({
      orderBy: { name: 'asc' },
      include: {
        mountedSlideshow: {
          select: { name: true }
        }
      }
    }),
    prisma.slideshow.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    })
  ]);

  if (!displays.length && !slideshows.length) {
    return (
      <ViewerEmpty
        title="No shows available"
        description="Create a slideshow and optionally configure displays to expose viewer links."
      />
    );
  }

  return (
    <Container size="md" py={40}>
      <Stack gap="md">
        <Title order={2}>Available Shows and Displays</Title>
        {displays.length ? (
          <>
            <Text c="dimmed">Display endpoints</Text>
            {displays.map((display) => (
              <Paper key={display.id} p="md" radius="md" withBorder>
                <Stack gap={6}>
                  <Text fw={700}>{display.name}</Text>
                  <Text size="sm" c="dimmed">
                    {display.width} x {display.height}
                  </Text>
                  <Text size="sm">
                    {display.mountedSlideshow?.name
                      ? `Mounted: ${display.mountedSlideshow.name}`
                      : 'No slideshow mounted'}
                  </Text>
                  <Button component={Link} href={`/display/${encodeURIComponent(display.name)}`} size="xs" variant="light">
                    Open /display/{display.name}
                  </Button>
                </Stack>
              </Paper>
            ))}
          </>
        ) : null}
        {slideshows.length ? (
          <>
            <Text c="dimmed">Direct slideshow endpoints</Text>
            {slideshows.map((slideshow) => (
              <Paper key={slideshow.id} p="md" radius="md" withBorder>
                <Stack gap={6}>
                  <Text fw={700}>{slideshow.name}</Text>
                  <Text size="xs" c="dimmed">
                    {slideshow.id}
                  </Text>
                  <Button component={Link} href={`/show/${slideshow.id}`} size="xs" variant="light">
                    Open /show/{slideshow.id}
                  </Button>
                </Stack>
              </Paper>
            ))}
          </>
        ) : null}
      </Stack>
    </Container>
  );
}

export const dynamic = 'force-dynamic';
