
import { supabase } from "./supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface AiScheduleRequest {
  userRequest: string;
  profile?: object;
  schedules?: object[];
  todos?: object[];
  selectedDate?: string;
}

export async function requestAiSchedule(
  data: AiScheduleRequest
) {
  const { data: result, error } =
    await supabase.functions.invoke("ai-schedule", {
      body: data,
    });

  if (error instanceof FunctionsHttpError) {
    const errorBody = await error.context.json();

    console.error("AI 상세 오류:", errorBody);

    throw new Error(
      errorBody?.error ?? `AI 요청 실패: ${error.context.status}`
    );
  }

  if (error) {
    console.error("Supabase 호출 오류:", error);
    throw new Error(error.message);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result.answer as string;
}
