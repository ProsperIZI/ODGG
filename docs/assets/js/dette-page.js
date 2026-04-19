const db = window.ODGG.getDb();
const membersRef = db.ref('comite/members');
const dettesRef = db.ref('dettes');

// ── ADMIN AUTH ──
let isAdmin = false;
const escHtml = window.ODGG.escHtml;

function setAdminUi(val) {
  isAdmin = val;
  renderDebts();
}

window.ODGG.createAdminAuth({ db, onAdminChange: setAdminUi });

// ── DATA ──
let membersData = {};
let dettesData = {};

const selectFrom   = document.getElementById('selectFrom');
const selectTo     = document.getElementById('selectTo');
const amountInput  = document.getElementById('amountInput');
const btnAddDebt   = document.getElementById('btnAddDebt');
const debtList     = document.getElementById('debtList');
const emptyMsg     = document.getElementById('emptyMsg');
const hint         = document.getElementById('hint');
const summarySection = document.getElementById('summarySection');
const summaryList  = document.getElementById('summaryList');

function populateSelects() {
  const entries = Object.entries(membersData).sort(([,a],[,b]) => a.name.localeCompare(b.name));
  [selectFrom, selectTo].forEach(sel => {
    const val = sel.value;
    sel.innerHTML = '<option value="">-- Membre --</option>';
    entries.forEach(([id, m]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = m.name;
      sel.appendChild(opt);
    });
    sel.value = val;
  });
}

function getMemberName(id) {
  return membersData[id] ? membersData[id].name : '???';
}

// ── ADD DEBT ──
btnAddDebt.addEventListener('click', () => {
  const fromId = selectFrom.value;
  const toId = selectTo.value;
  const amount = parseFloat(amountInput.value);
  if (!fromId || !toId) return;
  if (fromId === toId) return;
  if (!amount || amount <= 0) return;
  dettesRef.push({
    from: fromId,
    to: toId,
    amount: Math.round(amount * 100) / 100,
    createdAt: Date.now()
  }).then(ref => {
    window.ODGG.logAction(db, 'debt_add', {
      id: ref.key,
      from: fromId,
      to: toId,
      amount: Math.round(amount * 100) / 100
    });
  });
  amountInput.value = '';
});

// ── RENDER ──
function renderDebts() {
  const entries = Object.entries(dettesData).sort(([,a],[,b]) => b.createdAt - a.createdAt);
  debtList.innerHTML = '';

  if (entries.length === 0) {
    debtList.appendChild(emptyMsg);
    hint.textContent = '';
    summarySection.style.display = 'none';
    return;
  }

  emptyMsg.style.display = 'none';

  let total = 0;
  entries.forEach(([id, d]) => {
    total += d.amount;
    const card = document.createElement('div');
    card.className = 'debt-card';
    const date = new Date(d.createdAt);
    const dateStr = date.toLocaleDateString('fr-FR');
    const removeBtn = isAdmin
      ? `<button class="btn-remove" data-id="${id}">&#x2715;</button>`
      : '';
    card.innerHTML =
      `<div class="debt-info">
        <div class="debt-names">
          <span class="from">${escHtml(getMemberName(d.from))}</span>
          <span class="arrow">doit</span>
          <span class="debt-amount">${d.amount.toFixed(2)} €</span>
          <span class="arrow">à</span>
          <span class="to">${escHtml(getMemberName(d.to))}</span>
        </div>
        <div class="debt-date">${dateStr}</div>
      </div>${removeBtn}`;
    debtList.appendChild(card);
  });

  if (isAdmin) {
    debtList.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        dettesRef.child(id).remove().then(() => {
          window.ODGG.logAction(db, 'debt_remove', { id: id });
        });
      });
    });
  }

  hint.textContent = `${entries.length} dette${entries.length > 1 ? 's' : ''} — total : ${total.toFixed(2)} €`;

  renderSummary(entries);
}

function renderSummary(entries) {
  const balances = {};

  entries.forEach(([, d]) => {
    if (!balances[d.from]) balances[d.from] = { owes: 0, owed: 0 };
    if (!balances[d.to]) balances[d.to] = { owes: 0, owed: 0 };
    balances[d.from].owes += d.amount;
    balances[d.to].owed += d.amount;
  });

  const sorted = Object.entries(balances).sort(([a],[b]) => getMemberName(a).localeCompare(getMemberName(b)));
  summaryList.innerHTML = '';

  if (sorted.length === 0) {
    summarySection.style.display = 'none';
    return;
  }

  summarySection.style.display = 'block';

  sorted.forEach(([id, b]) => {
    const net = b.owed - b.owes;
    let netClass = 'zero';
    let netPrefix = '';
    if (net > 0) { netClass = 'positive'; netPrefix = '+'; }
    else if (net < 0) { netClass = 'negative'; }

    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML =
      `<div class="summary-name">${escHtml(getMemberName(id))}</div>
       <div class="summary-amounts">
         <span class="summary-owes">Doit : ${b.owes.toFixed(2)} €</span>
         <span class="summary-owed">Reçoit : ${b.owed.toFixed(2)} €</span>
         <span class="summary-net ${netClass}">${netPrefix}${net.toFixed(2)} €</span>
       </div>`;
    summaryList.appendChild(card);
  });
}

// ── LISTENERS ──
membersRef.on('value', snap => {
  membersData = snap.val() || {};
  populateSelects();
  renderDebts();
});

dettesRef.on('value', snap => {
  dettesData = snap.val() || {};
  renderDebts();
});
