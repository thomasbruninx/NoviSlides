import { z } from 'zod';

export async function parseJson<T>(request: Request, schema: z.ZodSchema<T>) {
  const json = await request.json();
  return schema.parse(json);
}
