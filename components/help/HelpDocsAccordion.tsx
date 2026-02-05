'use client';

import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Group,
  Paper,
  Stack,
  Text
} from '@mantine/core';
import type { HelpDoc } from '@/lib/types';
import { getIconUrl } from '@/lib/utils/icons';

export default function HelpDocsAccordion({ docs }: { docs: HelpDoc[] }) {
  return (
    <Accordion defaultValue={docs[0]?.slug ?? null} variant="separated" radius="md">
      {docs.map((doc) => (
        <AccordionItem key={doc.slug} value={doc.slug}>
          <AccordionControl>
            <Group gap="sm" wrap="nowrap">
              {doc.metadata.icon ? (
                <Image
                  src={getIconUrl('outlined', doc.metadata.icon, 'white')}
                  alt={doc.metadata.icon}
                  width={24}
                  height={24}
                  unoptimized
                />
              ) : null}
              <Stack gap={0}>
                <Text fw={600}>{doc.metadata.title}</Text>
                <Text size="sm" c="dimmed">
                  {doc.metadata.summary}
                </Text>
              </Stack>
            </Group>
          </AccordionControl>
          <AccordionPanel>
            <Paper p="sm" radius="sm" withBorder>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.markdown}</ReactMarkdown>
            </Paper>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
