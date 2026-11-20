const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map();function el(){return {style:{},dataset:{},setAttribute(){},value:'',textContent:'',children:[],append(...nodes){
 for(const node of nodes){
  if(typeof node==='object'){
   if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(child=>child!==node);
   node.parentElement=this;
  }
  this.children.push(node);
 }
},replaceChildren(...nodes){this.children=[];this.append(...nodes);},showModal(){},close(){}};}
let saved;
function loadGame(nodes=elements){
 const context=vm.createContext({TextEncoder,document:{documentElement:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,createTextNode:x=>x},localStorage:{getItem(k){return k==='terminal-quest-nexus-v3'?saved||null:null},setItem(k,v){if(k==='terminal-quest-nexus-v3')saved=v}},confirm:()=>true});
 for(const file of ['curriculum.js','administration.js','administration-shell.js','shell.js','guidance.js','app.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 return context;
}
elements.set('reference',el());
const context=loadGame();
const evaluate=s=>vm.runInContext(s,context);
const activityTotal=evaluate('missions.length');
assert.equal(activityTotal,70);
function submit(command){
 elements.get('command').value=command;
 elements.get('command-form').onsubmit({preventDefault(){}});
}
evaluate('for(let i=0;i<basicMissionCount;i++){if(state.selected!==i)throw Error("Progression bloquée au défi "+i);run(missions[i][3]);if(!state.done.includes(i))throw Error("Validation manquée au défi "+i);}');
assert.equal(evaluate('state.done.length'),36);
assert.equal(evaluate('state.fs[LAB+"/annonce.txt"].content'),'Finale a 20h\nAurora vs Pulse\n');
assert.equal(evaluate('state.fs[LAB+"/journal.txt"].content'),'DIRECT');
assert.equal(evaluate('state.fs[LAB+"/backup"]'),undefined);
assert.ok(evaluate('state.fs[LAB+"/assets/briefing.txt"]'));
assert.ok(evaluate('state.fs[HOME+"/tournoi/equipes.txt"]'));
assert.equal(evaluate('state.selected'),36);
for(const cmd of ['whoami','head','tail','grep','pgrep','kill','systemctl','journalctl']){
 const button=elements.get('commands').children.find(child=>child.textContent===cmd);
 assert.ok(button,cmd);
 button.onclick();
 assert.equal(elements.get('manual-title').textContent,cmd);
 assert.match(elements.get('manual-body').textContent,/Terminal simulé/);
 assert.match(evaluate(`execute("man ${cmd}").output`),/UTILISATION/);
}
const legacySave=JSON.parse(saved);
saved=JSON.stringify({...legacySave,selected:56,terminalAdministration:undefined,done:[...legacySave.done,36,50,56]});
const migrated=loadGame(new Map());
assert.equal(vm.runInContext('state.selected',migrated),36);
assert.equal(vm.runInContext('state.done.length',migrated),36);
assert.equal(vm.runInContext('state.fs[LAB+"/journal.txt"].content',migrated),'DIRECT');
submit('pwd');
assert.equal(evaluate('state.actionIndex||0'),0);
submit('whoami');
assert.equal(evaluate('state.actionIndex'),1);
assert.match(elements.get('action-progress').textContent,/1 \/ 2/);
assert.equal(vm.runInContext('state.actionIndex',loadGame(new Map())),1);
submit('id');
assert.equal(evaluate('state.selected'),37);
for(let i=37;i<activityTotal;i++){
 const commands=evaluate(`missions[${i}][3]`).split('\n');
 for(const command of commands)submit(command);
 assert.equal(evaluate('state.selected'),Math.min(i+1,activityTotal-1),`Enchaînement à la mission ${i+1}`);
 assert.equal(evaluate(`state.done.includes(${i})`),true,`Validation de la mission ${i+1}`);
}
assert.equal(elements.get('counter').textContent,'70 / 70');
assert.equal(JSON.parse(saved).done.length,70);
assert.equal(evaluate('state.fs["/srv/support"].mode'),0o2770);
assert.equal(evaluate('state.fs["/srv/support/test.txt"].group'),'support');
assert.equal(evaluate('execute("sudo -u nobody ls /srv/support").denied'),true);
assert.equal(evaluate('execute("cat /etc/shadow").denied'),true);
assert.equal(evaluate('execute("cp /etc/shadow /tmp-shadow").denied'),true);
assert.equal(evaluate('execute("rm /etc/shadow").denied'),true);
assert.match(evaluate('execute("sudo cat /etc/shadow").output'),/EMPREINTE_SIMULEE/);
assert.equal(evaluate('execute("pgrep -x sleep").output'),'');
assert.match(evaluate('execute("systemctl status nexus-archive").output'),/failed/);
assert.match(evaluate('execute("journalctl -u nexus-archive").output'),/archives est introuvable/);
console.log('OK : 34 missions d’administration jouées et validées dans le terminal.');
evaluate('state=fresh();render()');
const roadmap=()=>elements.get('missions').children.filter(node=>typeof node.onclick==='function');
assert.equal(roadmap().length,activityTotal);
assert.ok(roadmap().every(button=>!button.disabled));
roadmap().at(-1).onclick();
assert.equal(evaluate('state.selected'),69);
submit('systemctl status nexus-archive');
assert.equal(evaluate('state.actionIndex'),1);
elements.get('reset-activity').onclick();
assert.equal(evaluate('state.actionIndex'),0);
submit('systemctl status nexus-archive');
submit('journalctl -u nexus-archive');
assert.equal(evaluate('state.done.join(",")'),'69');
roadmap()[34].onclick();
assert.equal(evaluate('state.cwd'),evaluate('LAB'));
assert.ok(evaluate('state.fs[LAB+"/backup"]'));
evaluate('execute("rm -r backup");execute("cd ..");execute("touch parasite.txt");requestHint()');
elements.get('reset-activity').onclick();
assert.equal(evaluate('state.selected'),34);
assert.equal(evaluate('state.cwd'),evaluate('LAB'));
assert.ok(evaluate('state.fs[LAB+"/backup"]'));
assert.equal(evaluate('state.fs[HOME+"/tournoi/parasite.txt"]'),undefined);
assert.equal(evaluate('state.hints[34]'),undefined);
evaluate('run(missions[34][3])');
assert.equal(evaluate('state.selected'),35);
assert.equal(evaluate('state.done.length'),2);
roadmap()[34].onclick();
evaluate('run(missions[34][3])');
assert.equal(evaluate('state.selected'),35);
assert.equal(evaluate('state.done.length'),2);
evaluate(`for(let i=0;i<missions.length;i++){
 state=fresh();
 openActivity(i);
 resetActivity();
 for(const command of missions[i][3].split(String.fromCharCode(10)))run(command);
 if(state.done.length!==1||state.done[0]!==i||state.selected!==Math.min(i+1,missions.length-1))throw Error('Accès direct ou réinitialisation du défi '+(i+1));
}`);
console.log('OK : accès direct et réinitialisation des 70 environnements.');
for(const pattern of ['alice','alice:','^alice:']){
 evaluate('state=fresh();openActivity(41)');
 submit(`grep "${pattern}" /etc/passwd`);
 assert.equal(evaluate('state.done.includes(41)'),true,`Mission 42 : motif ${pattern}`);
}
for(const pattern of ['bob','bob:','^bob:']){
 evaluate('state=fresh();openActivity(42)');
 submit('sudo adduser bob');
 submit('sudo passwd bob');
 submit(`grep "${pattern}" /etc/shadow`);
 assert.equal(evaluate('state.done.includes(42)'),false,'Mission 43 : les droits restent nécessaires');
 submit(`sudo grep "${pattern}" /etc/shadow`);
 assert.equal(evaluate('state.done.includes(42)'),true,`Mission 43 : motif ${pattern}`);
}
console.log('OK : missions 42 et 43 avec les motifs simples, les deux-points et le début de ligne.');
evaluate('state=fresh();openActivity(41)');
submit('cat /etc/group');
assert.equal(evaluate('state.done.includes(41)'),false,'Mission 42 : vérifier le fichier consulté');
submit('cat /etc/passwd');
assert.equal(evaluate('state.done.includes(41)'),true,'Mission 42 : accepter cat');
evaluate('state=fresh();openActivity(42)');
submit('sudo cat /etc/shadow');
assert.equal(evaluate('state.actionIndex||0'),0,'Mission 43 : conserver les étapes préalables');
submit('sudo adduser bob');
submit('sudo passwd bob');
submit('cat /etc/shadow');
assert.equal(evaluate('state.done.includes(42)'),false,'Mission 43 : conserver les droits nécessaires avec cat');
submit('sudo cat /etc/passwd');
assert.equal(evaluate('state.done.includes(42)'),false,'Mission 43 : vérifier le fichier consulté');
submit('sudo cat /etc/shadow');
assert.equal(evaluate('state.done.includes(42)'),true,'Mission 43 : accepter sudo cat');
evaluate('openActivity(basicMissionCount)');
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
assert.equal(evaluate('Object.hasOwn(docs,"id")'),true);
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
for(let i=0;i<basicMissionCount;i++){
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
assert.equal(tab('sudo userm'),'sudo usermod');
assert.equal(tab('sudo -u alice tou'),'sudo -u alice touch');
assert.equal(tab('man jour'),'man journalctl');
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
