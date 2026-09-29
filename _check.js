const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
let m, stack = [], errors = 0;
while ((m = re.exec(s))) {
  const tag = m[1].toLowerCase();
  const closing = m[0][1] === '/';
  const self = m[3] === '/' || voidTags.has(tag);
  if (self) continue;
  if (!closing) stack.push({ tag, i: m.index });
  else {
    const top = stack.pop();
    if (!top || top.tag !== tag) {
      errors++;
      console.log('MISMATCH at', m.index, 'got </' + tag + '> expected', top && ('</' + top.tag + '>'));
      if (errors > 5) break;
    }
  }
}
if (stack.length) console.log('UNCLOSED:', stack.map(x => x.tag).join(','));
console.log('remaining:', stack.length, 'errors:', errors);
const c = (pat) => (s.match(pat) || []).length;
console.log('tabs:', c(/data-tab="/g), 'panels:', c(/data-panel="/g), 'cards:', c(/class="provider-card"/g), 'offer rows:', c(/class="offer-row/g), 'footer btns:', c(/class="provider-footer-button"/g), 'cta:', c(/provider-cta-button/g));
['helyxai.space','nova.vcrauo.com','aerolink.lat','inference.uno','omnirush.ai','artbloom.tech','tokenforge.ai.studio'].forEach(u => {
  const n = c(new RegExp(u.replace(/\./g, '\\.'), 'g'));
  console.log(u, n, n >= 6 ? 'OK' : 'LOW');
});
console.log('new-badge on new providers (should be 0):', (s.match(/(?:Helyx|Orbelis|Aerolink|Inference AI|OmniRush|ArtBloom|TokenForge)[^<]{0,40}new-badge/g) || []).length);
