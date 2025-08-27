# LangChain 아키텍처 문서

## 개요

이 프로젝트는 LangChain.js 프레임워크를 기반으로 한 지능형 Node-RED AI 어시스턴트 시스템을 구축하며, 다국어, 다시나리오, 다도구 지능형 대화 기능을 지원하는 모듈러 아키텍처 설계를 채택합니다. 시스템은 프론트엔드 키워드 감지, 백엔드 도구 호출, 스트리밍 응답 처리를 통해 전문적인 Node-RED 개발 지원을 제공합니다.

## 전체 아키텍처 다이어그램

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   프론트엔드    │    │   백엔드         │    │   외부 서비스   │
│       UI        │    │   처리           │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ 사용자 입력 │ │    │ │ HTTP 라우트  │ │    │ │ LLM         │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ 프로바이더  │ │
│        │        │    │        │         │    │ │ (OpenAI 등) │ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ │ 키워드      │ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ 감지        │ │    │ │ Manager      │ │    │ │ MCP 도구    │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ 서버        │ │
│        │        │    │        │         │    │ └─────────────┘ │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ 메시지      │ │────┼────────┼─────────┼────┤                 │
│ │ 구축        │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ 도구         │ │    │                 │
│ │ 스트리밍    │ │    │ │ 매니저       │ │    │                 │
│ │ 응답 처리   │ │    │ └──────────────┘ │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
└─────────────────┘    │ ┌──────────────┐ │    │                 │
                       │ │ 메모리       │ │    │                 │
                       │ │ 매니저       │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## 엔드투엔드 프로세스 개요

### 프로세스 플로우 다이어그램

```
사용자 텍스트 입력
     │
     ▼
프론트엔드 키워드 감지 ──────┐
     │                       │
     ▼                       ▼
숨겨진 휴먼 프롬프트 구축    시나리오 설정 가져오기
     │                       │
     ▼                       │
HTTP 요청 전송 ◄──────────────┘
     │
     ▼
LangChain 매니저
     │
     ▼
도구 트리거 감지 ──────┐
     │                 │
     ▼                 ▼
실행 모드 선택        도구 타입 판단
     │                 │
     ├─────────────────┼─── 내장 도구
     │                 │
     │                 └─── MCP 도구
     ▼
도구 실행 및 결과 병합
     │
     ▼
새로운 휴먼 프롬프트 구성
     │
     ▼
LLM 호출 (지정 언어)
     │
     ▼
스트리밍 응답 반환
```

## 핵심 컴포넌트 세부사항

### 1. 프론트엔드 키워드 감지 시스템

#### 설정 소스
프론트엔드는 다음 API를 통해 키워드 설정을 가져옵니다:
```javascript
// 현재 언어의 시나리오 설정 가져오기
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### 감지 로직
`ai-sidebar.html`의 `detectKeywords` 함수에 위치:

```javascript
async function detectKeywords(message) {
    // 1. 현재 언어 설정 가져오기
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. 모든 시나리오 키워드 설정 반복
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

#### 특수 키워드 처리
시스템은 특정 키워드에 대해 특별한 처리를 수행합니다:

1. **"current flow" / "현재 플로우"**:
   - 자동으로 `development` 시나리오로 전환
   - `get-flow` 도구 호출 프롬프트 구축
   - 현재 선택된 플로우 ID 전달

2. **"current node" / "현재 노드"**:
   - 자동으로 `development` 시나리오로 전환
   - `get-node-info` 도구 호출 프롬프트 구축
   - 선택된 노드의 상세 정보 전달

### 2. LangChain 매니저 (`lib/langchain-manager.js`)

#### 주요 책임
- LLM 프로바이더 관리 (OpenAI, DeepSeek, Anthropic, Google)
- 도구 호출 조정
- 시나리오 관리
- 스트리밍 응답 처리
- 메모리 관리 통합

#### 주요 메서드

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
    
    // 도구 트리거 감지
    detectToolTrigger(message)
    
    // 강제 도구 모드 판단
    shouldForceToolMode(message, scenario, dynamicData)
    
    // 순수 LLM 스트리밍 채팅
    executePureLLMChatStream(message, options, onChunk)
    
    // 시나리오 기반 스트리밍 채팅
    executeScenarioChatStream(message, options, onChunk)
}
```

#### 도구 트리거 감지 메커니즘

1. **직접 도구 호출 형식**:
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **키워드 트리거**:
   - `shouldForceToolMode` 메서드를 통한 감지
   - 다국어 설정 키워드 매핑 기반
   - 매개변수 추출 및 도구 추론 지원

### 3. 도구 관리 시스템

#### 도구 분류

**내장 도구**:
- `search_memory`: 메모리 검색
- `get_user_preferences`: 사용자 설정 가져오기
- `get_flow_templates`: 플로우 템플릿 가져오기
- `get-flow`: Node-RED 플로우 데이터 가져오기 (`global.RED`에 직접 액세스)
- `get-node-info`: Node-RED 노드 정보 가져오기 (`global.RED`에 직접 액세스)

**MCP 도구**:
- `get-settings`: Node-RED 설정 가져오기
- `get-diagnostics`: 진단 정보 가져오기
- MCP 프로토콜을 통해 제공되는 기타 도구

#### 도구 선택 로직

```javascript
// 특수 도구 직접 실행
if (toolName === 'get-node-info') {
    // Node-RED API 직접 사용
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // MCP 매개변수 구축
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // 기타 도구는 제공된 매개변수 사용
    mcpArgs = toolTrigger.args;
}
```

### 4. 메모리 관리 시스템 (`lib/memory-manager.js`)

#### 데이터베이스 구조

```sql
-- 단기 메모리 (세션 기록)
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 장기 메모리 (사용자 설정, 지식 베이스)
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

