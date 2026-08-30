# Rent Fit Radar — MVP Specification

## One-line pitch

Rent Fit Radar helps Bengaluru renters decide **which locality fits them best** by balancing rental budget, home type, commute needs, and nearby essentials. It uses live web evidence, explains the trade-offs in the renter's chosen Indian language, and can bridge a consented renter-owner conversation across languages.

## Challenge fit

- **Real user:** a renter choosing among Bengaluru localities.
- **Clear input:** commute anchor, radius, flat type, budget, priorities, and answer language.
- **Useful output:** three ranked localities, a clear winner, source links, a commute snapshot, nearby-essentials signals, and a short local-language explanation.
- **Sarvam.ai:** translates and voices the recommendation, then powers an optional bilingual renter-owner conversation.
- **Anakin.io:** searches and/or scrapes current rental-context and qualitative locality information.
- **Google Maps Platform:** supplies bounded, source-linked spatial evidence: nearby essentials, a representative locality visual, and a commute snapshot.

## Problem

Rental platforms provide listings, but choosing an area is a trade-off: an affordable 2BHK might mean a long commute; a convenient locality may be crowded or expensive. A renter needs an understandable, source-backed comparison before opening dozens of listings.

## MVP promise

Given a renter's preferences, return three nearby Bengaluru localities and answer:

1. Which locality is the best fit?
2. Why does it fit this renter?
3. What trade-off does the renter make by choosing it?
4. Which live sources support the recommendation?

The product recommends **localities**, not individual apartments. It gives planning guidance, not guaranteed availability or exact rents. A commute is a time-stamped estimate, not a promise of future traffic.

The optional conversation feature is a post-recommendation hand-off. It does not source, scrape, or publicly expose a person’s mobile number. A real owner or agent contact must come from a verified, consented listing source.

## Target demo scenario

> "I work near Koramangala, want a 1BHK below ₹25,000, can travel up to 45 minutes, and care most about groceries and a reasonable commute. Explain it in Kannada."

Expected outcome: BTM Layout, HSR Layout, and Bellandur are compared; the winner gets a concise Kannada explanation and playable Sarvam audio.

## User experience

Use a responsive single-page web app. The form appears as a short guided wizard; results appear as a comparison dashboard. Do not use a terminal or a slide deck as the product UI.

### Screen 1 — Commute anchor

- Prompt: **Where do you commute to?**
- Text input with demo chips: `Koramangala`, `HSR Layout`, `Whitefield`.
- Radius selector: `3 km`, `5 km`, or `8 km`.
- Optional commute tolerance selector: `30`, `45`, or `60 minutes`.

### Screen 2 — Home and budget

- Flat type: `1BHK` or `2BHK`.
- Budget range: minimum and maximum monthly rent in INR.
- Example default: `₹18,000–₹25,000`.

### Screen 3 — What matters most

Let users select up to three priorities:

- Lower rent
- Shorter commute
- Metro access
- Groceries and essentials nearby
- Cafés / social life
- Quieter residential feel

### Screen 4 — Language

- Result language: English, Hindi, or Kannada.
- `Listen to result` toggle, enabled by default for the demo.
- Main CTA: **Find my best areas**.

### Loading state

Show an honest pipeline, not a generic spinner:

1. Finding nearby localities
2. Gathering live locality information
3. Comparing your priorities
4. Preparing your language summary

### Results screen

Top section:

- Heading: **Your best fit: BTM Layout**
- Fit score, e.g. `89/100`
- Two-sentence explanation in the chosen language
- Play/pause audio button when audio is available
- `Change preferences` action

Comparison section:

- Three locality cards, ranked first through third
- Each card shows: overall fit, budget fit, commute fit, essentials fit, and one trade-off
- Each card may show one small representative Google Place photo or map preview, plus an **Open in Google Maps** link. It is context only: photos never affect ranking.
- When Maps data is available, show commute distance, travel mode, estimated duration, and the snapshot time.
- Use labels (`Strong`, `Good`, `Mixed`) in addition to scores; do not imply false precision.

Evidence section:

- Two or three source cards per locality, showing title, domain, and link
- A short `Why this ranked here` expansion with the factors used
- Disclaimer: `Rent and commute information are indicative; verify listings and routes before deciding.`

