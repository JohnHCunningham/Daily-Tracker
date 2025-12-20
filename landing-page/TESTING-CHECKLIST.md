# Production Testing Checklist

Test URL: https://daily-tracker-ky8x.vercel.app

## Pages to Test

### ✅ Homepage (/)
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] "Your Sales Methodology Isn't the Problem. Execution Is." heading visible
- [ ] All sections load:
  - [ ] Hero
  - [ ] Social Proof
  - [ ] Problem section
  - [ ] UVP section
  - [ ] Solution section
  - [ ] Features section
  - [ ] How It Works
  - [ ] Methodologies section
  - [ ] The Science section
  - [ ] Qualification section
  - [ ] Pricing section
  - [ ] Testimonials
  - [ ] FAQ
  - [ ] Contact form
  - [ ] Final CTA
  - [ ] Footer
- [ ] All images load
- [ ] Animations work smoothly
- [ ] No console errors
- [ ] Mobile responsive (test on phone or resize browser)

### ✅ Blog Pages
- [ ] `/blog` - Blog listing page loads
- [ ] `/blog/sandler-methodology-execution-gap` loads
- [ ] `/blog/meddic-qualification-ai-analysis` loads
- [ ] `/blog/talk-ratio-killing-sales` loads
- [ ] All blog posts display correctly
- [ ] Images in blog posts load
- [ ] Navigation between posts works

### ✅ Legal Pages
- [ ] `/privacy` - Privacy Policy loads
- [ ] `/security` - Security page loads
- [ ] `/terms` - Terms of Service loads
- [ ] All content displays correctly
- [ ] Links work (especially back to home)

---

## Interactive Features to Test

