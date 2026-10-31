'use strict';

var STORAGE_KEY = 'birthdays.v1';
var YEAR_MIN = 1920;
var LIST_MAX = 400;

var people = [];
var editingId = null;

var listEl = document.getElementById('list');
var emptyEl = document.getElementById('empty');
var editorEl = document.getElementById('editor');
var nameEl = document.getElementById('name');
var monthEl = document.getElementById('month');
var dayEl = document.getElementById('day');
var yearEl = document.getElementById('year');
var deleteEl = document.getElementById('delete');
var formMsgEl = document.getElementById('form-msg');
var backupMsgEl = document.getElementById('backup-msg');
var fileEl = document.getElementById('import-file');

function makeId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function cleanPerson(raw, id) {
  if (!raw || typeof raw !== 'object') return null;
  var name = String(raw.name || '').replace(/[\u0000-\u001F]/g, '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 60) return null;
  var month = Number(raw.month);
  var day = Number(raw.day);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > Birthdays.daysInMonth(month)) return null;
  var year = null;
  if (raw.year !== null && raw.year !== undefined && raw.year !== '') {
    year = Number(raw.year);
    var maxYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > maxYear) return null;
  }
  return { id: id, name: name, month: month, day: day, year: year };
}

function load() {
  var raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
  if (raw === null) {
    var seed = [{ id: 'alma', name: 'Alma S.', month: 10, day: 30, year: null }];
    save(seed);
    return seed;
  }
  try {
    var data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return normalizeList(data);
  } catch (e) {
    return [];
  }
}

function normalizeList(data) {
  var out = [];
  var seen = {};
  data.forEach(function (item) {
    if (out.length >= LIST_MAX) return;
    var preferred = item && typeof item.id === 'string' ? item.id : '';
    var id = preferred && !seen[preferred] ? preferred : makeId();
    var person = cleanPerson(item, id);
    if (!person) return;
    seen[person.id] = true;
    out.push(person);
  });
  return out;
}

function save(next) {
  people = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); } catch (e) { /* private mode */ }
}

function todayParts() {
  return Birthdays.partsFromDate(new Date());
}

function render() {
  var today = todayParts();
  var sorted = Birthdays.sortPeople(people, today);
  listEl.textContent = '';
  sorted.forEach(function (person) {
    var info = Birthdays.describe(person, today);
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'row' + (info.today ? ' today' : '');
    row.dataset.id = person.id;
    if (info.today) row.setAttribute('aria-current', 'date');

    var name = document.createElement('span');
    name.className = 'name';
    name.textContent = person.name;

    var date = document.createElement('span');
    date.className = 'date';
    date.textContent = info.dateLabel;

    var when = document.createElement('span');
    when.className = 'when';
    when.textContent = info.whenLabel;

    var age = document.createElement('span');
    age.className = 'age';
    age.textContent = info.ageLabel;

    row.appendChild(name);
    row.appendChild(date);
    row.appendChild(when);
    row.appendChild(age);
    row.addEventListener('click', function () { openEditor(person.id); });
    listEl.appendChild(row);
  });
  emptyEl.hidden = people.length > 0;
}

function setOptions(select, options, selected) {
  select.textContent = '';
  options.forEach(function (opt) {
    var node = document.createElement('option');
    node.value = String(opt.value);
    node.textContent = opt.label;
    if (String(opt.value) === String(selected)) node.selected = true;
    select.appendChild(node);
  });
}

function fillMonths(selected) {
  var options = Birthdays.LONG_MONTHS.map(function (label, index) {
    return { value: index + 1, label: label };
  });
  setOptions(monthEl, options, selected || 1);
}

function fillDays(selected) {
  var month = Number(monthEl.value) || 1;
  var max = Birthdays.daysInMonth(month);
  var want = selected || Number(dayEl.value) || 1;
  if (want > max) want = max;
  var options = [];
  var day;
  for (day = 1; day <= max; day++) options.push({ value: day, label: String(day) });
  setOptions(dayEl, options, want);
}

function fillYears(selected) {
  var now = new Date().getFullYear();
  var options = [{ value: '', label: 'Year' }];
  var year;
  var extra = selected && (selected < YEAR_MIN || selected > now) ? selected : null;
  var start = extra && extra > now ? extra : now;
  var end = extra && extra < YEAR_MIN ? extra : YEAR_MIN;
  for (year = start; year >= end; year--) {
    if (year > now && year !== extra) continue;
    if (year < YEAR_MIN && year !== extra) continue;
    options.push({ value: year, label: String(year) });
  }
  setOptions(yearEl, options, selected || '');
}

