# Документация архитектуры LangChain

## Обзор

Этот проект создает интеллектуальную систему AI-помощника Node-RED на основе фреймворка LangChain.js, используя модульный архитектурный дизайн, который поддерживает многоязычные, многосценарные и многоинструментальные функции интеллектуального диалога. Система обеспечивает профессиональную поддержку разработки Node-RED через распознавание ключевых слов на фронтенде, вызовы инструментов на бэкенде и обработку потоковых ответов.

## Общая архитектурная диаграмма

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Фронтенд      │    │   Бэкенд         │    │   Внешние       │
│       UI        │    │   Обработка      │    │   Сервисы       │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Пользователь│ │    │ │ HTTP-маршруты│ │    │ │ LLM-        │ │
│ │ ский ввод   │ │    │ └──────────────┘ │    │ │ провайдеры  │ │
│ └─────────────┘ │    │        │         │    │ │ (OpenAI,etc)│ │
│        │        │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ Распознава- │ │    │ │ Manager      │ │    │ │ MCP-Tool-   │ │
│ │ ние ключевых│ │    │ └──────────────┘ │    │ │ Server      │ │
│ │ слов        │ │    │        │         │    │ └─────────────┘ │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │        │         │    │                 │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ Создание    │ │────┼────────┼─────────┼────┤                 │
│ │ сообщений   │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Менеджер     │ │    │                 │
│ │ Обработка   │ │    │ │ инструментов │ │    │                 │
│ │ потоковых   │ │    │ └──────────────┘ │    │                 │
│ │ ответов     │ │    │        │         │    │                 │
│ └─────────────┘ │    │ ┌──────────────┐ │    │                 │
└─────────────────┘    │ │ Менеджер     │ │    │                 │
                       │ │ памяти       │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Обзор сквозного процесса

### Диаграмма процесса

```
Ввод текста пользователем
     │
     ▼
Распознавание ключевых слов на фронтенде ──────┐
     │                                          │
     ▼                                          ▼
Создание скрытого человеческого промпта        Получение конфигурации сценария
     │                                          │
     ▼                                          │
Отправка HTTP-запроса ◄────────────────────────┘
     │
     ▼
LangChain Manager
     │
     ▼
Обнаружение триггера инструмента ───────────────┐
     │                                           │
     ▼                                           ▼
Выбор режима выполнения                        Определение типа инструмента
     │                                           │
     ├───────────────────────────────────────────┼─── Встроенные инструменты
     │                                           │
     │                                           └─── MCP-инструменты
     ▼
Выполнение инструмента и слияние результатов
     │
     ▼
Создание нового человеческого промпта
     │
     ▼
Вызов LLM (указанный язык)
     │
     ▼
Возврат потокового ответа
```

## Детали основных компонентов

### 1. Система распознавания ключевых слов на фронтенде

#### Источник конфигурации
Фронтенд получает конфигурацию ключевых слов через следующий API:
```javascript
// Получение конфигурации сценария для текущего языка
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### Логика распознавания
Находится в функции `detectKeywords` в `ai-sidebar.html`:

```javascript
async function detectKeywords(message) {
    // 1. Получение конфигурации текущего языка
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. Перебор всех конфигураций ключевых слов сценариев
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

#### Специальная обработка ключевых слов
Система выполняет специальную обработку для определенных ключевых слов:

1. **"current flow" / "текущий поток"**:
   - Автоматически переключается на сценарий `development`
   - Создает промпт для вызова инструмента `get-flow`
   - Передает ID текущего выбранного потока

2. **"current node" / "текущий узел"**:
   - Автоматически переключается на сценарий `development`
   - Создает промпт для вызова инструмента `get-node-info`
   - Передает подробную информацию о выбранном узле

### 2. LangChain Manager (`lib/langchain-manager.js`)

#### Основные обязанности
- Управление провайдерами LLM (OpenAI, DeepSeek, Anthropic, Google)
- Координация вызовов инструментов
- Управление сценариями
- Обработка потоковых ответов
- Интеграция управления памятью

#### Основные методы

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
    
    // Обнаружение триггера инструмента
    detectToolTrigger(message)
    
    // Определение принудительного режима инструмента
    shouldForceToolMode(message, scenario, dynamicData)
    
    // Чистый потоковый чат LLM
    executePureLLMChatStream(message, options, onChunk)
    
    // Потоковый чат на основе сценария
    executeScenarioChatStream(message, options, onChunk)
}
```

#### Механизм обнаружения триггера инструмента

1. **Формат прямого вызова инструмента**:
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **Триггер ключевого слова**:
   - Обнаружение через метод `shouldForceToolMode`
   - Основано на многоязычном сопоставлении ключевых слов конфигурации
   - Поддержка извлечения параметров и вывода инструментов

### 3. Система управления инструментами

#### Классификация инструментов

**Встроенные инструменты**:
- `search_memory`: Поиск в памяти
- `get_user_preferences`: Получение пользовательских настроек
- `get_flow_templates`: Получение шаблонов потоков
- `get-flow`: Получение данных потока Node-RED (прямой доступ к `global.RED`)
- `get-node-info`: Получение информации об узле Node-RED (прямой доступ к `global.RED`)

**MCP-инструменты**:
- `get-settings`: Получение конфигурации Node-RED
- `get-diagnostics`: Получение диагностической информации
- Другие инструменты, предоставляемые через протокол MCP

#### Логика выбора инструмента

```javascript
// Прямое выполнение специальных инструментов
if (toolName === 'get-node-info') {
    // Прямое использование API Node-RED
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // Построение параметров MCP
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // Другие инструменты используют предоставленные параметры
    mcpArgs = toolTrigger.args;
}
```

### 4. Система управления памятью (`lib/memory-manager.js`)

#### Структура базы данных

```sql
-- Кратковременная память (история сессии)
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Долговременная память (пользовательские настройки, база знаний)
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

