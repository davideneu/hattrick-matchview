# Outdated Documentation Notice

The following documentation files describe the previous DOM-parsing implementation and are now **OUTDATED**:

- `MATCH_DATA_EXTRACTION.md` - Described DOM parsing extraction
- `CHPP_AUTHENTICATION_ANSWER.md` - Mentioned fallback to DOM parsing
- `IMPLEMENTATION_SUMMARY.md` - Described dual API/DOM approach
- `TESTING_GUIDE.md` - Included DOM parsing tests
- `FIX_DATA_LOADING.md` - DOM parsing specific fixes
- `FIX_NAVIGATION_FILTERING.md` - DOM parsing specific fixes
- `FIX_SHOP_LINK_FILTERING.md` - DOM parsing specific fixes

## Current Implementation

The extension now uses **CHPP API exclusively**. See:

- [README.md](README.md) - Main documentation
- [CHPP_API_INTEGRATION.md](CHPP_API_INTEGRATION.md) - Current API implementation

## Key Changes

1. **Removed**: All DOM parsing code and fallback mechanisms
2. **Added**: Default test credentials for quick setup
3. **Simplified**: API-only architecture for better reliability
4. **Updated**: Settings UI to support default or custom credentials

These files are kept for historical reference but should not be used for current development.
