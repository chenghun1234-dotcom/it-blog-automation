# 8개월 묵은 골칫덩이, GitHub 이슈 분석기! Copilot이 BugWhisperer로 환골탈태시킨 비법 대공개

안녕하세요, 10년 차 개발자이자 테크 블로거, 시므란입니다. 오늘은 제가 8개월 동안 방치했던 프로젝트를 GitHub Copilot 덕분에 마침내 완성한 이야기를 공유하려 합니다. 이름하여 `BugWhisperer`! 개발팀의 고질적인 문제였던 GitHub 이슈 관리의 번거로움을 AI의 힘으로 해결해 줄 멋진 도구입니다.

**GitHub 저장소:** [https://github.com/SimranShaikh20/BugWhisperer](https://github.com/SimranShaikh20/BugWhisperer)
**라이브 데모:** [https://bugwhisperer.msusimran20.workers.dev](https://bugwhisperer.msusimran20.workers.dev)

---

## 2025년 9월, 제가 포기했던 그 프로젝트

8개월 전으로 거슬러 올라갑니다. 저희 개발팀은 3개의 저장소에 걸쳐 60개 이상의 GitHub 이슈를 열어둔 채 허우적대고 있었습니다. 솔직히 뭘 먼저 고쳐야 할지 아무도 몰랐죠. 매번 스프린트 플래닝 미팅은 45분짜리 우선순위 논쟁으로 변질되기 일쑤였습니다. 저는 문득 이런 생각을 했어요. '스크립트 하나가 모든 이슈를 읽고 가장 중요한 게 뭔지 알려주면 어떨까?'

그래서 바로 코딩을 시작했습니다. 그날의 코드는 이게 전부였습니다.

```python
import requests
import os

# TODO: fix this later
GITHUB_TOKEN = "put_your_token_here"

def get_issues(repo):
    # this doesnt work properly
    url = f"https://api.github.com/repos/{repo}/issues"
    r = requests.get(url)
    print(r)  # just printing for now
    # TODO: parse response properly

def analyze_issue(issue):
    # wanted to use openai here but ran out of time
    pass

def main():
    repo = "facebook/react"  # hardcoded lol
    get_issues(repo)
    # analyze_issue() # commented out, broken
    print("done?")

main()
```

네, 맞습니다. 이게 다였습니다. `print(r)`로 응답 객체만 달랑 출력하고, `analyze_issue` 함수는 말 그대로 아무것도 하지 않았죠. 심지어 저장소 URL은 하드코딩되어 있었고요. 제가 실무에서 이런 식으로 아이디어를 끄적이다가도, 생각보다 복잡한 인증이나 데이터 파싱 단계에서 '아, 이건 내 역량 밖인가?' 하고 좌절했던 경험이 한두 번이 아닙니다.

2025년 9월 15일, 제 커밋 메시지는 이랬습니다.

> *"initial attempt - giving up for now, too complicated"*
>
> *"첫 시도 - 너무 복잡해서 일단 포기"*

그리고 그 후 8개월 동안, 이 저장소는 말 그대로 방치되었습니다.

---
![Add link](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uu3ffvqtfjvl9wk45k9m.png)


![Sprint](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6p6mahfcpytypug4p8rc.png)
## 왜 다시 돌아왔을까?

GitHub Finish-Up-A-Thon 챌린지 공고를 본 순간, 이 프로젝트가 가장 먼저 떠올랐습니다. 사실 아이디어 자체는 늘 유효하다고 생각했거든요. 문제는 진짜였고, 해결책의 방향도 맞았습니다. 다만 그때는 어려운 부분을 헤쳐나갈 적절한 도구나 충분한 시간이 없었을 뿐이죠.

이번에는 달랐습니다. 제게는 **GitHub Copilot**이 있었으니까요.

---

## 무엇을 만들었나 — 그 후의 이야기

BugWhisperer는 이제 AI 기반의 완벽한 GitHub 이슈 커맨드 센터로 거듭났습니다.

**어떤 GitHub 저장소 URL이든 붙여넣기만 하면 → 몇 초 만에 모든 열린 이슈에 대한 AI 트리아지(Triage) 분석을 받아볼 수 있습니다.**

지금은 이런 기능들을 제공합니다.

### 모든 이슈에 대한 AI 분석
모든 열린 이슈는 Groq의 Llama 3.1 AI에 의해 분석되며, 다음 정보를 제공합니다.
-   **근본 원인(Root Cause)** — 이 이슈를 유발하는 주된 원인
-   **제안된 해결책(Suggested Fix)** — 평이한 영어로 된 구체적이고 실행 가능한 해결책
-   **복잡도(Complexity)** — 낮음 / 중간 / 높음
-   **우선순위(Priority)** — 낮음 / 중간 / 높음 / 긴급

### 칸반 우선순위 보드
지루한 목록 대신, 이슈들을 4개의 시각적인 칸반 보드로 정리했습니다.
-   🔴 **긴급(Critical)** — 즉시 해결해야 할 문제
-   🟠 **높음(High)** — 이번 스프린트에서 처리
-   🟡 **중간(Medium)** — 다음 스프린트에서 처리
-   🟢 **낮음(Low)** — 백로그

### AI 스프린트 플래너
단 한 번의 클릭으로 2주간의 완벽한 스프린트 계획을 생성합니다. 예상 소요 시간, 권장 팀 규모, 주별 세부 계획까지 제공하죠.

### 마크다운으로 내보내기
전체 분석 내용을 `.md` 파일로 다운로드할 수 있습니다. GitHub Wiki, Notion, Linear 등에 즉시 붙여넣어 활용해 보세요.

### GitHub에 분석 결과 게시
AI 분석 결과를 특정 GitHub 이슈에 서식화된 댓글로 바로 게시할 수 있습니다. 복사-붙여넣기 없이, 앱을 벗어날 필요도 없습니다.

---

## GitHub Copilot이 이걸 가능하게 한 방법

이건 Copilot이 저에게 실제로 어떤 도움을 주었는지에 대한 솔직한 이야기입니다. 단순히 "놀라웠어요!"가 아니라, 제가 막혔던 특정 순간들을 풀어준 방식에 집중했습니다.

### 순간 1: 제 망가진 코드를 이해하다

오래된 `main.py` 파일을 VS Code에서 Copilot과 함께 열고 이렇게 입력했습니다.

> *"What is this code trying to do and what is broken?"*
>
> *"이 코드가 무엇을 하려고 했고, 무엇이 문제인가요?"*

Copilot은 즉시 답을 해주었습니다.
-   GitHub API 호출에 인증 헤더가 없었음 (8개월 전에 제가 겪었던 무응답 오류의 원인)
-   응답을 제대로 파싱하지 않았음 — `print(r)`은 데이터가 아닌 응답 객체 자체를 출력했을 뿐
-   `analyze_issue` 함수는 완전히 비어 있었음

그리고 곧바로 올바른 인증, 페이지네이션, 에러 처리 기능을 갖춘 완성된 GitHub API 호출 코드를 제안해주더군요. 8개월 전에 일주일 동안 헤매던 문제를 Copilot은 단 2분 만에 설명하고 해결해 주었습니다. 솔직히 이 부분에서 저도 감탄했습니다. 마치 시니어 개발자가 제 옆에 앉아서 코드를 봐주는 기분이었죠.

### 순간 2: LLM에서 안정적인 JSON 얻기

가장 어려웠던 기술적 문제는 AI 모델로부터 구조화된 JSON 출력을 안정적으로 얻어내는 것이었습니다. 시도할 때마다 모델은 JSON 주변에 마크다운 펜스를 추가하거나, 설명 텍스트를 붙이거나, 심지어는 포맷 자체를 망가뜨리곤 했습니다.

이 문제를 Copilot에게 설명했고, Copilot은 이 문제를 완벽하게 해결해 줄 시스템 프롬프트 패턴을 작성해 주었습니다.

```json
You are a senior software engineer analyzing GitHub issues.
Respond ONLY in valid JSON format.
No other text. No markdown. No explanation. Just JSON.

{
  "root_cause": "...",
  "suggested_fix": "...",
  "complexity": "Low or Medium or High",
  "priority": "Low or Medium or High or Critical"
}
```

Copilot이 알려준 핵심은 "No other text. No markdown. No explanation." 이 부분이 단순히 "respond in JSON format."이라고 말하는 것보다 훨씬 안정적이라는 것이었습니다. 이 하나의 통찰력 덕분에 아마 3시간 정도의 프롬프트 디버깅 시간을 절약할 수 있었을 겁니다. LLM 프롬프트는 작은 표현 하나로 결과가 천차만별인데, 이런 디테일을 짚어주는 게 정말 큰 도움이 됩니다.

### 순간 3: 칸반 보드 컴포넌트

이전에 칸반 보드를 만들어 본 적이 없었습니다. Copilot에게 이렇게 물어봤죠.

> *"Write a React component that takes an array of issues each with a priority field and displays them in 4 columns: Critical, High, Medium, Low"*
>
> *"우선순위 필드를 가진 이슈 배열을 받아 Critical, High, Medium, Low 네 개의 컬럼으로 표시하는 React 컴포넌트를 작성해 줘"*

그러자 단 한 번의 응답으로 완전히 작동하는 컴포넌트를 작성해 주었습니다. 저는 그저 제 데이터를 연결하기만 하면 됐죠. 새로운 UI 컴포넌트를 이렇게 쉽게 만들 수 있다니, 개발 시간을 획기적으로 줄여주는 경험이었습니다.

### 순간 4: 스프린트 플래너 프롬프트

분석된 모든 이슈를 바탕으로 2주간의 스프린트 계획을 생성하고 싶다고 설명했습니다. Copilot은 완전한 AI 프롬프트, API 호출, JSON 파싱 코드를 작성해 주었고, 심지어 제가 생각지도 못했던 `team_size_recommended` 필드를 추가할 것을 제안하기도 했습니다. 그 하나의 제안으로 기능이 훨씬 더 유용해졌습니다.

---

## 기술 아키텍처

```markdown
사용자 입력 (GitHub URL)
        ↓
Cloudflare Worker
        ↓
GitHub REST API → 열린 이슈 가져오기 (인증됨)
        ↓
Groq API (Llama 3.1 8b instant) → 각 이슈 분석
        ↓
반환: root_cause, suggested_fix, complexity, priority
        ↓
React 프런트엔드 → 칸반 보드
        ↓
선택 사항: 스프린트 플래너 (두 번째 Groq 호출)
선택 사항: 마크다운 보고서 내보내기
선택 사항: GitHub에 댓글로 게시
```

### 기술 스택

| 레이어    | 기술                             |
|---------|--------------------------------|
| 프런트엔드 | React + TanStack + Tailwind CSS |
| 백엔드    | Cloudflare Workers (서버리스)     |
| AI      | Groq API — llama-3.1-8b-instant |
| GitHub  | GitHub REST API v3             |
| 호스팅    | Cloudflare Workers (무료 티어)   |

### 왜 OpenAI가 아니라 Groq를 선택했을까?

속도와 비용 때문입니다. Groq의 추론 속도는 정말 놀랍습니다. 10개의 이슈를 분석하는 데 총 8초 정도밖에 걸리지 않습니다. 무료 티어로 하루 14,400개의 요청을 보낼 수 있는데, 이는 충분하고도 남는 수준이죠. OpenAI는 비용이 발생하지만, Groq는 무료입니다. 모든 개발자가 접근할 수 있는 도구를 만들려면, 무료가 최고죠. 실제 프로젝트에서는 이런 비용과 성능 최적화가 핵심 의사결정 요소가 됩니다.

### 왜 Cloudflare Workers를 선택했을까?

Lovable은 기본적으로 Cloudflare Workers에 맞게 TanStack 프로젝트를 구성해 줍니다. 전 세계 에지(Edge) 배포 덕분에 앱이 어디서든 빠르게 로드됩니다. 그리고 무료 티어는 하루 100,000개의 요청을 커버하는데, 이것 역시 충분합니다. 개발자 경험도 훌륭해서 빠르게 배포하고 테스트하기 좋았습니다.

---

## 전과 후 요약 비교

|             | 2025년 9월              | 2026년 6월                        |
|-------------|-------------------------|-----------------------------------|
| 코드        | 47줄의 망가진 Python 코드 | 완전한 React + Cloudflare 앱       |
| UI          | 터미널 전용             | 아름다운 다크 웹 인터페이스         |
| AI          | `pass` — 말 그대로 비어있음 | Groq Llama 3.1 분석               |
| GitHub      | 하드코딩된 `facebook/react` | 모든 공개 저장소 URL               |
| 분석        | 없음                    | 근본 원인, 해결책, 복잡도, 우선순위 |
| 계획        | 없음                    | AI 2주 스프린트 플래너            |
| 내보내기    | 없음                    | 원클릭 마크다운 보고서            |
| 배포        | 성공적으로 실행된 적 없음 | workers.dev에서 라이브              |
| 비용        | $0 (아무것도 안 함)     | $0 (모든 API 무료)                |

---

## 무엇을 배웠는가

**1. GitHub Copilot은 지식 격차를 메우는 데 최고다**

저는 칸반 보드를 만드는 방법을 몰랐습니다. LLM에서 구조화된 JSON을 강제하기 위한 최고의 프롬프트 패턴도 몰랐죠. Cloudflare Workers가 Node.js와 다르게 환경 변수를 읽는 방식도 몰랐습니다. Copilot은 이 모든 격차를 즉시 채워주었습니다. 앱 전체를 대신 작성해 준 것이 아니라, 제가 막혔던 정확한 질문에 답함으로써 말이죠. 마치 옆에 유능한 시니어 개발자 튜터가 앉아있는 것과 같았습니다.

**2. 오래된 아이디어도 종종 좋은 아이디어다**

2025년 9월의 제 스크립트는 올바른 아이디어를 담고 있었습니다. 문제는 진짜였고, 해결책의 방향도 옳았죠. 그저 시간, 더 나은 도구, 그리고 어려운 부분을 밀어붙일 동기가 필요했을 뿐입니다. 오래된 프로젝트를 삭제하지 마세요. 그것들은 종종 문제에 가장 가까이 있던 시기의 가장 좋은 생각을 담고 있을 때가 많습니다.

**3. 제약은 더 나은 설계를 강요한다**

무료 API만 사용해야 한다는 제약은 저를 효율적으로 만들었습니다. 분석당 300 토큰으로 제한하고 가장 빠른 모델을 사용함으로써 앱은 즉각적인 반응성을 보여주었죠. 만약 무제한 예산이 있었다면, 저는 더 느리고 더 비싼 것을 만들었을지도 모릅니다. 때로는 제약이 창의성을 폭발시키고 더 실용적인 결과물을 만들어냅니다.

**4. 계획보다 중요한 것은 '완성'이다**

BugWhisperer v2는 2025년 9월에 제가 Python 스크립트를 작성했을 때 상상했던 것과는 전혀 다릅니다. CLI 스크립트가 아닌 웹 앱이고, OpenAI 대신 Groq를 사용하며, 제 노트북이 아닌 Cloudflare에서 실행됩니다. 모든 구현 세부 사항이 바뀌었습니다. 하지만 핵심 아이디어 — 개발자들이 GitHub 이슈를 더 빠르게 이해하도록 돕는 것 — 는 정확히 그대로 유지되었죠. 계획이 아니라 '아이디어' 자체를 세상에 내놓는 것이 중요합니다.

---

## 직접 사용해보세요!

👉 **라이브 데모:** [https://bugwhisperer.msusimran20.workers.dev](https://bugwhisperer.msusimran20.workers.dev)

아래 저장소들로 테스트해보세요. 물론 여러분이 작업하는 모든 공개 GitHub 저장소도 좋습니다.
-   `https://github.com/fastapi/fastapi`
-   `https://github.com/requests/requests`
-   `https://github.com/psf/black`

**GitHub 저장소:** [https://github.com/SimranShaikh20/BugWhisperer](https://github.com/SimranShaikh20/BugWhisperer)

---

## 다음 계획은?

-   비공개 저장소 지원 (사용자가 직접 토큰 제공)
-   GitHub Actions 통합 — 새 이슈 생성 시 자동 분석
-   '긴급(Critical)' 우선순위 이슈에 대한 Slack 알림
-   VS Code 확장 프로그램
-   다중 저장소 비교 분석 기능

---

이 프로젝트가 여러분의 방치된 사이드 프로젝트에 대해 다시 생각해보는 계기가 되었다면, 리액션 하나 남겨주세요! 여러분의 반응은 이 프로젝트를 세상에 알리는 데 큰 힘이 되고, 저를 계속 빌드하게 하는 동기가 됩니다.

만약 어딘가에 완성되지 않은 프로젝트가 잠들어 있다면, 이 챌린지가 바로 여러분이 마침내 그것을 완성할 때라는 신호입니다. 여러분이 포기했던 그 아이디어는 아마 여러분이 기억하는 것보다 훨씬 더 좋을 거예요. 🚀

---

* [GitHub Finish-Up-A-Thon Challenge](https://dev.to/challenges/github-finish-up-a-thon)를 위해 제작되었습니다.
* Groq AI + GitHub Copilot + Cloudflare Workers의 힘으로 구동됩니다.

---
원문: [https://dev.to/simranshaikh20_50/bugwhisperer-how-i-finally-finished-my-abandoned-github-issue-analyzer-8-months-later-with-4ll8](https://dev.to/simranshaikh20_50/bugwhisperer-how-i-finally-finished-my-abandoned-github-issue-analyzer-8-months-later-with-4ll8)
수집일: 2026-05-31 02:04:52
