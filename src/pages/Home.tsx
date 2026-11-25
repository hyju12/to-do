// import { useEffect, useRef, useState, type ReactNode } from "react";

// /* ================= 타입 ================= */
// type Kind = "event" | "todo";
// type SlotKey = "morning" | "afternoon" | "evening";

// export interface Item {
//   id: string;
//   kind: Kind;
//   title: string;
//   date: string; // YYYY-MM-DD
//   start?: string; // HH:mm (선택)
//   end?: string; // HH:mm (선택)
//   place: string; // 지역/장소 (예: 서울 강남구, 논현동)
//   memo: string;
//   done?: boolean; // 할일 완료 여부
//   series?: string; // 반복 일정 묶음 id
// }
// export interface Profile {
//   preferredDays: number[]; // 0(일)~6(토)
//   slots: SlotKey[]; // 선호 시간대
//   dayStart: number; // 활동 시작(시)
//   dayEnd: number; // 활동 종료(시)
//   buffer: number; // 일정 사이 최소 여유(분)
//   maxPerDay: number; // 하루 최대 일정 수
// }
// export interface SuggestRequest {
//   title: string;
//   duration: number; // 분
//   from: string;
//   to: string;
//   place: string;
//   memo: string;
// }
// export interface Suggestion {
//   allDay?: boolean;
//   date: string;
//   start: string;
//   end: string;
//   score: number;
//   why: string[];
// }
// type ItemForm = { title: string; date: string; start: string; end: string; place: string; memo: string }; // date는 자유 입력 텍스트
// type Repeat = "none" | "daily" | "weekdays" | "weekly" | "monthly";
// type Scope = "one" | "after" | "all";
// type Edit = { id: string; form: ItemForm; scope: Scope };
// type Transfer = { id: string; mode: "copy" | "move"; date: string; warn: string };

// /* ================= 유틸 ================= */
// const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
// const pad = (n: number): string => String(n).padStart(2, "0");
// const ymd = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// const parse = (s: string): Date => {
//   const [y, m, d] = s.split("-").map(Number);
//   return new Date(y, m - 1, d);
// };
// const addDays = (s: string, n: number): string => {
//   const d = parse(s);
//   d.setDate(d.getDate() + n);
//   return ymd(d);
// };
// const toMin = (t: string): number => {
//   const [h, m] = t.split(":").map(Number);
//   return h * 60 + m;
// };
// const toTime = (n: number): string => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
// const uid = (): string => Math.random().toString(36).slice(2, 9);
// function load<T>(key: string, fallback: T): T {
//   try {
//     const v = localStorage.getItem(key);
//     return v ? (JSON.parse(v) as T) : fallback;
//   } catch {
//     return fallback;
//   }
// }
// const timed = (i: Item): i is Item & { start: string; end: string } => i.kind === "event" && !!i.start && !!i.end;
// const byTime = (a: Item, b: Item): number => (a.start ?? "99:99").localeCompare(b.start ?? "99:99") || a.kind.localeCompare(b.kind);

// /* ================= 지역 거리 (서울 25개 구 중심 좌표: 행정구역 경계 데이터로 계산) ================= */
// const GU: Record<string, [number, number]> = {
//   강동구: [37.548, 127.149], 송파구: [37.502, 127.117], 강남구: [37.494, 127.065], 서초구: [37.471, 127.033],
//   관악구: [37.464, 126.948], 동작구: [37.497, 126.954], 영등포구: [37.517, 126.912], 금천구: [37.458, 126.903],
//   구로구: [37.492, 126.859], 강서구: [37.558, 126.827], 양천구: [37.522, 126.858], 마포구: [37.555, 126.912],
//   서대문구: [37.575, 126.941], 은평구: [37.617, 126.931], 노원구: [37.649, 127.077], 도봉구: [37.666, 127.034],
//   강북구: [37.641, 127.013], 성북구: [37.603, 127.02], 중랑구: [37.595, 127.095], 동대문구: [37.579, 127.057],
//   광진구: [37.544, 127.089], 성동구: [37.548, 127.043], 용산구: [37.53, 126.982], 중구: [37.557, 126.998],
//   종로구: [37.591, 126.98],
// };
// // 자주 쓰는 동 → 구 (필요하면 여기에 추가)
// const DONG_TO_GU: Record<string, string> = {
//   논현동: "강남구", 역삼동: "강남구", 삼성동: "강남구", 청담동: "강남구", 잠실동: "송파구",
//   여의도동: "영등포구", 상암동: "마포구", 연남동: "마포구", 이태원동: "용산구", 한남동: "용산구", 성수동: "성동구",
// };
// export function resolveRegion(place: string): string | null {
//   for (const dong of Object.keys(DONG_TO_GU)) if (place.includes(dong)) return DONG_TO_GU[dong];
//   for (const gu of Object.keys(GU)) if (place.includes(gu)) return gu;
//   return null;
// }
// /** 두 구 중심 간 대략적인 도로 거리(km): 직선거리 × 1.3 */
// export function regionKm(a: string, b: string): number {
//   if (a === b) return 0;
//   const [la1, lo1] = GU[a];
//   const [la2, lo2] = GU[b];
//   const R = 6371;
//   const rad = (x: number) => (x * Math.PI) / 180;
//   const h = Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
//   return 2 * R * Math.asin(Math.sqrt(h)) * 1.3;
// }
// const travelMin = (km: number): number => (km === 0 ? 0 : Math.round(10 + km * 3));

// /* ================= 선호 설정 ================= */
// const SLOT_RANGE: Record<SlotKey, [number, number, string]> = {
//   morning: [9, 12, "오전"],
//   afternoon: [12, 18, "오후"],
//   evening: [18, 22, "저녁"],
// };
// const PRESETS: { label: string; days: number[]; slots: SlotKey[] }[] = [
//   { label: "평일 낮", days: [1, 2, 3, 4, 5], slots: ["morning", "afternoon"] },
//   { label: "아침형", days: [1, 2, 3, 4, 5], slots: ["morning"] },
//   { label: "저녁형", days: [1, 2, 3, 4, 5], slots: ["evening"] },
//   { label: "주말 위주", days: [0, 6], slots: ["morning", "afternoon"] },
// ];
// const DEFAULT_PROFILE: Profile = { preferredDays: [1, 2, 3, 4, 5], slots: ["morning", "afternoon"], dayStart: 9, dayEnd: 21, buffer: 30, maxPerDay: 4 };

// /* ================= 근무시간 / 휴가 ================= */
// export interface WorkSettings { enabled: boolean; days: number[]; start: string; end: string; lunchStart: string; lunchEnd: string; region: string }
// export interface Leave { id: string; type: "full" | "am" | "pm" | "holiday"; from: string; to: string; label: string }
// const DEFAULT_WORK: WorkSettings = { enabled: true, days: [1, 2, 3, 4, 5], start: "09:00", end: "18:00", lunchStart: "12:00", lunchEnd: "13:00", region: "" };
// const NEAR_KM = 8; // 점심시간에 '회사 근처'로 보는 거리(구 중심 기준 도로 추정 km)
// const LEAVE_LABEL: Record<Leave["type"], string> = { full: "연차", am: "오전 반차", pm: "오후 반차", holiday: "휴무일" };

// /** 그날 실제로 근무하는 구간. 연차·반차·휴무일은 근무시간에서 제외한다. */
// function workPlan(key: string, w: WorkSettings, leaves: Leave[]): { segs: [number, number][]; lunch: [number, number] | null; tag: string } {
//   const none = { segs: [] as [number, number][], lunch: null, tag: "" };
//   if (!w.enabled || !w.days.includes(parse(key).getDay())) return none;
//   const L = leaves.filter((l) => l.from <= key && key <= l.to);
//   const full = L.find((l) => l.type === "full" || l.type === "holiday");
//   if (full) return { ...none, tag: LEAVE_LABEL[full.type] };
//   const am = L.some((l) => l.type === "am");
//   const pm = L.some((l) => l.type === "pm");
//   const [st, en, ls, le] = [toMin(w.start), toMin(w.end), toMin(w.lunchStart), toMin(w.lunchEnd)];
//   const segs: [number, number][] = [];
//   if (!am && st < ls) segs.push([st, ls]);
//   if (!pm && le < en) segs.push([le, en]);
//   return { segs, lunch: am || pm ? null : [ls, le], tag: am && pm ? "오전·오후 반차" : am ? "오전 반차" : pm ? "오후 반차" : "" };
// }

// /* ================= 규칙 기반 추천 (AI로 교체할 땐 이 함수만 바꾸면 됨) =================
//  * 점수(100): 선호 요일 30 + 선호 시간대 30 + 동선 25 + 여유 15
//  * 동선: 같은 날 일정과 지역이 가까울수록 가산, 다른 지역이면 이동 시간만큼 간격을 추가로 확보 */
// export interface Constraints { days?: number[]; window?: [number, number]; allDay?: boolean; offOnly?: boolean; emptyDay?: boolean; soon?: boolean; light?: boolean; time?: "early" | "late" }
// function suggest(req: SuggestRequest, items: Item[], p: Profile, work: WorkSettings = DEFAULT_WORK, leaves: Leave[] = [], cons?: Constraints): Suggestion[] {
//   const dur = Number(req.duration);
//   const newRegion = resolveRegion(req.place);
//   const companyGu = resolveRegion(work.region);
//   const ranges = p.slots.map((k) => [SLOT_RANGE[k][0] * 60, SLOT_RANGE[k][1] * 60] as const);
//   const out: Suggestion[] = [];

//   for (let key = req.from; key <= req.to; key = addDays(key, 1)) {
//     const day = items.filter((i) => i.kind === "event" && i.date === key);
//     if (day.length >= p.maxPerDay) continue;
//     const dow = parse(key).getDay();
//     if (cons?.days && !cons.days.includes(dow)) continue;
//     const dayOk = cons?.days ? true : p.preferredDays.includes(dow);
//     const regions = day.map((i) => resolveRegion(i.place)).filter((r): r is string => r !== null);

