const db = window.ODGG.getDb();
const wordsRef = db.ref('congele/words');

// ── ELEMENTS ──
const addTitle     = document.getElementById('addTitle');
const addForm      = document.getElementById('addForm');
const wordInput    = document.getElementById('wordInput');
const btnAdd       = document.getElementById('btnAdd');
const wordList     = document.getElementById('wordList');
const emptyMsg     = document.getElementById('emptyMsg');
const wordCount    = document.getElementById('wordCount');

let wordsData = {};
const escHtml = window.ODGG.escHtml;

const adminAuth = window.ODGG.createAdminPage({
  db,
  adminSections: [
    { element: addTitle, display: 'block' },
    { element: addForm, display: 'flex' }
  ],
  onAdminChange: render
});

function addWord() {
  const text = wordInput.value.trim();
  if (!text) return;
  wordsRef.push({ text: text, score: 0, createdAt: Date.now() }).then(ref => {
    window.ODGG.logAction(db, 'congele_add', { id: ref.key, text: text });
  });
  wordInput.value = '';
  wordInput.focus();
}

function changeScore(id, delta) {
  window.ODGG.applyNonNegativeDelta(wordsRef.child(id).child('score'), delta, score => {
    window.ODGG.logAction(db, 'congele_score_change', {
      id: id,
      delta: delta,
      score: score
    });
  });
}

btnAdd.addEventListener('click', addWord);
wordInput.addEventListener('keydown', e => { if (e.key === 'Enter') addWord(); });

// ── RENDER ──
function render() {
  const entries = Object.entries(wordsData).sort(([,a],[,b]) => (b.score || 0) - (a.score || 0));
  wordList.innerHTML = '';

  if (entries.length === 0) {
    wordList.appendChild(emptyMsg);
    wordCount.textContent = '';
    return;
  }

  entries.forEach(([id, w]) => {
    const score = w.score || 0;
    const card = document.createElement('div');
    card.className = 'word-card';

    const adminBtns = adminAuth.isAdmin
      ? '<div class="word-actions">' +
          '<button class="btn-score btn-minus" data-id="' + id + '" data-delta="-1">&minus;</button>' +
          '<button class="btn-score btn-plus" data-id="' + id + '" data-delta="1">+</button>' +
          '<button class="btn-remove" data-id="' + id + '">&#x2715;</button>' +
        '</div>'
      : '';

    card.innerHTML =
      '<div class="word-info">' +
        '<span class="word-text">' + escHtml(w.text) + '</span>' +
      '</div>' +
      '<span class="word-score ' + (score > 0 ? 'score-positive' : 'score-zero') + '">' + score + '</span>' +
      adminBtns;

    wordList.appendChild(card);
  });

  if (adminAuth.isAdmin) {
    wordList.querySelectorAll('.btn-score').forEach(btn => {
      btn.addEventListener('click', () => changeScore(btn.dataset.id, parseInt(btn.dataset.delta)));
    });
    wordList.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        wordsRef.child(id).remove().then(() => {
          window.ODGG.logAction(db, 'congele_remove', { id: id });
        });
      });
    });
  }

  wordCount.textContent = entries.length + ' aliment' + (entries.length > 1 ? 's' : '') + ' \u2014 tri\u00e9 par score';
}

wordsRef.on('value', snap => {
  wordsData = snap.val() || {};
  render();
});
