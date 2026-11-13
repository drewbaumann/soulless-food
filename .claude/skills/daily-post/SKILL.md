---
name: daily-post
description: Write, illustrate and publish today's Soulless Food recipe post. Use when asked to make the daily post, a new Soulless Food entry, or when run by the daily timer.
---

# Soulless Food daily post

Soulless Food (soullessfood.com) is a deadpan AI recipe blog that started in 2020 on GPT-3. The format
is the whole joke, so keep it intact:

- A **person** names the dish (from the submission queue).
- One writer produces the **blogger story** knowing only the name.
- A *different* writer produces the **recipe** knowing only the name.
- The two never see each other's work, so the story and recipe usually don't match. Never reconcile
  them, and never let one mention specifics from the other.

You are the editor running this. Do the steps in order. Repo root is this project directory.

## 1. Preflight

- `git pull --rebase --autostash origin master`
- If `src/content/posts/` already has a file dated today (local date, `YYYY-MM-DD-*`), stop and report
  "already posted today".

## 2. Pick the name

Queue sheet: "Soulless Food recipe name queue", spreadsheet ID
`1GN-lxA_8EUQkxzXgCkWVHWrEmxfSAXD82J6OxMOkD5Q` (Google Sheets connector).

1. List the sheet's tabs with `get_spreadsheet` (fields `sheets.properties.title`). Read every tab with
   `get_values`. A Google Form linked to this sheet adds a tab such as "Form Responses 1" whose columns
   are Timestamp plus the form's questions. Find the column whose header mentions the recipe/dish name.
2. A name is available if it's non-empty, its row's `Status` cell is empty, and it isn't already a
   post title (compare case-insensitively against `title:` in `src/content/posts/*.md`). If a tab
   lacks `Status` and `Post URL` columns, add those headers in the first empty columns of row 1.
3. Take the oldest available name (top-most row; Form tabs are in submission order, so check the
   form tab before the manual tab).
4. Skip and mark `Status` = `skipped: <reason>` for names that are hateful, sexual about real people,
   target a private individual, or are spam. Crude-but-silly is fine; the archive has "Queef Queso".
5. If nothing is available, invent one name yourself in the house style: short, absurd, pun-driven,
   sounds like a dish someone could actually cook (look at 30 or so existing titles for the register).
   Mention in your final report that the queue was empty.

Clean up obvious typos in the name, but keep the submitter's wording and the joke.

## 3. Write the story and the recipe blind

Launch **two subagents in parallel** (Agent tool, general-purpose). Give each one ONLY the dish name and
its brief below. Don't include the other brief, your plans, or anything about the other half.

**Story brief:**
> You are a chatty, earnest home-cooking blogger writing the personal story that sits above the recipe
> on your post for "<NAME>". Write 3 to 6 paragraphs of classic food-blog preamble: family memories,
> holidays, kids, a trip, a tangent about your kitchen or your week. Treat the dish name with total
> sincerity. Never list ingredients or steps, never describe how the dish is made, never wink at the
> joke. Plain paragraphs only: no headings, title or sign-off. Reply with just the paragraphs.

**Recipe brief:**
> Write the recipe for "<NAME>" for a food blog. Take the name at face value and make a real, cookable
> recipe for what it literally describes, however strange. Output ONLY this markdown:
> `## Ingredients` with 5 to 14 `- ` bullet items with amounts, then a blank line, then
> `## Instructions` with 4 to 10 numbered steps. Nothing before or after.

Check each result. Re-run a subagent (with the same brief) if its output is malformed, if the story
describes cooking the dish, or if the recipe adds a story. Don't edit them to match each other.

## 4. Write the post file

Path: `src/content/posts/YYYY-MM-DD-<slug>.md`, where slug is the name lowercased with runs of
non-alphanumerics turned into `-`. Use today's local date and time.

```
---
title: "<Name>"
date: YYYY-MM-DD HH:MM:SS -0800        (local time with numeric offset)
categories: recipe
description: "<one punchy deadpan sentence, <= 140 chars, about the story or the name>"
image_prompt: "<see below>"
---
<story paragraphs>

<recipe markdown>
```

Escape any `"` inside YAML strings as `\"`.

**image_prompt**: 40 to 70 words for a photorealistic food photo of the finished dish *as the recipe
would make it*, plus any visual gag in the name (e.g. "Pope Hat Hash" is a hash shaped like a mitre).
Cover the plating, vessel, surface, lighting and camera angle. No text, people, faces, brands or
live animals. End with "professional food photography, shallow depth of field, natural light".

## 5. Render and check the image

Make sure ComfyUI is up: `curl -sf http://127.0.0.1:8188/system_stats`. If it isn't, start it with
`~/ComfyUI/start.sh --listen 127.0.0.1` in the background and poll until it answers, up to 10 minutes.
Remember whether you started it.

Render: `~/ComfyUI/.venv/bin/python scripts/render_images.py` (renders only posts missing an image;
writes `src/assets/posts/<slug>.jpg`).

**Look at the image** (Read it). Re-render with `--force <slug>` (new random seed each time, up to 3
tries) if it has any text or lettering, mangled food, hands or faces, a live animal, or doesn't look
like the dish. If the prompt itself is the problem, revise `image_prompt` first.

If you started ComfyUI, stop it afterwards (`pkill -f "ComfyUI/main.py"`).

## 6. Build, publish, and close the loop

1. `npm run build` must succeed. Fix anything it complains about in your new post.
2. Commit only the new post and its image, never anything else that happens to be staged:
   `git add src/content/posts/<file> src/assets/posts/<slug>.jpg`, then
   `git commit -m "New post: <Name>" -- src/content/posts/<file> src/assets/posts/<slug>.jpg`,
   then `git push origin master`. The GitHub Action deploys the site. If the push is rejected,
   `git pull --rebase --autostash origin master` and push again once.
3. Post URL: `https://soullessfood.com/recipe/YYYY/MM/DD/<slug>/`, using the post's date **in UTC**.
4. In the queue sheet, set that row's `Status` to `published YYYY-MM-DD` and `Post URL` to the URL.
   (Skip this if you invented the name.)

## 7. Report

Reply with a few lines: the name and where it came from, the post URL, how many image attempts it
took, and anything odd (empty queue, skipped submissions, build fixes).
