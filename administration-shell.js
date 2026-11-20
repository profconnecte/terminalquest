function initializeAdministration(session){
 if(session.admin)return;
 session.admin={
  users:{
   root:{uid:0,group:'root',groups:[],home:'/root',shell:'/bin/bash'},
   nobody:{uid:65534,group:'nogroup',groups:[],home:'/nonexistent',shell:'/usr/sbin/nologin'},
   etudiant:{uid:1000,group:'etudiant',groups:['sudo','staff'],home:HOME,shell:'/bin/bash'},
  },
  groups:{root:0,sudo:27,staff:50,nogroup:65534,etudiant:1000},
  nextId:1001,
  nextPid:backupPid,
  processes:[{pid:1,name:'systemd',actor:'root'},{pid:608,name:'sshd',actor:'root'},{pid:901,name:'bash',actor:'etudiant'}],
  services:{
   'ssh.service':{status:'active',enabled:true},
   [logService]:{status:'inactive',enabled:false},
   [failedService]:{status:'failed',enabled:true},
  },
  journal:[
   {unit:logService,message:'Export arrêté à la fin des essais.',boot:false},
   {unit:'systemd',message:'Démarrage du serveur Nexus.',boot:true},
   {unit:'ssh.service',message:'Serveur SSH à l’écoute.',boot:true},
   {unit:failedService,message:'Démarrage du service d’archivage.',boot:true},
   {unit:failedService,message:'Échec : /var/lib/nexus/archives est introuvable.',boot:true},
   {unit:'systemd',message:'Session etudiant ouverte.',boot:true},
   {unit:'ssh.service',message:'Connexion de la régie acceptée.',boot:true},
  ],
 };
 for(const target of ['/etc','/srv','/var','/var/log','/var/log/nexus']){
  session.fs[target]={type:'dir',owner:'root',group:'root',mode:0o755};
 }
 const entries=Array.from({length:30},(_,i)=>{
  const message=i===17||i===24?'signal perdu':i===18||i===25?'signal rétabli':'test vidéo nominal';
  return '19:'+String(i).padStart(2,'0')+' nexus-video : '+message;
 });
 session.fs[streamLog]={type:'file',owner:'root',group:'root',mode:0o644,content:entries.join('\n')+'\n'};
 syncAccountFiles(session);
}

function syncAccountFiles(session){
 const {users,groups}=session.admin;
 const accounts=Object.entries(users);
 const passwd=accounts.map(([name,u])=>[name,'x',u.uid,groups[u.group],'',u.home,u.shell].join(':'));
 const shadow=accounts.map(([name,u])=>name+':'+(u.changedPassword?'$EMPREINTE_SIMULEE$':'!')+':20768:0:99999:7:::');
 const group=Object.entries(groups).map(([name,gid])=>name+':x:'+gid+':'+accounts.filter(([,u])=>u.groups.includes(name)).map(([user])=>user).join(','));
 for(const [name,rows,mode] of [['passwd',passwd,0o644],['shadow',shadow,0o640],['group',group,0o644]]){
  session.fs['/etc/'+name]={type:'file',content:rows.join('\n')+'\n',owner:'root',group:'root',mode};
 }
}

function account(session,name){
 if(!Object.hasOwn(session.admin.users,name))throw Error(name+' : compte inconnu');
 return session.admin.users[name];
}
function groupId(session,name){
 if(!Object.hasOwn(session.admin.groups,name))throw Error(name+' : groupe inconnu');
 return session.admin.groups[name];
}
function pathParent(target){return target.slice(0,target.lastIndexOf('/'))||'/';}
function canAccess(session,actor,target,bits){
 if(actor==='root')return true;
 const node=session.fs[target];
 if(node?.mode===undefined)return true;
 const user=account(session,actor);
 const shift=node.owner===actor?6:[user.group,...user.groups].includes(node.group)?3:0;
 return ((node.mode>>shift)&bits)===bits;
}
function canTraverse(session,actor,target){
 for(let parent=pathParent(target);parent!=='/';parent=pathParent(parent)){
  if(!canAccess(session,actor,parent,1))return false;
 }
 return true;
}
function permissionText(node){
 if(node.mode===undefined)return node.type==='dir'?'drwxr-xr-x':'-rw-r--r--';
 const letters=Array.from('rwxrwxrwx',(letter,i)=>node.mode&(1<<(8-i))?letter:'-');
 if(node.mode&0o2000)letters[5]=letters[5]==='x'?'s':'S';
 return (node.type==='dir'?'d':'-')+letters.join('');
}

