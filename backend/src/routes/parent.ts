import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { hashPassword } from '../lib/auth.js'

export const parentRouter = Router()

// All parent routes require authentication (but not necessarily PARENT role)
parentRouter.use(requireAuth)

// ---------- Parent-Child Relationships ----------

// GET /api/parent/children - List all children linked to this parent
parentRouter.get('/children', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId

    const relationships = await prisma.parentChild.findMany({
      where: { parentId },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            semester: true,
            birthDate: true,
            gender: true,
          },
        },
      },
    })

    const children = relationships.map((rel) => rel.child)
    res.json(children)
  } catch (err) {
    next(err)
  }
})

// POST /api/parent/children - Create a new child (student) account and link to this parent
const addChildSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  grade: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(2),
  birthDate: z.string().optional(),
  gender: z.enum(['Laki-laki', 'Perempuan']).optional(),
})

parentRouter.post(
  '/children',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const parsed = addChildSchema.safeParse(req.body)

      if (!parsed.success) {
        res
          .status(400)
          .json({
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
          })
        return
      }

      const { name, email, password, grade, semester, birthDate, gender } =
        parsed.data

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        res.status(409).json({ error: 'Email sudah terdaftar.' })
        return
      }

      // Create the child (student) account
      const passwordHash = await hashPassword(password)
      const child = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'STUDENT',
          grade,
          semester,
          birthDate: birthDate ? new Date(birthDate) : null,
          gender: gender ?? null,
        },
      })

      // Every new account starts on a 14-day free trial with full access
      const trialPlan = await prisma.plan.findUnique({
        where: { id: 'free_trial' },
      })
      if (trialPlan) {
        const trialDays = trialPlan.trialDays ?? 14
        await prisma.subscription.create({
          data: {
            userId: child.id,
            planId: trialPlan.id,
            status: 'TRIALING',
            currentPeriodEnd: new Date(
              Date.now() + trialDays * 24 * 60 * 60 * 1000,
            ),
          },
        })
      }

      // Create the parent-child link
      await prisma.parentChild.create({
        data: { parentId, childId: child.id },
      })

      // 1. child_account_created notification
      await prisma.notification.create({
        data: {
          userId: parentId,
          type: 'child_account_created',
          title: '🎉 Akun Anak Berhasil Dibuat',
          message: `Akun belajar untuk ${name} telah berhasil dibuat dan siap digunakan.`,
        },
      })

      res.status(201).json({
        id: child.id,
        name: child.name,
        email: child.email,
        grade: child.grade,
        semester: child.semester,
        birthDate: child.birthDate,
        gender: child.gender,
      })
    } catch (err) {
      next(err)
    }
  },
)

// DELETE /api/parent/children/:childId - Unlink a child
parentRouter.delete(
  '/children/:childId',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const { childId } = req.params

      const relationship = await prisma.parentChild.findUnique({
        where: { parentId_childId: { parentId, childId } },
      })

      if (!relationship) {
        res.status(404).json({ error: 'Hubungan tidak ditemukan.' })
        return
      }

      await prisma.parentChild.delete({
        where: { parentId_childId: { parentId, childId } },
      })

      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
)

// ---------- Child Progress ----------

