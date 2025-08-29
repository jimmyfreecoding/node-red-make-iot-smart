# Documentation d'Architecture LangChain

## Vue d'ensemble

Ce projet construit un système d'assistant IA intelligent Node-RED basé sur le framework LangChain.js, adoptant une conception d'architecture modulaire qui prend en charge les fonctionnalités de conversation intelligente multi-langues, multi-scénarios et multi-outils. Le système fournit un support professionnel pour le développement Node-RED grâce à la détection de mots-clés en frontend, aux appels d'outils en backend et au traitement de réponse en streaming.

## Diagramme d'Architecture Générale

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Services      │
│       UI        │    │   Traitement     │    │   Externes      │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Saisie      │ │    │ │ Routes HTTP  │ │    │ │ Fournisseurs│ │
│ │ Utilisateur │ │    │ └──────────────┘ │    │ │ LLM         │ │
│ └─────────────┘ │    │        │         │    │ │ (OpenAI,etc)│ │
│        │        │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ Détection   │ │    │ │ Manager      │ │    │ │ Serveur     │ │
│ │ Mots-clés   │ │    │ └──────────────┘ │    │ │ Outils      │ │
│ └─────────────┘ │    │        │         │    │ │ MCP         │ │
│        │        │    │        │         │    │ └─────────────┘ │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ Construction│ │────┼────────┼─────────┼────┤                 │
│ │ Messages    │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Gestionnaire │ │    │                 │
│ │ Traitement  │ │    │ │ Outils       │ │    │                 │
│ │ Réponse     │ │    │ └──────────────┘ │    │                 │
│ │ Streaming   │ │    │        │         │    │                 │
│ └─────────────┘ │    │ ┌──────────────┐ │    │                 │
└─────────────────┘    │ │ Gestionnaire │ │    │                 │
                       │ │ Mémoire      │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Vue d'ensemble du Processus End-to-End

### Diagramme de Flux du Processus

```
Saisie de Texte Utilisateur
     │
     ▼
Détection Mots-clés Frontend ──────┐
     │                              │
     ▼                              ▼
Construction Prompt Humain Caché   Obtenir Configuration Scénario
     │                              │
     ▼                              │
Envoi Requête HTTP ◄───────────────┘
     │
     ▼
Gestionnaire LangChain
     │
     ▼
Détection Déclencheur Outils ──────┐
     │                              │
     ▼                              ▼
Sélection Mode Exécution           Détermination Type Outil
     │                              │
     ├──────────────────────────────┼─── Outils Intégrés
     │                              │
     │                              └─── Outils MCP
     ▼
Exécution Outils et Fusion Résultats
     │
     ▼
Composition Nouveau Prompt Humain
     │
     ▼
Appel LLM (Langue Spécifiée)
     │
     ▼
Retour Réponse Streaming
```

## Détails des Composants Principaux

### 1. Système de Détection de Mots-clés Frontend

#### Source de Configuration
Le frontend obtient la configuration des mots-clés via l'API suivante :
```javascript
// Obtenir la configuration de scénario pour la langue actuelle
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### Logique de Détection
Localisée dans la fonction `detectKeywords` dans `ai-sidebar.html` :

```javascript
async function detectKeywords(message) {
    // 1. Obtenir la configuration de langue actuelle
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. Itérer toutes les configurations de mots-clés de scénarios
    const scenarios = data.scenarios || data;
    const lowerMessage = message.toLowerCase();
    
    for (const [scenarioKey, scenarioConfig] of Object.entries(scenarios)) {
        if (scenarioConfig.keywords) {
            for (const keywordConfig of scenarioConfig.keywords) {
                for (const keyword of keywordConfig.key) {
                    if (lowerMessage.includes(keyword.toLowerCase())) {
                        return {
                            scenario: keywordConfig.scenario,
                            newHumanPrompt: keywordConfig.newHumanPrompt,
                            matchedKeyword: keyword
                        };
                    }
                }
            }
        }
    }
    return null;
}
```

#### Traitement de Mots-clés Spéciaux
Le système effectue un traitement spécial pour des mots-clés spécifiques :

1. **"current flow" / "flux actuel"** :
   - Bascule automatiquement vers le scénario `development`
   - Construit un prompt pour appeler l'outil `get-flow`
   - Passe l'ID du flux actuellement sélectionné

2. **"current node" / "nœud actuel"** :
   - Bascule automatiquement vers le scénario `development`
   - Construit un prompt pour appeler l'outil `get-node-info`
   - Passe les informations détaillées du nœud sélectionné

### 2. Gestionnaire LangChain (`lib/langchain-manager.js`)

#### Responsabilités Principales
- Gestion des fournisseurs LLM (OpenAI, DeepSeek, Anthropic, Google)
- Coordination des appels d'outils
- Gestion des scénarios
- Traitement de réponse streaming
- Intégration de gestion de mémoire

#### Méthodes Principales

```javascript
class LangChainManager {
    constructor() {
        this.memoryManager = null;
        this.mcpClient = null;
        this.llmInstances = new Map();
        this.tools = new Map();
        this.scenarios = {};
        this.agents = new Map();
        this.language = 'zh-CN';
    }
    
