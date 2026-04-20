# Deals Page Revamp - Requirements Document

## Project Overview
Complete revamp of `/deals` page to transform it into a super engaging landing page with white + green accent theme (matching homepage), properly organized income opportunities, and integration with dashboard.

## Current State Analysis

### Current /deals Page Structure
1. **Header**: OfferSearchBar (sticky wallet header)
2. **Hero**: DealsHero banner
3. **Super Deals Button**: Quick access button
4. **Daily Check-in**: DailyCheckinButton (coin rewards)
5. **Money Making Segment**: Cards with `card_segment === "money_making"`
6. **Super Deals Preview**: Featured section
7. **Viral Deals Segment**: Cards with `card_segment === "viral_deals"`
8. **AI Recommendations**: RecommendedForYou section
9. **Trust Section**: OfferTrustSection
10. **Footer**: OfferFooter

### Current Theme Issues
- Dark animated gradient background (`bg-animated-gradient`)
- Inconsistent with homepage white + green theme
- Not commercial/professional looking

### Homepage Income Opportunities (Landing.tsx)
1. **PocketMoney Panel** - Social media tasks:
   - Instagram Story: ₹15-₹25 (24 hrs)
   - WhatsApp Status: ₹15-₹20 (24 hrs)
   - Instagram Feed Post: ₹25-₹50 (7-30 days)
   - Instagram Reel: ₹20-₹40 (7 days min)
   - Video Testimonial: ₹70-₹400 (script + delivery)
   - Long Campaign: ₹50-₹150 (30-day premium)

2. **DealSell** - Coupon affiliate:
   - Social Media Growth Blueprint: ₹349 course, earn ₹150
   - Canva Mastery Design Course: ₹299 course, earn ₹120
   - Includes promo kit (banners, captions, scripts)

3. **Referral Program**: 10% lifetime earnings from referrals

4. **Daily Check-in**: Coin rewards with streak bonuses

### Dashboard Income Opportunities
1. **PocketMoney**: `/dashboard/pocket-money` - Social tasks
2. **DealSell**: `/dashboard/deal-sell` - Coupon commissions
3. **Referral**: `/dashboard/referral` - Invite & earn
4. **Wallet**: `/dashboard/wallet` - Balance & withdrawals
5. **Leaderboard**: `/dashboard/leaderboard` - Top earners

## Requirements

### R1: Theme Transformation
**Priority**: HIGH
**Description**: Transform /deals page to match homepage theme
- White background (`bg-white` or `bg-brand-bg`)
- Green accents (`brand-green`, `brand-teal`)
- Remove dark animated gradient
- Clean, commercial, professional look
- Consistent with homepage design language

### R2: Income Opportunities Organization
**Priority**: HIGH
**Description**: Organize all income opportunities into clear sections

#### Section Structure:
1. **Hero Section** (New)
   - Welcome message
   - Value proposition
   - Quick stats (tasks completed, users earning, total paid)
   - CTA buttons

2. **Daily Rewards** (Existing - Enhanced)
   - Daily check-in with streak tracking
   - Coin balance display
   - Gamification elements

3. **PocketMoney Tasks** (New Section)
   - All social media task types
   - Clear payout ranges
   - Duration/requirements
   - Task categories (Story, Post, Reel, Campaign)
   - Browse available tasks CTA

4. **DealSell Coupons** (New Section)
   - Featured courses with commission rates
   - Coupon code examples
   - Promo kit highlights
   - Generate coupons CTA

5. **Offer Cards** (Existing - Reorganized)
   - Money Making cards
   - Viral Deals cards
   - Super Deals
   - Categorized by earning potential

6. **Referral Program** (New Section)
   - 10% lifetime commission
   - Referral code display
   - Share options
   - Referral stats

7. **AI Recommendations** (Existing - Enhanced)
   - Personalized offers
   - Based on user behavior
   - Smart suggestions

8. **Trust & Social Proof** (Enhanced)
   - Payout proofs
   - User testimonials
   - Platform stats
   - Security badges

9. **FAQ Section** (New)
   - Common questions
   - How to earn
   - Payment methods
   - Verification process

### R3: User Flow Logic

#### For Logged-Out Users:
- Show all income opportunities
- Prominent "Sign Up Free" CTAs
- Earning potential calculators
- Social proof elements
- Clear value proposition

#### For Logged-In Users:
- Personalized greeting
- Current balance display
- Available tasks count
- Quick action buttons
- Progress tracking
- Streak status

#### For Verified Users:
- Full access to all sections
- Active task listings
- Coupon generation
- Withdrawal options

#### For Unverified Users:
- Verification prompt banner
- Limited access message
- Profile completion CTA
- Verification timeline

