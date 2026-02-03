import { TemplateService } from '@/lib/services/TemplateService';
import { ok } from '@/lib/utils/respond';

export async function GET() {
  const service = new TemplateService();
  return ok(service.listTemplates());
}

export const dynamic = 'force-dynamic';
