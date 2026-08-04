# 글로벌 비즈니스, 스트라이프 없이 결제 시스템 구축하기: Skill Exchange가 알려준 PayPal+UPI 실전 전략

"그냥 스트라이프 붙이면 돼!" 혼자서 프로젝트를 개발하며 수익화를 고민하는 개발자에게 흔히 듣는 조언입니다. 이 말은 대부분의 상황에서 통하지만, 제가 인도 상인으로서 샌프란시스코의 구매자와 벵갈루루의 구매자에게 같은 날 오후에 물건을 팔아야 하는 상황에 부딪히자마자, 이 '만능' 조언이 더는 통하지 않는다는 걸 깨달았습니다. 단일 결제 제공업체로는 이 두 가지 상황을 모두 처리할 수 없었고, 예상보다 많은 코드를 재배치해야 했죠.

저는 재사용 가능한 AI 스킬 마켓플레이스인 Skill Exchange(링크는 글 마지막에 있습니다)를 구축하면서 이 문제에 직면했습니다. 여기서 마켓플레이스 자체가 핵심은 아닙니다. 미국 법인이 없고 스트라이프 없이도 지구 반대편 두 사람에게서 돈을 받는 방법을 알아내기 위한 일종의 '실험장'이었죠. 제가 다른 개발자들에게 똑같은 시행착오를 겪지 않도록 알려주고 싶은 것들이 바로 이 내용들입니다.

## 인도에서 PayPal은 국경 간(Cross-border) 거래만 가능합니다 – 국내 구매자는 결제할 수 없어요

가장 먼저 깨부숴야 할 전제가 있습니다. PayPal은 인도 내에서 국내 결제 수단으로 사용할 수 없습니다. PayPal은 2021년 4월부터 인도 내에서 이루어지는 인도 간(India-to-India) 국내 결제를 중단했습니다. 현재 남아있는 기능은 *오직* 국경 간 거래에만 해당합니다. 인도 판매자는 해외로부터 돈을 받을 수 있지만, 인도 내에서 루피를 보유한 구매자는 인도 기반 판매자에게 PayPal을 통해 결제할 수 없다는 말이죠.

이 사실은 예상했던 대로 직접 경험하며 알게 되었습니다. PayPal을 연동하고 제 인도 계좌로 제 인도 판매자 계좌에 테스트 결제를 시도했더니, 아무런 맥락 없는 "현재 문제가 발생한 것 같습니다"라는 메시지가 뜨더군요. 에러 코드도, 문서의 어떤 항목도 없었습니다. 그냥 거래가 국내 거래로 분류되어 거부된 것이었죠. 구매자가 해외 사용자일 때는 완벽하게 작동하기 때문에, 막상 내 나라에서 테스트할 때는 이 실패 원인을 파악하는 게 정말 혼란스러웠습니다. **제가 실무에서 이 부분을 테스트해 봤을 때, 에러 메시지 하나 없이 그저 '문제가 발생했습니다'라는 메시지만 뜨는 것을 보고 정말 당황했죠. 국내 거래로 분류되어 거부된다는 사실을 알기 전까지는 한참을 헤맸습니다.**

핵심 요점: PayPal 판매자 계정과 같은 국가에 구매자가 있다면, PayPal 하나만으로는 해당 구매자들을 놓치게 됩니다. 반드시 두 번째 결제 레일이 필요합니다.

## 두 개의 제공업체가 필요하며, 분할 기준은 기능이 아닌 통화입니다

결론적으로, 아키텍처는 구매자의 통화에 따라 두 개의 제공업체를 선택하는 방식입니다.

*   **해외 구매자 → PayPal**: **USD**로 결제
*   **인도 구매자 → Razorpay**: **INR**로 **UPI**를 통해 결제 (원탭 결제, 거의 제로에 가까운 마찰, 인도 내 카드 결제보다 훨씬 높은 전환율을 자랑합니다).

여기서 중요한 설계 결정은 *구매자*가 결제 시 통화를 선택함으로써 결제 레일을 직접 고르게 한다는 점입니다. 저는 기본값을 시간대에 따라 설정해두고, 사용자가 이를 변경할 수 있도록 했습니다. IP 조회나 외부 API 호출 없이 순수하게 클라이언트 측에서 처리하죠.

```js
const defaultCurrency = (() => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "INR" : "USD";
  } catch { return "USD"; }
})();
```

