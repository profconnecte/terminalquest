const administrationDocs = {
  whoami: ['Afficher le nom de l’utilisateur effectif.', 'whoami', 'whoami', 'Compare avec pwd pour connaître le répertoire courant et avec id pour connaître les identifiants et groupes.'],
  id: ['Afficher les identifiants et groupes d’un compte.', 'id [utilisateur]', 'id etudiant', 'Sans argument, id examine la session courante. uid identifie l’utilisateur, gid son groupe principal et groupes liste ses appartenances.'],
  head: ['Lire le début d’un fichier.', 'head [-n nombre] fichier', 'head -n 5 journal.txt', '-n définit le nombre de lignes. Par défaut, head affiche les dix premières lignes.'],
  tail: ['Lire la fin d’un fichier.', 'tail [-n nombre] fichier', 'tail -n 15 journal.txt', '-n définit le nombre de lignes. Par défaut, tail affiche les dix dernières lignes.'],
  grep: ['Rechercher les lignes correspondant à un motif.', 'grep [options] motif fichier', 'grep "replay prêt" journal.txt', 'Mets le motif entre guillemets s’il contient des espaces. Par défaut, grep affiche les lignes entières et distingue majuscules et minuscules. -i ignore la casse.'],
  sudo: ['Exécuter une commande avec une autre identité, selon les autorisations.', 'sudo [-u utilisateur] commande | sudo -l', 'sudo -u etudiant id', 'Sans -u, l’identité cible est généralement root. -l liste les commandes autorisées par la politique sudo.'],
  adduser: ['Créer un compte sur Debian.', 'sudo adduser utilisateur', 'sudo adduser cadreur', 'Avec cette syntaxe, Debian crée normalement le répertoire personnel et pose des questions sur le compte.'],
  passwd: ['Définir ou changer un mot de passe.', 'passwd | sudo passwd utilisateur', 'sudo passwd cadreur', 'Sans argument, passwd agit sur son propre compte. Le système conserve les informations de vérification dans /etc/shadow.'],
  groupadd: ['Créer un groupe local.', 'sudo groupadd groupe', 'sudo groupadd video', 'Le nom doit être disponible. getent group permet de vérifier que le groupe est connu du système.'],
  usermod: ['Modifier un compte existant.', 'sudo usermod -aG groupe utilisateur', 'sudo usermod -aG video cadreur', '-G fixe la liste des groupes secondaires. -a complète cette liste. Pour qu’une session interactive voie la nouvelle appartenance, reconnecte le compte.'],
  getent: ['Consulter les bases de comptes et de groupes du système.', 'getent base [clé]', 'getent group video', 'Utilise passwd pour les comptes et group pour les groupes. Pour les appartenances d’un utilisateur, consulte aussi id.'],
  chown: ['Changer le propriétaire ou le groupe propriétaire.', 'sudo chown propriétaire:groupe chemin', 'sudo chown root:video /srv/video', 'La forme :groupe change seulement le groupe propriétaire. Vérifie le résultat avec ls -ld pour un répertoire.'],
  chmod: ['Modifier les permissions.', 'chmod mode chemin', 'sudo chmod 750 /srv/video', 'En mode octal, 4 vaut lecture, 2 écriture et 1 exécution ou traversée. Les trois chiffres visent le propriétaire, le groupe et les autres. Un 2 initial active le bit setgid, qui transmet le groupe propriétaire aux nouveaux fichiers d’un répertoire. Le mode g+w ajoute l’écriture au groupe.'],
  sleep: ['Attendre pendant une durée donnée.', 'sleep secondes', 'sleep 45 &', '& est un opérateur du shell. Il lance la tâche en arrière-plan et rend la main au terminal.'],
  ps: ['Afficher un instantané des processus.', 'ps aux', 'ps aux', 'La colonne PID identifie chaque processus. La colonne COMMANDE indique le programme lancé.'],
  pgrep: ['Rechercher les PID des processus correspondant à un motif.', 'pgrep [-x] motif', 'pgrep -x sleep', '-x exige que le nom entier corresponde. Plusieurs processus peuvent avoir le même nom.'],
  kill: ['Envoyer un signal à un processus.', 'kill [-s signal] PID', 'kill 8142', 'Le signal par défaut est TERM. Vérifie le PID du processus que tu veux arrêter avant de lui envoyer le signal.'],
  systemctl: ['Consulter et administrer les services systemd.', 'systemctl action unité', 'systemctl status nexus-video.service', 'status affiche l’état actuel. start démarre et restart relance immédiatement. enable configure l’activation au démarrage. is-enabled consulte cette configuration. La modification d’un service système demande généralement des droits d’administration.'],
  journalctl: ['Consulter les événements collectés par systemd.', 'journalctl [-u unité] [-b] [-n nombre]', 'journalctl -u nexus-video.service -n 15', '-u filtre par unité, -b limite au démarrage courant et -n sélectionne les dernières entrées. Les droits du compte déterminent les journaux accessibles.'],
};

