(function () {
  const pages = [
    { href: 'empereur.html', label: 'Empereur' },
    { href: 'index.html',    label: 'Comité' },
    { href: 'cruche.html',   label: 'Cruche' },
    { href: 'galere.html',   label: 'Galère' },
    { href: 'congele.html',  label: 'Congèle' },
    { href: 'dette.html',    label: 'Dettes' },
  ];
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const links = pages.map(p => {
    const active = p.href.toLowerCase() === current ? ' class="active"' : '';
    return `<a href="${p.href}"${active}>${p.label}</a>`;
  }).join('');
  const html = `<nav>${links}<button class="btn-login" id="btnLogin">Admin</button></nav>`;
  const target = document.getElementById('navbar');
  if (target) target.outerHTML = html;
})();
