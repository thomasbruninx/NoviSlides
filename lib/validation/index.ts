import { z } from 'zod';

export const screenKeySchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Screen key must be alphanumeric with dashes/underscores');

export const createSlideshowSchema = z.object({
  name: z.string().min(1).max(120),
  defaultAutoSlideMs: z.number().int().positive().optional(),
  revealTransition: z.string().optional(),
  loop: z.boolean().optional(),
  controls: z.boolean().optional(),
  autoSlideStoppable: z.boolean().optional(),
  defaultScreenKey: screenKeySchema.optional(),
  templateKey: z.string().optional(),
  initialScreen: z
    .object({
      key: screenKeySchema,
      width: z.number().int().positive(),
      height: z.number().int().positive()
    })
    .optional()
});

export const updateSlideshowSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  defaultAutoSlideMs: z.number().int().positive().optional(),
  revealTransition: z.string().optional(),
  loop: z.boolean().optional(),
  controls: z.boolean().optional(),
  autoSlideStoppable: z.boolean().optional(),
  defaultScreenKey: screenKeySchema.optional()
});

export const createScreenSchema = z.object({
  key: screenKeySchema,
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

export const updateScreenSchema = z.object({
  key: screenKeySchema.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});

export const createSlideSchema = z.object({
  title: z.string().max(120).optional(),
  autoSlideMsOverride: z.number().int().positive().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  backgroundImagePath: z.string().optional().nullable(),
  backgroundImageSize: z.enum(['cover', 'contain', 'center']).optional().nullable(),
  backgroundImagePosition: z
    .enum([
      'top-left',
      'top-center',
      'top-right',
      'center-left',
      'center',
      'center-right',
      'bottom-left',
      'bottom-center',
      'bottom-right'
    ])
    .optional()
    .nullable(),
  transitionOverride: z.string().optional().nullable()
});

export const updateSlideSchema = createSlideSchema.extend({
  orderIndex: z.number().int().min(0).optional()
});

export const reorderSlidesSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
});

export const slideElementTypeSchema = z.enum(['image', 'label', 'video', 'shape', 'symbol']);
export const slideElementAnimationSchema = z.enum(['none', 'fade', 'zoom', 'appear']);

export const createElementSchema = z.object({
  type: slideElementTypeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  zIndex: z.number().int().optional(),
  animation: slideElementAnimationSchema.optional(),
  dataJson: z.record(z.string(), z.any())
});

export const updateElementSchema = createElementSchema.partial().extend({
  dataJson: z.record(z.string(), z.any()).optional()
});

export const reorderElementsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
});

export const uploadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1)
});

export const mediaKindSchema = z.enum(['image', 'video']);
export const mediaSortSchema = z.enum(['createdAt_desc', 'createdAt_asc']);

export const mediaListQuerySchema = z.object({
  q: z.string().optional(),
  kind: mediaKindSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(24),
  sort: mediaSortSchema.default('createdAt_desc')
});

export const mediaUploadFileSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1)
});

export const iconStyleSchema = z.enum(['filled', 'outlined', 'round', 'sharp', 'two-tone']);

export const iconListQuerySchema = z.object({
  query: z.string().optional().default(''),
  style: iconStyleSchema.default('filled'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(60)
});

export const slideshowExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  slideshow: z.object({
    name: z.string().min(1),
    defaultAutoSlideMs: z.number().int().positive(),
    revealTransition: z.string(),
    loop: z.boolean(),
    controls: z.boolean(),
    autoSlideStoppable: z.boolean(),
    defaultScreenKey: screenKeySchema
  }),
  screens: z.array(
    z.object({
      key: screenKeySchema,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      slides: z.array(
        z.object({
          orderIndex: z.number().int().min(0),
          title: z.string().max(120).optional().nullable(),
          autoSlideMsOverride: z.number().int().positive().optional().nullable(),
          backgroundColor: z.string().optional().nullable(),
          backgroundImagePath: z.string().optional().nullable(),
          backgroundImageSize: z.enum(['cover', 'contain', 'center']).optional().nullable(),
          backgroundImagePosition: z
            .enum([
              'top-left',
              'top-center',
              'top-right',
              'center-left',
              'center',
              'center-right',
              'bottom-left',
              'bottom-center',
              'bottom-right'
            ])
            .optional()
            .nullable(),
          transitionOverride: z.string().optional().nullable(),
          elements: z.array(
            z.object({
              type: slideElementTypeSchema,
              x: z.number(),
              y: z.number(),
              width: z.number().positive(),
              height: z.number().positive(),
              rotation: z.number().optional(),
              opacity: z.number().min(0).max(1).optional(),
              zIndex: z.number().int().optional(),
              animation: slideElementAnimationSchema.optional(),
              dataJson: z.record(z.string(), z.any())
            })
          )
        })
      )
    })
  )
});

export const slideshowImportSchema = z.object({
  data: slideshowExportSchema,
  nameOverride: z.string().min(1).optional()
});

export const displayNameSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Display name must be alphanumeric with dashes/underscores');

export const createDisplaySchema = z.object({
  name: displayNameSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

export const updateDisplaySchema = z.object({
  name: displayNameSchema.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});

export const mountSlideshowSchema = z.object({
  displayId: z.string().min(1)
});

export const helpDocMetadataSchema = z.object({
  title: z.string().min(1).max(140),
  summary: z.string().min(1).max(280),
  icon: z
    .string()
    .regex(/^[a-z0-9_]+$/i, 'Icon must be a material symbol name')
    .optional()
    .nullable(),
  order: z.coerce.number().int().min(0).optional()
});

export const editorLoginSchema = z.object({
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false)
});

export const updateEditorPasswordSchema = z
  .object({
    password: z.string().min(6).max(200),
    confirmPassword: z.string().min(6).max(200)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const updateTenantSettingsSchema = z.object({
  googleFontsApiKey: z.string().max(500).optional().nullable()
});