### Bilingual conversation hand-off (stretch feature)

After viewing the ranked localities, a renter can select **Start bilingual conversation**. For the sprint this opens a shared browser room, not a phone call:

- The renter creates a one-time invite link and selects their language; the owner/agent opens it and selects theirs.
- Both participants see a clear banner: `AI translation is active. Do not share OTPs, payment details, or other sensitive information.`
- Each person uses a tap-to-talk button. One short turn is translated before the next begins; this avoids crosstalk and makes latency understandable.
- The room shows the original utterance, its translation, and a replay button for the translated audio.
- Provide quick question chips: `Is the flat available?`, `What is the deposit?`, `Can I visit this weekend?`
- Recording and transcript saving are off by default. If either is later introduced, both participants must opt in first.

For a live demo, open the renter and owner room in two browser tabs with different languages. A future verified-listing integration may show a masked contact and a `Request bilingual call` action, but raw phone numbers never appear in the locality research results.

## Recommendation logic

The MVP considers a fixed candidate set of four to six Bengaluru localities around the supplied anchor. This preserves a reliable demo while still letting Anakin provide live supporting evidence.

### Input model

```ts
type Preferences = {
  commuteAnchor: string;
  searchRadiusKm: 3 | 5 | 8;
  commuteToleranceMinutes: 30 | 45 | 60;
  homeType: "1BHK" | "2BHK";
  budgetMin: number;
  budgetMax: number;
  priorities: Array<
    "rent" | "commute" | "metro" | "essentials" | "social" | "quiet"
  >;
  language: "en-IN" | "hi-IN" | "kn-IN";
  includeAudio: boolean;
};
```

### Spatial-evidence limits

Google Maps is deliberately a narrow enhancement rather than a second research engine:

- Rank at most three shortlisted localities.
- Make at most one Google Places search per shortlisted locality, filtered to the user’s selected nearby priority types.
- Compute one route matrix from the three locality centroids to the commute anchor; this gives three commute estimates in one bounded operation.
- Load at most one 480px representative photo per locality, only after the results screen is visible. A Google Maps deep link is always available even when photos are omitted.
- Request only the fields the UI needs. Do not use wildcard field masks, scrape Google Maps, persist Place photos, or feed images to a vision model.

This keeps the demo fast and prevents visual decoration from becoming an uncontrolled cost or a false evidence signal.

### Score model

Start every candidate at zero and calculate a transparent weighted score:

- **Budget fit (0–35):** estimated rent context is within or close to the budget.
- **Commute fit (0–30):** Maps route duration is compared to the tolerance. Label it with the mode and timestamp; traffic-aware driving estimates are treated as snapshots.
- **Chosen priorities (0–25):** Maps evidence supports spatial priorities (metro and essentials); Anakin evidence supports contextual priorities (rent, social, and quiet).
- **Evidence quality (0–10):** sufficient relevant live sources were found.

Boost selected priorities rather than scoring every category equally. Return factor labels and explanations with the score so the UI can show the rationale.

If live evidence is missing, lower the evidence score and say `Limited live information found` rather than inventing a claim.

## Sponsor integration

### Anakin.io — live information adapter

Keep the Anakin key on the server only.

For each candidate locality, send a focused search prompt such as:

```text
Current rental context, nearby grocery stores, metro access, commute context,
and residential character for BTM Layout Bengaluru. Return reputable source links
and concise factual snippets useful to a renter seeking a 1BHK under ₹25,000.
```

Use Anakin Search for the MVP. Optionally scrape one strong result per locality for richer source snippets. Normalize results into:

```ts
type LocalityEvidence = {
  locality: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
  rentContext?: string;
  characterContext?: string;
  spatial?: {
    mapsUri: string;
    nearby: Array<{ category: "metro" | "essentials" | "social"; count: number }>;
    commute?: {
      mode: "DRIVE" | "TRANSIT";
      distanceMeters: number;
      durationMinutes: number;
      observedAt: string;
      trafficAware: boolean;
    };
    visual?: { url: string; attribution: string };
  };
};
```

### Google Maps Platform — spatial evidence adapter

Keep the Google Maps key server-side for Places and Routes calls. Use a browser-restricted key only if an interactive map is later added.