### R4: Dashboard Integration
**Priority**: MEDIUM
**Description**: Create "Offer Wall" section in dashboard

#### Dashboard Offer Wall Features:
1. **Quick Browse Section**
   - Featured offers from /deals
   - Top earning opportunities
   - Trending tasks
   - New arrivals

2. **My Active Tasks**
   - Tasks in progress
   - Pending verifications
   - Completed tasks
   - Earnings summary

3. **Recommended for You**
   - AI-powered suggestions
   - Based on profile
   - Past performance
   - Earning potential

4. **Quick Actions**
   - Browse all deals
   - Generate coupon
   - Share referral
   - Request payout

### R5: Income Logic Analysis

#### User Earning Streams:
1. **PocketMoney Tasks**
   - Platform takes: 20-30% commission
   - User earns: 70-80% of brand payment
   - Payment: Weekly/bi-weekly
   - Verification: Required

2. **DealSell Commissions**
   - Platform takes: Course provider commission split
   - User earns: Fixed commission per sale
   - Payment: After course purchase confirmation
   - Tracking: Unique coupon codes

3. **Offer Card Clicks**
   - Platform earns: Affiliate commission from brands
   - User earns: Coins (2 coins per click, max 10 clicks/day)
   - Coins can be: Converted to money or used for rewards
   - Tracking: Click tracking + session management

4. **Referral Program**
   - Platform takes: 90% of referred user earnings
   - User earns: 10% lifetime commission
   - Payment: Auto-credited to referral balance
   - Tracking: Referral codes + user relationships

5. **Daily Check-in**
   - Platform cost: Coin rewards (10 base + streak bonus)
   - User earns: Coins for engagement
   - Gamification: Streak system (3, 5, 7, 14, 30 days)
   - Purpose: User retention + daily engagement

#### Platform Owner Revenue:
1. Brand partnerships (PocketMoney)
2. Course affiliate commissions (DealSell)
3. Offer card affiliate commissions
4. Premium features (future)
5. Data insights (anonymized)

### R6: Design Requirements

#### Visual Hierarchy:
1. Hero with clear value prop
2. Daily rewards (engagement hook)
3. Primary earning methods (PocketMoney + DealSell)
4. Secondary opportunities (Offer cards)
5. Social proof + trust
6. FAQ + support

#### UI Components:
- Clean card designs
- Green accent buttons
- White backgrounds
- Subtle shadows
- Smooth animations
- Mobile-responsive
- Touch-friendly

#### Typography:
- Display font for headings
- Body font for content
- Mono font for numbers/codes
- Clear hierarchy
- Readable sizes

### R7: Performance Requirements
- Fast page load (<2s)
- Smooth scrolling
- Lazy loading images
- Optimized animations
- Efficient data fetching
- Cached content where possible

### R8: Analytics & Tracking
- Page views
- Section impressions
- CTA clicks
- Conversion rates
- User journey mapping
- A/B testing ready

## Success Criteria

1. ✅ Theme matches homepage (white + green)
2. ✅ All income opportunities clearly organized
3. ✅ Logical section flow for user journey
4. ✅ Dashboard integration complete
5. ✅ Mobile responsive
6. ✅ Fast performance
7. ✅ High engagement metrics
8. ✅ Clear CTAs throughout
9. ✅ Trust elements prominent
10. ✅ Easy navigation

## User Stories

### US1: As a new visitor
I want to understand all earning opportunities quickly
So that I can decide if DopeDeal is worth joining

### US2: As a logged-in user
I want to see personalized earning opportunities
So that I can maximize my income

### US3: As a verified user
I want quick access to active tasks and coupons
So that I can start earning immediately

### US4: As a dashboard user
I want to see featured offers without leaving dashboard
So that I can browse opportunities efficiently

### US5: As a mobile user
I want a smooth, responsive experience
So that I can browse and earn on-the-go

## Technical Considerations

### Data Sources:
- `offer_cards` table (existing offers)
- `daily_checkins` table (streak data)
- `user_wallets` table (balance)
- `coin_settings` table (reward config)
- Static content (PocketMoney tasks, DealSell courses)

### API Endpoints:
- Fetch offer cards (existing)
- Track impressions (existing)
- Award coins (existing)
- Generate coupons (to be created)
- Fetch user stats (to be created)

### State Management:
- User authentication state
- Wallet balance
- Checkin status
- Offer cards
- Recommendations
- Loading states

## Future Enhancements
1. Personalized task recommendations
2. Advanced filtering/sorting
3. Saved offers
4. Push notifications
5. Gamification badges
6. Social sharing features
7. Video tutorials
8. Live chat support
