const fs=require('fs');
let all='';
const order=['events','relations','people','era-xianqin','era-qinhan','era-suitang','era-songyuan','era-mingqing','era-modern-extra','era-contemporary','era-family','era-patches','era-culture','era-batch3','era-writers','era-writers2','era-sci','era-lit-art','people-timeline','timelines-2','timelines-3','timelines-4','timelines-5','timelines-6','timelines-7','timelines-8','timelines-9','people-extra','people-extra-2','people-extra-3','people-extra-4'];
for(const f of order) all+=fs.readFileSync('js/'+f+'.js','utf8')+'\n';
all+='\nconst noTl=Object.keys(PEOPLE).filter(k=>!PEOPLE_TIMELINE[k]);console.log("缺年谱:",noTl.length);console.log(noTl.map(k=>k+" "+PEOPLE[k].name).join(" | "));';
fs.writeFileSync('_gap_run.js',all);
