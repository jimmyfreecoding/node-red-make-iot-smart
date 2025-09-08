# Node-RED Make IoT Smart

## 🌐 언어

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md) [![中文](https://img.shields.io/badge/lang-中文-red.svg)](README_ZH.md) [![Deutsch](https://img.shields.io/badge/lang-Deutsch-green.svg)](README_DE.md) [![Español](https://img.shields.io/badge/lang-Español-orange.svg)](README_ES.md) [![Français](https://img.shields.io/badge/lang-Français-purple.svg)](README_FR.md) [![日本語](https://img.shields.io/badge/lang-日本語-yellow.svg)](README_JA.md) [![한국어](https://img.shields.io/badge/lang-한국어-pink.svg)](README_KO.md) [![Português](https://img.shields.io/badge/lang-Português-cyan.svg)](README_PT.md) [![Русский](https://img.shields.io/badge/lang-Русский-brown.svg)](README_RU.md) [![繁體中文](https://img.shields.io/badge/lang-繁體中文-lightblue.svg)](README_TW.md)


---

Node-RED 전용으로 설계된 AI 어시스턴트 확장 기능으로, IoT 개발을 더욱 스마트하고 효율적으로 만듭니다.
[![npm version](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart.svg)](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)
## 개요

Node-RED Make IoT Smart는 Node-RED 개발 전용으로 설계된 포괄적인 AI 에이전트입니다. 지능적인 코드 지원, 자동화된 플로우 최적화, 스마트 디버깅 기능을 제공하여 IoT 개발 경험을 향상시킵니다. 이 확장 기능은 현재 학습, 솔루션, 통합, 개발, 구성, 관리의 6가지 주요 시나리오를 지원합니다.

## 기능

### 🤖 AI 어시스턴트

- **지능적 코드 제안**: Node-RED 플로우의 컨텍스트 인식 코드 추천.
- **스마트 플로우 분석**: 플로우를 분석하고 최적화 제안을 제공.
- **자연어 인터페이스**: 자연어 명령을 사용하여 Node-RED 환경과 상호작용.
- **다국어 지원**: 중국어, 영어, 일본어, 한국어 등을 지원. Node-RED의 언어 설정 변경에 따라 자동 적응.
- **멀티 프로바이더 지원**: LangChain.js 프레임워크 기반으로 OpenAI, Anthropic, Google, DeepSeek 등의 AI 모델을 지원.
- **지능적 메모리 관리**: SQLite 기반의 단기 및 장기 메모리 시스템, 대화 기록, 사용자 설정, 플로우 패턴 저장을 지원.
- **시나리오 기반 프롬프트**: JSON 구성을 통한 시나리오 기반 프롬프트 관리, 동적 매개변수 주입을 지원.
- **MCP 도구 통합**: Model Context Protocol(MCP) 도구 호출을 지원하여 AI 어시스턴트의 기능을 확장.


### 🔧 개발 도구

- **실시간 코드 분석**: Node-RED 플로우의 지속적인 분석.
- **구성 관리**: 다양한 AI 프로바이더의 중앙 집중식 API 구성.
- **대화형 사이드바**: Node-RED 에디터에 통합된 전용 AI 어시스턴트 패널.
- **JSON 에디터**: 구문 강조 기능이 있는 통합 구성 파일 에디터.
- **MCP 도구 통합**: Model Context Protocol(MCP) 도구 호출을 지원하여 AI 어시스턴트의 기능을 확장.
- **LangChain 도구 관리**: 통합 도구 관리 프레임워크, 내장 도구와 MCP 도구를 지원.
- **시나리오 기반 지원**: 7가지 주요 시나리오의 맞춤형 지원:
  - **학습**: 노드와 개념을 설명하고 샘플 플로우를 제공.
  - **솔루션**: 플로우 JSON과 노드 설치 가이드를 포함한 다양한 IoT 솔루션을 제공.
  - **통합**: 프로토콜(예: MQTT, Modbus) 및 소프트웨어 통합을 지원.
  - **개발**: 기존 플로우와 함수 노드 코드를 최적화.
  - **구성**: Node-RED 구성(예: `settings.js`) 변경을 안내.
  - **관리**: 원격 액세스, Git 통합, 배치 배포를 지원.

### 🚀 향후 기능

- **원격 디버깅**: Node-RED 플로우의 AI 지원 원격 디버깅.
- **팀 관리**: 팀 관리 기능이 있는 협업 개발.
- **고급 분석**: IoT 시스템 성능에 대한 깊은 통찰력.
- **지능적 배포**: AI 주도의 IoT 애플리케이션 배포 전략.

## 설치

### npm에서 설치

```bash
npm install @jhe.zheng/node-red-make-iot-smart
```

### Node-RED 팔레트 매니저에서 설치

1. Node-RED 에디터를 엽니다.
2. **메뉴 → 팔레트 관리**로 이동합니다.
3. `@jhe.zheng/node-red-make-iot-smart`를 검색합니다.
4. **설치**를 클릭합니다.
5. 설치 후 Node-RED를 재시작합니다.
6. 설치 후 Node-RED 사이드바에 새로운 **AI 어시스턴트** 탭이 나타납니다.
7. **설정** 버튼을 클릭하여 AI 프로바이더를 구성합니다.
8. 지원되는 프로바이더 중에서 선택합니다:
   - **DeepSeek**: 강력한 코딩 능력을 가진 비용 효율적인 옵션.
   - **OpenAI**: 업계를 선도하는 GPT 모델.
   - **Anthropic**: Claude 모델을 통한 고급 추론 능력.
9. API 키를 입력하고 적절한 모델을 선택합니다.
10. 구성 후 AI 어시스턴트 사용을 시작할 수 있습니다. 설정을 저장한 후 NodeRED가 자동으로 구성 노드를 생성한다는 점에 유의하세요. NodeRED는 플로우 변경 사항을 표시하고 병합을 클릭하기만 하면 됩니다.
11. AI 어시스턴트와의 상호작용을 시작하세요!

## 빠른 시작
### "현재 노드 분석"을 입력
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/current-node.gif" width="800" height="450" alt="데모 애니메이션" />


### "샘플 플로우 생성"을 입력
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/create-flow.gif" width="800" height="450" alt="데모 애니메이션" />

### "헬스 체크"를 입력
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/health-check.gif" width="800" height="450" alt="데모 애니메이션" />

## 구성

### LangSmith 디버깅 구성 (선택사항)

LangChain 실행의 더 나은 디버깅과 모니터링을 위해 LangSmith 지원을 구성할 수 있습니다:

1. `.env.example` 파일을 `.env`로 복사합니다:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일을 편집하여 LangSmith 구성을 입력합니다:
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_api_key_here
   LANGCHAIN_PROJECT=your_project_name
   ```

3. Node-RED를 재시작하여 구성을 적용합니다.

4. [LangSmith](https://smith.langchain.com/)에 액세스하여 자세한 실행 추적 및 디버깅 정보를 확인합니다.

**참고**: LangSmith 구성은 선택사항이며 기본 기능에 영향을 주지 않습니다.

## 사용법

### 기본 채팅 인터페이스

- **AI 어시스턴트** 사이드바 탭을 엽니다.
- 자연어로 질문이나 지시사항을 입력합니다.
- 코드 제안과 설명이 포함된 지능적인 답변을 받습니다.

### 시나리오 선택

- 사이드바의 드롭다운 메뉴에서 시나리오(학습, 솔루션, 통합, 개발, 구성, 관리)를 선택합니다.
- AI는 선택된 시나리오에 따라 답변을 조정하고 관련 도구와 플로우 JSON을 제공합니다.

### JSON/코드 처리

- 큰 JSON이나 코드 출력은 **JSON/코드 보기** 버튼 뒤에 숨겨져 UI를 깔끔하게 유지합니다.
- 구문 강조 기능이 있는 통합 에디터에서 플로우 JSON을 편집하고 변경 사항을 직접 적용합니다.

### 지원되는 시나리오

#### 시나리오 개요

| 시나리오 | 한국어명 | 설명 | 지원 도구 |
|----------|----------|------|----------|
| learning | 학습 모드 | Node-RED 학습 어시스턴트, 교육 가이드와 지식 답변을 제공 | get-flows, get-nodes, create-flow, update-flow |
| solution | 솔루션 모드 | IoT 솔루션 전문가, 기술 솔루션과 아키텍처 조언을 제공 | create-flow, update-flow, get-flows, create-subflow |
| integration | 통합 모드 | 시스템 통합 전문가, 장치 연결과 데이터 통합을 처리 | create-flow, update-flow, install-node, get-node-info |
| development | 개발 모드 | 코드 개발 어시스턴트, Node-RED 플로우 생성과 최적화를 지원 | create-flow, update-flow, create-subflow, get-node-info, install-node, get-flow |
| configuration | 구성 모드 | 시스템 구성 전문가, Node-RED 환경과 노드 구성을 관리 | get_settings, update_settings, install_node, get_node_info, get_diagnostics |
| management | 관리 모드 | 프로젝트 관리 어시스턴트, 플로우 조직과 프로젝트 계획을 지원 | get-flows, create-flow, update-flow, create-subflow |
| general | 일반 모드 | 일반 AI 어시스턴트, Node-RED 관련 다양한 질문을 처리 | 특정 도구 제한 없음 |

#### 사전 정의된 프롬프트 예시

| 시나리오 | 사전 정의된 프롬프트 |
|----------|-----------------------|
| **학습 모드** | • Node-RED는 처음입니다. Node-RED의 기본 개념과 주요 기능을 소개해 주세요<br>• Node-RED의 플로우, 노드, 연결에 대해 설명해 주세요<br>• Node-RED에서 첫 번째 간단한 플로우를 만들려면 어떻게 해야 하나요? 자세한 단계를 알려주세요<br>• Node-RED에서 자주 사용되는 주요 노드는 무엇인가요? 각각의 기능은 무엇인가요? |
| **솔루션 모드** | • 스마트 홈 제어 시스템을 설계해야 합니다. 완전한 IoT 솔루션 아키텍처를 제공해 주세요<br>• Node-RED를 사용하여 Industry 4.0 데이터 수집 및 모니터링 시스템을 구축하려면 어떻게 해야 하나요?<br>• 센서 데이터 수집과 자동 제어를 포함한 농업 IoT 솔루션을 설계해 주세요<br>• 스마트 시티 환경 모니터링 네트워크를 구축하고 싶은데, 어떤 기술 솔루션이 필요한가요? |
| **통합 모드** | • Node-RED에서 MQTT 장치와 HTTP API를 통합하려면 어떻게 해야 하나요? 자세한 통합 솔루션을 제공해 주세요<br>• Modbus 장치에서 센서 데이터를 클라우드 데이터베이스로 전송해야 합니다. 어떻게 구현하나요?<br>• JSON을 XML로 변환하여 제3자 시스템에 전송하는 데이터 변환 플로우 설계를 도와주세요<br>• Node-RED에서 다른 프로토콜을 가진 여러 장치의 통합 데이터 수집과 처리를 구현하려면 어떻게 해야 하나요? |
| **개발 모드** | • 현재 플로우의 자세한 설명과 해설<br>• 현재 노드의 자세한 설명과 해설<br>• 데이터 필터링과 형식 변환을 구현하는 Function 노드 코드 작성을 도와주세요<br>• Node-RED에서 사용자 정의 노드를 만들려면 어떻게 해야 하나요? 완전한 개발 절차를 알려주세요 |
| **구성 모드** | • 현재 NodeRED의 구성은 어떻게 되어 있나요?<br>• 현재 NodeRED의 진단은 어떻게 되어 있나요?<br>• 사용자 인증과 HTTPS를 포함한 Node-RED의 보안 구성을 설정하려면 어떻게 해야 하나요?<br>• Node-RED의 성능 구성을 최적화하여 시스템 실행 효율성을 향상시키는 것을 도와주세요<br>• Node-RED에서 제3자 노드 패키지를 설치하고 관리하려면 어떻게 해야 하나요?<br>• Node-RED의 로깅과 모니터링을 설정해야 합니다. 어떻게 구성해야 하나요? |
| **관리 모드** | • IoT 프로젝트의 개발 계획과 마일스톤 생성을 도와주세요<br>• Node-RED에서 대규모 프로젝트의 플로우 구조를 정리하고 관리하려면 어떻게 해야 하나요?<br>• 현재 프로젝트의 위험과 품질을 평가해야 합니다. 분석 권장사항을 제공해 주세요<br>• 팀 협업 Node-RED 개발 표준과 모범 사례를 수립하려면 어떻게 해야 하나요? |
| **일반 모드** | • Node-RED란 무엇인가요? 주요 특징과 응용 시나리오는 무엇인가요?<br>• Node-RED에서 문제가 발생했습니다. 분석과 해결책을 도와주세요<br>• Node-RED 학습 리소스와 모범 사례를 추천해 주세요<br>• 특정 요구사항을 해결하기 위해 적절한 Node-RED 시나리오 모드를 선택하려면 어떻게 해야 하나요? |

#### 키워드를 통한 지능적 활성화

| 시나리오 | 키워드 | 활성화 동작 |
|----------|--------|-------------|
| **개발 모드** | 플로우 생성, 플로우 생성, 플로우 만들기, 새 플로우 | 자동으로 개발 모드로 전환하여 완전한 Node-RED 플로우 JSON 코드를 생성하고 자세한 설명을 제공 |
| **구성 모드** | 현재 구성, 시스템 구성, 구성 정보, 구성, 현재 설정 | 자동으로 get_settings 도구를 호출하여 구성 정보를 가져와 테이블 형식으로 표시 |
| **구성 모드** | 현재 진단, 시스템 진단, 진단 정보, 헬스 체크 | 자동으로 get_diagnostics 도구를 호출하여 시스템 진단을 실행 |

#### 동적 입력 매개변수

모든 시나리오는 다음과 같은 동적 매개변수 주입을 지원합니다:
- `nodeRedVersion` - Node-RED 버전 정보
- `nodeVersion` - Node.js 버전 정보
- `currentTime` - 현재 타임스탬프
- `selectedFlow` - 현재 선택된 플로우
- `selectedNodes` - 현재 선택된 노드
- `lang` - 현재 언어 매개변수
- `mcpTools` - 사용 가능한 MCP 도구 목록

각 시나리오는 특정 동적 매개변수도 지원합니다:
- **학습 모드**: `userLevel`(사용자 기술 수준)
- **솔루션 모드**: `projectRequirements`(프로젝트 요구사항)
- **통합 모드**: `integrationTargets`(통합 대상)
- **개발 모드**: `developmentTask`(개발 작업)
- **구성 모드**: `configurationNeeds`(구성 요구사항)
- **관리 모드**: `projectStatus`(프로젝트 상태)

#### 시스템 프롬프트 특성

각 시나리오는 전문적인 시스템 프롬프트로 구성되어 AI 어시스턴트가 다음을 확실히 수행할 수 있습니다:
1. **역할 정의**: 특정 시나리오에서의 명확한 전문적 역할
2. **출력 형식**: 시나리오 요구사항에 따른 구조화된 답변 형식
3. **도구 통합**: 해당하는 MCP 도구와 Node-RED API의 지능적 호출
4. **컨텍스트 인식**: 동적 매개변수를 사용한 개인화된 추천


| 시나리오 | 설명                                                                    |
| --------- | ---------------------------------------------------------------------- |
| 학습 | 노드/개념을 설명하고 학습용 샘플 플로우를 제공.        |
| 솔루션 | 플로우 JSON과 노드 설치 가이드가 포함된 다양한 IoT 솔루션을 제공. |
| 통합 | 프로토콜/소프트웨어 통합을 지원하고 해당 플로우를 생성. |
| 개발 | 기존 플로우와 함수 노드 코드를 최적화.                      |
| 구성 | Node-RED 구성(예: `settings.js`) 변경을 안내.          |
| 관리 | 원격 액세스, Git 통합, 배치 배포를 지원.                 |

## 지원되는 AI 프로바이더


| 프로바이더 | 모델                                 | 특징                |
| --------- | --------------------------------------- | ------------------------------ |
| OpenAI    | GPT-3.5, GPT-4, GPT-4o                 | 범용, 광범위한 호환성 |
| Anthropic | Claude-3, Claude-3.5                    | 고급 추론, 안전성 중시 |
| Google    | Gemini Pro, Gemini Flash                | 멀티모달, 고성능   |
| DeepSeek  | deepseek-chat, deepseek-coder           | 비용 효율적, 코딩 중심 |
| 기타     | LangChain.js에서 지원하는 모든 LLM 프로바이더 | 높은 확장성, 유연한 구성 |

## API 구성

- API 키는 로컬에 암호화되어 저장됩니다.
- 여러 프로바이더 구성을 지원.
- 다양한 프로바이더와 모델 간의 쉬운 전환.
- 계획 단계와 실행 단계의 개별 모델 구성.

## 개발

### 프로젝트 구조

```
├── ai-sidebar.html          # 메인 사이드바 인터페이스
├── ai-sidebar-config.json   # UI 구성
├── make-iot-smart.html      # 노드 구성 템플릿
├── make-iot-smart.js        # 백엔드 노드 구현
├── lib/
│   ├── langchain-manager.js # 메인 LangChain 매니저
│   ├── memory-manager.js    # SQLite 메모리 관리
│   └── scenario-manager.js  # 시나리오 기반 프롬프트 관리
├── config/
│   └── scenarios.json       # 시나리오 구성 파일
├── data/
│   └── memory.db           # SQLite 데이터베이스 파일
└── package.json            # 패키지 구성
```

### 기술 아키텍처

이 프로젝트는 **LangChain.js** 프레임워크를 기반으로 하며 모듈러 아키텍처 설계를 사용합니다:

- **LangChain Manager**: 메인 AI 모델 관리, 여러 LLM 프로바이더를 지원
- **Memory Manager**: SQLite 기반의 지능적 메모리 시스템, 단기 및 장기 메모리를 지원
- **Scenario Manager**: 시나리오 기반 프롬프트 관리, JSON 구성과 동적 매개변수를 지원
- **Tool Manager**: 통합 도구 관리 프레임워크, MCP 도구와 내장 도구를 통합
- **API Layer**: RESTful API 인터페이스, 스트리밍 채팅과 도구 실행을 지원

### 기여

1. 저장소를 포크합니다.
2. 기능 브랜치를 생성합니다.
3. 변경 사항을 만들고 커밋합니다.
4. 풀 리퀘스트를 제출합니다.

## 로드맵

### 1단계 (완료)

- ✅ AI 어시스턴트 통합
- ✅ 멀티 프로바이더 지원
- ✅ 대화형 사이드바
- ✅ 구성 관리
- ✅ 시나리오 기반 지원
- ✅ LangChain.js 아키텍처 마이그레이션
- ✅ SQLite 메모리 관리 시스템
- ✅ MCP 도구 통합
- ✅ 통합 도구 관리 프레임워크

### 2단계 (예정)

- 🔄 원격 디버깅 기능
- 🔄 팀 협업 기능
- 🔄 고급 플로우 분석
- 🔄 지능적 배포 도구

### 3단계 (미래)

- 📋 팀 관리 시스템
- 📋 엔터프라이즈 기능
- 📋 고급 보안 옵션
- 📋 사용자 정의 모델 훈련

## 시스템 요구사항

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## 라이선스

MIT 라이선스 하에 라이선스가 부여됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 지원
AI 개발은 기술이라기보다는 예술이며, LLM을 마스터하는 것은 간단한 작업이 아니며 AI 모델, 데이터, 애플리케이션 시나리오에 대한 깊은 이해가 필요합니다. 각 Q&A 세션은 다른 결과를 생성할 수 있으며, 초기 버전은 종종 만족스럽지 않지만 프롬프트 엔지니어링의 개선을 통해 IT 엔지니어든 OT 엔지니어든 Node-RED 사용자의 일상적인 요구사항을 점진적으로 충족하게 됩니다. 더 많은 관심 있는 사람들이 프로젝트에 참여하는 것을 환영합니다.
- **문제 보고**: [GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **문서**: [Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **토론**: [GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## 작성자

**Zheng He**
- Email: jhe.zheng@gmail.com
- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)
- 웹사이트: [https://www.makeiotsmart.com](https://www.makeiotsmart.com)
---

*AI 지원으로 IoT 개발을 더욱 스마트하게 만들어보세요!*

---