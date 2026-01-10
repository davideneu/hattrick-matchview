# Quick Start Guide

Welcome to your first Chrome extension! 🎉

## Installation in 3 Steps

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" → Select this folder

That's it! Your extension is now installed! 🚀

## What You'll See

- Extension icon in your Chrome toolbar
- Click it to see the popup interface
- Visit hattrick.org to see it activate
- On match pages, you'll see an indicator

## Development Workflow

1. **Make changes** to any file (popup, content, background)
2. **Refresh** the extension at `chrome://extensions/`
3. **Test** your changes on hattrick.org
4. **Repeat**!

## File Guide

### Want to change the popup?
→ Edit `popup/popup.html`, `popup/popup.css`, or `popup/popup.js`

### Want to modify Hattrick pages?
→ Edit `content/content.js` and `content/content.css`

### Want background functionality?
→ Edit `background/background.js`

### Want to change settings?
→ Edit `manifest.json`

## Debugging Tips

### Debug the popup:
1. Click extension icon
2. Right-click anywhere in popup
3. Select "Inspect"

### Debug content scripts:
1. Visit hattrick.org
2. Open DevTools (F12)
3. Check Console for logs

### Debug background worker:
1. Go to `chrome://extensions/`
2. Click "Service worker" under your extension
3. Check Console

## Common Tasks

### Add a new permission:
```json
// In manifest.json
"permissions": [
  "activeTab",
  "storage"  // Add new permission
]
```

### Run code on page load:
```javascript
// In content/content.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded!');
  // Your code here
});
```

### Save user settings:
```javascript
// Use Chrome storage API
chrome.storage.local.set({ key: 'value' });
chrome.storage.local.get(['key'], (result) => {
  console.log(result.key);
});
```

## Resources

- 📚 [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- 🎓 [Getting Started Tutorial](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- 💬 [Stack Overflow - Chrome Extensions](https://stackoverflow.com/questions/tagged/google-chrome-extension)

## Need Help?

Check the `README.md` and `SETUP_COMPLETE.md` for more detailed information.

Happy coding! 🎨⚽