    // Détection de déclencheurs d'outils
    detectToolTrigger(message)
    
    // Détermination de mode forcé d'outils
    shouldForceToolMode(message, scenario, dynamicData)
    
    // Chat streaming LLM pur
    executePureLLMChatStream(message, options, onChunk)
    
    // Chat streaming basé sur scénarios
    executeScenarioChatStream(message, options, onChunk)
}
```

#### Mécanisme de Détection de Déclencheurs d'Outils

1. **Format d'appel direct d'outils** :
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **Déclencheur par mots-clés** :
   - Détection via la méthode `shouldForceToolMode`
   - Basé sur le mappage de mots-clés de configuration multi-langues
   - Support pour l'extraction de paramètres et l'inférence d'outils

### 3. Système de Gestion d'Outils

#### Classification des Outils

**Outils Intégrés** :
- `search_memory` : Recherche en mémoire
- `get_user_preferences` : Obtenir les préférences utilisateur
- `get_flow_templates` : Obtenir les modèles de flux
- `get-flow` : Obtenir les données de flux Node-RED (accès direct à `global.RED`)
- `get-node-info` : Obtenir les informations de nœud Node-RED (accès direct à `global.RED`)

**Outils MCP** :
- `get-settings` : Obtenir la configuration Node-RED
- `get-diagnostics` : Obtenir les informations de diagnostic
- Autres outils fournis via le protocole MCP

#### Logique de Sélection d'Outils

```javascript
// Exécution directe d'outils spéciaux
if (toolName === 'get-node-info') {
    // Utilisation directe de l'API Node-RED
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // Construction de paramètres MCP
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // Autres outils utilisent les paramètres fournis
    mcpArgs = toolTrigger.args;
}
```

### 4. Système de Gestion de Mémoire (`lib/memory-manager.js`)

#### Structure de Base de Données

```sql
-- Mémoire à court terme (historique de session)
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mémoire à long terme (préférences utilisateur, base de connaissances)
CREATE TABLE long_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Mécanisme de Récupération de Mémoire
- Récupération de contexte basée sur l'ID de session
- Recherche par similarité sémantique
- Nettoyage automatique par expiration

### 5. Système de Support Multi-langues

#### Structure de Configuration
Les fichiers de configuration de scénarios sont situés dans `locales/{lang}/scenarios.json` :

```json
{
  "scenarios": {
    "development": {
      "name": "Développement",
      "description": "Développement et débogage de flux Node-RED",
      "systemPrompt": "Vous êtes un assistant professionnel de développement Node-RED...",
      "keywords": [
        {
          "key": ["current config", "configuration actuelle"],
          "scenario": "development",
          "newHumanPrompt": "Utilisez l'outil get-settings pour obtenir les informations de configuration actuelles de Node-RED, puis analysez l'état de la configuration.\n\nDemande originale de l'utilisateur : "
        }
      ]
    }
  }
}
```

#### Mécanisme de Spécification de Langue
Après l'exécution d'outils, le système spécifie la langue de réponse du LLM comme suit :

```javascript
const explanationPrompt = `Veuillez répondre à la question de l'utilisateur basée sur les informations suivantes :

Demande de l'utilisateur : ${userMessage}

Résultat de l'exécution de l'outil :
${result}

Veuillez fournir une analyse et explication professionnelle en ${this.getLanguageMapping(this.language)} sur les données de flux Node-RED ci-dessus...`;
```

