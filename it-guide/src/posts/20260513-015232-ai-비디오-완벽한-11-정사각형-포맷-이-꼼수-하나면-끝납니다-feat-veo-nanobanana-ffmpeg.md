# AI 비디오, 완벽한 1:1 정사각형 포맷? 이 '꼼수' 하나면 끝납니다! (Feat. Veo, NanoBanana, FFmpeg)

최근 AI 비디오 생성 기능을 이것저것 만져봤다면, 다들 공감할 겁니다. 기술 자체는 정말 미친 듯이 멋지지만, 원하는 포맷으로 *정확히* 뽑아내는 건 2014년에 `<div>` 요소를 정가운데 배치하는 것만큼이나 골치 아픈 일이죠. 맙소사!

얼마 전, 저는 Google의 새로운 비디오 모델들을 사용해서 완벽하게 루프되는 고품질의 **정사각형(1:1) 비디오**를 오디오와 함께 생성해야 할 일이 있었습니다. 문제는 뭘까요? 모델 티어에 따라 기본 종횡비(aspect ratio) 지원이 꽤 까다로울 수 있다는 점입니다. 게다가 16:9나 9:16으로 생성된 비디오를 단순히 크롭하면 프레이밍이 망가지거나, 가장자리에 이상한 아티팩트가 생기는 '환각' 현상이 자주 발생하더군요.

그래서 좀 더 깊이 파고들 수밖에 없었습니다. 약간 '꼼수' 같지만 확실히 작동하는 해결책을 **NanoBanana 2**, **Veo 3.1 Lite**, 그리고 언제나 믿음직한 친구 **FFmpeg**를 조합해서 찾아냈습니다. 이 파이프라인만 있다면 완벽한 정사각형 AI 비디오를 손쉽게 얻을 수 있습니다.

### TL;DR (핵심만 빠르게!)
1.  **정사각형 이미지 컨셉**부터 시작합니다.
2.  **NanoBanana 2**에게 이 이미지를 9:16 종횡비로 변환해 달라고 요청합니다. 이때, 위아래에 검은색 바를 추가해서 폰 화면 비율을 만듭니다.
3.  그렇게 생성된 폰 형식의 9:16 이미지를 **Veo 3.1 Lite**의 시작 및 끝 프레임으로 넣어 완벽한 루프 비디오를 강제합니다.
4.  마지막으로 `ffmpeg`를 사용하는 간단한 파이썬 스크립트를 돌려 검은색 바를 깔끔하게 잘라냅니다.

끝. 완벽한 정사각형 비디오가 뚝딱! 오디오 싱크도 완벽하고, 가장자리에 이상한 환각 현상도 전혀 없습니다. 자, 그럼 이 플로우를 파이썬으로 자동화하는 방법을 자세히 알아볼까요? 🐍

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ucp1nk4vu7wel4hinj55.png)

---

