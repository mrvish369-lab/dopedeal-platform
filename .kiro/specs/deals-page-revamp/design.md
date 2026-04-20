# Deals Page Revamp - Design Document

## Architecture Overview

### Component Structure
```
LighterOffers (Main Page)
├── DealsPageHeader (New - replaces OfferSearchBar)
├── DealsHeroSection (New - enhanced hero)
├── DailyRewardsSection (Enhanced DailyCheckinButton)
├── PocketMoneySection (New)
├── DealSellSection (New)
├── OfferCardsSection (Reorganized)
│   ├── MoneyMakingCards
│   ├── SuperDealsPreview
│   └── ViralDealsCards
├── ReferralProgramSection (New)
├── AIRecommendationsSection (Enhanced)
├── TrustProofSection (Enhanced)
├── FAQSection (New)
└── DealsPageFooter (Enhanced)
```

### Dashboard Integration
```
Dashboard
├── DashboardOverview (Existing)
├── OfferWallSection (New)
│   ├── FeaturedOffers
│   ├── MyActiveTasks
│   ├── RecommendedForYou
│   └── QuickActions
└── Other Dashboard Pages
```

## Detailed Component Design

### 1. DealsPageHeader
**Purpose**: Sticky header with navigation and wallet

**Features**:
- Logo + branding
- Navigation links (Home, How it Works, PocketMoney, DealSell, FAQ)
- Wallet balance (for logged-in users)
- Login/Signup buttons
- Mobile hamburger menu

**Design**:
```tsx
<header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-border shadow-sm">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <Logo />
    <DesktopNav />
    <UserActions />
    <MobileMenuButton />
  </div>
</header>
```

**State**:
- `scrolled`: boolean (for background opacity)
- `mobileMenuOpen`: boolean
- `user`: User | null
- `wallet`: WalletBalances | null

### 2. DealsHeroSection
**Purpose**: Eye-catching hero with value proposition

**Features**:
- Main headline: "Earn Real Money From Your Social Media"
- Subheadline: Value proposition
- Key benefits (badges)
- CTA buttons (Start Earning, See How it Works)
- Live stats counter (tasks completed, users earning, total paid)
- Background: White with green accent blobs

**Design**:
```tsx
<section className="relative min-h-[600px] bg-brand-bg overflow-hidden">
  {/* Background decorative blobs */}
  <BackgroundBlobs />
  
  <div className="max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12">
    <HeroContent />
    <EarningCalculator />
  </div>
  
  <LiveStatsStrip />
</section>
```

**Components**:
- `HeroContent`: Headline, subheadline, CTAs, benefits
- `EarningCalculator`: Interactive calculator (platform, followers, estimated earnings)
- `LiveStatsStrip`: Animated counter (tasks, users, paid out)

### 3. DailyRewardsSection
**Purpose**: Gamified daily check-in with streak tracking

**Features**:
- Daily check-in button (claim coins)
- Streak display with milestones
- Coin balance
- Next check-in countdown
- Streak bonus indicators
- Progress bar

**Design**:
```tsx
<section className="py-12 bg-white">
  <div className="max-w-7xl mx-auto px-4">
    <SectionHeader 
      title="Daily Rewards"
      subtitle="Check in every day to earn coins and build your streak"
    />
    
    <div className="grid lg:grid-cols-2 gap-6">
      <DailyCheckinCard />
      <StreakProgressCard />
    </div>
  </div>
</section>
```

**State**:
- `checkinStatus`: CheckinStatus
- `loading`: boolean
- `showAnimation`: boolean

### 4. PocketMoneySection
**Purpose**: Showcase social media task opportunities

**Features**:
- Section header with description
- Task type cards (6 types)
- Payout ranges
- Duration/requirements
- Platform icons
- "Browse Tasks" CTA

**Design**:
```tsx
<section className="py-16 bg-brand-bg">
  <div className="max-w-7xl mx-auto px-4">
    <SectionHeader 
      badge="Earning Engine #1"
      title="PocketMoney Tasks"
      subtitle="Share brand content on social media and get paid"
    />
    
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {taskTypes.map(task => (
        <TaskTypeCard key={task.id} task={task} />
      ))}
    </div>
    
    <CTABanner 
      title="Ready to start earning?"
      cta="Browse Available Tasks"
      link="/dashboard/pocket-money"
    />
  </div>
</section>
```

**Data Structure**:
```typescript
interface TaskType {
  id: string;
  platform: string;
  icon: string;
  payout: string;
  duration: string;
  color: string;
  requirements?: string;
}
```

### 5. DealSellSection
**Purpose**: Showcase coupon affiliate opportunities

