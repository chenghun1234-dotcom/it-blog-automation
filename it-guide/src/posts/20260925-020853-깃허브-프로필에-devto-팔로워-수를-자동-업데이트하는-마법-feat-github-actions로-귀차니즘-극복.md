# 깃허브 프로필에 DEV.to 팔로워 수를 자동 업데이트하는 마법! (feat. GitHub Actions로 귀차니즘 극복)

안녕하세요, 10년 차 IT 실무자이자 테크 블로거 @AnnaVi11arrea1입니다. 오늘은 제가 깃허브 프로필 README에 DEV.to 팔로워 수를 자동으로 표시하는 작은 프로젝트를 완성한 이야기를 풀어볼까 합니다. 별것 아닌 것 같지만, 이걸 만지면서 겪었던 좌충우돌과 깨달음이 꽤나 흥미로웠어요.

사실 이 시덥잖은(?) 프로젝트는 작년에 시작했다가 다른 흔한 사이드 프로젝트처럼 흐지부지 잊혀 가고 있었습니다. 그런데 매일 아침 제 이메일함을 파고드는 한결같은 알림이 있었으니, 바로 "Run failed for Github Actions..." 😂 솔직히 처음엔 그러려니 하다가도 나중엔 오기가 생기더군요. 제가 실무에서 자동화 스크립트를 여러 번 다뤄봤을 때, 작은 오류 하나가 쌓여 큰 프로젝트 전체의 신뢰성을 떨어뜨릴 수 있다는 걸 몸소 경험했기에, 이 작은 이슈도 그냥 넘어갈 수 없었습니다. '아니, 이걸 못 고친다고? 무조건 되게 만들어야지!' 하는 오기가 발동한 거죠.

그렇게 오늘, 저는 짜증 나는 실패 메일들과 작별하기로 마음먹었습니다. API 호출 방식을 살짝 수정하고, 이전에 주석 처리해뒀던 불필요한 코드를 과감히 삭제하자, 신기하게도 모든 것이 명확해지더군요. 드디어 정상 작동하는 모습을 보며 쾌감을 느꼈습니다. 성공적인 343번째 실행은 저에게는 작은 승리의 증거였습니다.

제가 겪었던 1년 간의 귀찮은 메일 폭탄을 다른 분들은 경험하지 않도록, 제가 완성한 GitHub Actions 파일과 스크립트 전문을 이 글에서 모두 공유할 예정입니다. 여러분도 이 마법 같은 기능을 손쉽게 적용해 보세요!

![DEV.to 팔로워 수](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/nmxrs48upwfse5qronv6.png)

이게 바로 제 GitHub 프로필에 DEV.to 팔로워 수가 멋지게 자리 잡은 모습입니다. 마치 '나는 꾸준히 글을 쓰고 소통하는 개발자야!'라고 조용히 자랑하는 느낌이랄까요?

---

자, 이제 여러분이 가장 기다리셨을 핵심 내용입니다. GitHub Actions 워크플로를 설정하는 YAML 파일 전문을 공유합니다. 이 파일이 바로 모든 자동화의 엔진 역할을 합니다.

```yaml
name: Update DEV.to Followers Count

on:
  schedule:
    # Runs at midnight UTC daily
    - cron: '0 0 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update-count:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Run the update script
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
          DEVTO_USERNAME: annavi11arrea1
        run: node update_script.js

      - name: Commit updated README
        run: |
          if git diff --quiet -- README.md; then
            echo "Follower count has not changed."
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add README.md
          git commit -m "Update DEV.to follower count"
          git push
```

이 YAML 파일은 크게 세 부분으로 나뉩니다.
*   **`name`**: 워크플로의 이름입니다. 직관적으로 `Update DEV.to Followers Count`로 설정했죠.
*   **`on`**: 언제 이 워크플로가 실행될지를 정의합니다. 저는 매일 자정 UTC 기준으로 실행되도록 `schedule` 크론 표현식('0 0 * * *')을 사용했습니다. `workflow_dispatch`는 수동으로 워크플로를 트리거할 수 있게 해주는 옵션이라 테스트할 때 굉장히 유용합니다.
*   **`permissions`**: 이 워크플로가 어떤 권한을 가질지를 명시합니다. `contents: write`는 스크립트가 `README.md` 파일을 수정하고 커밋할 수 있도록 쓰기 권한을 부여하는 핵심 설정입니다. 이걸 빼먹으면 당연히 에러가 나겠죠.

다음은 실제 작업을 수행하는 `jobs` 섹션입니다.
*   **`update-count`**: 이 작업은 `ubuntu-latest` 환경에서 실행됩니다.
*   **`steps`**:
    *   **`Checkout repository`**: 먼저 현재 저장소를 워크플로 환경으로 가져옵니다. `actions/checkout@v4` 액션을 사용하면 간편합니다.
    *   **`Set up Node.js`**: 스크립트가 Node.js로 작성되었으니, Node.js 런타임을 설정해줍니다. 저는 안정적인 '22' 버전을 지정했습니다.
    *   **`Run the update script`**: 여기서 핵심 스크립트인 `update_script.js`를 실행합니다. 이때 `DEVTO_API_KEY`와 `DEVTO_USERNAME`을 환경 변수로 전달하는데, 보안을 위해 API 키는 GitHub Secrets에 저장해두고 `secrets.DEVTO_API_KEY` 형태로 불러오는 것이 중요합니다.
    *   **`Commit updated README`**: 스크립트가 `README.md`를 업데이트한 후, 변경 사항이 있을 경우에만 커밋하고 푸시합니다. `git diff --quiet -- README.md` 명령어로 변경 여부를 확인하는 센스가 돋보이죠? 변경 사항이 없으면 불필요한 커밋을 하지 않아도 됩니다. 그리고 GitHub Actions 봇의 이름과 이메일로 커밋하도록 설정해 깔끔하게 관리합니다.

