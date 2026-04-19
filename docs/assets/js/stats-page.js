const db = window.ODGG.getDb();

const backupPanel = document.getElementById('backupPanel');

const statsGrid = document.getElementById('statsGrid');
const topCruche = document.getElementById('topCruche');
const historyList = document.getElementById('historyList');
const readonlyLink = document.getElementById('readonlyLink');
const btnCopyReadonly = document.getElementById('btnCopyReadonly');
const btnExport = document.getElementById('btnExport');
const importFile = document.getElementById('importFile');
const btnImport = document.getElementById('btnImport');
const backupHint = document.getElementById('backupHint');

let isAdmin = false;
let rootData = {};
const escHtml = window.ODGG.escHtml;

function setAdminUi(val) {
  isAdmin = val;
  backupPanel.style.display = isAdmin ? 'block' : 'none';
}

window.ODGG.createAdminAuth({
  db,
  labels: { readOnly: 'Lecture seule' },
  onAdminChange: setAdminUi
});

function renderStats() {
  const members = rootData.comite && rootData.comite.members ? rootData.comite.members : {};
  const debts = rootData.dettes || {};
  const players = rootData.game && rootData.game.players ? rootData.game.players : {};
  const history = rootData.history || {};

  const memberEntries = Object.values(members);
  const debtEntries = Object.values(debts);
  const playerEntries = Object.values(players);
  const historyEntries = Object.entries(history)
    .map(([id, h]) => ({ id, ...(h || {}) }))
    .sort((a, b) => (b.at || 0) - (a.at || 0));

  const totalScore = memberEntries.reduce((sum, m) => sum + (m.score || 0), 0);
  const totalDebt = debtEntries.reduce((sum, d) => sum + (d.amount || 0), 0);
  const activePlayers = playerEntries.filter(p => !p.eliminated).length;
  const eliminatedPlayers = playerEntries.filter(p => p.eliminated).length;

  const cards = [
    { label: 'Membres', value: memberEntries.length },
    { label: 'Score cruche total', value: totalScore },
    { label: 'Dettes totales', value: totalDebt.toFixed(2) + ' €' },
    { label: 'Joueurs actifs', value: activePlayers },
    { label: 'Joueurs éliminés', value: eliminatedPlayers },
    { label: 'Actions journalisées', value: historyEntries.length }
  ];

  statsGrid.innerHTML = cards.map(c =>
    '<div class="stat-card">' +
      '<div class="stat-label">' + escHtml(c.label) + '</div>' +
      '<div class="stat-value">' + escHtml(c.value) + '</div>' +
    '</div>'
  ).join('');

  const top = Object.values(members)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  topCruche.innerHTML = top.length ? top.map((m, i) =>
    '<div class="row">' +
      '<span>#' + (i + 1) + ' ' + escHtml(m.name || 'Inconnu') + '</span>' +
      '<strong>' + (m.score || 0) + '</strong>' +
    '</div>'
  ).join('') : '<div class="empty-msg">Aucune donnée</div>';

  historyList.innerHTML = historyEntries.length ? historyEntries.slice(0, 40).map(h => {
    const date = h.at ? new Date(h.at).toLocaleString('fr-FR') : '-';
    return '<div class="row">' +
      '<span>' + escHtml(h.type || 'action') + ' · ' + escHtml(h.page || '?') + '</span>' +
      '<small>' + escHtml(date) + '</small>' +
    '</div>';
  }).join('') : '<div class="empty-msg">Aucune action enregistrée</div>';
}

function buildReadonlyLink() {
  const u = new URL(location.href);
  u.searchParams.set('view', '1');
  readonlyLink.value = u.toString();
}

btnCopyReadonly.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(readonlyLink.value);
    btnCopyReadonly.textContent = 'Copié';
    setTimeout(() => { btnCopyReadonly.textContent = 'Copier'; }, 1200);
  } catch (_) {
    backupHint.textContent = 'Impossible de copier automatiquement';
  }
});

btnExport.addEventListener('click', async () => {
  if (!isAdmin) return;
  const data = await window.ODGG.exportSnapshot(db);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  window.ODGG.downloadJson('odgg-backup-' + stamp + '.json', data);
  backupHint.textContent = 'Export terminé';
  window.ODGG.logAction(db, 'backup_export', { by: 'admin' });
});

btnImport.addEventListener('click', async () => {
  if (!isAdmin) return;
  const file = importFile.files && importFile.files[0];
  if (!file) {
    backupHint.textContent = 'Choisis un fichier JSON';
    return;
  }
  const ok = confirm('Importer cette sauvegarde ? Cela fusionnera les données Firebase.');
  if (!ok) return;
  try {
    const txt = await file.text();
    const payload = JSON.parse(txt);
    await window.ODGG.importSnapshot(db, payload);
    backupHint.textContent = 'Import terminé';
    window.ODGG.logAction(db, 'backup_import', { by: 'admin', filename: file.name });
  } catch (err) {
    backupHint.textContent = 'Import échoué: ' + (err && err.message ? err.message : 'erreur');
  }
});

db.ref('/').on('value', snap => {
  rootData = snap.val() || {};
  renderStats();
});

buildReadonlyLink();