const basicMissionCount = missions.length;
const streamLog = '/var/log/nexus/stream.log';
const replayRoot = LAB+'/replays';
const exportsDir = LAB+'/exports';
const logService = 'nexus-export.service';
const failedService = 'nexus-archive.service';
const backupPid = 2401;

const commandIs = (cmd, ...args) => e => e.cmd===cmd&&e.args.length===args.length&&args.every((arg,i)=>arg===e.args[i]);
const action = (solution,check) => ({solution,check});
const exact = (cmd,...args) => action([cmd,...args].join(' '),asUser(cmd,'etudiant',commandIs(cmd,...args)));
const inspectPath = (solution,cmd,target) => action(solution,e=>e.cmd===cmd&&e.p===target&&!e.denied);
const asUser = (cmd,user,check) => e => e.cmd===cmd&&e.actor===user&&check(e);
const rootAction = (solution,cmd,...args) => action(solution,asUser(cmd,'root',commandIs(cmd,...args)));

function adminMission(cmd,title,goal,concept,piste,...actions){
 const first=actions[0];
 lesson(cmd,title,goal,concept,actions.map(a=>a.solution).join('\n'),first.check,piste);
 missions.at(-1).actions=actions;
}

adminMission('id','Vérifier l’identité de la régie','Avant d’intervenir sur le serveur Nexus, affiche le nom du compte actif, puis ses identifiants et ses groupes.',
 'whoami affiche le nom de l’utilisateur effectif. id affiche notamment l’UID, le GID principal et les groupes.',
 'Commence par le nom du compte. Demande ensuite les identifiants de la session courante.',exact('whoami'),exact('id'));
adminMission('cat','Vérifier la protection des comptes','Vérifie que ton compte de régie ne peut pas lire /etc/shadow. Essaie d’afficher ce fichier avec cat sans utiliser sudo.',
 'La lecture est réservée aux comptes autorisés. Le refus d’accès est ici le résultat attendu.',
 'Essaie en tant qu’etudiant. Le message du terminal indique le résultat du contrôle.',
 action('cat /etc/shadow',e=>e.cmd==='cat'&&e.p==='/etc/shadow'&&e.actor==='etudiant'&&e.denied));
adminMission('sudo','Contrôler les autorisations de la régie','Liste les autorisations sudo de ta session pour vérifier quelles commandes tu peux lancer avec des privilèges élevés.',
 'sudo applique une politique d’autorisation. L’option de consultation affiche les droits du compte sans lancer de commande privilégiée.',
 'Le manuel de sudo indique l’option qui liste les autorisations.',exact('sudo','-l'));
adminMission('id','Identifier le compte système','La régie doit reconnaître le compte superutilisateur dans un relevé. Affiche les identifiants du compte root.',
 'Le compte root porte l’UID 0 et dispose des privilèges d’administration.',
 'La commande qui affiche ton UID peut aussi prendre le nom d’un compte.',exact('id','root'));
adminMission('adduser','Créer le compte vidéo','La cadreuse Alice rejoint le tournoi. Crée le compte alice et son dossier personnel, puis vérifie ses identifiants avec id.',
 'Sur Debian, adduser crée normalement le compte et son dossier personnel. id permet de vérifier sa création.',
 'La création du compte requiert sudo. Le contrôle avec id se fait en tant qu’etudiant.',
 rootAction('sudo adduser alice','adduser','alice'),exact('id','alice'));
