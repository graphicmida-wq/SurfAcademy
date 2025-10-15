# Design Guidelines - Scuola di Longboard Platform

## Design Approach
**Reference-Based with Surf Culture Enhancement**: Drawing inspiration from modern sports platforms like Strava and Headspace for progression tracking, combined with the vibrant, energetic aesthetic of surf culture. The design celebrates the Italian coastal lifestyle while maintaining professional learning platform standards.

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- Turchese Surf: 174 85% 43% (from logo - primary brand color)
- Slate Blue: 200 23% 36% (from logo - secondary/text)
- Ocean Deep: 195 100% 15% (dark mode backgrounds, footers)

**Accent & Supporting:**
- Sandy Beige: 40 60% 88% (warm contrast, beach vibes)
- Coral Sunset: 15 85% 65% (CTAs, urgent actions)
- Sea Foam: 174 60% 92% (subtle backgrounds, cards)
- Wave White: 0 0% 98% (light backgrounds)

**Semantic Colors:**
- Success/Progress: 142 70% 45% (achievements, completed)
- Warning: 38 92% 50% (alerts, waitlist)
- Error: 0 70% 50% (validation, critical)

### B. Typography

**Font Families:**
- Display/Headers: "Montserrat" (bold, semi-bold) - modern surf culture aesthetic
- Body Text: "Inter" (regular, medium) - clean readability
- Accent/Logo: Custom integration of logo typography style

**Scale:**
- Hero Headline: 64px (mobile: 36px) - bold, uppercase spacing
- Page Titles: 48px (mobile: 28px) - semi-bold
- Section Headers: 32px (mobile: 24px) - semi-bold
- Card Titles: 24px - medium
- Body: 16px - regular, line-height 1.6
- Small/Meta: 14px - medium

### C. Layout System

**Spacing Primitives:**
- Primary units: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Consistent vertical rhythm: py-16 (mobile), py-24 (tablet), py-32 (desktop)
- Card padding: p-6 (mobile), p-8 (desktop)
- Section gaps: gap-8 (mobile), gap-12 (desktop)

**Grid Structure:**
- Container: max-w-7xl with px-4 (mobile), px-8 (desktop)
- Content sections: max-w-6xl for optimal reading
- Course grids: 1-col (mobile), 2-col (tablet), 3-col (desktop)
- Dashboard: 1-col (mobile), 2-col split (desktop)

### D. Component Library

**Navigation:**
- Top navbar: transparent over hero, solid white on scroll
- Logo prominent left, main nav center, user actions right
- Mobile: hamburger menu with full-screen overlay
- Sticky behavior with elevation shadow on scroll

**Cards:**
- Course cards: rounded-2xl, shadow-lg, hover:scale-102 transition
- Profile cards: border-2 border-turchese, subtle shadow
- Video thumbnails: aspect-video, play icon overlay, gradient overlay bottom
- Exercise cards: compact, checkbox left, timer display right

**Buttons:**
- Primary CTA: bg-coral, hover:darker, rounded-full, px-8 py-4
- Secondary: outline-turchese, hover:bg-turchese hover:text-white
- Tertiary: text-slate, hover:text-turchese, underline
- On images: backdrop-blur-md bg-white/20 text-white (no hover changes)

**Forms & Inputs:**
- Input fields: border-2 focus:border-turchese, rounded-lg, py-3 px-4
- Dark mode: bg-slate-800 text-white border-slate-600
- Labels: text-sm font-medium text-slate-700
- Validation: inline messages, icons for success/error

**Progress Indicators:**
- Level badges: circular, gradient (beginner: green, intermediate: turchese, advanced: coral)
- Progress bars: h-3, rounded-full, gradient fill, animated on milestone
- Gamification badges: surfboard icons, wave patterns, achievement cards

**Video Player:**
- Custom controls with turchese accents
- Progress bar: turchese fill on slate background
- Fullscreen button, speed control, quality selector
- Bookmark timestamps feature

### E. Animations

**Sparingly Applied:**
- Hero: subtle parallax scroll effect on background
- Cards: scale on hover (scale-102), smooth 300ms transition
- Page transitions: fade-in content 200ms
- Skeleton loaders: pulse animation for loading states
- Progress celebrations: confetti effect on course completion (lightweight)

