# warroom Launch Plan

**Goal:** 500+ GitHub stars in week 1, sustained organic growth after.

**Core insight:** The conversations ARE the content. Every warroom session produces something shareable. The tool markets itself through its output.

---

## Pre-launch checklist (do before posting anywhere)

- [ ] Fix npm homepage URL (currently points to `github.com/nicolai/warroom`, should be `Djsand/warroom`)
- [ ] Set GitHub social preview image (Settings > Social preview) -- this is the OG image when people share your link on Twitter/Discord/Slack. Make it count.
- [ ] Verify `npx warroom` works cleanly on a fresh machine (test in a clean Docker container or ask a friend)
- [ ] Pin the best example conversation as a GitHub Discussion or gist (for linking in posts)
- [ ] Bump version to 0.2.0 with all the new features (examples, HTML export, stats, CLI redesign)

---

## Day 0: Seed content (evening before launch)

### 1. Create 2-3 Twitter/X threads (draft, don't post yet)

**Thread A -- The hook (post this first):**
```
I built a CLI where 5 AI agents argue about your code before writing it.

One proposes the design.
One attacks it.
One builds it.
One reviews it.
One tries to break it.

The conversation is more interesting than the code.

Here's what happened when I asked it to build an Express server:
[screenshot of terminal output]
```

**Thread B -- The technical deep dive:**
```
How warroom works under the hood:

5 Claude agents with different objective functions.
Each one is optimized for a different thing.

Architect: elegance
Challenger: robustness
Builder: shipping
Reviewer: quality
Breaker: finding failures

They genuinely disagree. That's the point.

[thread continues with architecture diagram and how the phases work]
```

### 2. Prepare a short blog post (Dev.to or Hashnode)

Title options (pick one):
- "I let 5 AI agents argue about my code. Here's what happened."
- "The conversation is the product: building warroom"
- "Why I made AI agents disagree with each other on purpose"

Structure:
1. The problem (AI code gen is a monologue, not a debate)
2. The idea (what if agents had different objectives?)
3. Show a real conversation (the Express server example)
4. The surprising part (Breaker found real bugs the Architect missed)
5. How to try it (npx warroom or Claude Code plugin)
6. Link to GitHub

### 3. Create a 30-second screen recording

Not the VHS GIF -- a real recording of you running warroom on a real task. Show:
- Typing the command
- Agents appearing one by one
- The stats at the end
- Opening the conversation.md

Use QuickTime or OBS. Post as an MP4 (Twitter prefers video over GIFs for reach).

---

## Day 1: Launch day (Tuesday, Wednesday, or Thursday)

### Morning (9-11am ET) -- this is when HN and Reddit peak

**Hacker News** (highest leverage, do this first):
```
Title: Show HN: Warroom -- 5 AI agents debate, build, and review your code
URL: https://github.com/Djsand/warroom
```

In the first comment, post:
- What it does in 2 sentences
- Why the conversation matters more than the code
- One specific example of Breaker catching a real bug
- How to try it: `npx warroom run "your task"`

HN tips:
- Don't ask for upvotes (they detect and penalize this)
- Respond to every comment in the first 2 hours
- Be honest about limitations ("it's v0.2, rough edges exist")
- If people ask "why not just use Claude directly?" -- the answer is "the debate catches things a single agent misses"

**Reddit** (spread across 3-4 subs, stagger by 1 hour):

| Time | Subreddit | Title style |
|------|-----------|-------------|
| 9am ET | r/programming | "Warroom: a CLI where 5 AI agents debate your code architecture before building it" |
| 10am ET | r/ClaudeAI | "I built a multi-agent CLI for Claude -- 5 agents with different objectives argue about your code" |
| 11am ET | r/artificial | "5 AI agents with opposing objectives produce better code than 1 agent agreeing with itself" |
| 12pm ET | r/commandline | "warroom -- multi-agent code review in your terminal" |

Reddit tips:
- Each post should feel native to the subreddit
- r/programming wants technical substance, not marketing
- r/ClaudeAI wants Claude-specific angles
- Include a screenshot or the GIF in every post
- Respond to comments within 30 min

### Afternoon -- Social media

**Twitter/X:**
- Post Thread A at 12pm ET
- Quote-tweet your own thread with the video recording
- Tag @AnthropicAI (they sometimes retweet cool Claude projects)
- Tag @alexalbert__ (CEO of Claude Code, engages with community projects)

**Discord:**
- Anthropic Discord: share in #showcase or #community-projects
- Claude Code Discord: share in the plugins channel
- Other dev Discords you're part of

### Evening -- Follow up

- Respond to all comments on HN/Reddit/Twitter
- If something is getting traction, post the blog article as a follow-up
- Share any interesting community reactions as quote-tweets

---

## Day 2-3: Amplify

- Post Thread B (the technical deep dive)
- If the blog post is ready, submit it to Dev.to and cross-post to Hashnode
- Share on LinkedIn with a professional angle: "What if code review happened before the code was written?"
- Post in relevant Slack communities (especially developer tools channels)

---

## Day 4-7: Sustain

- Share specific conversation excerpts that are interesting/funny/surprising
- Respond to every GitHub issue and PR (fast response time = trust)
- Post a "Week 1" update thread: star count, interesting conversations people shared, bugs found
- Create a "Hall of Fame" page with the best community-submitted conversations

---

## Ongoing growth engine

The viral loop is:
```
User runs warroom
  -> Gets an interesting conversation
  -> Screenshots/shares it
  -> Other devs see it, want to try
  -> They run warroom
  -> Cycle repeats
```

To accelerate this:
1. Add a `warroom share` command that formats the conversation for Twitter/Reddit
2. Add a `warroom read --format html` (already done) -- make the HTML beautiful enough to screenshot
3. Encourage people to post their conversations with a hashtag (#warroom)
4. Feature the best conversations in your README

---

## Key messaging (use these lines everywhere)

**One-liner:** "5 AI agents debate, build, and review your code."

**The hook:** "The conversation is the product."

**The differentiator:** "A single AI agent agrees with itself. Five agents with different objectives catch bugs the others miss."

**The proof:** "Breaker found 2 real bugs in a hello world Express server that Architect and Builder both missed."

---

## What NOT to do

- Don't spam. One post per platform per day max.
- Don't fake engagement. Real comments > manufactured hype.
- Don't oversell. "It's a v0.2 experiment" is more trustworthy than "revolutionary AI tool."
- Don't ignore criticism. Every "this is dumb" comment is a chance to explain the why.
- Don't launch on Friday or weekend (low traffic).
- Don't post without the social preview image set (ugly default = fewer clicks).

---

## Metrics to track

| Metric | Day 1 target | Week 1 target |
|--------|-------------|---------------|
| GitHub stars | 100 | 500 |
| npm downloads | 200 | 1000 |
| HN points | 50+ | -- |
| Twitter impressions | 10k | 50k |

---

## Timeline

| Day | Action |
|-----|--------|
| Today | Fix npm URL, create social preview, prepare content |
| Tomorrow | Draft all posts, record video, prep blog |
| Day after | **LAUNCH** -- HN + Reddit + Twitter + Discord |
| Day 3 | Technical deep dive thread, blog post |
| Day 4 | LinkedIn, Slack communities |
| Day 5-7 | Respond, amplify, share highlights |
