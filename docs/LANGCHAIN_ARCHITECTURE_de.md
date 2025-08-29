# LangChain Architektur-Dokumentation

## Überblick

Dieses Projekt baut ein intelligentes Node-RED AI-Assistenten-System basierend auf dem LangChain.js Framework auf und verwendet ein modulares Architektur-Design, das mehrsprachige, multi-szenario und multi-tool intelligente Konversationsfunktionen unterstützt. Das System bietet professionelle Unterstützung für Node-RED-Entwicklung durch Frontend-Schlüsselwort-Erkennung, Backend-Tool-Aufrufe und Streaming-Antwort-Verarbeitung.

## Allgemeines Architektur-Diagramm

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Externe       │
│       UI        │    │   Verarbeitung   │    │   Services      │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Benutzer-   │ │    │ │ HTTP-Routen  │ │    │ │ LLM-        │ │
│ │ eingabe     │ │    │ └──────────────┘ │    │ │ Anbieter    │ │
│ └─────────────┘ │    │        │         │    │ │ (OpenAI,etc)│ │
│        │        │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ Schlüssel-  │ │    │ │ Manager      │ │    │ │ MCP-Tool-   │ │
│ │ wort-       │ │    │ └──────────────┘ │    │ │ Server      │ │
│ │ erkennung   │ │    │        │         │    │ └─────────────┘ │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │        │         │    │                 │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ Nachrichten-│ │────┼────────┼─────────┼────┤                 │
│ │ erstellung  │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Tool-        │ │    │                 │
│ │ Streaming-  │ │    │ │ Manager      │ │    │                 │
│ │ Antwort-    │ │    │ └──────────────┘ │    │                 │
│ │ verarbeitung│ │    │        │         │    │                 │
│ └─────────────┘ │    │ ┌──────────────┐ │    │                 │
└─────────────────┘    │ │ Speicher-    │ │    │                 │
                       │ │ Manager      │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## End-to-End Prozess-Überblick

### Prozessfluss-Diagramm

```
Benutzer-Texteingabe
     │
     ▼
Frontend-Schlüsselwort-Erkennung ──────┐
     │                                  │
     ▼                                  ▼
Versteckter Human-Prompt-Aufbau        Szenario-Konfiguration abrufen
     │                                  │
     ▼                                  │
HTTP-Anfrage senden ◄──────────────────┘
     │
     ▼
LangChain Manager
     │
     ▼
Tool-Trigger-Erkennung ─────────────────┐
     │                                   │
     ▼                                   ▼
Ausführungsmodus-Auswahl               Tool-Typ-Bestimmung
     │                                   │
     ├───────────────────────────────────┼─── Integrierte Tools
     │                                   │
     │                                   └─── MCP-Tools
     ▼
Tool-Ausführung und Ergebnis-Fusion
     │
     ▼
Neuer Human-Prompt-Aufbau
     │
     ▼
LLM-Aufruf (Spezifizierte Sprache)
     │
     ▼
Streaming-Antwort zurückgeben
```

## Details der Hauptkomponenten

### 1. Frontend-Schlüsselwort-Erkennungssystem