Table de mappage des langues :
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': 'chinois',
        'en-US': 'anglais',
        'ja': 'japonais',
        'ko': 'coréen',
        'es-ES': 'espagnol',
        'pt-BR': 'portugais',
        'fr': 'français'
    };
    return mapping[lang] || 'anglais';
}
```

## Détails du Flux de Chat Utilisateur

### Processus End-to-End Complet

#### 1. Étape d'Envoi de Message Frontend

**Traitement de Saisie Utilisateur** :
- L'utilisateur saisit un message dans la barre latérale IA
- Le système obtient les informations de flux et nœud actuellement sélectionnés
- Vérifie l'état du nœud de configuration et l'état de déploiement

**Détection de Mots-clés et Prétraitement de Message** :
```javascript
// Traitement de mots-clés spéciaux
if (sendMessage.includes('current flow') || sendMessage.includes('flux actuel')) {
    // Basculement automatique vers le scénario de développement
    currentScenario = 'development';
    
    // Construction de prompt pour appel d'outil get-flow
    const promptTemplate = "Utilisez l'outil get-flow pour obtenir les données de flux avec les paramètres:{\"id\":\"{flowId}\"}, puis analysez et expliquez la fonctionnalité, les connexions de nœuds et les principes d'opération de ce flux.\n\nDemande originale de l'utilisateur : {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// Détection générale de mots-clés
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. Composition de Requête HTTP

```javascript
const requestBody = {
    message: sendMessage,
    scenario: currentScenario,
    sessionId: sessionId,
    nodeId: nodeId,
    selectedFlow: selectedFlow,
    selectedNodes: selectedNodes,
    flowData: flowData,
    history: history,
    silent: silent,
    dynamicData: dynamicData,
    language: getCurrentLanguage()
};
```

#### 3. Traitement de Route Backend

**Réception de Requête** (`make-iot-smart.js`) :
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // Configuration des en-têtes de réponse SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**Obtention du Nœud de Configuration** :
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'Impossible de trouver le nœud de configuration' });
}
```

**Préparation de Langue et Données** :
```javascript
if (language) {
    langchainManager.setLanguage(language);
}

const options = {
    scenario: scenario || 'general',
    sessionId: sessionId || 'default',
    config: configNode.config || {},
    selectedFlow,
    selectedNodes,
    flowData,
    history: history || [],
    dynamicData: dynamicData || {}
};
```

#### 4. Étape de Traitement du Gestionnaire LangChain

**Détection de Scénario** :
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Détermination d'Appel d'Outils** :

1. **Détection de Déclencheur Direct d'Outils** :
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // Exécution directe d'outil
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **Mode Forcé d'Outils par Mots-clés** :
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // Entrée en mode d'appel d'outils
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

3. **Détection d'Intention Multilingue** :

**Stratégie de Détection en Couches**

Ordre de Priorité :

1. **Correspondance Exacte** : Mots-clés de requête dans les fichiers de configuration (exclure les requêtes)
2. **Basé sur Configuration** : Modèles d'intention dans les fichiers de configuration de langue actuelle
3. **Correspondance Regex** : Expressions régulières multilingues codées en dur
4. **Analyse Sémantique** : Compréhension sémantique profonde utilisant LangChain

**Flux de Détection** :
```javascript
// 1. Vérification de correspondance exacte
const isQueryKeyword = this.isExactQueryKeywordMatch(input);
if (isQueryKeyword) {
    return { isFlowCreation: false, reason: 'Query keyword detected' };
}

// 2. Détection basée sur configuration
const configResult = this.detectConfigDrivenIntent(input);

// 3. Détection regex améliorée
const regexResult = this.detectEnhancedRegexPatterns(input);

// 4. Analyse sémantique (optionnel)
const semanticResult = await this.detectSemanticIntent(input);

