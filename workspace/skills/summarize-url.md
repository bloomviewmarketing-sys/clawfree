---
name: Summarize URL
description: Fetch and summarize the content of any URL
version: 1.0.0
author: ClawFree
---

## Triggers
- summarize this url
- tldr this page
- summarize this link
- what does this page say

## Instructions
When the user provides a URL to summarize:

1. Use the `web_fetch` tool to retrieve the page content
2. Read through the content carefully
3. Provide a concise summary with:
   - **Title**: The page title
   - **Key Points**: 3-5 bullet points covering the main ideas
   - **Summary**: A 2-3 sentence overview
4. If the content is technical, include relevant code examples or data points
5. Note if the content appears to be behind a paywall or login wall

## Tools
- web_fetch
