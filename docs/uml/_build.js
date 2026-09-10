const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const meta = JSON.parse(fs.readFileSync('_meta.json', 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const head = fs.readFileSync('_head.html', 'utf8');
const foot = fs.readFileSync('_foot.html', 'utf8');

const plates = meta.map((m) => {
  const src = fs.readFileSync(m.file, 'utf8').trimEnd();
  return `
      <section class="plate" id="fig-${m.fig}">
        <header class="titleblock">
          <div class="tb-id">
            <span class="tb-fig">Fig. ${m.fig}</span>
            <span class="tb-kind">${m.kind}</span>
          </div>
          <h2 class="tb-title">${m.title}</h2>
          <p class="tb-shows">${m.shows}</p>
        </header>

        <div class="sheet">
          <pre class="mermaid">${esc(src)}</pre>
        </div>

        <dl class="tb-meta">
          <div><dt>Dérivé de</dt><dd class="mono">${m.source}</dd></div>
          <div><dt>Dans le rapport</dt><dd>${m.report}</dd></div>
          <div><dt>Dans le PPT</dt><dd>${m.slide}</dd></div>
        </dl>
      </section>`;
}).join('\n');

const index = meta.map((m) =>
  `<a class="idx-item" href="#fig-${m.fig}"><span class="idx-fig">${m.fig}</span><span class="idx-name">${m.title}</span><span class="idx-kind">${m.kind}</span></a>`
).join('\n          ');

fs.writeFileSync(OUT, head.replace('<!--INDEX-->', index) + plates + foot, 'utf8');
console.log('wrote ' + OUT + ' (' + fs.statSync(OUT).size + ' bytes)');
