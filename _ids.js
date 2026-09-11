const fs=require('fs');
let all=fs.readFileSync('js/events.js','utf8')+'\n'+fs.readFileSync('js/relations.js','utf8')+'\n'+fs.readFileSync('js/people.js','utf8')+'\n';
for(const f of fs.readdirSync('js').filter(f=>f.startsWith('era-')).sort()) all+=fs.readFileSync('js/'+f,'utf8')+'\n';
all+='\nfor(const [k,v] of Object.entries(PEOPLE)) console.log(k+"|"+v.name);';
fs.writeFileSync('_ids_run.js',all);