// GET /api/parent/children/:childId/progress - Get progress for a specific child
parentRouter.get(
  '/children/:childId/progress',
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

      // Get progress records for this child
      const clientId = `user:${childId}`
      const progressRecords = await prisma.progressRecord.findMany({
        where: { clientId },
        orderBy: { updatedAt: 'desc' },
      })

      // Group by module
      const moduleProgress: Record<
        string,
        { completed: number; total: number; correct: number }
      > = {}

      for (const record of progressRecords) {
        if (!moduleProgress[record.moduleId]) {
          moduleProgress[record.moduleId] = {
            completed: 0,
            total: 0,
            correct: 0,
          }
        }

        if (record.completed) {
          moduleProgress[record.moduleId].completed++
        }
        moduleProgress[record.moduleId].total++
        moduleProgress[record.moduleId].correct += record.correct
      }

      // Get module details
      const moduleIds = Object.keys(moduleProgress)
      const modules = await prisma.module.findMany({
        where: { id: { in: moduleIds } },
        select: { id: true, title: true, subjectId: true },
      })

      const moduleMap = Object.fromEntries(modules.map((m) => [m.id, m]))

      // Build response
      const progress = moduleIds.map((moduleId) => ({
        moduleId,
        title: moduleMap[moduleId]?.title ?? moduleId,
        subjectId: moduleMap[moduleId]?.subjectId,
        ...moduleProgress[moduleId],
        accuracy:
          moduleProgress[moduleId].total > 0
            ? Math.round(
                (moduleProgress[moduleId].correct /
                  moduleProgress[moduleId].total) *
                  100,
              )
            : 0,
      }))

      res.json(progress)
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/parent/children/:childId/progress/:moduleId - Get frame-level progress for a specific module
parentRouter.get(
  '/children/:childId/progress/:moduleId',
  async (req, res, next) => {
    try {
      const authUserId = req.auth!.userId
      const authRole = req.auth!.role
      const { childId, moduleId } = req.params

      // If parent, verify the child is linked
      if (authRole === 'PARENT') {
        const relationship = await prisma.parentChild.findUnique({
          where: { parentId_childId: { parentId: authUserId, childId } },
        })
        if (!relationship) {
          res
            .status(404)
            .json({ error: 'Murid tidak terhubung dengan akun Anda.' })
          return
        }
      }

      // If student, can only view own progress
      if (authRole === 'STUDENT' && authUserId !== childId) {
        res
          .status(403)
          .json({ error: 'Anda hanya bisa melihat progres sendiri.' })
        return
      }

      const clientId = `user:${childId}`
      const records = await prisma.progressRecord.findMany({
        where: { clientId, moduleId },
      })

      const frameProgress = records.map((r) => ({
        frameSlug: r.frameSlug,
        completed: r.completed,
        correct: r.correct,
        total: r.total,
        accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
      }))

      res.json(frameProgress)
    } catch (err) {
      next(err)
    }
  },
)

// ---------- Reading Progress ----------

// GET /api/parent/children/:childId/reading - Get reading progress for a child
parentRouter.get(
  '/children/:childId/reading',
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

      const readingProgress = await prisma.readingProgress.findMany({
        where: { childId },
        orderBy: { lastReadAt: 'desc' },
      })

      res.json(readingProgress)
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/parent/children/:childId/reading - Create/update reading progress
const readingProgressSchema = z.object({
  materialId: z.string().min(1),
  materialType: z.enum(['module', 'book', 'article']),
  title: z.string().min(1),
  totalPages: z.number().int().min(0).optional(),
  currentPage: z.number().int().min(0).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
})

parentRouter.post(
  '/children/:childId/reading',
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

      const parsed = readingProgressSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(400)
          .json({
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
          })
        return
      }

      const {
        materialId,
        materialType,
        title,
        totalPages,
        currentPage,
        status,
      } = parsed.data

      // Upsert reading progress
      const readingProgress = await prisma.readingProgress.upsert({
        where: {
          childId_materialId: { childId, materialId },
        },
        create: {
          childId,
          materialId,
          materialType,
          title,
          totalPages: totalPages ?? 0,
          currentPage: currentPage ?? 0,
          status: status ?? 'in_progress',
          lastReadAt: new Date(),
        },
        update: {
          totalPages: totalPages ?? undefined,
          currentPage: currentPage ?? undefined,
          status: status ?? undefined,
          lastReadAt: new Date(),
        },
      })

      res.json(readingProgress)
    } catch (err) {
      next(err)
    }
  },
)

// ---------- Parent Assignments ----------