#### Konfigurationsquelle
Das Frontend erhält die Schlüsselwort-Konfiguration über die folgende API:
```javascript
// Szenario-Konfiguration für aktuelle Sprache abrufen
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### Erkennungslogik
Befindet sich in der `detectKeywords`-Funktion in `ai-sidebar.html`:

```javascript
async function detectKeywords(message) {
    // 1. Aktuelle Sprachkonfiguration abrufen
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. Alle Szenario-Schlüsselwort-Konfigurationen durchlaufen
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

#### Spezielle Schlüsselwort-Behandlung
Das System führt spezielle Behandlung für bestimmte Schlüsselwörter durch:

1. **"current flow" / "aktueller Flow"**:
   - Wechselt automatisch zum `development`-Szenario
   - Erstellt Prompt zum Aufruf des `get-flow`-Tools
   - Übergibt die ID des aktuell ausgewählten Flows

2. **"current node" / "aktueller Knoten"**:
   - Wechselt automatisch zum `development`-Szenario
   - Erstellt Prompt zum Aufruf des `get-node-info`-Tools
   - Übergibt detaillierte Informationen des ausgewählten Knotens

### 2. LangChain Manager (`lib/langchain-manager.js`)

#### Hauptverantwortlichkeiten
- Verwaltung von LLM-Anbietern (OpenAI, DeepSeek, Anthropic, Google)
- Koordination von Tool-Aufrufen
- Szenario-Verwaltung
- Streaming-Antwort-Verarbeitung
- Integration der Speicher-Verwaltung

#### Hauptmethoden

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
    
    // Tool-Trigger-Erkennung
    detectToolTrigger(message)
    
    // Bestimmung des erzwungenen Tool-Modus
    shouldForceToolMode(message, scenario, dynamicData)
    
    // Reines LLM-Chat-Streaming
    executePureLLMChatStream(message, options, onChunk)
    
    // Szenario-basiertes Chat-Streaming
    executeScenarioChatStream(message, options, onChunk)
}
```

#### Tool-Trigger-Erkennungsmechanismus

1. **Direktes Tool-Aufruf-Format**:
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **Schlüsselwort-Trigger**:
   - Erkennung über die `shouldForceToolMode`-Methode
   - Basiert auf mehrsprachiger Konfiguration-Schlüsselwort-Zuordnung
   - Unterstützung für Parameter-Extraktion und Tool-Inferenz

### 3. Tool-Verwaltungssystem

#### Tool-Klassifizierung

**Integrierte Tools**:
- `search_memory`: Speicher-Suche
- `get_user_preferences`: Benutzereinstellungen abrufen
- `get_flow_templates`: Flow-Vorlagen abrufen
- `get-flow`: Node-RED Flow-Daten abrufen (direkter Zugriff auf `global.RED`)
- `get-node-info`: Node-RED Knoten-Informationen abrufen (direkter Zugriff auf `global.RED`)

**MCP-Tools**:
- `get-settings`: Node-RED Konfiguration abrufen
- `get-diagnostics`: Diagnoseinformationen abrufen
- Andere Tools, die über das MCP-Protokoll bereitgestellt werden

#### Tool-Auswahllogik

```javascript
// Direkte Ausführung spezieller Tools
if (toolName === 'get-node-info') {
    // Direkte Verwendung der Node-RED API
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // MCP-Parameter-Aufbau
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // Andere Tools verwenden bereitgestellte Parameter
    mcpArgs = toolTrigger.args;
}
```

### 4. Speicher-Verwaltungssystem (`lib/memory-manager.js`)

#### Datenbankstruktur

```sql
-- Kurzzeitgedächtnis (Sitzungsverlauf)
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Langzeitgedächtnis (Benutzereinstellungen, Wissensbasis)
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

#### Speicher-Abrufmechanismus
- Sitzungs-ID-basierte Kontext-Wiederherstellung
- Semantische Ähnlichkeitssuche
- Automatische Bereinigung durch Ablauf

### 5. Mehrsprachiges Unterstützungssystem

#### Konfigurationsstruktur
Szenario-Konfigurationsdateien befinden sich in `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "development": {
      "name": "Entwicklung",
      "description": "Node-RED Flow-Entwicklung und -Debugging",
      "systemPrompt": "Sie sind ein professioneller Node-RED Entwicklungsassistent...",
      "keywords": [
        {
          "key": ["current config", "aktuelle Konfiguration"],
          "scenario": "development",
          "newHumanPrompt": "Verwenden Sie das get-settings Tool, um die aktuellen Node-RED Konfigurationsinformationen abzurufen, und analysieren Sie dann den Konfigurationsstatus.\n\nUrsprüngliche Benutzeranfrage: "
        }
      ]
    }
  }
}
```

#### Sprachspezifikationsmechanismus
Nach der Tool-Ausführung spezifiziert das System die LLM-Antwortsprache wie folgt:

```javascript
const explanationPrompt = `Bitte beantworten Sie die Benutzerfrage basierend auf den folgenden Informationen:

Benutzeranfrage: ${userMessage}

Tool-Ausführungsergebnis:
${result}

Bitte geben Sie eine professionelle Analyse und Erklärung in ${this.getLanguageMapping(this.language)} zu den obigen Node-RED Flow-Daten...`;
```

