import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const weeklyActivityRouter = Router()

// GET /api/parent/children/:childId/weekly-activity
// Returns daily learning activity data for the current week (Mon-Sun)
// Estimates time spent from completed frames (3 min per frame)
weeklyActivityRouter.get(
  '/children/:childId/weekly-activity',
  requireAuth,
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const { childId } = req.params

      // Verify the child is linked to this parent
      const relationship = await prisma.parentChild.findUnique({
        where: { parentId_childId: { parentId, childId } },
      })

      if (!relationship) {
        res
          .status(404)
          .json({ error: 'Murid tidak terhubung dengan akun Anda.' })
        return
      }

      // Get current week boundaries (Monday to Sunday)
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + mondayOffset)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      // Get previous week for comparison
      const prevWeekStart = new Date(weekStart)
      prevWeekStart.setDate(weekStart.getDate() - 7)
      const prevWeekEnd = new Date(weekStart)
      prevWeekEnd.setDate(weekStart.getDate() - 1)
      prevWeekEnd.setHours(23, 59, 59, 999)

      // Get child's name
      const child = await prisma.user.findUnique({
        where: { id: childId },
        select: { name: true },
      })

      // Fetch all progress records for this child in the current week
      const clientId = `user:${childId}`
      const weekRecords = await prisma.progressRecord.findMany({
        where: {
          clientId,
          completed: true,
          updatedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        select: {
          updatedAt: true,
          correct: true,
          total: true,
          moduleId: true,
        },
      })

      // Fetch previous week records for comparison
      const prevWeekRecords = await prisma.progressRecord.findMany({
        where: {
          clientId,
          completed: true,
          updatedAt: {
            gte: prevWeekStart,
            lte: prevWeekEnd,
          },
        },
        select: {
          updatedAt: true,
        },
      })

      // Group records by day of week (0 = Monday, 6 = Sunday)
      const dailyMinutes: number[] = [0, 0, 0, 0, 0, 0, 0]
      const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
      const dayDates: string[] = []

      // Calculate minutes per day (3 minutes per frame)
      const MINUTES_PER_FRAME = 3

      for (const record of weekRecords) {
        const recordDate = new Date(record.updatedAt)
        const dayIndex = (recordDate.getDay() + 6) % 7 // Convert to Mon=0, Sun=6
        dailyMinutes[dayIndex] += MINUTES_PER_FRAME
      }

      // Generate date labels for each day
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        dayDates.push(date.toISOString().split('T')[0])
      }

      // Calculate total minutes this week
      const totalMinutesThisWeek = dailyMinutes.reduce((a, b) => a + b, 0)
      const totalMinutesPrevWeek = prevWeekRecords.length * MINUTES_PER_FRAME

      // Calculate average daily minutes
      const activeDays = dailyMinutes.filter((m) => m > 0).length
      const avgDailyMinutes = activeDays > 0 
        ? Math.round(totalMinutesThisWeek / 7) 
        : 0

      // Find peak day
      const peakMinutes = Math.max(...dailyMinutes)
      const peakDayIndex = dailyMinutes.indexOf(peakMinutes)

      // Calculate week-over-week change
      const weekOverWeekChange = totalMinutesPrevWeek > 0
        ? Math.round(((totalMinutesThisWeek - totalMinutesPrevWeek) / totalMinutesPrevWeek) * 100)
        : totalMinutesThisWeek > 0 ? 100 : 0

      // Format week range
      const weekRangeStart = `${weekStart.getDate()} ${weekStart.toLocaleString('id-ID', { month: 'short' })}`
      const weekRangeEnd = `${weekEnd.getDate()} ${weekEnd.toLocaleString('id-ID', { month: 'short' })} ${weekEnd.getFullYear()}`

      // Build response
      const response = {
        childName: child?.name ?? 'Anak',
        weekRange: `${weekRangeStart} - ${weekRangeEnd}`,
        daily: dayLabels.map((label, i) => ({
          day: label,
          date: dayDates[i],
          minutes: dailyMinutes[i],
          isToday: dayDates[i] === now.toISOString().split('T')[0],
          isWeekend: i >= 5, // Saturday and Sunday
        })),
        kpi: {
          avgDailyMinutes,
          totalMinutes: totalMinutesThisWeek,
          totalHours: Math.floor(totalMinutesThisWeek / 60),
          totalMinutesRemaining: totalMinutesThisWeek % 60,
          peakMinutes,
          peakDay: dayLabels[peakDayIndex],
          peakDayIndex,
          activeDays,
          totalDays: 7,
          weekOverWeekChange,
          totalMinutesPrevWeek,
        },
      }

      res.json(response)
    } catch (err) {
      next(err)
    }
  }
)
