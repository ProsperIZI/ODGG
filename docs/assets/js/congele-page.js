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

let isAdmin = false;
let wordsData = {};
const escHtml = window.ODGG.escHtml;

// ── ADMIN ──
function setAdminUi(val) {
  isAdmin = val;
  if (val) {
    addTitle.style.display = 'block';
    addForm.style.display = 'flex';
  } else {
    addTitle.style.display = 'none';
    addForm.style.display = 'none';
  }
  render();
}

window.ODGG.createAdminAuth({ db, onAdminChange: setAdminUi });

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
  wordsRef.child(id).child('score').transaction(current => {
    const val = (current || 0) + delta;
    return val < 0 ? 0 : val;
  }, (error, committed, snap) => {
    if (!error && committed) {
      window.ODGG.logAction(db, 'congele_score_change', {
        id: id,
        delta: delta,
        score: snap && snap.val ? snap.val() : null
      });
    }
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

    const adminBtns = isAdmin
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

  if (isAdmin) {
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