1. Resolve the commute anchor and curated locality centroids.
2. Use Places search with a narrow field mask to count only the POI categories selected by the renter (for example, metro stations and grocery stores).
3. Use one Routes computeRouteMatrix call to compare the three locality centroids with the commute anchor. For driving, a traffic-aware duration is allowed but must be displayed as a snapshot with its observed time.
4. Optionally request one Google Place photo per locality only for the result card. Preserve required attribution and never use the image as a ranking input.

Google data is returned through LocalityEvidence.spatial; the scorer receives normalized facts, not a Maps response.

### Sarvam.ai — language and voice adapter

Build a short, evidence-grounded English recommendation first. Then:

1. Translate it with Sarvam `text.translate` when the user selected Hindi or Kannada.
2. Generate speech with Sarvam `text_to_speech.convert` when audio is requested.
3. Return translated text and an audio URL/data payload to the browser.

The UI must visibly state that the explanation and audio were created with Sarvam.

### Sarvam.ai — conversation translation

For each short participant turn:

1. Receive microphone audio at the server.
2. Use Sarvam speech-to-text or speech-to-text translation to obtain the original-language transcript and the recipient-language text.
3. Use Sarvam text-to-speech to create short translated audio for the other participant.
4. Return both texts and the translated audio to the browser room.

This is an interpreter, not an autonomous rental negotiator. It must preserve the participant’s words, display the transcript for correction, and never invent availability, pricing, or commitments.

## Technical design

### Primary module

Create a single deep `RecommendationModule` with this external interface:

```ts
getRecommendation(preferences: Preferences): Promise<Recommendation>;
```

Its implementation owns candidate selection, Anakin retrieval, Google spatial retrieval, evidence normalization, scoring, Sarvam translation, and optional audio. This gives the UI a small interface and keeps the integration complexity local.

### Internal seams

- `LiveInformationAdapter`: Anakin search/scrape adapter; fakeable in tests.
- `SpatialEvidenceAdapter`: Google Places and Routes adapter; fakeable in tests.
- `LanguageAdapter`: Sarvam translation and text-to-speech adapter; fakeable in tests.
- `LocalityScorer`: pure function that ranks normalized Anakin and Maps evidence. It has no network access and never consumes image pixels.

### Conversation module

Keep live translation out of `RecommendationModule`. Create a separate deep `ConversationModule` with one external interface:

```ts
translateTurn(input: ConversationTurn): Promise<TranslatedTurn>;
```

Its implementation validates a short audio turn, calls Sarvam STT/translation/TTS, associates it with the room and intended recipient language, and returns display-ready transcript, translation, and audio. It does not store recordings by default.

Internal seams:

- `SpeechTranslationAdapter`: Sarvam STT and translation adapter; fakeable in tests.
- `ConversationSpeechAdapter`: Sarvam TTS adapter; fakeable in tests.
- `ConversationStore`: one-time room/invite state; use an in-memory implementation for the demo and expire rooms quickly.

### Server route

`POST /api/recommendations`

- Validates the preference payload.
- Calls `RecommendationModule.getRecommendation`.
- Returns the ranked recommendation with sources and optional audio.
- Never exposes `ANAKIN_API_KEY`, `SARVAM_API_KEY`, or server-side Google Maps credentials to the client.

### Conversation routes

- `POST /api/conversations`: creates a short-lived, one-time invite after the renter accepts the AI-translation notice.
- `POST /api/conversations/:id/join`: records the second participant’s language and consent.
- `POST /api/conversations/:id/turn`: accepts one bounded audio turn and returns the transcript, translation, and translated audio.

Reject turns until both participants have joined and accepted the notice. Apply rate limits, validate the room token, and expire the room and its transient transcript after the demo session.

## Result model

