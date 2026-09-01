import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { hashPassword } from '../lib/auth.js';

export const parentRouter = Router();

// All parent routes require authentication (but not necessarily PARENT role)
parentRouter.use(requireAuth);

// ---------- Parent-Child Relationships ----------

// GET /api/parent/children - List all children linked to this parent
parentRouter.get('/children', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    
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
    });

    const children = relationships.map((rel) => rel.child);
    res.json(children);
  } catch (err) {
    next(err);
  }
});

// POST /api/parent/children - Create a new child (student) account and link to this parent
const addChildSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  grade: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(2),
  birthDate: z.string().optional(),
  gender: z.enum(['Laki-laki', 'Perempuan']).optional(),
});

parentRouter.post('/children', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const parsed = addChildSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const { name, email, password, grade, semester, birthDate, gender } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email sudah terdaftar.' });
      return;
    }

    // Create the child (student) account
    const passwordHash = await hashPassword(password);
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
    });

    // Every new account starts on a 14-day free trial with full access
    const trialPlan = await prisma.plan.findUnique({ where: { id: 'free_trial' } });
    if (trialPlan) {
      const trialDays = trialPlan.trialDays ?? 14;
      await prisma.subscription.create({
        data: {
          userId: child.id,
          planId: trialPlan.id,
          status: 'TRIALING',
          currentPeriodEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Create the parent-child link
    await prisma.parentChild.create({
      data: { parentId, childId: child.id },
    });

    res.status(201).json({
      id: child.id,
      name: child.name,
      email: child.email,
      grade: child.grade,
      semester: child.semester,
      birthDate: child.birthDate,
      gender: child.gender,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/parent/children/:childId - Unlink a child
parentRouter.delete('/children/:childId', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { childId } = req.params;

    const relationship = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });

    if (!relationship) {
      res.status(404).json({ error: 'Hubungan tidak ditemukan.' });
      return;
    }

    await prisma.parentChild.delete({
      where: { parentId_childId: { parentId, childId } },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------- Child Progress ----------

// GET /api/parent/children/:childId/progress - Get progress for a specific child
parentRouter.get('/children/:childId/progress', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { childId } = req.params;

    // Verify the child is linked to this parent
    const relationship = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });

    if (!relationship) {
      res.status(404).json({ error: 'Murid tidak terhubung dengan akun Anda.' });
      return;
    }

    // Get progress records for this child
    const clientId = `user:${childId}`;
    const progressRecords = await prisma.progressRecord.findMany({
      where: { clientId },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by module
    const moduleProgress: Record<string, { completed: number; total: number; correct: number }> = {};
    
    for (const record of progressRecords) {
      if (!moduleProgress[record.moduleId]) {
        moduleProgress[record.moduleId] = { completed: 0, total: 0, correct: 0 };
      }
      
      if (record.completed) {
        moduleProgress[record.moduleId].completed++;
      }
      moduleProgress[record.moduleId].total++;
      moduleProgress[record.moduleId].correct += record.correct;
    }

    // Get module details
    const moduleIds = Object.keys(moduleProgress);
    const modules = await prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, title: true, subjectId: true },
    });

    const moduleMap = Object.fromEntries(modules.map((m) => [m.id, m]));

    // Build response
    const progress = moduleIds.map((moduleId) => ({
      moduleId,
      title: moduleMap[moduleId]?.title ?? moduleId,
      subjectId: moduleMap[moduleId]?.subjectId,
      ...moduleProgress[moduleId],
      accuracy: moduleProgress[moduleId].total > 0
        ? Math.round(moduleProgress[moduleId].correct / moduleProgress[moduleId].total * 100)
        : 0,
    }));

    res.json(progress);
  } catch (err) {
    next(err);
  }
});

// GET /api/parent/children/:childId/progress/:moduleId - Get frame-level progress for a specific module
parentRouter.get('/children/:childId/progress/:moduleId', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId;
    const authRole = req.auth!.role;
    const { childId, moduleId } = req.params;

    // If parent, verify the child is linked
    if (authRole === 'PARENT') {
      const relationship = await prisma.parentChild.findUnique({
        where: { parentId_childId: { parentId: authUserId, childId } },
      });
      if (!relationship) {
        res.status(404).json({ error: 'Murid tidak terhubung dengan akun Anda.' });
        return;
      }
    }

    // If student, can only view own progress
    if (authRole === 'STUDENT' && authUserId !== childId) {
      res.status(403).json({ error: 'Anda hanya bisa melihat progres sendiri.' });
      return;
    }

    const clientId = `user:${childId}`;
    const records = await prisma.progressRecord.findMany({
      where: { clientId, moduleId },
    });

    const frameProgress = records.map((r) => ({
      frameSlug: r.frameSlug,
      completed: r.completed,
      correct: r.correct,
      total: r.total,
      accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
    }));

    res.json(frameProgress);
  } catch (err) {
    next(err);
  }
});

// ---------- Reading Progress ----------

