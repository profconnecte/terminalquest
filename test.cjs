const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map();function el(){return {style:{},dataset:{},setAttribute(){},value:'',textContent:'',children:[],append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},showModal(){},close(){}};}
let saved;const context=vm.createContext({TextEncoder,document:{documentElement:el(),getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},createElement:el,createTextNode:x=>x},localStorage:{getItem(){return saved||null},setItem(k,v){saved=v}},confirm:()=>true});
for(const file of ['curriculum.js','shell.js','guidance.js','app.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const evaluate=s=>vm.runInContext(s,context);
evaluate('for(let i=0;i<missions.length;i++){if(state.selected!==i)throw Error("Progression bloquée au défi "+i);run(missions[i][3]);if(!state.done.includes(i))throw Error("Validation manquée au défi "+i);}');
assert.equal(evaluate('state.done.length'),36);
assert.equal(evaluate('state.fs[LAB+"/annonce.txt"].content'),'Finale a 20h\nAurora vs Pulse\n');
assert.equal(evaluate('state.fs[LAB+"/journal.txt"].content'),'DIRECT');
assert.equal(evaluate('state.fs[LAB+"/backup"]'),undefined);
assert.ok(evaluate('state.fs[LAB+"/assets/briefing.txt"]'));
assert.ok(evaluate('state.fs[HOME+"/tournoi/equipes.txt"]'));
assert.match(evaluate('execute("ls -l /home/etudiant/tournoi/briefing.txt").output'),/laura/);
assert.match(evaluate('execute("ls -a /home/etudiant/tournoi").output'),/\.staff.txt/);
assert.doesNotMatch(evaluate('execute("ls /home/etudiant/tournoi").output'),/\.staff.txt/);
assert.equal(evaluate('execute("ls -la").output'),evaluate('execute("ls -al").output'));
assert.equal(evaluate('execute("ls -la").output'),evaluate('execute("ls -l -a").output'));
assert.throws(()=>evaluate('execute("ls -z")'),/option/);
assert.throws(()=>evaluate('execute("cp assets copy")'),/récursive/);
evaluate('execute("cp -r assets copy");execute("echo original > protected.txt");execute("cp -n annonce.txt protected.txt")');
assert.equal(evaluate('state.fs[LAB+"/protected.txt"].content'),'original\n');
assert.throws(()=>evaluate('execute("rm -d copy")'),/non vide/);
evaluate('execute("rm -r copy")');assert.equal(evaluate('state.fs[LAB+"/copy"]'),undefined);
const old=evaluate('state.fs[LAB+"/annonce.txt"].modified');evaluate('execute("touch annonce.txt")');assert.ok(evaluate('state.fs[LAB+"/annonce.txt"].modified')>old);
assert.match(evaluate('execute("cat -n annonce.txt").output'),/1  Finale/);
assert.throws(()=>evaluate('execute(\'echo "unfinished\')'),/Guillemets/);
evaluate('state=fresh();requestHint();render();requestHint();requestHint()');assert.equal(evaluate('state.hints[0]'),2);assert.equal(elements.get('hint').disabled,true);
evaluate('state.selected=1;render()');assert.equal(elements.get('hint').disabled,false);
assert.equal(evaluate('path("/../../home/etudiant")'),'/home/etudiant');
assert.equal(evaluate('Object.hasOwn(docs,"id")'),false);
for(const command of ['cd tournoi','cd tournoi/','cd ./tournoi/']){
 evaluate('state=fresh();state.done=[0,1,2];state.selected=3');
 evaluate('run('+JSON.stringify(command)+')');
 assert.equal(evaluate('state.selected'),4,command+' doit valider le défi 4');
}
evaluate('state=fresh();state.selected=3;run("cd /home/etudiant/tournoi/")');
assert.equal(evaluate('state.done.includes(3)'),false,'Le défi relatif doit rester distinct du défi absolu');
for(const command of ['cd finale/','cd ./finale/']){
 evaluate('state=fresh();state.cwd=HOME+"/tournoi";state.fs[LAB]={type:"dir"};state.selected=19');
 evaluate('run('+JSON.stringify(command)+')');
 assert.equal(evaluate('state.done.includes(19)'),true,command);
}
evaluate('state=fresh();state.cwd=HOME+"/tournoi";state.selected=9;run("cd ../")');
assert.equal(evaluate('state.done.includes(9)'),true);
console.log('OK : 36 défis ; options combinées ; propriétaires ; chemins ; copies et déplacements ; récursivité ; dates ; redirections ; aides progressives.');
// Rejouer tout le parcours avec les slashs qu'ajoute Tab aux dossiers.
evaluate(`state=fresh();
for(let i=0;i<missions.length;i++){
 const tokens=tokenize(missions[i][3]),cmd=tokens[0];
 const directoryCommands=['cd','ls','mkdir','cp','mv','rm'];
 const completed=tokens.map((token,j)=>{
  if(j===0||token.startsWith('-')||!directoryCommands.includes(cmd))return token;
  if(state.fs[path(token)]?.type==='dir'||cmd==='mkdir'||(cmd==='cp'&&tokens.includes('-r')&&j===tokens.length-1))return token+'/';
  return token;
 });
 const command=completed.map(x=>JSON.stringify(x)).join(' ');
 run(command);
 if(!state.done.includes(i))throw Error('Slash refusé au défi '+(i+1)+' : '+command);
}
`);
assert.equal(evaluate('state.done.length'),36);
evaluate('state=fresh();state.done=[0,1,2];state.selected=3;document.getElementById("command").value="cd tour";document.getElementById("command").onkeydown({key:"Tab",target:document.getElementById("command"),preventDefault(){}})');
assert.equal(elements.get('command').value,'cd tournoi/');
elements.get('command-form').onsubmit({preventDefault(){}});
assert.equal(evaluate('state.selected'),4);
assert.equal(evaluate('normalizePathArgument("/home/etudiant///")'),'/home/etudiant');
assert.equal(evaluate('normalizePathArgument("/")'),'/');
console.log('OK : 36 défis avec slashs de complétion et validation après une vraie Tab.');
for(const option of ['-d','-r']){
 evaluate('state=fresh();execute("mkdir -p ~/tournoi/finale/assets/images");state.cwd=LAB;state.done=Array.from({length:33},(_,i)=>i);state.selected=33');
 evaluate('run('+JSON.stringify('rm '+option+' assets/images/')+')');
 assert.equal(evaluate('state.selected'),34);
 assert.equal(evaluate('state.fs[LAB+"/assets/images"]'),undefined);
 assert.ok(evaluate('state.fs[LAB+"/assets"]'));
}
evaluate('state=fresh();state.cwd=HOME+"/tournoi";state.selected=12;state.done=Array.from({length:12},(_,i)=>i);execute("mkdir finale");run("touch -c finale/assets/images")');
assert.equal(evaluate('state.selected'),12);
assert.equal(evaluate('state.fs[LAB+"/assets/images"]'),undefined);
assert.match(evaluate('incompleteFeedback(execute("touch -c finale/assets/images"))'),/Défi non validé.*rien créé/);
evaluate('run("mkdir -p finale/assets/images")');
assert.equal(evaluate('state.selected'),13);
for(const spelling of ['a','à']){
 evaluate('state=fresh();state.cwd=HOME+"/tournoi";execute("mkdir finale");state.done=Array.from({length:14},(_,i)=>i);state.selected=14');
 evaluate('run('+JSON.stringify('echo "Finale '+spelling+' 20h"')+')');
 assert.equal(evaluate('state.selected'),15);
 evaluate('run('+JSON.stringify('echo "Finale '+spelling+' 20h" > finale/annonce.txt')+')');
 assert.equal(evaluate('state.selected'),16);
 evaluate('run(\'echo "Aurora vs Pulse" >> finale/annonce.txt\')');
 assert.equal(evaluate('state.selected'),17);
 assert.equal(evaluate('state.fs[LAB+"/annonce.txt"].content'),'Finale '+spelling+' 20h\nAurora vs Pulse\n');
}
// Régressions : complétion et affichage français.
function tab(value){if(value!==undefined){elements.get('command').value=value;evaluate('pendingCompletion=null');}elements.get('command').onkeydown({key:'Tab',target:elements.get('command'),preventDefault(){}});return elements.get('command').value;}
evaluate('state=fresh();state.cwd=HOME+"/tournoi"');
let rows=elements.get('output').children.length;
assert.equal(tab('cat '),'cat ');
assert.equal(elements.get('output').children.length,rows);
tab();assert.match(elements.get('output').children.at(-1).textContent,/briefing.txt.*brouillon.txt.*equipes.txt/);
assert.doesNotMatch(elements.get('output').children.at(-1).textContent,/\.staff/);
assert.equal(tab('cat .s'),'cat .staff.txt');
assert.equal(tab('cat briefing.txt'),'cat briefing.txt');
assert.equal(tab('cat /home/etudiant/tournoi/br'),'cat /home/etudiant/tournoi/br');
tab();assert.match(elements.get('output').children.at(-1).textContent,/briefing.txt.*brouillon.txt/);
assert.equal(tab('cat ../'),'cat ../');tab();assert.match(elements.get('output').children.at(-1).textContent,/Bienvenue.txt.*tournoi\//);
assert.equal(tab('cd ../t'),'cd ../tournoi/');
assert.equal(tab('cat ~/tournoi/.s'),'cat ~/tournoi/.staff.txt');
evaluate('state.fs[HOME+"/tournoi/rapport final.txt"]={type:"file",content:""}');
assert.equal(tab('cat "rapport'),'cat "rapport final.txt');
assert.equal(tab('cat > br'),'cat > br');tab();assert.match(elements.get('output').children.at(-1).textContent,/briefing/);
assert.match(evaluate('formatFrenchDate(Date.UTC(2026,0,15,12))'),/15\/01\/2026.*13:00/);
assert.match(evaluate('formatFrenchDate(Date.UTC(2026,6,15,12))'),/15\/07\/2026.*14:00/);
assert.match(evaluate('manual("cat")'),/ABRÉGÉ/);
assert.match(evaluate('manual("cat")'),/pas nécessaire/);
assert.equal(evaluate('execute("cat briefing.txt equipes.txt").output'),evaluate('state.fs[HOME+"/tournoi/briefing.txt"].content+state.fs[HOME+"/tournoi/equipes.txt"].content'));
const previousTheme=evaluate('theme');elements.get('theme-toggle').onclick();assert.notEqual(evaluate('theme'),previousTheme);assert.equal(evaluate('document.documentElement.dataset.theme'),evaluate('theme'));elements.get('theme-toggle').onclick();assert.equal(evaluate('theme'),previousTheme);
console.log('OK : double Tab ; chemins relatifs, absolus et cachés ; fiches abrégées ; thèmes ; Europe/Paris en hiver et en été.');