function setFormMessage(text) {
  formMsgEl.textContent = text || '';
}

function openEditor(id) {
  editingId = id || null;
  var person = null;
  if (editingId) {
    person = people.filter(function (item) { return item.id === editingId; })[0] || null;
    if (!person) editingId = null;
  }
  var today = todayParts();
  fillMonths(person ? person.month : today.month);
  fillDays(person ? person.day : today.day);
  fillYears(person ? person.year : null);
  nameEl.value = person ? person.name : '';
  deleteEl.hidden = !person;
  setFormMessage('');
  editorEl.hidden = false;
  window.scrollTo(0, 0);
  nameEl.focus();
}

function closeEditor() {
  editingId = null;
  editorEl.hidden = true;
  setFormMessage('');
}

function onSave(event) {
  event.preventDefault();
  var draft = cleanPerson({
    name: nameEl.value,
    month: monthEl.value,
    day: dayEl.value,
    year: yearEl.value
  }, editingId || makeId());
  if (!draft) {
    setFormMessage(nameEl.value.trim() ? 'Check the date.' : 'Enter a name.');
    return;
  }
  var next = people.slice();
  if (editingId) {
    var index = -1;
    next.forEach(function (item, i) { if (item.id === editingId) index = i; });
    if (index === -1) next.push(draft);
    else next[index] = draft;
  } else {
    if (next.length >= LIST_MAX) {
      setFormMessage('The list is full.');
      return;
    }
    next.push(draft);
  }
  save(next);
  closeEditor();
  render();
}

function onDelete() {
  if (!editingId) return;
  var person = people.filter(function (item) { return item.id === editingId; })[0];
  if (!person) return;
  if (!window.confirm('Delete ' + person.name + '?')) return;
  save(people.filter(function (item) { return item.id !== editingId; }));
  closeEditor();
  render();
}

function setBackupMessage(text) {
  backupMsgEl.textContent = text || '';
}

function backupObject() {
  return { people: people.map(function (person) {
    return {
      id: person.id,
      name: person.name,
      month: person.month,
      day: person.day,
      year: person.year
    };
  }) };
}

function onExport() {
  var text = JSON.stringify(backupObject(), null, 2);
  var blob = new Blob([text + '\n'], { type: 'application/json' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'birthdays.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      setBackupMessage('Copied backup. Also saved birthdays.json.');
    }).catch(function () {
      setBackupMessage('Saved birthdays.json.');
    });
  } else {
    setBackupMessage('Saved birthdays.json.');
  }
}

function applyImport(text) {
  var parsed;
  try { parsed = JSON.parse(text); } catch (e) {
    setBackupMessage('Could not read that backup.');
    return;
  }
  var list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.people) ? parsed.people : null);
  if (!list) {
    setBackupMessage('Could not read that backup.');
    return;
  }
  if (list.length > LIST_MAX) {
    setBackupMessage('That backup has too many people.');
    return;
  }
  var clean = normalizeList(list);
  if (!clean.length && list.length) {
    setBackupMessage('Could not read that backup.');
    return;
  }
  var noun = clean.length === 1 ? 'person' : 'people';
  if (!window.confirm('Replace this list with ' + clean.length + ' ' + noun + '?')) return;
  save(clean);
  closeEditor();
  render();
  setBackupMessage('Imported ' + clean.length + ' ' + noun + '.');
}

function onImportFile() {
  var file = fileEl.files && fileEl.files[0];
  fileEl.value = '';
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () { applyImport(String(reader.result || '')); };
  reader.onerror = function () { setBackupMessage('Could not read that backup.'); };
  reader.readAsText(file);
}

function initPicker() {
  fillMonths(todayParts().month);
  fillDays(todayParts().day);
  fillYears(null);
  monthEl.addEventListener('change', function () { fillDays(); });
}

document.getElementById('add').addEventListener('click', function () { openEditor(null); });
document.getElementById('cancel').addEventListener('click', closeEditor);
deleteEl.addEventListener('click', onDelete);
editorEl.addEventListener('submit', onSave);
document.getElementById('export').addEventListener('click', onExport);
document.getElementById('import-btn').addEventListener('click', function () { fileEl.click(); });
fileEl.addEventListener('change', onImportFile);
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !editorEl.hidden) closeEditor();
});

initPicker();
people = load();
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });
}
