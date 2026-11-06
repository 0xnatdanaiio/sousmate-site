/* Hero try-it card. Same checks as the app (src/core/rules/temperature.ts, templates/nz/fridge-temp.json):
   limit 5.0°C inclusive (MPI SS&S S39-00006 p.42-43); input -30 to 50, 1 decimal (app sanity, not MPI).
   Status wording: en.json "ok" / "bad" with max 5 (the app's TempField), plus the board's "Move the food. Check the fridge."
   Sign slot as SignedTempField (ui-tidy-a A5): the sign is kept apart from the digits, fridges start on "+", a typed or
   pasted leading sign moves into the slot, -0 reads 0.0°C, and the slot keeps focus in the number. Nothing is stored or sent. */
(function () {
  var MAX_C = 5.0, IN_MIN = -30, IN_MAX = 50, SPAN = 9; // SPAN: gauge display only, as RoundRow.tsx
  var NUMBER = /^(\d+)(?:[.,](\d+))?$/;
  var LEAD = /^\s*([+\-−–])/;
  var $ = function (id) { return document.getElementById(id) };
  var input = $('try-temp'), sign = $('try-sign'), field = $('try-field'), rb = $('try-rb'), status = $('try-status'),
      mark = $('try-mark'), act = $('try-act'), what = $('try-what'), err = $('try-err'), save = $('try-save'),
      count = $('try-count'), bar = $('try-bar'), dot3 = $('try-dot3');
  if (!input) return;
  var saved = false, minus = false; // fridges start on "+"

  function parse(raw) {
    var s = raw.trim();
    if (s === '') return { kind: 'empty' };
    var m = NUMBER.exec(s);
    if (!m) return { kind: 'err', msg: 'Enter a number, e.g. 3.5' };
    if (m[2] && m[2].length > 1) return { kind: 'err', msg: 'Use at most 1 decimal place' };
    var v = Number(m[1] + '.' + (m[2] || '0'));
    if (minus && v !== 0) v = -v; // -0 reads and checks as 0.0
    if (v < IN_MIN || v > IN_MAX) return { kind: 'err', msg: 'Check the reading: allowed ' + IN_MIN + ' to ' + IN_MAX + ' °C' };
    return { kind: v <= MAX_C ? 'ok' : 'warm', v: v };
  }

  function fmt(v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '°C' }

  function render() {
    var p = parse(input.value);
    sign.textContent = minus ? '−' : '+';
    sign.setAttribute('aria-label', minus ? 'Change to plus' : 'Change to minus');
    if (p.kind === 'ok') { status.className = 'tstat ok'; status.textContent = '✓ OK — 5°C or lower' }
    else if (p.kind === 'warm') { status.className = 'tstat bad'; status.textContent = '✕ Too warm — above 5°C. Move the food. Check the fridge.' }
    else if (p.kind === 'err') { status.className = 'tstat bad'; status.textContent = p.msg }
    else { status.className = 'tstat none'; status.textContent = 'Enter a temperature' }
    input.setAttribute('aria-invalid', p.kind === 'err' ? 'true' : 'false');
    field.className = p.kind === 'err' ? 'tfield bad' : 'tfield';
    if (p.kind === 'ok' || p.kind === 'warm') {
      rb.textContent = 'Reading: ' + fmt(p.v);
      var pct = Math.max(0, Math.min(100, (p.v - (MAX_C - SPAN)) / (2 * SPAN) * 100));
      mark.style.left = pct + '%'; mark.hidden = false;
    } else { rb.textContent = ''; mark.hidden = true }
    act.hidden = p.kind !== 'warm';
    count.textContent = saved ? '3 of 3 checked' : '2 of 3 checked';
    bar.style.width = saved ? '100%' : '66.67%';
    dot3.className = saved ? 'on' : '';
    save.textContent = saved ? '✓ Saved 1 reading' : 'Save 1 reading';
    save.className = saved ? 'tsave done' : 'tsave';
    return p;
  }

  function edited() { saved = false; err.textContent = ''; render() }

  function trySave() {
    if (saved) { edited(); input.focus(); return } // tap again: start over
    var p = parse(input.value);
    if (p.kind === 'empty' || p.kind === 'err') {
      err.textContent = 'Fix 1 thing before saving. Fridge 1: enter a number like 3.5';
      input.focus(); return;
    }
    if (p.kind === 'warm' && what.value.trim() === '') {
      err.textContent = 'Fix 1 thing before saving. Fridge 1: say what you did';
      what.focus(); return;
    }
    err.textContent = ''; saved = true; render();
  }

  input.addEventListener('input', function () {
    // A typed or pasted leading sign sets the slot and is removed from the digits (A5-3).
    var m = LEAD.exec(input.value);
    if (m) { minus = m[1] !== '+'; input.value = input.value.slice(m[0].length) }
    edited();
  });
  what.addEventListener('input', edited);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); trySave() } });
  // Keep focus in the number so a phone keypad does not close (as SignedTempField).
  sign.addEventListener('pointerdown', function (e) { e.preventDefault() });
  sign.addEventListener('mousedown', function (e) { e.preventDefault() });
  sign.addEventListener('click', function () { minus = !minus; edited() });
  save.addEventListener('click', trySave);
  render();
})();
