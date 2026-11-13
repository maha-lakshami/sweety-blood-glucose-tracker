
import { useEffect, useState, type FormEvent } from 'react'
import {
  LayoutDashboard, Activity, FileText, Settings, LogOut,
  Bell, Plus, Heart, TrendingUp, TrendingDown,
  CalendarDays, Clock, Trash2, Menu, X, Droplets, Pencil
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'

type Reading = {
  id: string
  date: string
  slot: string
  value: number
}

type ApiReading = {
  id: string
  date: string
  slot: string
  value: number
  userId: string
}

const API_URL = 'http://localhost:5000/api'

const slots = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
]

const slotToApi: Record<string, string> = {
  'Morning (fasting)': 'MORNING',
  'After breakfast': 'AFTER_BREAKFAST',
  'After lunch': 'AFTER_LUNCH',
  'After dinner': 'AFTER_DINNER'
}

const slotFromApi: Record<string, string> = {
  MORNING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner'
}

const getToday = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (date: string) => {
  return date.split('T')[0]
}

function App() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [showForm, setShowForm] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [date, setDate] = useState(getToday())
  const [slot, setSlot] = useState(slots[0])
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reportType, setReportType] = useState<'daily' | 'month' | 'previous'>('daily')
  const [reportDate, setReportDate] = useState(getToday())
  

  const today = getToday()
  const token = localStorage.getItem('sweety_token')

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('sweety_token') || ''}`
  })

  // FETCH REAL READINGS FROM DATABASE
  const fetchReadings = async () => {
    const currentToken = localStorage.getItem('sweety_token')

    if (!currentToken) {
      setError('Please login to view your readings.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${API_URL}/readings`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to retrieve readings.')
      }

      const formattedReadings: Reading[] = (data.readings as ApiReading[]).map(
        reading => ({
          id: reading.id,
          date: formatDate(reading.date),
          slot: slotFromApi[reading.slot] || reading.slot,
          value: reading.value
        })
      )

      setReadings(formattedReadings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReadings()
  }, [])

  // TODAY'S STATISTICS
  const todayReadings = readings.filter(r => r.date === today)
  const values = todayReadings.map(r => r.value)

  const average = values.length
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    : '—'

  const highest = values.length ? Math.max(...values) : '—'
  const lowest = values.length ? Math.min(...values) : '—'

  // ADD OR UPDATE READING
  async function saveReading(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

     if (!token) {
      setError('Please login first.')
      return
    }

    const glucoseValue = Number(value)

    if (!value.trim()) {
      setError('Please enter a glucose value.')
      return
    }

    if (
      !Number.isInteger(glucoseValue) ||
      glucoseValue < 40 ||
      glucoseValue > 600
    ) {
      setError('Value must be an integer between 40 and 600 mg/dl.')
      return
    }

    if (!date || date > today) {
      setError('Please select a valid date. Future dates are not allowed.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        date,
        slot: slotToApi[slot],
        value: glucoseValue
      }

      const url = editingId
        ? `${API_URL}/readings/${editingId}`
        : `${API_URL}/readings`

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save reading.')
      }

      await fetchReadings()

      setValue('')
      setDate(today)
      setSlot(slots[0])
      setEditingId(null)
      setShowForm(false)
      setSuccess(data.message || 'Reading saved successfully.')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // OPEN EDIT FORM
  function editReading(reading: Reading) {
    setEditingId(reading.id)
    setDate(reading.date)
    setSlot(reading.slot)
    setValue(String(reading.value))
    setError('')
    setSuccess('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // DELETE READING FROM DATABASE
  async function deleteReading(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this glucose reading?'
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    setDeletingId(id)

    try {
      const response = await fetch(`${API_URL}/readings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete reading.')
      }

      setReadings(previous => previous.filter(r => r.id !== id))
      setSuccess(data.message || 'Reading deleted successfully.')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete reading.')
    } finally {
      setDeletingId(null)
    }
  }

  // CHART DATA FROM REAL READINGS
  const chartData = Object.values(
    readings.reduce((result, reading) => {
      if (!result[reading.date]) {
        result[reading.date] = {
          date: reading.date,
          total: 0,
          count: 0
        }
      }

      result[reading.date].total += reading.value
      result[reading.date].count += 1

      return result
    }, {} as Record<string, { date: string; total: number; count: number }>)
  )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(item => ({
      day: new Date(`${item.date}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
      }),
      value: Number((item.total / item.count).toFixed(1))
    }))

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'My Readings', icon: Activity },
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-[#29243d]">

      {/* Mobile menu */}
      <button
        onClick={() => setMobileMenu(!mobileMenu)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-white p-3 shadow md:hidden"
      >
        {mobileMenu ? <X size={21} /> : <Menu size={21} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-purple-100 bg-white p-6 transition-transform ${
        mobileMenu ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>

        <div className="mb-12 flex items-center gap-3">
          <div className="rounded-xl bg-purple-600 p-3 text-white">
            <Heart size={23} fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sweety</h1>
            <p className="text-xs text-gray-400">Glucose Tracker</p>
          </div>
        </div>

        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Menu
        </p>

        <nav className="space-y-2">
          {navigation.map(item => (
            <button
              key={item.name}
              onClick={() => {
                setActivePage(item.name)
                setMobileMenu(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activePage === item.name
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <item.icon size={19} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-purple-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-purple-700">
            <Heart size={17} />
            <span className="text-sm font-semibold">Stay healthy!</span>
          </div>
          <p className="text-xs leading-5 text-gray-500">
            Small steps every day make a big difference.
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('sweety_token')
            localStorage.removeItem('sweety_user')
            window.location.href = '/login'
          }}
          className="mt-5 flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-red-500"
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="min-h-screen md:ml-64">

        <header className="flex items-center justify-between border-b border-purple-100 bg-white px-6 py-5 pl-16 md:px-10 md:pl-10">
          <div>
            <p className="text-sm text-gray-400">Welcome back,</p>
            <h2 className="text-xl font-bold">
              {(() => {
                try {
                  const user = JSON.parse(localStorage.getItem('sweety_user') || '{}')
                  return user.name || 'User'
                } catch {
                  return 'User'
                }
              })()} 👋
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Bell size={19} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-200 font-bold text-purple-700">
              U
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-10">
          {activePage === 'Dashboard' && (
            <>

          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-medium text-purple-600">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }).toUpperCase()}
              </p>
              <h1 className="text-3xl font-bold">Your Health Overview</h1>
              <p className="mt-2 text-sm text-gray-400">
                Keep track of your daily glucose levels.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingId(null)
                setDate(today)
                setSlot(slots[0])
                setValue('')
                setError('')
                setSuccess('')
                setShowForm(!showForm)
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
            >
              <Plus size={19} /> Add Reading
            </button>
          </section>

          {/* Notifications */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm text-gray-500">Today's Average</span>
                <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                  <Activity size={21} />
                </div>
              </div>
              <p className="text-3xl font-bold">{loading ? '...' : average}</p>
              <p className="mt-2 text-xs text-gray-400">
                mg/dl · {values.length} readings
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm text-gray-500">Highest Reading</span>
                <div className="rounded-xl bg-orange-100 p-3 text-orange-500">
                  <TrendingUp size={21} />
                </div>
              </div>
              <p className="text-3xl font-bold">{loading ? '...' : highest}</p>
              <p className="mt-2 text-xs text-gray-400">mg/dl · Today</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm text-gray-500">Lowest Reading</span>
                <div className="rounded-xl bg-green-100 p-3 text-green-600">
                  <TrendingDown size={21} />
                </div>
              </div>
              <p className="text-3xl font-bold">{loading ? '...' : lowest}</p>
              <p className="mt-2 text-xs text-gray-400">mg/dl · Today</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Readings</span>
                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                  <Droplets size={21} />
                </div>
              </div>
              <p className="text-3xl font-bold">{loading ? '...' : `${values.length}/4`}</p>
              <p className="mt-2 text-xs text-gray-400">Recorded today</p>
            </div>

            </section>

          {/* Add/Edit form */}
          {showForm && (
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">

              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {editingId ? 'Edit Glucose Reading' : 'Add Glucose Reading'}
                </h3>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveReading} className="grid gap-4 sm:grid-cols-3">

                <div>
                  <label className="mb-2 block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    required
                    max={today}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Time Slot</label>
                  <select
                    value={slot}
                    onChange={e => setSlot(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-purple-500"
                  >
                    {slots.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Glucose (mg/dl)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="600"
                    step="1"
                    required
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="Enter value"
                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-purple-500"
                  />
                </div>

                
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-60 sm:col-span-3"
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Reading'
                      : 'Save Reading'}
                </button>

              </form>
            </section>
          )}

          {/* Chart and daily progress */}
          <section className="grid gap-6 xl:grid-cols-3">

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Glucose Trends</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Your recent readings
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600">
                  Last 7 days
                </div>
              </div>

              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#eeeaf5"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#999', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#999', fontSize: 12 }}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Average glucose"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No readings available to display the chart.
                  </div>
                )}
              </div>

              
              <p className="mt-3 text-xs text-gray-400">
                Chart based on your recorded glucose readings.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold">Daily Progress</h3>
              <p className="mt-1 text-sm text-gray-400">
                Reading slots completed
              </p>

              <div className="my-7 flex items-center justify-center">
                <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-[12px] border-purple-100">
                  <span className="text-4xl font-bold text-purple-700">
                    {values.length}/4
                  </span>
                  <span className="mt-1 text-xs text-gray-400">Readings</span>
                </div>
              </div>

              {slots.map(s => {
                const completed = todayReadings.some(r => r.slot === s)

                return (
                  <div key={s} className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{s}</span>
                    <span className={completed
                      ? 'font-semibold text-green-600'
                      : 'text-gray-300'
                    }>
                      {completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                )
              })}
            </div>

          </section>

          {/* Recent readings table */}
          <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Recent Readings</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Your recorded glucose history
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CalendarDays size={17} /> All readings
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">

                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                    <th className="pb-4 font-medium">Date</th>
                    <th className="pb-4 font-medium">Time Slot</th>
                    <th className="pb-4 font-medium">Value</th>
                    <th className="pb-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400">
                        Loading your readings...
                      </td>
                    </tr>
                  ) : (
                    [...readings]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(r => (
                        <tr key={r.id} className="border-b border-gray-50 last:border-0">

                          <td className="py-4 text-gray-600">{r.date}</td>

                          <td className="py-4 text-gray-600">
                            <span className="flex items-center gap-2">
                              <Clock size={15} className="text-purple-500" />
                              {r.slot}
                            </span>
                          </td>

                          <td className="py-4 font-semibold">
                            {r.value} mg/dl
                          </td>

                          <td className="py-4 text-right">
                            <button
                              onClick={() => editReading(r)}
                              title="Edit reading"
                              className="mr-2 rounded-lg p-2 text-purple-500 hover:bg-purple-50"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => deleteReading(r.id)}
                              disabled={deletingId === r.id}
                              title="Delete reading"
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            >
                              {deletingId === r.id
                                ? '...'
                                : <Trash2 size={17} />}
                            </button>
                          </td>

                        </tr>
                      ))
                  )}

                  {!loading && readings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400">
                        No readings yet. Add your first reading!
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </section>

          <footer className="pb-4 text-center text-xs text-gray-400">
            Sweety Glucose Tracker · Take care of yourself 💜
          </footer>
            </>
          )}


          {/* MY READINGS PAGE */}
          {activePage === 'My Readings' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">My Readings</h1>
                  <p className="mt-2 text-sm text-gray-400">
                    View and manage your glucose history.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePage('Dashboard')
                    setShowForm(true)
                  }}
                  className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  + Add Reading
                </button>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold">All Glucose Readings</h2>
                {loading ? (
                  <p className="py-8 text-center text-gray-400">Loading readings...</p>
                ) : readings.length === 0 ? (
                  <p className="py-8 text-center text-gray-400">
                    No readings found. Add your first reading!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-left text-sm">
                      <thead>
                        <tr className="border-b text-gray-400">
                          <th className="pb-4">Date</th>
                          <th className="pb-4">Time Slot</th>
                          <th className="pb-4">Glucose Value</th>
                          <th className="pb-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...readings]
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map(r => (
                            <tr key={r.id} className="border-b border-gray-50">
                              <td className="py-4">{r.date}</td>
                              <td className="py-4">{r.slot}</td>
                              <td className="py-4 font-semibold">{r.value} mg/dl</td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => {
                                    editReading(r)
                                    setActivePage('Dashboard')
                                  }}
                                  className="mr-3 text-purple-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteReading(r.id)}
                                  className="text-red-500"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* REPORTS PAGE */}
          {activePage === 'Reports' && (
            <section className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Glucose Reports</h1>
                <p className="mt-2 text-sm text-gray-400">
                  Review your glucose readings over different periods.
                </p>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="text-sm font-medium">Report type</label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value as 'daily' | 'month' | 'previous')}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Month-to-date">Month-to-date</option>
                    <option value="Previous Month">Previous Month</option>
                  </select>

                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    max={getToday()}
                    onChange={e => setReportDate(e.target.value)}
                    className="rounded-lg border border-gray-200 p-3"
                  />
                </div>

                {(() => {
                  const selected = new Date(`${reportDate}T00:00:00`)
                  const start = new Date(selected)
                  const end = new Date(selected)

                  if (reportType === 'month') {
                    start.setDate(1)
                  } else if (reportType === 'previous') {
                    start.setDate(1)
                    start.setMonth(start.getMonth() - 1)
                    end.setDate(0)
                  }

                  const startDate = [
                    start.getFullYear(),
                    String(start.getMonth() + 1).padStart(2, '0'),
                    String(start.getDate()).padStart(2, '0')
                  ].join('-')

                  const endDate = [
                    end.getFullYear(),
                    String(end.getMonth() + 1).padStart(2, '0'),
                    String(end.getDate()).padStart(2, '0')
                  ].join('-')

                  const filtered = readings.filter(r =>
                    r.date >= startDate && r.date <= endDate
                  )

                  const numbers = filtered.map(r => r.value)
                  const avg = numbers.length
                    ? (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(1)
                    : '—'
                  const high = numbers.length ? Math.max(...numbers) : '—'
                  const low = numbers.length ? Math.min(...numbers) : '—'

                  return (
                    <div className="mt-8">
                      <p className="mb-5 text-sm text-gray-400">
                        Period: {startDate} to {endDate}
                      </p>

                      <div className="grid gap-4 sm:grid-cols-4">
                        {[
                          { label: 'Average', value: avg },
                          { label: 'Highest', value: high },
                          { label: 'Lowest', value: low },
                          { label: 'Total Readings', value: numbers.length }
                        ].map(item => (
                          <div key={item.label} className="rounded-xl bg-purple-50 p-5">
                            <p className="text-sm text-gray-500">{item.label}</p>
                            <p className="mt-2 text-2xl font-bold text-purple-700">
                              {item.value}
                            </p>
                            {item.label !== 'Total Readings' && (
                              <p className="text-xs text-gray-400">mg/dl</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <h2 className="mb-4 mt-8 text-lg font-bold">Reading Details</h2>

                      {filtered.length === 0 ? (
                        <p className="py-8 text-center text-gray-400">
                          No readings available for this period.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b text-gray-400">
                                <th className="pb-4">Date</th>
                                <th className="pb-4">Time Slot</th>
                                <th className="pb-4">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered
                                .sort((a, b) => b.date.localeCompare(a.date))
                                .map(r => (
                                  <tr key={r.id} className="border-b border-gray-50">
                                    <td className="py-4">{r.date}</td>
                                    <td className="py-4">{r.slot}</td>
                                    <td className="py-4 font-semibold">{r.value} mg/dl</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </section>
          )}
          
          {activePage === 'My Readings' && (
            <section className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="mb-2 text-sm font-medium text-purple-600">YOUR GLUCOSE HISTORY</p>
                  <h1 className="text-3xl font-bold">My Readings</h1>
                  <p className="mt-2 text-sm text-gray-400">View, edit and manage all your saved readings.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setDate(today)
                    setSlot(slots[0])
                    setValue('')
                    setError('')
                    setSuccess('')
                    setShowForm(true)
                    setActivePage('Dashboard')
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 hover:bg-purple-700"
                >
                  <Plus size={19} /> Add Reading
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">All-time readings</p>
                  <p className="mt-3 text-3xl font-bold">{loading ? '...' : readings.length}</p>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Today's readings</p>
                  <p className="mt-3 text-3xl font-bold">{loading ? '...' : todayReadings.length}/4</p>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Today's average</p>
                  <p className="mt-3 text-3xl font-bold">{loading ? '...' : average}</p>
                  <p className="mt-1 text-xs text-gray-400">mg/dl</p>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">All Glucose Readings</h3>
                    <p className="mt-1 text-sm text-gray-400">Your records, newest first</p>
                  </div>
                  <button onClick={fetchReadings} className="rounded-lg bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100">
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                        <th className="pb-4 font-medium">Date</th>
                        <th className="pb-4 font-medium">Time Slot</th>
                        <th className="pb-4 font-medium">Glucose</th>
                        <th className="pb-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="py-10 text-center text-gray-400">Loading your readings...</td></tr>
                      ) : readings.length === 0 ? (
                        <tr><td colSpan={4} className="py-10 text-center text-gray-400">No readings found. Add your first glucose reading!</td></tr>
                      ) : [...readings].sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                        <tr key={r.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-4 text-gray-600">{r.date}</td>
                          <td className="py-4 text-gray-600"><span className="flex items-center gap-2"><Clock size={15} className="text-purple-500" />{r.slot}</span></td>
                          <td className="py-4 font-semibold">{r.value} mg/dl</td>
                          <td className="py-4 text-right">
                            <button onClick={() => { editReading(r); setActivePage('Dashboard') }} title="Edit reading" className="mr-2 rounded-lg p-2 text-purple-500 hover:bg-purple-50"><Pencil size={17} /></button>
                            <button onClick={() => deleteReading(r.id)} disabled={deletingId === r.id} title="Delete reading" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">{deletingId === r.id ? '...' : <Trash2 size={17} />}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activePage === 'Reports' && (() => {
            const selected = new Date(`${reportDate}T00:00:00`)
            const firstDay = `${reportDate.slice(0, 7)}-01`
            const previousMonthDate = new Date(selected.getFullYear(), selected.getMonth() - 1, 1)
            const previousStart = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}-01`
            const previousEnd = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}-${String(new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth() + 1, 0).getDate()).padStart(2, '0')}`
            const rangeStart = reportType === 'daily' ? reportDate : reportType === 'month' ? firstDay : previousStart
            const rangeEnd = reportType === 'daily' ? reportDate : reportType === 'month' ? reportDate : previousEnd
            const reportReadings = readings.filter(r => r.date >= rangeStart && r.date <= rangeEnd).sort((a, b) => a.date.localeCompare(b.date))
            const reportValues = reportReadings.map(r => r.value)
            const reportAverage = reportValues.length ? (reportValues.reduce((sum, n) => sum + n, 0) / reportValues.length).toFixed(1) : '—'
            const reportHighest = reportValues.length ? Math.max(...reportValues) : '—'
            const reportLowest = reportValues.length ? Math.min(...reportValues) : '—'
            const reportTitle = reportType === 'daily' ? 'Daily Report' : reportType === 'month' ? 'Month-to-date Report' : 'Previous Month Report'

            return (
              <section className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-medium text-purple-600">YOUR GLUCOSE ANALYTICS</p>
                  <h1 className="text-3xl font-bold">Reports</h1>
                  <p className="mt-2 text-sm text-gray-400">Review your glucose readings over selected periods.</p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold">Choose report</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Report type</label>
                      <select value={reportType} onChange={e => setReportType(e.target.value as 'daily' | 'month' | 'previous')} className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-purple-500">
                        <option value="daily">Daily Report</option>
                        <option value="month">Month-to-date</option>
                        <option value="previous">Previous Month</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Select date</label>
                      <input type="date" max={today} value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-purple-500" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    {reportType === 'daily' ? `Showing ${rangeStart}` : `Showing ${rangeStart} to ${rangeEnd}`}
                  </p>
                </div>

                <div>
                  <h2 className="mb-4 text-xl font-bold">{reportTitle}</h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">Average</p><p className="mt-3 text-3xl font-bold">{reportAverage}</p><p className="mt-1 text-xs text-gray-400">mg/dl</p></div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">Highest</p><p className="mt-3 text-3xl font-bold">{reportHighest}</p><p className="mt-1 text-xs text-gray-400">mg/dl</p></div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">Lowest</p><p className="mt-3 text-3xl font-bold">{reportLowest}</p><p className="mt-1 text-xs text-gray-400">mg/dl</p></div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">Total readings</p><p className="mt-3 text-3xl font-bold">{reportReadings.length}</p><p className="mt-1 text-xs text-gray-400">Recorded in this period</p></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-1 text-lg font-bold">{reportType === 'daily' ? 'Daily Reading Details' : 'Readings in This Period'}</h3>
                  <p className="mb-6 text-sm text-gray-400">Values are taken directly from your saved records.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-left text-sm">
                      <thead><tr className="border-b border-gray-100 text-xs uppercase text-gray-400"><th className="pb-4 font-medium">Date</th><th className="pb-4 font-medium">Time Slot</th><th className="pb-4 font-medium">Glucose</th></tr></thead>
                      <tbody>
                        {reportReadings.length === 0 ? (
                          <tr><td colSpan={3} className="py-10 text-center text-gray-400">No readings found for this report period.</td></tr>
                        ) : reportReadings.map(r => (
                          <tr key={r.id} className="border-b border-gray-50 last:border-0"><td className="py-4 text-gray-600">{r.date}</td><td className="py-4 text-gray-600">{r.slot}</td><td className="py-4 font-semibold">{r.value} mg/dl</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )
          })()}

        </div>
      </main>
    </div>
  )
}

export default App






