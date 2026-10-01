const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));const url=process.env.BASE_URL||'http://127.0.0.1:8766';
for(const width of [320,390,600,768,1024,1440]){
 await p.setViewportSize({width,height:1000});await p.goto(url);await p.evaluate(()=>document.fonts.ready);
 assert.equal(await p.locator('article.project').count(),4);assert.equal(await p.locator('details.project,.names').count(),0);
 assert(await p.locator('.brand').evaluate(e=>e.getBoundingClientRect().width<=100));
 for(const img of await p.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const photo of await p.locator('[data-photo]').all()){await photo.click();await p.locator('dialog img').evaluate(e=>e.decode());assert(await p.locator('dialog').isVisible());await p.keyboard.press('Escape');assert(!(await p.locator('dialog').isVisible()));assert(await photo.evaluate(e=>e===document.activeElement));}
 await p.getByRole('link',{name:'기록',exact:true}).click();assert.equal(new URL(p.url()).hash,'#work');
 await p.locator('#p-pln details summary').press('Enter');assert.equal(await p.locator('#p-pln details').getAttribute('open'),'');
 assert.match(await p.locator('#p-kpipe').innerText(),/구현 전/);await p.getByRole('link',{name:'리모에 관하여',exact:true}).click();await p.locator('#team[open]').waitFor({state:'visible'});
}
if(fs.existsSync('/tmp/axe.min.js')){await p.addScriptTag({path:'/tmp/axe.min.js'});const a=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(a.violations.map(v=>v.id),[]);}
await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.media img').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
const c=await b.newContext({javaScriptEnabled:false});const n=await c.newPage();await n.goto(url);await n.locator('#p-pln details summary').click();assert.equal(await n.locator('#p-pln details').getAttribute('open'),'');assert.equal(await n.locator('article.project').count(),4);assert.deepEqual(errors,[]);
console.log('PASS: six widths; 4 visible project articles; compact logo/no name roster; all image viewers Escape/focus; process navigation; source disclosures/no JS; reduced motion; axe WCAG if available');
}finally{await b.close();}})();
