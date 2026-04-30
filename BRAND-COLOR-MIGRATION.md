# Brand Color Migration Guide

## Overview
App has been updated to match the new landing page brand colors. The color palette now features warm, earthy tones instead of the previous navy/teal/tech aesthetic.

---

## New Brand Color Palette (Dark Mode)

### Primary Colors

**Espresso** (Background)
- Default: `#2A221C` - Main background
- Light: `#3A332C` - Cards, elevated surfaces
- Dark: `#1A1511` - Deepest shade

**Terracotta** (Primary Accent)
- Default: `#B5583E` - Main CTA, links, primary actions
- Bright: `#CC6B4F` - Hover states
- Dark: `#9A4A35` - Pressed states

**Clay** (Secondary Accent)
- Default: `#C9A687` - Secondary buttons, highlights
- Bright: `#D4B89A` - Hover states
- Dark: `#B08A66` - Subtle accents

**Bone** (Text & Light Elements)
- Default: `#F4EFE8` - Main text color
- Light: `#FBF8F3` - Lightest variant
- Dark: `#EAE3D8` - Muted text

**Stone** (Muted Text)
- Default: `#6E6358` - Secondary text
- Light: `#8F847A` - Tertiary text
- Dark: `#544A41` - Disabled text

---

## Color Mapping (Old → New)

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `navy` (#0C1030) | `espresso` (#2A221C) | Backgrounds |
| `teal` (#10C3B0) | `terracotta` (#B5583E) | Primary accents |
| `gold` (#F4B03A) | `clay` (#C9A687) | Secondary accents |
| `light` (#F2F4F8) | `bone` (#F4EFE8) | Text |
| - | `stone` (#6E6358) | Muted text |

---

## Backwards Compatibility

**Legacy class names still work!** The old color names (`navy`, `teal`, `gold`) now map to the new brand colors, so existing components won't break.

```jsx
// These all work the same:
<div className="bg-navy text-light">           {/* Legacy */}
<div className="bg-espresso text-bone">        {/* New */}
```

---

## Usage Examples

### Buttons

```jsx
// Primary button (Clay with espresso text)
<button className="btn-primary">Get Started</button>
<button className="bg-gradient-clay hover:shadow-glow-clay text-espresso">...</button>

// Secondary button (Terracotta with bone text)
<button className="btn-secondary">Learn More</button>
<button className="bg-gradient-terracotta hover:shadow-glow-terracotta text-bone">...</button>
```

### Cards

```jsx
<div className="card">
  {/* bg-espresso-light, border-terracotta/10, hover:border-terracotta/30 */}
</div>
```

### Text

```jsx
<h1 className="text-bone">Heading</h1>
<p className="text-bone-dark">Body text</p>
<span className="text-stone">Muted text</span>
```

### Backgrounds

```jsx
<section className="bg-espresso">
<div className="bg-espresso-light">
<div className="bg-gradient-espresso">
```

### Accents & Borders

```jsx
<div className="border-terracotta">
<div className="border-terracotta/20">  {/* 20% opacity */}
<div className="text-terracotta">
<div className="shadow-glow-terracotta">
```

---

## Gradients

```jsx
bg-gradient-espresso    // Dark brown gradient
bg-gradient-terracotta  // Warm red-orange gradient
bg-gradient-clay        // Muted gold gradient
```

---

## Migration Checklist

### ✅ Completed
- [x] Update `tailwind.config.js` with new brand colors
- [x] Update `app/globals.css` base styles
- [x] Add legacy color mappings for backwards compatibility
- [x] Update component utility classes (`.btn-primary`, `.btn-secondary`, `.card`)
- [x] Commit and push changes

### 🔄 Next Steps
- [ ] Test the app visually to ensure colors look good
- [ ] Check for hardcoded hex values in components
- [ ] Update any custom gradients or shadows
- [ ] Rebuild and deploy to see changes live
- [ ] Consider updating the logo/favicon to match new brand (if needed)

### 🎨 Optional Enhancements
- [ ] Create additional utility classes for common patterns
- [ ] Add color documentation to component library
- [ ] Update design tokens in Figma (if applicable)
- [ ] Create branded illustrations/graphics with new palette

---

## Testing the Changes

1. **Local development:**
   ```bash
   cd ~/oneclickcoaching/web
   npm run dev
   ```

2. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

3. **Visual check:**
   - Login page should have espresso background with terracotta accents
   - Buttons should use clay (primary) and terracotta (secondary)
   - Text should be bone/stone instead of light gray
   - Cards should have subtle terracotta borders

---

## Deployment

The changes are committed to the `landing-page` branch. To deploy:

1. Verify changes locally first
2. Merge `landing-page` → `main` when ready
3. Vercel will auto-deploy on push to main
4. Monitor the deployment at https://oneclickcoaching-xeso.vercel.app/login

---

## Support

If any components look broken or colors seem off:
1. Check if the component uses hardcoded hex values (search for `#10C3B0`, `#0C1030`, etc.)
2. Replace with Tailwind classes: `text-terracotta`, `bg-espresso`, etc.
3. Test in different states (hover, active, disabled)

---

**Brand Colors Match:**
✅ Landing page: oneclickcoaching.com (warm, earthy, professional)
✅ App: app.oneclickcoaching.com (same palette in dark mode)

Clean, consistent brand experience from marketing to product.
