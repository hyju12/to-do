
import { useState } from 'react'

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
}

const Home = () => {
  // 날짜 포맷
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // 선택 날짜
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Todo 상태
  const [todos, setTodos] = useState<Todo[]>([])

  // Schedule 상태
  const [schedules] = useState<Schedule[]>([])

  // 펼쳐진 메모 ID
  const [expandedTodoId, setExpandedTodoId] = useState<number | null>(null)

  // 날짜 이동
  const changeDate = (amount: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev)
      next.setDate(next.getDate() + amount)
      return next
    })

    setExpandedTodoId(null)
  }

  // 오늘 날짜로 이동
  const moveToday = () => {
    setSelectedDate(new Date())
    setExpandedTodoId(null)
  }

  // 현재 선택 날짜
  const currentDate = formatDate(selectedDate)

  // 날짜별 데이터 조회
  const filteredTodos = todos.filter(
    todo => todo.date === currentDate
  )

  const filteredSchedules = schedules
    .filter(schedule => schedule.date === currentDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  // Todo 완료 상태 변경
  const handleTodoChange = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    )
  }

  // 메모 영역 열기 / 닫기
  const toggleMemo = (id: number) => {
    setExpandedTodoId(prev => prev === id ? null : id)
  }

  // 메모 변경
  const handleMemoChange = (id: number, memo: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, memo }
          : todo
      )
    )
  }

  // 완료한 Todo 개수
  const completedCount = filteredTodos.filter(
    todo => todo.completed
  ).length

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Planner</h1>
          <p className="mt-2 text-sm text-gray-500">
            나만의 일정 관리
          </p>
        </header>

        {/* Date Navigation */}
        <section className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-100"
            >
              ← 이전
            </button>

            <div className="text-center">
              <h2 className="text-xl font-bold">
                {selectedDate.getFullYear()}년{' '}
                {selectedDate.getMonth() + 1}월{' '}
                {selectedDate.getDate()}일
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {selectedDate.toLocaleDateString('ko-KR', {
                  weekday: 'long',
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => changeDate(1)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-100"
            >
              다음 →
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={moveToday}
              className="text-sm text-blue-600 hover:underline"
            >
              오늘로 이동
            </button>
          </div>
        </section>

        {/* Schedule */}
        <section className="mb-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">일정</h2>

            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
            >
              + 일정 추가
            </button>
          </div>

          {filteredSchedules.length > 0 ? (
            <div className="space-y-4">
              {filteredSchedules.map(schedule => (
                <div key={schedule.id} className="flex gap-4">
                  <span className="pt-4 text-sm text-gray-500">
                    {schedule.time}
                  </span>

                  <div className="flex-1 rounded-lg border-l-4 border-blue-400 bg-white p-4 shadow-sm">
                    <p className="font-medium">
                      {schedule.title}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {schedule.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white p-6 text-center text-sm text-gray-400">
              등록된 일정이 없습니다.
            </p>
          )}
        </section>

        {/* Divider */}
        <div className="my-8 border-t border-gray-200" />

        {/* Todo */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">TO DO</h2>

            <span className="text-sm text-gray-500">
              {completedCount} / {filteredTodos.length} 완료
            </span>
          </div>

          {filteredTodos.length > 0 ? (
            <ul className="space-y-3">
              {filteredTodos.map(todo => (
                <li
                  key={todo.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleTodoChange(todo.id)}
                      className="h-4 w-4 accent-blue-600"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (todo.completed) {
                          toggleMemo(todo.id)
                        }
                      }}
                      disabled={!todo.completed}
                      className={`flex-1 text-left text-sm ${
                        todo.completed
                          ? 'cursor-pointer text-gray-400 line-through'
                          : 'cursor-default text-gray-800'
                      }`}
                    >
                      {todo.title}
                    </button>

                    {todo.completed && (
                      <span className="text-xs text-gray-400">
                        {expandedTodoId === todo.id ? '접기' : '메모 보기'}
                      </span>
                    )}
                  </div>

                  {todo.completed && expandedTodoId === todo.id && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <label
                        htmlFor={`memo-${todo.id}`}
                        className="mb-2 block text-xs font-medium text-gray-500"
                      >
                        완료 메모
                      </label>

                      <textarea
                        id={`memo-${todo.id}`}
                        value={todo.memo}
                        onChange={e =>
                          handleMemoChange(todo.id, e.target.value)
                        }
                        placeholder="완료한 내용이나 기록을 남겨보세요."
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-white p-6 text-center text-sm text-gray-400">
              등록된 할 일이 없습니다.
            </p>
          )}

          <button
            type="button"
            className="mt-5 w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:bg-gray-100"
          >
            + 할 일 추가
          </button>
        </section>

      </div>
    </div>
  )
}

export default Home