//     let route = 12; // 지역 정보가 없으면 중립 점수
//     let routeWhy = "";
//     if (newRegion && regions.length > 0) {
//       const km = Math.min(...regions.map((r) => regionKm(newRegion, r)));
//       route = Math.round(25 * Math.max(0, 1 - km / 20));
//       const near = regions.find((r) => regionKm(newRegion, r) === km) as string;
//       routeWhy = km === 0 ? `같은 지역 일정 있음(${near})` : `${km < 20 ? "가까운" : "먼"} 지역 일정(${near}, 약 ${Math.round(km)}km)`;
//     }
//     const light = Math.max(0, 15 - day.length * 4) * (cons?.light ? 2 : 1);
//     // 근무 구간(회사↔일정 지역 이동시간만큼 앞뒤 확장)과 점심시간 허용 여부
//     const plan = workPlan(key, work, leaves);
//     const tw = companyGu && newRegion ? travelMin(regionKm(companyGu, newRegion)) : 0;
//     const blocked = plan.segs.map(([a, b]) => [a - tw, b + tw] as const);
//     const lunchOk = !!plan.lunch && !!companyGu && !!newRegion && regionKm(companyGu, newRegion) <= NEAR_KM;
//     // 종일·쉬는 날·빈 날 조건
//     if ((cons?.allDay || cons?.offOnly) && (plan.segs.length > 0 || plan.lunch)) continue;
//     if ((cons?.allDay || cons?.emptyDay) && day.length > 0) continue;
//     if (cons?.allDay) {
//       out.push({
//         date: key, start: "", end: "", allDay: true, score: Math.min(100, (dayOk ? 30 : 0) + 30 + route + light),
//         why: [dayOk ? (cons.days ? "요청 요일" : "선호 요일") : "", routeWhy, plan.tag ? `근무 제외: ${plan.tag}` : "근무 없는 날", "당일 일정 없음"].filter(Boolean),
//       });
//       continue;
//     }

//     let best: Suggestion | null = null;
//     const lo = cons?.window ? cons.window[0] : p.dayStart * 60;
//     const hi = cons?.window ? cons.window[1] : p.dayEnd * 60;
//     for (let s = lo; s + dur <= hi; s += 30) {
//       const e = s + dur;
//       const clash = day.filter(timed).some((ev) => {
//         const r = resolveRegion(ev.place);
//         const gap = Math.max(p.buffer, newRegion && r ? travelMin(regionKm(newRegion, r)) : 0);
//         return s < toMin(ev.end) + gap && e > toMin(ev.start) - gap;
//       });
//       if (clash) continue;
//       const inLunch = !!plan.lunch && s < plan.lunch[1] && e > plan.lunch[0];
//       if (inLunch && !lunchOk) continue;
//       // 회사 근처 일정이 점심시간 안에 완전히 들어가면 이동 여유 없이 허용
//       const inLunchFull = lunchOk && !!plan.lunch && s >= plan.lunch[0] && e <= plan.lunch[1];
//       if (!inLunchFull && blocked.some(([a, b]) => s < b && e > a)) continue;

//       const covered = ranges.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(e, b) - Math.max(s, a)), 0);
//       const overlap = cons?.window ? 1 : Math.min(1, covered / dur);
//       const span = Math.max(1, hi - lo - dur);
//       const tb = cons?.time === "early" ? Math.round(10 * (1 - (s - lo) / span)) : cons?.time === "late" ? Math.round(10 * ((s - lo) / span)) : 0;
//       const score = Math.min(100, Math.round((dayOk ? 30 : 0) + overlap * 30 + route + light + tb));
//       if (!best || score > best.score) {
//         const why: string[] = [];
//         if (dayOk) why.push(cons?.days ? "요청 요일" : "선호 요일");
//         if (overlap === 1) why.push(cons?.window ? "요청 시간대" : "선호 시간대");
//         else if (overlap > 0) why.push("선호 시간대 일부");
//         if (routeWhy) why.push(routeWhy);
//         if (inLunch) why.push("점심시간(회사 근처)");
//         if (plan.tag) why.push(`근무 제외: ${plan.tag}`);
//         if (cons?.time) why.push(cons.time === "early" ? "이른 시간" : "늦은 시간");
//         if (day.length === 0) why.push("당일 일정 없음");
//         best = { date: key, start: toTime(s), end: toTime(e), score, why };
//       }
//     }
//     if (best) out.push(best);
//   }
//   const sorted = cons?.soon
//     ? out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
//     : out.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
//   return sorted.slice(0, 3);
// }

// /* ================= 날짜·문장 파싱 ================= */
// const cut = (t: string, m: RegExpMatchArray): string =>
//   (t.slice(0, m.index ?? 0) + " " + t.slice((m.index ?? 0) + m[0].length)).replace(/\s+/g, " ").trim();
// const mondayOf = (s: string): string => addDays(s, -((parse(s).getDay() + 6) % 7));
// const monthsLater = (s: string, n: number): string => {
//   const d = parse(s);
//   return ymd(new Date(d.getFullYear(), d.getMonth() + n, d.getDate()));
// };

// /** "내일", "다음주 화", "12/3", "3일 뒤", "2주 뒤", "금요일", "15일", "2026-12-03" 등에서 날짜를 찾는다 */
// export function extractDate(text: string, base: string): { date: string; rest: string } | null {
//   const y0 = parse(base).getFullYear();
//   const md = (mo: number, d: number): string | null => {
//     if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
//     let t = new Date(y0, mo - 1, d);
//     if (ymd(t) < base) t = new Date(y0 + 1, mo - 1, d);
//     return ymd(t);
//   };
//   let m: RegExpMatchArray | null;
//   let dd: string | null;
//   if ((m = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) return { date: ymd(new Date(+m[1], +m[2] - 1, +m[3])), rest: cut(text, m) };
//   if ((m = text.match(/(\d{1,2})월\s*(\d{1,2})일/)) && (dd = md(+m[1], +m[2]))) return { date: dd, rest: cut(text, m) };
//   if ((m = text.match(/(\d{1,2})[/.](\d{1,2})(?![\d:])/)) && (dd = md(+m[1], +m[2]))) return { date: dd, rest: cut(text, m) };
//   if ((m = text.match(/(\d+)\s*일\s*(?:뒤|후)/))) return { date: addDays(base, +m[1]), rest: cut(text, m) };
//   if ((m = text.match(/(\d+)\s*주\s*(?:뒤|후)/))) return { date: addDays(base, 7 * +m[1]), rest: cut(text, m) };
//   if ((m = text.match(/오늘|내일|모레|글피/))) return { date: addDays(base, ["오늘", "내일", "모레", "글피"].indexOf(m[0])), rest: cut(text, m) };
//   if ((m = text.match(/(이번|다음|다다음)\s*주\s*([일월화수목금토])(?:요일)?/))) {
//     const k = ["이번", "다음", "다다음"].indexOf(m[1]);
//     return { date: addDays(mondayOf(base), 7 * k + ((DAYS.indexOf(m[2]) + 6) % 7)), rest: cut(text, m) };
//   }
//   if ((m = text.match(/([일월화수목금토])요일/))) {
//     return { date: addDays(base, (DAYS.indexOf(m[1]) - parse(base).getDay() + 7) % 7), rest: cut(text, m) };
//   }
//   if ((m = text.match(/(\d{1,2})일(?!\s*(?:뒤|후))/)) && +m[1] >= 1 && +m[1] <= 31) {
//     const b = parse(base);
//     let t = new Date(b.getFullYear(), b.getMonth(), +m[1]);
//     if (ymd(t) < base) t = new Date(b.getFullYear(), b.getMonth() + 1, +m[1]);
//     return { date: ymd(t), rest: cut(text, m) };
//   }
//   return null;
// }
// /** 날짜 칸 전용: 전체가 날짜 표현일 때만 인정 */
// export function parseDateInput(text: string, base: string): string | null {
//   if (!text.trim()) return null;
//   const r = extractDate(text.trim(), base);
//   return r && r.rest === "" ? r.date : null;
// }

// function extractTime(text: string): { start: string; rest: string } | null {
//   let m = text.match(/(\d{1,2}):(\d{2})/);
//   if (m && +m[1] < 24 && +m[2] < 60) return { start: toTime(+m[1] * 60 + +m[2]), rest: cut(text, m) };
//   m = text.match(/(오전|오후|아침|낮|저녁|밤)?\s*(\d{1,2})\s*시(?!간)\s*(?:(\d{1,2})\s*분|(반))?/);
//   if (!m) return null;
//   let h = +m[2];
//   const min = m[4] ? 30 : +(m[3] ?? 0);
//   const pm = m[1] === "오후" || m[1] === "저녁" || m[1] === "밤" || m[1] === "낮";
//   if (pm && h < 12) h += 12;
//   else if (!m[1] && h >= 1 && h <= 6) h += 12; // 표시가 없으면 1~6시는 오후로 간주
//   if (h > 23 || min > 59) return null;
//   return { start: toTime(h * 60 + min), rest: cut(text, m) };
// }

// export interface Quick { title: string; kind: Kind; date: string | null; start: string; end: string; place: string; repeat: Repeat; days: number[] }
// /** 예: "내일 오후 3시 강남구 미팅", "매주 화 10시 1시간 스탠드업", "할일 12/3 보고서 제출" */
// export function parseQuick(input: string, base: string): Quick {
//   let t = input.trim();
//   let kind: Kind = "event";
//   const k = t.match(/^(할일|todo)\s*[:：]?\s*/i);
//   if (k) { kind = "todo"; t = t.slice(k[0].length); }

//   let repeat: Repeat = "none";
//   let days: number[] = [];
//   let m: RegExpMatchArray | null;
//   if ((m = t.match(/매주\s*([일월화수목금토](?:\s*[,·]\s*[일월화수목금토])*)(?:요일)?(?=\s|$)/))) {
//     repeat = "weekly";
//     days = [...m[1]].filter((c) => DAYS.includes(c)).map((c) => DAYS.indexOf(c));
//     t = cut(t, m);
//   } else if ((m = t.match(/매주(?=\s|$)/))) { repeat = "weekly"; t = cut(t, m); }
//   else if ((m = t.match(/평일마다|매\s*평일/))) { repeat = "weekdays"; t = cut(t, m); }
//   else if ((m = t.match(/매일/))) { repeat = "daily"; t = cut(t, m); }
//   else if ((m = t.match(/매월|매달/))) { repeat = "monthly"; t = cut(t, m); }

//   let date: string | null = null;
//   const d = extractDate(t, base);
//   if (d) { date = d.date; t = d.rest; }

//   let dur = 0;
//   if ((m = t.match(/(\d+(?:\.\d+)?)\s*시간(?:\s*(?:(반)|(\d+)\s*분))?/))) {
//     dur = Math.round(parseFloat(m[1]) * 60) + (m[2] ? 30 : +(m[3] ?? 0));
//     t = cut(t, m);
//   }
//   let start = "";
//   const tm = extractTime(t);
//   if (tm) { start = tm.start; t = tm.rest; }
//   if (!dur && (m = t.match(/(\d+)\s*분/))) { dur = +m[1]; t = cut(t, m); }
//   const end = start && dur ? toTime(Math.min(toMin(start) + dur, 1439)) : "";

//   const key = [...Object.keys(DONG_TO_GU), ...Object.keys(GU)].find((x) => t.includes(x));
//   let place = "";
//   if (key) { place = `서울 ${key}`; t = t.replace(/서울(?:특별시)?\s*/, "").replace(key, "").replace(/\s+/g, " ").trim(); }

