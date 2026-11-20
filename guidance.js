function getAids(i){
 const mission=missions[i];
 const action=mission.actions?.[state.actionIndex||0];
 const tokens=action?tokenize(action.solution):[mission[0]];
 const command=tokens[0];
 const subcommand=command==='sudo'?tokens[tokens[1]==='-u'?3:1]:null;
 const syntax=subcommand&&Object.hasOwn(docs,subcommand)
  ? (tokens[1]==='-u'?'sudo -u utilisateur ':'sudo ')+docs[subcommand][1].replace(/^sudo /,'')
  : docs[command][1];
 return [mission[6], 'Syntaxe à adapter : '+syntax+' — Consulte man '+(subcommand&&Object.hasOwn(docs,subcommand)?subcommand:command)+' pour les options.'];
}
function staff(text,speaker='Laura'){const message=document.createElement('article');message.className='chat-message';const name=document.createElement('strong');name.className=speaker==='Noah'?'chat-noah':'chat-laura';name.textContent=speaker==='Noah'?'Noah · Régie':'Laura · Organisation';const body=document.createElement('p');body.textContent=text;message.append(name,body);$('team-messages').append(message);$('team-messages').scrollTop=$('team-messages').scrollHeight;}
function introduce(){
 const mission=missions[state.selected];
 const quoted=mission[2].match(/^(Laura|Noah) : «\s*(.*?)\s*»\.?$/);
 staff(quoted?quoted[2]:mission[2],quoted?quoted[1]:state.selected%2?'Noah':'Laura');
}
function hintView(){const level=state.hints?.[state.selected]||0;$('hint-text').textContent=level?getAids(state.selected)[level-1]:'';$('hint').disabled=level>=2;$('hint').textContent=level===0?'Demander une piste':level===1?'Consulter la syntaxe':'Aides consultées · à vous de jouer';}
function requestHint(){state.hints??={};let level=state.hints[state.selected]||0;if(level>=2)return;state.hints[state.selected]=level+1;staff(getAids(state.selected)[level],'Noah');save();hintView();}
function errorGuidance(message){if(/guillemet/i.test(message))return 'Une citation ouverte doit être refermée avec le même guillemet.';if(/aucun fichier|pas un dossier/i.test(message))return 'Vérifie ton emplacement avec pwd puis les noms avec ls. Linux distingue les majuscules et les minuscules.';if(/existe déjà/i.test(message))return 'Cet élément existe déjà. Inspecte-le avant de le modifier ; tu peux continuer à explorer.';if(/inconnue/i.test(message))return 'Vérifie le nom de la commande. help donne la liste ; man explique son utilisation.';return 'Lis le message du terminal, puis consulte man pour vérifier les arguments. Une erreur fait partie de l’exploration.';}
function paintCommand(container,raw){container.replaceChildren();let first=true;for(const match of raw.matchAll(/\s+|"[^"]*"?|'[^']*'?|>>|>|[^\s>]+/g)){let text=match[0],span=document.createElement('span');span.textContent=text;if(!/^\s+$/.test(text)){span.className=first?(Object.hasOwn(docs,text)||['help','clear'].includes(text)?'syntax-command':'syntax-unknown'):/^["']/.test(text)?'syntax-string':/^>/.test(text)?'syntax-operator':text.startsWith('-')?'syntax-option':/[/.~]/.test(text)?'syntax-path':'syntax-argument';first=false;}container.append(span);}}
function syncHighlight(){paintCommand($('command-highlight'),$('command').value);$('command-highlight').scrollLeft=$('command').scrollLeft;}
function commandLine(raw){const row=document.createElement('div');row.className='line command-line';const prompt=document.createElement('span');prompt.className='shell-prompt';prompt.textContent=$('prompt').textContent+' ';const code=document.createElement('span');paintCommand(code,raw);row.append(prompt,code);$('output').append(row);}
