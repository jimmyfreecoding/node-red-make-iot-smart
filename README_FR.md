# Node-RED Make IoT Smart

## 🌐 Langue

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md) [![中文](https://img.shields.io/badge/lang-中文-red.svg)](README_ZH.md) [![Deutsch](https://img.shields.io/badge/lang-Deutsch-green.svg)](README_DE.md) [![Español](https://img.shields.io/badge/lang-Español-orange.svg)](README_ES.md) [![Français](https://img.shields.io/badge/lang-Français-purple.svg)](README_FR.md) [![日本語](https://img.shields.io/badge/lang-日本語-yellow.svg)](README_JA.md) [![한국어](https://img.shields.io/badge/lang-한국어-pink.svg)](README_KO.md) [![Português](https://img.shields.io/badge/lang-Português-cyan.svg)](README_PT.md) [![Русский](https://img.shields.io/badge/lang-Русский-brown.svg)](README_RU.md) [![繁體中文](https://img.shields.io/badge/lang-繁體中文-lightblue.svg)](README_TW.md)


---

Une extension d'assistant IA spécialement conçue pour Node-RED, rendant le développement IoT plus intelligent et efficace.
[![npm version](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart.svg)](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)
## Aperçu

Node-RED Make IoT Smart est un agent IA complet spécialement conçu pour le développement Node-RED. Il fournit une assistance de code intelligente, une optimisation de flux automatisée et des fonctions de débogage intelligent pour améliorer votre expérience de développement IoT. L'extension prend maintenant en charge six scénarios principaux : apprentissage, solutions, intégration, développement, configuration et gestion.

## Fonctionnalités

### 🤖 Assistant IA

- **Suggestions de Code Intelligentes** : Recommandations de code contextuelles pour les flux Node-RED.
- **Analyse de Flux Intelligente** : Analyse les flux et fournit des suggestions d'optimisation.
- **Interface en Langage Naturel** : Interagit avec l'environnement Node-RED en utilisant des commandes en langage naturel.
- **Support Multilingue** : Prend en charge le chinois, l'anglais, le japonais, le coréen et d'autres langues. Suit les changements de configuration de langue de Node-RED.
- **Support Multi-Fournisseur** : Basé sur le framework LangChain.js, prend en charge OpenAI, Anthropic, Google, DeepSeek et d'autres modèles IA.
- **Gestion de Mémoire Intelligente** : Système de mémoire à court et long terme basé sur SQLite, prend en charge l'historique des conversations, les préférences utilisateur et le stockage de modèles de flux.
- **Prompts Basés sur des Scénarios** : Gestion de prompts basée sur des scénarios configurés en JSON, prend en charge l'injection de paramètres dynamiques.
- **Intégration d'Outils MCP** : Prend en charge les appels d'outils du Protocole de Contexte de Modèle (MCP), étendant les capacités de l'assistant IA.


### 🔧 Outils de Développement

- **Analyse de Code en Temps Réel** : Analyse continue des flux Node-RED.
- **Gestion de Configuration** : Configuration d'API centralisée pour différents fournisseurs IA.
- **Barre Latérale Interactive** : Panneau d'assistant IA dédié intégré dans l'éditeur Node-RED.
- **Éditeur JSON** : Éditeur de fichiers de configuration intégré avec coloration syntaxique.
- **Intégration d'Outils MCP** : Prend en charge les appels d'outils du Protocole de Contexte de Modèle (MCP), étendant les capacités de l'assistant IA.
- **Gestion d'Outils LangChain** : Framework de gestion d'outils unifié, prend en charge les outils intégrés et les outils MCP.
- **Support Basé sur des Scénarios** : Support personnalisé pour sept scénarios principaux :
  - **Apprentissage** : Explique les nœuds et concepts, fournit des flux d'exemple.
  - **Solutions** : Fournit diverses solutions IoT, incluant JSON de flux et guides d'installation de nœuds.
  - **Intégration** : Assiste dans l'intégration de protocoles (ex. MQTT, Modbus) ou logiciels.
  - **Développement** : Optimise les flux existants et le code des nœuds de fonction.
  - **Configuration** : Guide pour modifier les configurations Node-RED (ex. `settings.js`).
  - **Gestion** : Prend en charge l'accès distant, l'intégration Git et le déploiement par lots.

### 🚀 Fonctionnalités à Venir

- **Débogage Distant** : Débogage distant assisté par IA des flux Node-RED.
- **Gestion d'Équipe** : Développement collaboratif avec fonctions de gestion d'équipe.
- **Analyse Avancée** : Insights approfondis sur les performances du système IoT.
- **Déploiement Intelligent** : Stratégies de déploiement d'applications IoT guidées par IA.

## Installation

### Installer depuis npm

```bash
npm install @jhe.zheng/node-red-make-iot-smart
```

### Installer depuis le Gestionnaire de Palette Node-RED

1. Ouvrez l'éditeur Node-RED.
2. Allez dans **Menu → Gérer la palette**.
3. Recherchez `@jhe.zheng/node-red-make-iot-smart`.
4. Cliquez sur **Installer**.
5. Redémarrez Node-RED après l'installation.
6. Après l'installation, vous verrez un nouvel onglet **Assistant IA** dans la barre latérale de Node-RED.
7. Cliquez sur le bouton **Configurer** pour configurer votre fournisseur IA.
8. Sélectionnez parmi les fournisseurs pris en charge :
   - **DeepSeek** : Option rentable avec de fortes capacités de codage.
   - **OpenAI** : Modèles GPT leaders de l'industrie.
   - **Anthropic** : Capacités de raisonnement avancées avec les modèles Claude.
9. Entrez votre clé API et sélectionnez le modèle approprié.
10. Après la configuration, vous pouvez commencer à utiliser l'assistant IA. Notez qu'après avoir sauvegardé la configuration, NodeRED générera automatiquement un nœud de configuration. NodeRED affichera les changements dans le flux, cliquez simplement sur fusionner.
11. Commencez à interagir avec votre assistant IA !

## Démarrage Rapide
### Entrez "Analyser le nœud actuel"
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/current-node.gif" width="800" height="450" alt="Animation de démonstration" />


### Entrez "Créer un flux d'exemple"
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/create-flow.gif" width="800" height="450" alt="Animation de démonstration" />

### Entrez "Vérification de santé"
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/health-check.gif" width="800" height="450" alt="Animation de démonstration" />

## Configuration

### Configuration de Débogage LangSmith (Optionnel)

Pour un meilleur débogage et surveillance de l'exécution LangChain, vous pouvez configurer le support LangSmith :

1. Copiez le fichier `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```

2. Éditez le fichier `.env` et complétez votre configuration LangSmith :
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_api_key_here
   LANGCHAIN_PROJECT=your_project_name
   ```

3. Redémarrez Node-RED pour appliquer la configuration.

4. Visitez [LangSmith](https://smith.langchain.com/) pour voir les informations détaillées de traçage d'exécution et de débogage.

**Note** : La configuration LangSmith est optionnelle et n'affectera pas les fonctions de base.

## Utilisation

### Interface de Chat de Base

- Ouvrez l'onglet de la barre latérale **Assistant IA**.
- Entrez vos questions ou instructions en langage naturel.
- Obtenez des réponses intelligentes avec des suggestions de code et des explications.

### Sélection de Scénarios

- Sélectionnez des scénarios (Apprentissage, Solutions, Intégration, Développement, Configuration, Gestion) via le menu déroulant dans la barre latérale.
- L'IA adapte les réponses basées sur le scénario sélectionné, fournissant des outils pertinents et du JSON de flux.

### Traitement JSON/Code

- Les grandes sorties JSON ou de code sont cachées derrière des boutons **Voir JSON/Code** pour maintenir l'UI propre.
- Éditez le JSON de flux dans l'éditeur intégré avec coloration syntaxique et appliquez les changements directement.

### Scénarios Pris en Charge

#### Résumé des Scénarios

| Scénario | Nom en Français | Description | Outils Pris en Charge |
|----------|-----------------|-------------|------------------------|
| learning | Mode Apprentissage | Assistant d'apprentissage Node-RED, fournit des guides d'enseignement et des réponses de connaissance | get-flows, get-nodes, create-flow, update-flow |
| solution | Mode Solutions | Expert en solutions IoT, fournit des solutions techniques et des conseils d'architecture | create-flow, update-flow, get-flows, create-subflow |
| integration | Mode Intégration | Expert en intégration de systèmes, gère les connexions d'appareils et l'intégration de données | create-flow, update-flow, install-node, get-node-info |
| development | Mode Développement | Assistant de développement de code, aide à écrire et optimiser les flux Node-RED | create-flow, update-flow, create-subflow, get-node-info, install-node, get-flow |
| configuration | Mode Configuration | Expert en configuration de systèmes, gère l'environnement Node-RED et la configuration des nœuds | get_settings, update_settings, install_node, get_node_info, get_diagnostics |
| management | Mode Gestion | Assistant de gestion de projets, aide avec l'organisation des flux et la planification de projets | get-flows, create-flow, update-flow, create-subflow |
| general | Mode Général | Assistant IA général, gère diverses questions liées à Node-RED | Aucune restriction d'outils spécifique |

#### Exemples de Prompts Prédéfinis

| Scénario | Prompts Prédéfinis |
|----------|--------------------|
| **Mode Apprentissage** | • Je suis nouveau sur Node-RED, veuillez présenter les concepts de base et les fonctions principales de Node-RED<br>• Veuillez expliquer ce que sont les flux, nœuds et connexions dans Node-RED<br>• Comment créer mon premier flux simple dans Node-RED ? Veuillez fournir des étapes détaillées<br>• Quels sont les nœuds principaux couramment utilisés dans Node-RED ? Quelles sont leurs fonctions respectives ? |
| **Mode Solutions** | • J'ai besoin de concevoir un système de contrôle de maison intelligente, veuillez fournir une architecture complète de solution IoT<br>• Comment construire un système de collecte et surveillance de données Industrie 4.0 en utilisant Node-RED ?<br>• Veuillez concevoir une solution IoT agricole, incluant la collecte de données de capteurs et le contrôle automatisé<br>• Je veux construire un réseau de surveillance environnementale de ville intelligente, quelle solution technique est nécessaire ? |
| **Mode Intégration** | • Comment intégrer les appareils MQTT et les APIs HTTP dans Node-RED ? Veuillez fournir une solution d'intégration détaillée<br>• J'ai besoin d'envoyer des données de capteurs depuis des appareils Modbus vers une base de données cloud, comment l'implémenter ?<br>• Veuillez m'aider à concevoir un flux de transformation de données qui convertit JSON en XML et l'envoie à un système tiers<br>• Comment implémenter la collecte et le traitement unifiés de données pour plusieurs appareils avec différents protocoles dans Node-RED ? |
| **Mode Développement** | • Explication détaillée et description du flux actuel<br>• Explication détaillée et description du nœud actuel<br>• Veuillez m'aider à écrire du code de nœud Function qui implémente le filtrage de données et la conversion de format<br>• Comment créer un nœud personnalisé dans Node-RED ? Veuillez fournir des étapes complètes de développement |
| **Mode Configuration** | • Comment est la configuration actuelle de NodeRed ?<br>• Comment est le diagnostic actuel de NodeRed ?<br>• Comment configurer les paramètres de sécurité de Node-RED, incluant l'authentification utilisateur et HTTPS ?<br>• Veuillez m'aider à optimiser la configuration de performance de Node-RED et améliorer l'efficacité d'exécution du système<br>• Comment installer et gérer les packages de nœuds tiers dans Node-RED ?<br>• J'ai besoin de configurer la journalisation et la surveillance pour Node-RED, comment dois-je le configurer ? |
| **Mode Gestion** | • Veuillez m'aider à créer un plan de développement et des jalons pour un projet IoT<br>• Comment organiser et gérer la structure de flux de grands projets dans Node-RED ?<br>• J'ai besoin d'évaluer les risques et la qualité du projet actuel, veuillez fournir des recommandations d'analyse<br>• Comment établir des standards de développement Node-RED de collaboration d'équipe et des meilleures pratiques ? |
| **Mode Général** | • Qu'est-ce que Node-RED ? Quelles sont ses caractéristiques principales et ses scénarios d'application ?<br>• J'ai un problème avec Node-RED, veuillez m'aider avec l'analyse et la solution<br>• Veuillez recommander quelques ressources d'apprentissage Node-RED et meilleures pratiques<br>• Comment sélectionner le mode de scénario Node-RED approprié pour résoudre mes besoins spécifiques ? |

#### Activation Intelligente par Mots-Clés

| Scénario | Mots-Clés | Comportement d'Activation |
|----------|-----------|---------------------------|
| **Mode Développement** | créer flux, générer flux, créer flux, nouveau flux | Basculement automatique vers le mode développement, génère du code JSON complet de flux Node-RED et fournit des explications détaillées |
| **Mode Configuration** | configuration actuelle, configuration système, informations de configuration, configurations, configurations actuelles | Appel automatique de l'outil get_settings pour obtenir les informations de configuration et afficher en format tableau |
| **Mode Configuration** | diagnostic actuel, diagnostic système, informations de diagnostic, vérification de santé | Appel automatique de l'outil get_diagnostics pour le diagnostic système |

#### Paramètres d'Entrée Dynamiques

Tous les scénarios prennent en charge l'injection de paramètres dynamiques suivante :
- `nodeRedVersion` - Informations de version Node-RED
- `nodeVersion` - Informations de version Node.js  
- `currentTime` - Horodatage actuel
- `selectedFlow` - Flux actuellement sélectionné
- `selectedNodes` - Nœuds actuellement sélectionnés
- `lang` - Paramètre de langue actuel
- `mcpTools` - Liste des outils MCP disponibles

Chaque scénario prend également en charge des paramètres dynamiques spécifiques :
- **Mode Apprentissage** : `userLevel` (niveau de compétence utilisateur)
- **Mode Solutions** : `projectRequirements` (exigences du projet)
- **Mode Intégration** : `integrationTargets` (objectifs d'intégration)
- **Mode Développement** : `developmentTask` (tâche de développement)
- **Mode Configuration** : `configurationNeeds` (besoins de configuration)
- **Mode Gestion** : `projectStatus` (statut du projet)

#### Caractéristiques des Prompts Système

Chaque scénario est configuré avec des prompts système spécialisés pour s'assurer que l'assistant IA puisse :
1. **Positionnement de Rôle** : Rôle professionnel clair dans des scénarios spécifiques
2. **Format de Sortie** : Formats de réponse structurés basés sur les exigences de scénario
3. **Intégration d'Outils** : Appel intelligent des outils MCP correspondants et des APIs Node-RED
4. **Conscience du Contexte** : Utilisation de paramètres dynamiques pour des recommandations personnalisées


| Scénario | Description                                                                    |
| --------- | ------------------------------------------------------------------------------ |
| Apprentissage | Explique les nœuds/concepts et fournit des flux d'exemple pour apprendre.        |
| Solutions | Fournit diverses solutions IoT avec JSON de flux et guides d'installation de nœuds. |
| Intégration | Assiste dans l'intégration de protocoles/logiciels, génère des flux correspondants. |
| Développement | Optimise les flux existants et le code des nœuds de fonction.                      |
| Configuration | Guide pour modifier les configurations Node-RED (ex. `settings.js`).          |
| Gestion | Prend en charge l'accès distant, l'intégration Git et le déploiement par lots.                 |

## Fournisseurs IA Pris en Charge


| Fournisseur | Modèles                                 | Caractéristiques                |
| --------- | --------------------------------------- | ------------------------------ |
| OpenAI    | GPT-3.5, GPT-4, GPT-4o                 | Usage général, large compatibilité |
| Anthropic | Claude-3, Claude-3.5                    | Raisonnement avancé, axé sur la sécurité |
| Google    | Gemini Pro, Gemini Flash                | Multimodal, haute performance   |
| DeepSeek  | deepseek-chat, deepseek-coder           | Rentable, axé sur le codage |
| Autres     | Tous les fournisseurs LLM pris en charge par LangChain.js | Haute extensibilité, configuration flexible |

## Configuration API

- Les clés API sont stockées localement et chiffrées.
- Prend en charge les configurations de plusieurs fournisseurs.
- Basculement facile entre différents fournisseurs et modèles.
- Configurations de modèles séparées pour les phases de planification et d'exécution.

## Développement

### Structure du Projet

```
├── ai-sidebar.html          # Interface principale de barre latérale
├── ai-sidebar-config.json   # Configuration UI
├── make-iot-smart.html      # Modèle de configuration de nœud
├── make-iot-smart.js        # Implémentation de nœud backend
├── lib/
│   ├── langchain-manager.js # Gestionnaire principal LangChain
│   ├── memory-manager.js    # Gestion de mémoire SQLite
│   └── scenario-manager.js  # Gestion de prompts basés sur des scénarios
├── config/
│   └── scenarios.json       # Fichier de configuration de scénarios
├── data/
│   └── memory.db           # Fichier de base de données SQLite
└── package.json            # Configuration de package
```

### Architecture Technique

Ce projet est basé sur le framework **LangChain.js** et utilise une conception d'architecture modulaire :

- **LangChain Manager** : Gestion principale des modèles IA, prend en charge plusieurs fournisseurs LLM
- **Memory Manager** : Système de mémoire intelligent basé sur SQLite, prend en charge la mémoire à court et long terme
- **Scenario Manager** : Gestion de prompts basée sur des scénarios, prend en charge la configuration JSON et les paramètres dynamiques
- **Tool Manager** : Framework de gestion d'outils unifié, intègre les outils MCP et les outils intégrés
- **API Layer** : Interface API RESTful, prend en charge le chat en streaming et l'exécution d'outils

### Contribuer

1. Forker le dépôt.
2. Créer une branche de fonctionnalité.
3. Effectuer les changements et commiter.
4. Soumettre une pull request.

## Feuille de Route

### Phase 1 (Terminée)

- ✅ Intégration d'assistant IA
- ✅ Support multi-fournisseur
- ✅ Barre latérale interactive
- ✅ Gestion de configuration
- ✅ Support basé sur des scénarios
- ✅ Migration d'architecture LangChain.js
- ✅ Système de gestion de mémoire SQLite
- ✅ Intégration d'outils MCP
- ✅ Framework de gestion d'outils unifié

### Phase 2 (À Venir)

- 🔄 Fonctions de débogage distant
- 🔄 Fonctions de collaboration d'équipe
- 🔄 Analyse avancée de flux
- 🔄 Outils de déploiement intelligent

### Phase 3 (Futur)

- 📋 Système de gestion d'équipe
- 📋 Fonctionnalités d'entreprise
- 📋 Options de sécurité avancées
- 📋 Entraînement de modèles personnalisés

## Exigences Système

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## Licence

Licencié sous la Licence MIT. Voir le fichier [LICENSE](LICENSE) pour les détails.

## Support
Le développement IA est plus un art qu'une technique, maîtriser les LLMs n'est pas une tâche simple et nécessite une compréhension approfondie des modèles IA, des données et des scénarios d'application. Chaque session de questions-réponses peut produire des résultats différents, les versions initiales ne sont souvent pas satisfaisantes, mais avec l'amélioration de l'ingénierie des prompts, cela satisfera progressivement les besoins quotidiens des utilisateurs Node-RED, qu'ils soient ingénieurs IT ou OT. Nous accueillons plus de personnes intéressées pour rejoindre le projet.
- **Retour de Problèmes** : [GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **Documentation** : [Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **Discussion** : [GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## Auteur

**Zheng He**
- Email : jhe.zheng@gmail.com
- GitHub : [@jimmyfreecoding](https://github.com/jimmyfreecoding)
- Site Web : [https://www.makeiotsmart.com](https://www.makeiotsmart.com)
---

*Rendez l'assistance alimentée par IA pour rendre votre développement IoT plus intelligent !*

---