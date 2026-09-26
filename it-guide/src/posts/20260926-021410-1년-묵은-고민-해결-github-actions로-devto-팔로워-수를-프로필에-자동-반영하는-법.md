# 1년 묵은 고민 해결! GitHub Actions로 DEV.to 팔로워 수를 프로필에 자동 반영하는 법

벌써 10년 차 개발자라면, 한 번쯤 시작했다가 서랍 속에 넣어둔 사이드 프로젝트가 있을 겁니다. 저에게는 바로 이 'DEV.to 팔로워 수를 GitHub 프로필에 표시하는 작은 자동화' 프로젝트가 그랬죠. 이걸 완성해서 DEV.to 친구들과 공유하려고 합니다!

---

사실 작년 이맘때쯤부터 시작했던 프로젝트인데, 여느 허접한 사이드 프로젝트들이 그렇듯, 얼마 못 가 구석으로 밀려났습니다. 하지만 이 녀석은 매일매일 제 이메일로 꾸준히 생존 신고를 해왔죠. "Github Actions 실행 실패..." 😂 이쯤 되면 그냥 다 지워버릴까 싶기도 했습니다. 하지만 왠지 모르게 그게 더 거슬리는 겁니다. '아니, 이걸 못 고친다고? 어떻게든 되게 만들어야지!' 하는 오기가 발동하더군요.

결국 작심하고 '귀찮은 이메일은 이제 그만!'을 외치며 고치기로 했습니다. API 호출 부분과 주석 처리했던 불필요한 코드를 살짝 손보니, 문제가 훨씬 명확해지기 시작했습니다. **제가 실무에서 자동화 스크립트를 많이 다루는데, 이런 자잘한 알림이 쌓이면 생각보다 스트레스거든요. 결국엔 시간을 내서라도 고쳐야 직성이 풀리는 게 개발자 특성인 것 같습니다.** 그 결과, 드디어 #343번 실행에서 첫 성공을 거뒀습니다! 저처럼 1년 내내 실패 이메일에 시달리지 않도록, 제가 완성한 GitHub Actions 워크플로우 코드를 아낌없이 공유해 드릴게요.

![dev followers count](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/nmxrs48upwfse5qronv6.png)

---

자, 이제 여러분이 찾던 바로 그 핵심 내용입니다!

## 핵심 코드: DEV.to 팔로워 수를 업데이트하는 GitHub Actions 워크플로우

GitHub Actions YAML 파일은 다음과 같습니다.

```yaml
name: Update DEV.to Followers Count

on:
  schedule:
    # 매일 자정 UTC에 실행
    - cron: '0 0 * * *'
  workflow_dispatch: # 수동으로 워크플로우를 실행할 수 있게 함

permissions:
  contents: write # README.md 파일을 수정하고 커밋할 권한 필요

jobs:
  update-count:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository # 레포지토리 체크아웃
        uses: actions/checkout@v4

      - name: Set up Node.js # Node.js 환경 설정 (v22 사용)
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Run the update script # 팔로워 업데이트 스크립트 실행
        env: # 환경 변수 설정
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }} # DEV.to API 키 (GitHub Secrets 사용)
          DEVTO_USERNAME: annavi11arrea1 # DEV.to 사용자 이름
        run: node update_script.js

      - name: Commit updated README # 변경된 README 커밋
        run: |
          if git diff --quiet -- README.md; then # 변경 사항이 없으면 종료
            echo "팔로워 수가 변경되지 않았습니다."
            exit 0
          fi
          git config user.name "github-actions[bot]" # 커밋 사용자 이름 설정
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com" # 커밋 사용자 이메일 설정
          git add README.md # README.md 파일 추가
          git commit -m "Update DEV.to follower count" # 커밋 메시지
          git push # 변경사항 푸시
```

### 몇 가지 중요한 참고 사항:

*   **API 키 보안:** `DEVTO_API_KEY`는 절대로 코드에 하드코딩하지 마세요! GitHub Secrets에 등록해서 환경 변수로 불러오는 방식이 가장 안전합니다. 이렇게 해야 DEV.to API를 무료로 계속 사용할 수 있는 특권을 유지할 수 있죠. 🦋
*   **README.md 위치 지정:** 팔로워 수가 출력될 `README.md` 내의 위치를 정확히 지정해 줘야 합니다. 특정 태그를 활용하면 되는데, 저는 아래와 같이 `<!-- DEVTO-FOLLOWERS-COUNT:START -->`와 `<!-- DEVTO-FOLLOWERS-COUNT:END -->` 태그를 사용했습니다.

<sub>스크롤해서 전체를 확인하세요. `_start_`와 `_end_` 태그가 보일 겁니다.</sub>
```html
<!-- DEVTO-FOLLOWERS-COUNT:START -->**34996** DEV.to followers<!-- DEVTO-FOLLOWERS-COUNT:END -->
```
**제가 실무에서 GitHub Actions를 처음 세팅할 때 `contents: write` 권한 설정을 빼먹어서 하루 종일 디버깅했던 기억이 생생합니다.** 작은 설정 하나가 전체 워크플로우를 멈출 수 있다는 걸 뼈저리게 느꼈죠. 이 부분은 꼭 잊지 마세요!

---

