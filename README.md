# Terminal Quest

Application pédagogique en français, sans installation de dépendances. Ouvrir `index.html` ou lancer `node server.cjs` puis visiter http://127.0.0.1:8080. Avec Laragon, le dossier peut également être servi directement.

36 défis dans les coulisses du tournoi d’e-sport fictif Nexus Invitational couvrent man, pwd, ls, cd, cat, mkdir, touch, echo, cp, mv et rm. Chaque défi explique une notion et valide une action réelle dans le système de fichiers virtuel. Progression séquentielle, messages du staff, deux niveaux d’aide sans solution complète, historique et complétion. La progression et les fichiers sont sauvegardés localement dans le navigateur. Ce parcours utilise une sauvegarde distincte de l’ancienne version à onze missions.

Les défis couvrent options et arguments, `ls -a`, `ls -l`, les options combinées `-la`, les propriétaires et les colonnes détaillées, chemins absolus et relatifs, `.`, `..`, `~`, `cat -n`, `mkdir -p`, plusieurs arguments à `touch` et `cat`, `touch -c`, `echo -n`, `>` et `>>`, copies et déplacements vers le dossier courant, parent ou un autre dossier, renommage, `cp -r`, `rm -d` et `rm -r`. Les manuels documentent aussi `cp -n` et `mv -n`, qui sont simulés. Une option inconnue produit une erreur. Les métadonnées de `ls -l` et les dates sont simulées ; le propriétaire ne prouve pas qui a créé le fichier.

Cette version est autonome : aucun compte étudiant ni suivi enseignant centralisé. Elle simule un sous-ensemble des commandes Linux, sans exécuter de commandes sur le serveur. `help` affiche les commandes disponibles. Les polices Google sont facultatives, avec polices système de secours.

Vérifications : `node --check app.js` et `node test.cjs`.

Deux thèmes (clair et sombre) sont disponibles dans l’en-tête ; le choix est mémorisé indépendamment de la progression. Sans préférence enregistrée, le thème suit la préférence système lors du chargement. Le thème clair s’applique aussi au terminal.

Tab complète un nom ou le préfixe commun ; un second appui affiche les possibilités dans le terminal. La complétion distingue fichiers et dossiers, prend en charge les chemins relatifs, absolus et `~/`, et masque les noms cachés sauf si le préfixe commence par un point. Pour `cd`, seuls les dossiers sont proposés. Les noms avec espaces peuvent être complétés entre guillemets.

Les dates de `ls -l` utilisent le format français et le fuseau `Europe/Paris`, avec changement automatique entre heure d’hiver et heure d’été. Les fiches `man` sont des manuels pédagogiques abrégés décrivant le sous-ensemble simulé, et non les pages Linux complètes.
