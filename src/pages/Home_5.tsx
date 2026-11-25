import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { requestAiSchedule } from "@/lib/ai"

interface Todo {
  id: number
  title: string
  completed: boolean
  date: string
  memo: string
}

interface Schedule {
  id: number
  title: string
  time: string
  duration: number
  description: string
  date: string
  color: string
}

interface PlannerData {
  todos: Todo[]
  schedules: Schedule[]
}

interface AiProfile {
  workHours: string
  lifestyle: string
  preferredTime: string
  transportation: string
}

const DEFAULT_AI_PROFILE: AiProfile = {
  workHours: "",
  lifestyle: "",
  preferredTime: "",
  transportation: "",
}

const loadAiProfile = (): AiProfile => {
  try {
    const saved = localStorage.getItem(AI_PROFILE_STORAGE_KEY)
    return saved ? { ...DEFAULT_AI_PROFILE, ...JSON.parse(saved) } : DEFAULT_AI_PROFILE
  } catch {
    return DEFAULT_AI_PROFILE
  }
}

type ModalType = "schedule" | "todo" | null

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
const STORAGE_KEY = "my-planner-data"
const AI_PROFILE_STORAGE_KEY = "my-planner-ai-profile"
const DEFAULT_COLOR = "teal"

const SCHEDULE_COLORS = [
  { value: "teal", dot: "bg-teal-500", soft: "bg-teal-500/10", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-500", name: "청록" },
  { value: "blue", dot: "bg-blue-500", soft: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-500", name: "파랑" },
  { value: "violet", dot: "bg-violet-500", soft: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-500", name: "보라" },
  { value: "pink", dot: "bg-pink-500", soft: "bg-pink-500/10", text: "text-pink-700 dark:text-pink-300", ring: "ring-pink-500", name: "분홍" },
  { value: "red", dot: "bg-red-500", soft: "bg-red-500/10", text: "text-red-700 dark:text-red-300", ring: "ring-red-500", name: "빨강" },
  { value: "orange", dot: "bg-orange-500", soft: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-500", name: "주황" },
  { value: "amber", dot: "bg-amber-500", soft: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500", name: "노랑" },
  { value: "green", dot: "bg-green-500", soft: "bg-green-500/10", text: "text-green-700 dark:text-green-300", ring: "ring-green-500", name: "초록" },
  { value: "gray", dot: "bg-gray-500", soft: "bg-gray-500/10", text: "text-gray-700 dark:text-gray-300", ring: "ring-gray-500", name: "회색" },
]

const loadPlannerData = (): PlannerData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { todos: [], schedules: [] }

    const data = JSON.parse(saved)
    return {
      todos: Array.isArray(data.todos) ? data.todos : [],
      schedules: Array.isArray(data.schedules)
        ? data.schedules.map((item: Schedule) => ({
            ...item,
            color: item.color || DEFAULT_COLOR,
            duration: Number(item.duration) > 0 ? Number(item.duration) : 60,
          }))
        : [],
    }
  } catch {
    return { todos: [], schedules: [] }
  }
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getScheduleColor = (value: string) =>
  SCHEDULE_COLORS.find((color) => color.value === value) ?? SCHEDULE_COLORS[0]

const Home = () => {
  const today = formatDate(new Date())
  const [initialData] = useState<PlannerData>(() => loadPlannerData())
  const [todos, setTodos] = useState<Todo[]>(initialData.todos)
  const [schedules, setSchedules] = useState<Schedule[]>(initialData.schedules)

  const [selectedDate, setSelectedDate] = useState(today)
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const [expandedTodoId, setExpandedTodoId] = useState<number | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [scheduleTitle, setScheduleTitle] = useState("")
  const [scheduleTime, setScheduleTime] = useState("09:00")
  const [scheduleDuration, setScheduleDuration] = useState(60)
  const [scheduleDescription, setScheduleDescription] = useState("")
  const [scheduleColor, setScheduleColor] = useState(DEFAULT_COLOR)
  const [scheduleDate, setScheduleDate] = useState(today)

  const [todoTitle, setTodoTitle] = useState("")
  const [todoDate, setTodoDate] = useState(today)
  const [todoMemo, setTodoMemo] = useState("")

  // AI 플래너 상태
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiProfile, setAiProfile] = useState<AiProfile>(() => loadAiProfile())
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAnswer, setAiAnswer] = useState("")
  const [aiError, setAiError] = useState("")

  const handleAiRequest = async () => {
    const userRequest = aiPrompt.trim()
    if (!userRequest || aiLoading) return

    setAiLoading(true)
    setAiAnswer("")
    setAiError("")

    try {
      const answer = await requestAiSchedule({
        userRequest,
        selectedDate,
        profile: aiProfile,
        schedules: [...schedules].sort((a, b) =>
          `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
        ),
        todos,
      })

      setAiAnswer(answer)
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "AI 일정 추천 중 오류가 발생했습니다.",
      )
    } finally {
      setAiLoading(false)
    }
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ todos, schedules }))
  }, [todos, schedules])

  useEffect(() => {
    localStorage.setItem(AI_PROFILE_STORAGE_KEY, JSON.stringify(aiProfile))
  }, [aiProfile])

  const changeMonth = (amount: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + amount, 1))
  }

  const moveToday = () => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(formatDate(now))
    setExpandedTodoId(null)
  }

  const closeModal = () => {
    setModalType(null)
    setEditingId(null)
  }

  const openScheduleModal = () => {
    setEditingId(null)
    setScheduleTitle("")
    setScheduleTime("09:00")
    setScheduleDuration(60)
    setScheduleDescription("")
    setScheduleColor(DEFAULT_COLOR)
    setScheduleDate(selectedDate)
    setModalType("schedule")
  }

  const editSchedule = (schedule: Schedule) => {
    setEditingId(schedule.id)
    setSelectedDate(schedule.date)
    setScheduleTitle(schedule.title)
    setScheduleTime(schedule.time)
    setScheduleDuration(schedule.duration || 60)
    setScheduleDescription(schedule.description)
    setScheduleColor(schedule.color || DEFAULT_COLOR)
    setScheduleDate(schedule.date)
    setModalType("schedule")
  }

  const handleScheduleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!scheduleTitle.trim()) return

    if (editingId !== null) {
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: scheduleTitle.trim(),
                time: scheduleTime,
                duration: scheduleDuration,
                description: scheduleDescription.trim(),
                date: scheduleDate,
                color: scheduleColor,
              }
            : item,
        ),
      )
    } else {
      setSchedules((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: scheduleTitle.trim(),
          time: scheduleTime,
          duration: scheduleDuration,
          description: scheduleDescription.trim(),
          date: scheduleDate,
          color: scheduleColor,
        },
      ])
    }

    setSelectedDate(scheduleDate)
    closeModal()
  }

  const deleteSchedule = (id: number) => {
    if (!window.confirm("이 일정을 삭제하시겠습니까?")) return
    setSchedules((prev) => prev.filter((item) => item.id !== id))
    closeModal()
  }

  const openTodoModal = () => {
    setEditingId(null)
    setTodoTitle("")
    setTodoDate(selectedDate)
    setTodoMemo("")
    setModalType("todo")
  }

  const editTodo = (todo: Todo) => {
    setEditingId(todo.id)
    setSelectedDate(todo.date)
    setTodoTitle(todo.title)
    setTodoDate(todo.date)
    setTodoMemo(todo.memo || "")
    setModalType("todo")
  }

  const handleTodoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!todoTitle.trim()) return

    if (editingId !== null) {
      setTodos((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, title: todoTitle.trim(), date: todoDate, memo: todoMemo }
            : item,
        ),
      )
    } else {
      setTodos((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: todoTitle.trim(),
          completed: false,
          date: todoDate,
          memo: todoMemo,
        },
      ])
    }

    setSelectedDate(todoDate)
    closeModal()
  }

  const deleteTodo = (id: number) => {
    if (!window.confirm("이 할 일을 삭제하시겠습니까?")) return
    setTodos((prev) => prev.filter((item) => item.id !== id))
    if (expandedTodoId === id) setExpandedTodoId(null)
    closeModal()
  }

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const totalCells = Math.ceil((startDay + totalDays) / 7) * 7
  const calendarDays = Array.from(
    { length: totalCells },
    (_, index) => new Date(year, month, 1 - startDay + index),
  )

  const filteredSchedules = schedules
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))
  const filteredTodos = todos.filter((item) => item.date === selectedDate)
  const completedCount = filteredTodos.filter((item) => item.completed).length
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)
  const selectedDateLabel = selectedDateObject.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  const handleTodoChange = (id: number, checked: boolean) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: checked } : todo)),
    )
  }

  const toggleMemo = (id: number) => {
    setExpandedTodoId((prev) => (prev === id ? null : id))
  }

  const handleMemoChange = (id: number, memo: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, memo } : todo)))
  }

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              PERSONAL PLANNER
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              나의 일정
            </h1>
            <p className="text-sm text-muted-foreground">
              일정과 할 일을 한곳에서 관리하세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={moveToday}>
              오늘
            </Button>
          </div>
        </header>

        {/* Calendar + selected day panel */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {year}년 {month + 1}월
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  날짜를 선택해 등록된 일정과 할 일을 확인하세요.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label="이전 달"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label="다음 달"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b bg-muted/30">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={day}
                  className={`py-3 text-center text-xs font-medium ${
                    index === 0
                      ? "text-rose-500"
                      : index === 6
                        ? "text-blue-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const dateString = formatDate(date)
                const isCurrentMonth = date.getMonth() === month
                const isToday = dateString === today
                const isSelected = dateString === selectedDate
                const daySchedules = schedules
                  .filter((item) => item.date === dateString)
                  .sort((a, b) => a.time.localeCompare(b.time))
                const dayTodos = todos.filter((item) => item.date === dateString)

                return (
                  <button
                    key={dateString}
                    type="button"
                    onClick={() => setSelectedDate(dateString)}
                    aria-label={`${dateString} 선택`}
                    aria-pressed={isSelected}
                    className={`group flex min-h-28 min-w-0 flex-col border-b border-r p-1.5 text-left transition-colors hover:bg-accent/60 sm:min-h-36 sm:p-2.5 ${
                      index % 7 === 0 ? "border-l-0" : ""
                    } ${isSelected ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/30" : "bg-card"} ${
                      !isCurrentMonth ? "opacity-45" : ""
                    }`}
                  >
                    <span
                      className={`mb-1.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : isSelected
                            ? "bg-primary/10 text-primary"
                            : index % 7 === 0
                              ? "text-rose-500"
                              : index % 7 === 6
                                ? "text-blue-500"
                                : "text-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    <div className="flex w-full min-w-0 flex-col gap-1">
                      {daySchedules.slice(0, 2).map((schedule) => {
                        const color = getScheduleColor(schedule.color)
                        return (
                          <span
                            key={schedule.id}
                            onClick={(event) => {
                              event.stopPropagation()
                              editSchedule(schedule)
                            }}
                            className={`block w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium sm:text-[11px] ${color.soft} ${color.text}`}
                            title={`${schedule.time} (${schedule.duration || 60}분) ${schedule.title}`}
                          >
                            {schedule.title}
                          </span>
                        )
                      })}

                      {dayTodos.slice(0, 2).map((todo) => (
                        <span
                          key={todo.id}
                          className={`block truncate px-1 text-[10px] sm:text-[11px] ${
                            todo.completed
                              ? "text-muted-foreground line-through"
                              : "text-muted-foreground"
                          }`}
                          title={todo.title}
                        >
                          {todo.title}
                        </span>
                      ))}

                      {daySchedules.length + dayTodos.length > 4 && (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{daySchedules.length + dayTodos.length - 4}개 더보기
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                오늘
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary/30 ring-1 ring-primary/50" />
                선택한 날짜
              </span>
              <span className="ml-auto">날짜를 선택하면 해당 날짜의 일정을 확인할 수 있어요.</span>
            </div>
          </section>

          {/* Selected date details + AI assistant */}
          <aside className="flex min-w-0 flex-col gap-3">
            <section className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground">선택한 날짜</p>
                  <h2 className="mt-0.5 truncate text-lg font-semibold">{selectedDateLabel}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  <span className="text-muted-foreground">일정 <strong className="ml-1 text-foreground">{filteredSchedules.length}</strong></span>
                  <span className="text-muted-foreground">할 일 <strong className="ml-1 text-foreground">{completedCount}/{filteredTodos.length}</strong></span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">일정</h3>
                  <span className="text-xs text-muted-foreground">{filteredSchedules.length}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={openScheduleModal}>
                  <Plus className="mr-1 size-3.5" />추가
                </Button>
              </div>

              {filteredSchedules.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredSchedules.map((schedule) => {
                    const color = getScheduleColor(schedule.color)
                    return (
                      <button
                        key={schedule.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
                        onClick={() => editSchedule(schedule)}
                      >
                        <span className={`size-2 shrink-0 rounded-full ${color.dot}`} />
                        <span className="min-w-0 flex-1 truncate text-sm">{schedule.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{schedule.time} · {schedule.duration || 60}분</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="px-2 py-2 text-xs text-muted-foreground">등록된 일정이 없습니다.</p>
              )}
            </section>

            <section className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">할 일</h3>
                  <span className="text-xs text-muted-foreground">{completedCount}/{filteredTodos.length} 완료</span>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={openTodoModal}>
                  <Plus className="mr-1 size-3.5" />추가
                </Button>
              </div>

              {filteredTodos.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredTodos.map((todo) => (
                    <div key={todo.id} className="rounded-md px-2 py-1.5 hover:bg-accent/40">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={(checked) => handleTodoChange(todo.id, checked === true)}
                          aria-label={`${todo.title} 완료`}
                        />
                        <button
                          type="button"
                          className={`min-w-0 flex-1 truncate text-left text-sm ${todo.completed ? "text-muted-foreground line-through" : ""}`}
                          onClick={() => toggleMemo(todo.id)}
                        >
                          {todo.title}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0"
                          aria-label="할 일 수정"
                          onClick={() => editTodo(todo)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                      </div>
                      {todo.completed && expandedTodoId === todo.id && (
                        <div className="ml-7 mt-2">
                          <label htmlFor={`memo-${todo.id}`} className="mb-2 block text-[11px] text-muted-foreground">완료 메모</label>
                          <Textarea
                            id={`memo-${todo.id}`}
                            value={todo.memo}
                            onChange={(event) => handleMemoChange(todo.id, event.target.value)}
                            rows={2}
                            placeholder="완료 메모를 남겨보세요."
                            className="resize-none text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-2 text-xs text-muted-foreground">등록된 할 일이 없습니다.</p>
              )}
            </section>

            <section className="rounded-xl border border-violet-200/70 bg-violet-50/50 p-3 shadow-sm dark:border-violet-900/60 dark:bg-violet-950/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                  <Sparkles className="size-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">AI 일정 도우미</h3>
                  <p className="text-[11px] text-muted-foreground">일정에 맞는 시간을 추천해 드려요.</p>
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-violet-200/70 bg-background/80 p-3 dark:border-violet-900/60">
                <details>
                  <summary className="cursor-pointer list-none text-xs font-medium text-foreground">
                    나의 기본 정보 설정
                    <span className="ml-2 font-normal text-muted-foreground">일정 추천에 반영할 생활 패턴</span>
                  </summary>
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <div className="space-y-1.5">
                      <label htmlFor="ai-work-hours" className="text-xs font-medium">근무 시간</label>
                      <Input
                        id="ai-work-hours"
                        value={aiProfile.workHours}
                        onChange={(event) => setAiProfile((prev) => ({ ...prev, workHours: event.target.value }))}
                        placeholder="예: 평일 09:00~18:00"
                        className="h-9 bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="ai-lifestyle" className="text-xs font-medium">생활 패턴</label>
                      <Input
                        id="ai-lifestyle"
                        value={aiProfile.lifestyle}
                        onChange={(event) => setAiProfile((prev) => ({ ...prev, lifestyle: event.target.value }))}
                        placeholder="예: 평일 저녁에는 휴식이 필요해요"
                        className="h-9 bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="ai-preferred-time" className="text-xs font-medium">선호 시간</label>
                      <Input
                        id="ai-preferred-time"
                        value={aiProfile.preferredTime}
                        onChange={(event) => setAiProfile((prev) => ({ ...prev, preferredTime: event.target.value }))}
                        placeholder="예: 오전 시간대 선호"
                        className="h-9 bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="ai-transportation" className="text-xs font-medium">이동 방식</label>
                      <Input
                        id="ai-transportation"
                        value={aiProfile.transportation}
                        onChange={(event) => setAiProfile((prev) => ({ ...prev, transportation: event.target.value }))}
                        placeholder="예: 대중교통 이용, 이동 시간 최소화"
                        className="h-9 bg-background text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">입력한 정보는 이 브라우저에 저장돼요.</p>
                  </div>
                </details>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={aiPrompt}
                  onChange={(event) => {
                    setAiPrompt(event.target.value)
                    setAiAnswer("")
                    setAiError("")
                  }}
                  rows={3}
                  placeholder="예: 이번 주 운동할 시간 찾아줘."
                  className="resize-none bg-background text-sm"
                  aria-label="AI 일정 요청 입력"
                />
                <div className="flex flex-wrap gap-1.5">
                  {["빈 시간 찾기", "할 일 우선순위", "일정 재배치"].map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 bg-background px-2 text-[11px]"
                      onClick={() => {
                        setAiPrompt(suggestion)
                        setAiAnswer("")
                        setAiError("")
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-violet-600 text-white hover:bg-violet-700"
                  disabled={!aiPrompt.trim() || aiLoading}
                  onClick={handleAiRequest}
                >
                  <Sparkles className="mr-2 size-3.5" />
                  {aiLoading ? "추천하는 중..." : "추천받기"}
                </Button>

                {aiLoading && (
                  <p role="status" className="rounded-md bg-background/80 px-3 py-2.5 text-xs text-muted-foreground">
                    등록된 일정과 기본 정보를 분석하고 있어요.
                  </p>
                )}

                {aiError && (
                  <div role="alert" className="rounded-md border border-destructive/30 bg-background px-3 py-2.5 text-xs text-destructive">
                    {aiError}
                  </div>
                )}

                {aiAnswer && (
                  <div className="space-y-1.5 rounded-md bg-background/90 px-3 py-3 text-sm">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                      AI 추천 결과
                    </p>
                    <p className="whitespace-pre-wrap leading-6 text-foreground">
                      {aiAnswer}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>

      </div>

      {/* Schedule editor */}
      <Dialog open={modalType === "schedule"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "일정 수정" : "일정 추가"}</DialogTitle>
            <DialogDescription>일정의 제목, 날짜, 시작 시간과 소요 시간을 설정하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label htmlFor="schedule-title" className="text-sm font-medium">일정 제목</label>
              <Input
                id="schedule-title"
                autoFocus
                required
                value={scheduleTitle}
                onChange={(event) => setScheduleTitle(event.target.value)}
                placeholder="일정 제목을 입력하세요."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <label htmlFor="schedule-date" className="text-sm font-medium">날짜</label>
                <Input
                  id="schedule-date"
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="schedule-time" className="text-sm font-medium">시간</label>
                <Input
                  id="schedule-time"
                  type="time"
                  required
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="schedule-duration" className="text-sm font-medium">소요 시간 (분)</label>
              <Input
                id="schedule-duration"
                type="number"
                min={15}
                max={1440}
                step={15}
                required
                value={scheduleDuration}
                onChange={(event) => setScheduleDuration(Math.max(15, Number(event.target.value) || 15))}
              />
              <p className="text-xs text-muted-foreground">기본값은 60분이며, 15분 단위로 설정할 수 있어요.</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="schedule-description" className="text-sm font-medium">설명</label>
              <Textarea
                id="schedule-description"
                value={scheduleDescription}
                onChange={(event) => setScheduleDescription(event.target.value)}
                placeholder="추가 설명을 입력하세요."
                rows={3}
                className="resize-none"
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">일정 색상</legend>
              <div className="flex flex-wrap gap-2.5">
                {SCHEDULE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setScheduleColor(color.value)}
                    aria-label={`${color.name} 색상`}
                    aria-pressed={scheduleColor === color.value}
                    className={`flex size-8 items-center justify-center rounded-full ${color.dot} transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      scheduleColor === color.value ? `ring-2 ring-offset-2 ${color.ring}` : ""
                    }`}
                  >
                    {scheduleColor === color.value && <Check className="size-4 text-white" />}
                  </button>
                ))}
              </div>
            </fieldset>
            <DialogFooter className="gap-2 sm:gap-2">
              {editingId !== null && (
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:mr-auto"
                  onClick={() => deleteSchedule(editingId)}
                >
                  <Trash2 className="mr-2 size-4" />
                  삭제
                </Button>
              )}
              <Button type="button" variant="outline" onClick={closeModal}>취소</Button>
              <Button type="submit">{editingId !== null ? "수정 완료" : "저장"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Todo editor */}
      <Dialog open={modalType === "todo"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "할 일 수정" : "할 일 추가"}</DialogTitle>
            <DialogDescription>할 일과 완료 후 남길 메모를 입력하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTodoSubmit} className="space-y-4">
            <div className="space-y-3">
              <label htmlFor="todo-title" className="text-sm font-medium">할 일 제목</label>
              <Input
                id="todo-title"
                autoFocus
                required
                value={todoTitle}
                onChange={(event) => setTodoTitle(event.target.value)}
                placeholder="할 일을 입력하세요."
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="todo-date" className="text-sm font-medium">날짜</label>
              <Input
                id="todo-date"
                type="date"
                required
                value={todoDate}
                onChange={(event) => setTodoDate(event.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="todo-memo" className="text-sm font-medium">메모</label>
              <Textarea
                id="todo-memo"
                value={todoMemo}
                onChange={(event) => setTodoMemo(event.target.value)}
                rows={3}
                placeholder="메모를 입력하세요."
                className="resize-none"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              {editingId !== null && (
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:mr-auto"
                  onClick={() => deleteTodo(editingId)}
                >
                  <Trash2 className="mr-2 size-4" />
                  삭제
                </Button>
              )}
              <Button type="button" variant="outline" onClick={closeModal}>취소</Button>
              <Button type="submit">{editingId !== null ? "수정 완료" : "저장"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default Home