//   return { title: t, kind, date, start, end, place, repeat, days };
// }

// /* ================= 추천 문장 해석 (규칙 기반) ================= */
// export interface SuggestQuery {
//   title: string; place: string; duration: number | null; memo: string;
//   from: string | null; to: string | null; days: number[] | null; window: [number, number] | null;
//   allDay: boolean; offOnly: boolean; emptyDay: boolean; soon: boolean; light: boolean; time: "early" | "late" | null;
//   notes: string[];
// }
// const TOK = "(?:(오전|오후)\\s*)?(\\d{1,2})(?::(\\d{2})|\\s*시(?:\\s*(\\d{1,2})\\s*분)?)";
// const RANGE_RE = new RegExp(`${TOK}\\s*(?:-|~|～|부터)\\s*${TOK}\\s*(?:까지)?`);
// const SINGLE_RE = new RegExp(`${TOK}\\s*(이후|이전|부터|까지|전|후|쯤|경)?`);
// const hm = (ap: string | undefined, h: string, a: string | undefined, b: string | undefined): number => {
//   let hh = +h;
//   if (ap === "오후" && hh < 12) hh += 12;
//   else if (ap === "오전" && hh === 12) hh = 0;
//   else if (!ap && hh >= 1 && hh <= 6) hh += 12; // 표시가 없으면 1~6시는 오후로 간주
//   return hh * 60 + +(a ?? b ?? 0);
// };
// const KO_NUM: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6 };
// const COMPANIONS = ["친구", "가족", "부모님", "부모", "엄마", "아빠", "어머니", "아버지", "아내", "남편", "와이프", "배우자", "애인", "여자친구", "남자친구", "여친", "남친", "동료", "팀원", "팀", "후배", "선배", "동기", "지인", "이웃", "아이", "아들", "딸", "자녀", "아기", "형", "누나", "오빠", "언니", "동생", "할머니", "할아버지", "삼촌", "이모", "고모", "사촌", "친척", "형제", "자매", "선생님", "교수님", "상사", "팀장님", "팀장", "고객", "거래처", "사장님", "대표님", "직원", "애들"].sort((a, b) => b.length - a.length);
// const COMPANION_RE = new RegExp(`(?<![가-힣])((?:${COMPANIONS.join("|")})들?)(?:이랑|랑|와|과|하고)(?=\\s|$)`);
// const NAME_RE = /(?<![가-힣])([가-힣]{2,4}?)(?:이랑|랑)(?=\s|$)/;
// const FAMILY_RE = /가족|부모|친척|형제|자매|할머니|할아버지|삼촌|이모|고모|사촌/;
// const withJosa = (w: string): string => {
//   const c = w.charCodeAt(w.length - 1);
//   return `${w}${c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? "과" : "와"}`;
// };
// const DAYCH = "[일월화수목금토]";
// const ALLDAYS = [0, 1, 2, 3, 4, 5, 6];
// const VERB_END = /\s*(?:을|를)?\s*(?:할\s*거(?:야|예요|에요|임)?|할래(?:요)?|할게(?:요)?|하려(?:고|구)?(?:요)?|하고\s*싶[가-힣]*|하러|해야\s*[가-힣]*|하자|할\s*예정[가-힣]*|하겠[가-힣]*|잡[가-힣]*|보러|보자|볼래(?:요)?|볼\s*거[가-힣]*|볼게(?:요)?|가려(?:고|구)?(?:요)?|갈\s*거[가-힣]*|갈래(?:요)?|가자|가고\s*싶[가-힣]*|먹으러|먹자|먹을래(?:요)?|먹을\s*거[가-힣]*|먹고\s*싶[가-힣]*|놀러|놀자|받으러|받을\s*거[가-힣]*|다녀[가-힣]*|만들[가-힣]*)\s*[.!?]*$/;

// /** 예: "주말 저녁 가족식사", "친구랑 이번 주말에 만나려고", "하루종일 등산", "퇴근 후 운동 1시간",
//  *  "피부과 13:00-14:00 중에 1시간 예약", "월요일 빼고 평일 오전만", "가장 빠른 날 점심 회사 근처" */
// export function parseSuggest(input: string, base: string, p: Profile, w: WorkSettings, defDur = 60): SuggestQuery {
//   let t = input.trim();
//   const notes: string[] = [];
//   const lo = p.dayStart * 60;
//   const hi = p.dayEnd * 60;
//   let from: string | null = null;
//   let to: string | null = null;
//   let days: number[] | null = null;
//   let window: [number, number] | null = null;
//   let duration: number | null = null;
//   let memo = "";
//   let who = "";
//   let slotName = "";
//   let allDay = false, offOnly = false, emptyDay = false, soon = false, light = false;
//   let time: "early" | "late" | null = null;
//   let m: RegExpMatchArray | null;
//   const take = (re: RegExp): boolean => { const x = t.match(re); if (!x) return false; m = x; t = cut(t, x); return true; };

//   // 1) 종일 / 쉬는 날 / 빈 날 / 성향(빨리·여유·일찍·늦게)
//   if (take(/하루\s*종일|온종일|종일/)) { allDay = true; notes.push("종일 (일정·근무 없는 날)"); }
//   if (take(/(?:일정\s*(?:이\s*)?(?:없는|비는)|비어\s*있는|비는|아무\s*일정\s*없는)\s*(?:날|때)?/)) { emptyDay = true; notes.push("일정 없는 날"); }
//   if (take(/(?:쉬는\s*날|휴무일|휴일|연차\s*(?:날|일|때)|휴가\s*(?:날|일|때)|오프\s*(?:날|데이))/)) { offOnly = true; notes.push("쉬는 날"); }
//   if (take(/(?:가능한|최대한|되도록)?\s*(?:빨리|빠르게|가장\s*빠른|제일\s*빠른|당장|급하게|급히)/)) { soon = true; notes.push("가장 빠른 날짜순"); }
//   if (take(/여유\s*(?:롭게|있게|있는)|널널(?:하게|한)|한가(?:하게|한)|느긋(?:하게|한)|바쁘지\s*않(?:은|게)/)) { light = true; notes.push("여유로운 날 우선"); }
//   if (take(/일찍|이르게/)) { time = "early"; notes.push("이른 시간 우선"); }
//   else if (take(/늦게|느지막이|늦은\s*시간/)) { time = "late"; notes.push("늦은 시간 우선"); }

//   // 2) 소요 시간
//   const fmt = (d: number): string => (d % 60 === 0 ? `${d / 60}시간` : d > 60 ? `${Math.floor(d / 60)}시간 ${d % 60}분` : `${d}분`);
//   if ((m = t.match(/(\d+(?:\.\d+)?)\s*시간(?:\s*(?:(반)|(\d+)\s*분))?\s*(?:정도|쯤|가량)?/))) {
//     duration = Math.round(parseFloat(m[1]) * 60) + (m[2] ? 30 : +(m[3] ?? 0)); t = cut(t, m);
//   } else if ((m = t.match(/(한|두|세|네|다섯|여섯)\s*시간(?:\s*(반))?\s*(?:정도|쯤|가량)?/))) {
//     duration = KO_NUM[m[1]] * 60 + (m[2] ? 30 : 0); t = cut(t, m);
//   } else if ((m = t.match(/(\d+)\s*분\s*(?:정도|쯤|가량)?/))) { duration = +m[1]; t = cut(t, m); }
//   else if (take(/반나절/)) duration = 240;
//   else if (take(/잠깐|잠시|짧게|간단히|금방/)) duration = 30;
//   else if (take(/길게|오래|넉넉(?:히|하게)/)) duration = 120;
//   if (duration) notes.push(fmt(duration));

//   // 3) 제외 ("월요일 빼고", "주말 말고")
//   const excl = new Set<number>();
//   const exRe = new RegExp(`(?<![가-힣])(${DAYCH}요일|평일|주말)(?:은|는|을|를)?\\s*(?:빼고|제외(?:하고)?|말고|아니고)`, "g");
//   for (const x of t.matchAll(exRe)) {
//     if (x[1] === "평일") [1, 2, 3, 4, 5].forEach((d) => excl.add(d));
//     else if (x[1] === "주말") { excl.add(0); excl.add(6); }
//     else excl.add(DAYS.indexOf(x[1][0]));
//   }
//   t = t.replace(exRe, " ");

//   // 4) 시각: 범위 / 단일(이후·까지). "저녁 6시"처럼 시간대 단어가 붙으면 오전/오후로 바꿔 읽는다.
//   t = t.replace(/(?:저녁|낮|점심)\s*(\d{1,2}\s*(?::\d{2}|시))/g, "오후 $1").replace(/(?:아침|새벽)\s*(\d{1,2}\s*(?::\d{2}|시))/g, "오전 $1");
//   if (!allDay && (m = t.match(RANGE_RE))) {
//     const s = hm(m[1], m[2], m[3], m[4]);
//     const e = hm(m[5] ?? m[1], m[6], m[7], m[8]);
//     if (s < e && e <= 1440) { window = [s, e]; notes.push(`${toTime(s)}–${toTime(e)} 사이`); t = cut(t, m); }
//   }
//   if (!allDay && !window && (m = t.match(SINGLE_RE))) {
//     const s = hm(m[1], m[2], m[3], m[4]);
//     if (s < 1440) {
//       const suf = m[5];
//       if (suf === "이후" || suf === "부터" || suf === "후") { window = [s, Math.max(s + 30, hi)]; notes.push(`${toTime(s)} 이후`); }
//       else if (suf === "이전" || suf === "까지" || suf === "전") { window = [lo, Math.max(lo + 30, s)]; notes.push(`${toTime(s)}까지`); }
//       else { window = [s, Math.min(s + (duration ?? defDur), 1440)]; notes.push(`${toTime(s)}부터`); }
//       t = cut(t, m);
//     }
//   }

//   // 5) 퇴근 후 / 출근 전
//   if (!allDay && !window) {
//     if (take(/(?:퇴근|일과|근무)\s*(?:후|이후|하고|끝나고)(?:에)?/)) { window = [toMin(w.end), Math.max(toMin(w.end) + 30, hi)]; notes.push(`퇴근 후 ${w.end} 이후`); }
//     else if (take(/출근\s*(?:전|이전)(?:에)?/)) { window = [Math.min(lo, toMin(w.start) - 30), toMin(w.start)]; notes.push(`출근 전 ${w.start}까지`); }
//   }