```ts
type RankedLocality = {
  rank: number;
  locality: string;
  fitScore: number;
  labels: {
    budget: "Strong" | "Good" | "Mixed" | "Weak";
    commute: "Strong" | "Good" | "Mixed" | "Weak";
    essentials: "Strong" | "Good" | "Mixed" | "Weak";
  };
  whyItFits: string;
  tradeOff: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
  spatial?: {
    mapsUri: string;
    nearby: Array<{ category: string; count: number }>;
    commute?: { mode: string; durationMinutes: number; observedAt: string };
    visual?: { url: string; attribution: string };
  };
};

type Recommendation = {
  winner: RankedLocality;
  rankedLocalities: RankedLocality[];
  explanation: string;
  language: string;
  audio?: { mimeType: string; url: string };
  generatedAt: string;
};

type ConversationTurn = {
  conversationId: string;
  speaker: "renter" | "owner";
  sourceLanguage: "en-IN" | "hi-IN" | "kn-IN";
  targetLanguage: "en-IN" | "hi-IN" | "kn-IN";
  audio: { mimeType: string; data: string };
};

type TranslatedTurn = {
  originalText: string;
  translatedText: string;
  audio: { mimeType: string; data: string };
};
```

## Error and fallback behavior

- Invalid or blank location: show an inline prompt to enter a Bengaluru anchor.
- Anakin failure: show a retry action and a source-aware fallback based on the fixed candidate set; label it as limited-live-data mode.
- Google Maps failure: preserve Anakin-backed cards, mark commute and nearby counts as unavailable, and retain no stale Maps photo or estimate.
- Sarvam translation/TTS failure: still show the English text result and explain that language audio is temporarily unavailable.
- Conversation STT/translation/TTS failure: keep the participant's local audio unavailable for sending, show an honest retry action, and never fabricate a translated turn.
- A conversation invite is opened by only one participant: show a waiting state and expire it quickly; do not retain its transcript after expiry.
- No candidate fits the budget: show the three closest fits and explicitly say the budget is difficult for the chosen radius/home type.
- API key absent: show a developer-facing configuration message locally; never leak key values.

## Non-goals for the sprint

- Individual property listings or booking
- Live PSTN phone bridging, Twilio integration, call recording, or automated landlord outreach
- Individual listing-to-office routing, turn-by-turn navigation, or continuously monitored traffic
- User accounts, saved searches, payments, or notifications
- Broad citywide coverage outside the curated Bengaluru candidate set
- A claim that a locality is objectively safe, quiet, or affordable

## Build order (90-minute plan)

1. **First 20 minutes:** scaffold the page, form state, and the recommendation route; verify one Anakin call and one Sarvam call with console output.
2. **Next 20 minutes:** implement fixed candidate selection, Anakin evidence normalization, the pure scorer, and a JSON result card.
3. **Next 20 minutes:** add the bounded Google Places/Routes adapter: three route estimates and selected POI counts; log its normalized output.
4. **Next 20 minutes:** build the wizard, ranked locality cards, source links, map deep links, loading steps, and error states.
5. **Final 10 minutes:** add translation/TTS and test the demo scenario. Only after the core flow works, add the tap-to-talk bilingual room as a stretch feature; a single translated turn is enough for the demo.

## Demo script (two minutes)

1. Enter `Koramangala`, `5 km`, `1BHK`, `₹18k–₹25k`; select `Shorter commute` and `Groceries nearby`.
2. Select Kannada and press **Find my best areas**.
3. Point out the live-source loading steps.
4. Show BTM Layout as the winner, compare it with HSR Layout and Bellandur, point out the time-stamped commute and nearby-grocery evidence, then open a source or Google Maps link.
5. Play the Kannada voice recommendation.
6. Optionally open the bilingual room in a second tab; ask `Is the flat available?` in Kannada and show its Hindi transcript, translation, and spoken reply.
7. Close with: `We do not just find houses; we help people choose the area that makes everyday life work—and help them cross the language barrier after they choose.`

## Acceptance criteria

- A user can complete the preference flow without creating an account.
- The result always displays three ranked locality cards, a winner, source links, and a trade-off.
- The server makes real calls to both Anakin.io and Sarvam.ai when keys are configured.
- When Google Maps credentials are configured, the result includes bounded route/nearby evidence and source-linked Maps deep links; it still works without them.
- The UI visibly shows source evidence and Sarvam’s translated and/or spoken output.
- Any locality visual is clearly attributed, lazy-loaded, limited to one per card, and excluded from the ranking calculation.
- When the stretch feature is enabled, two participants can join a consented browser room and complete a short translated turn with original text, translated text, and translated audio.
- No mobile number is scraped, publicly exposed, or required for the browser-room demo; recordings and transcript persistence are off by default.
- Loading, empty-result, and integration-error states are handled.
- The demonstrated flow completes in under two minutes.