adminMission('grep','Lire la fiche du compte','Laura veut vérifier le dossier personnel et le shell attribués à Alice. Consulte /etc/passwd pour retrouver la ligne du compte alice.',
 'Les champs séparés par des deux-points donnent le login, l’indicateur de mot de passe, l’UID, le GID, le commentaire, le dossier personnel et le shell.',
 'Affiche le fichier avec cat ou recherche alice avec grep. Le motif alice: convient aussi ; ^alice: précise que le nom doit être au début de la ligne.',
 action('grep "^alice:" /etc/passwd',e=>!e.denied&&(e.cmd==='cat'?e.p==='/etc/passwd'&&e.output.split('\n').some(line=>line.startsWith('alice:')):e.cmd==='grep'&&e.effect.path==='/etc/passwd'&&e.output.startsWith('alice:')&&e.output.trim().split('\n').length===1)));
adminMission('passwd','Vérifier le mot de passe de test','Crée le compte bob pour les répétitions, change son mot de passe simulé puis affiche sa ligne dans /etc/shadow avec les droits nécessaires.',
 'Le deuxième champ de /etc/shadow contient un marqueur ou une empreinte de vérification. Le terminal utilise des données fictives.',
 'Pour la dernière action, utilise sudo avec cat pour afficher le fichier ou avec grep pour rechercher bob. Aucun mot de passe réel n’est demandé.',
 rootAction('sudo adduser bob','adduser','bob'),rootAction('sudo passwd bob','passwd','bob'),
 action('sudo grep "^bob:" /etc/shadow',e=>!e.denied&&e.actor==='root'&&(e.cmd==='cat'?e.p==='/etc/shadow'&&e.output.split('\n').some(line=>line.startsWith('bob:')):e.cmd==='grep'&&e.effect.path==='/etc/shadow'&&e.output.startsWith('bob:')&&e.output.trim().split('\n').length===1)));
adminMission('groupadd','Créer le groupe de la régie','Crée le groupe regie, puis interroge la base des groupes pour vérifier sa présence.',
 'Un groupe a un GID. Un compte possède un groupe principal et peut avoir des groupes secondaires.',
 'Utilise la base group avec getent.',rootAction('sudo groupadd regie','groupadd','regie'),exact('getent','group','regie'));
adminMission('usermod','Rattacher la cadreuse à la régie','Ajoute Alice au groupe secondaire regie en conservant ses autres appartenances. Vérifie avec id.',
 'Avec -G seul, la liste remplace les groupes secondaires. -a complète la liste.',
 'Combine les options d’ajout et de groupes secondaires.',
 action('sudo usermod -aG regie alice',asUser('usermod','root',e=>e.effect.user==='alice'&&e.effect.group==='regie'&&e.effect.append)),
 exact('id','alice'));
adminMission('chown','Attribuer le dossier des équipements','Crée /srv/regie, puis attribue-le à root et au groupe regie. Affiche les informations détaillées du répertoire lui-même.',
 'chown peut fixer à la fois le propriétaire et le groupe. ls -ld affiche les métadonnées du répertoire.',
 'La syntaxe de chown sépare le compte et le groupe par un deux-points.',
 action('sudo mkdir /srv/regie',asUser('mkdir','root',e=>!e.denied&&e.paths.includes('/srv/regie'))),
 action('sudo chown root:regie /srv/regie',asUser('chown','root',e=>e.effect.path==='/srv/regie'&&e.effect.owner==='root'&&e.effect.group==='regie')),
 action('ls -ld /srv/regie',e=>e.cmd==='ls'&&e.p==='/srv/regie'&&e.flags.has('l')&&e.flags.has('d')));
adminMission('chmod','Réserver le dossier à la régie','Donne les droits de lecture, d’écriture et de traversée sur /srv/regie au propriétaire et au groupe. Retire tous les droits aux autres.',
 'Le mode 770 donne rwx à chacune des deux premières catégories et aucun droit à la troisième.',
 'En octal, lecture vaut 4, écriture vaut 2 et traversée vaut 1.',
 action('sudo chmod 770 /srv/regie',asUser('chmod','root',e=>e.effect.path==='/srv/regie'&&e.effect.mode===0o770)));
