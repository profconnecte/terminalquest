const THEME_KEY='terminal-quest-theme';
let theme;try{theme=localStorage.getItem(THEME_KEY);}catch{}
if(!['light','dark'].includes(theme))theme=globalThis.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark';
function applyTheme(){document.documentElement.dataset.theme=theme;const button=document.getElementById('theme-toggle');const label=theme==='dark'?'Activer le thème clair':'Activer le thème sombre';button.textContent=theme==='dark'?'☀':'☾';button.setAttribute('aria-label',label);button.setAttribute('title',label);}
applyTheme();
document.getElementById('theme-toggle').onclick=()=>{theme=theme==='dark'?'light':'dark';applyTheme();try{localStorage.setItem(THEME_KEY,theme);}catch{}};
function fresh(){return {cwd:HOME,fs:{'/':{type:'dir'},'/home':{type:'dir'},[HOME]:{type:'dir'},[HOME+'/tournoi']:{type:'dir'},[HOME+'/tournoi/briefing.txt']:{type:'file',owner:'laura',group:'staff',content:'NEXUS INVITATIONAL — BRIEFING STAFF\nFinale : ce soir, 20h. Aurora contre Pulse.\nPréparer finale/annonce.txt : Finale a 20h\nCopier equipes.txt dans finale/ puis le renommer lineup.txt.\nSupprimer uniquement le brouillon, conserver les sources.\nLaura : on compte sur toi !\n'},[HOME+'/tournoi/equipes.txt']:{type:'file',content:'AURORA : Nova, Pixel, Echo, Kira, Volt\nPULSE : Nox, Mika, Aki, Raze, Sol\n'},[HOME+'/tournoi/brouillon.txt']:{type:'file',content:'ANCIEN HORAIRE : 18h — ne pas diffuser.\n'},[HOME+'/tournoi/.staff.txt']:{type:'file',content:'Noah : le briefing appartient à laura. Vérifie-le avec un listage détaillé.\n'},[HOME+'/Bienvenue.txt']:{type:'file',content:'Bienvenue dans le staff du Nexus Invitational. Laura t’attend dans tournoi/.\n'}},done:[],selected:0};}
let state;try{state=JSON.parse(localStorage.getItem(KEY));if(!state?.fs?.[HOME]||!Array.isArray(state.done)||!Number.isInteger(state.selected)||state.selected<0||state.selected>=activityCount)state=fresh();}catch{state=fresh();}let history=[],cursor=0;
// Actualiser aussi les personnages des fichiers initiaux déjà sauvegardés.
for(const name of ['tournoi/briefing.txt','tournoi/.staff.txt','Bienvenue.txt']){
 const file=state.fs[HOME+'/'+name];
 if(file?.content)file.content=file.content.replaceAll('Mina','Laura').replaceAll('Alex','Noah').replaceAll('mina','laura');
 if(file?.owner==='mina')file.owner='laura';
}
const $=id=>document.getElementById(id);function save(){try{localStorage.setItem(KEY,JSON.stringify({...state,freeNavigation:true,terminalAdministration:true}));}catch{}}
function selectActivity(index){
 if(state.selected!==index)state.actionIndex=0;
 state.selected=index;
 $('activity-status').textContent='';
 save();
 render();
 introduce();
 $('title').focus?.();
}
function restoreMission(index){
 const session=fresh();
 // Reconstituer les prérequis dans une session isolée, sans valider les défis précédents.
 initializeAdministration(session);
 for(let i=0;i<index;i++){
  for(const command of missions[i][3].split('\n'))execute(command,session);
 }
 state.fs=session.fs;
 state.admin=session.admin;
 state.cwd=session.cwd;
 state.clock=session.clock;
 state.actionIndex=0;
 $('output').replaceChildren();
 $('team-messages').replaceChildren();
 history=[];
 cursor=0;
 pendingCompletion=null;
 $('command').value='';
 syncHighlight();
 line('Environnement de départ restauré pour ce défi.','welcome');
}
function openActivity(index){
 if(index!==state.selected&&missions[index])restoreMission(index);
 selectActivity(index);
}
function resetActivity(){
 const index=state.selected;
 restoreMission(index);
 state.done=state.done.filter(done=>done!==index);
 if(state.hints)delete state.hints[index];
 save();
 render();
 introduce();
 $('activity-status').textContent='Environnement de départ restauré.';
}
function path(raw='~',cwd=state.cwd){let p=raw.startsWith('~')?HOME+raw.slice(1):raw.startsWith('/')?raw:cwd+'/'+raw;let result=[];for(const v of p.split('/')){if(v==='..')result.pop();else if(v&&v!=='.')result.push(v);}return '/'+result.join('/');}
function line(text,cls=''){const el=document.createElement('div');el.className='line '+cls;el.textContent=text;$('output').append(el);$('output').scrollTop=$('output').scrollHeight;}
function render(){
 const mission=missions[state.selected];
 const completed=state.done.includes(state.selected);
 $('counter').textContent=state.done.length+' / '+activityCount;
 $('bar').style.width=state.done.length/activityCount*100+'%';
 const label=`MISSION ${String(state.selected+1).padStart(2,'0')} / ${missions.length}`;
 $('step').textContent=label+(completed?' · VALIDÉE':'');
 $('title').textContent=mission[1];
 $('description').textContent=mission[2];
 $('concept').textContent=mission[5];
 const count=mission.actions?.length||1;
 $('action-progress').textContent=count>1?`Actions vérifiées · ${completed&&!state.actionIndex?count:state.actionIndex||0} / ${count}`:'';
 hintView();
 const nav=$('missions');
 const scroll=nav.scrollTop;
 nav.replaceChildren();
 missions.forEach((mission,i)=>{
  if(i===basicMissionCount){
   const heading=document.createElement('h3');
   heading.className='course-section';
   heading.textContent='Administration du serveur Nexus';
   nav.append(heading);
  }
  const button=document.createElement('button');
  button.className=(i===state.selected?'active ':'')+(state.done.includes(i)?'done':'');
  if(i===state.selected)button.setAttribute('aria-current','step');
  const number=document.createElement('span');
  number.className='number';
  number.textContent=state.done.includes(i)?'✓':String(i+1).padStart(2,'0');
  button.append(number,document.createTextNode(mission[1]));
  button.onclick=()=>openActivity(i);
  nav.append(button);
 });
 nav.scrollTop=scroll;
 const current=nav.querySelector?.('[aria-current="step"]');
 if(current&&current.offsetTop+current.offsetHeight>nav.scrollTop+nav.clientHeight){
  nav.scrollTop=current.offsetTop+current.offsetHeight-nav.clientHeight;
 }else if(current&&current.offsetTop<nav.scrollTop){
  nav.scrollTop=current.offsetTop;
 }
 const loc=state.cwd.replace(HOME,'~');
 $('location').textContent=loc;
 $('prompt').textContent=`etudiant@nexus:${loc}$`;
}
function manual(cmd){
 if(!Object.hasOwn(docs,cmd))throw Error('Aucune entrée de manuel pour '+cmd);
 const [summary,syntax,example,options]=docs[cmd];
 return [
  cmd.toUpperCase()+' — '+summary,
  'MANUEL PÉDAGOGIQUE ABRÉGÉ\nTerminal simulé · Options prises en charge dans le jeu.',
  'UTILISATION\n  '+syntax,
  'EXEMPLE\n  '+example,
  'OPTIONS ET ARGUMENTS\n'+options,
  'REPÈRES\nLes crochets indiquent un élément facultatif. La barre verticale sépare des formes possibles.',
 ].join('\n\n');
}
function addManualButtons(container){
 for(const cmd of Object.keys(docs)){
  const button=document.createElement('button');
  button.type='button';
  button.textContent=cmd;
  button.onclick=()=>{
   $('manual-title').textContent=cmd;
   $('manual-body').textContent=manual(cmd);
   $('manual').showModal();
  };
  container.append(button);
 }
}
function tokenize(s){let tokens=[],re=/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(>>|>)|([^\s>"']+)/g,m,last=0;while((m=re.exec(s))){if(s.slice(last,m.index).trim())throw Error('Guillemets non fermés.');tokens.push(m[1]??m[2]??m[3]??m[4]);last=re.lastIndex;}if(s.slice(last).trim())throw Error('Guillemets non fermés.');return tokens;}
$('command-form').onsubmit=e=>{e.preventDefault();pendingCompletion=null;let raw=$('command').value.trim();if(!raw)return;history.push(raw);cursor=history.length;commandLine(raw);$('command').value='';syncHighlight();try{run(raw);}catch(e){line(e.message,'error');staff(errorGuidance(e.message),'Noah');}save();};
let pendingCompletion=null;
function completeCommand(input){
 const caret=input.selectionStart??input.value.length;
 const before=input.value.slice(0,caret),after=input.value.slice(caret);
 const match=before.match(/(?:^|[\s>])("[^"]*|'[^']*|[^\s"'>]*)$/);
 if(!match)return;
 const raw=match[1],quote=/^["']/.test(raw)?raw[0]:'',word=quote?raw.slice(1):raw;
 const head=before.slice(0,before.length-raw.length),command=head.trim().split(/\s+/)[0];
 let choices;
 const prefix=head.trim();
 if(!prefix||prefix==='man'||/^sudo(?:\s+-u\s+\S+)?$/.test(prefix)){
  const commands=Object.keys(docs);
  if(!prefix)commands.push('help','clear');
  choices=commands.filter(x=>x.startsWith(word));
 }
 else{
  const slash=word.lastIndexOf('/'),prefix=slash<0?'':word.slice(0,slash+1),name=word.slice(slash+1),base=path(prefix||'.');
  choices=Object.keys(state.fs).filter(x=>x!=='/'&&(x.slice(0,x.lastIndexOf('/'))||'/')===base)
   .filter(x=>{const n=x.split('/').pop();return n.startsWith(name)&&(!n.startsWith('.')||name.startsWith('.'))&&(command!=='cd'||state.fs[x].type==='dir');})
   .map(x=>prefix+x.split('/').pop()+(state.fs[x].type==='dir'?'/':''));
 }
 choices.sort();
 if(!choices.length){pendingCompletion=null;return;}
 let common=choices[0];for(const choice of choices)while(!choice.startsWith(common))common=common.slice(0,-1);
 if(choices.length>1&&pendingCompletion===input.value+'|'+caret){commandLine(input.value);line(choices.join('  '));}
 else if(common.length>word.length||choices.length===1){input.value=head+quote+common+after;const next=head.length+quote.length+common.length;input.setSelectionRange?.(next,next);}
 pendingCompletion=choices.length>1?input.value+'|'+(input.selectionStart??input.value.length):null;
 syncHighlight();
}
$('command').onkeydown=e=>{
 if(e.key==='Tab'){e.preventDefault();completeCommand(e.target);return;}
 pendingCompletion=null;
 if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();cursor=Math.max(0,Math.min(history.length,cursor+(e.key==='ArrowUp'?-1:1)));e.target.value=history[cursor]||'';syncHighlight();}
};
$('hint').onclick=requestHint;$('command').oninput=()=>{pendingCompletion=null;syncHighlight();};$('command').onscroll=()=>{$('command-highlight').scrollLeft=$('command').scrollLeft;};$('reset').onclick=()=>{if(confirm('Recommencer le parcours ? La progression et les fichiers simulés seront effacés.')){state=fresh();save();$('output').replaceChildren();$('team-messages').replaceChildren();history=[];cursor=0;$('command').value='';syncHighlight();welcome();render();introduce();}};$('close-manual').onclick=()=>$('manual').close();addManualButtons($('commands'));
$('reset-activity').onclick=resetActivity;
function welcome(){$('activity-status').textContent='';line('Terminal Linux simulé — tape help pour les commandes.','welcome');staff('Bienvenue dans l’équipe ! Les joueurs sont prêts, à nous de préparer la finale. Demande une piste ici si tu bloques.');}
const legacyAdministration=!state.terminalAdministration;
const finishedBasics=!state.freeNavigation&&state.selected===basicMissionCount-1
 &&missions.slice(0,basicMissionCount).every((_,i)=>state.done.includes(i));
if(legacyAdministration){
 state.done=state.done.filter(i=>i<basicMissionCount);
 if(state.selected>=basicMissionCount||finishedBasics){
  state.selected=basicMissionCount;
  restoreMission(state.selected);
 }
}
initializeAdministration(state);
save();
welcome();
render();
introduce();
syncHighlight();
