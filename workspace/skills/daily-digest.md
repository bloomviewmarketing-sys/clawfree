---
name: Daily Digest
description: Generate a daily summary of news and trends for a topic
version: 1.0.0
author: ClawFree
---

## Triggers
- daily digest
- morning briefing
- news summary
- what's happening with

## Instructions
When the user requests a daily digest:

1. Identify the topic(s) of interest from the user's message
2. Use `web_search` to find recent news and developments (last 24-48 hours)
3. Fetch the top 3-5 most relevant articles using `web_fetch`
4. Compile a digest with:
   - **Date**: Today's date
   - **Headlines**: Top stories with brief descriptions
   - **Key Developments**: What changed and why it matters
   - **Action Items**: Anything the user might want to act on
5. Keep it scannable — use bullet points and bold text

## Tools
- web_search
- web_fetch