adminMission('sudo','Tester l’accès d’Alice','Vérifie que le groupe regie peut créer un fichier dans /srv/regie. Fais créer test-video.txt par Alice avec touch.',
 'sudo -u lance une commande sous l’identité indiquée. La création confirme l’accès en écriture et en traversée au dossier.',
 'Précise Alice comme utilisatrice cible et donne le chemin complet à touch.',
 action('sudo -u alice touch /srv/regie/test-video.txt',asUser('touch','alice',e=>e.paths.includes('/srv/regie/test-video.txt')&&!e.denied)));
adminMission('sudo','Tester le refus hors du groupe','Essaie de créer /srv/regie/test-externe.txt sous l’identité nobody, qui ne fait pas partie du groupe regie.',
 'Le refus confirme que le dossier est protégé contre un compte extérieur.',
 'Reprends le test de création en choisissant nobody comme identité.',
 action('sudo -u nobody touch /srv/regie/test-externe.txt',asUser('touch','nobody',e=>e.p==='/srv/regie/test-externe.txt'&&e.denied)));
adminMission('ps','Inventorier les processus','Avant de lancer la répétition, affiche un instantané détaillé des processus de la régie, y compris ceux des autres comptes.',
 'Un processus est une instance d’un programme en cours d’exécution. Son état apparaît dans la liste.',
 'Cherche dans le manuel de ps la forme qui montre tous les processus avec leurs utilisateurs.',exact('ps','aux'));
adminMission('sleep','Lancer un essai en arrière-plan','Simule une attente de 90 secondes avec sleep en arrière-plan pour que le terminal reste disponible.',
 'Le shell affiche le PID du processus qu’il vient de lancer et rend la main grâce à &.',
 'Place l’opérateur de mise en arrière-plan après la durée.',
 action('sleep 90 &',e=>e.cmd==='sleep'&&e.effect.seconds===90&&e.actor==="etudiant"));
adminMission('kill','Terminer le processus de répétition','Recherche le PID du processus sleep. Termine ensuite ce processus avec le signal par défaut de kill.',
 'Le PID désigne une exécution précise. kill envoie TERM par défaut.',
 'pgrep recherche par nom. Utilise le numéro affiché comme argument de kill.',
 action('pgrep -x sleep',e=>e.cmd==='pgrep'&&e.effect.matches.some(p=>p.actor==="etudiant"&&p.seconds===90)),
 action('kill '+backupPid,e=>e.cmd==='kill'&&e.effect.process?.actor==='etudiant'&&e.effect.process.seconds===90&&e.effect.signal==='TERM'));
adminMission('systemctl','Vérifier l’accès distant','Avant le direct, consulte l’état actuel du service SSH sur le serveur Nexus.',
 'Un service fournit une fonction au système. systemctl status affiche son état et son chargement.',
 'Demande le statut de ssh, avec ou sans le suffixe .service.',
 action('systemctl status ssh',e=>e.cmd==='systemctl'&&e.effect.unit==='ssh.service'&&e.effect.verb==='status'));
adminMission('systemctl','Préparer le service d’export','Démarre le service nexus-export immédiatement. Configure ensuite son activation au démarrage.',
 'start démarre le service maintenant. enable configure le démarrage automatique.',
 'Les deux actions changent la configuration du serveur et demandent sudo.',
 ...['start','enable'].map(verb=>action('sudo systemctl '+verb+' nexus-export',asUser('systemctl','root',e=>e.effect.unit===logService&&e.effect.verb===verb))));
adminMission('journalctl','Lire les derniers événements','Affiche les six derniers événements du journal système pour que je puisse vérifier ce qui vient de se passer.',
 'Le journal horodaté permet de reconstruire la chronologie du direct.',
 'Cherche l’option qui fixe le nombre d’entrées affichées.',
 action('journalctl -n 6',e=>e.cmd==='journalctl'&&e.effect.limit===6&&!e.effect.unit));
adminMission('journalctl','Filtrer le journal du direct','Consulte les événements du service nexus-export pour le démarrage en cours.',
 'Les filtres par unité et par démarrage peuvent se combiner.',
 'Associe l’option de démarrage et celle qui désigne une unité.',
 action('journalctl -b -u nexus-export',e=>e.cmd==='journalctl'&&e.effect.unit===logService&&e.effect.boot));
