# React 19 `useFormStatus`의 함정: 'pending: false'에 고정되는 이유와 실전 `SubmitButton` 컴포넌트 제작기

몇 주 전, 저는 `useFormStatus` 훅이 `pending` 상태를 영원히 `false`로 유지하는 버그에 대해 자세히 다룬 적이 있습니다. 이 훅이 잘못된 컴포넌트에서 호출될 때 발생하는 문제였죠. 요약하자면, `useFormStatus`는 자기 자신을 호출한 컴포넌트가 렌더링하는 폼이 아닌, **부모 폼**의 상태만 추적한다는 겁니다. 더 골치 아픈 건, 이렇게 잘못 사용해도 아무런 경고나 콘솔 메시지가 없다는 점이죠. 버튼은 그저 조용히 `pending` 상태로 진입하지 않을 뿐입니다.

이전 글이 버그의 원인을 설명하는 데 집중했다면, 이번 글에서는 그 버그를 고치기 위해 제가 실제로 어떤 컴포넌트를 만들었는지 이야기해보려 합니다. 새로운 프로젝트마다 같은 해결책을 제 자신에게 반복해서 설명하는 게 너무 지겨워졌거든요. 그리고 솔직히, 첫 번째 해결책을 배포하고 나서야 발견한 또 다른 종류의 "조용한 실패"에 대한 이야기도 빼놓을 수 없겠네요.

본격적인 코드에 들어가기 전에 한 가지 짚고 넘어갈 부분이 있습니다. 이 글에서 다루는 해결책은 `useFormStatus`의 **위치 오류**를 고치는 데 초점을 맞춥니다. 만약 폼이 단순히 `preventDefault()`만 호출하는 `onSubmit` 핸들러나 URL 문자열 `action`을 통해 제출된다면, 훅의 위치를 옮겨도 `pending`은 여전히 `false`일 겁니다. 이 경우 훅이 추적할 "Action" 자체가 없기 때문이죠.

## 이전 글에서 다루지 못한 문제들

`useFormStatus` 훅의 위치를 바로잡는 것은 분명 중요한 해결책입니다. 하지만 실제 폼에 적용해 보니 두 가지 문제에 더 부딪히게 되더군요.

첫 번째는 버튼에 `disabled={pending}` 속성을 직접 사용하는 것입니다. 기능적으로는 작동하지만, 키보드 사용자를 배려한다면 이는 올바른 선택이 아닙니다. `disabled` 처리된 요소는 비활성화되는 순간 포커스를 잃어버립니다. 사용자가 탭 키로 제출 버튼에 접근한 뒤 Enter를 누르면, 제출이 진행되는 도중에 포커스가 엉뚱한 곳으로 튀어 버리는 일이 발생합니다. 심지어 아무데도 유용하지 않은 곳으로 이동하기도 하죠.

이 문제의 해결책은 `disabled` 대신 `aria-disabled`를 사용하는 것입니다. 그리고 클릭 이벤트는 수동으로 막아, 반복적인 제출 시도를 여전히 무시하도록 만듭니다.

```jsx
function SubmitButton({ children, pendingText, intent }) {
  const { pending } = useFormStatus();

  function handleClick(e) {
    if (pending) e.preventDefault(); // 제출이 진행 중이면 클릭 무시
  }

  return (
    <button
      type="submit"
      name={intent ? "intent" : undefined}
      value={intent}
      aria-disabled={pending || undefined} // 접근성 트리를 통해 상태 전달
      aria-busy={pending || undefined}    // 스크린 리더에게 바쁨 상태 알림
      data-pending={pending ? "" : undefined} // CSS 스타일링을 위한 커스텀 속성
      onClick={handleClick}
    >
      {pending ? pendingText : children}
    </button>
  );
}
```

이렇게 하면 포커스는 정확히 그 자리에 머물게 됩니다. 버튼의 `pending` 상태 스타일링은 `:disabled` 대신 `aria-disabled`나 `data-pending` 속성을 활용해야 합니다. 기본 `disabled` 속성은 실제로 설정되지 않으니까요. 제가 실무에서 이 부분을 테스트해 봤을 때, 키보드 사용자 경험이 정말 중요하더라고요. 단순 `disabled` 처리만으로는 접근성 점수가 확 떨어지는 걸 체감했습니다. 이 작은 차이가 사용자 만족도를 크게 좌우하죠.