#### 메모리 검색 메커니즘
- 세션 ID 기반 컨텍스트 검색
- 의미적 유사성 검색
- 자동 만료 정리

### 5. 다국어 지원 시스템

#### 설정 구조
시나리오 설정 파일은 `locales/{lang}/scenarios.json`에 위치:

```json
{
  "scenarios": {
    "development": {
      "name": "개발",
      "description": "Node-RED 플로우 개발 및 디버깅",
      "systemPrompt": "당신은 전문적인 Node-RED 개발 어시스턴트입니다...",
      "keywords": [
        {
          "key": ["current config", "현재 설정"],
          "scenario": "development",
          "newHumanPrompt": "get-settings 도구를 사용하여 현재 Node-RED 설정 정보를 가져온 다음 설정 상태를 분석해주세요.\n\n사용자의 원래 요청: "
        }
      ]
    }
  }
}
```

#### 언어 지정 메커니즘
도구 실행 후 시스템은 다음 방법으로 LLM 응답 언어를 지정합니다:

```javascript
const explanationPrompt = `다음 정보를 바탕으로 사용자의 질문에 답해주세요:

사용자 요청: ${userMessage}

도구 실행 결과:
${result}

위의 Node-RED 플로우 데이터에 대해 ${this.getLanguageMapping(this.language)}로 전문적인 분석과 설명을 제공해주세요...`;
```

