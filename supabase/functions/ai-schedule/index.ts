
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST 요청만 허용됩니다." }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // API 키 가져오기
    const apiKey = Deno.env.get("AI_API_KEY");

    if (!apiKey) {
      throw new Error("AI_API_KEY가 설정되지 않았습니다.");
    }

    // React에서 전달받은 데이터
    const {
      userRequest,
      profile,
      schedules,
      todos,
      selectedDate,
    } = await req.json();

    if (
      typeof userRequest !== "string" ||
      !userRequest.trim()
    ) {
      return new Response(
        JSON.stringify({
          error: "일정 추천 요청을 입력해주세요.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // AI 프롬프트
    const prompt = `
당신은 사용자의 일정을 관리하는 개인 AI 비서입니다.

사용자의 요청과 기본 정보, 기존 일정 및 할 일을 분석하여
실행 가능한 일정을 추천해주세요.

[사용자 요청]
${userRequest}

[사용자 기본 정보]
${JSON.stringify(profile ?? {})}

[기존 일정]
${JSON.stringify(schedules ?? [])}

[할 일]
${JSON.stringify(todos ?? [])}

[선택한 날짜]
${selectedDate ?? ""}

[일정 분석 규칙]

1. 기존 일정의 시작 시간(time)과 소요 시간(duration)을 확인하세요.
2. duration은 분 단위입니다.
3. 시작 시간에 소요 시간을 더해 종료 시간을 계산하세요.
4. 기존 일정의 시작부터 종료까지를 점유 시간으로 판단하세요.
5. 기존 일정과 겹치는 시간에는 추천하지 마세요.
6. 사용자의 기본 정보와 생활 패턴을 반영하세요.
7. 할 일의 우선순위와 기존 일정 사이의 빈 시간을 고려하세요.
8. 이동 시간이나 준비 시간이 주어지지 않았다면 임의로 추가하지 마세요.
9. 정보가 부족하면 추측하지 말고 사용자에게 질문하세요.
10. 추천 날짜, 시작 시간, 소요 시간, 추천 이유를 구체적으로 작성하세요.
11. 한국어로 답변하세요.
12. 실제 일정 등록은 하지 말고 추천만 하세요.

[응답 형식]

추천 일정:
- 날짜:
- 제목:
- 시작 시간:
- 소요 시간:
- 추천 이유:

필요하다면 추가 설명을 작성하세요.
`;

  console.log("Gemini 상태:", response.status);
  console.log("Gemini 원본 응답:", JSON.stringify(result));

    // Gemini API 호출
    const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.5-flash-lite",
          input: prompt,
          generation_config: {
            max_output_tokens: 1500,
          },
        }),
      },
    );

    const result = await response.json();

    // Gemini API 오류 처리
    if (!response.ok) {
      console.error("Gemini API Error:", {
        status: response.status,
        message: result.error?.message,
      });

      return new Response(
        JSON.stringify({
          error:
            result.error?.message ??
            "Gemini API 요청에 실패했습니다.",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // AI 응답 추출
    const answer = result.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!answer) {
      throw new Error("Gemini 응답이 비어 있습니다.");
    }

    // React로 결과 반환
    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("AI Schedule Error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
