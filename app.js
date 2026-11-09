const THEME_KEY='terminal-quest-theme';
let theme;try{theme=localStorage.getItem(THEME_KEY);}catch{}
if(!['light','dark'].includes(theme))theme=globalThis.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark';
function applyTheme(){document.documentElement.dataset.theme=theme;const button=document.getElementById('theme-toggle');const label=theme==='dark'?'Activer le thème clair':'Activer le thème sombre';button.textContent=theme==='dark'?'☀':'☾';button.setAttribute('aria-label',label);button.setAttribute('title',label);}
applyTheme();
document.getElementById('theme-toggle').onclick=()=>{theme=theme==='dark'?'light':'dark';applyTheme();try{localStorage.setItem(THEME_KEY,theme);}catch{}};
function fresh(){return {cwd:HOME,fs:{'/':{type:'dir'},'/home':{type:'dir'},[HOME]:{type:'dir'},[HOME+'/tournoi']:{type:'dir'},[HOME+'/tournoi/briefing.txt']:{type:'file',owner:'laura',group:'staff',content:'NEXUS INVITATIONAL — BRIEFING STAFF\nFinale : ce soir, 20h. Aurora contre Pulse.\nPréparer finale/annonce.txt : Finale a 20h\nCopier equipes.txt dans finale/ puis le renommer lineup.txt.\nSupprimer uniquement le brouillon, conserver les sources.\nLaura : on compte sur toi !\n'},[HOME+'/tournoi/equipes.txt']:{type:'file',content:'AURORA : Nova, Pixel, Echo, Kira, Volt\nPULSE : Nox, Mika, Aki, Raze, Sol\n'},[HOME+'/tournoi/brouillon.txt']:{type:'file',content:'ANCIEN HORAIRE : 18h — ne pas diffuser.\n'},[HOME+'/tournoi/.staff.txt']:{type:'file',content:'Noah : le briefing appartient à laura. Vérifie-le avec un listage détaillé.\n'},[HOME+'/Bienvenue.txt']:{type:'file',content:'Bienvenue dans le staff du Nexus Invitational. Laura t’attend dans tournoi/.\n'}},done:[],selected:0};}
let state;try{state=JSON.parse(localStorage.getItem(KEY));if(!state?.fs?.[HOME]||!Array.isArray(state.done)||!Number.isInteger(state.selected)||state.selected<0||state.selected>=missions.length)state=fresh();}catch{state=fresh();}let history=[],cursor=0;
// Actualiser aussi les personnages des fichiers initiaux déjà sauvegardés.
for(const name of ['tournoi/briefing.txt','tournoi/.staff.txt','Bienvenue.txt']){
 const file=state.fs[HOME+'/'+name];
 if(file?.content)file.content=file.content.replaceAll('Mina','Laura').replaceAll('Alex','Noah').replaceAll('mina','laura');
 if(file?.owner==='mina')file.owner='laura';
}
const $=id=>document.getElementById(id);function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function path(raw='~'){let p=raw.startsWith('~')?HOME+raw.slice(1):raw.startsWith('/')?raw:state.cwd+'/'+raw;let result=[];for(const v of p.split('/')){if(v==='..')result.pop();else if(v&&v!=='.')result.push(v);}return '/'+result.join('/');}
function line(text,cls=''){const el=document.createElement('div');el.className='line '+cls;el.textContent=text;$('output').append(el);$('output').scrollTop=$('output').scrollHeight;}
function render(){let m=missions[state.selected];$('counter').textContent=state.done.length+' / '+missions.length;$('bar').style.width=state.done.length/missions.length*100+'%';$('step').textContent=`MISSION ${String(state.selected+1).padStart(2,'0')} / ${missions.length}${state.done.includes(state.selected)?' · VALIDÉE':''}`;$('title').textContent=m[1];$('description').textContent=m[2];$('concept').textContent=m[5];hintView();$('missions').replaceChildren();missions.forEach((m,i)=>{let b=document.createElement('button');b.disabled=i>state.done.length;b.className=(i===state.selected?'active ':'')+(state.done.includes(i)?'done':'');const n=document.createElement('span');n.className='number';n.textContent=state.done.includes(i)?'✓':String(i+1).padStart(2,'0');b.append(n,document.createTextNode(m[1]));b.onclick=()=>{state.selected=i;save();render();introduce();};$('missions').append(b);});let loc=state.cwd.replace(HOME,'~');$('location').textContent=loc;$('prompt').textContent=`staff@nexus:${loc}$`;}
function manual(cmd){if(!docs[cmd])throw Error('Aucune entrée de manuel pour '+cmd);return `${cmd.toUpperCase()} — ${docs[cmd][0]}\n\nMANUEL PÉDAGOGIQUE ABRÉGÉ\nCette fiche est un extrait adapté au simulateur, pas la page man complète de Linux. Seuls les arguments et options pris en charge ici sont présentés.\n\nUTILISATION\n  ${docs[cmd][1]}\n\nEXEMPLE\n  ${docs[cmd][2]}\n\nOPTIONS ET ARGUMENTS\n${docs[cmd][3]}\n\nREPÈRES\ncommande [options] [arguments]\nLes crochets du manuel ne se tapent pas. « . » = répertoire courant ; « .. » = parent.\nUn chemin absolu commence par / ; un chemin relatif part du répertoire courant, celui affiché par la commande pwd.`;}
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
 if(!head.trim())choices=[...Object.keys(docs),'help','clear'].filter(x=>x.startsWith(word));
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
$('hint').onclick=requestHint;$('command').oninput=()=>{pendingCompletion=null;syncHighlight();};$('command').onscroll=()=>{$('command-highlight').scrollLeft=$('command').scrollLeft;};$('reset').onclick=()=>{if(confirm('Recommencer le parcours ? La progression et les fichiers simulés seront effacés.')){state=fresh();save();$('output').replaceChildren();$('team-messages').replaceChildren();history=[];cursor=0;$('command').value='';syncHighlight();welcome();render();introduce();}};$('close-manual').onclick=()=>$('manual').close();for(const cmd of Object.keys(docs)){let b=document.createElement('button');b.textContent=cmd;b.onclick=()=>{$('manual-title').textContent=cmd;$('manual-body').textContent=manual(cmd);$('manual').showModal();};$('commands').append(b);}function welcome(){line('Terminal Linux simulé — tape help pour les commandes.','welcome');staff('Bienvenue dans l’équipe ! Les joueurs sont prêts, à nous de préparer la finale. Demande une piste ici si tu bloques.');}welcome();render();introduce();syncHighlight();