**Features**:
- Section header
- Featured courses (2-3 cards)
- Commission rates
- Sample coupon codes
- Promo kit highlights
- "Generate Coupons" CTA

**Design**:
```tsx
<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4">
    <SectionHeader 
      badge="Earning Engine #2"
      title="DealSell - Coupon Affiliate"
      subtitle="Share exclusive coupon codes and earn commission per sale"
    />
    
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
    
    <PromoKitCallout />
  </div>
</section>
```

**Data Structure**:
```typescript
interface Course {
  id: string;
  name: string;
  emoji: string;
  price: string;
  commission: string;
  discount: string;
  sampleCoupon: string;
  sellers: number;
  redeemed: number;
}
```

### 6. OfferCardsSection
**Purpose**: Display offer cards from database

**Features**:
- Money Making cards
- Super Deals preview
- Viral Deals cards
- Category filters
- Sort options
- Pagination/infinite scroll

**Design**:
```tsx
<section className="py-16 bg-brand-bg">
  <div className="max-w-7xl mx-auto px-4">
    <SectionHeader 
      title="Exclusive Offers"
      subtitle="Browse deals, earn coins, and discover opportunities"
    />
    
    <FilterBar />
    
    <div className="space-y-12">
      {moneyMakingCards.length > 0 && (
        <MoneyMakingGrid cards={moneyMakingCards} />
      )}
      
      <SuperDealsPreview />
      
      {viralDealsCards.length > 0 && (
        <ViralDealsGrid cards={viralDealsCards} />
      )}
    </div>
  </div>
</section>
```

**State**:
- `allCards`: OfferCard[]
- `filteredCards`: OfferCard[]
- `selectedCategory`: string | null
- `sortBy`: string

### 7. ReferralProgramSection
**Purpose**: Promote referral program

**Features**:
- 10% lifetime commission highlight
- Referral code display (for logged-in users)
- Share buttons (WhatsApp, Telegram, Copy)
- Referral stats (for logged-in users)
- How it works steps

**Design**:
```tsx
<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4">
    <SectionHeader 
      badge="Passive Income"
      title="Referral Program"
      subtitle="Invite friends and earn 10% of their lifetime earnings"
    />
    
    <div className="grid lg:grid-cols-2 gap-8">
      <ReferralBenefits />
      <ReferralCodeCard />
    </div>
    
    <HowReferralWorks />
  </div>
</section>
```

### 8. AIRecommendationsSection
**Purpose**: Personalized offer recommendations

**Features**:
- AI-powered suggestions
- Based on user behavior
- Earning potential indicators
- Quick action buttons

**Design**:
```tsx
<section className="py-16 bg-brand-bg">
  <div className="max-w-7xl mx-auto px-4">
    <SectionHeader 
      badge="Personalized"
      title="Recommended For You"
      subtitle="AI-powered suggestions based on your profile"
    />
    
    <RecommendationGrid 
      recommendations={recommendations}
      loading={loading}
    />
  </div>
</section>
```

### 9. TrustProofSection
**Purpose**: Build trust with social proof

**Features**:
- Payout proofs (real user testimonials)
- Platform stats
- Security badges
- Payment methods
- Verification process

**Design**:
```tsx
<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4">
    <SectionHeader 
      title="Real Money, Real People"
      subtitle="Join thousands of verified earners getting paid weekly"
    />
    
    <PayoutProofGrid />
    <SecurityBadges />
    <PaymentMethods />
  </div>
</section>
```

### 10. FAQSection
**Purpose**: Answer common questions

**Features**:
- Accordion-style FAQ
- Categories (Getting Started, Earning, Payments, Verification)
- Search functionality
- Contact support link

**Design**:
```tsx
<section className="py-16 bg-brand-bg">
  <div className="max-w-4xl mx-auto px-4">
    <SectionHeader 
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about earning with DopeDeal"
    />
    
    <FAQAccordion faqs={faqs} />
    
    <ContactSupportCTA />
  </div>
</section>
```

## Dashboard Integration Design

### OfferWallSection Component
**Location**: `/dashboard` (main overview page)

**Features**:
1. **Featured Offers Carousel**
   - Top 5 earning opportunities
   - Swipeable cards
   - Quick action buttons

2. **My Active Tasks Widget**
   - Tasks in progress
   - Pending verifications
   - Quick status view

3. **Recommended Offers Grid**
   - 6-8 personalized suggestions
   - Based on user profile
   - Earning potential badges

4. **Quick Actions Bar**
   - Browse All Deals
   - Generate Coupon
   - Share Referral
   - Request Payout

