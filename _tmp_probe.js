
const fs=require('fs');
let all=fs.readFileSync('js/events.js','utf8')+String.fromCharCode(10);
for(const f of fs.readdirSync('js').filter(f=>f.startsWith('era-')).sort()) all+=fs.readFileSync('js/'+f,'utf8')+String.fromCharCode(10);
all+=String.fromCharCode(10)+'const ev=EVENTS.find(e=>e.id==="changping");console.log(JSON.stringify({id:ev.id,forces:ev.forces,cat:ev.category,title:ev.title},null,1));';
fs.writeFileSync('_tmp_probe_run.js',all);