### ✅ Navigation
- [ ] Navbar appears at top
- [ ] Logo links to homepage
- [ ] Navigation menu items work:
  - [ ] Features (scrolls to #features)
  - [ ] Methodologies (scrolls to #methodologies)
  - [ ] Pricing (scrolls to #pricing)
  - [ ] Blog (goes to /blog)
  - [ ] Login button visible
  - [ ] "Start Free Trial" CTA button visible
- [ ] Smooth scrolling works
- [ ] Mobile menu works (hamburger icon on mobile)

### ✅ Chatbot (CRITICAL)
- [ ] **Chatbot button appears in bottom right corner**
  - Teal/aqua gradient circle
  - White chat bubble icon
  - Pink pulse indicator
- [ ] Click chatbot button - window opens
- [ ] Chat window displays correctly
- [ ] Initial greeting appears: "Hi! 👋 I'm here to help you understand how SalesAI.Coach..."
- [ ] **Send test message**: "What is SalesAI?"
  - [ ] AI responds (not error message)
  - [ ] Response is relevant and helpful
  - [ ] Typing indicator shows while loading
- [ ] **Test lead capture**: "My name is John Smith from Acme Corp, email john@acme.com"
  - [ ] AI acknowledges the information
  - [ ] Check n8n webhook receives the lead data
- [ ] **Test booking**: "I'd like to schedule a call"
  - [ ] AI suggests "Execution Exploration"
  - [ ] Provides correct TidyCal link
  - [ ] Uses positioning: "not a product demo - focused conversation"
- [ ] Close chatbot - it closes smoothly
- [ ] Reopen chatbot - conversation history persists
- [ ] Auto-scroll to latest message works
- [ ] Mobile: Chatbot works on phone (responsive sizing)

### ✅ Contact Form
- [ ] Form appears in Contact section
- [ ] All fields present:
  - [ ] Name (required)
  - [ ] Email (required)
  - [ ] Company (required)
  - [ ] Website (optional)
  - [ ] LinkedIn Profile (optional)
  - [ ] Phone (optional)
  - [ ] Message (required)
- [ ] **Test validation**:
  - [ ] Try submitting empty form - shows errors
  - [ ] Enter invalid email - shows error
  - [ ] Enter invalid URL for website - shows error
- [ ] **Submit valid form**:
  - [ ] Fill all required fields
  - [ ] Submit
  - [ ] Success message appears
  - [ ] Check n8n webhook receives form data
  - [ ] Form resets after submission
- [ ] Form is mobile responsive

### ✅ Pricing Section
- [ ] All 3 pricing tiers display:
  - [ ] Pro ($99/month per rep)
  - [ ] Team ($79/month per rep, 5-20 reps)
  - [ ] Enterprise (Custom pricing, 20+ reps)
- [ ] All features listed correctly
- [ ] "Start Free Trial" buttons work
- [ ] 30-day money-back guarantee visible

### ✅ FAQ Section
- [ ] FAQ accordion works
- [ ] Click question - answer expands
- [ ] Click again - answer collapses
- [ ] All questions and answers display correctly
- [ ] Chevron icon rotates when expanding

### ✅ Footer
- [ ] Footer displays at bottom
- [ ] All links work:
  - [ ] Features, Methodologies, Pricing (scroll to sections)
  - [ ] Resources links
  - [ ] Security link (goes to /security)
  - [ ] Privacy Policy (goes to /privacy)
  - [ ] Terms of Service (goes to /terms)
  - [ ] Contact
- [ ] Email link works: john@aiadvantagesolutions.ca
- [ ] Phone link works: (905) 519-8983
- [ ] Social media icons present (LinkedIn, Twitter, YouTube)
- [ ] Copyright year is current

---

## Browser Console Check

Open browser DevTools (F12) → Console tab:

- [ ] **No red errors** (some warnings are OK)
- [ ] Chatbot debug messages don't appear (we removed them)
- [ ] No 404 errors for missing files
- [ ] Ignore:
  - ✅ `ERR_BLOCKED_BY_CLIENT` (ad blocker)
  - ✅ `favicon.ico 404` (cosmetic)
  - ✅ Zustand deprecation warnings (harmless)

---

## Performance Check

- [ ] **Lighthouse Score** (Chrome DevTools → Lighthouse):
  - [ ] Performance: 80+ (green)
  - [ ] Accessibility: 90+ (green)
  - [ ] Best Practices: 90+ (green)
  - [ ] SEO: 90+ (green)
- [ ] Page loads in under 3 seconds
- [ ] Images load quickly (optimized)
- [ ] No layout shift when loading
- [ ] Smooth animations (no jank)

---

## Mobile Testing

Test on actual phone or use Chrome DevTools → Toggle Device Toolbar:

- [ ] **iPhone 12/13/14** view:
  - [ ] All content visible
  - [ ] Text is readable (not too small)
  - [ ] Buttons are tappable (not too small)
  - [ ] Chatbot button accessible
  - [ ] Chatbot window fits screen
  - [ ] Forms work correctly
  - [ ] Navigation menu works
- [ ] **iPad** view:
  - [ ] Layout adjusts appropriately
  - [ ] Two-column layouts work
  - [ ] Navigation menu works
- [ ] **Android phone** view:
  - [ ] All features work
  - [ ] No Android-specific issues

---

## Cross-Browser Testing

Test in multiple browsers:

- [ ] **Chrome** (primary)
- [ ] **Safari** (Mac/iPhone)
- [ ] **Firefox**
- [ ] **Edge**

Check for:
- [ ] All pages load correctly
- [ ] Chatbot works in all browsers
- [ ] Animations work smoothly
- [ ] No browser-specific bugs

---

## Integration Testing

### n8n Webhook
- [ ] **Chatbot lead capture** sends to n8n:
  - [ ] Provide name, email, company in chat
  - [ ] Check n8n workflow receives data
  - [ ] Correct data format
- [ ] **Contact form** sends to n8n:
  - [ ] Submit form
  - [ ] Check n8n workflow receives data
  - [ ] All form fields present in webhook data

### OpenAI API
- [ ] **Chatbot AI responses** work:
  - [ ] Send multiple test messages
  - [ ] AI responds intelligently
  - [ ] Responses are relevant to SalesAI.Coach
  - [ ] No "I'm having trouble connecting" errors
  - [ ] Check OpenAI dashboard for API calls

---

## SEO Check

- [ ] **Meta tags** present (View Page Source):
  - [ ] `<title>` tag exists
  - [ ] `<meta name="description">` exists
  - [ ] Open Graph tags for social sharing
- [ ] **Structured data** (if applicable)
- [ ] **Sitemap** accessible: /sitemap.xml (if generated)
- [ ] **Robots.txt** accessible: /robots.txt

---

## Security Check

- [ ] **HTTPS** enabled (URL starts with https://)
- [ ] **No exposed API keys** in:
  - [ ] Page source
  - [ ] Network tab
  - [ ] Console logs
- [ ] **Environment variables** not visible in browser
- [ ] **Forms** don't expose sensitive data in URLs

---

## Test Scenarios

### User Journey 1: Curious Visitor
1. [ ] Land on homepage
2. [ ] Read hero section
3. [ ] Scroll through features
4. [ ] Check pricing
5. [ ] Open chatbot
6. [ ] Ask: "Does this work with Sandler?"
7. [ ] AI should respond with Sandler support info
8. [ ] Close chat
9. [ ] Navigate to blog
10. [ ] Read a blog post

### User Journey 2: Qualified Lead
1. [ ] Land on homepage
2. [ ] Open chatbot immediately
3. [ ] Chat: "I have a team of 10 sales reps using MEDDIC"
4. [ ] AI should recognize qualified lead
5. [ ] Chat: "I'm interested in booking a call"
6. [ ] AI suggests Execution Exploration
7. [ ] Provides TidyCal link
8. [ ] Chat: "My name is Jane Doe, email jane@company.com"
9. [ ] AI acknowledges and captures info
10. [ ] Check n8n receives lead data

### User Journey 3: Information Seeker
1. [ ] Land on homepage
2. [ ] Scroll to FAQ
3. [ ] Expand several questions
4. [ ] Click "Security" link in footer
5. [ ] Read security page
6. [ ] Go back to homepage
7. [ ] Fill out contact form
8. [ ] Submit successfully
9. [ ] Check n8n receives form data

---

## Final Checks

- [ ] **All tests above passed**
- [ ] **No critical bugs found**
- [ ] **Chatbot working perfectly**
- [ ] **Forms submitting correctly**
- [ ] **n8n integrations working**
- [ ] **Mobile experience is good**
- [ ] **Performance is acceptable**

---

## Known Issues to Ignore

These are expected and don't need fixing:

✅ `ERR_BLOCKED_BY_CLIENT` - Ad blocker blocking Google Analytics
✅ `favicon.ico 404` - No favicon set up yet (cosmetic)
✅ Zustand deprecation warnings - Dependency warning (harmless)
✅ Injectable content messages - Browser extension (harmless)

---

## If You Find Bugs

Document each bug with:
1. **What page/feature** has the issue
2. **Steps to reproduce** the bug
3. **Expected behavior** vs actual behavior
4. **Browser** and device you're testing on
5. **Screenshots** if visual bug
6. **Console errors** if applicable

---

Last updated: December 2024