// GET /api/parent/assignments - List all assignments created by this parent
parentRouter.get(
  '/assignments',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId

      const assignments = await prisma.parentAssignment.findMany({
        where: { parentId },
        include: {
          child: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      res.json(assignments)
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/parent/assignments - Create a new assignment
const createAssignmentSchema = z.object({
  childId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  materialId: z.string().optional(),
  selectedFrames: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
})

parentRouter.post(
  '/assignments',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const parsed = createAssignmentSchema.safeParse(req.body)

      if (!parsed.success) {
        res
          .status(400)
          .json({
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
          })
        return
      }

      const {
        childId,
        title,
        description,
        materialId,
        selectedFrames,
        dueDate,
      } = parsed.data

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

      const assignment = await prisma.parentAssignment.create({
        data: {
          parentId,
          childId,
          title,
          description,
          materialId,
          selectedFrames: selectedFrames ?? undefined,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          child: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      // Create notification for child about new assignment
      const parent = await prisma.user.findUnique({
        where: { id: parentId },
        select: { name: true },
      })
      await prisma.notification.create({
        data: {
          userId: childId,
          type: 'new_assignment',
          title: `${parent?.name ?? 'Orang Tua'} memberikan tugas baru`,
          message: `Anda mendapat tugas: ${title}`,
          assignmentId: assignment.id,
        },
      })

      // 2. assignment_created notification for parent
      await prisma.notification.create({
        data: {
          userId: parentId,
          type: 'assignment_created',
          title: '📚 Tugas Baru Diberikan',
          message: `Modul "${title}" telah diberikan kepada ${getChildNameForNotif(childId)}.`,
          assignmentId: assignment.id,
        },
      })

      // 8. deadline_approaching notification if dueDate is within 24h
      if (dueDate) {
        const due = new Date(dueDate)
        const now = new Date()
        const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (hoursLeft > 0 && hoursLeft <= 24) {
          await prisma.notification.create({
            data: {
              userId: parentId,
              type: 'deadline_approaching',
              title: '⏰ Deadline Mendekat',
              message: `Tugas "${title}" akan berakhir dalam ${Math.round(hoursLeft)} jam.`,
              assignmentId: assignment.id,
            },
          })
        }
      }

      res.status(201).json(assignment)
    } catch (err) {
      next(err)
    }
  },
)

// Helper to get child name for notifications
async function getChildNameForNotif(childId: string): Promise<string> {
  const child = await prisma.user.findUnique({
    where: { id: childId },
    select: { name: true },
  })
  return child?.name ?? 'anak'
}

// PUT /api/parent/assignments/:id - Update an assignment
const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  materialId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
  notes: z.string().optional(),
})

parentRouter.put(
  '/assignments/:id',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const { id } = req.params
      const parsed = updateAssignmentSchema.safeParse(req.body)

      if (!parsed.success) {
        res
          .status(400)
          .json({
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
          })
        return
      }

      // Verify the assignment belongs to this parent
      const existing = await prisma.parentAssignment.findUnique({
        where: { id },
      })

      if (!existing || existing.parentId !== parentId) {
        res.status(404).json({ error: 'Tugas tidak ditemukan.' })
        return
      }

      const updateData: Record<string, unknown> = {}
      if (parsed.data.title !== undefined) updateData.title = parsed.data.title
      if (parsed.data.description !== undefined)
        updateData.description = parsed.data.description
      if (parsed.data.materialId !== undefined)
        updateData.materialId = parsed.data.materialId
      if (parsed.data.dueDate !== undefined)
        updateData.dueDate = parsed.data.dueDate
          ? new Date(parsed.data.dueDate)
          : null
      if (parsed.data.status !== undefined)
        updateData.status = parsed.data.status
      if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

      const assignment = await prisma.parentAssignment.update({
        where: { id },
        data: updateData,
        include: {
          child: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      res.json(assignment)
    } catch (err) {
      next(err)
    }
  },
)

// DELETE /api/parent/assignments/:id - Delete an assignment
parentRouter.delete(
  '/assignments/:id',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const { id } = req.params

      // Verify the assignment belongs to this parent
      const existing = await prisma.parentAssignment.findUnique({
        where: { id },
      })

      if (!existing || existing.parentId !== parentId) {
        res.status(404).json({ error: 'Tugas tidak ditemukan.' })
        return
      }

      await prisma.parentAssignment.delete({ where: { id } })

      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/parent/children/:childId/assignments - Get assignments for a specific child
// This endpoint is accessible by both PARENT (own child) and STUDENT (own assignments)
parentRouter.get('/children/:childId/assignments', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId
    const authRole = req.auth!.role
    const { childId } = req.params

    // If parent, verify the child is linked to this parent
    if (authRole === 'PARENT') {
      const relationship = await prisma.parentChild.findUnique({
        where: { parentId_childId: { parentId: authUserId, childId } },
      })

      if (!relationship) {
        res
          .status(404)
          .json({ error: 'Murid tidak terhubung dengan akun Anda.' })
        return
      }
    }

    // If student, they can only view their own assignments
    if (authRole === 'STUDENT' && authUserId !== childId) {
      res.status(403).json({ error: 'Anda hanya bisa melihat tugas sendiri.' })
      return
    }

    const assignments = await prisma.parentAssignment.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
    })

    res.json(assignments)
  } catch (err) {
    next(err)
  }
})

// POST /api/parent/assignments/:assignmentId/start - Child started working on assignment
parentRouter.post(
  '/assignments/:assignmentId/start',
  async (req, res, next) => {
    try {
      const authUserId = req.auth!.userId
      const { assignmentId } = req.params

      const assignment = await prisma.parentAssignment.findUnique({
        where: { id: assignmentId },
      })
      if (!assignment || assignment.childId !== authUserId) {
        res.status(404).json({ error: 'Tugas tidak ditemukan.' })
        return
      }

      // Update assignment status to in_progress if still pending
      if (assignment.status === 'pending') {
        await prisma.parentAssignment.update({
          where: { id: assignmentId },
          data: { status: 'in_progress' },
        })
      }

      // 3. child_started notification
      const existing = await prisma.notification.findFirst({
        where: {
          userId: assignment.parentId,
          type: 'child_started',
          assignmentId,
        },
      })

      if (!existing) {
        const child = await prisma.user.findUnique({
          where: { id: authUserId },
          select: { name: true },
        })
        await prisma.notification.create({
          data: {
            userId: assignment.parentId,
            type: 'child_started',
            title: '📝 Tugas Mulai Dikerjakan',
            message: `${child?.name ?? 'Anak'} mulai mengerjakan modul "${assignment.title}".`,
            assignmentId,
          },
        })
      }

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/parent/assignments/:assignmentId/complete - Child completed assignment
parentRouter.post(
  '/assignments/:assignmentId/complete',
  async (req, res, next) => {
    try {
      const authUserId = req.auth!.userId
      const { assignmentId } = req.params

      const assignment = await prisma.parentAssignment.findUnique({
        where: { id: assignmentId },
      })
      if (!assignment || assignment.childId !== authUserId) {
        res.status(404).json({ error: 'Tugas tidak ditemukan.' })
        return
      }

      // Update assignment status to completed
      await prisma.parentAssignment.update({
        where: { id: assignmentId },
        data: { status: 'completed' },
      })

      // 4. child_completed notification to parent
      const existing = await prisma.notification.findFirst({
        where: {
          userId: assignment.parentId,
          type: 'child_completed',
          assignmentId,
        },
      })

      if (!existing) {
        const child = await prisma.user.findUnique({
          where: { id: authUserId },
          select: { name: true },
        })
        await prisma.notification.create({
          data: {
            userId: assignment.parentId,
            type: 'child_completed',
            title: '✅ Tugas Selesai',
            message: `${child?.name ?? 'Anak'} telah menyelesaikan modul "${assignment.title}".`,
            assignmentId,
          },
        })
      }

      // 5. assignment_completed_child - student notification
      const studentExisting = await prisma.notification.findFirst({
        where: {
          userId: authUserId,
          type: 'assignment_completed_child',
          assignmentId,
        },
      })
      if (!studentExisting) {
        await prisma.notification.create({
          data: {
            userId: authUserId,
            type: 'assignment_completed_child',
            title: '🎉 Hebat!',
            message: `Kamu telah menyelesaikan modul "${assignment.title}".`,
            assignmentId,
          },
        })
      }

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },
)

// ---------- Notifications ----------

// GET /api/parent/notifications - Get notifications for the current user (PARENT or STUDENT)
parentRouter.get('/notifications', async (req, res, next) => {
  try {
    const userId = req.auth!.userId
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(notifications)
  } catch (err) {
    next(err)
  }
})

// GET /api/parent/notifications/unread-count - Get unread notification count
parentRouter.get('/notifications/unread-count', async (req, res, next) => {
  try {
    const userId = req.auth!.userId
    const count = await prisma.notification.count({
      where: { userId, read: false },
    })
    res.json({ count })
  } catch (err) {
    next(err)
  }
})

// PUT /api/parent/notifications/:id/read - Mark a notification as read
parentRouter.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const userId = req.auth!.userId
    const { id } = req.params
    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification || notification.userId !== userId) {
      res.status(404).json({ error: 'Notifikasi tidak ditemukan.' })
      return
    }
    await prisma.notification.update({ where: { id }, data: { read: true } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// PUT /api/parent/notifications/read-all - Mark all notifications as read
parentRouter.put('/notifications/read-all', async (req, res, next) => {
  try {
    const userId = req.auth!.userId
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ---------- Questions ----------

// GET /api/parent/assignments/:assignmentId/questions - Get questions for an assignment
parentRouter.get(
  '/assignments/:assignmentId/questions',
  async (req, res, next) => {
    try {
      const authUserId = req.auth!.userId
      const authRole = req.auth!.role
      const { assignmentId } = req.params

      const assignment = await prisma.parentAssignment.findUnique({
        where: { id: assignmentId },
      })
      if (!assignment) {
        res.status(404).json({ error: 'Tugas tidak ditemukan.' })
        return
      }

      // Parent can see questions for their own assignments, student can see questions they asked
      if (authRole === 'PARENT' && assignment.parentId !== authUserId) {
        res.status(403).json({ error: 'Akses ditolak.' })
        return
      }
      if (authRole === 'STUDENT' && assignment.childId !== authUserId) {
        res.status(403).json({ error: 'Akses ditolak.' })
        return
      }

      const questions = await prisma.question.findMany({
        where: { assignmentId },
        orderBy: { createdAt: 'desc' },
      })
      res.json(questions)
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/parent/assignments/:assignmentId/questions - Ask a question (STUDENT only)
const askQuestionSchema = z.object({
  question: z.string().trim().min(1, 'Pertanyaan tidak boleh kosong'),
})

parentRouter.post(
  '/assignments/:assignmentId/questions',
  async (req, res, next) => {
    try {
      const authUserId = req.auth!.userId
      const authRole = req.auth!.role
      const { assignmentId } = req.params

      if (authRole !== 'STUDENT') {
        res
          .status(403)
          .json({ error: 'Hanya anak yang bisa mengirim pertanyaan.' })
        return
      }

      const parsed = askQuestionSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(400)
          .json({
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
          })
        return
      }

      const assignment = await prisma.parentAssignment.findUnique({
        where: { id: assignmentId },
      })
      if (!assignment || assignment.childId !== authUserId) {
        res.status(404).json({ error: 'Tugas tidak ditemukan.' })
        return
      }

      const question = await prisma.question.create({
        data: {
          assignmentId,
          childId: authUserId,
          parentId: assignment.parentId,
          question: parsed.data.question,
        },
      })

      // Create notification for parent
      const child = await prisma.user.findUnique({
        where: { id: authUserId },
        select: { name: true },
      })
      await prisma.notification.create({
        data: {
          userId: assignment.parentId,
          type: 'child_question',
          title: `${child?.name ?? 'Anak'} mengajukan pertanyaan`,
          message: parsed.data.question,
          assignmentId,
        },
      })

      res.status(201).json(question)
    } catch (err) {
      next(err)
    }
  },
)

// PUT /api/parent/questions/:questionId/reply - Reply to a question (PARENT only)
const replyQuestionSchema = z.object({
  reply: z.string().trim().min(1, 'Balasan tidak boleh kosong'),
})

parentRouter.put(
  '/questions/:questionId/reply',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const { questionId } = req.params

      const parsed = replyQuestionSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(400)
          .json({
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
          })
        return
      }

      const existing = await prisma.question.findUnique({
        where: { id: questionId },
      })
      if (!existing || existing.parentId !== parentId) {
        res.status(404).json({ error: 'Pertanyaan tidak ditemukan.' })
        return
      }

      const question = await prisma.question.update({
        where: { id: questionId },
        data: { reply: parsed.data.reply, repliedAt: new Date() },
      })

      // Create notification for child
      const parent = await prisma.user.findUnique({
        where: { id: parentId },
        select: { name: true },
      })
      await prisma.notification.create({
        data: {
          userId: existing.childId,
          type: 'parent_reply',
          title: `${parent?.name ?? 'Orang Tua'} membalas pertanyaan Anda`,
          message: parsed.data.reply,
          assignmentId: existing.assignmentId,
        },
      })

      res.json(question)
    } catch (err) {
      next(err)
    }
  },
)

// ---------- Score Notifications ----------

// POST /api/parent/notify/score - Called when a child completes a quiz frame
const notifyScoreSchema = z.object({
  childId: z.string().min(1),
  moduleId: z.string().min(1),
  frameTitle: z.string().min(1),
  score: z.number().int().min(0).max(100),
})

parentRouter.post('/notify/score', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId
    const parsed = notifyScoreSchema.safeParse(req.body)
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })
      return
    }

    const { childId, moduleId, frameTitle, score } = parsed.data

    // Find parent of this child
    const parentChild = await prisma.parentChild.findFirst({
      where: { childId },
    })
    if (!parentChild) {
      res.status(404).json({ error: 'Parent tidak ditemukan.' })
      return
    }

    const child = await prisma.user.findUnique({
      where: { id: childId },
      select: { name: true },
    })
    const childName = child?.name ?? 'Anak'

    // Find assignment for this module+child
    const assignment = await prisma.parentAssignment.findFirst({
      where: { childId, materialId: moduleId },
    })

    // 5. high_score or 6. low_score notification
    if (score >= 80) {
      await prisma.notification.create({
        data: {
          userId: parentChild.parentId,
          type: 'high_score',
          title: '🌟 Nilai Sangat Baik',
          message: `${childName} memperoleh nilai ${score}% pada kuis "${frameTitle}".`,
          assignmentId: assignment?.id,
        },
      })
    } else if (score <= 50) {
      await prisma.notification.create({
        data: {
          userId: parentChild.parentId,
          type: 'low_score',
          title: '⚠️ Perlu Pendampingan',
          message: `${childName} memperoleh nilai ${score}% pada kuis "${frameTitle}". Mungkin perlu belajar ulang.`,
          assignmentId: assignment?.id,
        },
      })
    }

    // 12. new_badge - if score is 100% on any quiz
    if (score === 100) {
      await prisma.notification.create({
        data: {
          userId: parentChild.parentId,
          type: 'new_badge',
          title: '🥇 Lencana Baru',
          message: `${childName} mendapatkan lencana "Sempurna!" untuk skor 100% pada "${frameTitle}".`,
          assignmentId: assignment?.id,
        },
      })
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ---------- Scheduled Notifications ----------

// POST /api/parent/check/deadlines - Check for approaching deadlines (call on dashboard load)
parentRouter.get(
  '/check/deadlines',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Find assignments with deadlines within 24h that are still pending/in_progress
      const assignments = await prisma.parentAssignment.findMany({
        where: {
          parentId,
          dueDate: { gte: now, lte: tomorrow },
          status: { in: ['pending', 'in_progress'] },
        },
        include: {
          child: { select: { name: true } },
        },
      })

      for (const a of assignments) {
        // Skip if we already sent a deadline_approaching notification today
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        )
        const existing = await prisma.notification.findFirst({
          where: {
            userId: parentId,
            type: 'deadline_approaching',
            assignmentId: a.id,
            createdAt: { gte: todayStart },
          },
        })
        if (!existing) {
          const hoursLeft = Math.round(
            (a.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60),
          )
          await prisma.notification.create({
            data: {
              userId: parentId,
              type: 'deadline_approaching',
              title: '⏰ Deadline Mendekat',
              message: `Tugas "${a.title}" untuk ${a.child.name} akan berakhir dalam ${hoursLeft} jam.`,
              assignmentId: a.id,
            },
          })
        }
      }

      // 9. Check overdue assignments
      const overdueAssignments = await prisma.parentAssignment.findMany({
        where: {
          parentId,
          dueDate: { lt: now },
          status: { in: ['pending', 'in_progress'] },
        },
        include: {
          child: { select: { name: true } },
        },
      })

      for (const a of overdueAssignments) {
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        )
        const existing = await prisma.notification.findFirst({
          where: {
            userId: parentId,
            type: 'assignment_overdue',
            assignmentId: a.id,
            createdAt: { gte: todayStart },
          },
        })
        if (!existing) {
          // Auto-update status to overdue
          await prisma.parentAssignment.update({
            where: { id: a.id },
            data: { status: 'overdue' },
          })
          await prisma.notification.create({
            data: {
              userId: parentId,
              type: 'assignment_overdue',
              title: '🚨 Tugas Terlambat',
              message: `${a.child.name} belum menyelesaikan tugas "${a.title}" yang telah melewati batas waktu.`,
              assignmentId: a.id,
            },
          })
        }
      }

      // 7. Check no activity (child hasn't logged in for 7 days)
      const children = await prisma.parentChild.findMany({
        where: { parentId },
        include: {
          child: { select: { id: true, name: true, updatedAt: true } },
        },
      })

      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      for (const rel of children) {
        if (rel.child.updatedAt < sevenDaysAgo) {
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          )
          const existing = await prisma.notification.findFirst({
            where: {
              userId: parentId,
              type: 'no_activity',
              createdAt: { gte: todayStart },
              message: { contains: rel.child.name },
            },
          })
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: parentId,
                type: 'no_activity',
                title: '😴 Belum Ada Aktivitas',
                message: `${rel.child.name} belum membuka Perpustakaan Belajar selama 7 hari.`,
              },
            })
          }
        }
      }

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/parent/reports/weekly - Generate weekly progress report notification
parentRouter.get(
  '/reports/weekly',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const children = await prisma.parentChild.findMany({
        where: { parentId },
        include: {
          child: { select: { id: true, name: true } },
        },
      })

      for (const rel of children) {
        // Count completed assignments in past week
        const completedThisWeek = await prisma.parentAssignment.count({
          where: {
            childId: rel.child.id,
            status: 'completed',
            updatedAt: { gte: weekAgo },
          },
        })

        // Count total frames completed
        const clientId = `user:${rel.child.id}`
        const framesThisWeek = await prisma.progressRecord.count({
          where: {
            clientId,
            completed: true,
            updatedAt: { gte: weekAgo },
          },
        })

        // Average accuracy
        const records = await prisma.progressRecord.findMany({
          where: {
            clientId,
            completed: true,
            total: { gt: 0 },
            updatedAt: { gte: weekAgo },
          },
        })
        const avgScore =
          records.length > 0
            ? Math.round(
                records.reduce(
                  (sum, r) => sum + Math.round((r.correct / r.total) * 100),
                  0,
                ) / records.length,
              )
            : 0

        // Only create if there was activity
        if (completedThisWeek > 0 || framesThisWeek > 0) {
          // Deduplicate - once per day
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          )
          const existing = await prisma.notification.findFirst({
            where: {
              userId: parentId,
              type: 'weekly_report',
              createdAt: { gte: todayStart },
              message: { contains: rel.child.name },
            },
          })
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: parentId,
                type: 'weekly_report',
                title: '📊 Ringkasan Mingguan',
                message: `Minggu ini ${rel.child.name} menyelesaikan ${completedThisWeek} tugas dan memperoleh rata-rata nilai ${avgScore}%.`,
              },
            })
          }
        }
      }

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/parent/reports/monthly - Generate monthly progress report notification
parentRouter.get(
  '/reports/monthly',
  requireRole('PARENT'),
  async (req, res, next) => {
    try {
      const parentId = req.auth!.userId
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const children = await prisma.parentChild.findMany({
        where: { parentId },
        include: {
          child: { select: { id: true, name: true } },
        },
      })

      for (const rel of children) {
        // Count completed assignments in past month
        const completedThisMonth = await prisma.parentAssignment.count({
          where: {
            childId: rel.child.id,
            status: 'completed',
            updatedAt: { gte: monthAgo },
          },
        })

        // Total frames completed
        const clientId = `user:${rel.child.id}`
        const framesThisMonth = await prisma.progressRecord.count({
          where: {
            clientId,
            completed: true,
            updatedAt: { gte: monthAgo },
          },
        })

        // Count total frames (estimate study time from frames * ~3min each)
        const estimatedMinutes = framesThisMonth * 3
        const hours = Math.floor(estimatedMinutes / 60)
        const minutes = estimatedMinutes % 60
        const timeStr =
          hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`

        if (completedThisMonth > 0 || framesThisMonth > 0) {
          // Deduplicate - once per month
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const existing = await prisma.notification.findFirst({
            where: {
              userId: parentId,
              type: 'monthly_report',
              createdAt: { gte: monthStart },
              message: { contains: rel.child.name },
            },
          })
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: parentId,
                type: 'monthly_report',
                title: '🏆 Ringkasan Bulanan',
                message: `Bulan ini ${rel.child.name} menyelesaikan ${completedThisMonth} tugas dan belajar selama ${timeStr}.`,
              },
            })
          }
        }
      }

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },
)

// ---------- Student Notifications ----------

// POST /api/parent/notify/student-score - Student quiz score notification (perfect/badge)
const studentScoreSchema = z.object({
  moduleId: z.string().min(1),
  frameTitle: z.string().min(1),
  score: z.number().int().min(0).max(100),
})

parentRouter.post('/notify/student-score', async (req, res, next) => {
  try {
    const studentId = req.auth!.userId
    const role = req.auth!.role
    if (role !== 'STUDENT') {
      res
        .status(403)
        .json({ error: 'Hanya siswa yang bisa menggunakan endpoint ini.' })
      return
    }
    const parsed = studentScoreSchema.safeParse(req.body)
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })
      return
    }
    const { moduleId, frameTitle, score } = parsed.data

    // 6. perfect_score - 🏆
    if (score === 100) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const existing = await prisma.notification.findFirst({
        where: {
          userId: studentId,
          type: 'perfect_score',
          message: { contains: frameTitle },
          createdAt: { gte: todayStart },
        },
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: studentId,
            type: 'perfect_score',
            title: '🏆 Nilai Sempurna',
            message: `Selamat! Kamu mendapatkan nilai 100% pada "${frameTitle}".`,
          },
        })
      }
    }

    // 7. badge_earned - 🥇 (score >= 90)
    if (score >= 90) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const existing = await prisma.notification.findFirst({
        where: {
          userId: studentId,
          type: 'badge_earned',
          message: { contains: frameTitle },
          createdAt: { gte: todayStart },
        },
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: studentId,
            type: 'badge_earned',
            title: '🥇 Lencana Baru',
            message: `Kamu mendapatkan lencana "Juara" untuk skor ${score}% pada "${frameTitle}".`,
          },
        })
      }
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// GET /api/parent/student/check - Generate student notifications on dashboard load
// Checks: continue_learning, assignment_almost_due, encouragement, daily_reminder, streak, achievements
parentRouter.get('/student/check', async (req, res, next) => {
  try {
    const studentId = req.auth!.userId
    const role = req.auth!.role
    if (role !== 'STUDENT') {
      res.status(403).json({ error: 'Hanya siswa.' })
      return
    }

    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )

    // Get student's assignments
    const assignments = await prisma.parentAssignment.findMany({
      where: { childId: studentId },
    })

    const clientId = `user:${studentId}`

    // 3. continue_learning - count incomplete frames across all assignments
    const incompleteAssignments = assignments.filter(
      (a) => a.status !== 'completed' && a.materialId && a.selectedFrames,
    )
    let totalIncomplete = 0
    for (const a of incompleteAssignments) {
      const frames = (a.selectedFrames as string[]) ?? []
      for (const frameId of frames) {
        const record = await prisma.progressRecord.findUnique({
          where: {
            clientId_moduleId_frameSlug: {
              clientId,
              moduleId: a.materialId!,
              frameSlug: frameId,
            },
          },
        })
        if (!record?.completed) totalIncomplete++
      }
    }
    if (totalIncomplete > 0) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: studentId,
          type: 'continue_learning',
          createdAt: { gte: todayStart },
        },
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: studentId,
            type: 'continue_learning',
            title: '📖 Lanjutkan Belajar',
            message: `Kamu masih memiliki ${totalIncomplete} bahasan yang belum selesai.`,
          },
        })
      }
    }

    // 4. assignment_almost_due - deadline within 24h
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const almostDue = assignments.filter(
      (a) =>
        a.dueDate &&
        a.dueDate >= now &&
        a.dueDate <= tomorrow &&
        a.status !== 'completed',
    )
    for (const a of almostDue) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: studentId,
          type: 'assignment_almost_due',
          assignmentId: a.id,
          createdAt: { gte: todayStart },
        },
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: studentId,
            type: 'assignment_almost_due',
            title: '⏰ Deadline Sebentar Lagi',
            message: `Tugas "${a.title}" berakhir ${a.dueDate!.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}.`,
            assignmentId: a.id,
          },
        })
      }
    }

    // 11. encouragement - count remaining frames for in-progress assignments
    const inProgress = assignments.filter(
      (a) => a.status === 'in_progress' && a.materialId && a.selectedFrames,
    )
    for (const a of inProgress) {
      const frames = (a.selectedFrames as string[]) ?? []
      let remaining = 0
      for (const frameId of frames) {
        const record = await prisma.progressRecord.findUnique({
          where: {
            clientId_moduleId_frameSlug: {
              clientId,
              moduleId: a.materialId!,
              frameSlug: frameId,
            },
          },
        })
        if (!record?.completed) remaining++
      }
      if (remaining > 0 && remaining <= 3) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: studentId,
            type: 'encouragement',
            assignmentId: a.id,
            createdAt: { gte: todayStart },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: studentId,
              type: 'encouragement',
              title: '💪 Semangat Belajar',
              message: `Tinggal ${remaining} bahasan lagi untuk menyelesaikan modul "${a.title}".`,
              assignmentId: a.id,
            },
          })
        }
      }
    }

    // 8. study_streak - count consecutive days of activity
    let streak = 0
    for (let d = 0; d < 30; d++) {
      const dayStart = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const hasActivity = await prisma.progressRecord.findFirst({
        where: {
          clientId,
          completed: true,
          updatedAt: { gte: dayStart, lt: dayEnd },
        },
      })
      if (hasActivity) {
        streak++
      } else if (d > 0) {
        break // streak broken
      }
    }

    if (streak >= 3) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: studentId,
          type: 'study_streak',
          createdAt: { gte: todayStart },
        },
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: studentId,
            type: 'study_streak',
            title: '🔥 Belajar Beruntun',
            message: `Kamu sudah belajar selama ${streak} hari berturut-turut. Keren!`,
          },
        })
      }
    }

    // 9. streak_lost - yesterday had no activity but day before did
    if (streak === 0) {
      const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      yesterdayStart.setHours(0, 0, 0, 0)
      const yesterdayEnd = new Date(
        yesterdayStart.getTime() + 24 * 60 * 60 * 1000,
      )
      const dayBeforeStart = new Date(now.getTime() - 48 * 60 * 60 * 1000)
      dayBeforeStart.setHours(0, 0, 0, 0)
      const dayBeforeEnd = new Date(
        dayBeforeStart.getTime() + 24 * 60 * 60 * 1000,
      )
      const hadYesterday = await prisma.progressRecord.findFirst({
        where: {
          clientId,
          completed: true,
          updatedAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
      })
      const hadDayBefore = await prisma.progressRecord.findFirst({
        where: {
          clientId,
          completed: true,
          updatedAt: { gte: dayBeforeStart, lt: dayBeforeEnd },
        },
      })
      if (hadDayBefore && !hadYesterday) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: studentId,
            type: 'streak_lost',
            createdAt: { gte: todayStart },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: studentId,
              type: 'streak_lost',
              title: '💤 Jangan Menyerah',
              message: 'Streak belajarmu terhenti. Yuk mulai lagi hari ini!',
            },
          })
        }
      }
    }

    // 10. achievement_unlocked - count unique completed modules
    const uniqueModules = await prisma.progressRecord.findMany({
      where: { clientId, completed: true },
      distinct: ['moduleId'],
      select: { moduleId: true },
    })
    const totalModules = uniqueModules.length

    const milestones = [5, 10, 25, 50]
    for (const milestone of milestones) {
      if (totalModules >= milestone) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: studentId,
            type: 'achievement_unlocked',
            message: { contains: `${milestone} modul` },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: studentId,
              type: 'achievement_unlocked',
              title: '⭐ Pencapaian Baru',
              message: `Kamu telah menyelesaikan ${totalModules} modul pertama!`,
            },
          })
        }
      }
    }

    // 2. new_module_available - modules created in the last 24h matching student grade/semester
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { grade: true, semester: true },
    })
    if (student?.grade && student?.semester) {
      const newModules = await prisma.module.findMany({
        where: {
          grade: student.grade,
          semester: student.semester,
          createdAt: { gte: dayAgo },
        },
        select: { id: true, title: true },
      })
      for (const mod of newModules) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: studentId,
            type: 'new_module_available',
            message: { contains: mod.title },
            createdAt: { gte: todayStart },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: studentId,
              type: 'new_module_available',
              title: '✨ Materi Baru',
              message: `Materi "${mod.title}" sekarang tersedia.`,
            },
          })
        }
      }
    }

    // 12. daily_reminder - once per day (only if student has assignments)
    if (assignments.length > 0) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: studentId,
          type: 'daily_reminder',
          createdAt: { gte: todayStart },
        },
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: studentId,
            type: 'daily_reminder',
            title: '📅 Waktunya Belajar',
            message: 'Jangan lupa belajar hari ini ya!',
          },
        })
      }
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})