//   // 6) 기간·날짜
//   if ((m = t.match(/(이번|다음|다다음)\s*주\s*(?:의\s*)?([일월화수목금토])(?:요일)?/))) {
//     const d = extractDate(m[0], base);
//     if (d) { from = to = d.date; t = cut(t, m); }
//   } else if ((m = t.match(/(이번|다음)\s*주중/))) {
//     const mon = addDays(mondayOf(base), m[1] === "다음" ? 7 : 0);
//     from = mon < base ? base : mon; to = addDays(mon, 4); days = [1, 2, 3, 4, 5]; notes.push(`${m[1]} 주 평일`); t = cut(t, m);
//   } else if ((m = t.match(/(이번|다음)\s*주(?!\s*[일월화수목금토])\s*(말)?/))) {
//     const mon = addDays(mondayOf(base), m[1] === "다음" ? 7 : 0);
//     from = m[2] ? addDays(mon, 5) : mon; to = addDays(mon, 6);
//     if (from < base) from = base;
//     if (m[2]) days = [0, 6];
//     notes.push(`${m[1]} 주${m[2] ? "말" : ""}`); t = cut(t, m);
//   } else if ((m = t.match(/(이번|다음)\s*달/))) {
//     const b = parse(base);
//     const f = new Date(b.getFullYear(), b.getMonth() + (m[1] === "다음" ? 1 : 0), 1);
//     from = ymd(f) < base ? base : ymd(f); to = ymd(new Date(f.getFullYear(), f.getMonth() + 1, 0));
//     notes.push(`${m[1]} 달`); t = cut(t, m);
//   } else if ((m = t.match(/(\d{1,2})\s*월\s*(초|중순|말|중)?(?!\s*\d)/)) && +m[1] >= 1 && +m[1] <= 12) {
//     const b = parse(base);
//     const yy = +m[1] - 1 < b.getMonth() ? b.getFullYear() + 1 : b.getFullYear();
//     const last = new Date(yy, +m[1], 0).getDate();
//     const [d1, d2] = m[2] === "초" ? [1, 10] : m[2] === "중순" ? [11, 20] : m[2] === "말" ? [21, last] : [1, last];
//     const f = ymd(new Date(yy, +m[1] - 1, d1));
//     from = f < base ? base : f; to = ymd(new Date(yy, +m[1] - 1, d2));
//     notes.push(`${m[1]}월${m[2] && m[2] !== "중" ? ` ${m[2]}` : ""}`); t = cut(t, m);
//   } else if ((m = t.match(/(\d+)\s*(일|주일|주)\s*(?:이내|안에|내에|안)/))) {
//     from = base; to = addDays(base, +m[1] * (m[2] === "일" ? 1 : 7));
//     notes.push(`${m[1]}${m[2]} 이내`); t = cut(t, m);
//   }

//   // 7) 평일 / 주말 / 요일 (화목, 월·수·금, 토요일)
//   if (take(/주중|평일/)) { days = [1, 2, 3, 4, 5]; notes.push("평일"); }
//   if (take(/주말/)) { days = [0, 6]; if (!notes.some((n) => n.endsWith("주말"))) notes.push("주말"); }
//   const wd = [...t.matchAll(new RegExp(`(${DAYCH})요일`, "g"))];
//   if (wd.length > 0) {
//     days = [...new Set(wd.map((x) => DAYS.indexOf(x[1])))];
//     t = t.replace(new RegExp(`(${DAYCH})요일`, "g"), " ");
//     notes.push(`${days.map((d) => DAYS[d]).join("·")}요일`);
//   } else if ((m = t.match(new RegExp(`(?<![가-힣])((?:${DAYCH}\\s*[,·/]\\s*)+${DAYCH})(?:요일)?(?=\\s|$|에|엔|은|는|만|중)`))) ||
//              (m = t.match(new RegExp(`(?<![가-힣])(${DAYCH}{2,4})(?:요일)?(?=\\s|$|에|엔|은|는|만|중)`)))) {
//     days = [...new Set((m[1].match(new RegExp(DAYCH, "g")) ?? []).map((c) => DAYS.indexOf(c)))];
//     notes.push(`${days.map((d) => DAYS[d]).join("·")}요일`); t = cut(t, m);
//   }
//   if (excl.size > 0) {
//     days = (days ?? ALLDAYS).filter((d) => !excl.has(d));
//     notes.push(`${[...excl].map((d) => DAYS[d]).join("·")} 제외`);
//   }

//   // 8) 특정 날짜 ("내일", "12/3", "3일 뒤" ...)
//   if (!from) {
//     const d = extractDate(t, base);
//     if (d) { from = to = d.date; t = d.rest; }
//   }
//   if (from && from === to) notes.push(`${from} (${DAYS[parse(from).getDay()]})`);

//   // 9) 시간대 단어 (활동 시간 안으로 맞춤): 이른/늦은 + 아침·오전·점심·오후·저녁·밤
//   if (!allDay && !window) {
//     const sm = t.match(/(이른|늦은)?\s*(점심|저녁|오전|오후|아침|새벽|한낮|정오|밤)\s*(?:시간|때|무렵)?\s*(?:에만|에|엔|만|중|쯤)?/);
//     if (sm) {
//       const [a0, b0, clamp]: [number, number, boolean] =
//         sm[2] === "점심" ? [toMin(w.lunchStart), toMin(w.lunchEnd), false] :
//         sm[2] === "저녁" ? [18 * 60, 22 * 60, true] : sm[2] === "오전" ? [9 * 60, 12 * 60, true] :
//         sm[2] === "오후" ? [12 * 60, 18 * 60, true] : sm[2] === "아침" ? [7 * 60, 10 * 60, true] :
//         sm[2] === "새벽" ? [5 * 60, 8 * 60, false] : sm[2] === "한낮" ? [11 * 60, 15 * 60, true] :
//         sm[2] === "정오" ? [12 * 60, 13 * 60, false] : [20 * 60, 23 * 60, true];
//       let a = clamp ? Math.max(a0, lo) : a0;
//       let b = clamp ? Math.min(b0, hi) : b0;
//       if (a < b) {
//         const mid = Math.round((a + b) / 2 / 30) * 30;
//         const na = sm[1] === "늦은" && mid < b ? mid : a;
//         const nb = sm[1] === "이른" && mid > a ? mid : b;
//         if (nb - na >= (duration ?? defDur)) { a = na; b = nb; } else sm[1] = "";
//         window = [a, b]; slotName = sm[2];
//         notes.push(`${sm[1] ? `${sm[1]} ` : ""}${sm[2]} ${toTime(a)}–${toTime(b)}`);
//         t = cut(t, sm);
//       }
//     }
//   }

//   // 10) 함께할 사람
//   if (take(/혼자(?:서)?/)) { memo = "혼자"; notes.push("혼자"); }
//   else if ((m = t.match(COMPANION_RE)) || (m = t.match(NAME_RE))) {
//     who = m[1]; memo = `${withJosa(who)} 함께`; notes.push(memo); t = cut(t, m);
//   }
//   t = t.replace(/(^|\s)(?:다\s*같이|같이|함께)(?=\s|$)/g, " ");

//   // 11) 지역 (회사 근처는 설정한 회사 위치로)
//   let place = "";
//   if (take(/회사\s*(?:근처|앞|주변|근방|쪽)/)) {
//     if (w.region) { place = w.region; notes.push(`회사 근처 (${w.region})`); } else notes.push("회사 근처 (설정에서 회사 위치를 입력하면 반영돼요)");
//   } else {
//     const key = [...Object.keys(DONG_TO_GU), ...Object.keys(GU)].find((x) => t.includes(x));
//     if (key) { place = `서울 ${key}`; t = t.replace(/서울(?:특별시)?\s*/, "").replace(key, " "); notes.push(place); }
//   }

//   // 12) 제목: 남은 말에서 조사·어미를 걷어낸다
//   t = t.replace(/(^|\s)(?:에는|에|엔|중에|중|사이에|사이|안에|내에|이내|쯤|정도|경|동안|까지|부터|만|에만|날|때|이나|에서|근처|근방|주변|쪽|부근|꼭|좀|가능한|가능|되는|되면|괜찮은|괜찮아|좋아|좋은)(?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
//   const rest0 = t;
//   for (let i = 0; i < 3; i++) { const n = t.replace(VERB_END, "").trim(); if (n === t) break; t = n; }
//   let title = t.replace(/\s*만나[가-힣]*$/, "").replace(/\s*(?:이랑|랑)$/, "").replace(/[.!?]+$/, "").trim();
//   if (!title) {
//     if (/만나/.test(rest0)) title = who ? (FAMILY_RE.test(who) ? `${who} 모임` : `${who} 약속`) : "약속";
//     else if (/먹/.test(rest0)) title = `${slotName && /점심|저녁|아침/.test(slotName) ? `${slotName} ` : ""}식사`;
//     else title = who ? (FAMILY_RE.test(who) ? `${who} 모임` : `${who} 약속`) : "약속";
//   }
//   return { title, place, duration, memo, from, to, days, window, allDay, offOnly, emptyDay, soon, light, time, notes };
// }

// /* ================= 반복 / 샘플 ================= */
// const REPEAT_LABEL: Record<Exclude<Repeat, "none">, string> = { daily: "매일", weekdays: "평일마다", weekly: "매주", monthly: "매월" };

// export function occurrences(date: string, repeat: Repeat, days: number[], until: string): string[] {
//   if (repeat === "none") return [date];
//   const baseDow = parse(date).getDay();
//   const baseDay = parse(date).getDate();
//   const out: string[] = [];
//   for (let k = date; k <= until && out.length < 200; k = addDays(k, 1)) {
//     const d = parse(k);
//     const dow = d.getDay();
//     const ok =
//       repeat === "daily" ||
//       (repeat === "weekdays" && dow >= 1 && dow <= 5) ||
//       (repeat === "weekly" && (days.length ? days : [baseDow]).includes(dow)) ||
//       (repeat === "monthly" && d.getDate() === baseDay);
//     if (ok) out.push(k);
//   }
//   return out;
// }

// export function makeSample(today: string): Item[] {
//   const mk = (off: number, title: string, start: string, end: string, place: string, kind: Kind = "event", series?: string): Item => ({
//     id: uid(), kind, title, date: addDays(today, off), start: start || undefined, end: end || undefined, place, memo: "", done: kind === "todo" ? false : undefined, series,
//   });
//   const list: Item[] = [
//     mk(1, "고객 미팅", "10:00", "11:30", "서울 강남구"), mk(1, "점심 약속", "12:30", "13:30", "서울 서초구"),
//     mk(2, "스튜디오 촬영", "14:00", "17:00", "서울 마포구"), mk(3, "병원 예약", "09:30", "10:30", "서울 송파구"),
//     mk(3, "보고서 제출", "", "", "", "todo"), mk(4, "디자인 리뷰", "15:00", "16:00", "서울 종로구"),
//     mk(5, "운동", "19:00", "20:00", "서울 강서구"), mk(6, "가족 모임", "12:00", "14:00", "서울 송파구"),
//     mk(7, "장보기", "", "", "서울 강서구", "todo"), mk(8, "팀 회식", "18:30", "21:00", "서울 마포구"),
//     mk(9, "치과", "11:00", "12:00", "서울 강남구"), mk(10, "세미나", "14:00", "16:00", "서울 영등포구"),
//   ];
//   const sid = uid();
//   occurrences(today, "weekly", [1, 3], addDays(today, 28)).forEach((date) =>
//     list.push({ id: uid(), kind: "event", title: "스탠드업", date, start: "09:30", end: "10:00", place: "서울 강남구", memo: "", series: sid }),
//   );
//   return list;
// }