드디어 이 자동화가 완벽하게 작동한다니, 정말 짜릿합니다! 제 팔로워 수를 자랑하려는 의도는 아니지만, 이렇게 조용히(?) 다른 프로필에서 자기 PR을 하는 건 꽤나 유용하겠죠. 하하.

이번 프로젝트를 진행하며 깨달은 중요한 점은 `write` 권한을 정확히 부여하고, 작업이 실행될 때 변경 사항이 자동으로 푸시되도록 설정하는 것이었습니다. 이 두 가지가 실제 업데이트를 위한 핵심 요소더군요. 음, GitHub Actions로 또 어떤 멋진 자동화들을 만들 수 있을지 벌써부터 기대됩니다!

---

아, 이 자리를 빌려 이 아이디어를 상기시켜준 `@fm`님께 감사의 말씀을 전합니다! 덕분에 묵은 숙제를 해결했네요. 자, 그럼 이제 백그라운드에서 모든 작업을 처리하는 `update_script.js` 코드를 공개합니다! 😂

## 실제 로직: update_script.js

```javascript
const fs = require("fs"); // 파일 시스템 모듈
const https = require("https"); // HTTPS 요청 모듈

// 환경 변수 또는 기본값 설정
const DEVTO_API_KEY = process.env.DEVTO_API_KEY;
const DEVTO_USERNAME = process.env.DEVTO_USERNAME || "annavi11arrea1"; // DEV.to 사용자 이름
const README_FILE = "README.md"; // 업데이트할 README 파일명
const START_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:START -->"; // 시작 마커
const END_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:END -->"; // 종료 마커
const USER_AGENT = "AnnaVi11arrea1-GitHub-Actions"; // API 요청 시 User-Agent 헤더

// API 키 유효성 검사
if (!DEVTO_API_KEY) {
  throw new Error("DEVTO_API_KEY 환경 변수가 누락되었습니다. 반드시 설정해주세요.");
}

// API 응답 미리보기 파싱 (에러 메시지용)
const parseResponsePreview = (data) => {
  const trimmed = data.trim();
  return trimmed ? trimmed.slice(0, 500) : "<empty>";
};

// DEV.to API 호출 함수
const fetchJson = (path) => {
  const options = {
    hostname: "dev.to", // DEV.to 호스트명
    port: 443, // HTTPS 기본 포트
    path, // API 경로
    method: "GET", // GET 메서드
    headers: {
      "api-key": DEVTO_API_KEY, // API 키 헤더
      Accept: "application/vnd.forem.api-v1+json", // Accept 헤더
      "User-Agent": USER_AGENT, // User-Agent 헤더
    },
    timeout: 15000, // 타임아웃 15초
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) { // 응답 코드가 200이 아니면 에러 처리
          const preview = parseResponsePreview(data);
          reject(
            new Error(
              `DEV.to API 요청 실패 (${res.statusCode} ${res.statusMessage || "알 수 없음"}). 응답 미리보기: ${preview}`
            )
          );
          return;
        }

        try {
          resolve(JSON.parse(data)); // JSON 파싱
        } catch (error) {
          reject(new Error(`API 응답 파싱 실패. 응답 데이터: ${data}`));
        }
      });
    });

    req.on("timeout", () => req.destroy(new Error("DEV.to API 요청 시간 초과."))); // 타임아웃 에러
    req.on("error", reject); // 요청 에러
    req.end(); // 요청 종료
  });
};

// 팔로워 수 가져오기
const getFollowersCount = async () => {
  const perPage = 1000; // 페이지당 팔로워 수
  let page = 1; // 시작 페이지
  let totalCount = 0; // 총 팔로워 수

  while (true) { // 모든 팔로워를 가져올 때까지 반복
    const followers = await fetchJson(
      `/api/followers/users?page=${page}&per_page=${perPage}` // 팔로워 API 호출
    );

    if (!Array.isArray(followers)) { // 응답이 배열이 아니면 에러 처리
      throw new Error("DEV.to 팔로워 엔드포인트가 유효하지 않은 응답을 반환했습니다.");
    }

    totalCount += followers.length; // 현재 페이지 팔로워 수 추가

    if (followers.length < perPage) { // 더 이상 팔로워가 없으면 종료
      return totalCount;
    }

    page += 1; // 다음 페이지로 이동
  }
};

// README 파일 업데이트
const updateReadme = async () => {
  const count = await getFollowersCount(); // 팔로워 수 가져오기
  let readmeContent = fs.readFileSync(README_FILE, "utf8"); // README 파일 읽기
  const newContent = `${START_MARKER}**${count}** DEV.to followers${END_MARKER}`; // 새로운 내용 생성

  // 정규식을 이용해 기존 팔로워 수 부분 대체
  const regex = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, "g");
  readmeContent = readmeContent.replace(regex, newContent);

  fs.writeFileSync(README_FILE, readmeContent); // README 파일 쓰기
  console.log("새로운 팔로워 수로 README가 업데이트되었습니다:", count);
};

// 스크립트 실행
updateReadme().catch((error) => {
  console.error(error);
  process.exit(1); // 에러 발생 시 종료
});
```

---
원문: [https://dev.to/annavi11arrea1/sharing-dev-followers-count-on-github-profile-bj3](https://dev.to/annavi11arrea1/sharing-dev-followers-count-on-github-profile-bj3)
수집일: 2026-09-26 02:14:10
