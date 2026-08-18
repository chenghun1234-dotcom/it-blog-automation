# JavaScript 없이 깔끔한 아코디언/토글 컴포넌트, HTML `<details>` 태그 하나면 충분해요!

재사용 가능하고, 무엇보다 **접근성**까지 완벽한 컴포넌트를 만드는 방법에 대한 저의 연재 글에 오신 것을 환영합니다. 이번에는 HTML `<details>` 태그를 활용해 JavaScript나 WAI-ARIA의 복잡한 도움 없이도 훌륭한 디스클로저(disclosure) 컴포넌트를 만드는 방법을 깊이 있게 다뤄보려 합니다. 저도 처음엔 이런 간단한 컴포넌트도 무조건 JavaScript로 구현해야 한다고 생각했죠. 하지만 `<details>` 태그를 만나고 나서는 HTML의 잠재력에 다시 한번 놀랐습니다.

## 기능적인 디스클로저 컴포넌트의 필수 요건

접근성을 갖춘 디스클로저 컴포넌트가 되려면 몇 가지 중요한 요구사항을 충족해야 합니다.

*   `<summary>` 요소 헤더에 포커스가 있을 때, <kbd>Enter</kbd> 키나 <kbd>Space</kbd> 키를 눌러 내용을 접거나 펼 수 있어야 합니다.
*   <kbd>Tab</kbd> 키를 누르면 포커스가 디스클로저 요소 내부의 다음 상호작용 요소로 이동하고, 없다면 페이지의 다음 상호작용 요소로 이동해야 합니다.
*   <kbd>Shift</kbd> + <kbd>Tab</kbd> 키를 누르면 포커스가 이전 상호작용 요소로 이동해야 합니다.
*   스크린 리더는 요소의 상태(접혀있는지, 펼쳐져 있는지)를 명확히 알려주어야 하며, 접근 가능한 이름 또한 함께 안내해야 합니다.

<details> 태그는 이 모든 조건을 **네이티브하게** 충족시켜 주므로, 별도의 스크립트나 ARIA 속성 없이도 완벽한 접근성을 제공합니다.

## `<details>` 태그의 구조 해부

`<details>` 태그는 다음과 같은 구조를 가집니다.

