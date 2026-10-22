# standup-digest

Collect quick daily standup updates from your dev team and get **one clean summary** for the project manager, with blockers at the top.

Free. No server. Works with the tools you probably already use: a Google Form and a Google Sheet.

## The problem

Daily reports written in long documents take developers too long to fill in, and the project manager still has to read everything to find what is blocked.

## What it does

- Developers answer a few quick questions in a Google Form.
- Every day at a set time, standup-digest builds one summary and emails it to the PM.
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

### Before you start

You need a Google account, permission to create a Google Form and Sheet, and an email address that can receive the summary. Use a test team and test email first.

### 1. Create the form

Create a new Google Form. Add one question for each field below. These are example titles; the script matches keywords, so exact wording is not required.

| Field | Example question title | Suggested question type |
| --- | --- | --- |
| name | Name | Dropdown (one option per team member) |
| projects | Projects worked on | Short answer or paragraph |
| done | What did you complete today? | Paragraph |
| planned | What do you plan to work on next? | Paragraph |
| blockers | Any blockers or challenges? | Paragraph |
| next steps | Next steps | Paragraph |
| notes | Additional notes | Paragraph |

The **Name**, **Done**, and **Blockers** questions are required by the summary logic. Use the same spelling for each team member as in the script's `CONFIG.TEAM` list. A dropdown helps avoid spelling mismatches.

### 2. Link the form to a response sheet

1. Open the form's **Responses** tab.
2. Click the green Google Sheets icon (**Link to Sheets** / **View in Sheets**, depending on the interface).
3. Create a new spreadsheet and open it.
4. Check the response tab name at the bottom. It is usually `Form Responses 1`; if yours differs, copy its exact name for step 4.

Google Forms adds a timestamp column automatically. The script uses that timestamp to select responses submitted **today** in the Apps Script time zone.

### 3. Add the script to the response sheet

1. In the response spreadsheet, choose **Extensions → Apps Script**. This opens a script project attached to that spreadsheet.
2. Open the default script file (usually `Code.gs`), select all its sample contents, and replace them with the full contents of [`apps-script/Code.gs`](apps-script/Code.gs) from this repository.
3. Save the project.

Make sure you copy the file's contents, not the README text.

### 4. Configure the script

At the top of `Code.gs`, edit the `CONFIG` block:

- `PM_EMAIL`: replace `pm@example.com` with the recipient's email address.
- `SHEET_NAME`: use the exact response tab name from step 2.
- `TEAM`: replace the sample names with every person expected to submit, using the same spelling as the form dropdown.
- `SEND_HOUR`: choose an hour from `0` to `23` in the script's time zone. The trigger runs around that hour, not at an exact minute.

Leave the other settings unchanged for the first test unless your form's question titles need different matching patterns.

### 5. Set the time zone

In Apps Script, open **Project Settings** and set **Time zone** to the zone your team uses. The script uses this zone to decide which submissions count as today's responses and when the summary is scheduled.

### 6. Submit a test response and preview the summary

1. Open the form and submit at least one test response **today**. Use a name from `CONFIG.TEAM`, fill in the Done and Blockers questions, and enter a sample blocker such as `Waiting for test credentials`.
2. Return to the Apps Script editor.
3. Select `previewSummary` from the function dropdown and click **Run**.
4. Approve Google's requested permissions if prompted.
5. Open **Execution log** (or the execution's logs) and inspect the output. `previewSummary` only logs the summary; it does **not** send an email.

If the preview is empty or unexpected, see [Troubleshooting](#troubleshooting) before enabling the trigger.

### 7. Enable the daily email

Once the preview looks correct:

1. Confirm `PM_EMAIL` is set to the intended recipient.
2. Select `setupDailyTrigger` and click **Run** once. Approve permissions if prompted.
3. Check **Triggers** in the Apps Script sidebar to confirm a trigger for `sendDailySummary` exists.

The trigger is checked daily, but the default `SEND_DAYS: [1, 2, 3, 4, 5]` setting means the script sends summaries Monday through Friday only. The first scheduled email is sent by the trigger; running `previewSummary` will never send it.

## Questions

The script matches each question by testing the column title against a pattern, ignoring capitalization. By default it looks for:

| Field | Matches a question title containing |
| --- | --- |
| name | name |
| projects | project |
| done | done, completed, finished, accomplished |
| planned | planned, plan for, plan to, will work |
| blockers | blocker, blocked, challenge, obstacle |
| next steps | next step |
| notes | note |

If a title does not match, edit its pattern in `CONFIG.FIELDS`. The `name`, `done`, and `blockers` fields are required; the preview prints a setup warning if it cannot find one.

## Troubleshooting

- **`Sheet "Form Responses 1" not found`:** set `CONFIG.SHEET_NAME` to the exact tab name at the bottom of the response spreadsheet.
- **No responses appear in the preview:** submit a response today, and check the Apps Script project time zone. Older responses are excluded from today's summary.
- **A setup warning appears:** check the matching question title in the Questions table and update the corresponding `CONFIG.FIELDS` pattern.
- **Someone appears under “Check spelling”:** make the submitted name match an entry in `CONFIG.TEAM`, ideally by using a form dropdown.
- **The preview works but no email arrives:** verify `PM_EMAIL`, run `setupDailyTrigger` once, check the Triggers page and Executions page, and confirm the day is included in `SEND_DAYS`.

## Status

Version 1. The summary logic is tested with sample data. The steps above describe the intended Google Forms/Sheets setup; actual behavior can vary with account permissions and form configuration. Real-world testing in different forms and sheets is welcome; please open an issue if something does not match.

## How to help

See [CONTRIBUTING.md](CONTRIBUTING.md) and the **Issues** tab. Ideas on the list: Slack, Telegram and WhatsApp reminders, a weekly roll-up, export to Notion or Google Sheets, ready-made question templates for other kinds of teams.

## License

MIT