#### Механизм извлечения памяти
- Восстановление контекста на основе ID сессии
- Семантический поиск по сходству
- Автоматическая очистка по истечении срока

### 5. Система многоязычной поддержки

#### Структура конфигурации
Файлы конфигурации сценариев находятся в `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "development": {
      "name": "Разработка",
      "description": "Разработка и отладка потоков Node-RED",
      "systemPrompt": "Вы профессиональный помощник по разработке Node-RED...",
      "keywords": [
        {
          "key": ["current config", "текущая конфигурация"],
          "scenario": "development",
          "newHumanPrompt": "Используйте инструмент get-settings для получения текущей информации о конфигурации Node-RED, а затем проанализируйте состояние конфигурации.\n\nИсходный запрос пользователя: "
        }
      ]
    }
  }
}
```

#### Механизм спецификации языка
После выполнения инструмента система указывает язык ответа LLM следующим образом:

```javascript
const explanationPrompt = `Пожалуйста, ответьте на вопрос пользователя на основе следующей информации:

Запрос пользователя: ${userMessage}

Результат выполнения инструмента:
${result}

Пожалуйста, предоставьте профессиональный анализ и объяснение на ${this.getLanguageMapping(this.language)} приведенных выше данных потока Node-RED...`;
```

Таблица сопоставления языков:
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': 'китайском языке',
        'en-US': 'английском языке',
        'ja': 'японском языке',
        'ko': 'корейском языке',
        'es-ES': 'испанском языке',
        'pt-BR': 'португальском языке',
        'fr': 'французском языке',
        'de': 'немецком языке',
        'ru': 'русском языке'
    };
    return mapping[lang] || 'английском языке';
}
```

## Детали пользовательского чат-потока

### Полный сквозной процесс

#### 1. Этап отправки сообщения на фронтенде

**Обработка пользовательского ввода**:
- Пользователь вводит сообщение в боковой панели AI
- Система получает информацию о текущем выбранном потоке и узле
- Проверяет статус узла конфигурации и статус развертывания

**Распознавание ключевых слов и предварительная обработка сообщений**:
```javascript
// Специальная обработка ключевых слов
if (sendMessage.includes('current flow') || sendMessage.includes('текущий поток')) {
    // Автоматическое переключение на сценарий разработки
    currentScenario = 'development';
    
    // Построение промпта для вызова инструмента get-flow
    const promptTemplate = "Используйте инструмент get-flow для получения данных потока с параметрами:{\"id\":\"{flowId}\"}, а затем проанализируйте и объясните функциональность, соединения узлов и принципы работы этого потока.\n\nИсходный запрос пользователя: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// Общее распознавание ключевых слов
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. Составление HTTP-запроса

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

#### 3. Обработка маршрута на бэкенде

**Получение запроса** (`make-iot-smart.js`):
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // Конфигурация заголовков ответа SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**Получение узла конфигурации**:
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'Узел конфигурации не найден' });
}
```

**Подготовка языка и данных**:
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

#### 4. Этап обработки LangChain Manager

**Распознавание сценария**:
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Определение вызова инструмента**:

1. **Прямое обнаружение триггера инструмента**:
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // Прямое выполнение инструмента
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **Принудительный режим инструмента через ключевые слова**:
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // Вход в режим вызова инструмента
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

#### 5. Выбор режима выполнения

**Чистый режим LLM**:
- Получение контекста сессии
- Построение промпта сценария
- Прямой вызов LLM для генерации ответа

**Режим вызова инструмента**:
- Определение типа инструмента (встроенный vs MCP)
- Выполнение вызова инструмента
- Слияние результатов инструмента
- Построение промпта объяснения
- Вызов LLM для объяснения на естественном языке

#### 6. Этап выполнения вызова инструмента

**Доступные типы инструментов**:

1. **Встроенные инструменты**:
   - `get-flow`: Прямой доступ к `global.RED.nodes.getFlows()`
   - `get-node-info`: Прямой доступ к `global.RED.nodes`
   - `search_memory`: Поиск в памяти
   - `get_user_preferences`: Пользовательские настройки

2. **MCP-инструменты**:
   - `get-settings`: Конфигурация Node-RED
   - `get-diagnostics`: Диагностическая информация
   - Другие инструменты расширения

**Поток выполнения инструмента**:
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // Встроенный инструмент: прямое выполнение
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // MCP-инструмент: выполнение через MCP-клиент
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // Отправка результата инструмента
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // Построение промпта объяснения
    const explanationPrompt = `Пожалуйста, ответьте на вопрос пользователя на основе следующей информации:\n\nЗапрос пользователя: ${userMessage}\n\nРезультат выполнения инструмента:\n${result}\n\nПожалуйста, предоставьте профессиональный анализ и объяснение на ${this.getLanguageMapping(this.language)} приведенных выше данных потока Node-RED...`;
    
    // Вызов LLM для объяснения
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**Специальная обработка инструментов**:

1. **Инструмент get-flow**:
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **Инструменты get-settings и get-diagnostics**:
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // Параметры не требуются
}
```

