const SPREADSHEET_ID = '1dVpuMSqXkbQpR389fMyHCG8iZoFRmUkkx34ViDT_xk0';
const API_VERSION = '2026-07-07-v1';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'health';
  if (action === 'entries') {
    return jsonResponse({ ok: true, version: API_VERSION, entries: getEntries_(e.parameter || {}) });
  }
  if (action === 'scores') {
    return jsonResponse({ ok: true, version: API_VERSION, scores: getScores_(e.parameter || {}) });
  }
  return jsonResponse({ ok: true, version: API_VERSION, message: 'Путь взросления API работает' });
}

function doPost(e) {
  try {
    const data = parseBody_(e);
    const action = data.action || 'saveEntry';

    if (action === 'saveEntry') {
      const entry = saveEntry_(data.entry || data);
      return jsonResponse({ ok: true, version: API_VERSION, entry: entry });
    }

    if (action === 'deleteEntry') {
      const result = deleteEntry_(data.entry_id, data.user_key || 'anastasia');
      return jsonResponse({ ok: true, version: API_VERSION, result: result });
    }

    if (action === 'saveScores') {
      const result = saveScores_(data.user_key || 'anastasia', data.scores || []);
      return jsonResponse({ ok: true, version: API_VERSION, result: result });
    }

    if (action === 'event') {
      const event = saveEvent_(data);
      return jsonResponse({ ok: true, version: API_VERSION, event: event });
    }

    return jsonResponse({ ok: false, version: API_VERSION, error: 'Unknown action: ' + action }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, version: API_VERSION, error: String(err && err.message ? err.message : err) }, 500);
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const text = e.postData.contents;
  try {
    return JSON.parse(text);
  } catch (err) {
    return { raw: text };
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function sh_(name) {
  return ss_().getSheetByName(name);
}

function nowIso_() {
  return new Date().toISOString();
}

function uuid_() {
  return Utilities.getUuid();
}

function appendObject_(sheetName, headers, obj) {
  const row = headers.map(function(h) { return obj[h] === undefined || obj[h] === null ? '' : obj[h]; });
  sh_(sheetName).appendRow(row);
  return obj;
}

function saveEntry_(raw) {
  const entry = {
    entry_id: raw.entry_id || uuid_(),
    user_key: raw.user_key || 'anastasia',
    platform: raw.platform || 'telegram',
    created_at: raw.created_at || nowIso_(),
    schema_id: raw.schema_id || raw.schema || '',
    schema_name: raw.schema_name || '',
    mode: raw.mode || '',
    strategy: raw.strategy || '',
    activation: raw.activation || '',
    marker_score: raw.marker_score || raw.markerScore || '',
    old_pattern: raw.old_pattern === undefined ? (raw.oldPattern || false) : raw.old_pattern,
    delta: raw.delta || 0,
    q1_situation: raw.q1_situation || raw.q1 || '',
    q2_feelings: raw.q2_feelings || raw.q2 || '',
    q3_thoughts: raw.q3_thoughts || raw.q3 || '',
    q4_auto_action: raw.q4_auto_action || raw.q4 || '',
    q6_formed_when: raw.q6_formed_when || raw.q6 || '',
    q7_critic: raw.q7_critic || raw.q7 || '',
    q8_protective_behavior: raw.q8_protective_behavior || raw.q8 || '',
    q9_reality: raw.q9_reality || raw.q9 || '',
    q10a_loving_parent: raw.q10a_loving_parent || raw.q10a || '',
    q10b_healthy_adult: raw.q10b_healthy_adult || raw.q10b || '',
    source: raw.source || 'app',
    deleted_at: ''
  };

  appendObject_('MemoEntries', [
    'entry_id','user_key','platform','created_at','schema_id','schema_name','mode','strategy','activation','marker_score','old_pattern','delta','q1_situation','q2_feelings','q3_thoughts','q4_auto_action','q6_formed_when','q7_critic','q8_protective_behavior','q9_reality','q10a_loving_parent','q10b_healthy_adult','source','deleted_at'
  ], entry);

  saveEvent_({ user_key: entry.user_key, platform: entry.platform, event_type: 'saveEntry', payload_json: JSON.stringify({ entry_id: entry.entry_id, schema_id: entry.schema_id }) });
  return entry;
}

function getEntries_(params) {
  const userKey = params.user_key || 'anastasia';
  const limit = Number(params.limit || 50);
  const values = sh_('MemoEntries').getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const rows = values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  }).filter(function(x) {
    return String(x.user_key || '') === userKey && !x.deleted_at;
  });
  return rows.slice(Math.max(0, rows.length - limit)).reverse();
}

function deleteEntry_(entryId, userKey) {
  if (!entryId) throw new Error('entry_id is required');
  const sheet = sh_('MemoEntries');
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];
  const idCol = headers.indexOf('entry_id');
  const userCol = headers.indexOf('user_key');
  const deletedCol = headers.indexOf('deleted_at');
  if (idCol < 0 || userCol < 0 || deletedCol < 0) throw new Error('MemoEntries headers are invalid');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(entryId) && String(values[i][userCol]) === String(userKey)) {
      sheet.getRange(i + 1, deletedCol + 1).setValue(nowIso_());
      saveEvent_({ user_key: userKey, platform: 'telegram', event_type: 'deleteEntry', payload_json: JSON.stringify({ entry_id: entryId }) });
      return { entry_id: entryId, deleted: true };
    }
  }
  return { entry_id: entryId, deleted: false, reason: 'not_found' };
}

function getScores_(params) {
  const userKey = params.user_key || 'anastasia';
  const values = sh_('Scores').getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  }).filter(function(x) { return String(x.user_key || '') === userKey; });
}

function saveScores_(userKey, scores) {
  if (!Array.isArray(scores)) throw new Error('scores must be an array');
  const sheet = sh_('Scores');
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const schemaCol = headers.indexOf('schema_id');
  const userCol = headers.indexOf('user_key');
  const currentCol = headers.indexOf('current_score');
  const updatedCol = headers.indexOf('updated_at');

  scores.forEach(function(score) {
    let updated = false;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][userCol]) === String(userKey) && String(values[i][schemaCol]) === String(score.schema_id)) {
        sheet.getRange(i + 1, currentCol + 1).setValue(score.current_score);
        sheet.getRange(i + 1, updatedCol + 1).setValue(nowIso_());
        updated = true;
        break;
      }
    }
    if (!updated) {
      sheet.appendRow([
        userKey,
        score.schema_id || '',
        score.schema_name || '',
        score.base_score || '',
        score.current_score || '',
        nowIso_()
      ]);
    }
  });

  saveEvent_({ user_key: userKey, platform: 'telegram', event_type: 'saveScores', payload_json: JSON.stringify({ count: scores.length }) });
  return { saved: scores.length };
}

function saveEvent_(raw) {
  const event = {
    event_id: raw.event_id || uuid_(),
    user_key: raw.user_key || 'anastasia',
    platform: raw.platform || 'telegram',
    created_at: raw.created_at || nowIso_(),
    event_type: raw.event_type || 'event',
    payload_json: raw.payload_json || JSON.stringify(raw.payload || {})
  };
  return appendObject_('AppEvents', ['event_id','user_key','platform','created_at','event_type','payload_json'], event);
}

function testLocalSaveEntry() {
  const entry = saveEntry_({
    user_key: 'anastasia',
    platform: 'test',
    schema_id: 'test_schema',
    schema_name: 'Тестовая схема',
    activation: 1,
    delta: 0,
    q1: 'Тестовая запись API',
    q10b: 'Проверка сохранения'
  });
  Logger.log(JSON.stringify(entry, null, 2));
}
