# Rally — Business Plan v1

## 1. Executive summary

Rally is a consumer-first pickleball discovery and availability hub.

It brings fragmented pickleball information into one clear experience so a player can answer:

> “I want to play tonight at 7pm near me. What is available, and how do I join?”

Rally will aggregate sessions, open play, court hire, coaching, leagues and tournaments from different clubs, venues and booking systems. It will show the best available information, explain the joining route, and eventually allow booking inside Rally where authorised integrations make that possible.

The initial paying customer is the player. Clubs and organisers are supply partners and should be listed free while Rally builds demand.

## 2. The problem

Pickleball supply is fragmented across club websites, Bookwhen, Playtomic, ClubSpark, Spond, WhatsApp groups, social media and direct contact.

Players have to search several places, understand different booking systems, and often cannot tell whether a session is suitable, available or open to new players.

Clubs and organisers also lose potential players because their sessions are difficult to discover.

## 3. The solution

Rally will provide one searchable layer across the fragmented market.

Players can search by:

- Date and time
- Location and travel distance
- Skill level
- Session type
- Price
- Availability
- New-player suitability

Each result will show:

- Venue and organiser
- Session details
- Price
- Spaces remaining where available
- Last availability update
- Booking or joining route
- Whether the route is direct booking, app, WhatsApp, Spond, email or contact

## 4. Target customers

### Primary customer: players

- Beginners looking for an easy first session
- Regular players looking for games at specific times
- Visitors needing a game in a new area
- Players searching across multiple clubs and booking systems
- Players who want alerts when a preferred session becomes available

### Supply partners: clubs and organisers

Clubs are not the initial revenue target. They benefit from free discovery, new players and future integrations.

## 5. Product principles

1. Player-first: every feature must help players find and join the right game.
2. Automation-first: data should be collected, normalised and refreshed automatically.
3. Accuracy over volume: do not publish invented availability or unverified times.
4. Clear joining routes: tell players exactly what to do next.
5. Free basic supply listings: do not charge clubs simply for being listed.
6. Area-by-area rollout: complete and verify one area before expanding.
7. Honest availability: distinguish live, recently checked, organiser-confirmed and unverified data.

## 6. Data and automation strategy

Rally will use a source-adapter architecture.

### Automated sources

- Official APIs
- OpenActive and other structured feeds
- Public booking pages with structured data
- Public organiser websites
- Approved club feeds and integrations

### Provider hierarchy

1. Authorised API or live feed
2. Public structured event data
3. Public page extraction where permitted
4. Organiser-provided feed or submission
5. Manual review only for exceptions

Each source will have:

- Provider name
- Source URL
- Provider event ID where available
- Last successful sync
- Last verified time
- Sync status
- Error details

Rally must never scrape private WhatsApp or Spond groups. For private routes, Rally can display organiser-published instructions, a public contact route or an approved organiser feed, but it must not claim live capacity without evidence.

## 7. Core data model

The platform must support:

- Venues
- Organisers
- Sessions
- Source records
- Provider event IDs
- Start and end times
- Skill levels
- Session types
- Prices
- Capacity
- Spaces remaining
- Waitlist status
- Booking mode
- Booking URL
- Contact method
- Availability status
- Last synced timestamp
- Last verified timestamp

The same session appearing on multiple sources must be deduplicated into one Rally result.

## 8. Roadmap

### Phase 1 — London foundation

- Complete West London as the reference area
- Add automated source ingestion foundation
- Add search by time, area and skill level
- Add venue and organiser pages
- Add clear availability and joining states
- Add player accounts and saved searches

### Phase 2 — Live availability

- Connect the first public availability feed
- Add provider-specific adapters
- Show spaces remaining where authorised data exists
- Add freshness indicators
- Add alerts for matching sessions and newly opened spaces

### Phase 3 — London coverage

- Central London
- South London
- East London
- North London

Each area must be researched, loaded, checked and tested before the next area begins.

### Phase 4 — UK expansion

Expand to major pickleball areas across England, Wales and Scotland using the same automated system.

### Phase 5 — Booking partnerships

Where providers and organisers authorise it, allow booking and payment inside Rally. Otherwise, provide the best direct route to the existing booking system.

## 9. Monetisation

### Initial model: Rally player membership

Basic discovery remains free. Paid membership can include:

- Personalised availability alerts
- Saved locations and preferred times
- Early notification when spaces open
- Advanced filters
- Multi-area searches
- Calendar integration
- Booking history and favourite organisers
- Reduced advertising or promoted listings

Players should only be charged after Rally provides reliable coverage and clear time-saving value.

### Later revenue streams

- Booking and referral commissions where authorised
- Direct booking transaction fees
- Equipment and apparel affiliate revenue
- Tournament and coaching promotion
- Sponsorship
- Organiser analytics and feed tools
- B2B data/API access

Club subscriptions are not the core initial model. They may become optional later for useful automation, analytics or integrations, but not simply for database inclusion.

## 10. Success measures

The main measures are player value, not the number of records entered manually.

- Search-to-booking click rate
- Percentage of results with a working joining route
- Availability freshness
- Repeat player usage
- Saved search and alert usage
- Paid conversion to Rally membership
- Sessions discovered through Rally
- Areas with complete verified coverage
- Automated sync success rate

## 11. What is out of scope

Rally will not initially become:

- Club-management software
- A replacement for every booking platform
- A private WhatsApp or Spond group scraper
- A manually maintained national directory
- A social network before the discovery product works
- A business dependent on clubs paying for basic listings

## 12. Strategic decision rule

Before adding a feature or changing the business model, ask:

> Does this help a player find and join the right pickleball game more easily, and can it scale through automation?

If the answer is no, it is not part of the current Rally plan.

## 13. Immediate next build

Stop expanding manual listings as the primary activity. Build the automated ingestion and availability foundation first:

1. Source and sync tables
2. Normalised availability fields
3. Provider adapter interface
4. First automated public feed connector
5. Deduplication rules
6. Freshness and error states
7. Player saved searches and alerts

This plan is the fixed product and business direction for Rally v1.