두 번째 문제는 하나의 폼에 두 개 이상의 제출 버튼이 있을 때 드러납니다. `pending` 상태는 특정 버튼이 아닌 **폼 전체**에 귀속됩니다. 따라서 '임시 저장' 버튼과 '발행' 버튼이 나란히 있다면, 어느 한쪽을 클릭했을 때 두 버튼 모두 `pending` 상태로 빛나는 문제가 발생합니다. 브라우저는 이미 어떤 버튼이 폼을 제출했는지 알고 있습니다. 해당 버튼의 `name`과 `value`는 `FormData`에 포함되므로, 이를 읽어와 비교하면 됩니다.

```jsx
function useFormStatusForIntent(intent) {
  const status = useFormStatus();
  const submittedIntent = status.data?.get("intent"); // 제출된 버튼의 intent 값
  const isThisIntentPending =
    status.pending &&
    (intent === undefined || submittedIntent == null || submittedIntent === intent);
  return { ...status, isThisIntentPending };
}
```

```jsx
<form action={savePost}>
  <textarea name="body" />
  <SubmitButton intent="draft" pendingText="임시 저장 중...">임시 저장</SubmitButton>
  <SubmitButton intent="publish" pendingText="발행 중...">발행</SubmitButton>
</form>
```

위에서 보여드린 `SubmitButton`은 `aria-disabled`에 집중하기 위해 단순화된 버전입니다. 실제 완성된 파일에서는 `SubmitButton`이 이 `useFormStatusForIntent` 훅을 호출하도록 되어 있어서, 실제로 클릭된 버튼만 `pending` 상태를 보여줍니다. 이 기능을 연결하기 전에 한 가지 주의할 점이 있습니다. 텍스트 필드에서 Enter 키를 누르면 마크업상 가장 먼저 나오는 버튼을 통해 폼이 제출됩니다. 이는 React가 결정하는 것이 아니라 HTML 스펙에 정의된 기본 버튼 동작입니다. 그러니 가장 안전한 액션을 첫 번째로 배치하는 것이 좋습니다.

## 폼 제출 중 나머지 필드 잠그기

다음으로, 요청이 처리되는 동안 폼의 나머지 필드도 잠가서 사용자가 제출 도중에 내용을 수정하지 못하도록 하고 싶을 겁니다. 이때 네이티브 `<fieldset>` 요소는 각 입력 필드에 `disabled` prop을 일일이 추가할 필요 없이 단 한 줄로 이 작업을 수행합니다.

```jsx
function PendingFieldset({ children, unstyled }) {
  const { pending } = useFormStatus();
  return (
    <fieldset
      disabled={pending} // 폼이 제출 중일 때 모든 내부 요소를 비활성화
      style={unstyled ? undefined : { border: 0, margin: 0, padding: 0 }} // 기본 스타일 제거
    >
      {children}
    </fieldset>
  );
}
```

`unstyled` 플래그는 CSP(Content Security Policy)를 위한 것입니다. 인라인으로 `border: 0` 등 기본 스타일을 제거하는 코드가 CSP가 인라인 스타일을 차단하는 환경에서는 서버 렌더링된 HTML에서 무시될 수 있고, 이때 필드셋의 기본 테두리가 다시 나타나게 됩니다. 만약 이런 상황이라면 `unstyled` prop을 전달하고 클래스를 통해 스타일을 적용해야 합니다.

한 가지 절충안이 있습니다. 필드셋이 비활성화되면, 그 안에 포커스된 입력 필드도 포커스를 잃습니다. 이는 `disabled` 버튼에서 발생하는 것과 동일한 현상이죠. 따라서 포커스 유지보다 편집 차단이 더 중요한 상황에서 이 컴포넌트를 활용하는 것이 좋습니다.

스크린 리더에게 폼 제출 상태를 알리기 위해 `aria-busy`만으로는 충분하지 않습니다. 이를 위해서는 실제로 라이브 리전(live region)이 필요합니다.

```jsx
function FormStatusText({ pendingText, idleText = null }) {
  const { pending } = useFormStatus();
  return (
    <span role="status" aria-live="polite" aria-atomic="true"> {/* 라이브 리전 역할 */}
      {pending ? pendingText : idleText}
    </span>
  );
}
```