## Layout Specifications

### Homepage
- **Hero Section:** Full viewport (100vh) with video/image background, dark gradient overlay (ocean-deep 70%), centered logo + headline + dual CTAs ("Inizia Gratis" coral, "Scopri Corsi" outline-white-blur)
- **Levels Overview:** 3-column grid (mobile: 1-col), each with surfista silhouette icon, level name, brief description, "Esplora" link
- **Featured Courses:** Horizontal scroll cards (mobile), 3-col grid (desktop), each with video thumbnail, title, level badge, duration, "free" or price tag
- **Community Snapshot:** 2-col split - left: latest feed posts preview, right: testimonial with user avatar + quote
- **Surf Camp CTA:** Full-width banner with beach image, overlay text, countdown to next camp, waitlist button
- **Footer:** 4-col (mobile: 1-col) - About, Corsi, Community, Contatti; newsletter signup; social icons; logo

### Course Catalog
- **Filter Sidebar:** Sticky left (desktop), collapsible top (mobile) - level checkboxes, duration sliders, price range, "free only" toggle
- **Course Grid:** 3-col (desktop), 2-col (tablet), 1-col (mobile) - thumbnail, title, instructor avatar, level badge, modules count, CTA
- **Search:** Prominent top bar with turchese focus state, instant results dropdown

### Course Detail
- **Hero:** Video trailer autoplay (muted), gradient overlay bottom, course title, instructor, level badge, enroll CTA (sticky on scroll)
- **Tabs:** Syllabus, Esercizi, Community, Reviews - underline active state in turchese
- **Syllabus:** Accordion modules, each with lesson list, duration, lock icon for premium
- **Sidebar:** Sticky - price, what's included, instructor card, student testimonials

### User Dashboard
- **Welcome Header:** Greeting with user name, current streak, next lesson card
- **Progress Section:** Visual timeline of courses, circular progress indicators, "continua" buttons
- **Exercises Assigned:** Checklist with timer buttons, reps/series display, completion checkboxes
- **Community Feed:** Integrated thread preview with "partecipa" links

### Surf Camp Pages
- **Camp Cards:** Large image, location pin, dates, spots remaining (urgent if <5), price, gallery thumbnails, waitlist/book CTA
- **Detail Modal/Page:** Image carousel, full description, itinerary timeline, equipment included, FAQ accordion, booking form

## Images

**Hero Image Requirements:**
- Homepage: Fullscreen (100vh) surf action shot - longboarder riding wave at Italian beach (Liguria/Sardegna style), warm sunset/sunrise lighting
- Course thumbnails: High-quality surf instruction moments, consistent framing (16:9 aspect)
- Instructor photos: Professional headshots with beach/ocean background, circular crop
- Surf camp: Gallery of camp locations, activities, groups surfing, beach lifestyle
- Community: User-generated content feel, authentic moments, varied surfing situations
- Exercise demos: Clear instructional photos/illustrations on neutral background

**Silhouette Graphics:**
- Integrate logo's surfista silhouette as decorative elements in headers, dividers, loading states
- Use as watermarks in certificate PDFs
- Background patterns in dashboard sections (subtle, low opacity)

## Responsive Behavior

**Breakpoints:**
- Mobile: < 640px (single column, bottom nav, full-width cards)
- Tablet: 640-1024px (2-column grids, collapsible sidebar)
- Desktop: > 1024px (full layout, hover states, multi-column)

**Mobile Optimizations:**
- Touch targets min 48px height
- Swipeable course carousels
- Bottom sheet modals for filters
- Video player controls optimized for touch
- Exercise timer: large tap areas for start/pause

## Accessibility & Dark Mode

**Consistent Dark Mode:**
- Background: Ocean Deep (195 100% 15%)
- Cards: Slate-800 with turchese borders
- Text: White primary, Slate-300 secondary
- Inputs: bg-slate-700, border-slate-500, focus:border-turchese
- Maintain turchese brand color for consistency

**Accessibility:**
- WCAG AA contrast ratios minimum
- Focus indicators: 3px turchese outline
- Skip navigation links
- Alt text for all surfing imagery
- Keyboard navigation for video player
- Screen reader labels for progress indicators