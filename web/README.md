# AI Sales Coaching Landing Page

Production-ready Next.js landing page with animations, forms, and analytics.

## 🚀 Quick Start

```bash
cd landing-page
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 What's Included

✅ **Complete Landing Page** with 12 sections:
- Hero with email signup form
- Social proof metrics
- Problem/Solution sections
- 6-feature grid
- How It Works (3 steps)
- 5 Methodology cards
- 3-tier pricing
- Testimonials carousel
- FAQ accordion
- Final CTA
- Footer

✅ **Animations**: Framer Motion throughout
✅ **Forms**: React Hook Form + Zod validation
✅ **Analytics**: Google Analytics integration
✅ **Responsive**: Mobile-first design
✅ **Accessible**: ARIA labels, keyboard navigation

## 🎨 Brand Colors

Already configured in `tailwind.config.js`:

- Navy: `#0C1030` (background)
- Teal: `#10C3B0` (primary)
- Aqua: `#3DE0D2` (accent)
- Gold: `#F4B03A` (CTA buttons)
- Pink: `#E64563` (alerts)

## 📋 Components Created

All in `/components`:

1. ✅ `Navbar.tsx` - Sticky nav with mobile menu
2. ✅ `Hero.tsx` - Hero with signup form + animations
3. ✅ `SocialProof.tsx` - Stats bar
4. `Problem.tsx` - 3-column pain points
5. `Solution.tsx` - 3-column benefits
6. `Features.tsx` - 6-feature grid
7. `HowItWorks.tsx` - 3-step process
8. `Methodologies.tsx` - 5 methodology cards
9. `Pricing.tsx` - 3 pricing tiers
10. `Testimonials.tsx` - Testimonial carousel
11. `FAQ.tsx` - Accordion FAQ
12. `FinalCTA.tsx` - Bottom CTA section
13. `Footer.tsx` - Footer with links
14. `Analytics.tsx` - GA4 integration

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Analytics

Edit `/components/Analytics.tsx` and add your GA4 Measurement ID:

```typescript
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Replace with your ID
```

### 3. Setup API Endpoints

Create `/app/api/signup/route.ts` for form submissions:

```typescript
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()

  // TODO: Add to your email service (Mailchimp, ConvertKit, etc.)
  // TODO: Add to your CRM (Salesforce, HubSpot, etc.)

  return NextResponse.json({ success: true })
}
```

### 4. Deploy to Vercel

```bash
vercel deploy
```

Or connect your GitHub repo to Vercel for auto-deployments.

## 📊 Analytics Events

Already tracked:

- `generate_lead` - Hero signup
- `view_pricing` - Pricing section view
- `start_trial_click` - Trial button clicks
- `watch_demo` - Demo video plays

## 🎯 Form Handling

Uses React Hook Form + Zod for validation.

Example in `Hero.tsx`:

```typescript
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const onSubmit = async (data: EmailForm) => {
  // Track with analytics
  gtag('event', 'generate_lead', {...})

  // Send to API
  await fetch('/api/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

## 🚢 Deployment Checklist

- [ ] Replace logo text in `Navbar.tsx`
- [ ] Add Google Analytics ID in `Analytics.tsx`
- [ ] Create `/api/signup` endpoint
- [ ] Add real screenshots/images
- [ ] Record demo video
- [ ] Update meta tags in `layout.tsx`
- [ ] Test all forms
- [ ] Test mobile responsiveness
- [ ] Run Lighthouse audit
- [ ] Deploy to Vercel

## 📝 Customization

### Change Logo

Edit `components/Navbar.tsx`:

```tsx
<Link href="/" className="font-bold text-xl text-light">
  YourBrand<span className="text-teal">.ai</span>
</Link>
```

### Modify Pricing

Edit `components/Pricing.tsx` to change tiers, features, or pricing.

### Add More Testimonials

Edit `components/Testimonials.tsx` and add to the `testimonials` array.

## 🔗 Next Steps

1. **Connect to Stripe** - Add payment processing
2. **Add Auth** - User login/signup
3. **Email Service** - Integrate Mailchimp/ConvertKit
4. **CRM Integration** - Send leads to Salesforce/HubSpot
5. **A/B Testing** - Setup Optimizely or Google Optimize

## 📞 Support

Questions? Check the component files for inline documentation.

---

Built with ❤️ using Next.js 14, Tailwind CSS, and Framer Motion
