// src/lib/notifications.ts
// Helper untuk membuat notifikasi dari mana saja di aplikasi

import prisma from '@/src/lib/prisma'

export type NotificationType =
  | 'leave_submitted'
  | 'leave_approved'
  | 'leave_rejected'
  | 'payroll_generated'
  | 'payroll_approved'
  | 'payroll_paid'
  | 'attendance_reminder'
  | 'welcome'
  | 'invitation_sent'
  | 'system'

interface CreateNotificationParams {
  organizationId: string
  recipientId: string
  senderId?: string
  type: NotificationType
  title: string
  message: string
  resourceType?: string
  resourceId?: string
}

// Buat satu notifikasi
export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        organizationId: params.organizationId,
        recipientId: params.recipientId,
        senderId: params.senderId,
        type: params.type,
        title: params.title,
        message: params.message,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Jangan throw error agar tidak mengganggu proses utama
  }
}

// Buat notifikasi ke banyak penerima sekaligus
export async function createBulkNotifications(
  recipients: string[],
  params: Omit<CreateNotificationParams, 'recipientId'>
) {
  try {
    const data = recipients.map((recipientId) => ({
      organizationId: params.organizationId,
      recipientId,
      senderId: params.senderId,
      type: params.type,
      title: params.title,
      message: params.message,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
    }))

    return await prisma.notification.createMany({ data })
  } catch (error) {
    console.error('Failed to create bulk notifications:', error)
  }
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

// Notifikasi saat karyawan submit cuti
export async function notifyLeaveSubmitted(params: {
  organizationId: string
  employeeId: string      // Yang submit
  employeeName: string
  managerId: string       // Yang menerima notif
  leaveType: string
  days: number
  leaveId: string
}) {
  return createNotification({
    organizationId: params.organizationId,
    recipientId: params.managerId,
    senderId: params.employeeId,
    type: 'leave_submitted',
    title: 'Pengajuan Cuti Baru',
    message: `${params.employeeName} mengajukan ${params.leaveType} selama ${params.days} hari dan menunggu persetujuan Anda.`,
    resourceType: 'leave',
    resourceId: params.leaveId,
  })
}

// Notifikasi saat cuti disetujui
export async function notifyLeaveApproved(params: {
  organizationId: string
  employeeId: string      // Yang menerima notif
  approverId: string      // Yang approve
  approverName: string
  leaveType: string
  days: number
  leaveId: string
}) {
  return createNotification({
    organizationId: params.organizationId,
    recipientId: params.employeeId,
    senderId: params.approverId,
    type: 'leave_approved',
    title: 'Cuti Disetujui ✓',
    message: `${params.approverName} telah menyetujui pengajuan ${params.leaveType} Anda selama ${params.days} hari.`,
    resourceType: 'leave',
    resourceId: params.leaveId,
  })
}

// Notifikasi saat cuti ditolak
export async function notifyLeaveRejected(params: {
  organizationId: string
  employeeId: string
  approverId: string
  approverName: string
  leaveType: string
  reason: string
  leaveId: string
}) {
  return createNotification({
    organizationId: params.organizationId,
    recipientId: params.employeeId,
    senderId: params.approverId,
    type: 'leave_rejected',
    title: 'Cuti Ditolak',
    message: `${params.approverName} menolak pengajuan ${params.leaveType} Anda. Alasan: ${params.reason}`,
    resourceType: 'leave',
    resourceId: params.leaveId,
  })
}

// Notifikasi saat payroll digenerate untuk semua karyawan
export async function notifyPayrollGenerated(params: {
  organizationId: string
  employeeIds: string[]   // Semua karyawan yang dapat payroll
  generatorId: string
  generatorName: string
  month: number
  year: number
  payrollIds?: string[]
}) {
  const monthName = new Date(params.year, params.month - 1).toLocaleString('id-ID', { month: 'long' })
  
  const data = params.employeeIds.map((id, idx) => ({
    organizationId: params.organizationId,
    recipientId: id,
    senderId: params.generatorId,
    type: 'payroll_generated' as NotificationType,
    title: `Slip Gaji ${monthName} ${params.year} Tersedia`,
    message: `Slip gaji Anda untuk periode ${monthName} ${params.year} telah digenerate oleh ${params.generatorName}. Cek di menu Payslip.`,
    resourceType: 'payroll',
    resourceId: params.payrollIds?.[idx],
  }))

  try {
    return await prisma.notification.createMany({ data })
  } catch (error) {
    console.error('Failed to notify payroll generated:', error)
  }
}

// Notifikasi welcome saat employee baru bergabung
export async function notifyWelcome(params: {
  organizationId: string
  employeeId: string
  employeeName: string
  organizationName: string
}) {
  return createNotification({
    organizationId: params.organizationId,
    recipientId: params.employeeId,
    type: 'welcome',
    title: `Selamat Datang, ${params.employeeName}! 👋`,
    message: `Akun Anda di ${params.organizationName} telah aktif. Mulai dengan melengkapi profil Anda.`,
  })
}

// Notifikasi sistem (broadcast ke semua HR/Admin)
export async function notifyHRAdmins(params: {
  organizationId: string
  type: NotificationType
  title: string
  message: string
  resourceType?: string
  resourceId?: string
}) {
  try {
    const hrAdmins = await prisma.employee.findMany({
      where: {
        organizationId: params.organizationId,
        role: { in: ['hr', 'admin', 'owner'] },
        status: 'active',
      },
      select: { id: true },
    })

    const data = hrAdmins.map((emp) => ({
      organizationId: params.organizationId,
      recipientId: emp.id,
      type: params.type,
      title: params.title,
      message: params.message,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
    }))

    return await prisma.notification.createMany({ data })
  } catch (error) {
    console.error('Failed to notify HR/Admins:', error)
  }
}