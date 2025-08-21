# Discord Utility Bot

>  디스코드 테스트 서버에서 API 상태를 확인하거나 봇 상태를 점검하는 데 유용한 유틸리티 봇입니다.

개인 개발 용도로 사용하기 좋은 디스코드 유틸리티 봇입니다.  
봇의 상태를 확인하거나, 웹사이트 및 API 엔드포인트의 응답 상태를 체크하는 기능을 제공합니다.

---

## 주요 기능

이 봇은 다음과 같은 **슬래시 명령어**를 지원합니다.

| 명령어 | 설명 |
| --- | --- |
| `/help` | 사용 가능한 모든 명령어 목록을 표시합니다. |
| `/status` | 현재 봇 상태, API 핑, 시스템 정보(가동 시간, 메모리 사용량 등)를 출력합니다. |
| `/site` | 특정 웹사이트 URL을 입력받아 HTTP 상태 코드, 응답 시간, Content-Type 등을 확인합니다. |
| `/api_check` | 지정된 HTTP 메서드와 URL로 API 요청을 보내고, 상태 및 응답 시간을 확인합니다.<br>요청 본문과 Content-Type도 지정 가능 |

---

## 설치 및 설정

### 1) 전제 조건

- **Node.js 18+** (권장: Node.js 20+)
- [Discord 개발자 포털](https://discord.com/developers/applications)에서 봇 생성 후 **Bot Token**과 **Client ID** 발급
- 봇을 사용할 서버의 **Guild ID** 필요

### 2) 환경 변수 설정

프로젝트 루트 디렉토리에 .env 파일을 생성하고 다음 내용을 입력합니다.

`.env` 내용 예시:

```env
TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=YOUR_CLIENT_ID
GUILD_ID=YOUR_GUILD_ID
```

### 3) 의존성 설치 및 실행

```bash
# 의존성 설치
npm install

# 봇 실행
node index.js
```

---

## 명령어 사용법

### `/help`

> 사용 가능한 명령어 목록 표시

**사용 예:**

```
/help
```

### `/status`

> 봇과 시스템의 현재 상태 출력

**사용 예:**

```
/status
```

### `/site`

> 웹사이트 응답 상태 확인 (HTTP 상태 코드, 응답 시간 등)

**사용 예:**

```
/site url:https://example.com
```

### `/api_check`

> 다양한 HTTP 요청을 보내고 API 응답 상태 확인

**옵션 설명:**

- `method`: GET, POST, PUT, DELETE, PATCH 중 선택
- `url`: 테스트할 API URL
- `body`: POST/PUT 요청 시 JSON 문자열
- `content_type`: 요청 본문의 Content-Type (기본값: `application/json`)

**사용 예:**

```
/api_check method:POST url:https://httpbin.org/post body:{"name":"test"}
```

---

## 프로젝트 구조

```
.
├── commands/            # 슬래시 명령어 모듈
│   ├── help.js
│   ├── status.js
│   ├── site.js
│   └── api_check.js
├── config/
│   └── envConfig.js     # .env 로딩 및 검증
├── utils/               # 공통 유틸리티
│   ├── format.js
│   └── request.js
├── index.js             # 메인 봇 실행 파일
├── registerCommands.js  # 명령어 등록 스크립트
├── .env                 # 환경 변수
├── .eslint.config.js    # ESLint 설정 파일
├── prettier.config.js   # Prettier 설정 파일
└── README.md
```

---

## 라이선스

이 프로젝트는 **MIT License**를 따릅니다.
