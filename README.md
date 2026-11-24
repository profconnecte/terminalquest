# Terminal Quest

Application pédagogique en français, sans installation de dépendances. Ouvrir `index.html` ou lancer `node server.cjs` puis visiter http://127.0.0.1:8080. Avec Laragon, le dossier peut également être servi directement.

## Déploiement Docker

Le workflow GitHub Actions publie `ghcr.io/profconnecte/terminalquest:latest` à chaque modification de `main`, ainsi que des images identifiées par SHA et par tag Git `v*`. Une première publication GHCR est privée par défaut. Si le paquet existe déjà, vérifier sa visibilité dans ses paramètres GitHub et la régler sur **Private** si nécessaire ; le workflow ne modifie pas la visibilité d'un paquet existant.

Sur l'hôte Docker, placer `compose.yaml` dans `/opt/terminalquest`. Pour une image privée, s'authentifier avec un compte ayant accès au paquet et un jeton GitHub classique doté de `read:packages` :

```sh
docker login ghcr.io -u VOTRE_IDENTIFIANT
cd /opt/terminalquest
docker compose pull
docker compose up -d
```

Le mot de passe demandé par Docker est le jeton GitHub. Avec Dockhand, utiliser ce fichier Compose comme stack et configurer l'accès au registre privé GHCR avec les mêmes identifiants. L'application est ensuite accessible sur `http://ADRESSE_DU_SERVEUR:8004`. Pour une mise à jour, relancer `docker compose pull` puis `docker compose up -d`.

Le fichier Compose reste sur l'hôte dans `/opt/terminalquest` ; l'application ne produit actuellement aucun fichier persistant côté serveur et ne nécessite donc pas de volume. La progression, les fichiers simulés et le thème restent dans le stockage local de chaque navigateur, liés à l'adresse utilisée : ils ne sont pas sauvegardés dans `/opt/terminalquest` et ne sont pas partagés entre appareils ou navigateurs.

36 défis dans les coulisses du tournoi d’e-sport fictif Nexus Invitational couvrent man, pwd, ls, cd, cat, mkdir, touch, echo, cp, mv et rm. Chaque défi explique une notion et valide une action réelle dans le système de fichiers virtuel. Progression séquentielle, messages du staff, deux niveaux d’aide sans solution complète, historique et complétion. La progression et les fichiers sont sauvegardés localement dans le navigateur. Ce parcours utilise une sauvegarde distincte de l’ancienne version à onze missions.

Après les 36 défis, 34 missions d’administration prolongent le scénario Nexus. Laura et Noah confient des tâches sur les comptes, les groupes, les permissions, les processus, les services et les journaux du serveur fictif. Les missions se valident dans le même terminal, parfois en plusieurs commandes. Le fichier `reponses.txt` donne les commandes attendues pour les 70 missions.

Les défis couvrent options et arguments, `ls -a`, `ls -l`, les options combinées `-la`, les propriétaires et les colonnes détaillées, chemins absolus et relatifs, `.`, `..`, `~`, `cat -n`, `mkdir -p`, plusieurs arguments à `touch` et `cat`, `touch -c`, `echo -n`, `>` et `>>`, copies et déplacements vers le dossier courant, parent ou un autre dossier, renommage, `cp -r`, `rm -d` et `rm -r`. Les manuels documentent aussi `cp -n` et `mv -n`, qui sont simulés. Une option inconnue produit une erreur. Les métadonnées de `ls -l` et les dates sont simulées ; le propriétaire ne prouve pas qui a créé le fichier.

Cette version est autonome. Les commandes agissent sur les fichiers, les comptes, les processus et les services fictifs du navigateur. Les processus `sleep` servent aux exercices de recherche et de signalement. Ils restent dans la simulation jusqu’à leur arrêt ou la restauration de l’environnement. Le changement de mot de passe utilise une empreinte fictive. `help`, `man` et la boîte à commandes donnent accès aux commandes prises en charge.

Vérifications : `node --check app.js` et `node test.cjs`.

Toutes les étapes sont accessibles depuis la feuille de route. Ouvrir une autre mission charge son environnement de départ. La validation ouvre automatiquement la mission suivante. Le bouton ↻ à droite de la discussion d’équipe restaure les prérequis de la mission et efface sa validation et ses aides éventuelles. Les validations des autres missions sont conservées. Lors de la mise à jour depuis la version à QCM, les 36 défis du terminal déjà validés restent acquis et les missions d’administration sont à réaliser dans le nouveau format.

Deux thèmes (clair et sombre) sont disponibles dans l’en-tête ; le choix est mémorisé indépendamment de la progression. Sans préférence enregistrée, le thème suit la préférence système lors du chargement. Le thème clair s’applique aussi au terminal.

Tab complète un nom ou le préfixe commun ; un second appui affiche les possibilités dans le terminal. La complétion distingue fichiers et dossiers, prend en charge les chemins relatifs, absolus et `~/`, et masque les noms cachés sauf si le préfixe commence par un point. Pour `cd`, seuls les dossiers sont proposés. Les noms avec espaces peuvent être complétés entre guillemets.

Les dates de `ls -l` utilisent le format français et le fuseau `Europe/Paris`, avec changement automatique entre heure d’hiver et heure d’été. Les fiches `man` sont des manuels pédagogiques abrégés décrivant le sous-ensemble simulé, et non les pages Linux complètes.
