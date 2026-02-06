```meta
title: Advanced Configuration
summary: Advanced topics on configuring NoviSlides
icon: settings
order: 100
```

## Advanced Configuration

### Setting up Google Fonts
- Open the editor settings modal and add your Google Fonts API key under **Google Fonts**.
- The key is stored in the database as tenant settings.
- If `GOOGLE_FONTS_API_KEY` is set when the app starts, that value is written to tenant settings and the Google Fonts input is hidden for that runtime.
