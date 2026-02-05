import Link from 'next/link';
import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core';

export default async function HelpPage() {
  //const markdownContent = await import('@/assets/help.md').then((mod) => mod.default);
  return (
    <Container size="md" py={40}>
      <Stack gap="md">
        <Title order={2}>Help and Support</Title>


        
        <Button component={Link} href="/" size="md">
            Return
        </Button>
      </Stack>
    </Container>
  );
}

export const dynamic = 'force-dynamic';
