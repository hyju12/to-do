import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
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
  description: string
  date: string
  color: string
}

interface PlannerData {
  todos: Todo[]
  schedules: Schedule[]
}

type ModalType = "schedule" | "todo" | null

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
const STORAGE_KEY = "my-planner-data"
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
  const [scheduleDescription, setScheduleDescription] = useState("")
  const [scheduleColor, setScheduleColor] = useState(DEFAULT_COLOR)
  const [scheduleDate, setScheduleDate] = useState(today)

  const [todoTitle, setTodoTitle] = useState("")
  const [todoDate, setTodoDate] = useState(today)
  const [todoMemo, setTodoMemo] = useState("")

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ todos, schedules }))
  }, [todos, schedules])

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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                            title={`${schedule.time} ${schedule.title}`}
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
              <span className="ml-auto">날짜를 누르면 새 항목을 추가할 수 있어요.</span>
            </div>
          </section>

          {/* Selected date details */}
          <aside className="flex min-w-0 flex-col gap-4">
            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">SELECTED DATE</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    {selectedDateLabel}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedDate}</p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="size-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarPlus className="size-3.5" />
                    일정
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {filteredSchedules.length}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ListTodo className="size-3.5" />
                    할 일
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {completedCount}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      / {filteredTodos.length}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">일정</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">선택한 날짜의 일정</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openScheduleModal}
                >
                  <Plus className="mr-1.5 size-3.5" />
                  추가
                </Button>
              </div>

              {filteredSchedules.length > 0 ? (
                <div className="space-y-2">
                  {filteredSchedules.map((schedule) => {
                    const color = getScheduleColor(schedule.color)
                    return (
                      <div
                        key={schedule.id}
                        className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
                      >
                        <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${color.dot}`} />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => editSchedule(schedule)}
                        >
                          <span className="block truncate text-sm font-medium">
                            {schedule.title}
                          </span>
                          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="size-3" />
                            {schedule.time}
                          </span>
                          {schedule.description && (
                            <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                              {schedule.description}
                            </span>
                          )}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="일정 수정"
                          onClick={() => editSchedule(schedule)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed px-3 py-7 text-center">
                  <CalendarPlus className="mx-auto size-5 text-muted-foreground/60" />
                  <p className="mt-2 text-xs text-muted-foreground">등록된 일정이 없습니다.</p>
                </div>
              )}
            </section>

            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">할 일</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {completedCount}개 완료 · {filteredTodos.length - completedCount}개 남음
                  </p>
                </div>
                <Button type="button" size="sm" onClick={openTodoModal}>
                  <Plus className="mr-1.5 size-3.5" />
                  추가
                </Button>
              </div>

              {filteredTodos.length > 0 ? (
                <div className="space-y-2">
                  {filteredTodos.map((todo) => (
                    <div key={todo.id} className="rounded-lg border p-3">
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={(checked) =>
                            handleTodoChange(todo.id, checked === true)
                          }
                          aria-label={`${todo.title} 완료`}
                          className="mt-0.5"
                        />
                        <button
                          type="button"
                          className={`min-w-0 flex-1 text-left text-sm ${
                            todo.completed
                              ? "text-muted-foreground line-through"
                              : "font-medium"
                          }`}
                          onClick={() => toggleMemo(todo.id)}
                        >
                          <span className="block break-words">{todo.title}</span>
                          {todo.completed && (
                            <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                              {expandedTodoId === todo.id ? "메모 접기" : "메모 보기"}
                            </span>
                          )}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          aria-label="할 일 수정"
                          onClick={() => editTodo(todo)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>

                      {todo.completed && expandedTodoId === todo.id && (
                        <div className="mt-3 border-t pt-3">
                          <label
                            htmlFor={`memo-${todo.id}`}
                            className="mb-1.5 block text-xs font-medium text-muted-foreground"
                          >
                            완료 메모
                          </label>
                          <Textarea
                            id={`memo-${todo.id}`}
                            value={todo.memo}
                            onChange={(event) => handleMemoChange(todo.id, event.target.value)}
                            rows={3}
                            placeholder="완료한 내용이나 기록을 남겨보세요."
                            className="resize-none text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed px-3 py-7 text-center">
                  <ListTodo className="mx-auto size-5 text-muted-foreground/60" />
                  <p className="mt-2 text-xs text-muted-foreground">등록된 할 일이 없습니다.</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* Schedule editor */}
      <Dialog open={modalType === "schedule"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "일정 수정" : "일정 추가"}</DialogTitle>
            <DialogDescription>일정의 제목, 날짜, 시간과 색상을 설정하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-2">
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
              <div className="space-y-2">
                <label htmlFor="schedule-date" className="text-sm font-medium">날짜</label>
                <Input
                  id="schedule-date"
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
              <label htmlFor="todo-date" className="text-sm font-medium">날짜</label>
              <Input
                id="todo-date"
                type="date"
                required
                value={todoDate}
                onChange={(event) => setTodoDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
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
