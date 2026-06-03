# Ronflow Chrome Extension

AI-powered workflow capture extension that automatically records your browser interactions and generates procedural documentation.

## Features

- **One-Click Recording**: Start/stop recording with a single click or keyboard shortcut (Ctrl+Shift+R)
- **Automatic Capture**: Records clicks, form inputs, navigation, and scrolls
- **Smart Screenshot**: Captures screenshots after each interaction
- **Sensitive Data Protection**: Automatically redacts passwords, credit cards, SSNs, and other sensitive fields
- **Floating Toolbar**: Real-time step counter and recording status
- **AI Processing**: Sends captured workflows to Ronflow server for AI narration and documentation generation

## Installation

### Development Mode

1. **Build the extension**:
   ```bash
   cd ronflow/extension
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `ronflow/extension/dist` folder

3. **Configure Server URL** (optional):
   - Click the Ronflow extension icon
   - The server URL is shown at the bottom (default: http://localhost:3000)
   - To change it, open extension storage via Chrome DevTools

### Production Build

```bash
npm run build
npm run zip
```

This creates `ronflow-extension.zip` ready for Chrome Web Store submission.

## Usage

1. **Start Recording**:
   - Click the Ronflow extension icon
   - Click "Start Recording" button
   - Or use keyboard shortcut: `Ctrl+Shift+R`

2. **Perform Your Workflow**:
   - Navigate through your application as normal
   - Click buttons, fill forms, select options
   - The floating toolbar shows captured steps in real-time

3. **Pause/Resume** (optional):
   - Click "Pause" to temporarily stop capturing
   - Click "Resume" to continue

4. **Stop & Process**:
   - Click "Stop & Process" when done
   - The extension sends data to Ronflow server
   - A new browser tab opens with your generated documentation

## File Structure

```
extension/
├── manifest.json          # Chrome extension configuration
├── popup.html             # Extension popup UI
├── src/
│   ├── background.js      # Service worker (screenshots, session management)
│   ├── content.js         # Content script (event capture, toolbar)
│   └── popup.js           # Popup logic
├── icons/
│   ├── icon16.svg         # Extension icon (16x16)
│   ├── icon48.svg         # Extension icon (48x48)
│   └── icon128.svg        # Extension icon (128x128)
├── vite.config.js         # Vite build configuration
├── package.json           # Extension dependencies
└── zip-extension.js       # Packaging script
```

## Permissions Explained

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab for recording |
| `storage` | Store session data and settings |
| `tabs` | Get tab information (URL, title) |
| `scripting` | Inject content scripts |
| `webNavigation` | Detect page navigation events |
| `<all_urls>` | Work on any website |

## Sensitive Field Detection

The extension automatically detects and redacts these field types:
- Password fields (`type="password"`)
- Fields with names/IDs containing: `password`, `secret`, `token`, `api_key`, `ssn`, `card`, `cvv`, `pin`

Redacted fields show `[REDACTED]` instead of actual values.

## API Integration

The extension communicates with the Ronflow backend at:
- Default: `http://localhost:3000`
- Endpoint: `POST /api/sessions`

To change the server URL, update `ronflowServerUrl` in Chrome storage:

```javascript
chrome.storage.local.set({ ronflowServerUrl: 'https://your-server.com' });
```

## Troubleshooting

### Extension not capturing events
- Ensure you granted all required permissions
- Check that the content script loaded (look for "[Ronflow]" logs in DevTools Console)
- Try refreshing the page

### Screenshots not working
- Ensure `activeTab` permission is granted
- Some pages (chrome://, about:blank) block screenshot capture
- Check browser console for errors

### Server connection failed
- Verify the Ronflow backend is running
- Check the server URL in the popup
- Ensure CORS is enabled on the backend

## Development

### Watch Mode
```bash
npm run dev
```

Auto-rebuilds on file changes. Reload extension in `chrome://extensions/` to apply changes.

### Debugging
1. Open `chrome://extensions/`
2. Find Ronflow extension
3. Click "Inspect views: background page" for service worker logs
4. Open DevTools on any webpage for content script logs

## Building for Chrome Web Store

1. Update version in `manifest.json`
2. Run `npm run build && npm run zip`
3. Upload `ronflow-extension.zip` to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Fill out store listing details
5. Submit for review

## License

Apache 2.0 - See LICENSE file in root directory