`aria-live="polite"`는 스크린 리더가 현재 작업이 완료되면 이 영역의 업데이트를 읽어주도록 지시하고, `aria-atomic="true"`는 전체 영역을 한 번에 읽도록 합니다.

## 두 번째 검토에서야 발견한 버그

이제 제가 이미 작업이 끝났다고 생각했던 파일을 다시 손대게 만든 부분에 대해 이야기해볼까요.

`SubmitButton` 컴포넌트에는 처음부터 개발 모드 전용 검사 로직이 포함되어 있었습니다. 만약 이 버튼을 폼 외부에서 렌더링하면, 개발 콘솔에 "왜 작동하지 않을 것인지"를 설명하는 에러 메시지가 표시되도록 말이죠.

그런데 `PendingFieldset`와 `FormStatusText`는 "폼 내부에 렌더링되어야 한다"는 동일한 요구사항을 주석으로 명시하고 있었음에도 불구하고, 실제로는 그런 검사 로직이 없었습니다. 이 둘 중 하나라도 잘못된 위치에 배치되면, 원래의 `useFormStatus` 버그처럼 조용히 실패합니다. 필드셋은 비활성화되지 않고, 상태 메시지는 나타나지 않으며, 아무것도 경고하지 않습니다.

이런 실수는 저도 쉽게 저질렀습니다. 이 두 컴포넌트는 제출 버튼보다 덜 중요하게 느껴지고, 편의에 따라 아무데나 배치하기 쉽기 때문이죠.

이제 이 두 컴포넌트도 버튼에 적용했던 것과 동일한 위치 검사 로직을 실행합니다. 물론, 포털(Portal)을 의도적으로 사용하는 사용자를 위한 예외 처리(escape hatch)도 함께 포함해서 말이죠.

```jsx
<PendingFieldset unsafeSkipFormCheck>
  {/* 포털을 통해 렌더링됨: DOM에서는 폼 외부에 있지만, React 트리에서는 폼 내부에 있음 */}
</PendingFieldset>
```

이 검사 로직에는 한계가 있습니다. 오직 DOM만 확인한다는 점입니다. 하지만 `useFormStatus`는 React 트리를 따릅니다. 따라서 포털을 통해 렌더링된 컴포넌트는 폼을 정확히 추적할 수 있음에도 불구하고, DOM 상으로는 폼 내부에 있지 않기 때문에 경고를 발생시킬 수 있습니다. 이때 `unsafeSkipFormCheck` prop이 필요한 이유입니다.

## 최종 결과물

완성된 파일에는 `SubmitButton`, `PendingFieldset`, 라이브 리전 (`FormStatusText`), `intent` 훅, 그리고 이 세 컴포넌트 모두에 대한 배치 검사 로직이 모두 담겨 있습니다. 단일 파일이며 `react`와 `react-dom` 외에는 어떠한 외부 의존성도 없습니다.

알려진 한계점으로는 `intent` 기능이 버튼별 `formAction`과는 호환되지 않는다는 점, `form.requestSubmit()` 호출 시 클릭 보호 로직이 건너뛰어진다는 점, 그리고 같은 태스크에서 두 개의 동기적인 클릭이 React가 재렌더링하기 전에 모두 처리될 수 있다는 점 등이 있습니다. 아직 Chromium과 Firefox에서만 테스트를 마쳤으며, Safari와 스크린 리더 환경에 대한 테스트는 진행 중입니다.

전체 코드가 궁금하시다면, [useFormStatus SubmitButton](https://shubhra.dev/snippets/use-form-status-fix) 링크를 통해 확인하실 수 있습니다. 무료이며 단일 파일로 제공됩니다.

혹시 이 글을 먼저 접했고, 원본 버그가 왜 발생하는지에 대한 자세한 설명이 필요하시다면 [이전 포스트](https://dev.to/shubhradev/react-19s-useformstatus-fixed-my-prop-drilling-then-it-sat-there-returning-false-30dl)를 참고해 주세요.

---
원문: [https://dev.to/shubhradev/react-19-useformstatus-returning-false-i-built-a-submitbutton-that-fixes-it-4o0j](https://dev.to/shubhradev/react-19-useformstatus-returning-false-i-built-a-submitbutton-that-fixes-it-4o0j)
수집일: 2026-09-30 02:39:23
