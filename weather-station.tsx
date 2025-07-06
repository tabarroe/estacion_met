"use client"

import { useState, useEffect, useRef } from "react"

interface WeatherData {
  interior: {
    temperature: number
    humidity: number
    tempTrend: "up" | "down" | "stable"
  }
  exterior: {
    temperature: number
    humidity: number
    pressure: number
    feelsLike: number
    isOnline: boolean
    tempTrend: "up" | "down" | "stable"
  }
  temperatureHistory: number[]
  batteryLevel: number
  hourlyStats: Array<{
    hour: number
    min: number
    max: number
    avg: number
  }>
}

interface SystemInfo {
  cpuTemp: number
  cpuUsage: number
  ramUsage: number
  uptime: string
  wifiSignal: number
}

export default function WeatherStation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [blink, setBlink] = useState(true)
  const [isNightMode, setIsNightMode] = useState(false)
  const [currentPage, setCurrentPage] = useState<"main" | "history">("main")
  const [tempAlarm, setTempAlarm] = useState(false)
  const [prevExteriorTemp, setPrevExteriorTemp] = useState(18.7)

  const [weatherData, setWeatherData] = useState<WeatherData>({
    interior: {
      temperature: 23.2,
      humidity: 58,
      tempTrend: "stable",
    },
    exterior: {
      temperature: 18.7,
      humidity: 72,
      pressure: 1013,
      feelsLike: 16.3,
      isOnline: true,
      tempTrend: "up",
    },
    temperatureHistory: [
      15.2, 14.8, 14.5, 14.1, 13.9, 13.7, 14.2, 15.8, 17.3, 19.1, 20.8, 22.1, 23.4, 24.2, 23.8, 23.1, 22.5, 21.3, 20.1,
      19.4, 18.9, 18.5, 18.2, 18.7,
    ],
    batteryLevel: 87,
    hourlyStats: [],
  })

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpuTemp: 45.2,
    cpuUsage: 23,
    ramUsage: 67,
    uptime: "2d 14h 32m",
    wifiSignal: 85,
  })

  // Generar estadísticas por hora
  const generateHourlyStats = () => {
    const stats = []
    for (let i = 0; i < 24; i++) {
      const baseTemp = 15 + Math.sin(((i - 6) * Math.PI) / 12) * 8 + Math.random() * 3
      stats.push({
        hour: i,
        min: baseTemp - Math.random() * 2,
        max: baseTemp + Math.random() * 3,
        avg: baseTemp,
      })
    }
    return stats
  }

  useEffect(() => {
    setWeatherData((prev) => ({
      ...prev,
      hourlyStats: generateHourlyStats(),
    }))
  }, [])

  const updateTime = () => {
    const now = new Date()
    const timeString = now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
    const dateString = now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    setCurrentTime(timeString)
    setCurrentDate(dateString)

    const hour = now.getHours()
    setIsNightMode(hour >= 20 || hour < 7)
  }

  const getColorScheme = () => {
    if (isNightMode) {
      return {
        primary: "#06b6d4",
        secondary: "#f59e0b",
        accent: "#8b5cf6",
        success: "#10b981",
        warning: "#f97316",
        danger: "#ef4444",
        text: "#f1f5f9",
        textSecondary: "#cbd5e1",
        background: "from-slate-900 via-slate-800 to-slate-900",
        cardBg: "rgba(15, 23, 42, 0.8)",
      }
    } else {
      return {
        primary: "#0891b2",
        secondary: "#d97706",
        accent: "#7c3aed",
        success: "#059669",
        warning: "#ea580c",
        danger: "#dc2626",
        text: "#e2e8f0",
        textSecondary: "#94a3b8",
        background: "from-slate-800 via-slate-700 to-slate-800",
        cardBg: "rgba(30, 41, 59, 0.8)",
      }
    }
  }

  const colors = getColorScheme()

  // Simular cambio de página (en hardware sería con botón mecánico)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " ") {
        // Spacebar para simular botón mecánico
        setCurrentPage((prev) => (prev === "main" ? "history" : "main"))
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const getPressureClass = (pressure: number) => {
    if (pressure > 1020) return `bg-emerald-400 shadow-emerald-400/50`
    if (pressure < 1000) return `bg-red-400 shadow-red-400/50`
    return `bg-amber-400 shadow-amber-400/50`
  }

  const getPressureText = (pressure: number) => {
    if (pressure > 1020) return "ALTA"
    if (pressure < 1000) return "BAJA"
    return "NORMAL"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "↗"
      case "down":
        return "↘"
      default:
        return "→"
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-orange-400"
      case "down":
        return "text-cyan-400"
      default:
        return "text-slate-400"
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-emerald-400"
    if (level > 20) return "text-amber-400"
    return "text-red-400"
  }

  const getSystemColor = (value: number, type: "cpu" | "ram" | "temp" | "wifi") => {
    switch (type) {
      case "cpu":
      case "ram":
        if (value > 80) return "text-red-400"
        if (value > 60) return "text-amber-400"
        return "text-emerald-400"
      case "temp":
        if (value > 70) return "text-red-400"
        if (value > 60) return "text-amber-400"
        return "text-emerald-400"
      case "wifi":
        if (value > 70) return "text-emerald-400"
        if (value > 40) return "text-amber-400"
        return "text-red-400"
      default:
        return "text-slate-400"
    }
  }

  const drawTemperatureChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width - 40
    const height = canvas.height
    const offsetX = 35

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const temps = weatherData.temperatureHistory
    const minTemp = Math.min(...temps)
    const maxTemp = Math.max(...temps)
    const tempRange = maxTemp - minTemp || 1

    // Grid lines
    ctx.strokeStyle = isNightMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.15)"
    ctx.lineWidth = 0.5
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(offsetX, y)
      ctx.lineTo(offsetX + width, y)
      ctx.stroke()
    }

    // Temperature line
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 2.5
    ctx.shadowColor = colors.primary
    ctx.shadowBlur = 4

    ctx.beginPath()
    for (let i = 0; i < temps.length; i++) {
      const x = offsetX + (i / (temps.length - 1)) * width
      const y = height - ((temps[i] - minTemp) / tempRange) * (height - 10) - 5
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // Area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${colors.primary}60`)
    gradient.addColorStop(1, `${colors.primary}10`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(offsetX, height)
    for (let i = 0; i < temps.length; i++) {
      const x = offsetX + (i / (temps.length - 1)) * width
      const y = height - ((temps[i] - minTemp) / tempRange) * (height - 10) - 5
      ctx.lineTo(x, y)
    }
    ctx.lineTo(offsetX + width, height)
    ctx.closePath()
    ctx.fill()

    // Data points
    ctx.shadowColor = colors.primary
    ctx.shadowBlur = 3
    ctx.fillStyle = colors.primary
    for (let i = 0; i < temps.length; i += 4) {
      const x = offsetX + (i / (temps.length - 1)) * width
      const y = height - ((temps[i] - minTemp) / tempRange) * (height - 10) - 5
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI)
      ctx.fill()
    }
    ctx.shadowBlur = 0

    // Current temperature marker
    const currentX = offsetX + ((temps.length - 1) / (temps.length - 1)) * width
    const currentY = height - ((temps[temps.length - 1] - minTemp) / tempRange) * (height - 10) - 5

    ctx.fillStyle = colors.secondary
    ctx.shadowColor = colors.secondary
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(currentX, currentY, 3, 0, 2 * Math.PI)
    ctx.fill()
    ctx.shadowBlur = 0

    // Labels
    ctx.font = "9px monospace"
    ctx.textAlign = "right"

    ctx.fillStyle = colors.warning
    const maxY = height - ((maxTemp - minTemp) / tempRange) * (height - 10) - 5
    ctx.fillText(`${maxTemp.toFixed(1)}°`, 30, maxY + 3)

    ctx.fillStyle = colors.primary
    const minY = height - ((minTemp - minTemp) / tempRange) * (height - 10) - 5
    ctx.fillText(`${minTemp.toFixed(1)}°`, 30, minY + 3)

    const currentTemp = temps[temps.length - 1]
    ctx.fillStyle = colors.secondary
    ctx.font = "8px monospace"
    ctx.textAlign = "left"
    ctx.fillText(`${currentTemp.toFixed(1)}°`, currentX + 6, currentY - 2)

    // Position indicators
    ctx.fillStyle = colors.warning
    ctx.beginPath()
    ctx.arc(5, maxY, 2, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.arc(5, minY, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  const drawHistoryChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height - 20
    const barWidth = width / 24
    const stats = weatherData.hourlyStats

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (stats.length === 0) return

    const allTemps = stats.flatMap((s) => [s.min, s.max])
    const minTemp = Math.min(...allTemps)
    const maxTemp = Math.max(...allTemps)
    const tempRange = maxTemp - minTemp || 1

    // Draw bars
    stats.forEach((stat, i) => {
      const x = i * barWidth
      const minHeight = ((stat.min - minTemp) / tempRange) * height
      const maxHeight = ((stat.max - minTemp) / tempRange) * height
      const avgHeight = ((stat.avg - minTemp) / tempRange) * height

      // Min-Max bar (background)
      ctx.fillStyle = `${colors.primary}40`
      ctx.fillRect(x + 2, height - maxHeight, barWidth - 4, maxHeight - minHeight)

      // Average line
      ctx.fillStyle = colors.secondary
      ctx.fillRect(x + 2, height - avgHeight - 1, barWidth - 4, 2)

      // Current hour highlight
      const currentHour = new Date().getHours()
      if (i === currentHour) {
        ctx.strokeStyle = colors.warning
        ctx.lineWidth = 2
        ctx.strokeRect(x + 1, height - maxHeight - 2, barWidth - 2, maxHeight - minHeight + 4)
      }
    })

    // Hour labels
    ctx.fillStyle = colors.textSecondary
    ctx.font = "8px monospace"
    ctx.textAlign = "center"
    for (let i = 0; i < 24; i += 4) {
      const x = i * barWidth + barWidth / 2
      ctx.fillText(`${i}h`, x, height + 15)
    }
  }

  const calculateTrend = (current: number, previous: number): "up" | "down" | "stable" => {
    const diff = current - previous
    if (Math.abs(diff) < 0.1) return "stable"
    return diff > 0 ? "up" : "down"
  }

  const simulateDataChanges = () => {
    setWeatherData((prev) => {
      const newData = { ...prev }
      const prevInteriorTemp = newData.interior.temperature
      const prevExteriorTemp = newData.exterior.temperature

      // Check for temperature alarm
      if (Math.abs(newData.exterior.temperature - prevExteriorTemp) > 0.5) {
        setTempAlarm(true)
        setTimeout(() => setTempAlarm(false), 3000)
      }

      setPrevExteriorTemp(newData.exterior.temperature)

      // Battery simulation
      if (Math.random() < 0.1) {
        newData.batteryLevel = Math.max(0, newData.batteryLevel - 1)
      }

      if (Math.random() < 0.05) {
        newData.exterior.isOnline = !newData.exterior.isOnline
      }

      if (newData.exterior.isOnline) {
        newData.exterior.temperature += (Math.random() - 0.5) * 0.3
        newData.exterior.humidity += Math.floor((Math.random() - 0.5) * 3)
        newData.exterior.pressure += Math.floor((Math.random() - 0.5) * 2)
        newData.exterior.feelsLike = newData.exterior.temperature + (Math.random() - 0.5) * 3

        newData.exterior.temperature = Math.max(-10, Math.min(40, newData.exterior.temperature))
        newData.exterior.humidity = Math.max(20, Math.min(95, newData.exterior.humidity))
        newData.exterior.pressure = Math.max(980, Math.min(1040, newData.exterior.pressure))

        newData.exterior.temperature = Math.round(newData.exterior.temperature * 10) / 10
        newData.exterior.feelsLike = Math.round(newData.exterior.feelsLike * 10) / 10
        newData.exterior.tempTrend = calculateTrend(newData.exterior.temperature, prevExteriorTemp)
      }

      newData.interior.temperature += (Math.random() - 0.5) * 0.2
      newData.interior.humidity += Math.floor((Math.random() - 0.5) * 2)

      newData.interior.temperature = Math.max(15, Math.min(35, newData.interior.temperature))
      newData.interior.humidity = Math.max(30, Math.min(80, newData.interior.humidity))
      newData.interior.temperature = Math.round(newData.interior.temperature * 10) / 10
      newData.interior.tempTrend = calculateTrend(newData.interior.temperature, prevInteriorTemp)

      return newData
    })

    // Update system info
    setSystemInfo((prev) => ({
      ...prev,
      cpuTemp: Math.max(35, Math.min(80, prev.cpuTemp + (Math.random() - 0.5) * 2)),
      cpuUsage: Math.max(5, Math.min(95, prev.cpuUsage + Math.floor((Math.random() - 0.5) * 10))),
      ramUsage: Math.max(30, Math.min(90, prev.ramUsage + Math.floor((Math.random() - 0.5) * 5))),
      wifiSignal: Math.max(20, Math.min(100, prev.wifiSignal + Math.floor((Math.random() - 0.5) * 10))),
    }))
  }

  const updateTemperatureHistory = () => {
    setWeatherData((prev) => {
      const newHistory = [...prev.temperatureHistory]
      newHistory.shift()
      const lastTemp = newHistory[newHistory.length - 1]
      const newTemp = lastTemp + (Math.random() - 0.5) * 2
      newHistory.push(Math.max(-10, Math.min(40, newTemp)))

      return {
        ...prev,
        temperatureHistory: newHistory,
      }
    })
  }

  useEffect(() => {
    updateTime()
    drawTemperatureChart()

    const timeInterval = setInterval(updateTime, 1000)
    const blinkInterval = setInterval(() => setBlink((prev) => !prev), 1000)
    const dataInterval = setInterval(simulateDataChanges, 5000)
    const chartInterval = setInterval(updateTemperatureHistory, 30000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(blinkInterval)
      clearInterval(dataInterval)
      clearInterval(chartInterval)
    }
  }, [])

  useEffect(() => {
    if (currentPage === "main") {
      drawTemperatureChart()
    } else {
      drawHistoryChart()
    }
  }, [weatherData.temperatureHistory, weatherData.hourlyStats, isNightMode, currentPage])

  const overallTrend = () => {
    const temps = weatherData.temperatureHistory
    const recent = temps.slice(-6)
    const older = temps.slice(-12, -6)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    const diff = recentAvg - olderAvg
    if (Math.abs(diff) < 0.3) return "stable"
    return diff > 0 ? "up" : "down"
  }

  const getHistoryStats = () => {
    const stats = weatherData.hourlyStats
    if (stats.length === 0) return { dayMin: 0, dayMax: 0, dayAvg: 0, variation: 0 }

    const dayMin = Math.min(...stats.map((s) => s.min))
    const dayMax = Math.max(...stats.map((s) => s.max))
    const dayAvg = stats.reduce((sum, s) => sum + s.avg, 0) / stats.length
    const variation = dayMax - dayMin

    return { dayMin, dayMax, dayAvg, variation }
  }

  if (currentPage === "history") {
    const histStats = getHistoryStats()

    return (
      <div
        className={`w-80 h-60 bg-gradient-to-br ${colors.background} text-slate-200 overflow-hidden fixed top-0 left-0 font-mono shadow-2xl border border-slate-600 transition-all duration-1000`}
      >
        <div className="grid grid-cols-[160px_160px] grid-rows-[30px_130px_100px] w-80 h-60 gap-0">
          {/* Header */}
          <div className="col-span-2 bg-black/70 flex justify-between items-center px-2 text-sm font-bold border-b border-slate-600 backdrop-blur-sm">
            <div className="text-violet-400 text-sm font-mono tracking-wider">📊 HISTORIAL 24H</div>
            <div className="text-xs opacity-70 text-slate-300">Página 2/2</div>
          </div>

          {/* Statistics Left */}
          <div className="bg-slate-800/20 border border-slate-500/30 p-2 m-px rounded-sm backdrop-blur-sm">
            <div className="text-xs font-bold mb-2 uppercase opacity-80 text-center text-slate-300">
              📈 ESTADÍSTICAS
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Máxima:</span>
                <span className="text-red-400 font-bold">{histStats.dayMax.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mínima:</span>
                <span className="text-cyan-400 font-bold">{histStats.dayMin.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Promedio:</span>
                <span className="text-amber-400 font-bold">{histStats.dayAvg.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Variación:</span>
                <span className="text-violet-400 font-bold">{histStats.variation.toFixed(1)}°</span>
              </div>
              <div className="mt-2 pt-1 border-t border-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tendencia:</span>
                  <span className={`font-bold ${getTrendColor(overallTrend())}`}>
                    {getTrendIcon(overallTrend())} {overallTrend().toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Right */}
          <div className="bg-slate-800/20 border border-slate-500/30 p-2 m-px rounded-sm backdrop-blur-sm">
            <div className="text-xs font-bold mb-2 uppercase opacity-80 text-center text-slate-300">🖥️ SISTEMA</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">CPU:</span>
                <span className={`font-bold ${getSystemColor(systemInfo.cpuUsage, "cpu")}`}>
                  {systemInfo.cpuUsage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RAM:</span>
                <span className={`font-bold ${getSystemColor(systemInfo.ramUsage, "ram")}`}>
                  {systemInfo.ramUsage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temp CPU:</span>
                <span className={`font-bold ${getSystemColor(systemInfo.cpuTemp, "temp")}`}>
                  {systemInfo.cpuTemp.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WiFi:</span>
                <span className={`font-bold ${getSystemColor(systemInfo.wifiSignal, "wifi")}`}>
                  {systemInfo.wifiSignal}%
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Uptime:</span>
                  <span className="text-emerald-400 font-bold text-xs">{systemInfo.uptime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="col-span-2 bg-slate-800/20 border border-slate-500/30 p-1.5 m-px rounded-sm backdrop-blur-sm">
            <div className="text-xs text-center mb-1 opacity-70 text-slate-300 flex justify-between items-center">
              <span>📊 TEMP POR HORA</span>
              <div className="flex gap-2 text-xs">
                <span className="text-cyan-400">▬ Rango</span>
                <span className="text-amber-400">▬ Prom</span>
                <span className="text-orange-400">□ Act</span>
              </div>
            </div>
            <div className="h-16 relative bg-black/20 rounded border border-slate-700/50">
              <canvas ref={canvasRef} width={308} height={65} className="rounded-sm" />
            </div>
            <div className="text-xs text-center mt-1 opacity-60 text-slate-400">
              Presiona ESPACIO para cambiar de página
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main page
  return (
    <div
      className={`w-80 h-60 bg-gradient-to-br ${colors.background} text-slate-200 overflow-hidden fixed top-0 left-0 font-mono shadow-2xl border border-slate-600 transition-all duration-1000`}
    >
      <div className="grid grid-cols-[110px_100px_110px] grid-rows-[30px_100px_110px] w-80 h-60 gap-0">
        {/* Header */}
        <div className="col-span-3 bg-black/70 flex justify-between items-center px-2 text-sm font-bold border-b border-slate-600 backdrop-blur-sm">
          <div
            className="text-base font-mono tracking-wider drop-shadow-lg transition-colors duration-1000"
            style={{ color: colors.primary, textShadow: `0 0 8px ${colors.primary}` }}
          >
            {currentTime}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs opacity-70 text-slate-300 font-light">{currentDate}</div>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${getBatteryColor(weatherData.batteryLevel)}`}>🔋</span>
              <span className={`text-xs ${getBatteryColor(weatherData.batteryLevel)}`}>
                {weatherData.batteryLevel}%
              </span>
            </div>
          </div>
        </div>

        {/* Interior */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 p-1.5 m-px relative rounded-sm backdrop-blur-sm transition-all duration-300 hover:bg-cyan-500/20">
          <div className="text-xs font-bold mb-1 uppercase opacity-80 text-center text-cyan-300">🏠 INTERIOR</div>
          <div
            className="text-lg text-center my-1 font-mono tracking-wide transition-all duration-500"
            style={{ color: colors.primary, textShadow: `0 0 6px ${colors.primary}` }}
          >
            {weatherData.interior.temperature}°
            <span className={`text-xs ml-1 ${getTrendColor(weatherData.interior.tempTrend)}`}>
              {getTrendIcon(weatherData.interior.tempTrend)}
            </span>
          </div>
          <div className="mb-0.5 text-xs flex justify-between items-center text-slate-300">
            <span>Humedad:</span>
            <span className="font-bold text-xs text-white">{weatherData.interior.humidity}%</span>
          </div>
          <div
            className="absolute top-0.5 right-0.5 h-1 rounded-full animate-pulse w-[13px]"
            style={{ backgroundColor: colors.success, boxShadow: `0 0 4px ${colors.success}` }}
          ></div>
        </div>

        {/* Pressure */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-1.5 m-px flex flex-col justify-center items-center rounded-sm backdrop-blur-sm transition-all duration-300 hover:bg-amber-500/20">
          <div className="text-xs font-bold mb-1 uppercase opacity-80 text-center text-amber-300">PRESIÓN</div>
          <div
            className="text-sm font-bold text-center font-mono transition-all duration-500"
            style={{ color: colors.secondary, textShadow: `0 0 6px ${colors.secondary}` }}
          >
            {weatherData.exterior.pressure}
          </div>
          <div className="text-xs opacity-70 text-slate-300 flex items-center">
            hPa{" "}
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ml-0.5 shadow-lg ${getPressureClass(weatherData.exterior.pressure)}`}
            ></span>
          </div>
          <div className="text-xs opacity-80 text-center mt-0.5 text-slate-300">
            ST: <span style={{ color: colors.secondary }}>{weatherData.exterior.feelsLike}°</span>
          </div>
          <div className="text-xs text-center mt-1 font-bold text-amber-400">
            {getPressureText(weatherData.exterior.pressure)}
          </div>
        </div>

        {/* Exterior */}
        <div className="bg-violet-500/10 border border-violet-500/30 p-1.5 m-px relative rounded-sm backdrop-blur-sm transition-all duration-300 hover:bg-violet-500/20">
          <div className="text-xs font-bold mb-1 uppercase opacity-80 text-center text-violet-300">🌤️ EXTERIOR</div>
          <div
            className={`text-lg text-center my-1 font-mono tracking-wide transition-all duration-500 ${
              tempAlarm ? "animate-pulse text-red-400" : ""
            }`}
            style={{
              color: tempAlarm ? "#f87171" : colors.primary,
              textShadow: tempAlarm ? "0 0 10px #f87171" : `0 0 6px ${colors.primary}`,
              transform: tempAlarm ? "scale(1.1)" : "scale(1)",
            }}
          >
            {weatherData.exterior.temperature}°
            <span className={`text-xs ml-1 ${getTrendColor(weatherData.exterior.tempTrend)}`}>
              {getTrendIcon(weatherData.exterior.tempTrend)}
            </span>
          </div>
          <div className="mb-0.5 text-xs flex justify-between items-center text-slate-300">
            <span>Humedad:</span>
            <span className="font-bold text-xs text-white">{weatherData.exterior.humidity}%</span>
          </div>
          <div className="mb-0.5 text-xs flex justify-between items-center text-slate-300">
            <span>ESP32:</span>
            <span
              className={`font-bold text-xs ${weatherData.exterior.isOnline ? "text-emerald-400" : "text-red-400"}`}
            >
              {weatherData.exterior.isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="col-span-3 bg-slate-800/20 border border-slate-500/30 p-1.5 m-px rounded-sm backdrop-blur-sm">
          <div className="text-xs text-center mb-0.5 opacity-70 text-slate-300 flex justify-between items-center">
            <span>📊 TEMP EXT (24H)</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <span className={`${getTrendColor(overallTrend())} font-bold`}>{getTrendIcon(overallTrend())}</span>
                <span className="text-slate-400">Tendencia</span>
              </div>
              {isNightMode && <span className="text-xs text-violet-400">🌙</span>}
            </div>
          </div>
          <div className="h-16 relative mt-0.5 bg-black/20 rounded border border-slate-700/50">
            <canvas ref={canvasRef} width={308} height={65} className="rounded-sm" />
          </div>
          <div className="flex justify-between text-xs mt-0.5 opacity-60 text-slate-400 font-mono">
            <span>00h</span>
            <span>06h</span>
            <span>12h</span>
            <span>18h</span>
            <span>24h</span>
            <span className="text-violet-400">ESPACIO→</span>
          </div>
        </div>
      </div>
    </div>
  )
}
