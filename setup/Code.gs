/**
 * Receives Derryn's website questionnaire and stores it in this Google Sheet.
 * - "Responses" tab: one row per submission (raw answers, one column per question key).
 * - One readable tab per submission: Section | Question | Answer.
 * - Uploaded files go to a Drive folder next to the sheet, one subfolder per submission.
 * - Emails the script owner when a submission arrives.
 * Setup steps: see setup/README.md.
 */

var FOLDER_NAME = 'Derryn website uploads';
var NOTIFY = true;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.action === 'submit') return json(saveSubmission(req.data));
    if (req.action === 'upload') return json(saveUpload(req));
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, message: 'Questionnaire endpoint is running.' });
}

function saveSubmission(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Raw row, adding new columns as needed.
  var sh = ss.getSheetByName('Responses') || ss.insertSheet('Responses', 0);
  var flat = { submittedAt: p.submittedAt, submissionId: p.submissionId, files: (p.files || []).join(', ') };
  Object.keys(p.answers || {}).forEach(function (k) {
    var v = p.answers[k];
    flat[k] = Array.isArray(v) ? v.join(', ') : v;
  });
  var headers = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  Object.keys(flat).forEach(function (k) { if (headers.indexOf(k) < 0) headers.push(k); });
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.appendRow(headers.map(function (k) { return flat[k] === undefined ? '' : flat[k]; }));

  // Readable tab.
  var name = 'Answers ' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyy-MM-dd HH:mm:ss');
  var rd = ss.insertSheet(name, 1);
  var rows = [['Section', 'Question', 'Answer']];
  (p.items || []).forEach(function (i) { rows.push([i.section, i.question, i.answer || '']); });
  rd.getRange(1, 1, rows.length, 3).setValues(rows).setWrap(true).setVerticalAlignment('top');
  rd.getRange(1, 1, 1, 3).setFontWeight('bold');
  rd.setFrozenRows(1);
  rd.setColumnWidth(1, 160); rd.setColumnWidth(2, 360); rd.setColumnWidth(3, 520);

  if (NOTIFY) {
    var body = 'New answers from ' + ((p.answers && p.answers.name) || 'Derryn') + '.\n\n' +
      'Top design: ' + ((p.answers && p.answers.design_rank && p.answers.design_rank[0]) || 'not ranked') + '\n' +
      'Files to follow: ' + ((p.files || []).length) + '\n\n' +
      'Open the sheet: ' + ss.getUrl() + '#gid=' + rd.getSheetId();
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Derryn website questionnaire submitted', body);
  }
  return { ok: true };
}

function saveUpload(req) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var parent = DriveApp.getFileById(ss.getId()).getParents();
  var root = parent.hasNext() ? parent.next() : DriveApp.getRootFolder();
  var base = folder(root, FOLDER_NAME);
  var sub = folder(base, req.submissionId);
  var blob = Utilities.newBlob(Utilities.base64Decode(req.data), req.type, req.name);
  var file = sub.createFile(blob);

  var sh = ss.getSheetByName('Uploads') || ss.insertSheet('Uploads');
  if (!sh.getLastRow()) sh.appendRow(['Uploaded', 'Submission', 'File', 'Link']);
  sh.appendRow([new Date(), req.submissionId, req.name, file.getUrl()]);
  return { ok: true, url: file.getUrl() };
}

function folder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
