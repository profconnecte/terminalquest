function formatFrenchDate(timestamp){return new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(timestamp));}
function execute(raw){
 const tokens=tokenize(raw);if(!tokens.length)return null;const cmd=tokens.shift();
 const allowed={ls:'al',pwd:'',cd:'',cat:'n',mkdir:'p',touch:'c',echo:'n',cp:'rn',mv:'n',rm:'dr',man:'',help:'',clear:''};
 if(!Object.hasOwn(allowed,cmd))throw Error(cmd+' : commande inconnue. Tape help.');
 let args=[],flags=new Set(),end=false,redirect=null,dest=null;
 for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t==='>'||t==='>>'){if(cmd!=='echo'||i!==tokens.length-2)throw Error('Redirection simulée : echo [texte] > fichier ou >> fichier');redirect=t;dest=tokens[++i];break;}if(t==='--'&&!end){end=true;continue;}if(!end&&t.startsWith('-')&&t!=='-'&&(cmd!=='echo'||args.length===0)){for(const flag of t.slice(1)){if(!allowed[cmd].includes(flag))throw Error(cmd+' : option non prise en charge : -'+flag);flags.add(flag);}}else args.push(t);}
 const fs=state.fs,paths=args.map(x=>path(x)),p=paths[0],effect={},before=state.cwd;let output='';
 const need=(min,max=min)=>{if(args.length<min||args.length>max)throw Error('Usage : '+(docs[cmd]?.[1]||cmd));};
 const exists=x=>{if(!fs[x])throw Error(x+' : aucun fichier ou dossier de ce nom');return fs[x];};
 const parent=x=>x.slice(0,x.lastIndexOf('/'))||'/';
 const directory=x=>{if(exists(x).type!=='dir')throw Error(x+' : n’est pas un dossier');};
 const writable=x=>{directory(parent(x));if(fs[x]?.type==='dir')throw Error(x+' : est un dossier');};
 const tick=()=>{state.clock=Math.max(Date.now(),(state.clock||0)+61000);return state.clock;};
 const node=(type,content='')=>({type,content,owner:'etudiant',group:'staff',modified:tick()});
 const makeDir=x=>{if(fs[x]){directory(x);return;}directory(parent(x));fs[x]=node('dir');};
 switch(cmd){
 case 'help':output='Commandes : '+Object.keys(docs).join(', ')+'\nForme : commande [options] [arguments]\n. courant | .. parent | ~ personnel | / racine\nman commande : fiches pédagogiques abrégées du simulateur.\nDates : heure française (Europe/Paris).\nclear : nettoyer l’écran.';break;
 case 'clear':need(0);$('output').replaceChildren();break;
 case 'man':need(1);output=manual(args[0]);break;
 case 'pwd':need(0);output=state.cwd;break;
 case 'cd':need(0,1);directory(p||HOME);state.cwd=p||HOME;break;
 case 'ls':{
 need(0,1);const target=p||state.cwd;exists(target);let entries;
 if(fs[target].type==='file')entries=[[args[0],fs[target]]];else{entries=Object.keys(fs).filter(x=>x!=='/'&&parent(x)===target).map(x=>[x.split('/').pop(),fs[x]]).filter(([n])=>flags.has('a')||!n.startsWith('.'));if(flags.has('a'))entries.push(['.',fs[target]],['..',fs[parent(target)]||fs['/']]);entries.sort(([a],[b])=>a.localeCompare(b));}
 output=entries.map(([name,n])=>{if(!flags.has('l'))return name;const date=formatFrenchDate(n.modified??Date.UTC(2026,9,15,12));return (n.type==='dir'?'drwxr-xr-x':'-rw-r--r--')+' 1 '+(n.owner||'etudiant').padEnd(9)+' '+(n.group||'staff').padEnd(7)+' '+String(n.type==='dir'?4096:new TextEncoder().encode(n.content||'').length).padStart(5)+' '+date+' '+name;}).join(flags.has('l')?'\n':'  ');effect.listed=target;break;}
 case 'cat':need(1,Infinity);{let text=paths.map(x=>{if(exists(x).type==='dir')throw Error(x+' : est un dossier');return fs[x].content;}).join('');output=flags.has('n')?text.split('\n').map((v,i,arr)=>i===arr.length-1&&v===''?'':String(i+1).padStart(6)+'  '+v).join('\n'):text;}break;
 case 'mkdir':need(1,Infinity);for(const x of paths){if(!flags.has('p')){if(fs[x])throw Error(x+' : existe déjà');makeDir(x);}else{let curr='';for(const part of x.split('/').filter(Boolean)){curr+='/'+part;makeDir(curr);}}}break;
 case 'touch':need(1,Infinity);for(const x of paths){if(!fs[x]){if(flags.has('c'))continue;writable(x);fs[x]=node('file');}else fs[x].modified=tick();}break;
 case 'echo':output=args.join(' ')+(flags.has('n')?'':'\n');if(redirect){const x=path(dest);writable(x);fs[x]={...node('file'),...fs[x],content:(redirect==='>>'?(fs[x]?.content||''):'')+output,modified:tick()};effect.wrote=x;effect.redirect=redirect;output='';}break;
 case 'cp':case 'mv':{
 need(2);const source=p;exists(source);let target=paths[1];if(fs[target]?.type==='dir')target+='/'+source.split('/').pop();if(source===target)throw Error('La source et la destination sont identiques.');if(target.startsWith(source+'/'))throw Error('Impossible de placer un dossier dans lui-même.');if(fs[source].type==='dir'&&cmd==='cp'&&!flags.has('r'))throw Error('cp : dossier omis ; consulte man cp pour la copie récursive.');if(cmd==='mv'&&(source===state.cwd||state.cwd.startsWith(source+'/')))throw Error('Quitte ce dossier avant de le déplacer.');if(fs[target]&&flags.has('n')){effect.skipped=true;break;}writable(target);const children=Object.keys(fs).filter(x=>x===source||x.startsWith(source+'/'));for(const x of children)fs[target+x.slice(source.length)]={...fs[x],...(cmd==='cp'?{owner:'etudiant',modified:tick()}:{})};if(cmd==='mv')for(const x of children)delete fs[x];effect.from=source;effect.to=target;break;}
 case 'rm':need(1,Infinity);effect.removed=[];for(const x of paths){exists(x);if(x==='/'||x===HOME||x===state.cwd||state.cwd.startsWith(x+'/'))throw Error('Ce dossier est utilisé et ne peut pas être supprimé ici.');const children=Object.keys(fs).filter(y=>y.startsWith(x+'/'));if(fs[x].type==='dir'&&!flags.has('r')){if(!flags.has('d'))throw Error('rm : est un dossier ; consulte man rm.');if(children.length)throw Error('rm : dossier non vide.');}for(const y of [x,...children]){delete fs[y];effect.removed.push(y);}}break;
 }
 return {cmd,args,flags,paths,p:cmd==='ls'?effect.listed:p,fs,effect,output,before};
}
function incompleteFeedback(e){if(e.cmd==='touch'&&e.flags.has('c')&&e.paths.every(p=>!e.fs[p]))return 'Défi non validé : touch -c n’a rien créé, car les chemins indiqués n’existent pas. touch agit sur les dates des fichiers ; pour créer des dossiers, consulte man mkdir.';return 'Défi non validé : cette commande ne remplit pas l’objectif demandé. Vérifie la commande, ses options et les chemins dans la consigne.';}
function run(raw){const e=execute(raw);if(!e)return;if(e.output)line(e.output);const i=state.selected;const passed=missions[i][4](e);if(passed&&!state.done.includes(i)){state.done.push(i);staff('✓ Défi accompli : '+missions[i][1]);staff('Bien joué. '+missions[i][5],i%2?'Alex':'Mina');if(state.done.length===missions.length)staff('La régie est prête ! Tu maîtrises maintenant les bases, les options et les chemins. Tu peux continuer à explorer.');else state.selected=state.done.length;}else if(!state.done.includes(i)&&!['ls','pwd','cat','man','help','clear','cd'].includes(e.cmd))staff(incompleteFeedback(e),'Alex');save();render();if(state.selected!==i)introduce();}
