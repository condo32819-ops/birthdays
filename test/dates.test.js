'use strict';

var assert = require('assert');
var B = require('../dates.js');

function person(name, month, day, year) {
  return { id: name, name: name, month: month, day: day, year: year == null ? null : year };
}

function labels(people, today) {
  return B.sortPeople(people, today).map(function (item) {
    var info = B.describe(item, today);
    return [item.name, info.dateLabel, info.whenLabel, info.ageLabel, info.passed ? 'passed' : 'upcoming', info.today ? 'today' : ''].join('|');
  });
}

var oct31 = { year: 2026, month: 10, day: 31 };

assert.strictEqual(B.isLeap(2024), true);
assert.strictEqual(B.isLeap(2026), false);
assert.strictEqual(B.isLeap(1900), false);
assert.strictEqual(B.isLeap(2000), true);
assert.strictEqual(B.daysInMonth(2), 29);
assert.strictEqual(B.daysInMonth(4), 30);
assert.strictEqual(B.daysInMonth(1), 31);

var alma = B.describe(person('Alma S.', 10, 30, null), oct31);
assert.strictEqual(alma.dateLabel, 'Oct 30');
assert.strictEqual(alma.whenLabel, 'in 364 days');
assert.strictEqual(alma.ageLabel, '');
assert.strictEqual(alma.passed, true);
assert.strictEqual(alma.today, false);

var turns60 = B.describe(person('Sam', 11, 12, 1966), oct31);
assert.strictEqual(turns60.whenLabel, 'in 12 days');
assert.strictEqual(turns60.ageLabel, 'turns 60');
assert.strictEqual(turns60.passed, false);

var turned59 = B.describe(person('Pat', 10, 30, 1967), oct31);
assert.strictEqual(turned59.ageLabel, 'turned 59');
assert.strictEqual(turned59.passed, true);

var birthdayToday = B.describe(person('Nia', 10, 31, 1990), oct31);
assert.strictEqual(birthdayToday.whenLabel, 'Today');
assert.strictEqual(birthdayToday.ageLabel, 'turns 36');
assert.strictEqual(birthdayToday.today, true);

assert.deepStrictEqual(B.observed(2, 29, 2026), { year: 2026, month: 3, day: 1 });
assert.deepStrictEqual(B.observed(2, 29, 2028), { year: 2028, month: 2, day: 29 });
assert.deepStrictEqual(B.observed(2, 29, 2027), { year: 2027, month: 3, day: 1 });

var leapBaby = person('Leap', 2, 29, 2000);
assert.deepStrictEqual(
  [B.describe(leapBaby, { year: 2026, month: 3, day: 1 }).whenLabel, B.describe(leapBaby, { year: 2026, month: 3, day: 1 }).ageLabel, B.describe(leapBaby, { year: 2026, month: 3, day: 1 }).today],
  ['Today', 'turns 26', true]
);
assert.strictEqual(B.describe(leapBaby, { year: 2026, month: 2, day: 28 }).whenLabel, 'in 1 day');
assert.strictEqual(B.describe(leapBaby, { year: 2026, month: 3, day: 2 }).passed, true);
assert.strictEqual(B.describe(leapBaby, { year: 2028, month: 2, day: 29 }).whenLabel, 'Today');
assert.strictEqual(B.describe(leapBaby, { year: 2028, month: 2, day: 28 }).whenLabel, 'in 1 day');

var ordered = labels([
  person('Alma S.', 10, 30, null),
  person('Sam', 11, 12, 1966),
  person('Nia', 10, 31, 1990),
  person('Jan', 1, 1, 1980),
  person('Feb', 2, 1, null),
  person('Dec', 12, 1, 1970)
], oct31);

assert.deepStrictEqual(ordered, [
  'Nia|Oct 31|Today|turns 36|upcoming|today',
  'Sam|Nov 12|in 12 days|turns 60|upcoming|',
  'Dec|Dec 1|in 31 days|turns 56|upcoming|',
  'Jan|Jan 1|in 62 days|turned 46|passed|',
  'Feb|Feb 1|in 93 days||passed|',
  'Alma S.|Oct 30|in 364 days||passed|'
]);

var nye = { year: 2026, month: 12, day: 31 };
assert.deepStrictEqual(labels([
  person('New Year', 1, 1, 2000),
  person('Eve', 12, 31, 1990),
  person('Almost', 12, 30, null)
], nye), [
  'Eve|Dec 31|Today|turns 36|upcoming|today',
  'New Year|Jan 1|in 1 day|turned 26|passed|',
  'Almost|Dec 30|in 364 days||passed|'
]);

var sameDay = labels([
  person('Bea', 11, 12, null),
  person('Ada', 11, 12, null)
], oct31);
assert.strictEqual(sameDay[0].indexOf('Ada|'), 0);
assert.strictEqual(sameDay[1].indexOf('Bea|'), 0);

console.log('dates.test.js ok');
