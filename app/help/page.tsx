import Link from 'next/link';
import { Button, Container, Divider, Stack, Text, Title } from '@mantine/core';
import HelpDocsAccordion from '@/components/help/HelpDocsAccordion';
import { DocsService } from '@/lib/services';

export default async function HelpPage() {
  const service = new DocsService();
  const docs = await service.listDocs();

  return (
    <Container size="md" py={40}>
      <Stack gap="md">
        <Title order={2}>Help and Support</Title>

        {docs.length ? (
          <HelpDocsAccordion docs={docs} />
        ) : (
          <Text c="dimmed">No documentation files found in `docs/`.</Text>
        )}

        <Divider my="sm" />
        <Button component={Link} href="/" size="md">
            Return
        </Button>
      </Stack>
    </Container>
  );
}

export const dynamic = 'force-dynamic';
