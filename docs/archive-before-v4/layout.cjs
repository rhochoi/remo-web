// Start: python3 -m http.server 8765 --bind 127.0.0.1 --directory site
// Run with Playwright installed. AXE_PATH optionally points to axe-core's axe.min.js.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page = await browser.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  for (const [width,height] of [[320,568],[390,667],[667,390],[768,1024],[1024,768],[1440,960]]) {
   await page.setViewportSize({width,height});
   await page.goto('http://127.0.0.1:8765');
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('#contact').isVisible(),false);
   assert.equal(await page.locator('.members>li').count(),10);
   assert.equal(await page.locator('details.project').count(),4);
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(el=>{
    if(el.closest('.hero-logo'))return false; // Logo's transparent canvas is deliberately clipped.
    const r=el.getBoundingClientRect(); return r.width && (r.right>innerWidth+1 || r.left < -1);
   }).map(el=>el.className));
   assert.deepEqual(overflow,[],`overflow at ${width}x${height}`);
   assert.equal(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)),true);
   await page.locator('#p-pln summary').click();
   assert.equal(await page.locator('#p-pln').getAttribute('open'),'');
   await page.locator('#p-pln summary').press('Enter');
   assert.equal(await page.locator('#p-pln').getAttribute('open'),null);
   await page.locator('#member-max a').click();
   await page.waitForFunction(()=>document.getElementById('p-pln').open);
   assert.equal(await page.locator('#p-pln').getAttribute('open'),'');
   await page.waitForFunction(()=>document.querySelector('#p-pln summary')===document.activeElement);
   assert.equal(await page.locator('#p-pln summary').evaluate(e=>e===document.activeElement),true);
   await page.locator('#p-pln summary').press('Enter');
   await page.locator('#member-max a').click();
   await page.waitForFunction(()=>document.getElementById('p-pln').open);
   await page.locator('#p-pln .person-link').first().click();
   assert.equal(new URL(page.url()).hash,'#member-max');
   if (width===390 || width===1440) {
    await page.goto('http://127.0.0.1:8765');await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:`/tmp/remo-v2-${width}.png`,fullPage:true});
    if(width===1440)await page.screenshot({path:'/tmp/remo-v2-preview.png'});
   }
  }
  await page.goto('http://127.0.0.1:8765');await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#main').evaluate(e=>e===document.activeElement),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  await page.setViewportSize({width:390,height:667});
  await page.addStyleTag({content:'html{font-size:200%}'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'200% root text size overflow');
  await page.goto('http://127.0.0.1:8765');
  if(process.env.AXE_PATH){
   await page.addScriptTag({path:process.env.AXE_PATH});
   const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
   fs.writeFileSync('/tmp/remo-axe-results.json',JSON.stringify({violations:result.violations,incomplete:result.incomplete.map(i=>({id:i.id,impact:i.impact}))},null,2));
   assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  }
  assert.deepEqual(errors,[]);
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:667}});
  await nojs.goto('http://127.0.0.1:8765');await nojs.locator('#p-moodism summary').click();
  assert.equal(await nojs.locator('#p-moodism').getAttribute('open'),'');await nojs.close();
  console.log('PASS: 6 viewports; assets; disclosure click/keyboard; person/project links; skip link; reduced motion; root text scaling; no-JS; axe if configured.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
