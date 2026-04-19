(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyBECOMyRRCKaAOThoUAS4STiFFPNhlbpvs",
    authDomain: "odgg-80281.firebaseapp.com",
    databaseURL: "https://odgg-80281-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "odgg-80281",
    storageBucket: "odgg-80281.firebasestorage.app",
    messagingSenderId: "542453001838",
    appId: "1:542453001838:web:77ae05671f3d2a299b407f"
  };

  function getDb() {
    if (!window.firebase) {
      throw new Error("Firebase SDK non charge");
    }
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    return firebase.database();
  }

  function readOnlyMode() {
    return new URLSearchParams(location.search).get('view') === '1';
  }

  function escHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createAdminAuth(options) {
    var opts = options || {};
    var db = opts.db || getDb();
    var readOnly = opts.readOnly === undefined ? readOnlyMode() : !!opts.readOnly;
    var labels = opts.labels || {};
    var loginLabel = labels.login || 'Admin';
    var logoutLabel = labels.logout || 'Deconnexion';
    var readOnlyLabel = labels.readOnly || 'Lecture seule';

    var btnLogin = document.getElementById(opts.btnLoginId || 'btnLogin');
    var modalOverlay = document.getElementById(opts.modalOverlayId || 'modalOverlay');
    var passInput = document.getElementById(opts.passInputId || 'passInput');
    var btnPassOk = document.getElementById(opts.btnPassOkId || 'btnPassOk');
    var modalError = document.getElementById(opts.modalErrorId || 'modalError');

    var isAdmin = false;

    function setLoginButtonState() {
      if (!btnLogin) return;
      if (isAdmin) {
        btnLogin.textContent = logoutLabel;
        btnLogin.className = 'btn-logout';
      } else {
        btnLogin.textContent = readOnly ? readOnlyLabel : loginLabel;
        btnLogin.className = 'btn-login';
      }
    }

    function closeModal() {
      if (modalOverlay) modalOverlay.classList.remove('open');
    }

    function openModal() {
      if (readOnly || !modalOverlay) return;
      modalOverlay.classList.add('open');
      if (passInput) passInput.value = '';
      if (modalError) modalError.textContent = '';
      if (passInput) {
        setTimeout(function () {
          passInput.focus();
        }, 0);
      }
    }

    function setAdmin(val) {
      if (readOnly && val) return;
      isAdmin = !!val;
      document.body.classList.toggle('is-admin', isAdmin);
      setLoginButtonState();
      if (isAdmin) {
        localStorage.setItem('odgg_admin', '1');
      } else {
        localStorage.removeItem('odgg_admin');
      }
      if (typeof opts.onAdminChange === 'function') {
        opts.onAdminChange(isAdmin);
      }
    }

    function tryLogin() {
      if (!passInput) return;
      var pass = passInput.value;
      db.ref('config/adminPass').once('value', function (snap) {
        var stored = snap.val();
        if (!stored) {
          db.ref('config/adminPass').set('odgg');
          stored = 'odgg';
        }
        if (pass === stored) {
          setAdmin(true);
          closeModal();
        } else if (modalError) {
          modalError.textContent = 'Mot de passe incorrect';
        }
      });
    }

    if (btnLogin) {
      btnLogin.addEventListener('click', function () {
        if (readOnly) return;
        if (isAdmin) {
          setAdmin(false);
          return;
        }
        openModal();
      });
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeModal();
      });
    }

    if (btnPassOk) btnPassOk.addEventListener('click', tryLogin);
    if (passInput) {
      passInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') tryLogin();
      });
    }

    if (!readOnly && localStorage.getItem('odgg_admin') === '1') {
      db.ref('config/adminPass').once('value', function () {
        setAdmin(true);
      });
    } else {
      setAdmin(false);
    }

    return {
      get isAdmin() {
        return isAdmin;
      },
      get readOnly() {
        return readOnly;
      },
      setAdmin: setAdmin,
      tryLogin: tryLogin
    };
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
    getDb: getDb,
    escHtml: escHtml,
    createAdminAuth: createAdminAuth,
    readOnlyMode: readOnlyMode,
    logAction: logAction,
    exportSnapshot: exportSnapshot,
    importSnapshot: importSnapshot,
    downloadJson: downloadJson
  };
})();
