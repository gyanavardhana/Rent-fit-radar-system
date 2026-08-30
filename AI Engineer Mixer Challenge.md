# **AI Engineer Mixer: 90-Minute Build Sprint**

- Build window: 11:30 AM to 1:00 PM    
- Submission form opens: around 12:30 PM    
- Submission deadline: 1:00 PM sharp    
- Winner announcement: by 1:30 PM    
- Event link: [https://luma.com/ai-engineer-mixer](https://luma.com/ai-engineer-mixer)

# **What This Sprint Is About**

This is an open-ended build sprint. You do not have to build one fixed project. Pick any idea from the list below, remix two ideas, or build your own idea using [Sarvam.ai](http://Sarvam.ai) and [Anakin.io](http://Anakin.io). The best project will be the one that feels useful, works in a real demo, and shows thoughtful use of the sponsor APIs.

# **Challenge**

Build an AI web app, agent, dashboard, tool, or voice interface that helps a real user ask, understand, monitor, compare, or act on live information.

**You should use:**

\- Sarvam.ai for Indian language, voice, translation, speech-to-text, text-to-speech, document AI, or reasoning

\- Anakin.io for live web search, URL scraping, crawling, website data extraction, or structured website actions

Your project can be serious, practical, playful, local, consumer-focused, developer-focused, or community-focused. It should be possible to explain in two minutes and possible to build a working version in 90 minutes.

## **What You Have To Build**

Your project should include:

\- A working demo that runs locally or is deployed

\- One clear user flow from input to useful output

\- Real API usage from Sarvam.ai and Anakin.io

\- A visible result that judges can understand quickly

\- A short explanation of the user and problem

Mandatory: use both Sarvam.ai and Anakin.io.

## **Timeline**

**11:40 AM to 11:40 AM** \- Pick an idea, form teams, create API keys, scaffold the app.

**11:40 AM to 12:05 PM** \- Make your first Sarvam and Anakin call work. Print real output before building the UI.

**12:05 PM to 12:30 PM** \- Build the core user flow: input, API call, generated result, source display, error state.

**12:30 PM** \- Submission form opens. You can submit anytime after this, but your project can keep improving until 1:00 PM.

**12:30 PM to 1:00 PM** \- Polish the demo. Add loading states, example inputs, source cards, and a clean final screen.

**1:00 PM to 1:40 PM** \- Submit and test your link. After 1:00 PM sharp, no project submissions will be accepted.

**By 2:00 PM** \- Winner announced.

**Prize and credits:** ALL MEMBERS of the winning team get the Keychron keyboard.

# **How To Pick A Good 90-Minute Idea**

Choose an idea where you can build one strong slice, not a whole company.

A good project idea has:

\- One specific user

\- One clear input

\- One useful output

\- One live data source or real user artifact

\- One visible AI transformation

Examples of strong 90-minute scope:

\- Not "AI for shopping", but "compare one keyboard across three pages and give a Hindi voice recommendation."

\- Not "AI travel app", but "scrape one event page and nearby results, then make a local-language event companion."

\- Not "AI research assistant", but "turn five live links into a two-minute source-backed briefing."

# **Project Ideas You Can Build**

### **1\. Speak-to-the-Web Explainer**

A user asks a question in an Indian language. Your app searches the live web, then answers with citations in text and voice.

Use Sarvam: speech-to-text, translation, and text-to-speech.  

Use Anakin: Search API for fresh sources or URL Scraper for selected pages.  

90-minute version: support one typed or spoken question, show three source cards, and play one audio answer.

### **2\. Bengaluru Event Companion**

A micro-assistant for the AI Engineer Mixer that answers agenda questions, venue questions, nearby food options, commute help, and post-event links.

Use Sarvam: Hindi, Kannada, or Tamil answers with optional voice playback.  

Use Anakin: scrape the Luma event page plus web search for nearby food, commute, or cafe options.  

90-minute version: hard-code the event URL, answer five useful questions, and show citation links.

### **3\. Local Price Radar**

A product comparison dashboard that turns messy marketplace pages into a plain-language buying recommendation.

Use Sarvam: translate the recommendation and generate a short voice brief.  

Use Anakin: fetch product titles, prices, availability, and reviews from supported sites or URLs.  

90-minute version: compare one product across two or three sources and produce a ranked recommendation.

### **4\. Review Lens**

A local decision helper that reads reviews or public pages and explains what people actually like, dislike, and should watch out for.

Use Sarvam: translate the summary and create a short spoken verdict.  

Use Anakin: Search API, URL Scraper, or Wire actions for review, product, or location pages.  

90-minute version: analyze one restaurant, college, tool, product, or service and produce five pros and cons.

### **5\. Scheme Navigator**

A civic-services assistant that explains a government scheme or public service page in simple local language.

Use Sarvam: simplified explanation, translation, and voice output.  

Use Anakin: URL Scraper or Search API to pull official pages and recent references.  

90-minute version: support one category such as scholarships, startup grants, farmer support, or transport services.

# **How To Use Sarvam.ai**

Use Sarvam.ai when your app needs Indian language intelligence, speech input, speech output, translation, document extraction, or a reasoning layer.

Good Sarvam use cases:

\- Speech input: use speech-to-text to let users ask questions by voice

\- Voice output: use text-to-speech to generate spoken answers

\- Translation: translate summaries into Hindi, Kannada, Tamil, Telugu, Marathi, or another supported language

\- Chat/reasoning: summarize, classify, explain, or draft based on live web data

\- Document AI: extract useful information from PDFs, scans, or forms

**Fast setup:**

\`\`\`bash

pip install sarvamai

export SARVAM\_API\_KEY="your\_key\_here"

\`\`\`

**Python starter:**

\`\`\`python

import os

from sarvamai import SarvamAI

from sarvamai.play import save

client \= SarvamAI(api\_subscription\_key=os.environ\["SARVAM\_API\_KEY"\])

translated \= client.text.translate(

    input="Summarize this for a beginner.",

    source\_language\_code="auto",

    target\_language\_code="hi-IN",

)

audio \= client.text\_to\_speech.convert(

    text="Welcome to the AI Engineer Mixer.",

    language\_code="en-IN",

    model="bulbul:v3",

    speaker="shubh",

)

save(audio, "answer.wav")

\`\`\`

Tip: If you add voice, make the pipeline visible. Show the transcript, translated text, and playable audio.

# **How To Use Anakin.io**

Use Anakin.io when your app needs live web content, source pages, search results, product data, review data, company information, or structured website actions.

Good Anakin.io use cases:

\- Search API: get fresh web results with source links

\- URL Scraper: turn one web page into Markdown or structured data

\- Crawl/Map: collect useful pages from a small website

\- Wire: use pre-built structured actions for supported websites

\- SDK/CLI: integrate faster from Node.js or Python

**Fast setup:**

\`\`\`bash

export ANAKIN\_API\_KEY="ak-your-key-here"

npm install @anakin-io/sdk

\# or: pip install anakin-sdk

\`\`\`

**Node starter with the SDK:**

\`\`\`ts

import { Anakin } from "@anakin-io/sdk";

const anakin \= new Anakin({ apiKey: process.env.ANAKIN\_API\_KEY });

const page \= await anakin.scrape("https://example.com", {

  formats: \["markdown"\],

});

console.log(page.markdown);

\`\`\`

**Search API starter:**

\`\`\`ts

const response \= await fetch("https://api.anakin.io/v1/search", {

  method: "POST",

  headers: {

    "X-API-Key": process.env.ANAKIN\_API\_KEY,

    "Content-Type": "application/json",

  },

  body: JSON.stringify({

    prompt: "best beginner-friendly AI events in Bengaluru",

    limit: 5,

  }),

});

const data \= await response.json();

console.log(data.results);

\`\`\`

Tip: Use Anakin.io on the server side only. Never put an API key in frontend code. Cache one or two responses during the sprint so your demo stays fast.

# **What To Submit**

Submit one form per team, you will need:

\- Project name

\- Team member names

\- One-sentence pitch

\- Demo link or local demo instructions

\- GitHub repo, zip, or code link

\- Which idea you chose, remixed, or created

\- Where you used Sarvam.ai

\- Where you used Anakin.io

\- One example input the judges should try

\- Any limitations judges should know

# **Judging Rubric**

- Good Ideation (25%): The project has a clear, original, and useful idea with a well-defined user, problem.  
- Sponsor API use (25%): Sarvam.ai and Anakin.io usage is meaningful, visible, and central to the value.  
- Originality and usefulness (20%): The idea solves a real problem in a memorable way.  
- User experience (10%): The UI is clear, polished, and easy to demo in two minutes.  
- Technical clarity (10%): The team can explain the architecture, tradeoffs, and next steps.  
- Working Product (10%): The demo runs, handles errors, and shows a complete user flow.

# **Resources**

- Event page: [https://luma.com/ai-engineer-mixer](https://luma.com/ai-engineer-mixer)    
- Get Sarvam API Key: [https://indus.sarvam.ai/key-management](https://indus.sarvam.ai/key-management)  
- Sarvam quickstart: [https://docs.sarvam.ai/api/getting-started/quickstart](https://docs.sarvam.ai/api/getting-started/quickstart)    
- Sarvam SDKs: [https://docs.sarvam.ai/api/getting-started/sdks](https://docs.sarvam.ai/api/getting-started/sdks)    
- Sarvam models: [https://docs.sarvam.ai/api/getting-started/models](https://docs.sarvam.ai/api/getting-started/models)    
- Anakin.io getting started: [https://anakin.io/docs/documentation/getting-started](https://anakin.io/docs/documentation/getting-started)    
- Anakin.io SDKs: [https://anakin.io/docs/sdks](https://anakin.io/docs/sdks)    
- Anakin.io Search API: [https://anakin.io/docs/api-reference/search/search](https://anakin.io/docs/api-reference/search/search)    
- Anakin.io Wire: [https://anakin.io/products/wire](https://anakin.io/products/wire)

