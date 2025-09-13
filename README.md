# AI Voice Recorder Chrome Extension

This Chrome extension allows users to record audio in the background. It features a popup page with media controls for recording, playing, and saving the recorded audio locally as MP3 or WAV files.

## Features

- 🎙️ **Background Recording**: Record audio that continues even when the popup is closed or when navigating to different tabs
- 🔴 **Visual Indicator**: Extension badge shows red dot when recording is active
- 💾 **Local Save**: Download recordings as WAV or MP3 files
- 🎛️ **Media Controls**: Simple play, stop, and download controls
- 🚀 **Modern Tech Stack**: Built with React, TypeScript, and Vite

## Installation

### For Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the `dist` folder

### For Users

1. Download the built extension from the releases
2. Load in Chrome as described above in step 4

## Usage

1. **Start Recording**: Click the extension icon and press the red "Start Recording" button
2. **Background Operation**: Close the popup - recording continues! The extension badge shows a red dot (●) when recording
3. **Stop Recording**: Open the popup again and click "Stop Recording"
4. **Save Audio**: Choose "Save as WAV" or "Save as MP3" to download your recording

## Permissions

The extension requires these permissions:
- `storage` - Store extension state
- `activeTab` - Access current tab info
- `offscreen` - Create background audio recording document
- `downloads` - Save recorded files to your computer

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome Extension API
- **Service Worker**: Background script handles recording state
- **Offscreen Document**: Handles `getUserMedia()` for audio capture
- **React Popup**: Modern UI built with React and TypeScript

### File Structure

```
├── src/
│   ├── components/          # React components
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS styles
│   ├── background.ts       # Service worker
│   ├── offscreen.ts        # Offscreen document for audio
│   └── popup.tsx           # Main popup entry
├── manifest.json           # Extension manifest
├── popup.html             # Popup HTML
└── offscreen.html         # Offscreen document HTML
```

## Development

### Scripts

- `npm run dev` - Development server (for testing components)
- `npm run build` - Build production extension
- `npm run preview` - Preview built extension

### Building

The build process:
1. TypeScript compilation
2. Vite bundling for optimized output
3. Generates `dist/` folder ready for Chrome

## Troubleshooting

### Recording Not Working
- Ensure microphone permissions are granted
- Check that no other applications are using the microphone
- Try refreshing the extension or reloading it

### Files Not Downloading
- Check Chrome's download settings
- Ensure the Downloads API permission is granted
- Try a different download location

## Browser Support

- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers with Manifest V3 support

## License

ISC License - see LICENSE file for details.