*   **`<details>`**: 전체 디스클로저 요소를 감싸는 메인 요소입니다.
*   **`<summary>`**: `<details>` 태그의 첫 번째 직계 자식입니다. 내용의 확장 및 축소를 제어하는 헤더 역할을 합니다. `<summary>` 내부의 내용을 다른 태그로 묶을 필요는 없지만, `<h1>-<h6>`와 [구절 콘텐츠(phrasing content)](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories#phrasing_content) 같은 태그들을 사용할 수 있습니다.
*   **`::marker`**: 요소가 열려 있는지 닫혀 있는지를 시각적으로 나타내는 디스클로저 삼각형(disclosure triangle)입니다.
*   **`::details-content`**: `<details>` 태그의 직계 자식이자 `<summary>`의 형제 요소입니다. 유효한 모든 HTML 요소가 될 수 있습니다. 가장 좋은 점은 내용을 `div`나 프래그먼트로 묶을 필요 없이, `<details>` 태그가 네이티브하게 이를 콘텐츠로 인식한다는 것입니다.

## 주요 속성 (Attributes)

`<details>` 태그가 가진 중요한 두 가지 속성이 있습니다.

*   **`open`**: 이 속성은 `<details>` 콘텐츠가 확장(펼쳐짐)되었는지 축소(접힘)되었는지를 나타냅니다.
    *   이 속성은 태그에 암묵적으로 적용되어 있으므로, 기본적으로 `<details>` 태그는 접혀있기 때문에 따로 추가할 필요는 없습니다.
    *   만약 `open` 속성을 단순히 추가한다면, `<details>`는 기본적으로 펼쳐진 상태로 렌더링됩니다.
*   **`name`**: 이 속성은 여러 개의 `<details>` 요소를 그룹으로 관리해야 할 때만 필요합니다. 즉, 하나의 `<details>`가 열려 있는 상태에서 다른 `<details>`를 열면, 이전에 열려 있던 것이 자동으로 닫히는 아코디언(Accordion) UI를 구현할 때 유용하게 사용됩니다.

## 디스클로저 컴포넌트를 위한 CSS 전략

### Summary 스타일링하기

네이티브하게 `<summary>` 태그는 기본적으로 `display: list-item` 속성을 가지고 있습니다. 이 속성 덕분에 삼각형, 원, 열림/닫힘 아이콘 등 기본 디스클로저 아이콘을 얻을 수 있으며, CSS `@counter-style` 룰을 사용하여 미리 정의된 아이콘 목록 스타일을 설정할 수도 있습니다. 한편, `::marker` 가상 요소로는 디스클로저 아이콘의 스타일을 직접 제어할 수 있습니다.

#### <u>`::marker` – 코드 스니펫</u>

```css
::marker {
  color: orangered;
  font-size: 2rem;
}
```

#### <u>`::marker` – 기능적 예시</u>
{% codesandbox 9hpg6m %}

멋지죠? 그런데 이제 이 네이티브 디스클로저 아이콘을 어떻게 숨길까요? `<summary>` 태그는 기본적으로 `display: list-item` 속성을 가지기 때문에, `details > summary` 선택자에 단순히 `display: flex`를 추가하는 것만으로 네이티브 디스클로저 아이콘이 자동으로 숨겨집니다. 이 전략은 유효하지만, 이것이 디스클로저 요소임을 명확히 나타내는 시각적인 심볼을 추가해야 합니다. 이때 추가하는 아이콘은 `aria-hidden="true"`로 설정해야 하는데, 보조 기술 사용자들은 이미 요소의 역할과 상태를 인지하고 있기 때문입니다.

저 역시 `<details>` 태그를 처음 접했을 때, 이 기본 마커를 커스터마이징하는 데 꽤 애를 먹었던 기억이 납니다. `display: flex`를 활용해 기본 마커를 숨기고 직접 디자인한 아이콘을 넣는 방식은 정말 실무에서 유용하게 쓰이죠.

#### <u>네이티브 디스클로저 아이콘 제거 – 코드 스니펫</u>
```css
details > summary {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
```

#### <u>네이티브 디스클로저 아이콘 제거 – 기능적 예시</u>
{% codesandbox lgqc69 %}

마지막으로, WebKit 기반 브라우저에서 `details` 마커를 스타일링하는 데 사용되는 `::-webkit-details-marker`라는 또 다른 잘 알려진 가상 요소도 있다는 점을 말씀드리고 싶습니다. 솔직히 요즘은 `::marker`가 다양한 브라우저에서 잘 지원되므로, 이 `::-webkit-details-marker` 가상 선택자는 필수적이지 않습니다.

### 이제 `div`로 콘텐츠를 감싸는 일은 그만!

2025년 9월부터, CSS 가상 선택자 `::details-content`가 `<details>` 태그의 확장/축소 가능한 콘텐츠를 스타일링하기 위한 래퍼 박스를 자동으로 생성합니다. 이것은 정말 좋은 소식입니다. 이제 콘텐츠의 래퍼를 스타일링하고, 접힌 상태에서 펼쳐진 상태로, 또는 그 반대로의 전환을 처리하기 위해 `div`와 같은 비의미론적 태그에 의존할 필요가 없기 때문입니다.

#### <u>확장/축소 가능한 콘텐츠 – CSS 스니펫</u>

```css
details::details-content {
  block-size: 0;
  overflow: clip;
}

details[open]::details-content {
  padding: 0.85rem;
}

@media (prefers-reduced-motion: no-preference) {
  details::details-content {
    transition:
      block-size 0.3s ease,
      padding-block 0.3s ease,
      content-visibility 0.3s ease allow-discrete;
  }
}
```

*   `details::details-content`는 기본적으로 접힌 상태의 스타일을 정의하고 콘텐츠를 숨깁니다.
*   `details[open]::details-content`는 펼쳐진 상태의 스타일을 정의합니다. 애니메이션이 있다면 애니메이션의 끝 지점을 결정합니다.
*   `@media (prefers-reduced-motion: no-preference) {details::details-content {}}`는 **접근성 향상**을 위한 부분입니다! 사용자의 운영체제 설정에서 애니메이션이 활성화되어 있다면, 닫힘 상태와 열림 상태 사이의 애니메이션이 이곳에서 적용됩니다.

개인적으로 이 `::details-content` 가상 선택자가 정식 스펙으로 자리 잡는다면, 개발자들이 불필요한 `div` 래퍼 없이 훨씬 깔끔하고 의미론적인 코드를 작성할 수 있게 될 거라 확신합니다. 덕분에 불필요한 DOM 노드도 줄어들고 CSS 트랜지션 관리도 훨씬 수월해질 테니까요.

#### <u>확장/축소 가능한 콘텐츠 – 기능적 예시</u>
{% codesandbox 9lqjjl %}

아래 코드 블록은 `<details>` 태그를 사용했을 때 어떤 비의미론적인 HTML 요소도 찾을 수 없는, 올바른 의미론적 구조를 보여줍니다.

```html
<details>
  <summary>{...}</summary>
  <!-- 여기부터 ::details-content가 시작됩니다 -->
  <p>{...}</p>
  <h4>{...}</h4>
  <ul>
    <li>{...}</li>
    <li>{...}</li>
    <li>{...}</li>
  </ul>
</details>
```

## 키보드 내비게이션

<u>`summary`는 포커스를 받고 상호작용을 관리하는 요소입니다.</u>

| 키                | 동작                                                    |
| :---------------- | :------------------------------------------------------ |
| <kbd>Tab</kbd>    | 디스클로저 요소로 포커스 이동 또는 다음 디스클로저 요소로 포커스 이동 |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | 이전 디스클로저 요소로 포커스 이동 또는 이전 상호작용 요소로 포커스 이동 |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | `<details>` 요소를 확장/축소합니다.                          |

## 스크린 리더 호환성

다음은 브라우저, 기기, 스크린 리더의 다양한 조합에서 디스클로저 요소가 어떻게 안내되고 상호작용하는지에 대한 내용입니다.

*   <u>VoiceOver macOS Tahoe 26.5.2 + Safari 26.5.2 (21624.2.5.11.8)</u>:
    *   접힘: 'How do screen readers announce the details tag?, collapsed, summary'
    *   펼쳐짐: 'How do screen readers announce the details tag?, expanded, summary'
    *   <kbd>Control</kbd> + <kbd>Option</kbd> + <kbd>Space</kbd> 키 조합으로 상태 전환: 'collapsed' 또는 'expanded'
*   <u>VoiceOver macOS Tahoe 26.5.2 + Chrome 150.0.7871.184</u>:
    *   접힘: 'How do screen readers announce the details tag?, collapsed, disclosure triangle, group'
    *   펼쳐짐: 'How do screen readers announce the details tag?, expanded, disclosure triangle, group'
    *   <kbd>Control</kbd> + <kbd>Option</kbd> + <kbd>Space</kbd> 키 조합으로 상태 전환: 접혀있으면 전체 내용이 다시 접힘으로 안내되고, 펼쳐져 있으면 전체 내용이 다시 펼쳐짐으로 안내됨
*   <u>VoiceOver macOS Tahoe 26.5.2 + Firefox 152.0.6</u>:
    *   VoiceOver macOS Tahoe 26.5.2 + Chrome 150.0.7871.184 조합과 동일
*   <u>NVDA 2026.1.1 + Chrome 150.0.7871.18</u>:
    *   접힘: 'How do screen readers announce the details tag?, button, collapsed'
    *   펼쳐짐: 'How do screen readers announce the details tag?, button, expanded'
    *   <kbd>Enter</kbd> 또는 <kbd>Space</kbd> 키로 상태 전환: 'collapsed' 또는 'expanded'
*   <u>NVDA 2026.1.1 + Firefox 153.0</u>:
    *   접힘: 'How do screen readers announce the details tag?, button, collapsed'
    *   펼쳐짐: 'How do screen readers announce the details tag?, button, expanded'
    *   <kbd>Enter</kbd> 또는 <kbd>Space</kbd> 키로 상태 전환: 'collapsed' 또는 'expanded'
*   <u>TalkBack, Pixel 10, Android 16 + Chrome 149.0.7827.160</u>:
    *   접힘: 'collapsed, How do screen readers announce the details tag?, disclosure triangle'
    *   펼쳐짐: 'expanded, How do screen readers announce the details tag?, disclosure triangle'
    *   두 번 탭하여 활성화 시 상태 전환: 'collapsed' 또는 'expanded'
*   <u>TalkBack, Pixel 10, Android 16 + Firefox 145.0.2</u>:
    *   접힘: 'collapsed, How do screen readers announce the details tag?, button, How do screen readers announce the details tag?, Space'
    *   펼쳐짐: 'expanded, How do screen readers announce the details tag?, button, How do screen readers announce the details tag?, Space'
    *   두 번 탭하여 활성화 시 상태 전환: 'collapsed' 또는 'expanded'

## 활용 사례 (Use cases)

동일한 `<details>` 요소가 매우 다양한 UI를 구현할 수 있습니다. 다음은 네이티브 태그, `name` 속성, 그리고 `::details-content` 가상 요소를 활용하여 JavaScript 없이도 구현 가능한 몇 가지 패턴들입니다.

1.  **FAQ 섹션**: 한 번에 하나의 답변만 열리도록 합니다. 모든 패널에 동일한 `name` 속성을 부여하면 브라우저가 자동으로 다른 패널을 닫아줍니다. {% codesandbox n4t52h %}
2.  **인라인 "더보기"**: 서론은 유지하고 자세한 내용은 숨깁니다. `details`에 `display: inline`을 적용하고 `::details-content`를 사용하면 문장 안에 자연스럽게 내용을 포함시킬 수 있습니다. {% codesandbox kjhxfj %}
3.  **스포일러 또는 정답 공개**: 답변, 코드 솔루션, 줄거리 스포일러 등을 명확한 공개 버튼 뒤에 숨깁니다. 닫힌 상태에서는 콘텐츠가 시야에서 벗어나며 접근성 트리에서도 제외됩니다. {% codesandbox rzdsny %}
4.  **주문 상세 정보 표시**: 카드 디자인 내부에 상세 정보를 토글 뒤에 숨깁니다. 주문 메타데이터, 기술 사양, 또는 고급 사용자는 원하지만 다른 사람들은 건너뛸 수 있는 모든 것에 완벽합니다. {% codesandbox nc8p8v %}
5.  **애니메이션 마커**: 열림/닫힘 상태는 단순히 CSS 선택자이므로, 회전하는 셰브론, 링으로 변하는 점 등 원하는 모든 마커를 애니메이션으로 만들 수 있습니다. {% codesandbox tpl7v9 %}
6.  **접을 수 있는 필터 패널**: 긴 필터 레일을 스캔 가능하게 유지하기 위해 폼 컨트롤들을 접을 수 있는 헤더 아래에 그룹화합니다. 각 그룹은 자체 상태를 기억하며, 내부 입력 필드는 다른 곳에서와 마찬가지로 정확하게 작동합니다. {% codesandbox js2fvf %}
7.  **제품 사양**: 구매 박스를 깔끔하게 유지하고 전체 사양 시트를 토글 뒤에 숨깁니다. 치수, 재료, 관리 지침이 필요한 구매자만 열어봅니다. {% codesandbox xwmdpk %}
8.  **접힌 코드 및 로그**: GitHub 패턴입니다. 긴 코드 샘플, diff, 또는 스택 트레이스를 요약 뒤에 접어두어 이슈 및 문서의 가독성을 높입니다. 공개된 블록은 모노스페이스 패널로 표시됩니다. {% codesandbox m4d5dg %} _이 활용 사례는 새로운 줄을 삽입하기 위해 `<ins>` 태그를 사용합니다. 이 태그의 용도에 대한 더 자세한 내용은 [여기](https://micaavigliano.com/en/blog/semantic-ins-del-s-tags)에서 확인할 수 있습니다._

이렇게 HTML의 `<details>` 태그는 단순한 컴포넌트를 넘어, 접근성과 사용자 경험을 모두 고려한 강력한 도구가 될 수 있습니다. 여러분의 프로젝트에도 이 놀라운 네이티브 기능을 적극 활용해 보시길 강력히 추천합니다. 궁금한 점이나 공유하고 싶은 경험이 있다면 언제든지 댓글을 남겨주세요!

---
원문: [https://dev.to/micaavigliano/learn-how-to-build-an-expandable-and-collapsible-component-using-the-native-html-details-tag-1h8j](https://dev.to/micaavigliano/learn-how-to-build-an-expandable-and-collapsible-component-using-the-native-html-details-tag-1h8j)
수집일: 2026-08-18 00:29:49
