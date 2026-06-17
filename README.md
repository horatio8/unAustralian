# unAustralian

A single-page campaign site urging Australians to tell their state leaders that
the proposed capital-gains-tax changes are *unAustralian*.

Implemented from the Claude Design handoff bundle (`unAustralian.dc.html`) as a
self-contained static site — no build step, no framework, no dependencies.

## Stack

- **`index.html`** — page structure and all section markup
- **`styles.css`** — full visual system (deep-navy grounds, gold accents,
  Cormorant Garamond display serif, glassmorphism cards, mobile-first responsive
  overrides)
- **`app.js`** — vanilla JS for all interactivity
- **`au-map-data.js`** — SVG path data for the real map of Australia
- **`assets/`** — wordmark, hero map, and documentary photography for the
  "losers" cards and the unAustralian Test

## Sections

1. **Hero** — wordmark lockup over a textured Australia map, with a live count of
   how many Australians have spoken up.
2. **Tell your leaders** — postcode-validated form that maps a postcode to a
   state and confirms how many leaders were messaged, then offers sharing and a
   donate hand-off.
3. **What we're fighting** — the three bills at issue.
4. **Are you Albo's loser?** — a swipeable gallery of the six groups who pay the
   price.
5. **The unAustralian Test** — six Australian values and how the changes fail
   each.
6. **The Count** — a live-ticking counter, an interactive heat-map of Australia
   colour-graded by message density, and a synced state-by-state breakdown.
7. **Donate** — a donor matrix ($26 / $65 / $265 / $550 / $1,500 / custom) with a
   one-time / monthly toggle.

## Interactivity

- **Live counter** — increments every 2.3s and distributes messages across
  states, re-colouring the heat-map and breakdown bars in real time.
- **Heat-map ↔ breakdown** — hovering either a state or a bar highlights both.
- **Form** — client-side validation; the postcode→state lookup determines which
  state's leaders are notified. Email delivery is mocked client-side and needs a
  serverless backend for production.
- **Donate** — tier/frequency selection and a custom-amount field drive the
  call-to-action label.
- **Mobile** — at ≤820px the nav collapses to a hamburger menu and every
  multi-column section stacks to a single column.

## Running

It's a static site — open `index.html` in a browser, or serve the directory:

```sh
python3 -m http.server 8000
```

## Notes for production

- Headlines use **Cormorant Garamond** as a stand-in for the licensed
  **orpheus-pro** Typekit face — swap in the real kit at launch.
- Leader email delivery is mocked client-side; wire up the serverless backend.
- Donations route to a placeholder; connect the secure checkout.
