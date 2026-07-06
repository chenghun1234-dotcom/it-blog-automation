# '삽질' 끝판왕: Google Apps Script 배포, `clasp`로 복붙 지옥에서 탈출하다!

---

_안녕하세요, Maneshwar입니다. 저는 모든 커밋에 동작하는 Micro AI 코드 리뷰어인 git-lrc를 개발하고 있습니다. GitHub에서 무료로 제공되며 소스도 공개되어 있습니다. 개발자들이 이 프로젝트를 발견할 수 있도록 [git-lrc에 Star](https://github.com/HexmosTech/git-lrc)를 눌러주세요. 한 번 사용해 보시고 피드백도 공유해 주시면 감사하겠습니다._

---

자, 잠깐 앉아봐요. 올해 겪었던 가장 어이없는 몇 시간의 디버깅 삽질과, 그 끝에 `clasp`라는 커맨드라인 툴에 묘하게 정이 들게 된 이야기를 해줘야겠네요. 10년 넘게 IT 현장에서 온갖 툴을 다뤄봤지만, 가끔은 이렇게 기본적인 부분에서 사람을 당황시키는 경우가 있습니다.

## 왜 LinkedIn 확장 프로그램에 백엔드가 필요할까?

먼저 유스케이스부터 설명해 드릴게요. 저는 ProfileKit이라는 Chrome 확장 프로그램을 직접 만들어서 쓰고 있습니다.

이 확장 프로그램은 LinkedIn 프로필 페이지에서 유용한 정보(이름, 헤드라인, 현재 회사)를 긁어옵니다. 아주 간단하고 개인적인 툴이죠.

여기에 한 가지 기능을 더 추가하고 싶었습니다. 바로 "프로필 저장" 버튼이에요.

어떤 프로필에서 이 버튼을 클릭하면, 해당 인물 정보가 제가 추적용으로 사용하는 큰 Google Sheet의 회사 행에 자동으로 추가되도록 말이죠. 회사당 여러 프로필을 저장할 수 있고, 중복 없이, 모든 것이 자동으로 동기화됩니다.

정말 멋진 아이디어였죠. 하지만 이제 제 작은 스크래퍼에 백엔드가 필요해졌습니다.

하루에 기껏해야 스무 번 정도 실행될 사이드 프로젝트를 위해 서버를 따로 세우고 싶지는 않았어요. 그때 Shrijith가 Google Apps Script 웹 앱을 무료 API로 활용하고, Google Sheet를 데이터베이스 삼아 쓰는 아이디어를 줬습니다.

확장 프로그램 측면에서 연결은 대략 이렇게 생겼습니다.

```js
// background.js
fetch(SHEET_SYNC_URL, {
  method: "POST",
  body: JSON.stringify(message.payload),
  redirect: "follow",
})
  .then((res) => res.text())
  .then((text) => sendResponse({ ok: true, data: JSON.parse(text) }))
  .catch((err) => sendResponse({ ok: false, error: err.message }));
```

그리고 다른 쪽에서는 Apps Script의 `doPost` 함수가 리드 정보를 회사 행에 매칭시켜 추가하죠.

무료 호스팅, 무료 인증(이론상), 무료 데이터베이스. 과연 뭐가 문제일까요?

모든 것이 제대로 작동할 때의 핸드셰이크 과정은 리다이렉션까지 포함해서 대략 이렇습니다.

![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/alx9394hdvo5yzowver1.png)

Apps Script가 모든 응답에 대해 에코 URL로 리다이렉트하는 동작은 실제로 일어나는 일입니다. 네트워크 탭에서 처음 봤을 때는 뭔가 고장 난 줄 알았죠. 아니었어요. 그냥 구글이 구글 한 것뿐이었습니다.

![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/fetwge9aei0o2cnacbhp.png)

## 현실을 의심하게 만든 버그

먼저, 작은 버그 하나를 짚고 넘어갈게요. 원래 제 "리드 저장" 로직은 회사 이름으로 리드를 매칭했습니다. 예를 들어 "EmpInfo"와 "EmpInfo, Inc." 같은 텍스트를, 때로는 헤드라인에 나오는 대로 매칭했죠. 모호하고, 취약하며, 가끔은 황당한 결과를 만들었습니다. 이 문제는 회사 페이지에서 "관련 인물 검색"을 클릭하는 순간 실제 LinkedIn URL을 캡처하고, 그 URL을 핵심 키로 사용하는 방식으로 고쳤습니다. 깔끔하고 견고하며 지루한 해결책이었죠.

그런데 업데이트된 Apps Script 코드를 재배포하자마자 모든 게 엉망이 됐습니다. 모든 동기화 시도가 401 에러로 실패한 겁니다. "코드에 버그가 있다"는 메시지도 아니었고, "컬럼을 찾을 수 없다"는 메시지도 아니었어요. 제 코드가 실행되기도 전에, 구글 인프라에서 곧바로 날아온 무미건조한 401 에러였습니다.

배포 설정을 네 번이나 확인했습니다. 분명히 거기에는 "액세스 권한: **모든 사용자**"라고 크게 쓰여 있었죠.

'모든 사용자'. 그 단어가 마치 제게 돈이라도 빚진 것처럼 노려봤습니다.

알고 보니 이 두 그림은 같은 그림이 아니더군요. 배포를 제어하는 실제 매니페스트 내부 설정은 이랬습니다.

```json
"webapp": {
  "executeAs": "USER_DEPLOYING",
  "access": "ANYONE"
}
```

구글 API에서 `ANYONE`은 조용히 "구글 계정에 로그인한 모든 사용자"를 의미했던 겁니다. 익명 사용자도 아니고, `curl` 요청도 아니고, 제 확장 프로그램의 `fetch()` 호출도 아니었죠. (확장 프로그램은 구글 세션 쿠키를 가지고 있지 않으니까요.)

실제로 "로그인 필요 없는 일반 공개, 낯선 사람, 기계, 무엇이든"을 의미하는 설정은 완전히 다른 값인 `ANYONE_ANONYMOUS`였습니다.

그러니까 UI에서는 "모든 사용자"라고 하는데, API에는 "모든 사용자"의 두 가지 맛이 있고, 그중 하나만이 진짜 "모든 사용자"인 셈입니다. 이건 마치 집주인이 "애완동물 친화적"이라고 해놓고, 알고 보니 금붕어 한 마리만 허용된다는 말과 비슷한 접근 제어의 모호함이었죠.

제가 실무에서 이 부분을 테스트해 봤을 때, 이런 모호한 문구 때문에 개발자들이 얼마나 많은 시간을 버리는지 뼈저리게 느낍니다. 특히 클라우드 서비스는 편리하지만, 문서화가 불명확하거나 직관적이지 않은 부분이 종종 있거든요.

어쨌든, 이 부분을 고치고 일반 요청으로 확인했습니다.

```bash
curl -s "$DEPLOY_URL" -w "\n%{http_code}\n"
# {"ok":false,"error":"Use POST"}
# 200
```

200. 실제 응답. 익명의 사용자로부터. 광고했던 대로, 결국은요.

## `clasp`, 무대 중앙으로 등장

이제 정말 이 글을 쓸 가치가 있게 만든 부분입니다. Apps Script 파일을 수정할 때마다, 배포 워크플로는 이랬습니다. 웹 에디터를 열고, 코드를 직접 붙여넣고, '배포'를 클릭하고, '배포 관리'를 클릭하고, 새 버전을 만들고, 새 `/exec` URL을 복사해서, 그 URL을 확장 프로그램의 `background.js`에 붙여넣고, 매니페스트 버전을 올리고, 확장 프로그램을 새로고침하고, 열려 있는 모든 LinkedIn 탭을 새로고침하는 과정이었죠. 단 한 줄의 코드를 변경하더라도 말이에요.

이 짓을 너무 많이 하다 보니, 결국 소리 내어 물었습니다. "이런 걸 위한 패키지가 없나?"

알고 보니 있었습니다. 바로 Google 자체 Apps Script용 CLI인 `clasp`였죠. 터미널에서 코드를 푸시하고, 버전을 만들고, 배포를 관리할 수 있게 해줍니다.

```bash
npm install -g @google/clasp
clasp login          # 브라우저에서 일회성 OAuth 인증
clasp clone <scriptId>
```

제 URL 변경 문제("URL churn problem")를 실제로 해결해 준 부분은 이 플래그입니다.

```bash
clasp deploy -i <existingDeploymentId> -V <newVersionNumber>
```

이 명령어는 *기존* 배포를 새로운 버전으로 *그 자리에서* 업데이트합니다. 동일한 배포 ID, 동일한 `/exec` URL을 영원히 유지시켜주는 거죠. 이제 사소한 오타를 고칠 때마다 확장 프로그램에 새 URL을 복사 붙여넣기 할 필요가 없어졌습니다. 제가 실무에서 `clasp`를 처음 도입했을 때, 단순 반복 작업에 낭비되던 시간이 확 줄어들어 개발 사이클이 정말 부드러워지는 걸 경험했습니다. CLI 하나로 이렇게 삶의 질이 달라질 수 있다니, 개발자라면 이런 툴은 꼭 알아둬야 한다고 생각해요.

## 모든 과정을 자동화하기

그래서 푸시, 버전 생성, 재배포 과정을 하나의 스크립트와 `make` 타겟으로 묶었습니다.

```bash
make apps-script-deploy MSG="fix lead matching"
```

이게 다입니다. 이제 전체 릴리즈 프로세스가 이렇게 바뀌었습니다.

대략적인 Before & After는 이렇습니다.

![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/5b7jufh7b8u9km6b95hl.png)

![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/ljufajmkhiv1kyzv8gdi.png)

## 이 패턴이 저평가되는 이유

Chrome 확장 프로그램이 Apps Script 웹 앱을 통해 Google Sheet와 통신하는 방식은 '진지한' 아키텍처는 아닙니다. 이 점을 분명히 하고 싶습니다. 하지만 이 방법은 완전히 무료이고, 서버도, 데이터베이스도, 인증 시스템도 필요 없으며, 저녁 한나절이면 구축할 수 있었습니다. 서너 명(사실은 저 한 명)이 하루에 몇십 번 사용하는 개인 도구에는 이 정도 트레이드오프가 환상적입니다. 그저 매니페스트에 숨겨진 함정 하나만 알고, 401 에러로 세 시간 삽질하기 전에 `clasp`를 설치해두는 게 좋습니다.

## 작은 감사와 공헌

`clasp`는 Grant Timmerman이 만들었습니다. 그는 Google Workspace에 재직하면서 Apps Script의 개발자 스토리를 이 CLI를 포함해 사실상 처음부터 만들어냈습니다. 몇 년이 지난 지금도 Sheets와 Docs 부가 기능을 만드는 수많은 사람들의 트래픽을 조용히 처리하고 있죠. 확장 프로그램이나 스크립트를 Google Workspace에 연결해 본 적이 있다면, 아마도 모르는 사이에 그의 작업 덕을 봤을 겁니다. 이 글이 공개되면 그를 제대로 태그할 예정입니다. 그는 마땅히 칭찬받을 자격이 있습니다. :)

