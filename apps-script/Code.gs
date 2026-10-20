/**
 * standup-digest, version 1.1
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
  // Tip: make the name question a dropdown in the Form so nobody mistypes it.
  TEAM: ["Name One", "Name Two", "Name Three"],

  // Title used in the email subject and heading.
  TITLE: "Daily standup summary",

  // Hour (0-23) when the summary is sent each day. Used by setupDailyTrigger().
  SEND_HOUR: 18,

  // Days the summary is sent: 1 = Monday ... 7 = Sunday. Default: Monday to Friday.
  SEND_DAYS: [1, 2, 3, 4, 5],

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

  // If one of these questions cannot be found, the summary shows a warning
  // instead of quietly leaving it out.
  REQUIRED_FIELDS: ["name", "done", "blockers"],

  // Answers that mean "nothing to report" for blockers (exact match, ignoring
  // capitals and punctuation at the ends).
  EMPTY_ANSWERS: ["", "none", "no", "nil", "n/a", "na", "nothing", "nope", "-", "no blockers"],

  // Also treats short phrases like "No blockers today" or "None at the moment"
  // as empty. It will NOT match real blockers such as "No access to staging".
  NO_BLOCKER_PATTERN:
    "^(no|none|nil|nothing|nope|n/?a|not any)( (blockers?|issues?|problems?|challenges?))?" +
    "( (today|at the moment|right now|currently|for now|so far|to report))*$"
};

// ---------------------------------------------------------------------------
// Things you run (from the Apps Script editor, or by trigger)
// ---------------------------------------------------------------------------

/** Build today's summary and email it to the PM. Skips days not in SEND_DAYS. */
function sendDailySummary() {
  if (CONFIG.PM_EMAIL === "pm@example.com") {
    throw new Error("Set PM_EMAIL in CONFIG before sending.");
  }
  var tz = Session.getScriptTimeZone();
  var dayNumber = Number(Utilities.formatDate(new Date(), tz, "u")); // 1 = Monday
  if (!isSendDay(dayNumber, CONFIG)) return;

  var summary = buildTodaysSummary_();
  MailApp.sendEmail(CONFIG.PM_EMAIL, CONFIG.TITLE + ": " + summary.dateLabel, summary.text, {
    htmlBody: markdownToHtml(summary.text)
  });
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
  // Form-linked sheets always have the timestamp in column A.
  var rows = values.slice(1).filter(function (r) {
    return r[0] instanceof Date && Utilities.formatDate(r[0], tz, "yyyy-MM-dd") === today;
  });

  return { dateLabel: dateLabel, text: buildSummary(headers, rows, CONFIG, dateLabel) };
}

// ---------------------------------------------------------------------------
// Pure logic (no Google calls, so it is easy to test)
// ---------------------------------------------------------------------------

/** True if the summary should be sent on this day (1 = Monday ... 7 = Sunday). */
function isSendDay(dayNumber, config) {
  return config.SEND_DAYS.indexOf(dayNumber) !== -1;
}

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

/** True if a blockers answer means "nothing to report". */
function isEmptyAnswer(value, emptyAnswers, pattern) {
  var text = clean(value).toLowerCase();
  if (emptyAnswers.indexOf(text) !== -1) return true;
  // Ignore punctuation at the ends and repeated spaces: "None." -> "none".
  var plain = text.replace(/^[\s.!,;:]+|[\s.!,;:]+$/g, "").replace(/\s+/g, " ");
  if (emptyAnswers.indexOf(plain) !== -1) return true;
  return pattern ? new RegExp(pattern, "i").test(plain) : false;
}