Sprach-Zuordnungstabelle:
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': 'Chinesisch',
        'en-US': 'Englisch',
        'ja': 'Japanisch',
        'ko': 'Koreanisch',
        'es-ES': 'Spanisch',
        'pt-BR': 'Portugiesisch',
        'fr': 'Französisch',
        'de': 'Deutsch'
    };
    return mapping[lang] || 'Englisch';
}
```

## Details des Benutzer-Chat-Flusses

### Vollständiger End-to-End Prozess

#### 1. Frontend-Nachrichten-Sendeschritt

**Benutzereingabe-Verarbeitung**:
- Benutzer gibt Nachricht in der AI-Seitenleiste ein
- System ruft aktuell ausgewählte Flow- und Knoten-Informationen ab
- Überprüft Konfigurationsknoten-Status und Deployment-Status

**Schlüsselwort-Erkennung und Nachrichten-Vorverarbeitung**:
```javascript
// Spezielle Schlüsselwort-Behandlung
if (sendMessage.includes('current flow') || sendMessage.includes('aktueller Flow')) {
    // Automatischer Wechsel zum Entwicklungsszenario
    currentScenario = 'development';
    
    // Prompt-Aufbau für get-flow Tool-Aufruf
    const promptTemplate = "Verwenden Sie das get-flow Tool, um Flow-Daten mit Parametern:{\"id\":\"{flowId}\"} abzurufen, und analysieren und erklären Sie dann die Funktionalität, Knotenverbindungen und Betriebsprinzipien dieses Flows.\n\nUrsprüngliche Benutzeranfrage: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// Allgemeine Schlüsselwort-Erkennung
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. HTTP-Anfrage-Zusammenstellung

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

#### 3. Backend-Routen-Verarbeitung

**Anfrage-Empfang** (`make-iot-smart.js`):
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // SSE-Antwort-Header-Konfiguration
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**Konfigurationsknoten-Abruf**:
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'Konfigurationsknoten nicht gefunden' });
}
```

**Sprach- und Daten-Vorbereitung**:
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

#### 4. LangChain Manager Verarbeitungsschritt

**Szenario-Erkennung**:
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Tool-Aufruf-Bestimmung**:

1. **Direkte Tool-Trigger-Erkennung**:
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // Direkte Tool-Ausführung
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **Erzwungener Tool-Modus durch Schlüsselwörter**:
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // Eintritt in Tool-Aufruf-Modus
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

3. **Mehrsprachige Absichtserkennung**:

**Schichtweise Erkennungsstrategie**

Prioritätsreihenfolge:

1. **Exakte Übereinstimmung**: Abfrage-Schlüsselwörter in Konfigurationsdateien (Abfragen ausschließen)
2. **Konfigurationsgesteuert**: Absichtsmuster in aktuellen Sprachkonfigurationsdateien
3. **Regex-Übereinstimmung**: Hartcodierte mehrsprachige reguläre Ausdrücke
4. **Semantische Analyse**: Tiefe semantische Verständnis mit LangChain

**Erkennungsablauf**:
```javascript
// 1. Exakte Übereinstimmungsprüfung
const isQueryKeyword = this.isExactQueryKeywordMatch(input);
if (isQueryKeyword) {
    return { isFlowCreation: false, reason: 'Query keyword detected' };
}

// 2. Konfigurationsgesteuerte Erkennung
const configResult = this.detectConfigDrivenIntent(input);

// 3. Erweiterte Regex-Erkennung
const regexResult = this.detectEnhancedRegexPatterns(input);

// 4. Semantische Analyse (optional)
const semanticResult = await this.detectSemanticIntent(input);

// Kombinierte Bewertung
const finalConfidence = this.calculateCombinedScore({
    configDriven: configResult,
    enhancedRegex: regexResult,
    semantic: semanticResult
});
```

#### 4. Ausführungsmodus-Auswahl

**Reiner LLM-Modus**:
- Sitzungskontext abrufen
- Szenario-Prompt aufbauen
- Direkter LLM-Aufruf zur Antwortgenerierung

**Tool-Aufruf-Modus**:
- Tool-Typ bestimmen (integriert vs MCP)
- Tool-Aufruf ausführen
- Tool-Ergebnisse zusammenführen
- Erklärungs-Prompt aufbauen
- LLM für natürlichsprachliche Erklärung aufrufen

#### 6. Tool-Aufruf-Ausführungsschritt

**Verfügbare Tool-Typen**:

1. **Integrierte Tools**:
   - `get-flow`: Direkter Zugriff auf `global.RED.nodes.getFlows()`
   - `get-node-info`: Direkter Zugriff auf `global.RED.nodes`
   - `search_memory`: Speicher-Suche
   - `get_user_preferences`: Benutzereinstellungen

2. **MCP-Tools**:
   - `get-settings`: Node-RED Konfiguration
   - `get-diagnostics`: Diagnoseinformationen
   - Andere Erweiterungs-Tools

**Tool-Ausführungsfluss**:
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // Integriertes Tool: direkte Ausführung
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // MCP-Tool: Ausführung über MCP-Client
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // Tool-Ergebnis senden
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // Erklärungs-Prompt aufbauen
    const explanationPrompt = `Bitte beantworten Sie die Benutzerfrage basierend auf den folgenden Informationen:\n\nBenutzeranfrage: ${userMessage}\n\nTool-Ausführungsergebnis:\n${result}\n\nBitte geben Sie eine professionelle Analyse und Erklärung in ${this.getLanguageMapping(this.language)} zu den obigen Node-RED Flow-Daten...`;
    
    // LLM für Erklärung aufrufen
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**Spezielle Tool-Behandlung**:

1. **get-flow Tool**:
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **get-settings und get-diagnostics Tools**:
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // Keine Parameter erforderlich
}
```