// GET /api/parent/children/:childId/reading - Get reading progress for a child
parentRouter.get('/children/:childId/reading', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { childId } = req.params;

    // Verify the child is linked to this parent
    const relationship = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });

    if (!relationship) {
      res.status(404).json({ error: 'Murid tidak terhubung dengan akun Anda.' });
      return;
    }

    const readingProgress = await prisma.readingProgress.findMany({
      where: { childId },
      orderBy: { lastReadAt: 'desc' },
    });

    res.json(readingProgress);
  } catch (err) {
    next(err);
  }
});

// POST /api/parent/children/:childId/reading - Create/update reading progress
const readingProgressSchema = z.object({
  materialId: z.string().min(1),
  materialType: z.enum(['module', 'book', 'article']),
  title: z.string().min(1),
  totalPages: z.number().int().min(0).optional(),
  currentPage: z.number().int().min(0).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
});

parentRouter.post('/children/:childId/reading', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { childId } = req.params;

    // Verify the child is linked to this parent
    const relationship = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });

    if (!relationship) {
      res.status(404).json({ error: 'Murid tidak terhubung dengan akun Anda.' });
      return;
    }

    const parsed = readingProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const { materialId, materialType, title, totalPages, currentPage, status } = parsed.data;

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
    });

    res.json(readingProgress);
  } catch (err) {
    next(err);
  }
});

// ---------- Parent Assignments ----------

// GET /api/parent/assignments - List all assignments created by this parent
parentRouter.get('/assignments', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;

    const assignments = await prisma.parentAssignment.findMany({
      where: { parentId },
      include: {
        child: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

// POST /api/parent/assignments - Create a new assignment
const createAssignmentSchema = z.object({
  childId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  materialId: z.string().optional(),
  selectedFrames: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

parentRouter.post('/assignments', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const parsed = createAssignmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const { childId, title, description, materialId, selectedFrames, dueDate } = parsed.data;

    // Verify the child is linked to this parent
    const relationship = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });

    if (!relationship) {
      res.status(404).json({ error: 'Murid tidak terhubung dengan akun Anda.' });
      return;
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
    });

    // Create notification for child about new assignment
    const parent = await prisma.user.findUnique({ where: { id: parentId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: childId,
        type: 'new_assignment',
        title: `${parent?.name ?? 'Orang Tua'} memberikan tugas baru`,
        message: `Anda mendapat tugas: ${title}`,
        assignmentId: assignment.id,
      },
    });

    // Also create notification for parent that assignment was created
    await prisma.notification.create({
      data: {
        userId: parentId,
        type: 'assignment_created',
        title: 'Tugas berhasil dibuat',
        message: `Tugas "${title}" telah ditugaskan ke ${getChildNameForNotif(childId)}`,
        assignmentId: assignment.id,
      },
    });

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
});

// Helper to get child name for notifications
async function getChildNameForNotif(childId: string): Promise<string> {
  const child = await prisma.user.findUnique({ where: { id: childId }, select: { name: true } });
  return child?.name ?? 'anak';
}

// PUT /api/parent/assignments/:id - Update an assignment
const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  materialId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
  notes: z.string().optional(),
});