**Design**:
```tsx
<div className="space-y-6">
  <SectionHeader 
    title="Offer Wall"
    subtitle="Your personalized earning opportunities"
  />
  
  <FeaturedOffersCarousel offers={featuredOffers} />
  
  <div className="grid lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <RecommendedOffersGrid offers={recommendedOffers} />
    </div>
    
    <div className="space-y-4">
      <MyActiveTasksWidget tasks={activeTasks} />
      <QuickActionsCard />
    </div>
  </div>
</div>
```

## Theme System

### Color Palette
```css
/* Primary */
--brand-green: #00C853;
--brand-green-light: #69F0AE;
--brand-green-dim: #00A846;
--brand-green-pale: #E8FFF2;

/* Secondary */
--brand-forest: #003D1F;
--brand-forest-mid: #005C2E;
--brand-teal: #00BFA5;

/* Neutrals */
--brand-bg: #F7FAF8;
--brand-surface: #FFFFFF;
--brand-surface2: #F0F7F3;
--brand-surface3: #E3F5EB;

/* Borders */
--brand-border: #D4EAE0;
--brand-border-strong: #B2D8C6;

/* Text */
--brand-text: #0D1F17;
--brand-text-dim: #3D5A4A;
--brand-text-faint: #7A9E8D;
```

### Typography Scale
```css
/* Display (Headings) */
font-family: 'Outfit', 'Poppins', sans-serif;
font-weight: 800-900 (extrabold/black);

/* Body */
font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
font-weight: 400-700;

/* Mono (Codes/Numbers) */
font-family: 'JetBrains Mono', monospace;
font-weight: 500-600;
```

### Spacing System
```css
/* Base unit: 4px */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
```

### Border Radius
```css
--radius-sm: 0.5rem;   /* 8px */
--radius-md: 0.75rem;  /* 12px */
--radius-lg: 1rem;     /* 16px */
--radius-xl: 1.5rem;   /* 24px */
--radius-2xl: 2rem;    /* 32px */
--radius-full: 9999px;
```

## Animation Guidelines

### Transitions
```css
/* Standard */
transition: all 0.3s ease;

/* Smooth */
transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);

/* Bounce */
transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Hover Effects
- Cards: `hover:-translate-y-1 hover:shadow-lg`
- Buttons: `hover:-translate-y-0.5 hover:shadow-md`
- Links: `hover:text-brand-green-dim`

### Loading States
- Skeleton screens with shimmer
- Spinner for async actions
- Progress bars for multi-step

## Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Mobile Optimizations
- Touch-friendly buttons (min 44x44px)
- Simplified navigation
- Collapsible sections
- Swipeable carousels
- Bottom sheet modals

## Performance Optimizations

### Code Splitting
```tsx
// Lazy load heavy components
const AIRecommendations = lazy(() => import('./AIRecommendations'));
const FAQSection = lazy(() => import('./FAQSection'));
```

### Image Optimization
- WebP format with fallbacks
- Lazy loading below fold
- Responsive images
- Blur placeholders

### Data Fetching
- Parallel requests where possible
- Cache frequently accessed data
- Pagination for large lists
- Optimistic UI updates

## Accessibility

### ARIA Labels
- Semantic HTML
- Proper heading hierarchy
- Alt text for images
- ARIA labels for interactive elements

### Keyboard Navigation
- Tab order
- Focus indicators
- Keyboard shortcuts
- Skip links

### Screen Readers
- Descriptive labels
- Status announcements
- Error messages
- Loading states

## Testing Strategy

### Unit Tests
- Component rendering
- State management
- Event handlers
- Utility functions

### Integration Tests
- User flows
- API interactions
- Navigation
- Form submissions

### E2E Tests
- Critical paths
- Payment flows
- Authentication
- Cross-browser

## Deployment Strategy

### Staging
1. Deploy to staging environment
2. Run automated tests
3. Manual QA testing
4. Performance audit
5. Accessibility audit

### Production
1. Feature flags for gradual rollout
2. Monitor error rates
3. Track performance metrics
4. Gather user feedback
5. Iterate based on data

## Metrics & KPIs

### Engagement
- Page views
- Time on page
- Scroll depth
- Section impressions
- CTA clicks

### Conversion
- Sign-up rate
- Task acceptance rate
- Coupon generation rate
- Referral shares
- Payout requests

### Performance
- Page load time
- Time to interactive
- First contentful paint
- Largest contentful paint
- Cumulative layout shift

### Revenue
- Tasks completed
- Coupons redeemed
- Referral earnings
- Platform commission
- User lifetime value
