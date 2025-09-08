# Node-RED Make IoT Smart

## 🌐 Sprachen

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md) [![中文](https://img.shields.io/badge/lang-中文-red.svg)](README_ZH.md) [![Deutsch](https://img.shields.io/badge/lang-Deutsch-green.svg)](README_DE.md) [![Español](https://img.shields.io/badge/lang-Español-orange.svg)](README_ES.md) [![Français](https://img.shields.io/badge/lang-Français-purple.svg)](README_FR.md) [![日本語](https://img.shields.io/badge/lang-日本語-yellow.svg)](README_JA.md) [![한국어](https://img.shields.io/badge/lang-한국어-pink.svg)](README_KO.md) [![Português](https://img.shields.io/badge/lang-Português-cyan.svg)](README_PT.md) [![Русский](https://img.shields.io/badge/lang-Русский-brown.svg)](README_RU.md) [![繁體中文](https://img.shields.io/badge/lang-繁體中文-lightblue.svg)](README_TW.md)


---

Eine KI-Assistenten-Erweiterung, die speziell für Node-RED entwickelt wurde und die IoT-Entwicklung intelligenter und effizienter macht.
[![npm version](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart.svg)](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)
## Überblick

Node-RED Make IoT Smart ist ein umfassender KI-Agent, der speziell für die Node-RED-Entwicklung entwickelt wurde. Es verbessert die IoT-Entwicklungserfahrung durch intelligente Code-Unterstützung, automatische Flow-Optimierung und intelligente Debugging-Funktionen. Diese Erweiterung unterstützt derzeit 6 Hauptszenarien: Lernen, Lösung, Integration, Entwicklung, Konfiguration und Verwaltung.

## Funktionen

### 🤖 KI-Assistent

- **Intelligente Code-Vorschläge**: Kontextbezogene Code-Empfehlungen für Node-RED-Flows.
- **Intelligente Flow-Analyse**: Analysiert Flows und bietet Optimierungsvorschläge.
- **Natürlichsprachige Schnittstelle**: Interagieren Sie mit der Node-RED-Umgebung über natürlichsprachige Befehle.
- **Mehrsprachige Unterstützung**: Unterstützt Chinesisch, Englisch, Japanisch, Koreanisch und andere Sprachen. Passt sich automatisch an Änderungen der Node-RED-Spracheinstellungen an.
- **Multi-Provider-Unterstützung**: Basiert auf dem LangChain.js-Framework, unterstützt KI-Modelle wie OpenAI, Anthropic, Google, DeepSeek und andere.
- **Intelligentes Speichermanagement**: SQLite-basiertes Kurz- und Langzeitspeichersystem, unterstützt Gesprächshistorie, Benutzereinstellungen und Flow-Template-Speicherung.
- **Szenario-basierte Prompts**: Szenario-basiertes Prompt-Management über JSON-Konfiguration, unterstützt dynamische Parametereinspritzung.
- **MCP-Tool-Integration**: Unterstützt Model Context Protocol (MCP) Tool-Aufrufe zur Erweiterung der KI-Assistenten-Funktionen.


### 🔧 Entwicklungstools

- **Echtzeit-Code-Analyse**: Kontinuierliche Analyse von Node-RED-Flows.
- **Konfigurationsverwaltung**: Zentralisierte API-Konfiguration für verschiedene KI-Provider.
- **Interaktive Seitenleiste**: Dedizierte KI-Assistenten-Panel, integriert in den Node-RED-Editor.
- **JSON-Editor**: Eingebauter Konfigurationsdatei-Editor mit Syntax-Highlighting.
- **MCP-Tool-Integration**: Unterstützt Model Context Protocol (MCP) Tool-Aufrufe zur Erweiterung der KI-Assistenten-Funktionen.
- **LangChain-Tool-Management**: Einheitliches Tool-Management-Framework, unterstützt eingebaute Tools und MCP-Tools.
- **Szenario-basierte Unterstützung**: Maßgeschneiderte Unterstützung für 7 Hauptszenarien:
  - **Lernen**: Erklärt Knoten und Konzepte, bietet Flow-Beispiele.
  - **Lösung**: Bietet verschiedene IoT-Lösungen, einschließlich Flow-JSON und Knoten-Installationsanleitungen.
  - **Integration**: Unterstützt Protokoll- (wie MQTT, Modbus) und Software-Integration.
  - **Entwicklung**: Optimiert bestehende Flows und Funktionsknoten-Code.
  - **Konfiguration**: Leitet Node-RED-Konfigurationsänderungen (wie `settings.js`).
  - **Verwaltung**: Unterstützt Remote-Zugriff, Git-Integration und Massen-Deployment.

### 🚀 Zukünftige Funktionen

- **Remote-Debugging**: Remote-Debugging von Node-RED-Flows mit KI.
- **Team-Management**: Kollaborative Entwicklung mit Team-Management-Funktionen.
- **Erweiterte Analytik**: Tiefe Einblicke in die IoT-System-Performance.
- **Intelligentes Deployment**: KI-gesteuerte IoT-Anwendungs-Deployment-Strategien.

## Installation

### Installation über npm

```bash
npm install @jhe.zheng/node-red-make-iot-smart
```

### Installation über Node-RED Palette Manager

1. Öffnen Sie den Node-RED-Editor.
2. Gehen Sie zu **Menü → Palette verwalten**.
3. Suchen Sie nach `@jhe.zheng/node-red-make-iot-smart`.
4. Klicken Sie auf **Installieren**.
5. Starten Sie Node-RED nach der Installation neu.
6. Nach der Installation erscheint ein neuer **KI-Assistent**-Tab in der Node-RED-Seitenleiste.
7. Klicken Sie auf die **Einstellungen**-Schaltfläche, um Ihren KI-Provider zu konfigurieren.
8. Wählen Sie aus den unterstützten Providern:
   - **DeepSeek**: Kostengünstige Option mit starken Coding-Fähigkeiten.
   - **OpenAI**: Branchenführende GPT-Modelle.
   - **Anthropic**: Erweiterte Reasoning-Fähigkeiten durch Claude-Modelle.
9. Geben Sie Ihren API-Schlüssel ein und wählen Sie ein geeignetes Modell.
10. Nach der Konfiguration können Sie den KI-Assistenten verwenden. Beachten Sie, dass NodeRED nach dem Speichern der Einstellungen automatisch einen Konfigurationsknoten erstellt. NodeRED zeigt Änderungen im Flow an, und Sie müssen nur auf Zusammenführen klicken.
11. Beginnen Sie mit der Interaktion mit dem KI-Assistenten!

## Schnellstart
### Geben Sie "Aktuellen Knoten analysieren" ein
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/current-node.gif" width="800" height="450" alt="Demo-Animation" />


### Geben Sie "Beispiel-Flow erstellen" ein
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/create-flow.gif" width="800" height="450" alt="Demo-Animation" />

### Geben Sie "Gesundheitsprüfung" ein
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/health-check.gif" width="800" height="450" alt="Demo-Animation" />

## Konfiguration

### LangSmith Debug-Konfiguration (Optional)

Sie können LangSmith-Unterstützung für besseres Debugging und Monitoring der LangChain-Ausführung konfigurieren:

1. Kopieren Sie die `.env.example`-Datei nach `.env`:
   ```bash
   cp .env.example .env
   ```

2. Bearbeiten Sie die `.env`-Datei, um Ihre LangSmith-Konfiguration einzugeben:
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_api_key_here
   LANGCHAIN_PROJECT=your_project_name
   ```

3. Starten Sie Node-RED neu, um die Konfiguration anzuwenden.

4. Besuchen Sie [LangSmith](https://smith.langchain.com/), um detaillierte Ausführungs-Traces und Debug-Informationen anzuzeigen.

**Hinweis**: Die LangSmith-Konfiguration ist optional und beeinflusst nicht die Kernfunktionalität.

## Verwendung

### Basis-Chat-Interface

- Öffnen Sie den **KI-Assistent**-Tab in der Seitenleiste.
- Geben Sie Ihre Fragen oder Anweisungen in natürlicher Sprache ein.
- Erhalten Sie intelligente Antworten mit Code-Vorschlägen und Erklärungen.

### Szenario-Auswahl

- Wählen Sie ein Szenario (Lernen, Lösung, Integration, Entwicklung, Konfiguration, Verwaltung) im Dropdown-Menü der Seitenleiste.
- Die KI passt ihre Antworten basierend auf dem ausgewählten Szenario an und bietet entsprechende Tools und Flow-JSON.

### JSON/Code-Verarbeitung

- Große JSON- oder Code-Ausgaben sind hinter **JSON/Code anzeigen**-Schaltflächen versteckt, um die UI sauber zu halten.
- Bearbeiten Sie Flow-JSON im eingebauten Editor mit Syntax-Highlighting und wenden Sie Änderungen direkt an.

### Unterstützte Szenarien

#### Szenario-Übersicht

| Szenario | Deutsche Bezeichnung | Beschreibung | Unterstützte Tools |
|----------|---------------------|--------------|--------------------|
| learning | Lernmodus | Node-RED-Lernassistent, bietet Bildungsanleitungen und Wissensantworten | get-flows, get-nodes, create-flow, update-flow |
| solution | Lösungsmodus | IoT-Lösungsexperte, bietet technische Lösungen und Architekturberatung | create-flow, update-flow, get-flows, create-subflow |
| integration | Integrationsmodus | Systemintegrationsexperte, befasst sich mit Geräteverbindung und Datenintegration | create-flow, update-flow, install-node, get-node-info |
| development | Entwicklungsmodus | Code-Entwicklungsassistent, unterstützt Node-RED-Flow-Erstellung und -Optimierung | create-flow, update-flow, create-subflow, get-node-info, install-node, get-flow |
| configuration | Konfigurationsmodus | Systemkonfigurationsexperte, verwaltet Node-RED-Umgebung und Knoten-Konfiguration | get_settings, update_settings, install_node, get_node_info, get_diagnostics |
| management | Verwaltungsmodus | Projektmanagement-Assistent, unterstützt Flow-Organisation und Projektplanung | get-flows, create-flow, update-flow, create-subflow |
| general | Allgemeiner Modus | Allgemeiner KI-Assistent, behandelt verschiedene Node-RED-bezogene Fragen | Keine spezifischen Tool-Einschränkungen |

#### Beispiele für vordefinierte Prompts

| Szenario | Vordefinierte Prompts |
|----------|----------------------|
| **Lernmodus** | • Ich bin neu bei Node-RED. Bitte stellen Sie die grundlegenden Konzepte und Hauptfunktionen von Node-RED vor<br>• Bitte erklären Sie Flows, Knoten und Verbindungen in Node-RED<br>• Wie erstelle ich meinen ersten einfachen Flow in Node-RED? Bitte geben Sie detaillierte Schritte an<br>• Welche grundlegenden Knoten werden häufig in Node-RED verwendet? Was sind ihre entsprechenden Funktionen? |
| **Lösungsmodus** | • Ich muss ein Smart-Home-Steuerungssystem entwerfen. Bitte stellen Sie eine vollständige IoT-Lösungsarchitektur bereit<br>• Wie verwende ich Node-RED, um ein Industrie 4.0-Datensammlung- und Überwachungssystem aufzubauen?<br>• Bitte entwerfen Sie eine landwirtschaftliche IoT-Lösung, die Sensordatensammlung und automatische Steuerung umfasst<br>• Ich möchte ein Smart-City-Umweltüberwachungsnetzwerk aufbauen, welche technischen Lösungen sind erforderlich? |
| **Integrationsmodus** | • Wie integriere ich MQTT-Geräte und HTTP-APIs in Node-RED? Bitte stellen Sie eine detaillierte Integrationslösung bereit<br>• Ich muss Sensordaten von Modbus-Geräten an eine Cloud-Datenbank übertragen. Wie implementiere ich das?<br>• Bitte helfen Sie beim Entwurf eines Datentransformations-Flows, der JSON in XML konvertiert und an Drittsysteme sendet<br>• Wie implementiere ich integrierte Datensammlung und -verarbeitung von mehreren Geräten mit verschiedenen Protokollen in Node-RED? |
| **Entwicklungsmodus** | • Detaillierte Erklärung und Kommentierung des aktuellen Flows<br>• Detaillierte Erklärung und Kommentierung des aktuellen Knotens<br>• Bitte helfen Sie beim Schreiben von Funktionsknoten-Code, der Datenfilterung und Formatkonvertierung implementiert<br>• Wie erstelle ich benutzerdefinierte Knoten in Node-RED? Bitte stellen Sie den vollständigen Entwicklungsprozess bereit |
| **Konfigurationsmodus** | • Was ist die aktuelle NodeRED-Konfiguration?<br>• Was ist die aktuelle NodeRED-Diagnose?<br>• Wie konfiguriere ich die Node-RED-Sicherheitskonfiguration, einschließlich Benutzerauthentifizierung und HTTPS?<br>• Bitte helfen Sie bei der Optimierung der Node-RED-Performance-Konfiguration zur Verbesserung der Systemausführungseffizienz<br>• Wie installiere und verwalte ich Drittanbieter-Knoten-Pakete in Node-RED?<br>• Ich muss Node-RED-Logging und -Monitoring konfigurieren. Wie richte ich das ein? |
| **Verwaltungsmodus** | • Bitte helfen Sie bei der Erstellung von Entwicklungsplänen und Meilensteinen für IoT-Projekte<br>• Wie organisiere und verwalte ich die Flow-Struktur von großangelegten Projekten in Node-RED?<br>• Ich muss die Risiken und Qualität des aktuellen Projekts bewerten. Bitte geben Sie Analyseempfehlungen<br>• Wie etabliere ich Node-RED-Kollaborationsentwicklungsstandards und Best Practices im Team? |
| **Allgemeiner Modus** | • Was ist Node-RED? Was sind seine Hauptmerkmale und Anwendungsszenarien?<br>• Ich bin auf Probleme in Node-RED gestoßen. Bitte helfen Sie bei der Analyse und den Lösungen<br>• Bitte empfehlen Sie Node-RED-Lernressourcen und Best Practices<br>• Wie wähle ich den geeigneten Node-RED-Szenario-Modus zur Lösung spezifischer Anforderungen? |

#### Intelligente Schlüsselwort-Aktivierung

| Szenario | Schlüsselwörter | Aktivierungsaktion |
|----------|-----------------|--------------------|
| **Entwicklungsmodus** | flow erstellen, flow generieren, flow machen, neuer flow | Wechselt automatisch in den Entwicklungsmodus zur Generierung von vollständigem Node-RED-Flow-JSON-Code und bietet detaillierte Erklärungen |
| **Konfigurationsmodus** | aktuelle konfiguration, systemkonfiguration, konfigurationsinformationen, konfiguration, aktuelle einstellungen | Ruft automatisch das get_settings-Tool auf, um Konfigurationsinformationen abzurufen und im Tabellenformat anzuzeigen |
| **Konfigurationsmodus** | aktuelle diagnose, systemdiagnose, diagnoseinformationen, gesundheitsprüfung | Ruft automatisch das get_diagnostics-Tool auf, um eine Systemdiagnose durchzuführen |

#### Dynamische Eingabeparameter

Alle Szenarien unterstützen die folgende dynamische Parametereinspritzung:
- `nodeRedVersion` - Node-RED-Versionsinformationen
- `nodeVersion` - Node.js-Versionsinformationen
- `currentTime` - Aktueller Zeitstempel
- `selectedFlow` - Aktuell ausgewählter Flow
- `selectedNodes` - Aktuell ausgewählte Knoten
- `lang` - Aktuelle Spracheinstellung
- `mcpTools` - Liste verfügbarer MCP-Tools

Jedes Szenario unterstützt auch spezifische dynamische Parameter:
- **Lernmodus**: `userLevel` (Benutzerfähigkeitslevel)
- **Lösungsmodus**: `projectRequirements` (Projektanforderungen)
- **Integrationsmodus**: `integrationTargets` (Integrationsziele)
- **Entwicklungsmodus**: `developmentTask` (Entwicklungsaufgabe)
- **Konfigurationsmodus**: `configurationNeeds` (Konfigurationsbedürfnisse)
- **Verwaltungsmodus**: `projectStatus` (Projektstatus)

#### System-Prompt-Eigenschaften

Jedes Szenario ist mit professionellen System-Prompts konfiguriert, um sicherzustellen, dass der KI-Assistent:
1. **Rollendefinition**: Klare professionelle Rolle in spezifischen Szenarien
2. **Ausgabeformat**: Strukturiertes Antwortformat entsprechend den Szenario-Anforderungen
3. **Tool-Integration**: Intelligenter Aufruf entsprechender MCP-Tools und Node-RED-APIs
4. **Kontexterkennung**: Personalisierte Empfehlungen unter Verwendung dynamischer Parameter


| Szenario | Beschreibung                                                                    |
| --------- | ------------------------------------------------------------------------------- |
| Lernen | Erklärt Knoten/Konzepte und bietet Flow-Beispiele zum Lernen.                    |
| Lösung | Bietet verschiedene IoT-Lösungen mit Flow-JSON und Knoten-Installationsanleitungen. |
| Integration | Unterstützt Protokoll-/Software-Integration und generiert entsprechende Flows.     |
| Entwicklung | Optimiert bestehende Flows und Funktionsknoten-Code.                              |
| Konfiguration | Leitet Node-RED-Konfigurationsänderungen (z.B. `settings.js`).                    |
| Verwaltung | Unterstützt Remote-Zugriff, Git-Integration und Massen-Deployment.                     |

## Unterstützte KI-Provider


| Provider | Modelle                                 | Eigenschaften                |
| --------- | --------------------------------------- | ----------------------------- |
| OpenAI    | GPT-3.5, GPT-4, GPT-4o                 | Allzweck, breite Kompatibilität |
| Anthropic | Claude-3, Claude-3.5                    | Erweiterte Reasoning, Sicherheitsfokus |
| Google    | Gemini Pro, Gemini Flash                | Multimodal, hohe Performance   |
| DeepSeek  | deepseek-chat, deepseek-coder           | Kostengünstig, Coding-Fokus |
| Andere     | Alle von LangChain.js unterstützten LLM-Provider | Hohe Skalierbarkeit, flexible Konfiguration |

## API-Konfiguration

- API-Schlüssel werden lokal mit Verschlüsselung gespeichert.
- Unterstützt Multi-Provider-Konfiguration.
- Einfaches Wechseln zwischen verschiedenen Providern und Modellen.
- Separate Modellkonfiguration für Planungs- und Ausführungsphasen.

## Entwicklung

### Projektstruktur

```
├── ai-sidebar.html          # Haupt-Seitenleisten-Interface
├── ai-sidebar-config.json   # UI-Konfiguration
├── make-iot-smart.html      # Knoten-Konfigurationsvorlage
├── make-iot-smart.js        # Knoten-Backend-Implementierung
├── lib/
│   ├── langchain-manager.js # Haupt-LangChain-Manager
│   ├── memory-manager.js    # SQLite-Speicherverwaltung
│   └── scenario-manager.js  # Szenario-basiertes Prompt-Management
├── config/
│   └── scenarios.json       # Szenario-Konfigurationsdatei
├── data/
│   └── memory.db           # SQLite-Datenbankdatei
└── package.json            # Paketkonfiguration
```

### Technische Architektur

Dieses Projekt basiert auf dem **LangChain.js**-Framework und verwendet ein modulares Architekturdesign:

- **LangChain Manager**: Kern-KI-Modellverwaltung, unterstützt mehrere LLM-Provider
- **Memory Manager**: Intelligentes SQLite-basiertes Speichersystem, unterstützt Kurz- und Langzeitspeicher
- **Scenario Manager**: Szenario-basiertes Prompt-Management, unterstützt JSON-Konfiguration und dynamische Parameter
- **Tool Manager**: Einheitliches Tool-Management-Framework, integriert MCP-Tools und eingebaute Tools
- **API Layer**: RESTful API-Interface, unterstützt Streaming-Chat und Tool-Ausführung

### Beitrag zum Projekt

1. Forken Sie das Repository.
2. Erstellen Sie einen Feature-Branch.
3. Nehmen Sie Änderungen vor und committen Sie sie.
4. Senden Sie einen Pull Request.

## Roadmap

### Phase 1 (Abgeschlossen)

- ✅ KI-Assistenten-Integration
- ✅ Multi-Provider-Unterstützung
- ✅ Interaktive Seitenleiste
- ✅ Konfigurationsverwaltung
- ✅ Szenario-basierte Unterstützung
- ✅ LangChain.js-Architektur-Migration
- ✅ SQLite-Speicherverwaltungssystem
- ✅ MCP-Tool-Integration
- ✅ Einheitliches Tool-Management-Framework

### Phase 2 (Geplant)

- 🔄 Remote-Debugging-Funktionen
- 🔄 Team-Kollaborationsfunktionen
- 🔄 Erweiterte Flow-Analyse
- 🔄 Intelligente Deployment-Tools

### Phase 3 (Zukunft)

- 📋 Team-Management-System
- 📋 Enterprise-Funktionen
- 📋 Erweiterte Sicherheitsoptionen
- 📋 Benutzerdefiniertes Modelltraining

## Systemanforderungen

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## Lizenz

Lizenziert unter der MIT-Lizenz. Siehe [LICENSE](LICENSE)-Datei für Details.

## Support
KI-Entwicklung ist eher eine Kunst als eine Technologie, und die Beherrschung von LLMs ist keine einfache Aufgabe, die ein tiefes Verständnis von KI-Modellen, Daten und Anwendungsszenarien erfordert. Jede Q&A-Sitzung kann unterschiedliche Ergebnisse liefern, und frühe Versionen sind oft unbefriedigend, aber durch Verbesserungen im Prompt Engineering werden sie allmählich die täglichen Bedürfnisse der Node-RED-Benutzer erfüllen, seien es IT- oder OT-Ingenieure. Wir laden mehr interessierte Personen ein, sich dem Projekt anzuschließen.
- **Probleme melden**: [GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **Dokumentation**: [Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **Diskussionen**: [GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## Autor

**Zheng He**
- Email: jhe.zheng@gmail.com
- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)
- Website: [https://www.makeiotsmart.com](https://www.makeiotsmart.com)
---

*Machen Sie die IoT-Entwicklung intelligenter mit KI-Unterstützung!*

---