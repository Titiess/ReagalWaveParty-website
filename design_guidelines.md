# Design Guidelines: Regal Star Gym – Wave & Vibe Pool Party

## Design Approach
**Premium Event Landing Page** - Single-page scrolling experience with black and gold luxury theme, inspired by high-end event ticketing platforms with emphasis on visual hierarchy and smooth user journey toward ticket purchase conversion.

## Core Design Principles
1. **Premium Luxury**: Black and gold color scheme creates exclusivity and premium feel
2. **Conversion-Focused**: Clear path from hero to ticket purchase
3. **Trust & Clarity**: Transparent pricing, clear event details, professional presentation
4. **Mobile-First**: Seamless experience across all devices

## Typography System
- **Primary Font**: Montserrat (Google Fonts) - modern, clean, premium feel
- **Hierarchy**:
  - H1 (Hero): 4xl-6xl, font-bold, uppercase tracking-wide
  - H2 (Sections): 3xl-4xl, font-semibold
  - H3 (Subsections): xl-2xl, font-medium
  - Body: base-lg, font-normal, leading-relaxed
  - Accent Text (prices/dates): lg-xl, font-bold

## Layout System
- **Spacing Units**: Tailwind 4, 8, 12, 16, 20, 24 for consistent rhythm
- **Section Padding**: py-16 md:py-24 for generous breathing room
- **Container**: max-w-6xl mx-auto px-6
- **Grid System**: Standard 12-column, use 1-2 columns on mobile, up to 3-4 on desktop where appropriate

## Component Library

### Hero Section
- Full viewport height (min-h-screen) with centered content
- Regal Star Gym logo prominently displayed (w-48 md:w-64)
- Event title in large, bold typography with gold accent
- Key event details (date, theme, venue) in hierarchical layout
- Primary CTA button "Purchase Ticket" - large, gold background with black text, prominent placement
- Subtle animated fade-in on load
- **Background**: Deep black with subtle gold gradient or geometric pattern overlay

### Event Details Section
- Clean card-based layout on black background
- Information grid: 2 columns on desktop, single column mobile
- Icon + text pairs for each detail (date, time, venue, pricing)
- Use Heroicons for simple, clean icons
- Pricing displayed prominently with tier differentiation (Early Bird vs Gate)
- Activities list with subtle gold bullet points or icons

### Payment Section
- Centered form layout with clear visual hierarchy
- Form fields: Name (text), Email (email), Gender/Ticket Type (select for pricing)
- Clean input styling with gold focus states
- Flutterwave payment button - prominent, matches primary CTA style
- Pricing calculator showing selected ticket price
- Trust indicators (secure payment badge, Flutterwave logo)
- Form validation with clear error states

### Sponsors Section
- Grid layout: 3-4 columns on desktop, 2 on tablet, 1 on mobile
- Placeholder boxes with dashed gold borders
- Section title "Our Sponsors" in prominent typography
- Equal-sized sponsor slots (aspect-ratio-square or 16:9)
- Prepared for easy logo insertion later

### Footer
- Black background with gold accents
- Two-row layout:
  - Row 1: "Regal Star Gym" branding centered
  - Row 2: Sponsorship contact numbers with phone icon
- Centered text alignment
- Subtle separator line in gold
- Compact padding (py-8)

## Visual Elements & Animations
- **Smooth Scrolling**: Enable smooth scroll behavior
- **Fade Transitions**: Sections fade in on scroll (subtle, 0.3s duration)
- **Hover States**: Buttons scale slightly (1.05) with smooth transition
- **Loading States**: Spinner for payment processing
- **Success State**: Checkmark animation on payment success

## Success/Confirmation Page
- Clean centered layout
- Large success icon (checkmark in gold)
- Confirmation message: "Payment Successful. Your ticket has been emailed."
- Ticket ID display prominently
- Secondary CTA to return to event page
- Brief loading animation before showing success

## Images
**Hero Section**: Use the provided Regal Star Gym logo as the primary hero image. Center it prominently with generous spacing. No background hero image needed - the logo IS the hero visual element on the premium black background.

**No additional images required** - the design relies on the power of typography, the gym logo, gold accents, and clean layout to create visual impact.

## Mobile Responsiveness
- Stack all multi-column layouts to single column on mobile
- Reduce font sizes proportionally (use Tailwind responsive prefixes)
- Maintain generous padding but scale appropriately
- Touch-friendly button sizes (min-height: 48px)
- Simplified navigation if needed
- Payment form optimized for mobile keyboards

## Accessibility
- High contrast maintained (gold on black meets WCAG standards)
- Form labels clearly associated
- Focus states visible and distinct
- Semantic HTML structure
- Alt text for logo image