이 시간대 휴리스틱은 해외 거주 인도인(NRI)이나 여행객에게는 맞지 않을 수 있습니다. 그래서 이는 *기본값*일 뿐, 절대 고정된 값이 아니라는 점이 중요합니다. 통화 변경 토글은 항상 사용자에게 보입니다.

그리고 `buy` 엔드포인트는 이 하나의 필드를 기준으로 라우팅됩니다.

```js
async function buySkill(user, skillId, body) {
  const skill = await getSkill(skillId);
  const wantsInr = String(body?.currency).toUpperCase() === "INR";

  if (wantsInr) {
    const paise = usdCentsToInrPaise(skill.priceCents);
    const order = await razorpay.createOrder({ amount: paise, currency: "INR",
      notes: { skillId, buyerId: user.id } });        // notes로 구매자와 연결
    return { provider: "razorpay", orderId: order.id, amount: paise, currency: "INR" };
  }
  const order = await paypal.createOrder({ amountUsd: skill.priceCents / 100,
    skillId, buyerId: user.id });                     // custom_id로 연결
  return { provider: "paypal", orderId: order.id, amount: skill.priceCents, currency: "USD" };
}
```

## 정확한 환율 변환 대신 현지 가격대를 활용하세요

가장 단순한 접근 방식은 USD 가격에 실시간 환율을 적용하여 결과를 보여주는 것입니다. 하지만 그러지 마세요. 12달러짜리 스킬이 ₹86/$ 환율로 ₹1,032가 된다면, 사용자에게는 버그처럼 보이거나 *비싸게* 느껴질 수 있습니다. 인도의 디지털 상품 지불 의사는 단순히 달러 환율을 적용하는 것보다 낮기 때문이죠. 인도 시장에 진출한 모든 진지한 판매자들은 지역별 가격대를 대신 사용합니다.

따라서 변환은 `usd * rate`가 아니라, 익숙한 ₹x99 형태로 반올림됩니다.

```js
const INR_RATE = 86; // 조절 가능한 단일 값; 전체 카탈로그 가격 재설정 가능

function usdCentsToInrPaise(usdCents) {
  if (!usdCents) return 0;
  const rupees = (usdCents / 100) * INR_RATE;
  const clean = Math.max(1, Math.round(rupees / 100) * 100 - 1); // → ₹x99
  return clean * 100; // paise 단위
}
// 예시: $5→₹399,  $6→₹499,  $9→₹799,  $12→₹999,  $15→₹1,299
```

저 하나의 `INR_RATE` 상수만으로 200개 이상의 상품 목록 가격을 한 번에 재조정할 수 있습니다. 또한, 반올림 로직은 각 항목에 대한 별도 작업 없이도 구매력 할인을 제공하는 효과까지 누릴 수 있습니다. **저도 처음엔 단순히 환율을 적용했다가, 인도 사용자들의 구매 전환율이 생각보다 낮아 고심했습니다. ₹x99 전략을 도입하고 나서야 비로소 현지 시장의 특성을 이해하게 되었죠. 단순히 숫자를 맞추는 것이 아니라, 현지인의 심리를 고려한 가격 전략이 중요하다는 걸 실감했습니다.**

## 통화와 수수료는 거래 시점에 저장하고, 나중에 재계산하지 마세요

이 부분은 나중에 간과하면 크게 발목을 잡을 수 있습니다. 여러 통화(그리고 플랫폼 수수료)가 개입하는 순간, 나중에 금액을 다시 계산하는 것은 불가능해집니다. 두 가지 규칙을 꼭 기억하세요.

1.  **모든 구매 기록에 통화를 영구적으로 저장하세요.** `amountCents`만으로는 일부가 파이세(paise) 단위일 때 모호해집니다.
2.  **플랫폼 수수료는 구매 시점에 계산하여 저장하세요.** 수수료율이 변경될 경우(저의 경우 10% → 5%로 변경되었습니다), 과거 거래 기록은 판매 당시의 수수료율을 유지해야 합니다. 읽기 시점에 재계산하는 수수료는 결국 언젠가 잘못된 값이 될 것입니다.

```js
purchase = {
  skillId, buyerId,
  amount: chargedMinorUnits,        // USD는 센트, INR은 파이세
  currency,                         // "USD" | "INR"  — 절대 생략 금지
  commission: Math.round(chargedMinorUnits * 0.05), // 판매 시점에 고정
  provider, providerPaymentId, purchasedAt: now,
};
```

