# standup-digest

Collect quick daily standup updates from your dev team and get **one clean summary** for the project manager, with blockers at the top.

Free. No server. Works with the tools you probably already use: a Google Form and a Google Sheet.

## The problem

Daily reports written in long documents take developers too long to fill in, and the project manager still has to read everything to find what is blocked.

## What it does

- Developers answer a few quick questions in a Google Form.
- On configured weekdays, standup-digest builds one summary and emails it to the PM.
- **Blockers appear first.**
- It lists **who has not submitted yet**.
- If someone submits twice in a day, only their latest answer is used.

Example summary:

```
# Daily standup summary: 21 Oct 2026

2 of 3 submitted.

## Blockers (1)
- **Bola**: Waiting on API keys

## Updates

### Ada
- **Projects:** Payments
- **Done:** Finished login page
- **Planned:** Start settings

## Not submitted yet
- Chidi
```

## Quick start (about 15 minutes)

### 1. Create the form

Create a new Google Form. Add one question for each field below. Using these titles as written is the easiest way to make sure the script recognizes them:

- Name
- Project
- Done
- Planned
- Blockers
- Next steps
- Notes

The questions can be short-answer or paragraph fields. You can use different wording too; the script matches keywords described in [Questions](#questions).

### 2. Link the form to a spreadsheet

In the form, open **Responses** and click the green **Link to Sheets** icon. Create a new spreadsheet when prompted. Keep the default response tab name, usually `Form Responses 1`, unless you plan to update `CONFIG.SHEET_NAME` in the next step.

### 3. Add the script

Open the linked spreadsheet. In its menu, choose **Extensions → Apps Script**. In the editor, open `Code.gs`, replace the sample code with the full contents of [`apps-script/Code.gs`](apps-script/Code.gs), and save.

### 4. Configure the script

At the top of `Code.gs`, update the `CONFIG` values:

- `PM_EMAIL`: the email address that should receive the summary. Replace `pm@example.com`.
- `SHEET_NAME`: the exact name shown on the response sheet's bottom tab, not the spreadsheet file name.
- `TEAM`: the names of everyone expected to submit. Names should match their form answers; a dropdown question helps prevent spelling differences.
- `SEND_HOUR` and `SEND_DAYS`: when the email should be sent. The default is 18:00 (6 PM) Monday through Friday.

In Apps Script, open **Project Settings** and set the **Time zone** to the time zone you want the schedule to use. Save your changes.

### 5. Submit a test response and preview the summary

Open the form's preview, submit one test response today, and confirm it appears in the linked spreadsheet. The script only includes responses submitted on the current date in the configured time zone, so an old response will not appear in today's preview.

Return to Apps Script, select `previewSummary` in the function dropdown, and click **Run**. Approve Google's authorization prompt if asked. Open **Execution log** to inspect the generated summary. This preview only logs the summary; it does not email it.

If the summary shows a setup warning, check the question titles and `CONFIG.FIELDS`. If it says the response sheet cannot be found, check `CONFIG.SHEET_NAME` against the tab name exactly.

### 6. Enable the daily email

Once the preview looks correct and `PM_EMAIL` is set to the intended recipient, select `setupDailyTrigger` and click **Run** once. Approve the requested permissions. This creates the scheduled trigger; the script sends on the configured `SEND_DAYS` and skips other days. You can change the schedule in `CONFIG`.

## Questions

The script finds each question by matching words in its title, ignoring capitalization. By default it looks for:

| Field | Matches a question title containing |
| --- | --- |
| name | name |
| projects | project |
| done | done, completed, finished, accomplished |
| planned | planned, plan for, plan to, will work |
| blockers | blocker, blocked, challenge, obstacle |
| next steps | next step |
| notes | note |

If a question title does not match, change its pattern in `CONFIG.FIELDS`. The `name`, `done`, and `blockers` fields are required by default; a missing required field appears as a setup warning in the preview.

## Status

Version 1. The summary logic is tested with sample data. Real-world testing in different forms and sheets is very welcome; please open an issue if something does not match.

## How to help

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and the **Issues** tab. Ideas on the list: Slack, Telegram and WhatsApp reminders, a weekly roll-up, export to Notion or Google Sheets, ready-made question templates for other kinds of teams.

## License

MIT
