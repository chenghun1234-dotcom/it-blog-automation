# 10년차 개발자, gp-grid로 React 대규모 데이터 앱 'STREET BITES' 구축기: 실무에서 써보니?

이미 `gp-grid`의 여러 기능과 잠재력에 대한 기본적인 탐색은 마쳤던 터라, ([`gp-grid`: React, Vue, Angular를 위한 무료 오픈소스 TypeScript 데이터 그리드 (유료 기능 없음)](https://dev.to/hadil/gp-grid-a-free-open-source-typescript-data-grid-for-react-vue-and-angular-no-paywalled-5heb) 이 글을 참고해 보세요.) 이제는 이 라이브러리가 실제 React 애플리케이션에서 어떻게 시너지를 낼지 궁금했습니다. 단순히 기능을 나열하는 것을 넘어, 다양한 데이터 타입과 충분한 레코드 수를 가진 프로젝트를 통해 `gp-grid`의 핵심 기능들이 실질적인 상호작용 속에서 어떻게 빛을 발하는지 직접 경험해보고 싶었죠.

그래서 저는 **STREET BITES**라는 가상의 국제 스트리트 푸드 축제 웹사이트를 만들었습니다. 방문객들이 다채로운 요리를 발견하고, 각 푸드 벤더를 탐색하며, 3일간의 행사 일정을 손쉽게 확인할 수 있도록 디자인했죠.

총 네 개의 페이지로 구성된 이 애플리케이션에서 저는 데이터가 중심이 되는 세 페이지에 `gp-grid`를 적극적으로 활용했습니다. 정렬, 필터링, 커스텀 셀 렌더러, 인라인 편집, 행 그룹핑, 피벗팅, 가상 스크롤링 같은 고급 기능들을 두루 적용하며 라이브러리의 진면목을 확인했죠.

이 글에서는 제가 어떻게 이 애플리케이션을 구축했고, 어떤 `gp-grid` 기능들을 구현했으며, 실제 React 프로젝트에서 `gp-grid`를 사용하면서 얻은 경험과 인사이트를 자세히 풀어낼 예정입니다.

---

## TL;DR (바쁘다면 여기!)

[gp-grid](https://gp-grid.io/)는 무료로 제공되는 [오픈소스](https://github.com/GioPat/gp-grid) TypeScript 데이터 그리드 라이브러리로, React, Vue, Angular를 공식적으로 지원합니다. STREET BITES를 구축하면서 `gp-grid`를 써보니, React 애플리케이션에 통합하기 매우 직관적이었고, 하나의 패키지로도 고급 그리드 기능을 전부 사용할 수 있다는 점이 특히 인상 깊었습니다.

*   **프로젝트**: 저는 가상의 국제 스트리트 푸드 축제를 위한 4페이지짜리 React 웹사이트인 STREET BITES를 만들었습니다.
*   **그리드 통합**: `gp-grid`는 벤더 디렉터리, 푸드 익스플로러, 축제 스케줄 페이지의 핵심 데이터 그리드를 담당합니다.
*   **테스트된 주요 기능**: 정렬, 필터링, 커스텀 셀 렌더러, 인라인 편집, 행 선택, 그룹핑, 피벗팅, 가상 스크롤링, 실시간 업데이트를 모두 경험해봤습니다.
*   **개발자 경험**: 설치와 초기 설정이 매우 간단했으며, React와 TypeScript 기반 프로젝트에 자연스럽게 녹아들었습니다.
*   **가장 큰 강점**: Apache 2.0 라이선스 패키지에 모든 고급 기능이 포함되어 있고, 커스텀 렌더러가 뛰어난 유연성을 제공하며, 핵심 설정이 깔끔하게 유지된다는 점을 꼽을 수 있습니다.

전반적으로 `gp-grid`를 사용한 경험은 매우 긍정적이었습니다. 복잡한 기능에 대한 라이선스 비용 없이 데이터 집약적인 React 애플리케이션을 구축해야 한다면 `gp-grid`를 진지하게 고려해볼 만합니다. 다만, 팀의 엄격한 도입 기준이 있다면 라이브러리의 성숙도와 지원 옵션을 충분히 평가해볼 필요가 있습니다.

---

## gp-grid란 무엇인가요?

![gp-grid home page screenshot](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/e9yj08t21tsfw8164jyk.png)

[gp-grid](https://gp-grid.io/)는 Apache 2.0 라이선스 하에 배포되는 [오픈소스](https://github.com/GioPat/gp-grid) TypeScript 데이터 그리드입니다. React, Vue, Angular에 대한 공식 통합을 제공하며, 프레임워크에 구애받지 않는 코어는 정렬, 필터링, 편집, 그룹핑, 피벗팅, 슬롯 기반 가상 스크롤링 같은 다양한 기능을 지원합니다. 현재 1.0.0 버전에 도달했으며, 모든 기능은 유료 플랜 없이도 사용 가능합니다. 유료 기능의 장벽 없이 이 모든 고급 기능을 사용할 수 있다는 점은 정말 매력적이죠.

---

## 제가 만든 애플리케이션은?

STREET BITES는 `gp-grid` 리뷰에 실용적인 기반을 제공하고자 만든 가상의 국제 스트리트 푸드 축제 웹사이트입니다. 푸드 벤더, 전 세계 요리, 축제 이벤트를 한데 모아 여러 현실적인 데이터 탐색 시나리오를 만들었습니다.

### STREET BITES는 어떤 서비스인가요?

이 축제는 2027년 6월 12일부터 14일까지 올드 하버의 리버사이드 공원에서 열립니다. 슬로건은 *"맛의 세계, 하나의 놀라운 축제!"* 이 가상의 이벤트는 15개국에서 온 벤더들, 수백 가지 요리, 그리고 요리 시연, 푸드 대회, 셰프 토크, 워크숍, 시식, 라이브 음악 등 72개의 활동을 한자리에 모았습니다.

방문객들은 벤더를 둘러보고, 다양한 요리를 발견하고, 3일간의 행사 일정을 확인할 수 있습니다. 프로젝트의 모든 축제 정보와 기록은 가상으로 만들어졌습니다.

### 왜 스트리트 푸드 축제를 선택했나요?

저는 다양한 유형의 데이터와 방문객들에게 의미 있는 상호작용을 제공하는 프로젝트를 원했습니다. 푸드 페스티벌은 요리 종류, 국가, 가격, 평점, 식이 제한 카테고리, 그리고 이용 가능 여부별로 레코드를 정렬하고 필터링할 수 있는 풍부한 기회를 제공합니다.

또한, 벤더를 위치나 요리 종류별로 그룹화하거나, 피벗 뷰를 통해 가용성을 분석하고, 이벤트 상태 변화를 실시간으로 표시하는 등 유용한 시나리오를 만들 수 있었습니다. 음식 이미지, 평점, 뱃지, 매운맛 표시기 등은 그리드에 커스텀 셀 렌더링 요소를 추가할 여지를 주었죠. 제가 실무에서 이 부분을 테스트해 봤을 때, 단순히 텍스트만 나열하는 것보다 훨씬 직관적이고 사용자 친화적인 경험을 제공할 수 있다는 확신을 얻었습니다.

### 네 개의 페이지와 그 목적

STREET BITES는 축제 경험의 각기 다른 부분을 담당하는 네 개의 주요 페이지로 구성되어 있습니다.

*   **홈 (Home)**: 주요 벤더, 인기 요리, 통계, 하이라이트, 예정된 이벤트를 통해 축제를 소개합니다.
*   **벤더 (Vendors)**: 1만 개의 푸드 벤더 목록과 요리 종류, 국가, 축제 구역, 부스 번호, 평점, 현재 상태에 대한 정보를 제공합니다.
*   **푸드 익스플로러 (Food Explorer)**: 5천 개의 요리 카탈로그와 가격, 식이 제한 카테고리, 매운맛 단계, 평점, 인기 점수를 보여줍니다.
*   **스케줄 (Schedule)**: 3일간의 축제 동안 진행되는 72개 이벤트를 시간, 이름, 카테고리, 스테이지, 진행자, 상태, 특징 표시 및 축제 일자별로 정리합니다.

홈 페이지는 일반 React 컴포넌트를 사용하여 편집 섹션과 추천 카드들을 구성했습니다. 반면, 나머지 세 페이지는 `gp-grid`를 활용하여 인터랙티브한 데이터 탐색 경험을 제공합니다.

실제 프로젝트를 확인하고 음식 축제를 직접 탐색해보세요!

{% cta https://street-bites-olive.vercel.app/ %} 라이브 데모 👀 {% endcta %}

{% cta https://github.com/Hadil-Ben-Abdallah/street-bites %} GitHub 저장소 ⭐ {% endcta %}

---

## 기술 스택 및 프로젝트 설정

STREET BITES는 React와 TypeScript 스택을 기반으로 구축되었으며, 세 가지 주요 탐색 페이지에서 `gp-grid`가 인터랙티브한 데이터 그리드를 처리합니다. 나머지 인터페이스는 익숙한 React 컴포넌트를 사용하여 내비게이션, 필터, 추천 카드, 축제 섹션 등을 그리드 구현과 분리하여 관리했습니다.

### 사용된 기술

이 프로젝트의 기술 스택은 다음과 같습니다.

*   **React**: 웹사이트 인터페이스와 재사용 가능한 컴포넌트 구축에 사용되었습니다.
*   **TypeScript**: 벤더, 요리, 축제 이벤트의 데이터 모델을 정의하여 애플리케이션 코드의 일관성을 유지하는 데 도움을 주었습니다.
*   **Vite**: 개발 서버와 프로덕션 빌드를 담당합니다.
*   **Tailwind CSS**: 다채로운 카드, 반응형 레이아웃, 축제 테마 디자인 등 웹사이트 스타일링에 활용되었습니다.
*   **React Router**: `/`, `/vendors`, `/food`, `/schedule` 네 가지 라우트 간의 내비게이션을 처리합니다.
*   **gp-grid (`@gp-grid/react`)**: 벤더, 푸드 익스플로러, 스케줄 페이지의 인터랙티브 데이터 그리드를 구동합니다.

### React 프로젝트에 gp-grid 설치하기

`gp-grid`를 React 프로젝트에 추가하는 것은 단 하나의 패키지 설치 명령으로 충분합니다.

```bash
npm install @gp-grid/react
```

React 통합은 React 18 이상을 요구하며, TypeScript 5.0 이상을 권장합니다. 패키지를 설치한 후에는 애플리케이션 루트에서 그리드의 기본 스타일시트를 한 번만 임포트합니다.

```tsx
import "@gp-grid/react/dist/styles.css";
```

이렇게 하면 그리드의 기본 스타일이 애플리케이션 전체에 로드됩니다. 이후 웹사이트 디자인에 맞춰 얼마든지 외관을 커스터마이징할 수 있습니다.

### 애플리케이션에 gp-grid 통합하기

기본적인 `gp-grid` 통합은 세 가지 주요 부분으로 구성됩니다: 컬럼 정의, 행 데이터, 그리고 `Grid` 컴포넌트입니다. 또한 그리드는 사용 가능한 공간을 채우기 때문에 명시적인 높이를 가진 부모 컨테이너가 필요합니다.

예를 들어, 벤더 그리드는 몇 개의 컬럼 정의와 벤더 레코드 배열로 시작할 수 있습니다.

```tsx
import { Grid, type ColumnDefinition } from "@gp-grid/react";

const columns: ColumnDefinition[] = [
  { field: "name", cellDataType: "text", headerName: "Vendor", width: 220 },
  { field: "rating", cellDataType: "number", headerName: "Rating", width: 100 },
];

<div style={{ height: "520px" }}>
  <Grid columns={columns} rowData={vendors} rowHeight={56} />
</div>
```

여기서 `columns`는 어떤 필드가 표시되고 어떻게 보여질지를 정의하며, `vendors`는 레코드를 제공합니다. `rowHeight` 속성은 각 데이터 행의 높이를 설정합니다.

STREET BITES에서는 검색 필드, 필터, 뷰 탭, 데이터셋 선택기 등 각 그리드 주변의 컨트롤은 일반 React 컴포넌트가 처리합니다. `gp-grid`는 실제 데이터 그리드 경험 자체를 담당하는 식이죠. 이 구조 덕분에 관심사를 명확히 분리하여 코드를 더욱 깔끔하게 관리할 수 있었습니다.

---

## 세 가지 주요 페이지에 gp-grid 구현하기

저는 STREET BITES의 세 가지 페이지, 즉 벤더 디렉터리, 푸드 익스플로러, 축제 스케줄에 `gp-grid`를 사용했습니다. 각 그리드는 다른 유형의 정보를 다루므로, 벤더 레코드, 음식 카탈로그, 이벤트 스케줄을 하나의 애플리케이션에서 모두 처리할 수 있었습니다.

### 벤더 디렉터리: 푸드 벤더 관리 및 탐색

벤더 디렉터리에는 1만 개의 가상 푸드 벤더 정보가 포함되어 있습니다. 요약 카드에는 총 1만 벤더 중 현재 8,242곳이 영업 중이며, 1,819곳이 추천 벤더이고, 평균 평점은 4.30이라고 표시됩니다.

`gp-grid` 테이블은 각 벤더의 사진, 이름, 도시, 요리 종류, 국가, 축제 구역, 부스 번호, 평점, 리뷰 수, 요리 수, 평균 가격, 그리고 영업 상태를 보여줍니다. 그리드 위에서는 방문객들이 디렉터리를 검색하고, 데이터셋 크기를 선택하며, 요리 종류, 국가, 구역, 상태, 최소 평점, 추천 여부 등으로 벤더를 필터링할 수 있습니다.

이 페이지는 또한 **디렉터리 (Directory)**, **그룹화 (Grouped)**, **피벗 (Pivot)**의 세 가지 뷰를 포함하여 벤더 데이터를 다양한 방식으로 탐색할 수 있도록 합니다.

![gp-grid vendor directory listing 10,000 street food vendors with cuisine badges, star ratings, status labels, and Directory, Grouped, Pivot tabs](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/ghlkr2l5qw1z5tu10d8q.png)<figcaption>벤더 페이지: 1만 개 벤더의 gp-grid 디렉터리, 뷰 탭, 필터, 비교 패널</figcaption>&nbsp;

### 푸드 익스플로러: 인터랙티브한 요리 카탈로그 만들기

푸드 익스플로러에는 다양한 국가와 요리 종류의 5천 개 가상 요리가 포함되어 있습니다. 떡볶이, 불고기 바오, 엘로테 세 가지 추천 요리가 메인 카탈로그 위에 표시되어, 방문객들에게 축제의 인기 음식들을 빠르게 훑어볼 수 있는 기회를 제공합니다.

**전체 메뉴 (Full Menu)** 그리드는 요리 썸네일, 이름, 짧은 설명, 가격, 요리 종류, 국가, 식이 제한 카테고리, 매운맛 단계, 평점, 인기 점수, 그리고 이용 가능 여부를 표시합니다. 방문객들은 요리 종류, 국가, 식이 제한, 가격, 매운맛 단계, 상태 필터를 사용하여 카탈로그를 좁힐 수 있습니다.

이 페이지는 그리드에 더 시각적인 역할을 부여했습니다. 음식 썸네일, 다채로운 식이 제한 뱃지, 불꽃 아이콘, 그리고 인기 표시기 등이 요리 정보와 함께 나타납니다. 단순히 텍스트만 보여주는 것 이상의 경험을 제공하고자 노력했죠.

![Food Explorer page with a gp-grid table of 5,000 dishes showing thumbnails, price, cuisine and diet badges, spice flames, and popularity bars](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/ssq5js6x0qf4r9hftsfs.png)<figcaption>푸드 익스플로러: 요리 종류, 식이 제한, 가격, 매운맛별 필터를 갖춘 5천 개 요리</figcaption>&nbsp;

### 축제 스케줄: 이벤트 및 활동 정리

축제 스케줄은 축제 3일 동안 진행되는 72개 이벤트를 한데 모았습니다. 개요 카드에는 총 72개 이벤트 중 60개가 예정되어 있고, 3개는 현재 라이브 중이며, 9개는 완료되었다고 표시됩니다. **On Now** 배너는 현재 진행 중인 활동을 강조합니다.

`gp-grid` 테이블은 각 이벤트의 시간, 이름, 카테고리, 스테이지, 진행자, 상태, 추천 표시, 그리고 축제 일자를 표시합니다. 방문객들은 Day 1 (금요일, 6월 12일), Day 2 (토요일, 6월 13일), Day 3 (일요일, 6월 14일), 그리고 All Days 사이를 전환할 수 있습니다. 추가 필터로는 이벤트 카테고리, 스테이지, 상태가 있습니다.

이를 통해 방문객들은 요리 시연, 대회, 워크숍, 셰프 출연, 시식, 라이브 공연 등 축제 전반의 활동을 실용적인 방식으로 탐색할 수 있습니다.

![Festival schedule page with a gp-grid event table showing time, category badges, stage, host, live status, day tabs, and an On Now banner](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/71srzekxpms6tnthbcbo.png)<figcaption>스케줄 페이지: 실시간 상태가 표시되는 3일간의 72개 이벤트</figcaption>

---

## 실제 React 애플리케이션에서 테스트한 gp-grid 기능들

### 정렬 및 다중 컬럼 정렬 (Sorting and Multi-Column Sorting)

정렬 기능은 세 가지 그리드 모두에서 완벽하게 작동합니다. 컬럼 헤더를 클릭하면 해당 레코드가 정렬되고, Shift 키를 누른 채 다른 헤더를 클릭하면 보조 정렬이 추가됩니다. 헤더에는 정렬 화살표와 번호가 매겨진 뱃지가 표시되어 정렬 순서를 보여줍니다. 예를 들어, 벤더를 요리 종류별로 정렬한 다음 평점별로 정렬하여 각 요리 내 벤더를 체계적으로 정리할 수 있습니다. 대규모 데이터셋의 경우, 클라이언트 데이터 소스의 `useWorker` 옵션을 통해 기본적으로 웹 워커(Web Worker) 정렬을 사용합니다. 덕분에 수많은 데이터를 정렬할 때도 UI가 버벅이는 일 없이 매끄러운 경험을 제공할 수 있었죠.

![gp-grid vendor table sorted by two columns with numbered sort indicators in the headers](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/4frck7dl834pz23xw1s1.png)<figcaption>"요리"와 "평점"으로 정렬된 테이블</figcaption>&nbsp;

### 필터링 및 검색 (Filtering and Search)

저는 두 가지 필터링 레이어를 사용했습니다. 각 그리드 위의 페이지 레벨 컨트롤과 개별 컬럼 헤더에서 사용할 수 있는 필터 팝업입니다. 팝업은 텍스트, 숫자, 날짜에 대한 유형별 연산자를 지원하며, 체크박스 기반 값 선택과 그룹화된 AND/OR 조건을 제공합니다. 다른 컬럼에 적용된 필터는 AND 조건으로 결합되어 방문객들이 보고 싶은 레코드를 더욱 세밀하게 제어할 수 있도록 합니다.

![gp-grid vendor directory search for Tunisian food](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/aspu0w20qrwfxuaxbwu5.png)<figcaption>"튀니지" 음식을 검색하는 전역 검색</figcaption>

![gp-grid vendor directory filter by rating](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/gkkounc2535ah4fjd8jm.png)<figcaption>평점이 4보다 크고 비어있지 않은 항목 필터링</figcaption>&nbsp;

### 커스텀 셀 렌더러 (Custom Cell Renderers)

커스텀 셀 렌더러는 시각적 경험에 큰 변화를 가져왔습니다. 벤더 사진, 도시 및 요리 세부 정보, 요리 썸네일, 식이 제한 뱃지, 별점, 가격 라벨, 매운맛 불꽃 아이콘, 인기 바, 진행자 아바타, 상태 표시 칩 등에 이 기능을 활용했습니다. 렌더러를 `valueFormatter`와 함께 사용하면 필터링 및 복사된 값이 사용자가 보는 것과 일관성을 유지하는 데 큰 도움이 됩니다. 솔직히 이 부분이 `gp-grid`를 선택하게 된 결정적인 이유 중 하나였습니다. 제가 실무에서 다양한 데이터 그리드 라이브러리를 사용해 봤을 때, 커스텀 렌더러가 이렇게 유연하게 지원되는 경우는 흔치 않았거든요.

![gp-grid custom cell renderers showing dish thumbnails, dietary badges, spice icons, ratings, and popularity bars](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/qysen9u559gvmsxe9wpa.png)<figcaption>커스텀 렌더러는 단순 텍스트 셀을 넘어 음식 카탈로그에 시각적 정체성을 부여합니다</figcaption>&nbsp;

### 인라인 편집 (Inline Editing)

벤더, 요리, 이벤트 그리드에서 편집 기능을 활성화하는 **오거나이저 모드 (Organizer mode)** 토글을 추가했습니다. `editable: true`로 설정된 컬럼은 편집 가능해지며, 사용자는 더블 클릭, Enter, F2, 또는 타이핑으로 편집을 시작할 수 있습니다. Enter 키는 변경 사항을 적용하고, Tab 키는 적용 후 다음 셀로 이동하며, Escape 키는 변경을 취소합니다. 채우기 핸들(fill handle)은 드래그한 범위에 값을 복사하는 기능도 제공합니다. 변경 사항은 애플리케이션 상태를 업데이트하여 관련 페이지 콘텐츠가 동기화된 상태를 유지하도록 합니다.

![gp-grid vendor table in Organizer mode with an editable cell and save feedback](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/m52yvad2463vvmjqzho8.png)<figcaption>오거나이저 모드는 그리드에서 축제 정보를 직접 업데이트할 수 있게 합니다</figcaption>&nbsp;

### 행 선택 및 데이터 비교 (Row Selection and Data Comparison)

벤더 및 푸드 익스플로러 페이지에는 선택 체크박스가 포함되어 있어, 방문객들이 최대 네 개의 레코드를 선택할 수 있습니다. 선택된 벤더 또는 요리는 비교 패널에 나란히 표시되어 세부 정보를 비교할 수 있습니다. 저는 그리드 선택을 React 상태에 연결하여, 선택이 변경되는 즉시 패널이 업데이트되도록 했습니다. `gp-grid`는 마우스 및 키보드 상호작용을 통한 셀 및 범위 선택도 지원합니다.

![gp-grid vendor rows selected with a comparison panel displaying the chosen vendors](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/mm542b6dmryn9i030kyg.png)<figcaption>선택된 그리드 행은 React 상태를 통해 벤더 비교 패널에 데이터를 공급합니다</figcaption>&nbsp;

### 행 그룹핑 및 집계 (Row Grouping and Aggregation)

벤더 페이지에는 요리 종류, 국가, 또는 축제 구역별로 레코드를 확장 가능한 그룹으로 정리하는 그룹화 뷰가 포함되어 있습니다. 스케줄 페이지 또한 날짜, 카테고리, 또는 스테이지별로 이벤트를 그룹화하는 것을 지원합니다. `gp-grid`는 로컬에서 계산되거나 서버에서 로드된 집계 및 그룹 총합을 표시할 수 있습니다. 이를 통해 대규모 컬렉션을 더 쉽게 탐색하면서 관련 레코드를 함께 유지할 수 있습니다.

![gp-grid vendor directory grouped by cuisine with expandable group rows](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/6h1kmhcfm6podtiz7wo2.png)<figcaption>gp-grid 벤더 디렉터리가 요리 종류별로 그룹화되어 확장 가능한 그룹 행이 표시됩니다</figcaption>&nbsp;

### 피벗팅 (Pivoting)

피벗 뷰는 축제 주최자들에게 벤더 가용성에 대한 빠른 개요를 제공합니다. 저는 요리 종류를 행으로, 가용성 상태를 컬럼으로, 벤더 수를 값으로 구성했습니다. 이를 통해 각 요리 종류별로 몇 명의 벤더가 영업 중(Open), 바쁨(Busy), 매진(Sold Out), 또는 마감(Closed) 상태인지 유용한 요약을 만들었습니다. 이 뷰는 `gp-grid`의 피벗 기능을 사용하므로, 결과는 수동으로 조립된 테이블이 아닌 실제 그리드 피벗입니다.

![gp-grid pivot table showing vendor counts by cuisine and availability status](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/k4szt8ao9nq6ib5c18n8.png)<figcaption>벤더 피벗은 다양한 요리 종류에 걸쳐 가용성을 요약합니다</figcaption>&nbsp;

### 가상 스크롤링 (Virtual Scrolling)

`gp-grid`는 가상 스크롤링을 위해 재사용 가능한 DOM 슬롯을 사용합니다. 방문객들이 데이터셋을 이동할 때, 그리드는 이 슬롯들을 재활용하고 작은 오버스캔 버퍼와 함께 보이는 행만 렌더링합니다. 벤더 및 푸드 익스플로러 페이지에는 데이터셋 선택기가 포함되어 있어, 방문객들이 다른 목록 크기 사이를 전환할 수 있습니다. 이는 모든 레코드를 한 번에 렌더링하지 않고도 그리드가 더 긴 카탈로그를 어떻게 처리하는지 실용적인 방법으로 탐색할 수 있게 합니다. 실제로 1만 개의 벤더 데이터를 스크롤하면서 느꼈던 건, `gp-grid`가 보여주는 퍼포먼스였습니다. 제가 예전에 다른 프로젝트에서 수천 개 데이터만 되어도 버벅이는 경험을 한 적이 있는데, 이 정도 대규모 데이터를 매끄럽게 처리하는 건 인상 깊었어요.

![gp-grid virtual scrolling through a large vendor dataset with only visible rows rendered](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/bjzk8ilkr1tel4m3uz6v.png)<figcaption>가상 스크롤링은 렌더링된 DOM을 데이터셋의 보이는 부분에 집중시킵니다</figcaption>&nbsp;

### 실시간 데이터 업데이트 (Live Data Updates)

스케줄 페이지에는 축제 중 변화를 시뮬레이션하는 **실시간 업데이트 (Live updates)** 토글이 포함되어 있습니다. 이벤트는 예정됨(Upcoming), 라이브 중(Live), 완료됨(Completed) 사이를 이동하며, On Now 배너와 요약 카운트가 그에 따라 업데이트됩니다. 벤더 가용성 또한 영업 중(Open), 바쁨(Busy), 매진(Sold Out), 마감(Closed) 사이에서 변경됩니다. 이러한 업데이트는 기본 레코드와 애플리케이션 상태를 수정하여 그리드와 관련 인터페이스 요소가 일관성을 유지하도록 합니다.

![gp-grid festival schedule showing event statuses changing from upcoming to live and completed](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/7cpc2cf53vfi1kd8uj6i.png)<figcaption>실시간 업데이트는 이벤트 레코드를 변경하고 스케줄 표시기를 동기화 상태로 유지합니다</figcaption;&nbsp;

### 컬럼 크기 조절, 재정렬 및 고정 (Column Resizing, Reordering, and Pinning)

방문객들은 컬럼 헤더를 드래그하여 순서를 재정렬하고, 가장자리에서 크기를 조절하며, 고정(pin) 아이콘을 사용하여 중요한 컬럼을 왼쪽이나 오른쪽에 고정할 수 있습니다. 고정 컨트롤은 왼쪽, 오른쪽, 고정 해제 상태를 순환합니다. 그리드에 많은 필드가 포함되어 있고 방문객들이 다른 컬럼을 탐색하면서도 핵심 정보를 계속 보고 싶을 때 이러한 상호작용은 매우 유용합니다.

![gp-grid column headers being reordered, resized, and pinned through interactive controls](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/zhugrry7g3f75mbqpgbc.png)<figcaption>컬럼 컨트롤을 통해 방문객들은 각 그리드의 레이아웃을 커스터마이징할 수 있습니다</figcaption>&nbsp;

### 키보드 내비게이션 및 편집 경험 (Keyboard Navigation and Editing Experience)

키보드 내비게이션은 화살표 키, Shift+화살표, Tab, Enter, Home/End, Ctrl+Home/End를 지원합니다. 사용자는 Enter 또는 F2로 편집을 시작하고, Escape로 취소하며, Ctrl+C 및 Ctrl+V를 사용하여 복사 및 붙여넣기를 할 수 있습니다. 예를 들어, 오거나이저는 벤더의 부스 번호로 이동하여 편집하고 마우스를 사용하지 않고 변경 사항을 적용할 수 있습니다. 그리드는 또한 ARIA 그리드 역할과 키보드 지원을 제공하지만, 완전한 접근성 준수는 아직 계획 중이므로 맹신해서는 안 됩니다.

![Active cell in a gp-grid table moving between cells with keyboard navigation and editing](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/eru8nbuwv69m83b9rox9.png)<figcaption>키보드 컨트롤은 마우스 없이 그리드 레코드를 탐색하고 편집하는 것을 지원합니다</figcaption>&nbsp;

### 다크 모드 (Dark Mode)

STREET BITES의 `gp-grid` 테이블에도 다크 모드를 구현했습니다. 그리드의 외관이 어두운 테마로 변경되어 셀 배경, 텍스트, 테두리, 컬럼 헤더 같은 요소들이 어두운 환경에서도 데이터를 쉽게 읽을 수 있도록 조정됩니다. 이를 통해 사용자들은 저조도 환경에서 테이블을 더 편안하게 볼 수 있으며, 그리드가 다양한 인터페이스 테마에 맞춰 스타일링될 수 있음을 보여줍니다.

![STREET BITES vendor directory showing the gp-grid table in dark mode](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/j8cux38930y1ikdur0sp.png)<figcaption>다크 모드로 표시된 테이블</figcaption>&nbsp;

### 반응형 테이블 (Responsive Tables)

`gp-grid` 테이블이 작은 화면에서 어떻게 동작하는지도 확인했습니다. 테이블은 모바일 기기와 좁은 뷰포트에서도 사용 가능하며, 레이아웃이 복잡해지지 않고 방문객들이 데이터를 탐색할 수 있도록 합니다.

이는 STREET BITES에 매우 중요합니다. 방문객들은 휴대폰으로 벤더를 확인하거나, 요리를 탐색하거나, 축제 일정을 보고 싶어 할 수 있기 때문이죠. 그리드는 다양한 화면 크기에서 데이터에 대한 접근성을 유지합니다.

![STREET BITES vendor directory displayed on a mobile phone, showing the responsive gp-grid table adapted to a narrow screen](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/ujxn3q34yyt9ftwm3s51.png)<figcaption>모바일 화면에 표시된 테이블</figcaption>&nbsp;

![STREET BITES vendor directory displayed on a tablet, showing the gp-grid table adapted to a wider touchscreen layout](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/14div8o97iulb4mkl7hk.png)<figcaption>태블릿 화면에 표시된 테이블</figcaption>

---

## 성능 및 개발 경험

`gp-grid`는 슬롯 기반 가상 스크롤링을 사용하여 사용자가 데이터셋을 이동할 때 DOM 슬롯을 재활용하고, 작은 오버스캔 버퍼와 함께 보이는 행만 렌더링합니다. STREET BITES의 벤더 및 푸드 익스플로러 페이지에는 현재 1만 개의 벤더와 5천 개의 요리가 표시되며, 데이터셋 선택기를 통해 다른 목록 크기로 전환할 수 있습니다.

별도의 성능 참조를 위해, `gp-grid`의 공개된 벤치마크는 `@gp-grid/react` 0.19.0 버전을 사용하여 Chrome에서 100만 행을 테스트했습니다. 스크롤링 시 평균 56.2 FPS, 드롭된 프레임 0개, 로딩 후 약 255MB의 힙 메모리, 오름차순 정렬에 652ms를 기록했습니다. 이는 `gp-grid` 벤치마크 결과이며, STREET BITES에서의 측정치는 아닙니다. 프로젝트는 `pnpm bench` 명령을 통해 이러한 테스트를 재현할 수 있습니다.

### React 및 TypeScript와의 통합

개발 내내 통합 과정은 매우 매끄러웠습니다. 패키지 설치, 컬럼 정의, 데이터 연결, 커스텀 렌더러 추가, React 상태와 상호작용 연결 모두 직관적이었습니다. 내장된 TypeScript 타입 덕분에 별도의 `@types` 패키지를 설치할 필요 없이 타입이 지정된 컬럼과 레코드를 사용할 수 있었죠. 마치 처음부터 React와 한 몸처럼 설계된 라이브러리 같다는 인상을 받았습니다.

또한, 동일한 컬럼 모델이 React, Vue, Angular 통합 전반에 걸쳐 이어진다는 점도 마음에 들었습니다. 여러 프레임워크를 사용하는 개발자는 그리드 설정에 대한 지식을 쉽게 옮겨 적용할 수 있을 겁니다.

### 잘 작동했던 점들

정렬, 필터링, 편집, 선택, 그룹핑, 피벗팅, 가상화 기능을 하나의 오픈소스 패키지에서 모두 사용할 수 있다는 점은 구현을 훨씬 쉽게 정리할 수 있게 해주었습니다. 커스텀 렌더러는 또 다른 강력한 장점이었습니다. 음식 썸네일, 벤더 사진, 평점, 다채로운 뱃지 등을 통해 그리드가 STREET BITES의 시각적 정체성과 완벽하게 어우러지도록 도왔습니다.

이 패키지는 외부 의존성이 전혀 없으며, `gp-grid`는 기능 가이드와 AI 코딩 어시스턴트를 위한 공식 에이전트 스킬도 제공합니다.

### 과제 및 한계점

몇 가지 고려해야 할 사항도 있습니다.

*   **라이브러리 성숙도**: `gp-grid`는 1.0.0 버전의 젊은 프로젝트로, 기존 대안들에 비해 커뮤니티가 작고 서드파티 튜토리얼이 적습니다.
*   **접근성**: ARIA 그리드 역할과 키보드 내비게이션을 지원하지만, 완전한 접근성 인증은 아직 계획 중이므로 엄격한 요구사항이 있는 팀은 보조 기술로 테스트해야 합니다.
*   **구현 세부 사항**: 좁은 컬럼 너비는 헤더 텍스트를 잘라낼 수 있으므로, 긴 라벨을 위해 충분한 공간을 확보해야 합니다.

### 시작하기 전에 알아두면 좋은 실용적인 팁

*   그리드 컨테이너에 명시적인 높이를 부여하세요.
*   스타일시트는 애플리케이션 루트에서 한 번만 임포트하세요.
*   표시되는 값이 일관된 서식을 필요로 할 때는 `cellRenderer`와 `valueFormatter`를 함께 사용하세요.
*   실시간 데이터의 경우 안정적인 `getRowId`를 사용하고, 매우 큰 데이터셋의 경우 서버 사이드 데이터를 고려하세요.

---

## gp-grid는 누가 사용해야 할까요?

`gp-grid`는 유료 기능 없이 고급 데이터 그리드 기능이 필요한 React, Vue, 또는 Angular 애플리케이션을 구축 중이라면 고려해볼 가치가 있습니다. 관리 인터페이스, 분석 도구, 재고 시스템, 그리고 대규모 표 형식 데이터를 처리하는 애플리케이션에 적합할 수 있습니다.

또한, TypeScript 지원, 커스텀 셀 렌더링, 편집, 그룹핑, 피벗팅, 가상 스크롤링을 하나의 패키지에서 원하는 개발자에게도 좋은 선택입니다. 프로덕션 환경에 `gp-grid`를 도입하려는 팀은 특히 성숙한 생태계나 광범위한 접근성 검증이 필요한 경우, 자체 데이터와 요구사항으로 테스트해보는 것이 중요합니다.

---

## 자주 묻는 질문 (FAQ)

{% details Is gp-grid suitable for production React applications? %}
신중한 평가를 거치면 충분히 가능합니다. `gp-grid`는 Apache 2.0 라이선스이며, TypeScript 기반이고, Vue 및 Angular 지원과 함께 React 통합을 제공합니다. STREET BITES에서는 그리드 요구사항을 모두 충족했지만, 1.0.0 버전의 젊은 프로젝트입니다. 자체 데이터로 테스트하고 도입하는 버전을 고정하는 것이 좋습니다.
{% enddetails %}

{% details Does gp-grid support sorting, filtering, and inline editing? %}
네, 세 가지 모두 내장된 기능입니다. STREET BITES에서는 컬럼 헤더가 정렬 및 Shift+클릭 다중 컬럼 정렬을 지원합니다. 필터는 페이지 레벨 컨트롤과 컬럼 필터 팝업을 결합하며, 오거나이저 모드는 더블 클릭, Enter, 또는 F2를 통한 인라인 편집을 가능하게 합니다.
{% enddetails %}

{% details Can a React data grid handle one million rows? %}
네, 가상화(virtualization)를 통해 가능합니다. `gp-grid`는 슬롯 기반 가상 스크롤링을 사용하여 보이는 행만 렌더링합니다. 공개된 100만 행 벤치마크에서는 평균 56.2 FPS, 드롭된 프레임 0개, 로딩 후 약 255MB의 메모리를 사용했습니다. 이는 프로젝트의 벤치마크 결과이며, STREET BITES에서의 측정치는 아닙니다. 1천만 행 이상의 데이터셋에는 성능 가이드에서 서버 사이드 데이터 처리를 권장합니다.
{% enddetails %}

{% details Does gp-grid support row grouping and pivoting? %}
네, 두 가지 모두 포함된 기능입니다. 행 그룹핑은 레코드를 집계 및 총합과 함께 확장 가능한 그룹으로 정리합니다. 피벗팅은 데이터 차원을 컬럼으로 전환하여 요약 뷰를 만듭니다. STREET BITES에서는 피벗 뷰를 사용하여 요리 종류 및 가용성 상태별 벤더 수를 표시했습니다.
{% enddetails %}

{% details Is gp-grid free and open source? %}
네. `gp-grid`는 Apache 2.0 라이선스 하에 배포되며, 이는 필요한 고지사항을 준수하는 한 상업적 사용, 수정 및 배포를 허용합니다. 모든 기능은 엔터프라이즈 티어 또는 기능별 유료화 없이 제공됩니다. 또한 선택적 기부를 통해 프로젝트를 지원할 수도 있습니다.
{% enddetails %}

---

## 마무리하며

STREET BITES를 구축하면서 벤더 레코드, 음식 카탈로그, 축제 스케줄 전반에 걸쳐 `gp-grid`를 실용적인 방식으로 탐색할 수 있었습니다. 정렬, 필터링, 편집, 그룹핑, 피벗팅, 가상화 기능들을 애플리케이션에 의미 있는 시나리오로 활용할 수 있었죠.

저는 `gp-grid`의 React 통합과 오픈소스 라이선스로 제공되는 다양한 기능들에 대해 매우 긍정적인 인상을 받았습니다. 아직 젊은 생태계라는 점은 대규모 프로덕션 시스템에 도입하기 전에 고려해야 할 사항이지만, 기능별 라이선스 제한 없이 유능한 데이터 그리드를 필요로 하는 개발자들에게 `gp-grid`는 정말 유망한 선택지입니다.

만약 다음 프로젝트를 위해 React 데이터 그리드를 평가하고 있다면, `gp-grid`를 여러분의 데이터셋과 유사한 워크플로우로 직접 시도해보시는 것을 강력히 추천합니다.

---

| 읽어주셔서 감사합니다! 🙏🏻 <br/> 이 글이 유용했기를 바랍니다 ✅ <br/> 더 많은 소식을 위해 반응과 팔로우 부탁드려요 😍 <br/> [Hadil Ben Abdallah](https://dev.to/hadil)의 💙로 만들어졌습니다 | [![LinkedIn](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/u48q29oef3l4a6eow30h.png)](https://www.linkedin.com/in/hadil-ben-abdallah/) [![GitHub](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/huvszgj6eun7xfvnwv51.png)](https://github.com/Hadil-Ben-Abdallah) [![Twitter](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/53x550t83v5ner74xkxo.jpg)](https://x.com/hadilbnabdallah)|
|---------|----------|---------|   

{% embed https://dev.to/hadil %}

---
원문: [https://dev.to/hadil/i-used-gp-grid-to-build-a-react-food-festival-app-with-advanced-data-grid-features-3l22](https://dev.to/hadil/i-used-gp-grid-to-build-a-react-food-festival-app-with-advanced-data-grid-features-3l22)
수집일: 2026-11-11 03:25:57
