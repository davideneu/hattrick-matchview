# Hattrick Matchview

Hattrick Matchview is a visualization layer for following matches of the online game Hattrick.

## Features

- 🎯 Real-time match visualization
- ⚽ Enhanced match event display
- 📊 Match statistics overlay
- 🎨 Modern, intuitive interface
- 🔌 **CHPP API integration** for reliable data access
- 🔐 Secure OAuth authentication
- 🚀 Quick setup with default test credentials

## Installation

### For Development

1. Clone this repository:
   ```bash
   git clone https://github.com/davideneu/hattrick-matchview.git
   cd hattrick-matchview
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the `hattrick-matchview` directory

3. The extension icon should appear in your Chrome toolbar!

### For Users

_(Publishing to Chrome Web Store coming soon)_

## Usage

1. Navigate to [Hattrick.org](https://www.hattrick.org)
2. Click the extension icon to open settings
3. **Quick Start:** Click "⚙️ Settings" → "🔐 Authenticate" (uses default test credentials)
4. Go to any match page
5. Click "📊 Show Match Data" to see enhanced match information

### Setting Up CHPP API Access

The extension comes with default test credentials for quick setup. For production use or personal preferences:

1. Register an application at [Hattrick CHPP](https://www.hattrick.org/Community/CHPP/)
2. Click the extension icon → **⚙️ Settings**
3. Enter your Consumer Key and Consumer Secret (or leave empty for test credentials)
4. Click **Authenticate** and approve the application

The extension uses the Hattrick CHPP API to fetch match data reliably and securely.

## Project Structure

```
hattrick-matchview/
├── manifest.json          # Extension configuration
├── popup/                 # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/              # Content scripts (runs on Hattrick pages)
│   ├── content.js
│   └── content.css
├── background/           # Background service worker
│   └── background.js
└── icons/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development

This extension uses Chrome Manifest V3 (the latest standard).

### Key Files

- **manifest.json**: Defines extension configuration, permissions, and components
- **popup/**: The UI that appears when clicking the extension icon
- **content/**: Scripts that run on Hattrick web pages
- **background/**: Service worker for background tasks and event handling

### Testing

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Hattrick Matchview extension
4. Test your changes on Hattrick.org

**Note:** DOM parsing tests have been removed as the extension now uses CHPP API exclusively.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning and development.

## Roadmap

- [ ] Match event timeline visualization
- [ ] Live match animations
- [ ] Match statistics dashboard
- [ ] Historical match comparison
- [ ] Export match data
- [ ] Customizable themes

## About Hattrick

[Hattrick](https://www.hattrick.org) is a free online football (soccer) management game where you manage your own team. This extension enhances the match viewing experience.