#### 7. Этап обработки потокового ответа

**Типы событий**:
- `token`: Фрагмент текстового содержимого
- `tool_call`: Информация о вызове инструмента
- `tool_result`: Результат выполнения инструмента
- `error`: Информация об ошибке
- `done`: Ответ завершен

**Поток данных**:
```javascript
// Отправка с бэкенда
onChunk({ type: 'token', content: 'Частичное содержимое ответа' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// Получение на фронтенде
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

**Обработка потока на фронтенде**:
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // Прокрутка вниз
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. Управление памятью

**Сохранение разговора**:
```javascript
// Сохранение сообщения пользователя
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// Сохранение ответа AI
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**Управление контекстом сессии**:
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**Поиск в памяти**:
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. Обработка ошибок и отказоустойчивость

**Ошибки аутентификации API**:
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'Недействительный API-ключ. Пожалуйста, проверьте конфигурацию' });
    }
}
```

**Сетевые ошибки**:
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `Вызов инструмента не удался: ${error.message}` });
    // Откат к чистому режиму LLM
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Ошибки вызова инструмента**:
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `Выполнение инструмента ${toolName} не удалось: ${result?.error || 'Неизвестная ошибка'}` 
    });
    return;
}
```

#### 10. Оптимизация производительности

**Механизм кэширования**:
```javascript
// Кэш экземпляров LLM
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // Создание и кэширование нового экземпляра
}
```

**Потоковая обработка**:
```javascript
// Использование потокового API для снижения задержки
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**Асинхронная обработка**:
```javascript
// Параллельная обработка нескольких вызовов инструментов
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. Многоязычная поддержка

**Конфигурация сценария**:
- Каждый язык имеет свой независимый файл конфигурации `scenarios.json`
- Поддержка языкоспецифичных ключевых слов и промптов
- Автоматическое распознавание и переключение языка

**Локализация интерфейса**:
```javascript
// Получение локализованного текста
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. Соображения безопасности

**Валидация ввода**:
```javascript
// Ограничение длины сообщения
if (message.length > 10000) {
    return res.status(400).json({ error: 'Сообщение слишком длинное' });
}

