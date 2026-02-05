import { IMAGE_PLACEHOLDER } from './placeholders';
import type { TemplateDefinition } from './types';

const defaultResolution = { width: 1920, height: 540 };

export const templates: TemplateDefinition[] = [
  {
    key: 'default-starter',
    name: 'Default Starter',
    description: 'Title + subtitle and an image with caption.',
    isDefault: true,
    build: () => [
      {
        key: 'main',
        width: defaultResolution.width,
        height: defaultResolution.height,
        slides: [
          {
            title: 'Welcome',
            backgroundColor: '#0f1420',
            elements: [
              {
                type: 'label',
                x: 140,
                y: 140,
                width: 1400,
                height: 140,
                dataJson: {
                  text: 'NoviSlides',
                  fontSize: 96,
                  fontFamily: 'Space Grotesk, Segoe UI, Arial',
                  color: '#ffffff',
                  align: 'left'
                }
              },
              {
                type: 'label',
                x: 140,
                y: 300,
                width: 1200,
                height: 80,
                dataJson: {
                  text: 'Build display-ready shows in minutes',
                  fontSize: 48,
                  fontFamily: 'Plus Jakarta Sans, Segoe UI, Arial',
                  color: '#9fb7ff',
                  align: 'left'
                }
              }
            ]
          },
          {
            title: 'Image + Caption',
            backgroundColor: '#0b0f18',
            elements: [
              {
                type: 'image',
                x: 120,
                y: 90,
                width: 1000,
                height: 360,
                dataJson: {
                  path: IMAGE_PLACEHOLDER
                }
              },
              {
                type: 'label',
                x: 120,
                y: 470,
                width: 1200,
                height: 60,
                dataJson: {
                  text: 'Add a caption to tell the story',
                  fontSize: 36,
                  fontFamily: 'Plus Jakarta Sans, Segoe UI, Arial',
                  color: '#d9e2ff',
                  align: 'left'
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'fullscreen-image',
    name: 'Fullscreen Image',
    description: 'Full-bleed imagery with subtle captions.',
    build: () => [
      {
        key: 'main',
        width: defaultResolution.width,
        height: defaultResolution.height,
        slides: [
          {
            title: 'Fullscreen One',
            backgroundImagePath: IMAGE_PLACEHOLDER,
            elements: [
              {
                type: 'label',
                x: 120,
                y: 420,
                width: 1200,
                height: 80,
                dataJson: {
                  text: 'Immersive visuals',
                  fontSize: 42,
                  fontFamily: 'Space Grotesk, Segoe UI, Arial',
                  color: '#ffffff',
                  align: 'left'
                },
                animation: 'fade'
              }
            ]
          },
          {
            title: 'Fullscreen Two',
            backgroundImagePath: IMAGE_PLACEHOLDER,
            elements: [
              {
                type: 'label',
                x: 120,
                y: 420,
                width: 1200,
                height: 80,
                dataJson: {
                  text: 'Keep it simple',
                  fontSize: 42,
                  fontFamily: 'Space Grotesk, Segoe UI, Arial',
                  color: '#f4f6ff',
                  align: 'left'
                },
                animation: 'fade'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 'info-layout',
    name: 'Info Layout',
    description: 'Left text column with right media area.',
    build: () => [
      {
        key: 'main',
        width: defaultResolution.width,
        height: defaultResolution.height,
        slides: [
          {
            title: 'Info Layout',
            backgroundColor: '#121826',
            elements: [
              {
                type: 'label',
                x: 120,
                y: 80,
                width: 520,
                height: 120,
                dataJson: {
                  text: 'Today\'s Highlights',
                  fontSize: 52,
                  fontFamily: 'Space Grotesk, Segoe UI, Arial',
                  color: '#ffffff',
                  align: 'left'
                }
              },
              {
                type: 'label',
                x: 120,
                y: 230,
                width: 520,
                height: 220,
                dataJson: {
                  text: '- New release shipped\n- Display playlists live\n- Team workshop at 3PM',
                  fontSize: 34,
                  fontFamily: 'Plus Jakarta Sans, Segoe UI, Arial',
                  color: '#cbd6f6',
                  align: 'left'
                }
              },
              {
                type: 'image',
                x: 760,
                y: 90,
                width: 1000,
                height: 360,
                dataJson: {
                  path: IMAGE_PLACEHOLDER
                }
              },
              {
                type: 'label',
                x: 760,
                y: 470,
                width: 1000,
                height: 60,
                dataJson: {
                  text: 'Right panel media',
                  fontSize: 30,
                  fontFamily: 'Plus Jakarta Sans, Segoe UI, Arial',
                  color: '#d5def5',
                  align: 'left'
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DEFAULT_TEMPLATE_KEY = templates.find((template) => template.isDefault)?.key ?? 'default-starter';
