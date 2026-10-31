(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Birthdays = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function isLeap(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  // February always offers the 29th. A Feb 29 birthday is stored as that day
  // and, in a non-leap year, observed on March 1.
  function daysInMonth(month) {
    if (month === 2) return 29;
    return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  }

  function observed(month, day, year) {
    if (month === 2 && day === 29 && !isLeap(year)) {
      return { year: year, month: 3, day: 1 };
    }
    return { year: year, month: month, day: day };
  }

  function dayNumber(parts) {
    return Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
  }

  function daysBetween(from, to) {
    return dayNumber(to) - dayNumber(from);
  }

  function partsFromDate(date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  function describe(person, today) {
    var thisYear = observed(person.month, person.day, today.year);
    var delta = daysBetween(today, thisYear);
    var passed = delta < 0;
    var next = passed ? observed(person.month, person.day, today.year + 1) : thisYear;
    var daysUntil = passed ? daysBetween(today, next) : delta;
    var age = null;
    if (person.year != null && person.year !== '') age = today.year - Number(person.year);
    var ageLabel = '';
    if (age != null && age >= 1) ageLabel = (passed ? 'turned ' : 'turns ') + age;
    var whenLabel = 'Today';
    if (daysUntil === 1) whenLabel = 'in 1 day';
    else if (daysUntil > 1) whenLabel = 'in ' + daysUntil + ' days';
    return {
      passed: passed,
      today: delta === 0,
      daysUntil: daysUntil,
      age: age,
      ageLabel: ageLabel,
      whenLabel: whenLabel,
      dateLabel: SHORT_MONTHS[person.month - 1] + ' ' + person.day
    };
  }

  // Upcoming (including today) first, soonest at the top.
  // Dates that already occurred this calendar year follow, in month/day order,
  // so the most recently passed birthday is last.
  function sortPeople(people, today) {
    return people.slice().sort(function (a, b) {
      var da = describe(a, today);
      var db = describe(b, today);
      if (da.passed !== db.passed) return da.passed ? 1 : -1;
      if (!da.passed && da.daysUntil !== db.daysUntil) return da.daysUntil - db.daysUntil;
      if (da.passed) {
        if (a.month !== b.month) return a.month - b.month;
        if (a.day !== b.day) return a.day - b.day;
      }
      var byName = String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' });
      if (byName) return byName;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
  }

  return {
    SHORT_MONTHS: SHORT_MONTHS,
    LONG_MONTHS: LONG_MONTHS,
    isLeap: isLeap,
    daysInMonth: daysInMonth,
    observed: observed,
    partsFromDate: partsFromDate,
    describe: describe,
    sortPeople: sortPeople
  };
});