// Score combiné
const finalConfidence = this.calculateCombinedScore({
    configDriven: configResult,
    enhancedRegex: regexResult,
    semantic: semanticResult
});
```

#### 4. Sélection de Mode d'Exécution

**Mode LLM Pur** :
- Obtenir le contexte de session
- Construire le prompt de scénario
- Appel direct au LLM pour générer une réponse

**Mode d'Appel d'Outils** :
- Déterminer le type d'outil (intégré vs MCP)
- Exécuter l'appel d'outil
- Fusionner les résultats d'outil
- Construire le prompt d'explication
- Appeler le LLM pour explication en langage naturel

#### 6. Étape d'Exécution d'Appel d'Outils

**Types d'Outils Disponibles** :

1. **Outils Intégrés** :
   - `get-flow` : Accès direct à `global.RED.nodes.getFlows()`
   - `get-node-info` : Accès direct à `global.RED.nodes`
   - `search_memory` : Recherche en mémoire
   - `get_user_preferences` : Préférences utilisateur

2. **Outils MCP** :
   - `get-settings` : Configuration Node-RED
   - `get-diagnostics` : Informations de diagnostic
   - Autres outils d'extension

**Flux d'Exécution d'Outils** :
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // Outil intégré : exécution directe
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // Outil MCP : exécution via client MCP
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // Envoi du résultat d'outil
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // Construction du prompt d'explication
    const explanationPrompt = `Veuillez répondre à la question de l'utilisateur basée sur les informations suivantes :\n\nDemande de l'utilisateur : ${userMessage}\n\nRésultat de l'exécution de l'outil :\n${result}\n\nVeuillez fournir une analyse et explication professionnelle en ${this.getLanguageMapping(this.language)} sur les données de flux Node-RED ci-dessus...`;
    
    // Appel au LLM pour explication
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**Traitement d'Outils Spéciaux** :

1. **Outil get-flow** :
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **Outils get-settings et get-diagnostics** :
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // Aucun paramètre nécessaire
}
```

#### 7. Étape de Traitement de Réponse Streaming

**Types d'Événements** :
- `token` : Fragment de contenu de texte
- `tool_call` : Informations d'appel d'outil
- `tool_result` : Résultat d'exécution d'outil
- `error` : Informations d'erreur
- `done` : Réponse terminée

**Flux de Données** :
```javascript
// Envoi backend
onChunk({ type: 'token', content: 'Contenu de réponse partielle' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// Réception frontend
eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'token':
            appendToCurrentMessage(data.content);
            break;
        case 'tool_call':
            showToolCall(data.tool, data.params);
            break;
        case 'tool_result':
            showToolResult(data.tool, data.result);
            break;
        case 'done':
            finalizeMessage();
            break;
    }
};
```

**Traitement Streaming Frontend** :
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // Faire défiler vers le bas
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. Gestion de Mémoire

**Sauvegarde de Conversation** :
```javascript
// Sauvegarder le message utilisateur
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// Sauvegarder la réponse IA
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**Gestion du Contexte de Session** :
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**Recherche en Mémoire** :
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. Gestion d'Erreurs et Tolérance aux Pannes

**Erreurs d'Authentification API** :
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'Clé API invalide. Veuillez vérifier la configuration' });
    }
}
```

**Erreurs de Réseau** :
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `Échec de l'appel d'outil : ${error.message}` });
    // Fallback vers le mode LLM pur
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Erreurs d'Appel d'Outils** :
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `Échec de l'exécution de l'outil ${toolName} : ${result?.error || 'Erreur inconnue'}` 
    });
    return;
}
```

#### 10. Optimisation de Performance

**Mécanisme de Cache** :
```javascript
// Cache d'instances LLM
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // Créer et mettre en cache une nouvelle instance
}
```

**Traitement Streaming** :
```javascript
// Utiliser l'API streaming pour réduire la latence
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**Traitement Asynchrone** :
```javascript
// Traitement parallèle de multiples appels d'outils
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. Support Multi-langues

**Configuration de Scénarios** :
- Chaque langue a son fichier de configuration `scenarios.json` indépendant
- Support pour mots-clés et prompts spécifiques par langue
- Détection et changement automatique de langue

**Localisation d'Interface** :
```javascript
// Obtenir le texte localisé
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. Considérations de Sécurité

**Validation d'Entrée** :
```javascript
// Limite de longueur de message
if (message.length > 10000) {
    return res.status(400).json({ error: 'Message trop long' });
}

// Filtrage d'informations sensibles
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[ÉDITÉ]');
```

