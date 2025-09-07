# Node-RED Make IoT Smart

## 🌐 언어 | Languages

[English](README.md) | [中文](README_ZH.md) | [Deutsch](README_DE.md) | [Español](README_ES.md) | [Français](README_FR.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Português](README_PT.md) | [Русский](README_RU.md) | [繁體中文](README_TW.md)

---

IoT 개발을 더 스마트하고 효율적으로 만드는 Node-RED용 강력한 AI 어시스턴트입니다. **LangChain.js** 프레임워크를 기반으로 구축되었으며, 모듈러 아키텍처 설계, 다중 LLM 제공업체 지원, 지능형 메모리 관리 및 포괄적인 도구 통합을 제공합니다.

[![npm version](https://badge.fury.io/js/node-red-make-iot-smart.svg)](https://badge.fury.io/js/node-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)

## 개요

Node-RED Make IoT Smart는 Node-RED 개발자를 위해 특별히 설계된 지능형 어시스턴트입니다. 고급 AI 기능을 통합하여 다음을 도와줍니다:

- **Node-RED를 더 빠르게 학습** - 대화형 튜토리얼과 스마트 가이던스
- **플로우를 더 효율적으로 개발** - AI 지원 코드 생성 및 최적화
- **복잡한 IoT 과제 해결** - 전문가 솔루션 추천
- **다양한 시스템을 원활하게 통합** - 지능형 프로토콜 처리
- **프로젝트를 더 잘 관리** - 자동화된 계획 및 모범 사례

## 기능

### AI 어시스턴트
- 🤖 **다중 LLM 지원**: OpenAI, Anthropic, Google, Ollama 등과 호환
- 💬 **대화형 채팅 인터페이스**: 원활한 AI 상호작용을 위한 직관적인 사이드바
- 🧠 **지능형 메모리**: 컨텍스트 인식 대화를 위한 SQLite 기반 메모리 시스템
- 🔧 **도구 통합**: 포괄적인 MCP(Model Context Protocol) 도구 지원
- 🎯 **시나리오 기반 지원**: 다양한 개발 요구사항을 위한 전문 모드

### 개발 도구
- 📝 **플로우 생성**: AI 지원 Node-RED 플로우 생성 및 최적화
- 🔍 **코드 분석**: 지능형 플로우 디버깅 및 성능 최적화
- 🔗 **시스템 통합**: 장치 및 API 통합을 위한 전문가 가이던스
- 📚 **학습 지원**: 대화형 튜토리얼 및 모범 사례 추천
- ⚙️ **구성 관리**: 자동화된 시스템 설정 및 최적화

### 향후 기능
- 🌐 **원격 디버깅**: 분산 시스템을 위한 고급 디버깅 기능
- 👥 **팀 협업**: 공유 작업공간이 있는 다중 사용자 지원
- 📊 **고급 분석**: 심층 플로우 분석 및 성능 인사이트
- 🚀 **스마트 배포**: 지능형 배포 도구 및 환경 관리

## 설치

### 방법 1: Node-RED Palette Manager를 통한 설치

1. 브라우저에서 Node-RED 열기
2. 메뉴 → 팔레트 관리로 이동
3. "설치" 탭 클릭
4. `node-red-make-iot-smart` 검색
5. "설치" 클릭

### 방법 2: npm을 통한 설치

```bash
npm install node-red-make-iot-smart
```

### 방법 3: 소스에서 설치

```bash
git clone https://github.com/jimmyfreecoding/node-red-make-iot-smart.git
cd node-red-make-iot-smart
npm install
npm link
cd ~/.node-red
npm link node-red-make-iot-smart
```

## 구성

### 기본 설정

1. **노드 추가**: 팔레트에서 "Make IoT Smart" 노드를 플로우로 드래그
2. **AI 제공업체 구성**: 노드를 더블클릭하여 구성 열기
3. **API 키 설정**: LLM 제공업체의 API 키 입력
4. **모델 선택**: 필요에 적합한 모델 선택
5. **배포**: 배포 버튼을 클릭하여 활성화

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 기여

기여를 환영합니다! 자세한 내용은 [기여 가이드라인](CONTRIBUTING.md)을 읽어주세요.

## 지원

- 📖 [문서](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- 🐛 [이슈 보고](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- 💬 [토론](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

---

**Node-RED 커뮤니티를 위해 ❤️로 개발됨**