/** Turn the answers into a Markdown summary. */
function buildSummary(headers, rows, config, dateLabel) {
  var col = mapColumns(headers, config.FIELDS);
  var get = function (row, key) {
    // Answers that span several lines are joined so the bullets stay tidy.
    return col[key] === undefined ? "" : clean(row[col[key]]).replace(/\s*[\r\n]+\s*/g, " / ");
  };

  // Keep only the latest answer from each person if they submitted twice.
  var latest = {};
  rows.forEach(function (row) {
    var who = get(row, "name") || "Unknown";
    latest[who.toLowerCase()] = { who: who, row: row };
  });
  var people = Object.keys(latest)
    .map(function (k) { return latest[k]; })
    .sort(function (a, b) { return a.who.toLowerCase() < b.who.toLowerCase() ? -1 : 1; });

  // Who is on the team, and who answered that is not on the list (likely a typo).
  var team = {};
  config.TEAM.forEach(function (n) { team[clean(n).toLowerCase()] = clean(n); });
  var inTeam = function (p) { return team.hasOwnProperty(p.who.toLowerCase()); };
  var notInTeam = config.TEAM.length > 0 ? people.filter(function (p) { return !inTeam(p); }) : [];
  var missing = config.TEAM.filter(function (n) { return !latest.hasOwnProperty(clean(n).toLowerCase()); });

  var out = [];
  out.push("# " + config.TITLE + ": " + dateLabel);
  out.push("");
  if (config.TEAM.length > 0) {
    out.push(people.filter(inTeam).length + " of " + config.TEAM.length + " submitted.");
  } else {
    out.push(people.length + " submitted.");
  }
  out.push("");

  // Setup problems come first, because a missing question can hide real blockers.
  var unfound = (config.REQUIRED_FIELDS || []).filter(function (f) { return col[f] === undefined; });
  if (unfound.length > 0) {
    out.push("## Setup warning");
    unfound.forEach(function (f) {
      out.push("- Could not find a form question for \"" + f + "\". Check CONFIG.FIELDS. This summary may be incomplete.");
    });
    out.push("");
  }

  // Blockers first.
  var blockers = people.filter(function (p) {
    return !isEmptyAnswer(get(p.row, "blockers"), config.EMPTY_ANSWERS, config.NO_BLOCKER_PATTERN);
  });
  out.push("## Blockers (" + blockers.length + ")");
  if (blockers.length === 0) out.push("- None reported.");
  blockers.forEach(function (p) { out.push("- **" + p.who + "**: " + get(p.row, "blockers")); });
  out.push("");

  // Everyone's update.
  var labels = [
    ["projects", "Projects"],
    ["done", "Done"],
    ["planned", "Planned"],
    ["nextSteps", "Next steps"],
    ["notes", "Notes"]
  ];
  out.push("## Updates");
  if (people.length === 0) out.push("");
  people.forEach(function (p) {
    out.push("");
    out.push("### " + p.who);
    var lines = [];
    labels.forEach(function (pair) {
      var text = get(p.row, pair[0]);
      if (text) lines.push("- **" + pair[1] + ":** " + text);
    });
    if (lines.length === 0) lines.push("- No other details.");
    lines.forEach(function (l) { out.push(l); });
  });
  out.push("");

  // Who has not answered yet.
  if (config.TEAM.length > 0) {
    out.push("## Not submitted yet");
    if (missing.length === 0) out.push("- Everyone has submitted.");
    missing.forEach(function (n) { out.push("- " + clean(n)); });
    out.push("");
  }

  // Names that did not match the TEAM list.
  if (notInTeam.length > 0) {
    out.push("## Check spelling");
    notInTeam.forEach(function (p) {
      out.push("- \"" + p.who + "\" submitted but is not in the TEAM list.");
    });
    out.push("");
  }

  return out.join("\n").replace(/\n+$/, "\n");
}

/** Convert the Markdown summary to simple HTML for the email. */
function markdownToHtml(markdown) {
  var esc = function (s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var inline = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); };

  var html = [];
  var inList = false;
  var closeList = function () { if (inList) { html.push("</ul>"); inList = false; } };

  markdown.split("\n").forEach(function (line) {
    if (/^### /.test(line)) { closeList(); html.push("<h4>" + inline(line.slice(4)) + "</h4>"); }
    else if (/^## /.test(line)) { closeList(); html.push("<h3>" + inline(line.slice(3)) + "</h3>"); }
    else if (/^# /.test(line)) { closeList(); html.push("<h2>" + inline(line.slice(2)) + "</h2>"); }
    else if (/^- /.test(line)) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push("<li>" + inline(line.slice(2)) + "</li>");
    }
    else if (line.trim() === "") { closeList(); }
    else { closeList(); html.push("<p>" + inline(line) + "</p>"); }
  });
  closeList();
  return html.join("\n");
}