## 추가 자료

*   [GitHub의 `clasp`](https://github.com/google/clasp)
*   [Apps Script 웹 앱 가이드](https://developers.google.com/apps-script/guides/web)
*   [Grant Timmerman 웹사이트](https://grant.cm/)

---

_면책 조항: 이 글은 제가 작성했으며, 문법 수정 및 가독성 향상을 위해 AI를 활용했습니다._

---

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ed6ratvd5eb5bp0ep9ck.png)

_AI 에이전트는 코드를 빠르게 작성합니다. 하지만 논리를 조용히 제거하고, 동작을 변경하며, 버그를 몰래 도입하기도 합니다. 그리고는 여러분에게 알려주지 않죠. 보통 프로덕션 환경에서나 알게 됩니다._

_git-lrc가 이 문제를 해결합니다. Git 커밋에 후킹하여 모든 diff를 커밋되기 전에 검토합니다. 60초면 설정 완료! 완전 무료입니다._

_어떤 피드백이나 기여도 환영합니다! 온라인에서 소스 코드와 함께 제공되며, 누구든 사용할 수 있습니다._

_GitHub에서 Star를 눌러주세요:_
{% github=https://github.com/HexmosTech/git-lrc %}

---
원문: [https://dev.to/lovestaco/at-last-i-clasp-escaping-the-gs-apps-script-copy-paste-gauntlet-23jd](https://dev.to/lovestaco/at-last-i-clasp-escaping-the-gs-apps-script-copy-paste-gauntlet-23jd)
수집일: 2026-07-06 01:53:02