adminMission('sudo','Préparer l’espace de support','Crée technicien1 et technicien2 ainsi que le groupe support. Ajoute les deux comptes au groupe comme membres secondaires. Crée /srv/support, attribue-le à root:support et accorde rwx au propriétaire et au groupe, avec héritage du groupe et aucun droit aux autres. Vérifie avec ls -ld, crée test.txt sous technicien1, donne au groupe l’écriture sur ce fichier, puis actualise-le sous technicien2. Enfin, vérifie le refus de listage sous nobody. Suis cet ordre.',
 'Le bit setgid du répertoire transmet le groupe support aux nouveaux fichiers. Les droits du fichier permettent ensuite le travail à plusieurs.',
 'Procède dans l’ordre. Pour l’héritage du groupe, ajoute le chiffre du bit setgid devant les trois chiffres des permissions du répertoire.',
 rootAction('sudo adduser technicien1','adduser','technicien1'),
 rootAction('sudo adduser technicien2','adduser','technicien2'),
 rootAction('sudo groupadd support','groupadd','support'),
 ...['technicien1','technicien2'].map(user=>action('sudo usermod -aG support '+user,asUser('usermod','root',e=>e.effect.group==='support'&&e.effect.user===user&&e.effect.append))),
 action('sudo mkdir /srv/support',asUser('mkdir','root',e=>!e.denied&&e.paths.includes('/srv/support'))),
 action('sudo chown root:support /srv/support',asUser('chown','root',e=>e.effect.path==='/srv/support'&&e.effect.owner==='root'&&e.effect.group==='support')),
 action('sudo chmod 2770 /srv/support',asUser('chmod','root',e=>e.effect.path==='/srv/support'&&e.effect.mode===0o2770)),
 action('ls -ld /srv/support',e=>e.cmd==='ls'&&e.p==='/srv/support'&&e.flags.has('l')&&e.flags.has('d')),
 action('sudo -u technicien1 touch /srv/support/test.txt',asUser('touch','technicien1',e=>e.paths.includes('/srv/support/test.txt')&&!e.denied)),
 action('sudo -u technicien1 chmod g+w /srv/support/test.txt',asUser('chmod','technicien1',e=>e.effect.path==='/srv/support/test.txt'&&Boolean(e.effect.mode&0o020))),
 action('sudo -u technicien2 touch /srv/support/test.txt',asUser('touch','technicien2',e=>e.paths.includes('/srv/support/test.txt')&&!e.denied)),
 action('sudo -u nobody ls /srv/support',asUser('ls','nobody',e=>e.p==='/srv/support'&&e.denied)));
adminMission('ls','Repérer les dossiers personnels','Avant de transmettre les accès au support, liste le répertoire qui contient habituellement les dossiers personnels des comptes ordinaires.',
 'Sur Debian, les comptes ordinaires ont généralement leur dossier personnel sous /home.',
 'Cherche le répertoire qui contient déjà etudiant.',inspectPath('ls /home','ls','/home'));
adminMission('ls','Repérer la configuration système','Noah veut repérer les fichiers de configuration du serveur. Liste le répertoire qui les héberge habituellement.',
 '/etc contient la configuration propre au serveur.',
 'Les fichiers passwd et shadow sont dans ce répertoire.',inspectPath('ls /etc','ls','/etc'));
adminMission('pwd','Vérifier sa session de régie','Avant de créer les dossiers des replays, affiche d’abord ton nom d’utilisateur puis le répertoire courant.',
 'whoami identifie le compte effectif. pwd donne le chemin courant.',
 'Demande l’identité, puis le chemin.',exact('whoami'),exact('pwd'));
adminMission('mkdir','Préparer les dossiers des replays','Dans finale, crée en une seule commande replays/bruts, replays/valides et exports. Le parent replays est encore absent.',
 'mkdir accepte plusieurs chemins et -p crée les parents manquants.',
 'Les dossiers bruts et valides sont au même niveau.',
 action('mkdir -p replays/bruts replays/valides exports',e=>e.cmd==='mkdir'&&!e.denied&&[replayRoot+'/bruts',replayRoot+'/valides',exportsDir].every(target=>e.paths.includes(target))));
