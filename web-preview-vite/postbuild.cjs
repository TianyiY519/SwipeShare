const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const pages = ['home', 'swipes', 'forum', 'messages', 'profile', 'admin', 'login', 'register'];

pages.forEach((page) => {
  const pageHtml = indexHtml.replace(
    '<div id="root"></div>',
    `<div id="root"></div><script>if(!window.location.hash)window.location.hash="${page}";</script>`
  );
  fs.writeFileSync(path.join(distDir, `${page}.html`), pageHtml);
  console.log(`Created ${page}.html`);
});

console.log('All pages generated!');
