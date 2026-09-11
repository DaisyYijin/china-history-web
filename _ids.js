const fs=require('fs');
let all='';
for(const f of ['events','relations','people','era-xianqin','era-qinhan','era-suitang','era-songyuan','era-mingqing','era-modern-extra','era-contemporary','era-family','era-patches','era-culture','era-batch3','era-writers'])
  all+=fs.readFileSync('js/'+f+'.js','utf8')+'\n';
all+='\nfor(const [k,v] of Object.entries(PEOPLE)) console.log(k+"|"+v.name);';
fs.writeFileSync('_ids_run.js',all);
