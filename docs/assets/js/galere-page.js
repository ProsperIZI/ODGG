const db = window.ODGG.getDb();
const membersRef = db.ref('comite/members');
const anecdotesRef = db.ref('galere/anecdotes');

// ── ADMIN AUTH ──
let isAdmin = false;
const escHtml = window.ODGG.escHtml;

function setAdminUi(val) {
  isAdmin = val;
  render();
}

window.ODGG.createAdminAuth({ db, onAdminChange: setAdminUi });

// ── DATA ──
const memberListEl = document.getElementById('memberList');
const emptyMsg     = document.getElementById('emptyMsg');
const memberCount  = document.getElementById('memberCount');

let membersData = {};
let anecdotesData = {};

function addAnecdote(memberId) {
  const input = document.getElementById('anecdote-input-' + memberId);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  anecdotesRef.child(memberId).push({ text: text, createdAt: Date.now() }).then(ref => {
    window.ODGG.logAction(db, 'galere_add', { memberId: memberId, anecdoteId: ref.key });
  });
  input.value = '';
  input.focus();
}

function removeAnecdote(memberId, anecdoteId) {
  anecdotesRef.child(memberId).child(anecdoteId).remove().then(() => {
    window.ODGG.logAction(db, 'galere_remove', { memberId: memberId, anecdoteId: anecdoteId });
  });
}

function render() {
  const entries = Object.entries(membersData).sort((a, b) => a[1].createdAt - b[1].createdAt);
  memberListEl.innerHTML = '';

  if (entries.length === 0) {
    memberListEl.appendChild(emptyMsg);
    memberCount.textContent = '';
    return;
  }

  entries.forEach(([id, m]) => {
    const memberAnecdotes = anecdotesData[id] || {};
    const anecdoteEntries = Object.entries(memberAnecdotes).sort((a, b) => a[1].createdAt - b[1].createdAt);

    const block = document.createElement('div');
    block.className = 'member-block';

    let anecdotesHtml = '';
    if (anecdoteEntries.length > 0) {
      anecdotesHtml = '<div class="anecdotes">' + anecdoteEntries.map(([aId, a]) => {
        const removeBtn = isAdmin
          ? '<button class="btn-remove-anecdote" data-member="' + id + '" data-anecdote="' + aId + '">&times;</button>'
          : '';
        return '<div class="anecdote">' +
          '<span class="anecdote-bullet">&rsaquo;</span>' +
          '<span class="anecdote-text">' + escHtml(a.text) + '</span>' +
          removeBtn +
          '</div>';
      }).join('') + '</div>';
    } else {
      anecdotesHtml = '<div class="no-anecdotes">Aucune galère</div>';
    }

    const addHtml = isAdmin
      ? '<div class="add-anecdote">' +
          '<input id="anecdote-input-' + id + '" type="text" placeholder="Ajouter une galère..." maxlength="200"/>' +
          '<button class="btn-add-anecdote" data-member="' + id + '">+</button>' +
        '</div>'
      : '';

    const roleHtml = m.role
      ? '<span class="member-role">' + escHtml(m.role) + '</span>'
      : '';

    block.innerHTML =
      '<div class="member-header">' +
        '<span class="member-name">' + escHtml(m.name) + '</span>' +
        roleHtml +
      '</div>' +
      anecdotesHtml +
      addHtml;

    memberListEl.appendChild(block);
  });

  // Event listeners
  if (isAdmin) {
    memberListEl.querySelectorAll('.btn-add-anecdote').forEach(btn => {
      const memberId = btn.dataset.member;
      btn.addEventListener('click', () => addAnecdote(memberId));
    });

    memberListEl.querySelectorAll('.add-anecdote input').forEach(input => {
      const memberId = input.id.replace('anecdote-input-', '');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') addAnecdote(memberId); });
    });

    memberListEl.querySelectorAll('.btn-remove-anecdote').forEach(btn => {
      btn.addEventListener('click', () => removeAnecdote(btn.dataset.member, btn.dataset.anecdote));
    });
  }

  memberCount.textContent = entries.length + ' membre' + (entries.length > 1 ? 's' : '');
}

membersRef.on('value', snap => {
  membersData = snap.val() || {};
  render();
});

anecdotesRef.on('value', snap => {
  anecdotesData = snap.val() || {};
  render();
});
