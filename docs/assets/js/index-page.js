const db = window.ODGG.getDb();
const membersRef = db.ref('comite/members');

// ── ELEMENTS ──
const addTitle     = document.getElementById('addTitle');
const addForm      = document.getElementById('addForm');
const nameInput    = document.getElementById('nameInput');
const roleInput    = document.getElementById('roleInput');
const btnAdd       = document.getElementById('btnAdd');
const memberList   = document.getElementById('memberList');
const emptyMsg     = document.getElementById('emptyMsg');
const memberCount  = document.getElementById('memberCount');

let membersData = {};
const escHtml = window.ODGG.escHtml;

const adminAuth = window.ODGG.createAdminPage({
  db,
  adminSections: [
    { element: addTitle, display: 'block' },
    { element: addForm, display: 'flex' }
  ],
  onAdminChange: renderMembers
});

function addMember() {
  const name = nameInput.value.trim();
  if (!name) return;
  const role = roleInput.value.trim();
  membersRef.push({ name: name, role: role || '', score: 0, createdAt: Date.now() }).then(function(ref) {
    window.ODGG.logAction(db, 'member_add', { id: ref.key, name: name, role: role || '' });
  });
  nameInput.value = '';
  roleInput.value = '';
  nameInput.focus();
}

function toggleRoleEdit(id, currentRole) {
  const existing = document.getElementById('role-edit-' + id);
  if (existing) { existing.remove(); return; }
  const rows = document.querySelectorAll('.role-edit-row');
  rows.forEach(function(rowEl) { rowEl.remove(); });

  const card = document.querySelector('[data-card="' + id + '"]');
  if (!card) return;
  const info = card.querySelector('.member-info');

  const row = document.createElement('div');
  row.className = 'role-edit-row';
  row.id = 'role-edit-' + id;
  row.innerHTML =
    '<input class="role-edit-input" type="text" value="' + escHtml(currentRole) + '" placeholder="Poste..." maxlength="40"/>' +
    '<button class="btn-save-role">OK</button>';
  info.appendChild(row);

  const inp = row.querySelector('input');
  const btn = row.querySelector('.btn-save-role');
  inp.focus();

  function save() {
    const nextRole = inp.value.trim();
    membersRef.child(id).update({ role: nextRole }).then(function() {
      window.ODGG.logAction(db, 'member_role_update', { id: id, role: nextRole });
    });
    row.remove();
  }
  btn.addEventListener('click', save);
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') save(); });
}

btnAdd.addEventListener('click', addMember);
nameInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') roleInput.focus(); });
roleInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') addMember(); });

// ── RENDER ──
function renderMembers() {
  const entries = Object.entries(membersData).sort(function(a, b) { return a[1].createdAt - b[1].createdAt; });
  memberList.innerHTML = '';

  if (entries.length === 0) {
    memberList.appendChild(emptyMsg);
    memberCount.textContent = '';
    return;
  }

  for (const entry of entries) {
    const id = entry[0];
    const m = entry[1];
    const role = m.role || '';
    const card = document.createElement('div');
    card.className = 'member-card';
    card.setAttribute('data-card', id);

    const adminBtns = adminAuth.isAdmin
      ? '<div style="display:flex;gap:6px;align-items:center">' +
          '<button class="btn-edit-role" data-edit="' + id + '" data-role="' + escHtml(role) + '">Poste</button>' +
          '<button class="btn-remove" data-id="' + id + '">&#x2715;</button>' +
        '</div>'
      : '';

    card.innerHTML =
      '<div class="member-info">' +
        '<div class="member-name">' + escHtml(m.name) + '</div>' +
        '<div class="member-role ' + (role ? '' : 'empty') + '">' + (role ? escHtml(role) : 'Aucun poste') + '</div>' +
        '<div class="member-score">Score cruche : ' + (m.score || 0) + '</div>' +
      '</div>' + adminBtns;
    memberList.appendChild(card);
  }

  if (adminAuth.isAdmin) {
    const removeBtns = memberList.querySelectorAll('.btn-remove');
    removeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const idToRemove = btn.dataset.id;
        membersRef.child(idToRemove).remove().then(function() {
          window.ODGG.logAction(db, 'member_remove', { id: idToRemove });
        });
      });
    });
    const editBtns = memberList.querySelectorAll('.btn-edit-role');
    editBtns.forEach(function(btn) {
      btn.addEventListener('click', function() { toggleRoleEdit(btn.dataset.edit, btn.dataset.role); });
    });
  }

  memberCount.textContent = entries.length + ' membre' + (entries.length > 1 ? 's' : '');
}

membersRef.on('value', function(snap) {
  membersData = snap.val() || {};
  renderMembers();
});
