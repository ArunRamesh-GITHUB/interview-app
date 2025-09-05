# App Icons, Splash Screens & Store Assets

## ✅ Completed Assets

### App Icons (Mobile Shell)
- ✅ **App Icon** (`mobile-shell/assets/icon.png`) - 1024×1024 placeholder
- ✅ **Adaptive Icon** (`mobile-shell/assets/adaptive-icon.png`) - 1024×1024 placeholder
- ✅ **Splash Screen** (`mobile-shell/assets/splash.png`) - 1200×1200 placeholder

**Note:** Current assets are simple blue placeholder icons with white background. Replace with your brand design.

## 📋 Required Store Assets (Not Yet Created)

### Google Play Store
Create in `assets/store/android/`:
- **Feature Graphic**: 1024×500 pixels (required)
- **Screenshots**: 
  - Phone: 1080×1920 to 3840×2160 pixels
  - Tablet: 1200×1800 to 3840×2160 pixels
  - At least 2 screenshots required, up to 8 allowed
- **Promo Video** (optional): YouTube URL

### Apple App Store  
Create in `assets/store/ios/`:
- **Screenshots** (required for each device type):
  - iPhone 6.9": 1320×2868 pixels
  - iPhone 6.7": 1290×2796 pixels  
  - iPhone 6.5": 1242×2688 pixels
  - iPhone 5.5": 1242×2208 pixels
  - iPad Pro (6th Gen): 2048×2732 pixels
  - iPad Pro (5th Gen): 2048×2732 pixels
- **App Preview Videos** (optional): .mov, .mp4, or .m4v format

## 🎨 Asset Creation Guidelines

### App Icon Requirements
- **Size**: 1024×1024 pixels minimum
- **Format**: PNG with transparency
- **Design**: 
  - Simple, recognizable at small sizes
  - Avoid text (will be hard to read)
  - Use high contrast colors
  - Follow platform design guidelines

### Splash Screen Requirements  
- **iOS**: Uses app icon on solid background (configured in app.json)
- **Android**: Custom image with safe area considerations
- **Design**: Keep important elements in center 50% of screen

### Screenshot Guidelines
- **Show core features**: Highlight main app functionality
- **Use real content**: Avoid Lorem ipsum text
- **Include captions**: Brief descriptions of features shown
- **High quality**: Use device frames, good lighting
- **Localization**: Consider different languages for global apps

## 📱 Current App Configuration

### Mobile Shell (mobile-shell/app.json)
```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain", 
    "backgroundColor": "#ffffff"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  }
}
```

## 🔄 Asset Replacement Checklist

When replacing placeholder assets:

### App Icons
- [ ] Create 1024×1024 master icon
- [ ] Replace `mobile-shell/assets/icon.png`
- [ ] Replace `mobile-shell/assets/adaptive-icon.png` (Android foreground)
- [ ] Update `adaptive-icon.backgroundColor` in app.json if needed
- [ ] Test on both platforms to ensure proper display

### Splash Screen
- [ ] Create splash screen design
- [ ] Replace `mobile-shell/assets/splash.png`
- [ ] Update `splash.backgroundColor` in app.json to match design
- [ ] Test splash screen timing and appearance

### Store Assets
- [ ] Create Android feature graphic (1024×500)
- [ ] Capture Android screenshots (multiple screen sizes)
- [ ] Capture iOS screenshots (all required device sizes)
- [ ] Create app preview videos (optional but recommended)
- [ ] Prepare marketing copy to accompany visuals

## 🛠 Asset Generation Tools

### Recommended Tools
- **Figma**: Professional design with export presets
- **Sketch**: iOS/Android asset export
- **Adobe XD**: Multi-platform design system
- **Canva**: Templates for non-designers
- **App Icon Generator**: Online icon resizing tools

### Expo Tools
```bash
# Validate assets
npx expo install --check

# Preview app icon
expo start --web
```

## ⚠️ Important Notes

1. **Placeholder Status**: All current assets are basic placeholders
2. **Brand Consistency**: Ensure all assets follow brand guidelines  
3. **Platform Guidelines**: Follow Apple HIG and Material Design
4. **File Sizes**: Optimize images to reduce app bundle size
5. **Copyright**: Only use assets you own or have rights to use

## 📋 Next Steps

1. **Design Phase**:
   - Define brand colors, logo, and style
   - Create mood board and style guide
   - Design app icon variations

2. **Creation Phase**:
   - Create master 1024×1024 app icon
   - Generate platform-specific assets
   - Create splash screen design
   - Capture marketing screenshots

3. **Implementation Phase**:
   - Replace placeholder assets
   - Update app.json configuration
   - Test on physical devices
   - Prepare store listing assets

4. **Validation Phase**:
   - Test app icon at various sizes
   - Verify splash screen behavior
   - Review store asset quality
   - Get team/user feedback

---
*Replace all placeholder assets before store submission*