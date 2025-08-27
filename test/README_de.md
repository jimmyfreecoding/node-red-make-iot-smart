# LangChain End-to-End Tests

Dieses Verzeichnis enthält vollständige End-to-End-Testskripte der LangChain-Architektur zur Überprüfung des gesamten Prozesses von der Frontend-Benutzereingabe bis zur LLM-Antwort.

## 📁 Dateistruktur

```
test/
├── end-to-end-langchain-test.js    # Haupt-Testskript
├── run-e2e-test.js                 # Test-Ausführungsskript
├── .env.example                    # Beispiel für Umgebungskonfiguration
├── .env                           # Tatsächliche Umgebungskonfiguration (muss erstellt werden)
├── test-results/                  # Testergebnis-Verzeichnis
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # Dieses Dokument
```

## 🚀 Schnellstart

### 1. Umgebungskonfiguration

Vor der ersten Ausführung müssen Sie die Umgebungsvariablen konfigurieren:

```bash
# Beispiel für Umgebungskonfiguration kopieren
cp .env.example .env

# .env-Datei bearbeiten, um notwendige Konfigurationen vorzunehmen
# Besonders OPENAI_API_KEY (wenn Sie echte LLM-Aufrufe testen)
```

### 2. Tests Ausführen

```bash
# Vollständige End-to-End-Tests ausführen
node run-e2e-test.js

# Nur Umgebungskonfiguration überprüfen
node run-e2e-test.js --check

# Echte LLM-Aufrufe aktivieren (benötigt gültigen API-Schlüssel)
node run-e2e-test.js --real-llm

# Webserver-Port angeben
node run-e2e-test.js --port 8080

# Detaillierter Ausgabemodus
node run-e2e-test.js --verbose
```

### 3. Testbericht Anzeigen

Nach Abschluss der Tests wird automatisch ein Webserver gestartet, um den Testbericht anzuzeigen:

- Standard-Zugriffs-URL: http://localhost:3001
- API-Endpunkt: http://localhost:3001/api/test-results

## 📊 Testinhalt

### Testsprachen

Die Tests decken die folgenden 7 Sprachen ab:
- Chinesisch (zh-CN)
- Englisch (en-US) 
- Japanisch (ja)
- Koreanisch (ko)
- Spanisch (es-ES)
- Portugiesisch (pt-BR)
- Französisch (fr)

### Testfälle

Jede Sprache umfasst 5 Testfälle:

1. **get-flow Tool-Trigger** - Test des Schlüsselworts "aktueller Fluss"
2. **get-node-info Tool-Trigger** - Test des Schlüsselworts "aktueller Knoten"
3. **get-settings Tool-Trigger** - Test des Schlüsselworts "aktuelle Konfiguration"
4. **get-diagnostics Tool-Trigger** - Test des Schlüsselworts "aktuelle Diagnose"
5. **Natürlichsprachliche Unterhaltung** - Test "Node-RED vorstellen" (ohne Tool-Trigger)

### Aufgezeichnete Wichtige Informationen

Jeder Testfall zeichnet die folgenden Informationen auf:

- **a. Benutzereingabetext** - Simulierter Originaltext, den der Benutzer auf der Seite eingegeben hat
- **b. Erkanntes Schlüsselwort** - Schlüsselwort, das LangChain empfangen und identifiziert hat
- **c. Tool-Aufruf-Bestimmung** - Entscheidung des Systems, ein Tool aufzurufen
- **d. Tool-Typ und Rückgabeinhalt** - Spezifisches aufgerufenes Tool und dessen Rückgabeergebnis
- **e. Verketteter newHuman-Prompt an LLM gesendet** - Finaler Benutzer-Prompt an LLM gesendet
- **f. System-Prompt an LLM gesendet** - System-Level-Prompt
- **g. LLM-Antwort** - Antwortergebnis des großen Sprachmodells

## 🔧 Erklärung der Umgebungsvariablen

### Erforderliche Konfiguration

```bash
# OpenAI API-Schlüssel (für echte LLM-Aufrufe)
OPENAI_API_KEY=your_openai_api_key_here

# Node-RED Umgebungssimulation
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### Optionale Konfiguration

```bash
# LLM-Anbieter-Konfiguration
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# Webserver-Port
TEST_WEB_PORT=3001