adminMission('cd','Rejoindre les exports','Entre dans replays/bruts. Depuis ce dossier, rejoins exports avec un chemin relatif.',
 'Deux segments .. remontent de bruts à finale en passant par replays.',
 'Identifie le parent commun des dossiers replays et exports.',
 inspectPath('cd replays/bruts','cd',replayRoot+'/bruts'),
 action('cd ../../exports',e=>e.cmd==='cd'&&e.before===replayRoot+'/bruts'&&e.p===exportsDir&&!e.args[0].startsWith('/')&&!e.args[0].startsWith('~')));
adminMission('head','Vérifier le début des essais','Affiche les huit premières lignes du journal vidéo /var/log/nexus/stream.log.',
 'head lit le début d’un fichier. L’option -n fixe le nombre de lignes.',
 'Le journal est lu par son chemin absolu.',
 action('head -n 8 '+streamLog,e=>e.cmd==='head'&&e.effect.path===streamLog&&e.effect.count===8));
adminMission('tail','Examiner les dernières entrées','Après une coupure, affiche une seule fois les douze dernières lignes de /var/log/nexus/stream.log.',
 'tail affiche les dernières lignes. Le mode de suivi est utile pour observer les nouveaux événements en continu.',
 'Sélectionne un nombre de lignes avec -n.',
 action('tail -n 12 '+streamLog,e=>e.cmd==='tail'&&e.effect.path===streamLog&&e.effect.count===12));
adminMission('grep','Repérer les pertes de signal','Affiche les lignes de /var/log/nexus/stream.log qui contiennent le texte « signal perdu ».',
 'grep affiche les lignes correspondantes. Les guillemets font du texte un seul argument.',
 'Le motif comporte un espace. Pense à l’entourer de guillemets.',
 action('grep "signal perdu" '+streamLog,e=>e.cmd==='grep'&&e.effect.path===streamLog&&e.effect.pattern==='signal perdu'&&Boolean(e.output)));
adminMission('sleep','Lancer le test de secours','Simule une attente de 45 secondes avant la remise à l’antenne. Lance-la en arrière-plan.',
 'Le caractère & rend l’invite disponible pendant l’attente.',
 'Le shell reconnaît & en fin de commande.',
 action('sleep 45 &',e=>e.cmd==='sleep'&&e.effect.seconds===45&&e.actor==="etudiant"));
adminMission('pgrep','Localiser le test de secours','Recherche le PID du processus dont le nom exact est sleep.',
 'pgrep affiche les PID correspondant au motif. -x impose une correspondance exacte.',
 'Précise le nom exact dans l’option de recherche.',
 action('pgrep -x sleep',e=>e.cmd==='pgrep'&&e.effect.exact&&e.effect.matches.some(p=>p.actor==="etudiant"&&p.seconds===45)));
adminMission('kill','Arrêter le test de secours','Le signal vidéo est revenu. Arrête le processus sleep du test avec le signal par défaut.',
 'SIGTERM permet au processus de gérer sa fermeture.',
 'Réutilise le PID affiché. Tu peux relancer la recherche si nécessaire.',
 action('kill '+(backupPid+1),e=>e.cmd==='kill'&&e.effect.process?.actor==='etudiant'&&e.effect.process.seconds===45&&e.effect.signal==='TERM'));
adminMission('systemctl','Relancer les exports','J’ai mis à jour la configuration de nexus-export. Relance le service pour appliquer ce changement.',
 'restart relance le service immédiatement. enable concerne son activation au démarrage.',
 'L’action de relance s’applique au service avec les droits d’administration.',
 action('sudo systemctl restart nexus-export',asUser('systemctl','root',e=>e.effect.unit===logService&&e.effect.verb==='restart')));
adminMission('systemctl','Diagnostiquer la panne d’archivage','Les replays ne sont plus archivés. Consulte l’état de nexus-archive, puis ses journaux pour identifier l’erreur avant d’intervenir.',
 'L’état indique que le service a échoué. Les journaux donnent la cause précise à vérifier avant toute modification.',
 'Inspecte d’abord l’unité, puis filtre les événements du journal sur cette unité.',
 action('systemctl status nexus-archive',e=>e.cmd==='systemctl'&&e.effect.unit===failedService&&e.effect.verb==='status'),
 action('journalctl -u nexus-archive',e=>e.cmd==='journalctl'&&e.effect.unit===failedService));

Object.assign(docs,administrationDocs);
const activityCount=missions.length;