몇 가지 중요한 주의사항과 팁이 있습니다. 이 부분을 놓치면 원하는 대로 작동하지 않거나 보안 문제가 발생할 수 있어요.

*   **API 키 보안**: `DEVTO_API_KEY`와 같은 민감한 정보는 절대 코드에 하드코딩해서는 안 됩니다. GitHub Actions의 `secrets` 기능을 활용해 환경 변수로 안전하게 관리하는 것이 필수입니다. 제가 실무에서 보안 감사를 맡았을 때 이런 하드코딩된 키 때문에 고생한 경험이 꽤 있어서, 환경 변수 사용을 늘 강조합니다. DEV API를 계속 무료로 사용하려면 이 점을 꼭 지켜야 합니다! 🦋
*   **README.md 태그 설정**: 스크립트가 팔로워 수를 어디에 삽입해야 할지 알려주기 위해 `README.md` 파일에 특정 태그를 넣어주어야 합니다. 저는 아래와 같이 `<!-- DEVTO-FOLLOWERS-COUNT:START -->`와 `<!-- DEVTO-FOLLOWERS-COUNT:END -->` 태그를 사용했습니다. 이 태그 사이에 팔로워 수가 자동으로 업데이트됩니다. 전체 태그를 정확히 복사해서 사용하세요.

```html
<!-- DEVTO-FOLLOWERS-COUNT:START -->**34996** DEV.to followers<!-- DEVTO-FOLLOWERS-COUNT:END -->
```

---

이 프로젝트가 제대로 작동하는 걸 보니 정말 짜릿하더군요! 제 팔로워 수를 굳이 대놓고 자랑하려는 건 아닙니다만, 이렇게 제 프로필 어딘가에 조용히 '나 이 정도쯤은 한다?'라고 과시하는 것도 나쁘지 않죠. 하하.

이번 작업을 통해 가장 중요하다고 느꼈던 점은 GitHub Actions에 `write` 권한을 정확히 부여하고, 업데이트된 내용을 자동으로 `push`하도록 설정하는 것이었습니다. 이 두 가지가 제대로 되어야 비로소 진정한 자동 업데이트가 이루어집니다. 이 경험을 통해 GitHub Actions의 무궁무진한 활용 가능성을 다시 한번 생각하게 됩니다. 과연 또 어떤 자동 업데이트를 구현할 수 있을까요? 아이디어가 샘솟는 기분입니다!

---

참, 이 스크립트를 완성하는 데 도움을 주신 @fm 님께 감사드립니다! 😉 그럼, `update_script.js` 파일의 전체 코드입니다. 이 코드가 DEV.to API를 호출하고 팔로워 수를 가져와 `README.md`를 업데이트하는 모든 로직을 담고 있습니다.

```javascript
const fs = require("fs");
const https = require("https");

const DEVTO_API_KEY = process.env.DEVTO_API_KEY;
const DEVTO_USERNAME = process.env.DEVTO_USERNAME || "annavi11arrea1";
const README_FILE = "README.md";
const START_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:START -->";
const END_MARKER = "<!-- DEVTO-FOLLOWERS-COUNT:END -->";
const USER_AGENT = "AnnaVi11arrea1-GitHub-Actions";

if (!DEVTO_API_KEY) {
  throw new Error("Missing required DEVTO_API_KEY environment variable.");
}

const parseResponsePreview = (data) => {
  const trimmed = data.trim();
  return trimmed ? trimmed.slice(0, 500) : "<empty>";
};

const fetchJson = (path) => {
  const options = {
    hostname: "dev.to",
    port: 443,
    path,
    method: "GET",
    headers: {
      "api-key": DEVTO_API_KEY,
      Accept: "application/vnd.forem.api-v1+json",
      "User-Agent": USER_AGENT,
    },
    timeout: 15000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          const preview = parseResponsePreview(data);
          reject(
            new Error(
              `DEV.to API request failed (${res.statusCode} ${res.statusMessage || "Unknown"}). Response preview: ${preview}`
            )
          );
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse API response. Response data: ${data}`));
        }
      });
    });

    req.on("timeout", () => req.destroy(new Error("DEV.to API request timed out.")));
    req.on("error", reject);
    req.end();
  });
};

const getFollowersCount = async () => {
  const perPage = 1000;
  let page = 1;
  let totalCount = 0;

  while (true) {
    const followers = await fetchJson(
      `/api/followers/users?page=${page}&per_page=${perPage}`
    );

    if (!Array.isArray(followers)) {
      throw new Error("DEV.to followers endpoint returned an invalid response.");
    }

    totalCount += followers.length;

    if (followers.length < perPage) {
      return totalCount;
    }

    page += 1;
  }
};

const updateReadme = async () => {
  const count = await getFollowersCount();
  let readmeContent = fs.readFileSync(README_FILE, "utf8");
  const newContent = `${START_MARKER}**${count}** DEV.to followers${END_MARKER}`;

  const regex = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, "g");
  readmeContent = readmeContent.replace(regex, newContent);

  fs.writeFileSync(README_FILE, readmeContent);
  console.log("README updated with new follower count:", count);
};

updateReadme().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

---
원문: [https://dev.to/annavi11arrea1/sharing-dev-followers-count-on-github-profile-bj3](https://dev.to/annavi11arrea1/sharing-dev-followers-count-on-github-profile-bj3)
수집일: 2026-09-25 02:08:53