#### 7. Streaming-Antwort-Verarbeitungsschritt

**Event-Typen**:
- `token`: Textinhalt-Fragment
- `tool_call`: Tool-Aufruf-Informationen
- `tool_result`: Tool-Ausführungsergebnis
- `error`: Fehlerinformationen
- `done`: Antwort abgeschlossen

**Datenfluss**:
```javascript
// Backend-Sendung
onChunk({ type: 'token', content: 'Teilantwort-Inhalt' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// Frontend-Empfang
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

**Frontend-Streaming-Verarbeitung**:
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // Nach unten scrollen
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. Speicher-Verwaltung

**Konversations-Speicherung**:
```javascript
// Benutzernachricht speichern
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// AI-Antwort speichern
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**Sitzungskontext-Verwaltung**:
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**Speicher-Suche**:
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. Fehlerbehandlung und Fehlertoleranz

**API-Authentifizierungsfehler**:
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'Ungültiger API-Schlüssel. Bitte überprüfen Sie die Konfiguration' });
    }
}
```

**Netzwerkfehler**:
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `Tool-Aufruf fehlgeschlagen: ${error.message}` });
    // Fallback zum reinen LLM-Modus
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Tool-Aufruf-Fehler**:
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `Tool-Ausführung ${toolName} fehlgeschlagen: ${result?.error || 'Unbekannter Fehler'}` 
    });
    return;
}
```

#### 10. Leistungsoptimierung

**Cache-Mechanismus**:
```javascript
// LLM-Instanz-Cache
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // Neue Instanz erstellen und cachen
}
```

**Streaming-Verarbeitung**:
```javascript
// Streaming-API verwenden, um Latenz zu reduzieren
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**Asynchrone Verarbeitung**:
```javascript
// Parallele Verarbeitung mehrerer Tool-Aufrufe
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. Mehrsprachige Unterstützung

**Szenario-Konfiguration**:
- Jede Sprache hat ihre unabhängige `scenarios.json` Konfigurationsdatei
- Unterstützung für sprachspezifische Schlüsselwörter und Prompts
- Automatische Spracherkennung und -umschaltung

**Interface-Lokalisierung**:
```javascript
// Lokalisierten Text abrufen
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. Sicherheitsüberlegungen

**Eingabe-Validierung**:
```javascript
// Nachrichten-Längenbegrenzung
if (message.length > 10000) {
    return res.status(400).json({ error: 'Nachricht zu lang' });
}

// Filterung sensibler Informationen
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[BEARBEITET]');
```

**API-Schlüssel-Schutz**:
```javascript
// Verschlüsselte Schlüssel im Konfigurationsknoten speichern
const encryptedKey = RED.util.encryptCredentials(apiKey);

// Entschlüsselung zur Laufzeit
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**Zugriffskontrolle**:
```javascript
// Benutzerberechtigungen überprüfen
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: 'Unzureichende Berechtigungen' });
}
```

### Zusammenfassung

Der gesamte End-to-End Prozess implementiert eine vollständige Pipeline von der Benutzereingabe bis zur AI-Antwort und bietet intelligente Unterstützung für Node-RED-Entwicklung durch Frontend-Schlüsselwort-Erkennung, Backend-Tool-Aufrufe und Streaming-Antwort-Verarbeitung. System-Eigenschaften:

1. **Intelligenz**: Automatische Benutzerintention-Erkennung, angemessene Tool- und Szenario-Auswahl
2. **Mehrsprachig**: Unterstützung für Schlüsselwort-Erkennung und Antwortgenerierung in mehreren Sprachen
3. **Skalierbarkeit**: Modulares Design, einfaches Hinzufügen neuer Tools und Szenarien
4. **Hohe Leistung**: Streaming-Verarbeitung, Cache-Mechanismen, asynchrone Ausführung
5. **Sicherheit**: Eingabe-Validierung, Schlüssel-Schutz, Berechtigungskontrolle
6. **Benutzerfreundlich**: Echtzeit-Antworten, Fehlerbehandlung, Kontext-Erkennung

## API-Interface-Dokumentation

### RESTful API-Endpunkte

```
POST /ai-sidebar/stream-chat       # Streaming-Chat
GET  /ai-sidebar/scenarios         # Szenario-Konfiguration abrufen
POST /ai-sidebar/execute-tool      # Tool ausführen
GET  /ai-sidebar/memory-stats      # Speicher-Statistiken
GET  /ai-sidebar/history/:sessionId # Sitzungsverlauf
POST /ai-sidebar/search            # Speicher-Suche
GET  /ai-sidebar/templates         # Flow-Vorlagen
```

### Anfrage-/Antwort-Formate

**Streaming-Chat-Anfrage**:
```json
{
  "message": "Benutzernachricht",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "Flow-Name"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "Knoten-Name"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "de"
}
```

**Streaming-Antwort-Format**:
```
data: {"type": "token", "content": "Antwort"}
data: {"type": "token", "content": "teilweise"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## Konfigurationsverwaltung

### Umgebungsvariablen

```bash
# AI-Anbieter-Konfiguration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# Datenbank-Konfiguration
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# MCP-Konfiguration
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Node-RED Konfigurationsknoten

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

## Erweiterungsentwicklung

### Neuen LLM-Anbieter hinzufügen

```javascript
// In langchain-manager.js hinzufügen
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### Neues integriertes Tool hinzufügen

```javascript
// In der initializeTools-Methode hinzufügen
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "Beschreibung des benutzerdefinierten Tools",
    func: async (input) => {
        // Tool-Implementierungslogik
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### Neue Szenario-Konfiguration hinzufügen

In `locales/{lang}/scenarios.json` hinzufügen:

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "Benutzerdefiniertes Szenario",
      "description": "Szenario-Beschreibung",
      "systemPrompt": "Sie sind ein Profi...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "Bitte verwenden Sie das Tool...\n\nUrsprüngliche Benutzeranfrage: "
        }
      ]
    }
  }
}
```

## Fehlerbehebung

### Häufige Probleme

1. **Tool-Aufruf-Fehler**
   - MCP-Server-Status überprüfen
   - Tool-Parameter-Format validieren
   - Fehler-Logs überprüfen

2. **Schlüsselwort-Erkennung funktioniert nicht**
   - Existenz der Szenario-Konfigurationsdatei bestätigen
   - Groß-/Kleinschreibung der Schlüsselwörter überprüfen
   - Sprachkonfiguration bestätigen

3. **Streaming-Antwort-Unterbrechung**
   - Netzwerkverbindung überprüfen
   - API-Schlüssel validieren
   - Browser-Konsole-Fehler überprüfen

### Debug-Modus

```bash
# Detaillierte Protokollierung aktivieren
DEBUG=langchain:*,mcp:* node-red

# Tool-Aufruf-Protokollierung aktivieren
TOOL_DEBUG=true node-red
```

## Leistungsoptimierungs-Empfehlungen

1. **Cache-Strategien**
   - LLM-Instanz-Cache
   - Szenario-Konfigurations-Cache
   - Tool-Ergebnis-Cache

2. **Nebenläufigkeitskontrolle**
   - Anzahl gleichzeitiger Konversationen begrenzen
   - Tool-Aufruf-Warteschlangen-Verwaltung
   - Ressourcennutzungs-Überwachung

3. **Speicher-Verwaltung**
   - Periodische Bereinigung abgelaufener Sitzungen
   - Verlaufs-Datensatz-Längenbegrenzung
   - Speichernutzungs-Überwachung

---

*Diese Dokumentation basiert auf der tatsächlichen Code-Implementierung und wird kontinuierlich mit Projekt-Updates aktualisiert*