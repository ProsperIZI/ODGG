(function () {
  function readOnlyMode() {
    return new URLSearchParams(location.search).get('view') === '1';
  }

  function currentPage() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function logAction(db, type, details) {
    if (!db || !type) return Promise.resolve();
    var payload = {
      type: type,
      page: currentPage(),
      details: details || {},
      at: Date.now()
    };
    return db.ref('history').push(payload).catch(function () {
      return null;
    });
  }

  function exportSnapshot(db) {
    return db.ref('/').once('value').then(function (snap) {
      return snap.val() || {};
    });
  }

  function importSnapshot(db, snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      return Promise.reject(new Error('Snapshot invalide'));
    }
    return db.ref('/').update(snapshot);
  }

  function downloadJson(filename, data) {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.ODGG = {
    readOnlyMode: readOnlyMode,
    logAction: logAction,
    exportSnapshot: exportSnapshot,
    importSnapshot: importSnapshot,
    downloadJson: downloadJson
  };
})();