### Step 1: "폰 포맷" 9:16 프레임, NanoBanana 2로 만들기
가장 먼저, 위아래에 검은색 바가 포함된 9:16 이미지를 생성해야 합니다. 새로 나온 [Gemini API SDK](https://github.com/googleapis/python-genai)를 활용하면 NanoBanana 2가 이 어려운 작업을 알아서 처리해 줍니다.

```python
from google import genai
from google.genai import types

# 클라이언트 초기화
client = genai.Client(api_key="여러분의_API_키")

def generate_padded_frame(prompt, output_filename):
    print("🎨 NanoBanana 2로 패딩된 9:16 이미지 생성 중...")
    
    # NanoBanana 2에게 메인 피사체는 정중앙에 정사각형으로 유지하고,
    # 위아래에 단색 검은색 바를 추가해서 전체 종횡비를 9:16으로 만들라고 명시적으로 지시합니다.
    hacked_prompt = f"{prompt}. 메인 피사체를 정중앙에 완벽한 정사각형으로 유지하고, 위아래에 단색 검은색 바를 추가하여 전체 종횡비를 9:16으로 만드세요."
    
    result = client.models.generate_images(
        model='nanobanana-2', # 우리의 든든한 이미지 모델
        prompt=hacked_prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="9:16",
            output_mime_type="image/jpeg"
        )
    )
    
    # 결과 저장
    for generated_image in result.generated_images:
        image = generated_image.image
        image.save(output_filename)
        print(f"✅ {output_filename}으로 저장되었습니다.")

# 시작/끝 프레임 생성
generate_padded_frame("고요한 연못에 서 있는 위엄 있는 분홍 플라밍고", "flamingo_padded.jpg")
```

### Step 2: Veo 3.1 Lite로 비디오 생성하기
이제 검은색 바가 추가된 9:16 이미지(`flamingo_padded.jpg`)가 준비되었으니, 이를 Veo 3.1 Lite에 넘겨줍니다. 이 이미지를 시각적 프롬프트로 사용하면 비디오 생성 과정 내내 정확히 그 검은색 바들이 유지됩니다.

*(참고: Veo 웹 UI에서는 이 이미지를 시작 및 끝 프레임으로 설정하여 완벽한 루프를 만들 수 있습니다. 여기서는 API를 통해 이미지로부터 비디오를 생성하는 방법을 보여드립니다.)*

```python
import time

def generate_video(image_path, video_prompt, output_filename):
    print("🎬 프레임 업로드 및 Veo 3.1 Lite 프롬프트 입력 중...")
    
    # 패딩된 이미지를 Gemini API에 업로드
    initial_frame = client.files.upload(file=image_path)
    
    # 파일 처리가 완료될 때까지 대기
    while initial_frame.state.name == "PROCESSING":
        print(".", end="", flush=True)
        time.sleep(2)
        initial_frame = client.files.get(name=initial_frame.name)
    
    # Veo 3.1 Lite 호출
    # 피사체는 움직이되, 위아래 검은색 바는 그대로 유지하도록 요청합니다.
    response = client.models.generate_content(
        model='veo-3.1-lite',
        contents=[
            initial_frame, 
            f"{video_prompt}. 플라밍고는 살짝 움직이지만, 위아래 검은색 바는 정확히 동일하게 유지되어야 합니다."
        ]
    )
    
    # 생성된 비디오 바이트 저장
    with open(output_filename, "wb") as f:
        # NOTE: 반환되는 원본 바이트 데이터 처리 방식에 따라 달라질 수 있습니다.
        # 일부 API는 response.content를 바로 사용할 수 있습니다.
        f.write(response.text.encode('utf-8')) 
    print(f"\n✅ 비디오가 생성되어 {output_filename}으로 저장되었습니다.")

generate_video("flamingo_padded.jpg", "플라밍고가 주위를 둘러보는 시네마틱 쇼트", "raw_veo_output.mp4")
```

### Step 3: `ffmpeg` 후처리로 마무리!
이제 아름다운 플라밍고 비디오를 얻었지만, 여전히 위아래에 거슬리는 검은색 바가 있는 9:16 파일입니다.

물론 MoviePy 같은 파이썬 라이브러리로 프레임별 크롭을 할 수도 있습니다. 하지만 솔직히 말해서, `subprocess` 모듈을 통한 `ffmpeg` 사용이 훨씬 빠르고, 메모리를 적게 사용하며, 가장 중요하게는 **오디오 스트림을 재인코딩 없이 완벽하게 보존**합니다. 제가 실무에서 이 부분을 테스트해 봤을 때, `MoviePy` 같은 라이브러리로 프레임별 처리를 시도하면 메모리 사용량과 처리 속도 때문에 답답함을 느낄 때가 많았거든요. 하지만 `ffmpeg`는 정말 압도적입니다.

비디오가 9:16이므로, `iw:iw` (입력 너비 : 입력 너비)로 잘라내면 완벽한 1:1 정사각형이 됩니다. FFmpeg는 크롭을 자동으로 중앙에 맞춰주는 스마트한 기능이 있어 위아래 검은색 바를 완벽하게 잘라낼 수 있습니다.

```python
import subprocess

def crop_to_square(input_video, output_video):
    print("✂️ FFmpeg로 검은색 바 잘라내는 중...")
    
    command =[
        'ffmpeg',
        '-y',                 # 출력 파일이 존재하면 덮어쓰기
        '-i', input_video,    # 입력 파일
        '-vf', 'crop=iw:iw',  # 비디오 필터: 너비 x 너비로 크롭 (자동으로 중앙에 맞춰짐!)
        '-c:a', 'copy',       # 오디오를 그대로 복사합니다 (성능 면에서 정말 최고죠!)
        output_video
    ]
    
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"🔥 성공! 완벽한 정사각형 비디오가 {output_video}에 저장되었습니다.")
    except subprocess.CalledProcessError as e:
        print(f"💀 FFmpeg 실패: {e}")

# 최종 크롭 실행
crop_to_square("raw_veo_output.mp4", "final_square_flamingo.mp4")
```

{% embed https://x.com/DynamicWebPaige/status/2054247282841985125 %}

### 왜 이 '꼼수'가 제대로 통할까요?
1.  **정확한 프레이밍 제어:** AI에게 검은색 바를 먼저 그려내도록 강제하면, 메인 피사체의 프레이밍을 *우리가* 직접 제어할 수 있습니다. 비디오 모델이 뭘 중앙에 둬야 할지 추측하는 데 의존할 필요가 없죠.
2.  **오디오 완벽 보존:** FFmpeg의 `'-c:a', 'copy'` 플래그는 비디오 파일을 조작할 때 오디오 품질 손실을 전혀 발생시키지 않습니다. 정말 중요한 부분이죠.
3.  **환각 현상 제로:** 비디오 모델이 검은색 바를 그대로 유지하라는 지시를 명확히 받았기 때문에, 가장자리 위아래에 이상한 배경 디테일을 생성하려고 연산 자원을 낭비하지 않습니다.

가끔 최고의 엔지니어링 솔루션은 그저 단순한 도구들을 멋진 코트 안에 겹쳐 입히는 것과 같습니다. 🧥 마치 스파이처럼 말이죠!

여러분은 AI 비디오 생성 API를 다루면서 또 다른 기발하거나 천재적인 '꼼수'를 발견한 적이 있으신가요? 댓글로 공유해 주세요. 제가 직접 테스트해 보고 싶네요!

*(P.S. 파이썬 스크립트를 실행하기 전에 `ffmpeg`가 시스템에 설치되어 있는지 꼭 확인하세요. 그렇지 않으면 에러 메시지가 여러분을 반길 겁니다!)*

---
원문: [https://dev.to/googleai/hacking-perfectly-square-ai-videos-with-veo-31-and-nanobanana-2-5cpn](https://dev.to/googleai/hacking-perfectly-square-ai-videos-with-veo-31-and-nanobanana-2-5cpn)
수집일: 2026-05-13 01:52:32
