const db = window.ODGG.getDb();
const membersRef = db.ref('comite/members');

// ── ADMIN AUTH ──
let isAdmin = false;
const escHtml = window.ODGG.escHtml;

function setAdminUi(val) {
  isAdmin = val;
  renderTable();
}

window.ODGG.createAdminAuth({ db, onAdminChange: setAdminUi });

// ── TABLE ──
const tableBody = document.getElementById('tableBody');
const emptyMsg  = document.getElementById('emptyMsg');
const hint      = document.getElementById('hint');

let membersData = {};

function changeScore(id, delta) {
  membersRef.child(id).child('score').transaction(current => {
    const val = (current || 0) + delta;
    return val < 0 ? 0 : val;
  }, (error, committed, snap) => {
    if (!error && committed) {
      window.ODGG.logAction(db, 'cruche_score_change', {
        id: id,
        delta: delta,
        score: snap && snap.val ? snap.val() : null
      });
    }
  });
}

function renderTable() {
  const entries = Object.entries(membersData).sort(([,a],[,b]) => (b.score || 0) - (a.score || 0));
  tableBody.innerHTML = '';

  if (entries.length === 0) {
    emptyMsg.style.display = 'block';
    hint.textContent = '';
    return;
  }

  emptyMsg.style.display = 'none';
  const medals = ['&#129351;','&#129352;','&#129353;'];

  entries.forEach(([id, m], i) => {
    const score = m.score || 0;
    const tr = document.createElement('tr');
    const actionsTd = isAdmin
      ? `<td class="col-actions">
           <button class="btn-score btn-minus" data-id="${id}" data-delta="-1">&minus;</button>
           <button class="btn-score btn-plus"  data-id="${id}" data-delta="1">+</button>
         </td>`
      : '';
    tr.innerHTML = `
      <td class="col-rank">${medals[i] ?? (i + 1)}</td>
      <td class="col-name">${escHtml(m.name)}</td>
      <td class="col-score ${score > 0 ? 'score-positive' : 'score-zero'}">${score}</td>${actionsTd}`;
    tableBody.appendChild(tr);
  });

  if (isAdmin) {
    tableBody.querySelectorAll('.btn-score').forEach(btn => {
      btn.addEventListener('click', () => changeScore(btn.dataset.id, parseInt(btn.dataset.delta)));
    });
  }

  hint.textContent = `${entries.length} membre${entries.length > 1 ? 's' : ''} \u2014 tri\u00E9 par score`;
}

membersRef.on('value', snap => {
  membersData = snap.val() || {};
  renderTable();
});