// const targets = (items: Item[], it: Item, scope: Scope): string[] =>
//   items.filter((o) => (scope === "one" || !it.series ? o.id === it.id : o.series === it.series && (scope === "all" || o.date >= it.date))).map((o) => o.id);

// /** "연차 12/24", "오전 반차 내일", "휴무일 12/25", "연차 12/24~12/26" */
// export function parseLeave(input: string, base: string): Omit<Leave, "id"> | null {
//   const m = input.trim().match(/^(오전\s*반차|반차\s*오전|오후\s*반차|반차\s*오후|연차|휴가|휴무일?)\s*(.*)$/);
//   if (!m) return null;
//   const type: Leave["type"] = /오전/.test(m[1]) ? "am" : /오후/.test(m[1]) ? "pm" : /휴무/.test(m[1]) ? "holiday" : "full";
//   const [a, b] = m[2].split(/\s*[~～]\s*/);
//   const from = parseDateInput(a ?? "", base);
//   const to = b === undefined ? from : parseDateInput(b, base);
//   if (!from || !to || to < from) return null;
//   return { type, from, to, label: "" };
// }
// export function makeSampleLeaves(today: string): Leave[] {
//   const wd = (n: number): string => { let k = today; let c = 0; while (c < n) { k = addDays(k, 1); const d = parse(k).getDay(); if (d >= 1 && d <= 5) c++; } return k; };
//   return [{ id: uid(), type: "full", from: wd(3), to: wd(3), label: "" }, { id: uid(), type: "pm", from: wd(6), to: wd(6), label: "" }];
// }
// const TIME_OPTS: string[] = Array.from({ length: 33 }, (_, i) => toTime(360 + i * 30)); // 06:00 ~ 22:00

// /* ================= 공통 UI ================= */
// const inputCls = "w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400";
// const labelCls = "flex flex-col gap-1 text-xs text-gray-500";
// const primaryBtn = "rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
// const ghostBtn = "rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600";
// const h2Cls = "mb-2 mt-5 text-[15px] font-semibold";

// function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
//   return (
//     <button type="button" aria-pressed={on} onClick={onClick}
//       className={`rounded-full border px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${on ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
//       {children}
//     </button>
//   );
// }

// function DateField({ value, onChange, base, disabled, ph }: { value: string; onChange: (v: string) => void; base: string; disabled?: boolean; ph?: string }) {
//   const r = parseDateInput(value, base);
//   return (
//     <div>
//       <input className={inputCls} placeholder={ph ?? "날짜: 내일, 다음주 화, 12/3, 3일 뒤"} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
//       {value.trim() !== "" && <p className={`mt-0.5 text-xs ${r ? "text-gray-500" : "text-red-700"}`}>{r ? `→ ${r} (${DAYS[parse(r).getDay()]})` : "인식할 수 없는 날짜예요"}</p>}
//     </div>
//   );
// }

// function Fields({ f, set, base, titlePh, dateLocked }: { f: ItemForm; set: (f: ItemForm) => void; base: string; titlePh: string; dateLocked?: boolean }) {
//   return (
//     <div className="flex flex-col gap-2">
//       <input className={inputCls} placeholder={titlePh} value={f.title} onChange={(e) => set({ ...f, title: e.target.value })} />
//       <DateField value={f.date} onChange={(v) => set({ ...f, date: v })} base={base} disabled={dateLocked} />
//       <div className="grid grid-cols-2 gap-2">
//         <label className={labelCls}>시작 (선택)<input className={inputCls} type="time" value={f.start} onChange={(e) => set({ ...f, start: e.target.value })} /></label>
//         <label className={labelCls}>종료 (선택)<input className={inputCls} type="time" value={f.end} disabled={!f.start} onChange={(e) => set({ ...f, end: e.target.value })} /></label>
//       </div>
//       <input className={inputCls} list="sc-places" placeholder="장소·지역 (예: 서울 강남구, 논현동)" value={f.place} onChange={(e) => set({ ...f, place: e.target.value })} />
//       <input className={inputCls} placeholder="메모" value={f.memo} onChange={(e) => set({ ...f, memo: e.target.value })} />
//     </div>
//   );
// }

// function ScopePick({ scope, set }: { scope: Scope; set: (s: Scope) => void }) {
//   return (
//     <div className="flex flex-wrap gap-1.5">
//       {([["one", "이 일정만"], ["after", "이후 전체"], ["all", "전체"]] as [Scope, string][]).map(([k, l]) => (
//         <Chip key={k} on={scope === k} onClick={() => set(k)}>{l}</Chip>
//       ))}
//     </div>
//   );
// }

// function Section({ title, hint, open, onToggle, children }: { title: string; hint?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
//   return (
//     <section className="rounded-lg border border-gray-200">
//       <button type="button" aria-expanded={open} onClick={onToggle}
//         className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left font-semibold hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
//         <span>{title}{hint && <span className="ml-2 text-xs font-normal text-gray-500">{hint}</span>}</span>
//         <span aria-hidden className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
//       </button>
//       {open && <div className="border-t border-gray-100 px-3 py-3">{children}</div>}
//     </section>
//   );
// }

// /* ================= 메인 컴포넌트 ================= */
// export default function SmartCalendar() {
//   const todayKey = ymd(new Date());
//   const blank: ItemForm = { title: "", date: todayKey, start: "", end: "", place: "", memo: "" };
//   const [items, setItems] = useState<Item[]>(() => load("sc2-items", []));
//   const [profile, setProfile] = useState<Profile>(() => load("sc2-profile", DEFAULT_PROFILE));
//   const [cursor, setCursor] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
//   const [selected, setSelected] = useState<string>(todayKey);
//   const [kind, setKind] = useState<Kind>("event");
//   const [form, setForm] = useState<ItemForm>(blank);
//   const [rep, setRep] = useState<Repeat>("none");
//   const [repDays, setRepDays] = useState<number[]>([]);
//   const [repMonths, setRepMonths] = useState<number>(3);
//   const [quick, setQuick] = useState<string>("");
//   const [req, setReq] = useState<SuggestRequest>({ title: "", duration: 60, from: todayKey, to: addDays(todayKey, 14), place: "", memo: "" });
//   const [range, setRange] = useState<number>(14);
//   const [results, setResults] = useState<Suggestion[] | null>(null);
//   const [transfer, setTransfer] = useState<Transfer | null>(null);
//   const [edit, setEdit] = useState<Edit | null>(null);
//   const [del, setDel] = useState<{ id: string; scope: Scope } | null>(null);
//   const [work, setWork] = useState<WorkSettings>(() => load("sc2-work", DEFAULT_WORK));
//   const [leaves, setLeaves] = useState<Leave[]>(() => load("sc2-leaves", []));
//   const [simple, setSimple] = useState<boolean>(() => load("sc2-simple", false)); // 간단 모드: 한 줄 입력 표시
//   const [lv, setLv] = useState<{ type: Leave["type"]; from: string; to: string; label: string }>({ type: "full", from: todayKey, to: "", label: "" });
//   const [error, setError] = useState<string>("");
//   const quickRef = useRef<HTMLInputElement>(null);
//   const [open, setOpen] = useState<Record<string, boolean>>({}); // 접이식 섹션 (기본: 모두 접힘)
//   const [sq, setSq] = useState<string>(""); // 추천 문장 입력
//   const [condNote, setCondNote] = useState<string>("");

//   useEffect(() => { try { localStorage.setItem("sc2-items", JSON.stringify(items)); } catch { /* 무시 */ } }, [items]);
//   useEffect(() => { try { localStorage.setItem("sc2-profile", JSON.stringify(profile)); } catch { /* 무시 */ } }, [profile]);
//   useEffect(() => { try { localStorage.setItem("sc2-work", JSON.stringify(work)); } catch { /* 무시 */ } }, [work]);
//   useEffect(() => { try { localStorage.setItem("sc2-leaves", JSON.stringify(leaves)); } catch { /* 무시 */ } }, [leaves]);
//   useEffect(() => { try { localStorage.setItem("sc2-simple", JSON.stringify(simple)); } catch { /* 무시 */ } }, [simple]);

//   const goTo = (date: string): void => { setSelected(date); setCursor(new Date(parse(date).getFullYear(), parse(date).getMonth(), 1)); };
//   const patchMany = (ids: string[], patch: Partial<Item>): void => setItems((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, ...patch } : i)));
//   const addItem = (it: Omit<Item, "id">): void => setItems((prev) => [...prev, { ...it, id: uid() }]);
//   const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
//   const setP = <K extends keyof Profile>(k: K, v: Profile[K]): void => setProfile({ ...profile, [k]: v });
//   const endOf = (k: Kind, start: string, end: string): string | undefined => (start ? end || (k === "event" ? toTime(Math.min(toMin(start) + 60, 1439)) : undefined) : undefined);

//   /* 생성 (반복이면 일정 묶음(series)으로 여러 날짜에 생성) */
//   const create = (k: Kind, f: Pick<ItemForm, "title" | "start" | "end" | "place" | "memo">, dates: string[], repeat: Repeat): void => {
//     const series = repeat !== "none" ? uid() : undefined;
//     setItems((prev) => [
//       ...prev,
//       ...dates.map((date): Item => ({ id: uid(), kind: k, date, title: f.title, start: f.start || undefined, end: endOf(k, f.start, f.end), place: f.place, memo: f.memo, done: k === "todo" ? false : undefined, series })),
//     ]);
//   };

//   const submitForm = (): void => {
//     const date = parseDateInput(form.date, todayKey);
//     if (!date) return setError("날짜를 인식할 수 없어요. 예: 내일, 다음주 화, 12/3, 3일 뒤");
//     if (!form.title.trim()) return setError(kind === "event" ? "일정명을 입력하세요." : "할일을 입력하세요.");
//     if (form.start && form.end && toMin(form.start) >= toMin(form.end)) return setError("종료 시간은 시작 시간보다 늦어야 합니다.");
//     setError("");
//     create(kind, { ...form, title: form.title.trim() }, occurrences(date, rep, repDays, monthsLater(date, repMonths)), rep);
//     setForm({ ...form, title: "", place: "", memo: "", start: "", end: "" });
//     goTo(date);
//   };