// Фильтрация чувствительной информации
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[ОТРЕДАКТИРОВАНО]');
```

**Защита API-ключей**:
```javascript
// Сохранение зашифрованных ключей в узле конфигурации
const encryptedKey = RED.util.encryptCredentials(apiKey);

// Расшифровка во время выполнения
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**Контроль доступа**:
```javascript
// Проверка разрешений пользователя
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: 'Недостаточно разрешений' });
}
```

### Резюме

Весь сквозной процесс реализует полный конвейер от пользовательского ввода до ответа AI, обеспечивая интеллектуальную поддержку разработки Node-RED через распознавание ключевых слов на фронтенде, вызовы инструментов на бэкенде и обработку потоковых ответов. Характеристики системы:

1. **Интеллектуальность**: Автоматическое распознавание намерений пользователя, подходящий выбор инструментов и сценариев
2. **Многоязычность**: Поддержка распознавания ключевых слов и генерации ответов на нескольких языках
3. **Масштабируемость**: Модульный дизайн, легкое добавление новых инструментов и сценариев
4. **Высокая производительность**: Потоковая обработка, механизмы кэширования, асинхронное выполнение
5. **Безопасность**: Валидация ввода, защита ключей, контроль разрешений
6. **Удобство использования**: Ответы в реальном времени, обработка ошибок, распознавание контекста

## Документация API-интерфейса

### Конечные точки RESTful API

```
POST /ai-sidebar/stream-chat       # Потоковый чат
GET  /ai-sidebar/scenarios         # Получение конфигурации сценария
POST /ai-sidebar/execute-tool      # Выполнение инструмента
GET  /ai-sidebar/memory-stats      # Статистика памяти
GET  /ai-sidebar/history/:sessionId # История сессии
POST /ai-sidebar/search            # Поиск в памяти
GET  /ai-sidebar/templates         # Шаблоны потоков
```

### Форматы запросов/ответов

**Запрос потокового чата**:
```json
{
  "message": "Сообщение пользователя",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "Имя потока"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "Имя узла"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "ru"
}
```

**Формат потокового ответа**:
```
data: {"type": "token", "content": "Ответ"}
data: {"type": "token", "content": "частичный"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## Управление конфигурацией

### Переменные окружения

```bash
# Конфигурация AI-провайдеров
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# Конфигурация базы данных
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# Конфигурация MCP
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Узел конфигурации Node-RED

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

## Разработка расширений

### Добавление нового провайдера LLM

```javascript
// Добавить в langchain-manager.js
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### Добавление нового встроенного инструмента

```javascript
// Добавить в метод initializeTools
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "Описание пользовательского инструмента",
    func: async (input) => {
        // Логика реализации инструмента
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### Добавление новой конфигурации сценария

Добавить в `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "Пользовательский сценарий",
      "description": "Описание сценария",
      "systemPrompt": "Вы профессионал...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "Пожалуйста, используйте инструмент...\n\nИсходный запрос пользователя: "
        }
      ]
    }
  }
}
```

## Устранение неполадок

### Общие проблемы

1. **Ошибки вызова инструмента**
   - Проверить статус MCP-сервера
   - Валидировать формат параметров инструмента
   - Проверить журналы ошибок

2. **Распознавание ключевых слов не работает**
   - Подтвердить существование файла конфигурации сценария
   - Проверить регистр ключевых слов
   - Подтвердить конфигурацию языка

3. **Прерывание потокового ответа**
   - Проверить сетевое соединение
   - Валидировать API-ключ
   - Проверить ошибки в консоли браузера

### Режим отладки

```bash
# Включить подробное логирование
DEBUG=langchain:*,mcp:* node-red

# Включить логирование вызовов инструментов
TOOL_DEBUG=true node-red
```

## Рекомендации по оптимизации производительности

1. **Стратегии кэширования**
   - Кэш экземпляров LLM
   - Кэш конфигурации сценариев
   - Кэш результатов инструментов

2. **Контроль параллелизма**
   - Ограничение количества одновременных разговоров
   - Управление очередями вызовов инструментов
   - Мониторинг использования ресурсов

3. **Управление памятью**
   - Периодическая очистка истекших сессий
   - Ограничение длины записей истории
   - Мониторинг использования памяти

---

*Эта документация основана на фактической реализации кода и будет постоянно обновляться с обновлениями проекта*