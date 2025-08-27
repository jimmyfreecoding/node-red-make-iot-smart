# Tests End-to-End LangChain

Ce répertoire contient des scripts complets de tests end-to-end de l'architecture LangChain pour vérifier l'ensemble du processus depuis la saisie utilisateur frontend jusqu'à la réponse LLM.

## 📁 Structure des Fichiers

```
test/
├── end-to-end-langchain-test.js    # Script principal de tests
├── run-e2e-test.js                 # Script d'exécution des tests
├── .env.example                    # Exemple de configuration d'environnement
├── .env                           # Configuration réelle de l'environnement (à créer)
├── test-results/                  # Répertoire des résultats de tests
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # Ce document
```

## 🚀 Démarrage Rapide

### 1. Configuration de l'Environnement

Avant la première exécution, vous devez configurer les variables d'environnement :

```bash
# Copier l'exemple de configuration d'environnement
cp .env.example .env

# Éditer le fichier .env pour effectuer les configurations nécessaires
# Particulièrement OPENAI_API_KEY (si vous testez des appels LLM réels)
```

### 2. Exécuter les Tests

```bash
# Exécuter des tests end-to-end complets
node run-e2e-test.js

# Vérifier uniquement la configuration de l'environnement
node run-e2e-test.js --check

# Activer les appels LLM réels (nécessite une clé API valide)
node run-e2e-test.js --real-llm

# Spécifier le port du serveur web
node run-e2e-test.js --port 8080

# Mode de sortie détaillée
node run-e2e-test.js --verbose
```

### 3. Visualiser le Rapport de Tests

Après avoir terminé les tests, un serveur web sera automatiquement démarré pour afficher le rapport de tests :

- URL d'accès par défaut : http://localhost:3001
- Point de terminaison API : http://localhost:3001/api/test-results

## 📊 Contenu des Tests

### Langues de Test

Les tests couvrent les 7 langues suivantes :
- Chinois (zh-CN)
- Anglais (en-US) 
- Japonais (ja)
- Coréen (ko)
- Espagnol (es-ES)
- Portugais (pt-BR)
- Français (fr)

### Cas de Test

Chaque langue inclut 5 cas de test :

1. **Déclencheur d'outil get-flow** - Test du mot-clé "flux actuel"
2. **Déclencheur d'outil get-node-info** - Test du mot-clé "nœud actuel"
3. **Déclencheur d'outil get-settings** - Test du mot-clé "configuration actuelle"
4. **Déclencheur d'outil get-diagnostics** - Test du mot-clé "diagnostic actuel"
5. **Conversation en langage naturel** - Test "Présenter Node-RED" (sans déclencheur d'outil)

### Informations Importantes Enregistrées

Chaque cas de test enregistre les informations suivantes :

- **a. Texte de saisie utilisateur** - Texte original simulé que l'utilisateur a saisi sur la page
- **b. Mot-clé détecté** - Mot-clé que LangChain a reçu et identifié
- **c. Détermination d'appel d'outil** - Décision du système d'appeler un outil
- **d. Type d'outil et contenu de retour** - Outil spécifique appelé et son résultat de retour
- **e. Prompt newHuman concaténé envoyé au LLM** - Prompt final de l'utilisateur envoyé au LLM
- **f. Prompt système envoyé au LLM** - Prompt au niveau système
- **g. Réponse LLM** - Résultat de réponse du modèle de langage large

## 🔧 Explication des Variables d'Environnement

### Configuration Requise

```bash
# Clé API OpenAI (pour les appels LLM réels)
OPENAI_API_KEY=your_openai_api_key_here

# Simulation de l'environnement Node-RED
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### Configuration Optionnelle

```bash
# Configuration du fournisseur LLM
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# Port du serveur web
TEST_WEB_PORT=3001

# Activer les appels LLM réels
ENABLE_REAL_LLM_CALLS=false

# Configuration de débogage
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 Rapport de Tests

### Rapport Web

Le rapport HTML généré après avoir terminé les tests inclut :

- **Résumé des tests** - Informations statistiques générales
- **Tableaux par langue** - Résultats détaillés des tests pour chaque langue
- **Affichage du statut** - Statut succès/échec
- **Design responsive** - Adaptation à différentes tailles d'écran

### Données JSON

Les données de test brutes sont sauvegardées au format JSON et peuvent être utilisées pour :

- Analyse automatisée
- Intégration dans les pipelines CI/CD
- Génération de rapports personnalisés

## 🛠️ Architecture Technique

### Processus de Test

1. **Initialisation de l'environnement** - Vérification de la configuration, des dépendances et des variables d'environnement
2. **Simulation du frontend** - Simulation de la saisie utilisateur et de la détection de mots-clés
3. **Traitement du backend** - Appel au LangChain Manager pour traiter les demandes
4. **Exécution d'outils** - Simulation ou exécution réelle d'outils liés
5. **Interaction LLM** - Construction de prompts et obtention de réponses LLM
6. **Enregistrement des résultats** - Sauvegarde d'informations complètes de la chaîne de traitement
7. **Génération de rapports** - Génération de rapports web et de données JSON

### Composants de Simulation

- **Mock Node-RED** - Simulation de l'environnement d'exécution Node-RED
- **Mock Tools** - Simulation des résultats d'exécution d'outils
- **Mock LLM** - Simulation optionnelle des réponses LLM

## 🔍 Dépannage

### Problèmes Courants

1. **Variables d'environnement non configurées**
   ```bash
   # Vérifier si le fichier .env existe et est configuré correctement
   node run-e2e-test.js --check
   ```

2. **Dépendances manquantes**
   ```bash
   # Installer les dépendances nécessaires
   npm install express dotenv
   ```

3. **Clé API invalide**
   ```bash
   # Tester en mode simulation
   node run-e2e-test.js
   # Ou configurer ENABLE_REAL_LLM_CALLS=false
   ```

4. **Port en cours d'utilisation**
   ```bash
   # Spécifier un autre port
   node run-e2e-test.js --port 8080
   ```

### Mode Débogage

```bash
# Activer la sortie détaillée
node run-e2e-test.js --verbose

# Ou configurer dans .env
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 Développement d'Extensions

### Ajouter une Nouvelle Langue

1. Ajouter le code de langue à `TEST_CONFIG.languages`
2. Ajouter les cas de test correspondants à `TEST_CONFIG.testCases`
3. Vérifier que le fichier de configuration de langue correspondant existe

### Ajouter un Nouveau Cas de Test

```javascript
// Ajouter aux cas de test de la langue correspondante
{ 
    keyword: 'nouveau mot-clé', 
    expectedTool: 'new-tool', 
    description: 'description du nouveau cas de test' 
}
```

### Simulation d'Outils Personnalisés

Ajouter les résultats de simulation de nouveaux outils à l'objet `mockToolResults` dans la fonction `executeTestCase`.

## 📄 Licence

Ce script de test suit la même licence que le projet principal.

## 🤝 Contribution

Nous accueillons les Issues et Pull Requests pour améliorer le script de test !

---

**Note** : Ce script de test est basé sur la conception d'architecture décrite dans le document `LANGCHAIN_ARCHITECTURE.md` et assure la couverture de test du processus complet d'interaction utilisateur.