(function () {
  const readOnly = new URLSearchParams(location.search).get('view') === '1';
  const pages = [
    { href: 'empereur.html', label: 'Empereur' },
    { href: 'index.html',    label: 'Comité' },
    { href: 'cruche.html',   label: 'Cruche' },
    { href: 'galere.html',   label: 'Galère' },
    { href: 'congele.html',  label: 'Congèle' },
    { href: 'dette.html',    label: 'Dettes' },
    { href: 'stats.html',    label: 'Stats' },
  ];
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const links = pages.map(p => {
    const href = readOnly ? `${p.href}?view=1` : p.href;
    const active = p.href.toLowerCase() === current ? ' class="active"' : '';
    return `<a href="${href}"${active}>${p.label}</a>`;
  }).join('');
  const adminBtn = readOnly
    ? '<button class="btn-login" id="btnLogin" disabled>Lecture seule</button>'
    : '<button class="btn-login" id="btnLogin">Admin</button>';
  const html = `<nav>${links}${adminBtn}</nav>`;
  const target = document.getElementById('navbar');
  if (target) target.outerHTML = html;
})();