//   const submitQuick = (): void => {
//     const ql0 = parseLeave(quick, todayKey);
//     if (ql0) { setLeaves((prev) => [...prev, { ...ql0, id: uid() }]); setError(""); setQuick(""); goTo(ql0.from); return; }
//     const q = parseQuick(quick, todayKey);
//     if (!q.title) return setError("제목을 입력하세요. 예: 내일 오후 3시 강남구 미팅");
//     const date = q.date ?? selected;
//     setError("");
//     create(q.kind, { ...q, memo: "" }, occurrences(date, q.repeat, q.days, monthsLater(date, 3)), q.repeat);
//     setQuick("");
//     goTo(date);
//   };
//   const qp = quick.trim() ? parseQuick(quick, todayKey) : null;
//   const qDate = qp ? qp.date ?? selected : "";
//   const ql = quick.trim() ? parseLeave(quick, todayKey) : null;
//   const qLabel = ql
//     ? `${LEAVE_LABEL[ql.type]} · ${ql.from}${ql.to !== ql.from ? ` ~ ${ql.to}` : ""}`
//     : qp
//     ? [`${qDate} (${DAYS[parse(qDate).getDay()]})`, qp.start && `${qp.start}${qp.end ? `–${qp.end}` : ""}`, qp.place, qp.kind === "todo" && "할일",
//         qp.repeat !== "none" && `${REPEAT_LABEL[qp.repeat]}${qp.repeat === "weekly" && qp.days.length ? ` ${qp.days.map((d) => DAYS[d]).join("")}` : ""} (3개월)`]
//         .filter(Boolean).join(" · ")
//     : "";

//   /* 수정 */
//   const startEdit = (it: Item): void => { setDel(null); setTransfer(null); setEdit({ id: it.id, scope: "one", form: { title: it.title, date: it.date, start: it.start ?? "", end: it.end ?? "", place: it.place, memo: it.memo } }); };
//   const saveEdit = (): void => {
//     if (!edit) return;
//     const it = items.find((i) => i.id === edit.id);
//     if (!it) return;
//     const f = edit.form;
//     const date = parseDateInput(f.date, todayKey);
//     if (!f.title.trim()) return setError("제목을 입력하세요.");
//     if (edit.scope === "one" && !date) return setError("날짜를 인식할 수 없어요.");
//     if (f.start && f.end && toMin(f.start) >= toMin(f.end)) return setError("종료 시간은 시작 시간보다 늦어야 합니다.");
//     setError("");
//     patchMany(targets(items, it, edit.scope), {
//       title: f.title.trim(), start: f.start || undefined, end: endOf(it.kind, f.start, f.end), place: f.place, memo: f.memo,
//       ...(edit.scope === "one" && date ? { date } : {}),
//     });
//     if (edit.scope === "one" && date) goTo(date);
//     setEdit(null);
//   };

//   /* 삭제 */
//   const doDelete = (it: Item, scope: Scope): void => { const ids = targets(items, it, scope); setItems(items.filter((i) => !ids.includes(i.id))); setDel(null); };

//   /* 복사 / 이동 */
//   const conflictOn = (it: Item, date: string): string => {
//     if (!timed(it)) return "";
//     const hit = items.find((o) => timed(o) && o.id !== it.id && o.date === date && toMin(it.start) < toMin(o.end) && toMin(it.end) > toMin(o.start));
//     return hit ? `${hit.start}–${hit.end} "${hit.title}"와 시간이 겹칩니다.` : "";
//   };
//   const confirmTransfer = (): void => {
//     if (!transfer) return;
//     const it = items.find((i) => i.id === transfer.id);
//     const date = parseDateInput(transfer.date, todayKey);
//     if (!it) return;
//     if (!date) return setError("날짜를 인식할 수 없어요.");
//     const warn = conflictOn(it, date);
//     if (warn && !transfer.warn) return setTransfer({ ...transfer, warn });
//     if (transfer.mode === "move") patchMany([it.id], { date });
//     else addItem({ ...it, date, done: it.kind === "todo" ? false : undefined });
//     setError("");
//     goTo(date);
//     setTransfer(null);
//   };

//   /* 추천 */
//   const runSuggest = (): void => {
//     if (!req.title.trim()) return setError("추가할 일정명을 입력하세요.");
//     setError("");
//     setCondNote("");
//     setResults(suggest({ ...req, from: todayKey, to: addDays(todayKey, range) }, items, profile, work, leaves));
//   };
//   const sp = sq.trim() ? parseSuggest(sq, todayKey, profile, work, req.duration) : null;
//   const runSentence = (): void => {
//     if (!sq.trim()) return setError("원하는 일정을 문장으로 입력하세요. 예: 주말에 저녁 가족식사");
//     const q = parseSuggest(sq, todayKey, profile, work, req.duration);
//     const next: SuggestRequest = { ...req, title: q.title, place: q.place, memo: q.memo || req.memo, duration: q.duration ?? req.duration, from: q.from ?? todayKey, to: q.to ?? addDays(todayKey, range) };
//     setReq(next);
//     setError("");
//     setCondNote(q.notes.join(" · "));
//     setResults(suggest(next, items, profile, work, leaves, { days: q.days ?? undefined, window: q.window ?? undefined, allDay: q.allDay, offOnly: q.offOnly, emptyDay: q.emptyDay, soon: q.soon, light: q.light, time: q.time ?? undefined }));
//   };
//   const accept = (r: Suggestion): void => {
//     addItem({ kind: "event", title: req.title.trim(), date: r.date, start: r.allDay ? undefined : r.start, end: r.allDay ? undefined : r.end, place: req.place, memo: req.memo });
//     goTo(r.date);
//     setResults(null);
//     setReq({ ...req, title: "", place: "", memo: "" });
//   };

//   /* 휴가 */
//   const addLeave = (): void => {
//     const from = parseDateInput(lv.from, todayKey);
//     const to = lv.to.trim() ? parseDateInput(lv.to, todayKey) : from;
//     if (!from || !to) return setError("휴가 날짜를 인식할 수 없어요. 예: 내일, 12/24");
//     if (to < from) return setError("종료일은 시작일보다 같거나 늦어야 합니다.");
//     setError("");
//     setLeaves((prev) => [...prev, { id: uid(), type: lv.type, from, to, label: lv.label.trim() }]);
//     setLv({ ...lv, from: todayKey, to: "", label: "" });
//     goTo(from);
//   };

//   /* 샘플 데이터 */
//   const loadSample = (): void => {
//     if (items.length > 0 && !window.confirm("현재 데이터를 지우고 샘플 데이터로 바꿀까요?")) return;
//     setItems(makeSample(todayKey));
//     setLeaves(makeSampleLeaves(todayKey));
//     setResults(null);
//     goTo(todayKey);
//   };
//   const clearAll = (): void => { if (window.confirm("모든 일정과 할일을 삭제할까요?")) { setItems([]); setLeaves([]); setResults(null); } };

//   /* 달력 */
//   const y = cursor.getFullYear();
//   const m = cursor.getMonth();
//   const first = new Date(y, m, 1).getDay();
//   const total = new Date(y, m + 1, 0).getDate();
//   const cells: (number | null)[] = [...Array<null>(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
//   const dayItems = items.filter((i) => i.date === selected).sort(byTime);
//   const placeHint = Object.keys(GU).map((g) => `서울 ${g}`);

//   const sec = (k: string): boolean => !!open[k];
//   const togSec = (k: string): void => setOpen((o) => ({ ...o, [k]: !o[k] }));

//   return (
//     <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-900">
//       <header className="mb-3 flex items-center justify-between gap-2">
//         <div className="flex gap-1.5">
//           <button className={ghostBtn} onClick={loadSample}>샘플 데이터 넣기</button>
//           <button className={ghostBtn} onClick={clearAll}>모두 비우기</button>
//         </div>
//         <div className="flex items-center gap-3">
//           <button className={`${ghostBtn} h-8 w-8 !p-0 text-lg`} onClick={() => setCursor(new Date(y, m - 1, 1))} aria-label="이전 달">‹</button>
//           <h1 className="text-xl font-semibold">{y}년 {m + 1}월</h1>
//           <button className={`${ghostBtn} h-8 w-8 !p-0 text-lg`} onClick={() => setCursor(new Date(y, m + 1, 1))} aria-label="다음 달">›</button>
//         </div>
//         <button className={ghostBtn} onClick={() => goTo(todayKey)}>오늘</button>
//       </header>

//       {/* 달력: 일정이 없는 날도 칸 높이를 확보한다 */}
//       <div className="grid grid-cols-7 gap-1">
//         {DAYS.map((d, i) => (
//           <div key={d} className={`py-1.5 text-center font-medium ${i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : "text-gray-500"}`}>{d}</div>
//         ))}
//         {cells.map((day, i) => {
//           if (!day) return <div key={i} />;
//           const key = `${y}-${pad(m + 1)}-${pad(day)}`;
//           const dow = (first + day - 1) % 7;
//           const list = items.filter((it) => it.date === key).sort(byTime);
//           const select = (): void => { setSelected(key); setForm((f) => ({ ...f, date: key })); };
//           return (
//             <div key={i} role="button" tabIndex={0} onClick={select}
//               onDoubleClick={() => { select(); if (simple) quickRef.current?.focus(); }}
//               onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); } }}
//               className={`flex min-h-[96px] cursor-pointer flex-col gap-1 rounded-lg border p-1.5 sm:min-h-[128px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${
//                 key === selected ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600" : "border-gray-200 hover:bg-gray-50"
//               }`}>
//               <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${key === todayKey ? "bg-blue-600 font-bold text-white" : dow === 0 ? "text-red-600" : dow === 6 ? "text-blue-600" : ""}`}>{day}</span>
//               {leaves.filter((l) => l.from <= key && key <= l.to).map((l) => (
//                 <span key={l.id} className="break-words rounded border-l-[3px] border-amber-500 bg-amber-100 px-1.5 py-0.5 text-xs font-medium leading-tight text-amber-900">{LEAVE_LABEL[l.type]}{l.label && `: ${l.label}`}</span>
//               ))}
//               {list.map((it) =>
//                 it.kind === "todo" ? (
//                   <label key={it.id} onClick={(e) => e.stopPropagation()} className="flex items-start gap-1 break-words rounded border-l-[3px] border-emerald-500 bg-emerald-50 px-1.5 py-0.5 text-xs leading-tight text-emerald-900">
//                     <input type="checkbox" className="mt-px" checked={!!it.done} onChange={() => patchMany([it.id], { done: !it.done })} />
//                     <span className={it.done ? "text-gray-400 line-through" : ""}>{it.title}</span>
//                   </label>
//                 ) : (
//                   <span key={it.id} className="break-words rounded border-l-[3px] border-blue-500 bg-blue-100 px-1.5 py-0.5 text-xs leading-tight text-blue-900">
//                     {it.series && "↻ "}{it.start && <b>{it.start} </b>}{it.title}
//                   </span>
//                 ),
//               )}
//             </div>
//           );
//         })}
//       </div>

