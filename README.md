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

1. **Make a Google Form** with questions like: your name, projects you worked on, tasks completed today, tasks planned, any blockers, next steps, notes. Wording can differ; see "Questions" below.
2. In the form, open the **Responses** tab and click the green **Link to Sheets** icon. This creates the answers sheet.
3. In that sheet, click **Extensions, then Apps Script**.
4. Delete the sample code, paste in the contents of [`apps-script/Code.gs`](apps-script/Code.gs), and save.
5. At the top of the code, edit the **CONFIG** block: the PM's email address, the sheet tab name, and the team's names.
6. In Apps Script, open **Project Settings** and set the **time zone** to yours.
7. Choose `previewSummary` in the function dropdown and click **Run**. Google will ask for permission the first time. Open **Execution log** to see the summary.
8. When it looks right, run `setupDailyTrigger` once. The summary now sends itself every day.

## Questions

The script finds each question by matching words in its title, so you do not have to use exact wording. By default it looks for:

| Field | Matches a question title containing |
| --- | --- |
| name | name |
| projects | project |
| done | done, completed, finished, accomplished |
| planned | planned, plan for, plan to, will work |
| blockers | blocker, blocked, challenge, obstacle |
| next steps | next step |
| notes | note |

If your question is worded differently, change its pattern in `CONFIG.FIELDS`.

## Status

Version 1. The summary logic is tested with sample data. Real-world testing in different forms and sheets is very welcome; please open an issue if something does not match.

## How to help

See [CONTRIBUTING.md](CONTRIBUTING.md) and the **Issues** tab. Ideas on the list: Slack, Telegram and WhatsApp reminders, a weekly roll-up, export to Notion or Google Sheets, ready-made question templates for other kinds of teams.

## License

MIT# standup-digest

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

1. **Make a Google Form** with questions like: your name, projects you worked on, tasks completed today, tasks planned, any blockers, next steps, notes. Wording can differ; see "Questions" below.
2. In the form, open the **Responses** tab and click the green **Link to Sheets** icon. This creates the answers sheet.
3. In that sheet, click **Extensions, then Apps Script**.
4. Delete the sample code, paste in the contents of [`apps-script/Code.gs`](apps-script/Code.gs), and save.
5. At the top of the code, edit the **CONFIG** block: the PM's email address, the sheet tab name, and the team's names.
6. In Apps Script, open **Project Settings** and set the **time zone** to yours.
7. Choose `previewSummary` in the function dropdown and click **Run**. Google will ask for permission the first time. Open **Execution log** to see the summary.
8. When it looks right, run `setupDailyTrigger` once. The summary now sends itself every day.

## Questions

The script finds each question by matching words in its title, so you do not have to use exact wording. By default it looks for:

| Field | Matches a question title containing |
| --- | --- |
| name | name |
| projects | project |
| done | done, completed, finished, accomplished |
| planned | planned, plan for, plan to, will work |
| blockers | blocker, blocked, challenge, obstacle |
| next steps | next step |
| notes | note |

If your question is worded differently, change its pattern in `CONFIG.FIELDS`.

## Status

Version 1. The summary logic is tested with sample data. Real-world testing in different forms and sheets is very welcome; please open an issue if something does not match.

## How to help

See [CONTRIBUTING.md](CONTRIBUTING.md) and the **Issues** tab. Ideas on the list: Slack, Telegram and WhatsApp reminders, a weekly roll-up, export to Notion or Google Sheets, ready-made question templates for other kinds of teams.

## License

MIT