그리고 판매자 수익 집계는 *통화별로* 유지해야 합니다. 센트와 파이세를 하나의 정수로 합산하는 것은 아름답지만 아무 의미 없는 숫자를 만들어낼 뿐입니다.

## 서버 측에서 생성한 주문과 대조하여 결제를 검증하세요 – 클라이언트의 말만 믿지 마세요

두 결제 레일 모두 브라우저가 거짓말을 할 수 있도록 허용합니다. 따라서 결제 완료 단계에서 클라이언트가 보내는 금액이나 "성공했습니다"라는 플래그를 절대 신뢰해서는 안 됩니다. 진실은 제공업체로부터 재추론하고, 해당 결제가 정확히 이 구매자와 이 상품에 속하는지 확인해야 합니다.

*   **PayPal:** 서버 측에서 주문을 포착(capture)하고, `status === "COMPLETED"` 인지 확인하며, 주문 생성 시 설정했던 `custom_id`가 `skillId|buyerId`와 일치하는지 확인해야 합니다. 포착된 주문은 다른 구매에 대해 재사용될 수 없습니다.
*   **Razorpay:** 체크아웃 HMAC 서명을 검증한 다음, *주문을 다시 가져와서* 그 `notes`가 당신이 생성한 스킬 및 구매자와 일치하는지 확인하세요. 기록할 주문 금액/통화는 요청 본문에서 오는 것이 아니라, 그 주문 조회 결과에서 와야 합니다.

```js
// Razorpay 확인 (confirm) 로직
if (!verifyCheckoutSignature({ orderId, paymentId, signature })) return forbid();
const order = await razorpay.fetchOrder(orderId);            // 진실의 원천
if (order.notes.skillId !== skillId || order.notes.buyerId !== user.id) return forbid();
await recordPurchase({ ...order fields..., currency: order.currency, amount: order.amount });
```

두 시스템 모두 동일한 규칙이 적용됩니다. 당신의 원장에 기록할 금액과 통화는 *당신이* 열었고 구매자와 암호화 방식으로 연결된, 제공업체의 주문 기록에서 와야 합니다. 클라이언트가 "결제했다"고 말하는 것을 믿어서는 안 됩니다.

## 다음 개발자에게 해주고 싶은 말

*   PayPal 구매자와 판매자가 같은 국가에 있다면 PayPal은 그들을 놓칩니다. 처음부터 두 번째 결제 레일을 계획하세요.
*   **통화**를 기준으로 라우팅하고, 기본값을 제공하되 항상 구매자가 변경할 수 있도록 하세요.
*   정확한 환율 변환 대신 **현지 가격대**로 변환하세요.
*   각 거래에 통화와 수수료를 **고정하여 저장**하고, 수익은 통화별로 집계하세요.
*   서버 측에서 당신이 생성하고 구매자에게 연결된 주문을 기준으로 결제를 **재추론하여 검증**하세요. 클라이언트의 말 대신 제공업체의 기록을 신뢰하세요.

이 모든 것이 특별히 어려운 기술은 아닙니다. 그저 "스트라이프를 붙이면 돼!"라는 답변 뒤에 숨겨져 아무도 언급하지 않는 것들이죠. 그리고 당신의 자체 테스트 계정에서 첫 "현재 문제가 발생한 것 같습니다"라는 메시지를 보기 전까지는 이 모든 것이 보이지 않을 겁니다.

---

*이 내용은 제가 [Skill Exchange](https://skillexchange.tapdot.org)를 만들면서 배운 것들입니다. Skill Exchange는 재사용 가능한 AI 스킬 마켓플레이스로, 모든 리스팅은 실제로 작동함을 증명해야 합니다. 결제 관련 질문이 있다면 댓글로 남겨주시면 기꺼이 답변해 드리겠습니다.*

---
원문: [https://dev.to/mohanvenkatakrishnan/dollars-and-rupees-without-stripe-what-building-skill-exchanges-checkout-taught-me-paypal-upi-3i8p](https://dev.to/mohanvenkatakrishnan/dollars-and-rupees-without-stripe-what-building-skill-exchanges-checkout-taught-me-paypal-upi-3i8p)
수집일: 2026-08-04 01:16:07