언어 매핑 테이블:
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': '중국어',
        'en-US': '영어',
        'ja': '일본어',
        'ko': '한국어',
        'es-ES': '스페인어',
        'pt-BR': '포르투갈어',
        'fr': '프랑스어'
    };
    return mapping[lang] || '영어';
}
```

## 사용자 채팅 플로우 세부사항

### 완전한 엔드투엔드 프로세스

#### 1. 프론트엔드 메시지 전송 단계

**사용자 입력 처리**:
- 사용자가 AI 사이드바에서 메시지 입력
- 시스템이 현재 선택된 플로우 및 노드 정보 가져오기
- 설정 노드 상태 및 배포 상태 확인

**키워드 감지 및 메시지 전처리**:
```javascript
// 특수 키워드 처리
if (sendMessage.includes('current flow') || sendMessage.includes('현재 플로우')) {
    // 자동으로 개발 시나리오로 전환
    currentScenario = 'development';
    
    // get-flow 도구 호출 프롬프트 구축
    const promptTemplate = "get-flow 도구를 사용하여 플로우 인수:{\"id\":\"{flowId}\"}의 플로우 데이터를 가져온 다음 이 플로우의 기능, 노드 연결, 작동 원리를 분석하고 설명해주세요.\n\n사용자의 원래 요청: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// 일반 키워드 감지
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. HTTP 요청 구성

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

#### 3. 백엔드 라우트 처리

**요청 수신** (`make-iot-smart.js`):
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // SSE 응답 헤더 설정
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**설정 노드 가져오기**:
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: '설정 노드를 찾을 수 없습니다' });
}
```

**언어 및 데이터 준비**:
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

#### 4. LangChain 매니저 처리 단계

**시나리오 감지**:
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**도구 호출 판단**:

1. **직접 도구 트리거 감지**:
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // 직접 도구 실행
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **키워드 강제 도구 모드**:
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // 도구 호출 모드 진입
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

#### 5. 실행 모드 선택

**순수 LLM 모드**:
- 세션 컨텍스트 가져오기
- 시나리오 프롬프트 구축
- 직접 LLM 호출로 응답 생성

**도구 호출 모드**:
- 도구 타입 결정 (내장 vs MCP)
- 도구 호출 실행
- 도구 결과 병합
- 설명 프롬프트 구축
- LLM 호출하여 자연어 설명

#### 6. 도구 호출 실행 단계

**사용 가능한 도구 타입**:

1. **내장 도구**:
   - `get-flow`: `global.RED.nodes.getFlows()`에 직접 액세스
   - `get-node-info`: `global.RED.nodes`에 직접 액세스
   - `search_memory`: 메모리 검색
   - `get_user_preferences`: 사용자 설정

2. **MCP 도구**:
   - `get-settings`: Node-RED 설정
   - `get-diagnostics`: 진단 정보
   - 기타 확장 도구

**도구 실행 플로우**:
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // 내장 도구: 직접 실행
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // MCP 도구: MCP 클라이언트를 통해 실행
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // 도구 결과 전송
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // 설명 프롬프트 구축
    const explanationPrompt = `다음 정보를 바탕으로 사용자의 질문에 답해주세요:\n\n사용자 요청: ${userMessage}\n\n도구 실행 결과:\n${result}\n\n위의 Node-RED 플로우 데이터에 대해 ${this.getLanguageMapping(this.language)}로 전문적인 분석과 설명을 제공해주세요...`;
    
    // LLM 호출하여 설명
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**특수 도구 처리**:

1. **get-flow 도구**:
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **get-settings 및 get-diagnostics 도구**:
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // 매개변수 불필요
}
```

#### 7. 스트리밍 응답 처리 단계

**이벤트 타입**:
- `token`: 텍스트 콘텐츠 조각
- `tool_call`: 도구 호출 정보
- `tool_result`: 도구 실행 결과
- `error`: 오류 정보
- `done`: 응답 완료

**데이터 플로우**:
```javascript
// 백엔드 전송
onChunk({ type: 'token', content: '부분 응답 콘텐츠' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// 프론트엔드 수신
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

**프론트엔드 스트리밍 처리**:
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // 하단으로 스크롤
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. 메모리 관리

**대화 저장**:
```javascript
// 사용자 메시지 저장
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// AI 응답 저장
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**세션 컨텍스트 관리**:
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**메모리 검색**:
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. 오류 처리 및 내결함성

**API 인증 오류**:
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: '유효하지 않은 API 키입니다. 설정을 확인해주세요' });
    }
}
```

**네트워크 오류**:
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `도구 호출에 실패했습니다: ${error.message}` });
    // 순수 LLM 모드로 폴백
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**도구 호출 오류**:
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `도구 ${toolName} 실행에 실패했습니다: ${result?.error || '알 수 없는 오류'}` 
    });
    return;
}
```

#### 10. 성능 최적화

**캐싱 메커니즘**:
```javascript
// LLM 인스턴스 캐싱
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // 새 인스턴스 생성 및 캐싱
}
```

**스트리밍 처리**:
```javascript
// 스트리밍 API를 사용하여 지연 시간 감소
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**비동기 처리**:
```javascript
// 여러 도구 호출의 병렬 처리
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. 다국어 지원

**시나리오 설정**:
- 각 언어가 독립적인 `scenarios.json` 설정 파일을 가짐
- 언어별 키워드 및 프롬프트 지원
- 자동 언어 감지 및 전환

**인터페이스 현지화**:
```javascript
// 현지화된 텍스트 가져오기
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. 보안 고려사항

**입력 검증**:
```javascript
// 메시지 길이 제한
if (message.length > 10000) {
    return res.status(400).json({ error: '메시지가 너무 깁니다' });
}

