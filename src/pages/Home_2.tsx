
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

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

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const STORAGE_KEY = 'my-planner-data'
const DEFAULT_COLOR = 'bg-teal-500'

const SCHEDULE_COLORS = [
  { value: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600', name: '청록' },
  { value: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', name: '파랑' },
  { value: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', name: '보라' },
  { value: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600', name: '분홍' },
  { value: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600', name: '빨강' },
  { value: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', name: '주황' },
  { value: 'bg-amber-400', light: 'bg-amber-50', text: 'text-amber-600', name: '노랑' },
  { value: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', name: '초록' },
  { value: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-600', name: '회색' },
]

const loadPlannerData = (): PlannerData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return { todos: [], schedules: [] }
    }

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

const Home = () => {
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const today = formatDate(new Date())

  const [selectedDate, setSelectedDate] = useState(today)
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  // localStorage에서 초기 데이터를 바로 읽어 Effect 내부 setState를 제거
  const [initialData] = useState<PlannerData>(() => loadPlannerData())
  const [todos, setTodos] = useState<Todo[]>(initialData.todos)
  const [schedules, setSchedules] = useState<Schedule[]>(initialData.schedules)

  const [expandedTodoId, setExpandedTodoId] = useState<number | null>(null)

  const [modalType, setModalType] = useState<
    'choice' | 'schedule' | 'todo' | null
  >(null)

  const [editingId, setEditingId] = useState<number | null>(null)

  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleDescription, setScheduleDescription] = useState('')
  const [scheduleColor, setScheduleColor] = useState(DEFAULT_COLOR)
  const [scheduleDate, setScheduleDate] = useState(today)

  const [todoTitle, setTodoTitle] = useState('')
  const [todoDate, setTodoDate] = useState(today)
  const [todoMemo, setTodoMemo] = useState('')

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  useEffect(() => {
    // 초기 데이터 로딩 전 빈 데이터로 덮어쓰지 않도록 처리
    const data = localStorage.getItem(STORAGE_KEY)
    if (data === null) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ todos, schedules })
      )
      return
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ todos, schedules })
    )
  }, [todos, schedules])

  // 월 이동
  const changeMonth = (amount: number) => {
    setCurrentMonth(prev =>
      new Date(prev.getFullYear(), prev.getMonth() + amount, 1)
    )
  }

  // 오늘로 이동
  const moveToday = () => {
    const now = new Date()

    setCurrentMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    )
    setSelectedDate(formatDate(now))
    setExpandedTodoId(null)
  }

  // 모달 초기화
  const closeModal = () => {
    setModalType(null)
    setEditingId(null)
  }

  // 날짜 클릭: 추가 종류 선택
  const openChoiceModal = (date: string) => {
    setSelectedDate(date)
    setScheduleDate(date)
    setTodoDate(date)
    setModalType('choice')
  }

  // 일정 추가 모달
  const openScheduleModal = () => {
    setEditingId(null)
    setScheduleTitle('')
    setScheduleTime('09:00')
    setScheduleDescription('')
    setScheduleColor(DEFAULT_COLOR)
    setScheduleDate(selectedDate)
    setModalType('schedule')
  }

  // 일정 수정 모달
  const editSchedule = (schedule: Schedule) => {
    setEditingId(schedule.id)
    setSelectedDate(schedule.date)
    setScheduleTitle(schedule.title)
    setScheduleTime(schedule.time)
    setScheduleDescription(schedule.description)
    setScheduleColor(schedule.color || DEFAULT_COLOR)
    setScheduleDate(schedule.date)
    setModalType('schedule')
  }

  // 일정 저장 및 수정
  const handleScheduleSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!scheduleTitle.trim()) return

    if (editingId !== null) {
      setSchedules(prev =>
        prev.map(item =>
          item.id === editingId
            ? {
                ...item,
                title: scheduleTitle.trim(),
                time: scheduleTime,
                description: scheduleDescription.trim(),
                date: scheduleDate,
                color: scheduleColor,
              }
            : item
        )
      )
    } else {
      const newSchedule: Schedule = {
        id: Date.now(),
        title: scheduleTitle.trim(),
        time: scheduleTime,
        description: scheduleDescription.trim(),
        date: scheduleDate,
        color: scheduleColor,
      }

      setSchedules(prev => [...prev, newSchedule])
    }

    setSelectedDate(scheduleDate)
    setModalType(null)
    setEditingId(null)
  }

  // 일정 삭제
  const deleteSchedule = (id: number) => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return

    setSchedules(prev => prev.filter(item => item.id !== id))
    closeModal()
  }

  // 할 일 추가 모달
  const openTodoModal = () => {
    setEditingId(null)
    setTodoTitle('')
    setTodoDate(selectedDate)
    setTodoMemo('')
    setModalType('todo')
  }

  // 할 일 수정 모달
  const editTodo = (todo: Todo) => {
    setEditingId(todo.id)
    setSelectedDate(todo.date)
    setTodoTitle(todo.title)
    setTodoDate(todo.date)
    setTodoMemo(todo.memo || '')
    setModalType('todo')
  }

  // 할 일 저장 및 수정
  const handleTodoSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!todoTitle.trim()) return

    if (editingId !== null) {
      setTodos(prev =>
        prev.map(item =>
          item.id === editingId
            ? {
                ...item,
                title: todoTitle.trim(),
                date: todoDate,
                memo: todoMemo,
              }
            : item
        )
      )
    } else {
      const newTodo: Todo = {
        id: Date.now(),
        title: todoTitle.trim(),
        completed: false,
        date: todoDate,
        memo: todoMemo,
      }

      setTodos(prev => [...prev, newTodo])
    }

    setSelectedDate(todoDate)
    setModalType(null)
    setEditingId(null)
  }

  // 할 일 삭제
  const deleteTodo = (id: number) => {
    if (!window.confirm('이 할 일을 삭제하시겠습니까?')) return

    setTodos(prev => prev.filter(item => item.id !== id))

    if (expandedTodoId === id) {
      setExpandedTodoId(null)
    }

    closeModal()
  }

  // 달력 날짜 계산
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const totalCells = Math.ceil((startDay + totalDays) / 7) * 7

  const calendarDays = Array.from(
    { length: totalCells },
    (_, index) => new Date(year, month, 1 - startDay + index)
  )

  // 선택 날짜별 데이터
  const filteredSchedules = schedules
    .filter(item => item.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  const filteredTodos = todos.filter(
    item => item.date === selectedDate
  )

  const completedCount = filteredTodos.filter(
    item => item.completed
  ).length

  // 일정 색상 정보
  const getScheduleColor = (color: string) => {
    return (
      SCHEDULE_COLORS.find(item => item.value === color) ||
      SCHEDULE_COLORS[0]
    )
  }

  // 할 일 완료 처리
  const handleTodoChange = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    )
  }

  // 메모 열기 / 닫기
  const toggleMemo = (id: number) => {
    setExpandedTodoId(prev => prev === id ? null : id)
  }

  // 메모 변경
  const handleMemoChange = (id: number, memo: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, memo } : todo
      )
    )
  }

  return (
    <main className="min-h-screen w-full bg-white">

      {/* Header */}
      <header className="flex flex-wrap items-center gap-3 px-5 py-6 md:px-8">
        <h1 className="mr-3 text-3xl font-bold tracking-tight">
          {year}.{String(month + 1).padStart(2, '0')}
        </h1>

        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="이전 달"
          className="rounded-lg border border-blue-400 px-3 py-1.5 text-xl text-blue-500 hover:bg-blue-50"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="다음 달"
          className="rounded-lg border border-blue-400 px-3 py-1.5 text-xl text-blue-500 hover:bg-blue-50"
        >
          ›
        </button>

        <button
          type="button"
          onClick={moveToday}
          className="rounded-lg border border-blue-400 px-3 py-2 text-sm text-blue-500 hover:bg-blue-50"
        >
          오늘
        </button>
      </header>

      {/* Calendar */}
      <section className="w-full">

        {/* Weekdays */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={`py-4 text-center text-sm ${
                index === 0
                  ? 'text-[#ff9288]'
                  : index === 6
                    ? 'text-[#55aaff]'
                    : 'text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dateString = formatDate(date)

            const isCurrentMonth = date.getMonth() === month
            const isToday = dateString === today
            const isSelected = dateString === selectedDate

            const daySchedules = schedules
              .filter(item => item.date === dateString)
              .sort((a, b) => a.time.localeCompare(b.time))

            const dayTodos = todos.filter(
              item => item.date === dateString
            )

            return (
              <div
                key={dateString}
                role="button"
                tabIndex={0}
                onClick={() => openChoiceModal(dateString)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openChoiceModal(dateString)
                  }
                }}
                className={`min-w-0 min-h-[145px] cursor-pointer border-b border-r border-gray-100 p-2 transition-colors md:min-h-[160px] ${
                  index % 7 === 0 ? 'border-l' : ''
                } ${
                  isSelected ? 'bg-blue-50/40' : 'bg-white'
                }`}
              >
                {/* Date Number */}
                <div className="mb-3 flex justify-start">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      isToday
                        ? 'bg-blue-500 font-semibold text-white'
                        : !isCurrentMonth
                          ? 'text-gray-300'
                          : index % 7 === 0
                            ? 'text-[#ff9288]'
                            : index % 7 === 6
                              ? 'text-[#55aaff]'
                              : 'text-gray-500'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* Schedule List */}
                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map(schedule => (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        editSchedule(schedule)
                      }}
                      className={`block w-full truncate rounded-md px-2 py-1 text-center text-xs font-medium text-white ${schedule.color || DEFAULT_COLOR}`}
                    >
                      {schedule.title}
                    </button>
                  ))}

                  {daySchedules.length > 3 && (
                    <p className="text-center text-xs text-gray-400">
                      +{daySchedules.length - 3}
                    </p>
                  )}
                </div>

                {/* Todo List */}
                {daySchedules.length > 0 && dayTodos.length > 0 && (
                  <div className="my-2 border-t border-gray-100" />
                )}

                <div className="space-y-1">
                  {dayTodos.slice(0, 3).map(todo => (
                    <div
                      key={todo.id}
                      className="flex min-w-0 items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleTodoChange(todo.id)}
                        aria-label={`${todo.title} 완료`}
                        className="h-3 w-3 shrink-0 accent-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => editTodo(todo)}
                        className={`min-w-0 truncate text-left text-xs ${
                          todo.completed
                            ? 'text-gray-400 line-through'
                            : 'text-gray-600'
                        }`}
                      >
                        {todo.title}
                      </button>
                    </div>
                  ))}

                  {dayTodos.length > 3 && (
                    <p className="text-center text-xs text-gray-400">
                      +{dayTodos.length - 3}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Todo Detail */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">TO DO</h2>
            <p className="mt-1 text-sm text-gray-400">
              {selectedDate}
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {completedCount} / {filteredTodos.length} 완료
          </span>
        </div>

        {/* Selected Date Schedules */}
        {filteredSchedules.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">
              일정
            </h3>

            {filteredSchedules.map(schedule => {
              const color = getScheduleColor(schedule.color)

              return (
                <button
                  key={schedule.id}
                  type="button"
                  onClick={() => editSchedule(schedule)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left ${color.light}`}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.value}`}
                  />
                  <span className={`text-sm font-medium ${color.text}`}>
                    {schedule.time} · {schedule.title}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Todo List */}
        {filteredTodos.length > 0 ? (
          <ul className="space-y-3">
            {filteredTodos.map(todo => (
              <li
                key={todo.id}
                className="rounded-lg border border-gray-100 p-4"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleTodoChange(todo.id)}
                    aria-label={`${todo.title} 완료`}
                    className="h-4 w-4 accent-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => toggleMemo(todo.id)}
                    className={`flex-1 text-left text-sm ${
                      todo.completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-800'
                    }`}
                  >
                    {todo.title}
                  </button>

                  {todo.completed && (
                    <span className="text-xs text-gray-400">
                      {expandedTodoId === todo.id ? '접기' : '메모 보기'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => editTodo(todo)}
                    aria-label="할 일 수정"
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    aria-label="할 일 삭제"
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>

                {todo.completed && expandedTodoId === todo.id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <label
                      htmlFor={`memo-${todo.id}`}
                      className="mb-2 block text-xs text-gray-500"
                    >
                      완료 메모
                    </label>

                    <textarea
                      id={`memo-${todo.id}`}
                      value={todo.memo}
                      onChange={e =>
                        handleMemoChange(todo.id, e.target.value)
                      }
                      rows={3}
                      placeholder="완료한 내용이나 기록을 남겨보세요."
                      className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">
            등록된 할 일이 없습니다.
          </div>
        )}

        <button
          type="button"
          onClick={openTodoModal}
          className="mt-4 w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-500"
        >
          + 할 일 추가
        </button>
      </section>

      {/* Add Choice Modal */}
      {modalType === 'choice' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="choice-modal-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="choice-modal-title" className="text-xl font-bold">
                  무엇을 추가할까요?
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {selectedDate}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="닫기"
                className="text-xl text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={openScheduleModal}
                className="w-full rounded-xl border border-gray-200 p-4 text-left text-sm font-medium hover:border-blue-400 hover:bg-blue-50"
              >
                + 일정 추가
              </button>

              <button
                type="button"
                onClick={openTodoModal}
                className="w-full rounded-xl border border-gray-200 p-4 text-left text-sm font-medium hover:border-blue-400 hover:bg-blue-50"
              >
                + 할 일 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {modalType === 'schedule' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="schedule-modal-title" className="text-xl font-bold">
                  {editingId !== null ? '일정 수정' : '일정 추가'}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  일정을 입력하세요.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="닫기"
                className="text-xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label htmlFor="schedule-title" className="mb-2 block text-sm font-medium">
                  일정 제목
                </label>
                <input
                  id="schedule-title"
                  autoFocus
                  required
                  value={scheduleTitle}
                  onChange={e => setScheduleTitle(e.target.value)}
                  placeholder="일정 제목을 입력하세요."
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label htmlFor="schedule-date" className="mb-2 block text-sm font-medium">
                  날짜
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label htmlFor="schedule-time" className="mb-2 block text-sm font-medium">
                  시간
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  required
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label htmlFor="schedule-description" className="mb-2 block text-sm font-medium">
                  설명
                </label>
                <textarea
                  id="schedule-description"
                  value={scheduleDescription}
                  onChange={e => setScheduleDescription(e.target.value)}
                  placeholder="추가 설명을 입력하세요."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">일정 색상</p>
                <div className="flex flex-wrap gap-3">
                  {SCHEDULE_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setScheduleColor(color.value)}
                      aria-label={`${color.name} 색상`}
                      aria-pressed={scheduleColor === color.value}
                      className={`h-7 w-7 rounded-full ${color.value} ${
                        scheduleColor === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-500'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingId !== null && (
                  <button
                    type="button"
                    onClick={() => deleteSchedule(editingId)}
                    className="rounded-lg border border-red-200 px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-gray-200 py-3 text-sm hover:bg-gray-50"
                >
                  취소
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600"
                >
                  {editingId !== null ? '수정 완료' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todo Modal */}
      {modalType === 'todo' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="todo-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="todo-modal-title" className="text-xl font-bold">
                  {editingId !== null ? '할 일 수정' : '할 일 추가'}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  할 일을 입력하세요.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="닫기"
                className="text-xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleTodoSubmit} className="space-y-4">
              <div>
                <label htmlFor="todo-title" className="mb-2 block text-sm font-medium">
                  할 일 제목
                </label>
                <input
                  id="todo-title"
                  autoFocus
                  required
                  value={todoTitle}
                  onChange={e => setTodoTitle(e.target.value)}
                  placeholder="할 일을 입력하세요."
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label htmlFor="todo-date" className="mb-2 block text-sm font-medium">
                  날짜
                </label>
                <input
                  id="todo-date"
                  type="date"
                  required
                  value={todoDate}
                  onChange={e => setTodoDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label htmlFor="todo-memo" className="mb-2 block text-sm font-medium">
                  메모
                </label>
                <textarea
                  id="todo-memo"
                  value={todoMemo}
                  onChange={e => setTodoMemo(e.target.value)}
                  rows={3}
                  placeholder="메모를 입력하세요."
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {editingId !== null && (
                  <button
                    type="button"
                    onClick={() => deleteTodo(editingId)}
                    className="rounded-lg border border-red-200 px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-gray-200 py-3 text-sm hover:bg-gray-50"
                >
                  취소
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600"
                >
                  {editingId !== null ? '수정 완료' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  )
}

export default Home