//       {/* 간단 모드: 한 줄 입력 (설정 > 화면 설정에서 켜기) */}
//       {simple && (
//         <div className="mt-3">
//           <div className="flex gap-2">
//             <input ref={quickRef} className={inputCls} value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) submitQuick(); }}
//               placeholder="한 줄로 추가: 내일 오후 3시 강남구 미팅 · 매주 화 10시 스탠드업 · 할일 12/3 보고서 · 연차 12/24" aria-label="한 줄 입력" />
//             <button className={`${primaryBtn} shrink-0`} onClick={submitQuick}>추가</button>
//           </div>
//           <p className="mt-1 text-xs text-gray-500">{qLabel ? `→ ${qLabel}${qp && !ql && qp.title ? ` · ${qp.title}` : ""}` : `날짜를 안 쓰면 선택한 날짜(${selected})에 추가돼요. 달력 칸을 더블클릭하면 여기로 바로 이동해요.`}</p>
//         </div>
//       )}

//       {error && <p className="mt-3 text-red-700" role="alert">{error}</p>}

//       {/* 선택한 날 (항상 표시) */}
//       <section className="mt-4 rounded-lg border border-gray-200 p-3">
//         <div className="mb-2 flex items-center justify-between gap-2">
//           <h2 className="text-base font-semibold">
//             {selected} ({DAYS[parse(selected).getDay()]})
//             <span className="ml-2 text-xs font-normal text-gray-500">{dayItems.length > 0 ? `${dayItems.length}건` : ""}</span>
//           </h2>
//           <button className={ghostBtn} onClick={() => { setForm((f) => ({ ...f, date: selected })); setOpen((o) => ({ ...o, add: true })); }}>+ 추가</button>
//         </div>
//         {leaves.filter((l) => l.from <= selected && selected <= l.to).map((l) => (
//           <p key={l.id} className="mb-2 rounded-md border-l-4 border-amber-500 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">{LEAVE_LABEL[l.type]}{l.label && `: ${l.label}`} · 근무 시간에서 제외돼요</p>
//         ))}
//         {dayItems.length === 0 && <p className="rounded-md border border-dashed border-gray-200 py-6 text-center text-gray-500">등록된 일정이 없어요</p>}
//         <ul className="flex flex-col gap-2">
//           {dayItems.map((it) => (
//             <li key={it.id} className={`rounded-md border-l-4 px-3 py-2.5 ${it.kind === "todo" ? "border-emerald-500 bg-emerald-50" : "border-blue-500 bg-blue-50"}`}>
//               {edit?.id === it.id ? (
//                 <div className="flex flex-col gap-2">
//                   <Fields f={edit.form} set={(f) => setEdit({ ...edit, form: f })} base={todayKey} titlePh="제목" dateLocked={edit.scope !== "one"} />
//                   {it.series && (
//                     <div>
//                       <p className="mb-1 text-xs text-gray-500">반복 일정 · 적용 범위 (날짜는 &quot;이 일정만&quot;일 때만 바뀌어요)</p>
//                       <ScopePick scope={edit.scope} set={(s) => setEdit({ ...edit, scope: s })} />
//                     </div>
//                   )}
//                   <div className="flex gap-2">
//                     <button className={primaryBtn} onClick={saveEdit}>저장</button>
//                     <button className={ghostBtn} onClick={() => setEdit(null)}>취소</button>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   <div className="flex items-start justify-between gap-2">
//                     <div className="flex gap-2">
//                       {it.kind === "todo" && <input type="checkbox" className="mt-1" checked={!!it.done} onChange={() => patchMany([it.id], { done: !it.done })} aria-label="완료" />}
//                       <div>
//                         <p className={`text-base font-semibold ${it.done ? "text-gray-400 line-through" : it.kind === "todo" ? "text-emerald-900" : "text-blue-900"}`}>
//                           {it.series && "↻ "}
//                           {it.kind === "event" ? (it.start ? `${it.start}–${it.end}  ` : "시간 미정  ") : it.start ? `${it.start}  ` : ""}
//                           {it.title}
//                         </p>
//                         {(it.place || it.memo) && <p className="mt-0.5 text-xs text-gray-600">{[it.place, it.memo].filter(Boolean).join(" / ")}</p>}
//                       </div>
//                     </div>
//                     <div className="flex shrink-0 gap-1">
//                       <button className={ghostBtn} onClick={() => startEdit(it)}>수정</button>
//                       <button className={ghostBtn} onClick={() => { setEdit(null); setDel(null); setTransfer({ id: it.id, mode: "copy", date: it.date, warn: "" }); }}>복사</button>
//                       <button className={ghostBtn} onClick={() => { setEdit(null); setDel(null); setTransfer({ id: it.id, mode: "move", date: it.date, warn: "" }); }}>이동</button>
//                       <button className={ghostBtn} onClick={() => { setEdit(null); setTransfer(null); if (it.series) setDel({ id: it.id, scope: "one" }); else doDelete(it, "one"); }}>삭제</button>
//                     </div>
//                   </div>
//                   {del?.id === it.id && (
//                     <div className="mt-2 flex flex-col gap-2 border-t border-black/10 pt-2">
//                       <p className="text-xs text-gray-600">반복 일정이에요. 어디까지 삭제할까요?</p>
//                       <ScopePick scope={del.scope} set={(s) => setDel({ ...del, scope: s })} />
//                       <div className="flex gap-2">
//                         <button className={primaryBtn} onClick={() => doDelete(it, del.scope)}>삭제</button>
//                         <button className={ghostBtn} onClick={() => setDel(null)}>취소</button>
//                       </div>
//                     </div>
//                   )}
//                   {transfer?.id === it.id && (
//                     <div className="mt-2 flex flex-col gap-2 border-t border-black/10 pt-2">
//                       <DateField value={transfer.date} onChange={(v) => setTransfer({ ...transfer, date: v, warn: "" })} base={todayKey} />
//                       <div className="flex gap-2">
//                         <button className={primaryBtn} onClick={confirmTransfer}>{transfer.warn ? "그래도 " : ""}{transfer.mode === "copy" ? "복사" : "이동"}</button>
//                         <button className={ghostBtn} onClick={() => setTransfer(null)}>취소</button>
//                       </div>
//                       {transfer.warn && <p className="text-xs text-amber-700">{transfer.warn}</p>}
//                     </div>
//                   )}
//                 </>
//               )}
//             </li>
//           ))}
//         </ul>
//       </section>

//       {/* 접이식 섹션: 제목을 누르면 펼쳐져요 */}
//       <div className="mt-4 flex flex-col gap-2">
//         <Section title="최적 일정 추천" hint="문장으로도 찾을 수 있어요" open={sec("rec")} onToggle={() => togSec("rec")}>
//           <div className="flex gap-2">
//             <input className={inputCls} value={sq} onChange={(e) => setSq(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) runSentence(); }}
//               placeholder="예: 주말 저녁 가족식사 · 친구랑 이번 주말 · 하루종일 등산 · 퇴근 후 운동 1시간" aria-label="추천 문장 입력" />
//             <button className={`${primaryBtn} shrink-0`} onClick={runSentence}>찾기</button>
//           </div>
//           {sp && (
//             <p className="mt-1 text-xs text-gray-500">
//               → {[sp.title && `일정명 ${sp.title}`, ...sp.notes].filter(Boolean).join(" · ") || "조건을 읽지 못했어요"}
//             </p>
//           )}
//           <details className="mt-2">
//             <summary className="cursor-pointer text-xs font-medium text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">읽을 수 있는 표현 보기</summary>
//             <ul className="mt-1 flex flex-col gap-0.5 text-xs text-gray-600">
//               <li>날짜: 내일 · 모레 · 3일 뒤 · 12/3 · 다음주 화요일 · 이번 주말 · 다음 달 · 12월 말 · 3일 안에</li>
//               <li>요일: 주말 · 평일 · 화목 · 월·수·금 · 토요일 · 월요일 빼고 · 주말 말고</li>
//               <li>시간대: 아침 · 오전 · 점심 · 오후 · 저녁 · 밤 · 이른 아침 · 늦은 저녁 · 오전만 · 퇴근 후 · 출근 전</li>
//               <li>시각: 13:00-14:00 중에 · 오후 7시 · 3시 이후 · 5시까지</li>
//               <li>길이: 1시간 · 1시간 반 · 90분 · 두 시간 · 반나절 · 잠깐 · 길게</li>
//               <li>하루: 하루종일 · 쉬는 날 · 연차날 · 일정 없는 날</li>
//               <li>함께: 친구랑 · 가족과 · 팀원들과 · 민수랑 · 혼자</li>
//               <li>성향: 빨리 · 가장 빠른 날 · 여유롭게 · 일찍 · 늦게</li>
//               <li>지역: 강남구 · 논현동 · 회사 근처</li>
//             </ul>
//           </details>

//           <details className="mt-3">
//             <summary className="cursor-pointer text-xs font-medium text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">세부 조건 직접 설정</summary>
//             <div className="mt-2 flex flex-col gap-3">
//               <input className={inputCls} placeholder="추가할 일정명" value={req.title} onChange={(e) => setReq({ ...req, title: e.target.value })} />
//               <input className={inputCls} list="sc-places" placeholder="장소·지역 (동선 계산에 사용)" value={req.place} onChange={(e) => setReq({ ...req, place: e.target.value })} />
//               <div>
//                 <p className="mb-1 text-xs text-gray-500">소요 시간</p>
//                 <div className="flex flex-wrap gap-1.5">
//                   {[30, 60, 90, 120, 180].map((d) => <Chip key={d} on={req.duration === d} onClick={() => setReq({ ...req, duration: d })}>{d >= 60 ? `${Math.floor(d / 60)}시간${d % 60 ? " 30분" : ""}` : `${d}분`}</Chip>)}
//                 </div>
//               </div>
//               <div>
//                 <p className="mb-1 text-xs text-gray-500">언제까지 찾을까요</p>
//                 <div className="flex gap-1.5">
//                   {[{ d: 7, l: "1주" }, { d: 14, l: "2주" }, { d: 30, l: "한 달" }].map((r) => <Chip key={r.d} on={range === r.d} onClick={() => setRange(r.d)}>{r.l}</Chip>)}
//                 </div>
//               </div>
//               <input className={inputCls} placeholder="메모" value={req.memo} onChange={(e) => setReq({ ...req, memo: e.target.value })} />
//               <button className={primaryBtn} onClick={runSuggest}>최적 시간 찾기</button>
//             </div>
//           </details>