function executeSudo(tokens,session,actor){
 if(actor!=='etudiant')throw Error('sudo : élévation non autorisée pour '+actor);
 if(tokens.length===1&&tokens[0]==='-l')return {cmd:'sudo',args:tokens,actor,output:'Utilisateur etudiant : autorisé à exécuter les commandes du laboratoire simulé.'};
 let target='root';
 if(tokens[0]==='-u'){
  tokens.shift();
  target=tokens.shift();
  account(session,target);
 }
 if(!tokens.length)throw Error('Usage : sudo [-u utilisateur] commande');
 return executeTokens(tokens,session,target);
}

function executeAdministration(cmd,args,session,actor){
 if(!Object.hasOwn(administrationDocs,cmd))return null;
 const {users,groups,processes,services,journal}=session.admin;
 const fs=session.fs,paths=args.map(arg=>path(arg,session.cwd)),effect={};
 const result={cmd,args,paths,p:paths[0],actor,fs,before:session.cwd,flags:new Set(),effect,output:''};
 const need=(min,max=min)=>{if(args.length<min||args.length>max)throw Error('Usage : '+administrationDocs[cmd][1]);};
 const root=()=>{if(actor!=='root')throw Error(cmd+' : opération réservée à root.');};
 const deny=target=>({...result,denied:true,output:cmd+' : '+target+' : Permission non accordée'});
 const node=target=>{
  if(!fs[target])throw Error(target+' : aucun fichier ou dossier de ce nom');
  return fs[target];
 };
 const formattedId=name=>{
  const u=account(session,name),gid=groupId(session,u.group);
  const memberships=[u.group,...u.groups].map(g=>groups[g]+'('+g+')').join(',');
  return 'uid='+u.uid+'('+name+') gid='+gid+'('+u.group+') groupes='+memberships;
 };
 switch(cmd){
 case 'whoami':need(0);result.output=actor;break;
 case 'id':need(0,1);result.output=formattedId(args[0]||actor);break;
 case 'head':
 case 'tail':{
  need(1,3);
  const count=args[0]==='-n'&&args.length===3&&/^\d+$/.test(args[1])?Number(args[1]):args.length===1&&!args[0].startsWith('-')?10:null;
  if(count===null||!Number.isSafeInteger(count))throw Error('Usage : '+cmd+' [-n nombre] fichier');
  const target=paths.at(-1);
  if(!canTraverse(session,actor,target)||!canAccess(session,actor,target,4))return deny(target);
  const file=node(target);
  if(file.type!=='file')throw Error(target+' : est un dossier');
  const lines=file.content.replace(/\n$/,'').split('\n');
  result.output=(cmd==='head'?lines.slice(0,count):count?lines.slice(-count):[]).join('\n');
  Object.assign(effect,{path:target,count});
  break;
 }
 case 'grep':{
  need(2,3);
  const ignoreCase=args.length===3&&args[0]==='-i';
  if(args.length===3&&!ignoreCase)throw Error('Usage : grep [-i] motif fichier');
  const [pattern,targetArg]=args.slice(-2),target=path(targetArg,session.cwd);
  if(!canTraverse(session,actor,target)||!canAccess(session,actor,target,4))return deny(target);
  const file=node(target);
  if(file.type!=='file')throw Error(target+' : est un dossier');
  // Motifs pédagogiques : recherche littérale, avec ^ et $ pour les extrémités.
  const start=pattern.startsWith('^'),end=pattern.endsWith('$')&&pattern.length>Number(start);
  const normalize=value=>ignoreCase?value.toLowerCase():value;
  const query=normalize(pattern.slice(Number(start),end?-1:undefined));
  const matches=value=>start&&end?value===query:start?value.startsWith(query):end?value.endsWith(query):value.includes(query);
  result.output=file.content.replace(/\n$/,'').split('\n').filter(line=>matches(normalize(line))).join('\n');
  Object.assign(effect,{pattern,path:target});
  break;
 }
 case 'adduser':
 case 'groupadd':{
  need(1);root();
  const name=args[0];
  if(!/^[a-z][a-z0-9_-]*$/.test(name))throw Error('Nom de compte ou de groupe invalide.');
  if(Object.hasOwn(groups,name)||Object.hasOwn(users,name))throw Error(name+' : existe déjà');
  const id=session.admin.nextId++;
  groups[name]=id;
  if(cmd==='adduser'){
   const home='/home/'+name;
   users[name]={uid:id,group:name,groups:[],home,shell:'/bin/bash'};
   fs[home]={type:'dir',owner:name,group:name,mode:0o700};
   result.output='Compte '+name+' créé. Dossier personnel : '+home;
  }else result.output='Groupe '+name+' créé.';
  syncAccountFiles(session);
  break;
 }
 case 'passwd':{
  need(0,1);
  const name=args[0]||actor;
  if(name!==actor)root();
  account(session,name).changedPassword=true;
  syncAccountFiles(session);
  result.output='Mot de passe simulé mis à jour pour '+name+'.';
  break;
 }
 case 'getent':{
  need(1,2);
  const [base,key]=args;
  if(!['group','passwd'].includes(base))throw Error(base+' : base non prise en charge');
  const text=fs['/etc/'+base].content.trimEnd();
  result.output=key?text.split('\n').filter(line=>line.startsWith(key+':')).join('\n'):text;
  if(!result.output)throw Error(key+' : entrée inconnue');
  break;
 }
 case 'usermod':{
  need(3,4);root();
  const options=args.slice(0,-2).join('');
  const append=['-aG','-Ga','-a-G','-G-a'].includes(options);
  if(!append&&options!=='-G')throw Error('Usage : sudo usermod [-a] -G groupe utilisateur');
  const [group,user]=args.slice(-2);
  const u=account(session,user);
  groupId(session,group);
  u.groups=append?[...new Set([...u.groups,group])]:[group];
  syncAccountFiles(session);
  Object.assign(effect,{user,group,append});
  break;
 }
 case 'chown':
 case 'chmod':{
  need(2);
  const target=paths[1],file=node(target);
  if(!canTraverse(session,actor,target))return deny(target);
  if(cmd==='chown'){
   root();
   const [owner,group]=args[0].split(':');
   if(owner)account(session,owner);
   if(group)groupId(session,group);
   file.owner=owner||file.owner||'etudiant';
   file.group=group||file.group||'staff';
   Object.assign(effect,{path:target,owner:file.owner,group:file.group});
  }else{
   if(actor!=='root'&&actor!==(file.owner||'etudiant'))return deny(target);
   const spec=args[0];
   if(/^[0-7]{3}$|^[02][0-7]{3}$/.test(spec))file.mode=parseInt(spec,8);
   else if(spec==='g+w')file.mode=(file.mode??(file.type==='dir'?0o755:0o644))|0o020;
   else throw Error('chmod : mode octal ou g+w attendu');
   Object.assign(effect,{path:target,mode:file.mode});
  }
  break;
 }
 case 'ps':{
  need(1);
  if(args[0]!=='aux')throw Error('Usage : ps aux');
  result.output=['UTILISATEUR PID STAT COMMANDE',...processes.map(p=>p.actor.padEnd(11)+p.pid+'  S    '+p.name)].join('\n');
  break;
 }
 case 'sleep':{
  need(2);
  if(!/^\d+$/.test(args[0])||args[1]!=='&')throw Error('Usage dans le simulateur : sleep secondes &');
  const seconds=Number(args[0]);
  if(!Number.isSafeInteger(seconds)||seconds<1)throw Error('sleep : durée invalide');
  const pid=session.admin.nextPid++;
  processes.push({pid,name:'sleep',actor,seconds});
  Object.assign(effect,{pid,seconds});
  result.output='[tâche] '+pid;
  break;
 }
 case 'pgrep':{
  need(1,2);
  const exact=args[0]==='-x'&&args.length===2;
  if(!exact&&args.length!==1)throw Error('Usage : pgrep [-x] motif');
  const pattern=args.at(-1);
  const matches=processes.filter(p=>exact?p.name===pattern:p.name.includes(pattern));
  const pids=matches.map(p=>p.pid);
  Object.assign(effect,{matches,exact});
  result.output=pids.join('\n');
  break;
 }
 case 'kill':{
  need(1,3);
  const signal=args.length===1?'TERM':args.length===3&&args[0]==='-s'?args[1]:args.length===2?args[0].slice(1):'';
  if(!['TERM','KILL'].includes(signal))throw Error('kill : signal pris en charge : TERM ou KILL');
  const pid=Number(args.at(-1)),index=processes.findIndex(p=>p.pid===pid);
  if(index<0)throw Error('kill : processus introuvable');
  if(actor!=='root'&&processes[index].actor!==actor)return deny(String(pid));
  const [process]=processes.splice(index,1);
  Object.assign(effect,{pid,signal,process});
  break;
 }
 case 'systemctl':{
  need(2);
  const [verb,name]=args,unit=serviceUnit(name);
  if(!Object.hasOwn(services,unit))throw Error(unit+' : unité inconnue');
  const service=services[unit];
  switch(verb){
  case 'status':
   result.output=unit+'\n   Loaded: '+(service.enabled?'enabled':'disabled')+'\n   Active: '+service.status+(service.status==='active'?' (running)':'');
   break;
  case 'is-enabled':result.output=service.enabled?'enabled':'disabled';break;
  case 'enable':
  case 'disable':
  case 'start':
  case 'stop':
  case 'restart':
   root();
   if(verb==='enable'||verb==='disable')service.enabled=verb==='enable';
   else service.status=verb==='stop'?'inactive':unit===failedService?'failed':'active';
   journal.push({unit,message:'Action '+verb+' · état '+service.status+' · '+(service.enabled?'enabled':'disabled'),boot:true});
   break;
  default:throw Error('systemctl : action non prise en charge');
  }
  Object.assign(effect,{unit,verb});
  break;
 }
 case 'journalctl':{
  let limit,unit,boot=false;
  for(let i=0;i<args.length;i++){
   if(args[i]==='-b')boot=true;
   else if(args[i]==='-u'&&args[i+1]&&!args[i+1].startsWith('-'))unit=serviceUnit(args[++i]);
   else if(args[i]==='-n'&&/^\d+$/.test(args[i+1]))limit=Number(args[++i]);
   else throw Error('Usage : journalctl [-b] [-u unité] [-n nombre]');
  }
  const matches=journal.map((entry,i)=>({...entry,minute:String(i).padStart(2,'0')})).filter(entry=>(!unit||entry.unit===unit)&&(!boot||entry.boot));
  const selected=limit===undefined?matches:limit?matches.slice(-limit):[];
  result.output=selected.map(entry=>'19:'+entry.minute+' nexus '+entry.unit+' : '+entry.message).join('\n')||'-- Aucun événement --';
  Object.assign(effect,{limit,unit,boot});
  break;
 }
 }
 return result;
}

function serviceUnit(name){return name.endsWith('.service')?name:name+'.service';}