**Protection de Clés API** :
```javascript
// Stockage de clés chiffrées dans le nœud de configuration
const encryptedKey = RED.util.encryptCredentials(apiKey);

// Déchiffrement à l'exécution
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**Contrôle d'Accès** :
```javascript
// Vérification des permissions utilisateur
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: 'Permissions insuffisantes' });
}
```

### Résumé

Tout le processus end-to-end implémente un pipeline complet depuis la saisie utilisateur jusqu'à la réponse IA, fournissant un support intelligent pour le développement Node-RED grâce à la détection de mots-clés en frontend, aux appels d'outils en backend et au traitement de réponse streaming. Caractéristiques du système :

1. **Intelligence** : Détection automatique d'intention utilisateur, sélection appropriée d'outils et scénarios
2. **Multi-langues** : Support pour détection de mots-clés et génération de réponse en multiples langues
3. **Évolutivité** : Conception modulaire, ajout facile de nouveaux outils et scénarios
4. **Haute Performance** : Traitement streaming, mécanismes de cache, exécution asynchrone
5. **Sécurité** : Validation d'entrée, protection de clés, contrôle de permissions
6. **Convivialité** : Réponses en temps réel, gestion d'erreurs, reconnaissance de contexte

## Documentation d'Interface API

### Points de Terminaison API RESTful

```
POST /ai-sidebar/stream-chat       # Chat streaming
GET  /ai-sidebar/scenarios         # Obtenir la configuration de scénarios
POST /ai-sidebar/execute-tool      # Exécuter un outil
GET  /ai-sidebar/memory-stats      # Statistiques de mémoire
GET  /ai-sidebar/history/:sessionId # Historique de session
POST /ai-sidebar/search            # Recherche en mémoire
GET  /ai-sidebar/templates         # Modèles de flux
```

### Formats de Requête/Réponse

**Requête de Chat Streaming** :
```json
{
  "message": "Message utilisateur",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "Nom du flux"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "Nom du nœud"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "fr"
}
```

**Format de Réponse Streaming** :
```
data: {"type": "token", "content": "Réponse"}
data: {"type": "token", "content": "partielle"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## Gestion de Configuration

### Variables d'Environnement

```bash
# Configuration des fournisseurs IA
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# Configuration de base de données
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# Configuration MCP
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Nœud de Configuration Node-RED

```javascript
{
  "provider": "openai",
  "model": "gpt-4",
  "apiKey": "encrypted_key",
  "temperature": 0.7,
  "maxTokens": 4000,
  "enableMemory": true,
  "enableTools": true,
  "scenarios": ["learning", "solution", "development"]
}
```

## Développement d'Extensions

### Ajouter un Nouveau Fournisseur LLM

```javascript
// Ajouter dans langchain-manager.js
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### Ajouter un Nouvel Outil Intégré

```javascript
// Ajouter dans la méthode initializeTools
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "Description de l'outil personnalisé",
    func: async (input) => {
        // Logique d'implémentation de l'outil
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### Ajouter une Nouvelle Configuration de Scénario

Ajouter dans `locales/{lang}/scenarios.json` :

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "Scénario Personnalisé",
      "description": "Description du scénario",
      "systemPrompt": "Vous êtes un professionnel...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "Veuillez utiliser l'outil...\n\nDemande originale de l'utilisateur : "
        }
      ]
    }
  }
}
```

## Dépannage

### Problèmes Courants

1. **Échec d'Appel d'Outils**
   - Vérifier l'état du serveur MCP
   - Valider le format des paramètres d'outil
   - Réviser les journaux d'erreur

2. **Détection de Mots-clés Ne Fonctionne Pas**
   - Confirmer l'existence du fichier de configuration de scénario
   - Vérifier la sensibilité à la casse des mots-clés
   - Confirmer la configuration de langue

3. **Interruption de Réponse Streaming**
   - Vérifier la connexion réseau
   - Valider la clé API
   - Réviser les erreurs dans la console du navigateur

### Mode de Débogage

```bash
# Activer la journalisation détaillée
DEBUG=langchain:*,mcp:* node-red

# Activer la journalisation des appels d'outils
TOOL_DEBUG=true node-red
```

## Recommandations d'Optimisation de Performance

1. **Stratégies de Cache**
   - Cache d'instances LLM
   - Cache de configuration de scénarios
   - Cache de résultats d'outils

2. **Contrôle de Concurrence**
   - Limiter le nombre de conversations simultanées
   - Gestion de file d'attente d'appels d'outils
   - Surveillance d'utilisation de ressources

3. **Gestion de Mémoire**
   - Nettoyage périodique de sessions expirées
   - Limitation de longueur d'enregistrements d'historique
   - Surveillance d'utilisation de mémoire

---

*Cette documentation est basée sur l'implémentation de code réel et est maintenue continuellement à jour avec les mises à jour du projet*