parentRouter.put('/assignments/:id', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { id } = req.params;
    const parsed = updateAssignmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    // Verify the assignment belongs to this parent
    const existing = await prisma.parentAssignment.findUnique({
      where: { id },
    });

    if (!existing || existing.parentId !== parentId) {
      res.status(404).json({ error: 'Tugas tidak ditemukan.' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.materialId !== undefined) updateData.materialId = parsed.data.materialId;
    if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const assignment = await prisma.parentAssignment.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/parent/assignments/:id - Delete an assignment
parentRouter.delete('/assignments/:id', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { id } = req.params;

    // Verify the assignment belongs to this parent
    const existing = await prisma.parentAssignment.findUnique({
      where: { id },
    });

    if (!existing || existing.parentId !== parentId) {
      res.status(404).json({ error: 'Tugas tidak ditemukan.' });
      return;
    }

    await prisma.parentAssignment.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/parent/children/:childId/assignments - Get assignments for a specific child
// This endpoint is accessible by both PARENT (own child) and STUDENT (own assignments)
parentRouter.get('/children/:childId/assignments', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId;
    const authRole = req.auth!.role;
    const { childId } = req.params;

    // If parent, verify the child is linked to this parent
    if (authRole === 'PARENT') {
      const relationship = await prisma.parentChild.findUnique({
        where: { parentId_childId: { parentId: authUserId, childId } },
      });

      if (!relationship) {
        res.status(404).json({ error: 'Murid tidak terhubung dengan akun Anda.' });
        return;
      }
    }

    // If student, they can only view their own assignments
    if (authRole === 'STUDENT' && authUserId !== childId) {
      res.status(403).json({ error: 'Anda hanya bisa melihat tugas sendiri.' });
      return;
    }

    const assignments = await prisma.parentAssignment.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

// POST /api/parent/assignments/:assignmentId/start - Child started working on assignment
parentRouter.post('/assignments/:assignmentId/start', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId;
    const { assignmentId } = req.params;

    const assignment = await prisma.parentAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.childId !== authUserId) {
      res.status(404).json({ error: 'Tugas tidak ditemukan.' });
      return;
    }

    // Update assignment status to in_progress if still pending
    if (assignment.status === 'pending') {
      await prisma.parentAssignment.update({
        where: { id: assignmentId },
        data: { status: 'in_progress' },
      });
    }

    // Check if notification already exists (avoid duplicates)
    const existing = await prisma.notification.findFirst({
      where: { userId: assignment.parentId, type: 'child_started', assignmentId },
    });

    if (!existing) {
      const child = await prisma.user.findUnique({ where: { id: authUserId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: assignment.parentId,
          type: 'child_started',
          title: `${child?.name ?? 'Anak'} mulai mengerjakan tugas`,
          message: `${child?.name ?? 'Anak'} sedang mengerjakan "${assignment.title}"`,
          assignmentId,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/parent/assignments/:assignmentId/complete - Child completed assignment
parentRouter.post('/assignments/:assignmentId/complete', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId;
    const { assignmentId } = req.params;

    const assignment = await prisma.parentAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.childId !== authUserId) {
      res.status(404).json({ error: 'Tugas tidak ditemukan.' });
      return;
    }

    // Update assignment status to completed
    await prisma.parentAssignment.update({
      where: { id: assignmentId },
      data: { status: 'completed' },
    });

    // Check if notification already exists
    const existing = await prisma.notification.findFirst({
      where: { userId: assignment.parentId, type: 'child_completed', assignmentId },
    });

    if (!existing) {
      const child = await prisma.user.findUnique({ where: { id: authUserId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: assignment.parentId,
          type: 'child_completed',
          title: `${child?.name ?? 'Anak'} menyelesaikan tugas`,
          message: `${child?.name ?? 'Anak'} telah selesai mengerjakan "${assignment.title}"`,
          assignmentId,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Notifications ----------

// GET /api/parent/notifications - Get notifications for the current user (PARENT or STUDENT)
parentRouter.get('/notifications', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// GET /api/parent/notifications/unread-count - Get unread notification count
parentRouter.get('/notifications/unread-count', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// PUT /api/parent/notifications/:id/read - Mark a notification as read
parentRouter.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      res.status(404).json({ error: 'Notifikasi tidak ditemukan.' });
      return;
    }
    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/parent/notifications/read-all - Mark all notifications as read
parentRouter.put('/notifications/read-all', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Questions ----------

// GET /api/parent/assignments/:assignmentId/questions - Get questions for an assignment
parentRouter.get('/assignments/:assignmentId/questions', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId;
    const authRole = req.auth!.role;
    const { assignmentId } = req.params;

    const assignment = await prisma.parentAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      res.status(404).json({ error: 'Tugas tidak ditemukan.' });
      return;
    }

    // Parent can see questions for their own assignments, student can see questions they asked
    if (authRole === 'PARENT' && assignment.parentId !== authUserId) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    if (authRole === 'STUDENT' && assignment.childId !== authUserId) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }

    const questions = await prisma.question.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

// POST /api/parent/assignments/:assignmentId/questions - Ask a question (STUDENT only)
const askQuestionSchema = z.object({ question: z.string().trim().min(1, 'Pertanyaan tidak boleh kosong') });

parentRouter.post('/assignments/:assignmentId/questions', async (req, res, next) => {
  try {
    const authUserId = req.auth!.userId;
    const authRole = req.auth!.role;
    const { assignmentId } = req.params;

    if (authRole !== 'STUDENT') {
      res.status(403).json({ error: 'Hanya anak yang bisa mengirim pertanyaan.' });
      return;
    }

    const parsed = askQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const assignment = await prisma.parentAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.childId !== authUserId) {
      res.status(404).json({ error: 'Tugas tidak ditemukan.' });
      return;
    }

    const question = await prisma.question.create({
      data: {
        assignmentId,
        childId: authUserId,
        parentId: assignment.parentId,
        question: parsed.data.question,
      },
    });

    // Create notification for parent
    const child = await prisma.user.findUnique({ where: { id: authUserId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: assignment.parentId,
        type: 'child_question',
        title: `${child?.name ?? 'Anak'} mengajukan pertanyaan`,
        message: parsed.data.question,
        assignmentId,
      },
    });

    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
});

// PUT /api/parent/questions/:questionId/reply - Reply to a question (PARENT only)
const replyQuestionSchema = z.object({ reply: z.string().trim().min(1, 'Balasan tidak boleh kosong') });

parentRouter.put('/questions/:questionId/reply', requireRole('PARENT'), async (req, res, next) => {
  try {
    const parentId = req.auth!.userId;
    const { questionId } = req.params;

    const parsed = replyQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const existing = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existing || existing.parentId !== parentId) {
      res.status(404).json({ error: 'Pertanyaan tidak ditemukan.' });
      return;
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: { reply: parsed.data.reply, repliedAt: new Date() },
    });

    // Create notification for child
    const parent = await prisma.user.findUnique({ where: { id: parentId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: existing.childId,
        type: 'parent_reply',
        title: `${parent?.name ?? 'Orang Tua'} membalas pertanyaan Anda`,
        message: parsed.data.reply,
        assignmentId: existing.assignmentId,
      },
    });

    res.json(question);
  } catch (err) {
    next(err);
  }
});
