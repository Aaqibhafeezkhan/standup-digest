// Run with:  node tests/summary.test.js
// Loads apps-script/Code.gs and tests the pure summary logic with sample data.
// No Google account needed.

var fs = require("fs");
var vm = require("vm");
var path = require("path");
var assert = require("assert");

var code = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
var ctx = {};
vm.createContext(ctx);
vm.runInContext(code, ctx);

var HEADERS = [
  "Timestamp", "Your name", "Projects you worked on", "Tasks completed today",
  "Tasks planned for tomorrow", "Any blockers?", "Next steps", "Notes"
];
function row(name, done, planned, blockers, projects) {
  return [new Date(), name, projects || "", done, planned, blockers, "", ""];
}
function config(overrides) {
  var c = JSON.parse(JSON.stringify(ctx.CONFIG));
  c.TEAM = ["Ada", "Bola", "Chidi"];
  Object.keys(overrides || {}).forEach(function (k) { c[k] = overrides[k]; });
  return c;
}
function summarise(rows, overrides) {
  return ctx.buildSummary(HEADERS, rows, config(overrides), "21 Oct 2026");
}

var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("ok   - " + name); }
  catch (e) { console.log("FAIL - " + name + "\n       " + e.message); process.exitCode = 1; }
}

test("blockers come before updates, and missing people are listed", function () {
  var s = summarise([
    row("Ada", "Finished login page", "Start settings", "None", "Payments"),
    row("Bola", "API work", "Wait", "Waiting on API keys")
  ]);
  assert(s.indexOf("2 of 3 submitted.") !== -1);
  assert(s.indexOf("## Blockers (1)") < s.indexOf("## Updates"));
  assert(s.indexOf("- **Bola**: Waiting on API keys") !== -1);
  assert(s.indexOf("## Not submitted yet\n- Chidi") !== -1);
});

test("a second submission replaces the first", function () {
  var s = summarise([row("Ada", "Old answer", "", "None"), row("ada", "New answer", "", "None")]);
  assert(s.indexOf("New answer") !== -1);
  assert(s.indexOf("Old answer") === -1);
  assert(s.indexOf("1 of 3 submitted.") !== -1);
});

test("'no blockers' phrases are not reported as blockers", function () {
  ["None", "none.", "No blockers today", "None at the moment", "N/A.", "nope", "Nothing right now", "-", ""]
    .forEach(function (text) {
      var s = summarise([row("Ada", "x", "y", text)]);
      assert(s.indexOf("## Blockers (0)") !== -1, "flagged by mistake: \"" + text + "\"");
    });
});

test("real blockers that start with 'no' or 'none' are still reported", function () {
  ["No access to staging", "None of the test accounts work", "Waiting on API keys"]
    .forEach(function (text) {
      var s = summarise([row("Ada", "x", "y", text)]);
      assert(s.indexOf("## Blockers (1)") !== -1, "missed: \"" + text + "\"");
    });
});

test("a misspelt name is flagged and not counted as a team member", function () {
  var s = summarise([row("Adaa", "x", "y", "None")]);
  assert(s.indexOf("0 of 3 submitted.") !== -1);
  assert(s.indexOf("## Check spelling") !== -1);
  assert(s.indexOf("- Ada\n") !== -1); // Ada still shown as missing
});

test("a question that cannot be found gives a warning", function () {
  var headers = ["Timestamp", "Your name", "Tasks completed today"];
  var s = ctx.buildSummary(headers, [[new Date(), "Ada", "x"]], config(), "21 Oct 2026");
  assert(s.indexOf("## Setup warning") !== -1);
  assert(s.indexOf("\"blockers\"") !== -1);
});

test("answers with line breaks stay on one bullet", function () {
  var s = summarise([row("Ada", "Line one\nLine two", "y", "None")]);
  assert(s.indexOf("- **Done:** Line one / Line two") !== -1);
});

test("nobody submitted gives a clear summary", function () {
  var s = summarise([]);
  assert(s.indexOf("0 of 3 submitted.") !== -1);
  assert(s.indexOf("- Ada\n- Bola\n- Chidi") !== -1);
});

test("weekend days are skipped by default", function () {
  assert.strictEqual(ctx.isSendDay(1, ctx.CONFIG), true);
  assert.strictEqual(ctx.isSendDay(5, ctx.CONFIG), true);
  assert.strictEqual(ctx.isSendDay(6, ctx.CONFIG), false);
  assert.strictEqual(ctx.isSendDay(7, ctx.CONFIG), false);
});

test("email HTML escapes text and keeps bold and lists", function () {
  var html = ctx.markdownToHtml("# Title\n\n- **Ada**: <script>alert(1)</script>\n");
  assert(html.indexOf("<script>") === -1);
  assert(html.indexOf("&lt;script&gt;") !== -1);
  assert(html.indexOf("<strong>Ada</strong>") !== -1);
  assert(html.indexOf("<ul>") !== -1 && html.indexOf("</ul>") !== -1);
});

console.log("\n" + passed + " passed" + (process.exitCode ? ", some FAILED" : ""));

if (process.argv[2] === "--example") {
  console.log("\n" + summarise([
    row("Ada", "Finished login page", "Start settings", "None", "Payments"),
    row("Bola", "Set up CI", "Deploy to staging", "Waiting on API keys", "Payments")
  ]));
}
