/* ===== unAustralian — campaign site logic ===== */
(function () {
  'use strict';

  // ---------- State ----------
  var state = {
    count: 47213,
    stateCounts: { NSW: 14820, VIC: 11240, QLD: 9130, WA: 4980, SA: 3210, TAS: 1120, ACT: 1430, NT: 1283 },
    hover: null,
    submitted: false,
    sentTo: null,
    donAmount: 65,
    donFreq: 'once',
    donCustom: '',
    donOther: false,
    donating: false
  };

  var CODES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
  var NAMES = { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania', ACT: 'Aust. Capital Terr.', NT: 'Northern Territory' };
  var STATE_NAMES = { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania', ACT: 'the ACT', NT: 'the Northern Territory' };
  var LEADERS = { NSW: 12, VIC: 12, QLD: 12, WA: 12, SA: 12, TAS: 12, ACT: 2, NT: 2 };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var fmt = function (n) { return n.toLocaleString('en-AU'); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  // ---------- Heat-map colour ramp ----------
  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
  function fill(ratio) {
    var lo = [42, 58, 82], mid = [160, 130, 70], hi = [242, 183, 5], c;
    if (ratio < 0.5) {
      var t = ratio / 0.5;
      c = [lerp(lo[0], mid[0], t), lerp(lo[1], mid[1], t), lerp(lo[2], mid[2], t)];
    } else {
      var t2 = (ratio - 0.5) / 0.5;
      c = [lerp(mid[0], hi[0], t2), lerp(mid[1], hi[1], t2), lerp(mid[2], hi[2], t2)];
    }
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }

  // ---------- Icons ----------
  function icon(key) {
    var open = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f2b705" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';
    var body;
    if (key === 'word') body = '<path d="M12 3 19 6 V11 C19 15 16 18 12 21 C8 18 5 15 5 11 V6 Z"></path><path d="M9 12 11.5 14.5 15 10"></path>';
    else if (key === 'work') body = '<path d="M7 4 H17 V7 A5 5 0 0 1 7 7 Z"></path><path d="M7 5 H4 V7 A3 3 0 0 0 7 9.5"></path><path d="M17 5 H20 V7 A3 3 0 0 1 14 9.5"></path><line x1="12" y1="12" x2="12" y2="16"></line><path d="M8.5 20 H15.5 L14.5 16 H9.5 Z"></path>';
    else if (key === 'fair') body = '<line x1="12" y1="4" x2="12" y2="19"></line><line x1="5" y1="7" x2="19" y2="7"></line><circle cx="12" cy="3.4" r="1.1"></circle><path d="M5 7 2.5 13 H7.5 Z"></path><path d="M19 7 16.5 13 H21.5 Z"></path><line x1="8.5" y1="19" x2="15.5" y2="19"></line>';
    else if (key === 'ladder') body = '<line x1="8" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="16" y2="21"></line><line x1="8" y1="7" x2="16" y2="7"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="17" x2="16" y2="17"></line>';
    else if (key === 'everyone') body = '<circle cx="9" cy="8" r="2.7"></circle><path d="M4.3 19 A4.7 4.7 0 0 1 13.7 19"></path><circle cx="16.6" cy="9" r="2.2"></circle><path d="M14.6 19 A3.8 3.8 0 0 1 21 16.8"></path>';
    else body = '<path d="M2 12 C2 12 6 5 12 5 C18 5 22 12 22 12 C22 12 18 19 12 19 C6 19 2 12 2 12 Z"></path><circle cx="12" cy="12" r="3"></circle>';
    return open + body + '</svg>';
  }

  // ---------- Static content ----------
  var STEPS = [
    { n: '1', title: 'You speak up', body: 'Your name, email and postcode. Thirty seconds.' },
    { n: '2', title: 'We look up your leaders', body: 'Your postcode maps to your state and every leader who represents it.' },
    { n: '3', title: 'They hear from you', body: 'A personalised email goes to every leader for your state, on the record.' }
  ];

  var BILLS = [
    { tag: 'Bill 1 · Tax Reform No. 1 Bill 2026', img: 'assets/people/home.jpg', title: 'CGT discount gutted', body: 'The 50% CGT discount is replaced with a 30% minimum tax floor plus indexation. Negative gearing is restricted, and pre-CGT assets are dragged into the net for the first time.', action: '→ Vote against / restore the 50% discount' },
    { tag: 'Bill 2 · Division 296', img: 'assets/people/retirees.jpg', title: 'The super tax — already law', body: 'Division 296 taxes unrealised gains inside superannuation. It is already legislated. We are asking the Senate to repeal it — you should not be taxed on money you have not received.', action: '→ Repeal' },
    { tag: 'Bill 3 · Trust minimum tax', img: 'assets/people/farmers.jpg', title: 'The trust tax — coming', body: 'A minimum tax on trust distributions has been flagged but not yet drafted. It would hit family businesses and farmers who use trusts for legitimate succession. It must be scrapped before it is written.', action: '→ Scrap before introduction' }
  ];

  var LOSERS = [
    { n: '01', img: 'assets/people/young.jpg', title: 'Young Australians & low-income earners', pullLabel: 'Hit hardest', pull: '30% tax on a $20K income', body: "The 30% CGT floor overrides marginal tax brackets. A student on $20K pays 30% on investment gains — higher than their income tax rate. A young couple investing for their first home gets taxed more than their parents ever were on the same activity. The people with the least are hit the hardest. This isn't a tax on the rich — it's a floor that crushes the bottom." },
    { n: '02', img: 'assets/people/home.jpg', title: 'Homeowners & renters', pullLabel: 'Everyone pays', pull: 'Rents modelled to rise 20%', body: 'Property investors are selling — 5,565 former Melbourne rentals gone in a single quarter. Every rental that becomes an owner-occupied home is one less on the market. Vacancy rates are at 1.2%; rents are modelled to rise 20%. Anyone who bought after Budget night is locked into a new regime overnight, underwater on a deal made when nothing was meant to change. Renters pay more. Owners pay more. Everyone loses except the government.' },
    { n: '03', img: 'assets/people/farmers.jpg', title: 'Farmers & regional Australians', pullLabel: 'The family farm', pull: 'Sell the back paddock to pay the bill', body: "Farm land has appreciated enormously but farm incomes haven't. When mum and dad hand the farm to the kids, the CGT bill can force them to sell the back paddock. The $6M small-business threshold hasn't been updated in years — it now captures ordinary family farms never meant to be treated as 'large businesses.' 3,500+ SMSFs holding farm land are hit by Division 296. Entire regional communities depend on farms staying in family hands. This breaks that." },
    { n: '04', img: 'assets/people/tradie.jpg', title: 'Small business owners & tradies', pullLabel: 'Their only super', pull: '30% minimum tax to retire', body: 'A plumber who built a business over 30 years and sells it at retirement now faces a 30% minimum tax on the gain. For most small-business owners, selling the business IS their superannuation. The concessions are technically preserved, but the thresholds are so outdated they exclude businesses that were clearly intended to qualify. Families using trusts to manage business assets face a new 30% minimum trust tax from 2028.' },
    { n: '05', img: 'assets/people/retirees.jpg', title: 'Retirees & superannuation holders', pullLabel: 'Already law', pull: 'Goalposts moved after the whistle', body: "Division 296 is already law: 15–25% additional tax on super earnings above $3M. People locked money into super for decades because the government told them to — accepting restrictions on access in exchange for favourable tax treatment. Now the treatment has changed after they can't get out. The Tax Institute called it 'an exercise in poor design and dangerous precedent.' If the government can move the goalposts on super, no savings incentive is safe." },
    { n: '06', img: 'assets/people/startups.jpg', title: 'Startups & innovators', pullLabel: 'Built overseas', pull: 'Founders are leaving the country', body: "Startup equity is issued at cents per share, so CPI indexation is meaningless on a near-zero cost base. The 50% discount was the only thing that made employee share schemes competitive with a salary. The 30% floor treats a founder who risked everything for five years the same as a landlord who sat on a house. Founders under 40 have written an open letter to the PM; several say they'll build overseas. The government talks of 'a Future Made in Australia' while taxing out the very people who'd build it." }
  ];

  var TEST = [
    { n: '01', icon: 'word', img: 'assets/values/word.jpg', value: 'Australians keep their word.', body: 'Albanese promised — on the record, repeatedly — that he would not change negative gearing or capital gains tax. He broke that promise in his first post-election Budget. In Australia, your word is your bond. Breaking it is unAustralian.' },
    { n: '02', icon: 'work', img: 'assets/values/work.jpg', value: 'Australians reward hard work.', body: 'The new 30% CGT floor punishes anyone who works hard, saves and invests. A 19-year-old student investing $15,000 sees their effective tax rate nearly triple. A farmer selling land to fund retirement pays up to 47% on the gain. Punishing effort is unAustralian.' },
    { n: '03', icon: 'fair', img: 'assets/values/fair.jpg', value: 'Australians play fair.', body: 'The rules were clear. People made 30-year decisions — bought homes, saved in super, started businesses — based on those rules. Then the government changed them. Changing the rules after the game has started is unAustralian.' },
    { n: '04', icon: 'ladder', img: 'assets/values/ladder.jpg', value: "Australians don't pull the ladder up.", body: "The 50% CGT discount helped generations build wealth. Now it's scrapped for anyone who invests from here. The people who already climbed are grandfathered in. Everyone else is locked out. Pulling the ladder up behind you is unAustralian." },
    { n: '05', icon: 'everyone', img: 'assets/values/everyone.jpg', value: 'Australians give everyone a fair go.', body: "The government says this targets 'the wealthy.' But the 30% floor hits students, young investors, small business owners and farmers — not just millionaires. A tax that punishes battlers is unAustralian." },
    { n: '06', icon: 'eye', img: 'assets/values/eye.jpg', value: "Australians don't lie to win.", body: 'Anthony Albanese looked Australians in the eye before the election and said he would not touch negative gearing or capital gains tax. He won. Then he changed both. Lying to win is the most unAustralian thing a leader can do.' }
  ];

  var DONAMTS = [26, 65, 265, 550, 1500];
  var DONLABELS = { 26: 'Get started', 65: 'Stand up', 265: 'Hit harder', 550: 'Go further', 1500: 'Lead the charge' };
  var DONFREQS = [{ id: 'once', label: 'One-time' }, { id: 'monthly', label: 'Monthly' }];

  // ---------- Postcode → state ----------
  function postcodeToState(pc) {
    var n = parseInt(pc, 10);
    if (isNaN(n)) return null;
    if ((n >= 2600 && n <= 2618) || (n >= 2900 && n <= 2920) || (n >= 200 && n <= 299)) return 'ACT';
    if ((n >= 1000 && n <= 2599) || (n >= 2619 && n <= 2899) || (n >= 2921 && n <= 2999)) return 'NSW';
    if ((n >= 3000 && n <= 3999) || (n >= 8000 && n <= 8999)) return 'VIC';
    if ((n >= 4000 && n <= 4999) || (n >= 9000 && n <= 9999)) return 'QLD';
    if (n >= 5000 && n <= 5799) return 'SA';
    if ((n >= 6000 && n <= 6797) || (n >= 6800 && n <= 6999)) return 'WA';
    if ((n >= 7000 && n <= 7799) || (n >= 7800 && n <= 7999)) return 'TAS';
    if (n >= 800 && n <= 999) return 'NT';
    return null;
  }

  // ---------- Static renders (once) ----------
  function renderStatic() {
    $('#steps').innerHTML = STEPS.map(function (s) {
      return '<div class="step"><span class="step-n cv-h">' + s.n + '</span><div><div class="step-title">' + esc(s.title) + '</div><div class="step-body">' + esc(s.body) + '</div></div></div>';
    }).join('');

    $('#billsGrid').innerHTML = BILLS.map(function (b) {
      return '<div class="bill-card">' +
        '<div class="bill-img"><img src="' + b.img + '" alt="' + esc(b.title) + '"><div class="bill-img-grad"></div></div>' +
        '<div class="bill-body"><span class="bill-tag">' + esc(b.tag) + '</span>' +
        '<h3 class="cv-h bill-title">' + esc(b.title) + '</h3>' +
        '<p class="bill-text">' + esc(b.body) + '</p>' +
        '<span class="bill-action">' + esc(b.action) + '</span></div></div>';
    }).join('');

    $('#costScroll').innerHTML = LOSERS.map(function (g) {
      return '<article class="loser-card">' +
        '<div class="loser-img"><img src="' + g.img + '" alt="' + esc(g.title) + '"><div class="loser-img-grad"></div>' +
        '<span class="loser-pull-label">' + esc(g.pullLabel) + '</span></div>' +
        '<div class="loser-body"><span class="loser-n cv-h">' + g.n + '</span>' +
        '<h3 class="loser-title cv-h">' + esc(g.title) + '</h3>' +
        '<div class="loser-pull cv-h">' + esc(g.pull) + '</div>' +
        '<p class="loser-text">' + esc(g.body) + '</p></div></article>';
    }).join('') + '<div class="cost-spacer"></div>';

    $('#testGrid').innerHTML = TEST.map(function (t) {
      return '<div class="test-cell">' +
        '<div class="test-img"><img src="' + t.img + '" alt="' + esc(t.value) + '"><div class="test-img-grad"></div></div>' +
        '<div class="test-body"><div class="test-head"><span class="test-icon">' + icon(t.icon) + '</span>' +
        '<span class="test-n cv-h">' + t.n + '</span><span class="hairline"></span></div>' +
        '<h3 class="cv-h test-value">' + esc(t.value) + '</h3>' +
        '<p class="test-text">' + esc(t.body) + '</p></div></div>';
    }).join('');

    // Map paths + labels
    var AU = (window.__AU) || { paths: {}, labelPos: {} };
    var svg = '';
    CODES.forEach(function (c) {
      if (!AU.paths[c]) return;
      svg += '<path data-state="' + c + '" d="' + AU.paths[c] + '" stroke="#0b1320" stroke-width="3.5"></path>';
    });
    CODES.forEach(function (c) {
      if (!AU.paths[c] || !AU.labelPos[c]) return;
      svg += '<text data-label="' + c + '" x="' + AU.labelPos[c][0] + '" y="' + AU.labelPos[c][1] + '" class="cv-h" font-weight="600" font-size="27" text-anchor="middle" style="pointer-events:none;">' + c + '</text>';
    });
    $('#countMap').innerHTML = svg;
    // hover wiring
    Array.prototype.forEach.call($('#countMap').querySelectorAll('path'), function (p) {
      var c = p.getAttribute('data-state');
      p.addEventListener('mouseenter', function () { state.hover = c; renderCount(); });
      p.addEventListener('mouseleave', function () { state.hover = null; renderCount(); });
    });
  }

  // ---------- Count / map / bars (dynamic) ----------
  var lastCount = null;
  function renderCount() {
    var countEl = $('#countNumber');
    if (lastCount !== state.count) {
      countEl.textContent = fmt(state.count);
      countEl.classList.remove('tick');
      void countEl.offsetWidth; // reflow to restart animation
      countEl.classList.add('tick');
      lastCount = state.count;
      // hero count label + share links
      var hl = document.querySelector('[data-count-label]');
      if (hl) hl.textContent = fmt(state.count);
    }

    var max = Math.max.apply(null, CODES.map(function (c) { return state.stateCounts[c]; }));

    // map fills + label colours
    Array.prototype.forEach.call($('#countMap').querySelectorAll('path'), function (p) {
      var c = p.getAttribute('data-state');
      var ratio = state.stateCounts[c] / max;
      p.setAttribute('fill', fill(ratio));
    });
    Array.prototype.forEach.call($('#countMap').querySelectorAll('text'), function (tx) {
      var c = tx.getAttribute('data-label');
      var ratio = state.stateCounts[c] / max;
      tx.setAttribute('fill', ratio > 0.5 ? '#0b1320' : '#d0e4e9');
    });

    // hover info
    $('#countHover').textContent = state.hover
      ? NAMES[state.hover] + ' — ' + fmt(state.stateCounts[state.hover]) + ' messages'
      : 'Hover a state to see its message count';

    // bars (sorted desc)
    var sorted = CODES.slice().sort(function (a, b) { return state.stateCounts[b] - state.stateCounts[a]; });
    $('#countBars').innerHTML = sorted.map(function (c) {
      var pct = state.stateCounts[c] / max * 100;
      var active = state.hover === c ? ' active' : '';
      return '<div class="count-bar' + active + '" data-bar="' + c + '">' +
        '<div class="count-bar-top"><span class="count-bar-name">' + NAMES[c] + '</span>' +
        '<span class="count-bar-num cv-h">' + fmt(state.stateCounts[c]) + '</span></div>' +
        '<div class="count-bar-track"><div class="count-bar-fill" style="width:' + pct + '%; background:' + fill(state.stateCounts[c] / max) + ';"></div></div></div>';
    }).join('');
    Array.prototype.forEach.call($('#countBars').querySelectorAll('.count-bar'), function (bar) {
      var c = bar.getAttribute('data-bar');
      bar.addEventListener('mouseenter', function () { state.hover = c; renderCount(); });
      bar.addEventListener('mouseleave', function () { state.hover = null; renderCount(); });
    });
  }

  // ---------- Form ----------
  function showError(msg) {
    var el = $('#formErr');
    el.textContent = msg || '';
    el.classList.toggle('show', !!msg);
  }
  function clearInvalid() {
    ['f-first', 'f-last', 'f-email', 'f-postcode'].forEach(function (id) { $('#' + id).classList.remove('invalid'); });
  }

  function onSubmit(e) {
    e.preventDefault();
    clearInvalid();
    var first = $('#f-first').value.trim();
    var last = $('#f-last').value.trim();
    var email = $('#f-email').value.trim();
    var postcode = $('#f-postcode').value.trim();
    var st = postcodeToState(postcode);
    var bad = [];
    if (!first) bad.push('f-first');
    if (!last) bad.push('f-last');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) bad.push('f-email');
    if (!/^\d{4}$/.test(postcode) || !st) bad.push('f-postcode');
    if (bad.length) {
      bad.forEach(function (id) { $('#' + id).classList.add('invalid'); });
      var msg = 'Please enter your name.';
      if (bad.indexOf('f-postcode') !== -1) msg = 'Enter a valid 4-digit Australian postcode.';
      else if (bad.indexOf('f-email') !== -1) msg = 'Enter a valid email address.';
      showError(msg);
      return;
    }
    showError('');

    state.submitted = true;
    state.sentTo = { code: st, name: STATE_NAMES[st], leaders: LEADERS[st], postcode: postcode, first: first, last: last };
    state.count += 1;
    state.stateCounts[st] += 1;

    renderConfirm();
    renderCount();

    setTimeout(function () {
      var el = document.getElementById('donate');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 8, behavior: 'smooth' });
    }, 80);
  }

  function renderConfirm() {
    var s = state.sentTo;
    $('#leadersForm').hidden = true;
    var c = $('#leadersConfirm');
    c.hidden = false;
    $('[data-confirm-first]', c).textContent = s.first;
    $('[data-confirm-leaders]', c).textContent = s.leaders;
    $('[data-confirm-name]', c).textContent = s.name;
    $('[data-confirm-postcode]', c).textContent = s.postcode;

    var shareText = encodeURIComponent('I just told my leaders this is unAustralian at unAustralian.com.au. ' + fmt(state.count) + ' Australians have joined me. #unAustralian');
    $('#shareX').href = 'https://twitter.com/intent/tweet?text=' + shareText;
    $('#shareFb').href = 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Funaustralian.com.au';

    // donate banner
    var b = $('#donateBanner');
    b.hidden = false;
    $('[data-banner-leaders]', b).textContent = s.leaders;
    $('[data-banner-name]', b).textContent = s.name;
  }

  function resetForm() {
    state.submitted = false;
    state.sentTo = null;
    $('#leadersForm').reset();
    clearInvalid();
    showError('');
    $('#leadersForm').hidden = false;
    $('#leadersConfirm').hidden = true;
    $('#donateBanner').hidden = true;
  }

  // ---------- Donate ----------
  function renderDonate() {
    // freq
    $('#donFreq').innerHTML = DONFREQS.map(function (fr) {
      return '<button type="button" class="don-freq-btn' + (state.donFreq === fr.id ? ' active' : '') + '" data-freq="' + fr.id + '">' + fr.label + '</button>';
    }).join('');
    Array.prototype.forEach.call($('#donFreq').querySelectorAll('button'), function (btn) {
      btn.addEventListener('click', function () { state.donFreq = btn.getAttribute('data-freq'); renderDonate(); });
    });

    // tiers
    var tiers = DONAMTS.map(function (a) {
      var sel = !state.donOther && state.donAmount === a;
      return '<button type="button" class="don-tier' + (sel ? ' active' : '') + '" data-amt="' + a + '">' +
        '<span class="don-tier-amt cv-h">$' + fmt(a) + '</span>' +
        '<span class="don-tier-label">' + DONLABELS[a] + '</span></button>';
    }).join('');
    tiers += '<button type="button" class="don-tier' + (state.donOther ? ' active' : '') + '" data-other="1">' +
      '<span class="don-tier-amt cv-h">$…</span><span class="don-tier-label">Choose amount</span></button>';
    $('#donorGrid').innerHTML = tiers;
    Array.prototype.forEach.call($('#donorGrid').querySelectorAll('button'), function (btn) {
      if (btn.getAttribute('data-other')) {
        btn.addEventListener('click', function () { state.donOther = true; renderDonate(); $('#donCustomInput').focus(); });
      } else {
        btn.addEventListener('click', function () { state.donAmount = parseInt(btn.getAttribute('data-amt'), 10); state.donCustom = ''; state.donOther = false; $('#donCustomInput').value = ''; renderDonate(); });
      }
    });

    // custom field
    var customNum = parseInt(state.donCustom, 10);
    var custom = $('#donCustom');
    custom.hidden = !state.donOther;
    custom.classList.toggle('filled', state.donOther && customNum > 0);

    // button label
    var eff = state.donOther ? (customNum > 0 ? customNum : 0) : state.donAmount;
    var amtStr = '$' + fmt(eff) + (state.donFreq === 'monthly' ? '/mo' : '');
    $('#donateBtn').textContent = (state.donOther && eff <= 0) ? 'Enter an amount →' : 'Donate ' + amtStr + ' →';

    var proc = $('#donProcessing');
    proc.hidden = !state.donating;
    if (state.donating) proc.textContent = 'Taking you to our secure checkout to give ' + amtStr + '…';
  }

  // ---------- Nav menu ----------
  function setupNav() {
    var burger = $('#navBurger');
    var menu = $('#navMenu');
    burger.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
    });
    Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== burger && !burger.contains(e.target)) {
        menu.hidden = true; burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------- Swipe gallery ----------
  function scrollCards() {
    var el = $('#costScroll');
    if (!el) return;
    var card = el.querySelector('article');
    var step = card ? Math.round(card.getBoundingClientRect().width) + 22 : 520;
    var maxLeft = el.scrollWidth - el.clientWidth;
    var from = el.scrollLeft;
    var to = from + step;
    if (to > maxLeft - 20) to = 0;
    var dur = 480, t0 = performance.now();
    var ease = function (p) { return 1 - Math.pow(1 - p, 3); };
    var tick = function (now) {
      var p = Math.min(1, (now - t0) / dur);
      el.scrollLeft = from + (to - from) * ease(p);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---------- Live ticker ----------
  function startTicker() {
    setInterval(function () {
      var ks = Object.keys(state.stateCounts);
      var pick = ks[Math.floor(Math.random() * ks.length)];
      var inc = 1 + Math.floor(Math.random() * 3);
      state.count += inc;
      state.stateCounts[pick] += inc;
      renderCount();
    }, 2300);
  }

  // ---------- Init ----------
  function init() {
    renderStatic();
    renderCount();
    renderDonate();
    setupNav();

    $('#leadersForm').addEventListener('submit', onSubmit);
    $('#resetForm').addEventListener('click', resetForm);
    $('#f-postcode').addEventListener('input', function (e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
    $('#costSwipe').addEventListener('click', scrollCards);
    $('#donCustomInput').addEventListener('input', function (e) {
      state.donCustom = String(e.target.value).replace(/\D/g, '').slice(0, 7);
      state.donOther = true;
      e.target.value = state.donCustom;
      renderDonate();
    });
    $('#donateBtn').addEventListener('click', function (e) {
      e.preventDefault();
      state.donating = true;
      renderDonate();
    });

    startTicker();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