// 민감한 정보 필터링
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[편집됨]');
```

**API 키 보호**:
```javascript
// 설정 노드에서 암호화된 키 저장
const encryptedKey = RED.util.encryptCredentials(apiKey);

// 런타임 복호화
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**액세스 제어**:
```javascript
// 사용자 권한 확인
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: '권한이 부족합니다' });
}
```

### 요약

전체 엔드투엔드 프로세스는 사용자 입력부터 AI 응답까지의 완전한 파이프라인을 구현하며, 프론트엔드 키워드 감지, 백엔드 도구 호출, 스트리밍 응답 처리를 통해 지능형 Node-RED 개발 지원을 제공합니다. 시스템의 특징:

1. **지능성**: 자동 사용자 의도 감지, 적절한 도구 및 시나리오 선택
2. **다국어**: 여러 언어에서의 키워드 감지 및 응답 생성 지원
3. **확장성**: 모듈러 설계, 새로운 도구 및 시나리오 추가 용이
4. **고성능**: 스트리밍 처리, 캐싱 메커니즘, 비동기 실행
5. **보안**: 입력 검증, 키 보호, 권한 제어
6. **사용자 친화적**: 실시간 응답, 오류 처리, 컨텍스트 인식

## API 인터페이스 문서

### RESTful API 엔드포인트

```
POST /ai-sidebar/stream-chat       # 스트리밍 채팅
GET  /ai-sidebar/scenarios         # 시나리오 설정 가져오기
POST /ai-sidebar/execute-tool      # 도구 실행
GET  /ai-sidebar/memory-stats      # 메모리 통계
GET  /ai-sidebar/history/:sessionId # 세션 기록
POST /ai-sidebar/search            # 메모리 검색
GET  /ai-sidebar/templates         # 플로우 템플릿
```

### 요청/응답 형식

**스트리밍 채팅 요청**:
```json
{
  "message": "사용자 메시지",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "플로우 이름"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "노드 이름"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "ko"
}
```

**스트리밍 응답 형식**:
```
data: {"type": "token", "content": "부분"}
data: {"type": "token", "content": "응답"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## 설정 관리

### 환경 변수

```bash
# AI 프로바이더 설정
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# 데이터베이스 설정
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# MCP 설정
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Node-RED 설정 노드

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

## 확장 개발

### 새로운 LLM 프로바이더 추가

```javascript
// langchain-manager.js에 추가
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### 새로운 내장 도구 추가

```javascript
// initializeTools 메서드에 추가
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "사용자 정의 도구 설명",
    func: async (input) => {
        // 도구 구현 로직
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### 새로운 시나리오 설정 추가

`locales/{lang}/scenarios.json`에 추가:

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "사용자 정의 시나리오",
      "description": "시나리오 설명",
      "systemPrompt": "당신은 전문적인...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "도구를 사용해주세요...\n\n사용자의 원래 요청: "
        }
      ]
    }
  }
}
```

## 문제 해결

### 일반적인 문제

1. **도구 호출 실패**
   - MCP 서버 상태 확인
   - 도구 매개변수 형식 검증
   - 오류 로그 검토

2. **키워드 감지가 작동하지 않음**
   - 시나리오 설정 파일 존재 확인
   - 키워드 대소문자 구분 확인
   - 언어 설정 확인

3. **스트리밍 응답 중단**
   - 네트워크 연결 확인
   - API 키 검증
   - 브라우저 콘솔 오류 검토

### 디버그 모드

```bash
# 상세 로깅 활성화
DEBUG=langchain:*,mcp:* node-red

# 도구 호출 로깅 활성화
TOOL_DEBUG=true node-red
```

## 성능 최적화 권장사항

1. **캐싱 전략**
   - LLM 인스턴스 캐싱
   - 시나리오 설정 캐싱
   - 도구 결과 캐싱

2. **동시성 제어**
   - 동시 대화 수 제한
   - 도구 호출 큐 관리
   - 리소스 사용량 모니터링

3. **메모리 관리**
   - 만료된 세션의 정기적 정리
   - 기록 레코드 길이 제한
   - 메모리 사용량 모니터링

---

*이 문서는 실제 코드 구현을 기반으로 작성되었으며 프로젝트 업데이트와 함께 지속적으로 유지 관리됩니다*