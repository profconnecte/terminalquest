# Terminal Quest

Application pédagogique en français, sans installation de dépendances. Ouvrir `index.html` ou lancer `node server.cjs` puis visiter http://127.0.0.1:8080. Avec Laragon, le dossier peut également être servi directement.

36 défis dans les coulisses du tournoi d’e-sport fictif Nexus Invitational couvrent man, pwd, ls, cd, cat, mkdir, touch, echo, cp, mv et rm. Chaque défi explique une notion et valide une action réelle dans le système de fichiers virtuel. Progression séquentielle, messages du staff, deux niveaux d’aide sans solution complète, historique et complétion. La progression et les fichiers sont sauvegardés localement dans le navigateur. Ce parcours utilise une sauvegarde distincte de l’ancienne version à onze missions.

Après les 36 défis, 34 missions d’administration prolongent le scénario Nexus. Laura et Noah confient des tâches sur les comptes, les groupes, les permissions, les processus, les services et les journaux du serveur fictif. Les missions se valident dans le même terminal, parfois en plusieurs commandes. Le fichier `reponses.txt` donne les commandes attendues pour les 70 missions.

Les défis couvrent options et arguments, `ls -a`, `ls -l`, les options combinées `-la`, les propriétaires et les colonnes détaillées, chemins absolus et relatifs, `.`, `..`, `~`, `cat -n`, `mkdir -p`, plusieurs arguments à `touch` et `cat`, `touch -c`, `echo -n`, `>` et `>>`, copies et déplacements vers le dossier courant, parent ou un autre dossier, renommage, `cp -r`, `rm -d` et `rm -r`. Les manuels documentent aussi `cp -n` et `mv -n`, qui sont simulés. Une option inconnue produit une erreur. Les métadonnées de `ls -l` et les dates sont simulées ; le propriétaire ne prouve pas qui a créé le fichier.

Cette version est autonome. Les commandes agissent sur les fichiers, les comptes, les processus et les services fictifs du navigateur. Les processus `sleep` servent aux exercices de recherche et de signalement. Ils restent dans la simulation jusqu’à leur arrêt ou la restauration de l’environnement. Le changement de mot de passe utilise une empreinte fictive. `help`, `man` et la boîte à commandes donnent accès aux commandes prises en charge.

Vérifications : `node --check app.js` et `node test.cjs`.

Toutes les étapes sont accessibles depuis la feuille de route. Ouvrir une autre mission charge son environnement de départ. La validation ouvre automatiquement la mission suivante. Le bouton ↻ à droite de la discussion d’équipe restaure les prérequis de la mission et efface sa validation et ses aides éventuelles. Les validations des autres missions sont conservées. Lors de la mise à jour depuis la version à QCM, les 36 défis du terminal déjà validés restent acquis et les missions d’administration sont à réaliser dans le nouveau format.

Deux thèmes (clair et sombre) sont disponibles dans l’en-tête ; le choix est mémorisé indépendamment de la progression. Sans préférence enregistrée, le thème suit la préférence système lors du chargement. Le thème clair s’applique aussi au terminal.

Tab complète un nom ou le préfixe commun ; un second appui affiche les possibilités dans le terminal. La complétion distingue fichiers et dossiers, prend en charge les chemins relatifs, absolus et `~/`, et masque les noms cachés sauf si le préfixe commence par un point. Pour `cd`, seuls les dossiers sont proposés. Les noms avec espaces peuvent être complétés entre guillemets.

Les dates de `ls -l` utilisent le format français et le fuseau `Europe/Paris`, avec changement automatique entre heure d’hiver et heure d’été. Les fiches `man` sont des manuels pédagogiques abrégés décrivant le sous-ensemble simulé, et non les pages Linux complètes.