//           {results && results.length === 0 && <p className="mt-3 text-gray-500">조건에 맞는 시간이 없습니다. 기간을 늘리거나 조건·선호 설정을 조정해 보세요.</p>}
//           {results && results.length > 0 && (
//             <div className="mt-3">
//               {condNote && <p className="mb-1 text-xs text-gray-500">적용한 조건: {condNote}</p>}
//               <label className={`${labelCls} mb-2`}>일정명 (등록될 이름)
//                 <input className={inputCls} value={req.title} onChange={(e) => setReq({ ...req, title: e.target.value })} />
//               </label>
//               <ul className="flex flex-col gap-1.5">
//                 {results.map((r) => (
//                   <li key={r.date} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-2.5 py-2">
//                     <div>
//                       <strong>{r.date} ({DAYS[parse(r.date).getDay()]}) {r.allDay ? "종일" : `${r.start}–${r.end}`}</strong>
//                       <p className="mt-0.5 text-xs text-gray-500">점수 {r.score} · {r.why.join(", ") || "조건 충족"}</p>
//                     </div>
//                     <button className={ghostBtn} onClick={() => accept(r)}>선택</button>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </Section>

//         <Section title="일정·할일 직접 추가" open={sec("add")} onToggle={() => togSec("add")}>
//           <div className="flex flex-col gap-2">
//             <div className="flex gap-2">
//               <Chip on={kind === "event"} onClick={() => setKind("event")}>일정</Chip>
//               <Chip on={kind === "todo"} onClick={() => setKind("todo")}>할일</Chip>
//             </div>
//             <Fields f={form} set={setForm} base={todayKey} titlePh={kind === "event" ? "일정명" : "할일"} />
//             <div>
//               <p className="mb-1 text-xs text-gray-500">반복</p>
//               <div className="flex flex-wrap gap-1.5">
//                 {(["none", "daily", "weekdays", "weekly", "monthly"] as Repeat[]).map((r) => (
//                   <Chip key={r} on={rep === r} onClick={() => setRep(r)}>{r === "none" ? "없음" : REPEAT_LABEL[r]}</Chip>
//                 ))}
//               </div>
//               {rep === "weekly" && (
//                 <div className="mt-2 flex flex-wrap gap-1.5">
//                   {DAYS.map((d, i) => <Chip key={d} on={repDays.includes(i)} onClick={() => setRepDays(toggle(repDays, i))}>{d}</Chip>)}
//                 </div>
//               )}
//               {rep !== "none" && (
//                 <div className="mt-2 flex flex-wrap items-center gap-1.5">
//                   <span className="text-xs text-gray-500">반복 기간</span>
//                   {[1, 3, 6].map((n) => <Chip key={n} on={repMonths === n} onClick={() => setRepMonths(n)}>{n}개월</Chip>)}
//                 </div>
//               )}
//             </div>
//             <button className={primaryBtn} onClick={submitForm}>{kind === "event" ? "일정 추가" : "할일 추가"}</button>
//           </div>
//         </Section>

//         <Section title="선호 설정" hint="요일·시간대·여유" open={sec("pref")} onToggle={() => togSec("pref")}>
//           <div className="flex flex-col gap-3">
//             <div>
//               <p className="mb-1 text-xs text-gray-500">빠른 선택</p>
//               <div className="flex flex-wrap gap-1.5">
//                 {PRESETS.map((p) => <Chip key={p.label} on={false} onClick={() => setProfile({ ...profile, preferredDays: p.days, slots: p.slots })}>{p.label}</Chip>)}
//               </div>
//             </div>
//             <div>
//               <p className="mb-1 text-xs text-gray-500">선호 요일</p>
//               <div className="flex flex-wrap gap-1.5">{DAYS.map((d, i) => <Chip key={d} on={profile.preferredDays.includes(i)} onClick={() => setP("preferredDays", toggle(profile.preferredDays, i))}>{d}</Chip>)}</div>
//             </div>
//             <div>
//               <p className="mb-1 text-xs text-gray-500">선호 시간대</p>
//               <div className="flex flex-wrap gap-1.5">
//                 {(Object.keys(SLOT_RANGE) as SlotKey[]).map((k) => <Chip key={k} on={profile.slots.includes(k)} onClick={() => setP("slots", toggle(profile.slots, k))}>{SLOT_RANGE[k][2]} {SLOT_RANGE[k][0]}–{SLOT_RANGE[k][1]}시</Chip>)}
//               </div>
//             </div>
//             <div>
//               <p className="mb-1 text-xs text-gray-500">일정 사이 여유</p>
//               <div className="flex flex-wrap gap-1.5">{[0, 15, 30, 60].map((b) => <Chip key={b} on={profile.buffer === b} onClick={() => setP("buffer", b)}>{b === 0 ? "없음" : `${b}분`}</Chip>)}</div>
//             </div>
//             <div>
//               <p className="mb-1 text-xs text-gray-500">하루 최대 일정 수</p>
//               <div className="flex flex-wrap gap-1.5">{[1, 2, 3, 4, 5, 6].map((n) => <Chip key={n} on={profile.maxPerDay === n} onClick={() => setP("maxPerDay", n)}>{n}개</Chip>)}</div>
//             </div>
//             <div className="grid grid-cols-2 gap-2">
//               <label className={labelCls}>활동 시작
//                 <select className={inputCls} value={profile.dayStart} onChange={(e) => setP("dayStart", Number(e.target.value))}>
//                   {Array.from({ length: 8 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{h}시</option>)}
//                 </select>
//               </label>
//               <label className={labelCls}>활동 종료
//                 <select className={inputCls} value={profile.dayEnd} onChange={(e) => setP("dayEnd", Number(e.target.value))}>
//                   {Array.from({ length: 8 }, (_, i) => i + 17).map((h) => <option key={h} value={h}>{h}시</option>)}
//                 </select>
//               </label>
//             </div>
//           </div>
//         </Section>

//         <Section title="근무·휴가 설정" hint={work.enabled ? `${work.start}–${work.end}` : "꺼짐"} open={sec("work")} onToggle={() => togSec("work")}>
//           <div className="flex flex-col gap-3">
//             <div className="flex items-center gap-2">
//               <Chip on={work.enabled} onClick={() => setWork({ ...work, enabled: !work.enabled })}>근무시간 피하기</Chip>
//               <span className="text-xs text-gray-500">{work.enabled ? "추천에서 근무시간을 제외해요" : "꺼져 있어요"}</span>
//             </div>
//             <div>
//               <p className="mb-1 text-xs text-gray-500">근무 요일</p>
//               <div className="flex flex-wrap gap-1.5">{DAYS.map((d, i) => <Chip key={d} on={work.days.includes(i)} onClick={() => setWork({ ...work, days: toggle(work.days, i) })}>{d}</Chip>)}</div>
//             </div>
//             <div className="grid grid-cols-2 gap-2">
//               {([["start", "근무 시작"], ["end", "근무 종료"], ["lunchStart", "점심 시작"], ["lunchEnd", "점심 종료"]] as [keyof WorkSettings, string][]).map(([k, l]) => (
//                 <label key={k} className={labelCls}>{l}
//                   <select className={inputCls} value={String(work[k])} onChange={(e) => setWork({ ...work, [k]: e.target.value })}>
//                     {TIME_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
//                   </select>
//                 </label>
//               ))}
//             </div>
//             <div>
//               <input className={inputCls} list="sc-places" placeholder="회사 위치 (예: 서울 강남구)" value={work.region} onChange={(e) => setWork({ ...work, region: e.target.value })} />
//               <p className="mt-1 text-xs text-gray-500">점심시간에는 회사 근처({NEAR_KM}km 이내) 일정만 추천해요. 회사 위치와 추천받을 일정의 지역을 모두 입력해야 점심시간이 후보에 들어가요.</p>
//             </div>

//             <div className="border-t border-gray-100 pt-3">
//               <p className="mb-1 text-xs text-gray-500">휴가·휴무 추가 (근무시간에서 제외돼요)</p>
//               <div className="flex flex-wrap gap-1.5">
//                 {(Object.keys(LEAVE_LABEL) as Leave["type"][]).map((t) => <Chip key={t} on={lv.type === t} onClick={() => setLv({ ...lv, type: t })}>{LEAVE_LABEL[t]}</Chip>)}
//               </div>
//               <div className="mt-2 grid grid-cols-2 gap-2">
//                 <DateField value={lv.from} onChange={(v) => setLv({ ...lv, from: v })} base={todayKey} ph="시작 날짜" />
//                 <DateField value={lv.to} onChange={(v) => setLv({ ...lv, to: v })} base={todayKey} ph="종료 날짜 (여러 날이면)" />
//               </div>
//               <input className={`${inputCls} mt-2`} placeholder="이름 (선택, 예: 설날)" value={lv.label} onChange={(e) => setLv({ ...lv, label: e.target.value })} />
//               <button className={`${primaryBtn} mt-2 w-full`} onClick={addLeave}>휴가 추가</button>
//               <p className="mt-1 text-xs text-gray-500">간단 모드를 켜면 &quot;연차 12/24~12/26&quot;, &quot;오전 반차 내일&quot;처럼 한 줄로도 추가할 수 있어요.</p>
//             </div>

//             {leaves.length > 0 && (
//               <ul className="flex flex-col gap-1.5">
//                 {[...leaves].sort((a, b) => a.from.localeCompare(b.from)).map((l) => (
//                   <li key={l.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-2.5 py-1.5">
//                     <span>{LEAVE_LABEL[l.type]} · {l.from}{l.to !== l.from ? ` ~ ${l.to}` : ""}{l.label ? ` · ${l.label}` : ""}</span>
//                     <button className={ghostBtn} onClick={() => setLeaves(leaves.filter((x) => x.id !== l.id))}>삭제</button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </Section>

//         <Section title="화면 설정" open={sec("ui")} onToggle={() => togSec("ui")}>
//           <div className="flex items-center gap-2">
//             <Chip on={simple} onClick={() => setSimple(!simple)}>간단 모드</Chip>
//             <span className="text-xs text-gray-500">{simple ? "달력 아래에 한 줄 입력창이 보여요" : "켜면 달력 아래에 한 줄 입력창이 생겨요"}</span>
//           </div>
//         </Section>
//       </div>

//       <datalist id="sc-places">{placeHint.map((p) => <option key={p} value={p} />)}</datalist>
//     </div>
//   );
// }
