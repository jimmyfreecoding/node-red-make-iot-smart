# LangChain 엔드투엔드 테스트

이 디렉토리에는 프론트엔드 사용자 입력부터 LLM 응답까지의 전체 프로세스를 검증하는 완전한 LangChain 아키텍처 엔드투엔드 테스트 스크립트가 포함되어 있습니다.

## 📁 파일 구조

```
test/
├── end-to-end-langchain-test.js    # 메인 테스트 스크립트
├── run-e2e-test.js                 # 테스트 실행 스크립트
├── .env.example                    # 환경 설정 예제
├── .env                           # 실제 환경 설정 (생성 필요)
├── test-results/                  # 테스트 결과 디렉토리
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # 이 문서
```

## 🚀 빠른 시작

### 1. 환경 설정

첫 실행 전에 환경 변수를 설정해야 합니다:

```bash
# 환경 설정 예제 복사
cp .env.example .env

# .env 파일을 편집하여 필요한 설정 수행
# 특히 OPENAI_API_KEY (실제 LLM 호출을 테스트하는 경우)
```

### 2. 테스트 실행

```bash
# 완전한 엔드투엔드 테스트 실행
node run-e2e-test.js

# 환경 설정만 확인
node run-e2e-test.js --check

# 실제 LLM 호출 활성화 (유효한 API 키 필요)
node run-e2e-test.js --real-llm

# 웹 서버 포트 지정
node run-e2e-test.js --port 8080

# 상세 출력 모드
node run-e2e-test.js --verbose
```

### 3. 테스트 리포트 보기

테스트 완료 후, 테스트 리포트를 표시하는 웹 서버가 자동으로 시작됩니다:

- 기본 접속 URL: http://localhost:3001
- API 엔드포인트: http://localhost:3001/api/test-results

## 📊 테스트 내용

### 테스트 언어

테스트는 다음 7개 언어를 커버합니다:
- 중국어 (zh-CN)
- 영어 (en-US) 
- 일본어 (ja)
- 한국어 (ko)
- 스페인어 (es-ES)
- 포르투갈어 (pt-BR)
- 프랑스어 (fr)

### 테스트 케이스

각 언어에는 5개의 테스트 케이스가 포함됩니다:

1. **get-flow 도구 트리거** - "현재 플로우" 키워드 테스트
2. **get-node-info 도구 트리거** - "현재 노드" 키워드 테스트
3. **get-settings 도구 트리거** - "현재 설정" 키워드 테스트
4. **get-diagnostics 도구 트리거** - "현재 진단" 키워드 테스트
5. **자연어 대화** - "Node-RED 소개" 테스트 (도구 트리거 없음)

### 기록되는 주요 정보

각 테스트 케이스는 다음 정보를 기록합니다:

- **a. 사용자 입력 텍스트** - 페이지에서 사용자가 입력한 시뮬레이션된 원본 텍스트
- **b. 감지된 키워드** - LangChain이 수신하고 식별한 키워드
- **c. 도구 호출 판정** - 시스템이 도구를 호출할지 여부의 결정
- **d. 도구 유형과 반환 내용** - 호출된 구체적인 도구와 그 반환 결과
- **e. LLM에 전송되는 연결된 newHuman 프롬프트** - LLM에 전송되는 최종 사용자 프롬프트
- **f. LLM에 전송되는 시스템 프롬프트** - 시스템 레벨 프롬프트
- **g. LLM 응답** - 대규모 언어 모델의 응답 결과

## 🔧 환경 변수 설명

### 필수 설정

```bash
# OpenAI API 키 (실제 LLM 호출용)
OPENAI_API_KEY=your_openai_api_key_here

# Node-RED 환경 시뮬레이션
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### 선택적 설정

```bash
# LLM 제공자 설정
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# 웹 서버 포트
TEST_WEB_PORT=3001

# 실제 LLM 호출 활성화 여부
ENABLE_REAL_LLM_CALLS=false

# 디버그 설정
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 테스트 리포트

### 웹 리포트

테스트 완료 후 생성되는 HTML 리포트에는 다음이 포함됩니다:

- **테스트 개요** - 전체적인 통계 정보
- **언어별 테이블** - 각 언어의 상세한 테스트 결과
- **상태 표시** - 성공/실패 상태
- **반응형 디자인** - 다양한 화면 크기에 대응

### JSON 데이터

원시 테스트 데이터는 JSON 형식으로 저장되며, 다음 용도로 사용할 수 있습니다:

- 자동화 분석
- CI/CD 파이프라인 통합
- 커스텀 리포트 생성

## 🛠️ 기술 아키텍처

### 테스트 프로세스

1. **환경 초기화** - 설정, 의존성, 환경 변수 확인
2. **프론트엔드 시뮬레이션** - 사용자 입력과 키워드 감지 시뮬레이션
3. **백엔드 처리** - LangChain Manager를 호출하여 요청 처리
4. **도구 실행** - 관련 도구의 시뮬레이션 또는 실제 실행
5. **LLM 상호작용** - 프롬프트 구성과 LLM 응답 획득
6. **결과 기록** - 완전한 처리 체인 정보 저장
7. **리포트 생성** - 웹 리포트와 JSON 데이터 생성

### 시뮬레이션 컴포넌트

- **Mock Node-RED** - Node-RED 실행 환경 시뮬레이션
- **Mock Tools** - 도구 실행 결과 시뮬레이션
- **Mock LLM** - 선택적 LLM 응답 시뮬레이션

## 🔍 문제 해결

### 일반적인 문제

1. **환경 변수가 설정되지 않음**
   ```bash
   # .env 파일이 존재하고 올바르게 설정되었는지 확인
   node run-e2e-test.js --check
   ```

2. **의존성 부족**
   ```bash
   # 필요한 의존성 설치
   npm install express dotenv
   ```

3. **유효하지 않은 API 키**
   ```bash
   # 시뮬레이션 모드로 테스트
   node run-e2e-test.js
   # 또는 ENABLE_REAL_LLM_CALLS=false 설정
   ```

4. **포트가 사용 중**
   ```bash
   # 다른 포트 지정
   node run-e2e-test.js --port 8080
   ```

### 디버그 모드

```bash
# 상세 출력 활성화
node run-e2e-test.js --verbose

# 또는 .env에서 설정
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 확장 개발

### 새로운 언어 추가

1. `TEST_CONFIG.languages`에 언어 코드 추가
2. `TEST_CONFIG.testCases`에 해당하는 테스트 케이스 추가
3. 해당 언어 설정 파일이 존재하는지 확인

### 새로운 테스트 케이스 추가

```javascript
// 해당 언어의 테스트 케이스에 추가
{ 
    keyword: '새로운 키워드', 
    expectedTool: 'new-tool', 
    description: '새로운 테스트 케이스 설명' 
}
```

### 커스텀 도구 시뮬레이션

`executeTestCase` 함수의 `mockToolResults` 객체에 새로운 도구의 시뮬레이션 결과를 추가합니다.

## 📄 라이선스

이 테스트 스크립트는 메인 프로젝트와 동일한 라이선스를 따릅니다.

## 🤝 기여

테스트 스크립트 개선을 위한 Issue나 Pull Request 제출을 환영합니다!

---

**참고**: 이 테스트 스크립트는 `LANGCHAIN_ARCHITECTURE.md` 문서에서 설명된 아키텍처 설계를 기반으로 하며, 완전한 사용자 상호작용 프로세스의 테스트 커버리지를 보장합니다.