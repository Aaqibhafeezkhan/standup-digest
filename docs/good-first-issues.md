# Starter issues (copy each into the Issues tab)

Use these titles and bodies when you create the first issues. Add the labels `good first issue` and `help wanted`.

## 1. Test the Quick start and report what is confusing
Follow the README Quick start from scratch with a new Google Form and tell us where you got stuck. Done when: you open an issue or pull request listing the unclear steps, or fix the README wording yourself.

## 2. Add a screenshot of a sample form and a sample email to the README
Done when: the README shows what the form looks like and what the summary email looks like (use made-up names).

## 3. Add ready-made question templates
Add a `templates/` folder with question lists for: daily standup, weekly update, and bug triage. Done when: each template is a short Markdown file with the question titles that work with the default `CONFIG.FIELDS`.

## 4. Add a "this week so far" weekly roll-up
Add a function that summarises the last 7 days: who reported, the blockers raised, and blockers that repeated. Done when: it can be run from the Apps Script editor and emailed to the PM.

## 5. Highlight blockers that repeat for several days
Done when: a blocker mentioned by the same person on 2 or more days in a row is marked "(day 2)", "(day 3)", and so on.

## 6. Send a reminder to people who have not submitted
Add an optional function that emails the people listed in `TEAM` who have no answer yet, at a time set in `CONFIG`. Done when: it works with a list of name-to-email pairs in `CONFIG`.

## 7. Post the summary to Slack
Done when: an optional `SLACK_WEBHOOK_URL` in `CONFIG` makes the summary also post to a Slack channel.

## 8. Export the summary to a "Summaries" sheet tab
Done when: each day's summary is also added as a new row in a tab named `Summaries`.