# Echte LLM-Aufrufe aktivieren
ENABLE_REAL_LLM_CALLS=false

# Debug-Konfiguration
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 Testbericht

### Web-Bericht

Der nach Abschluss der Tests generierte HTML-Bericht umfasst:

- **Test-Zusammenfassung** - Allgemeine statistische Informationen
- **Sprachspezifische Tabellen** - Detaillierte Testergebnisse für jede Sprache
- **Status-Anzeige** - Erfolg/Fehler-Status
- **Responsive Design** - Anpassung an verschiedene Bildschirmgrößen

### JSON-Daten

Die rohen Testdaten werden im JSON-Format gespeichert und können verwendet werden für:

- Automatisierte Analyse
- Integration in CI/CD-Pipelines
- Generierung benutzerdefinierter Berichte

## 🛠️ Technische Architektur

### Testprozess

1. **Umgebungsinitialisierung** - Überprüfung von Konfiguration, Abhängigkeiten und Umgebungsvariablen
2. **Frontend-Simulation** - Simulation von Benutzereingabe und Schlüsselworterkennung
3. **Backend-Verarbeitung** - Aufruf des LangChain Managers zur Anfrageverarbeitung
4. **Tool-Ausführung** - Simulation oder tatsächliche Ausführung verwandter Tools
5. **LLM-Interaktion** - Prompt-Konstruktion und LLM-Antwort-Erhaltung
6. **Ergebnis-Aufzeichnung** - Speicherung vollständiger Verarbeitungsketten-Informationen
7. **Bericht-Generierung** - Generierung von Web-Berichten und JSON-Daten

### Simulationskomponenten

- **Mock Node-RED** - Simulation der Node-RED-Ausführungsumgebung
- **Mock Tools** - Simulation von Tool-Ausführungsergebnissen
- **Mock LLM** - Optionale Simulation von LLM-Antworten

## 🔍 Fehlerbehebung

### Häufige Probleme

1. **Umgebungsvariablen nicht konfiguriert**
   ```bash
   # Überprüfen, ob .env-Datei existiert und korrekt konfiguriert ist
   node run-e2e-test.js --check
   ```

2. **Fehlende Abhängigkeiten**
   ```bash
   # Notwendige Abhängigkeiten installieren
   npm install express dotenv
   ```

3. **Ungültiger API-Schlüssel**
   ```bash
   # Im Simulationsmodus testen
   node run-e2e-test.js
   # Oder ENABLE_REAL_LLM_CALLS=false konfigurieren
   ```

4. **Port in Verwendung**
   ```bash
   # Anderen Port angeben
   node run-e2e-test.js --port 8080
   ```

### Debug-Modus

```bash
# Detaillierte Ausgabe aktivieren
node run-e2e-test.js --verbose

# Oder in .env konfigurieren
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 Erweiterungsentwicklung

### Neue Sprache Hinzufügen

1. Sprachcode zu `TEST_CONFIG.languages` hinzufügen
2. Entsprechende Testfälle zu `TEST_CONFIG.testCases` hinzufügen
3. Überprüfen, dass entsprechende Sprachkonfigurationsdatei existiert

### Neuen Testfall Hinzufügen

```javascript
// Zu den Testfällen der entsprechenden Sprache hinzufügen
{ 
    keyword: 'neues Schlüsselwort', 
    expectedTool: 'new-tool', 
    description: 'Beschreibung des neuen Testfalls' 
}
```

### Benutzerdefinierte Tool-Simulation

Simulationsergebnisse neuer Tools zum `mockToolResults`-Objekt in der `executeTestCase`-Funktion hinzufügen.

## 📄 Lizenz

Dieses Testskript folgt derselben Lizenz wie das Hauptprojekt.

## 🤝 Beitrag

Wir begrüßen Issues und Pull Requests zur Verbesserung des Testskripts!

---

**Hinweis**: Dieses Testskript basiert auf dem Architekturdesign, das im Dokument `LANGCHAIN_ARCHITECTURE.md` beschrieben ist, und gewährleistet die Testabdeckung des vollständigen Benutzerinteraktionsprozesses.