/**
 * standup-digest, version 1
 *
 * Reads the answers from a Google Form (through its linked Google Sheet),
 * builds one clean summary for the project manager, and emails it.
 * Blockers go at the top, and people who have not submitted are listed.
 *
 * Set up: see the README. Edit only the CONFIG block below.
 */

// ---------------------------------------------------------------------------
// CONFIG: the only part you need to edit
// ---------------------------------------------------------------------------
var CONFIG = {
  // Where the summary is emailed.
  PM_EMAIL: "pm@example.com",

  // Name of the sheet tab that holds the form answers.
  SHEET_NAME: "Form Responses 1",

  // Everyone who should submit each day (used to list who is missing).
  // Write the names exactly as people type them in the form.
  TEAM: ["Name One", "Name Two", "Name Three"],

  // Title used in the email subject and heading.
  TITLE: "Daily standup summary",

  // Hour (0-23) when the summary is sent each day. Used by setupDailyTrigger().
  SEND_HOUR: 18,

  // How to find each question in your form. Each entry is a pattern matched
  // against the question title (the column header in the sheet), ignoring
  // capital letters. Change a pattern if your question is worded differently.
  FIELDS: {
    name: "name",
    projects: "project",
    done: "done|completed|finished|accomplished",
    planned: "planned|plan for|plan to|will work",
    blockers: "blocker|blocked|challenge|obstacle",
    nextSteps: "next step",
    notes: "note"
  },

  // Answers that mean "nothing to report" for blockers.
  EMPTY_ANSWERS: ["", "none", "no", "nil", "n/a", "na", "nothing", "-", "no blockers", "none."]
};

// ---------------------------------------------------------------------------
// Things you run (from the Apps Script editor, or by trigger)
// ---------------------------------------------------------------------------

/** Build today's summary and email it to the PM. */
function sendDailySummary() {
  var summary = buildTodaysSummary_();
  MailApp.sendEmail(CONFIG.PM_EMAIL, CONFIG.TITLE + ": " + summary.dateLabel, summary.text);
}

/** Build today's summary and only show it in the log (no email). Use this to test. */
function previewSummary() {
  Logger.log("\n" + buildTodaysSummary_().text);
}

/** Run this once. It makes the summary send itself every day at SEND_HOUR. */
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sendDailySummary") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sendDailySummary").timeBased().everyDays(1).atHour(CONFIG.SEND_HOUR).create();
}

// ---------------------------------------------------------------------------
// Google-specific part (reads the sheet)
// ---------------------------------------------------------------------------
function buildTodaysSummary_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" not found. Check SHEET_NAME in CONFIG.');
  var values = sheet.getDataRange().getValues();
  var tz = Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  var dateLabel = Utilities.formatDate(new Date(), tz, "d MMM yyyy");
  var headers = values[0].map(String);
  var rows = values.slice(1).filter(function (r) {
    return r[0] instanceof Date && Utilities.formatDate(r[0], tz, "yyyy-MM-dd") === today;
  });
  return { dateLabel: dateLabel, text: buildSummary(headers, rows, CONFIG, dateLabel) };
}

// ---------------------------------------------------------------------------
// Pure logic (no Google calls, so it is easy to test)
// ---------------------------------------------------------------------------

/** Find which column holds each field. Each column is used for at most one field. */
function mapColumns(headers, fields) {
  var used = {};
  var map = {};
  Object.keys(fields).forEach(function (key) {
    var re = new RegExp(fields[key], "i");
    for (var i = 0; i < headers.length; i++) {
      if (!used[i] && re.test(headers[i])) {
        map[key] = i;
        used[i] = true;
        return;
      }
    }
  });
  return map;
}

function clean(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function isEmptyAnswer(value, emptyAnswers) {
  return emptyAnswers.indexOf(clean(value).toLowerCase()) !== -1;
}

/** Turn the answers into a Markdown summary. */
function buildSummary(headers, rows, config, dateLabel) {
  var col = mapColumns(headers, config.FIELDS);
  var get = function (row, key) { return col[key] === undefined ? "" : clean(row[col[key]]); };

  // Keep only the latest answer from each person if they submitted twice.
  var latest = {};
  rows.forEach(function (row) {
    var who = get(row, "name") || "Unknown";
    latest[who.toLowerCase()] = { who: who, row: row };
  });
  var people = Object.keys(latest).map(function (k) { return latest[k]; });

  var out = [];
  out.push("# " + config.TITLE + ": " + dateLabel);
  out.push("");
  out.push(people.length + " of " + config.TEAM.length + " submitted.");
  out.push("");

  // Blockers first.
  var blockers = people.filter(function (p) { return !isEmptyAnswer(get(p.row, "blockers"), config.EMPTY_ANSWERS); });
  out.push("## Blockers (" + blockers.length + ")");
  if (blockers.length === 0) out.push("- None reported.");
  blockers.forEach(function (p) { out.push("- **" + p.who + "**: " + get(p.row, "blockers")); });
  out.push("");

  //
