const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const COLLECTION = 'attendances';

// Davomat yaratish/yangilash
async function createOrUpdateAttendance(data) {
  const db = getDB();
  
  const attendance = {
    date: data.date, // "2026-06-30"
    teacherId: new ObjectId(data.teacherId),
    studentId: new ObjectId(data.studentId),
    attendance: data.attendance, // 'present', 'absent', 'absent_with_reason'
    reason: data.reason || '',
    xpEarned: data.xpEarned || 0,
    updatedAt: new Date()
  };
  
  // Agar mavjud bo'lsa yangilash, aks holda yaratish
  const result = await db.collection(COLLECTION).updateOne(
    { 
      date: data.date, 
      studentId: new ObjectId(data.studentId) 
    },
    { $set: attendance },
    { upsert: true }
  );
  
  // Agar XP berilgan bo'lsa, student totalXP ga qo'shish
  if (data.xpEarned > 0) {
    await db.collection('students').updateOne(
      { _id: new ObjectId(data.studentId) },
      { $inc: { totalXP: data.xpEarned } }
    );
  }
  
  return result;
}

// Studentning davomat tarixi
async function getStudentAttendance(studentId, limit = 30) {
  const db = getDB();
  return await db.collection(COLLECTION)
    .find({ studentId: new ObjectId(studentId) })
    .sort({ date: -1 })
    .limit(limit)
    .toArray();
}

// Teacherning bugungi davomati
async function getTodayAttendance(teacherId) {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0]; // "2026-06-30"
  
  const attendance = await db.collection(COLLECTION)
    .find({ 
      teacherId: new ObjectId(teacherId),
      date: today 
    })
    .toArray();
  
  return attendance;
}

// Date bo'yicha davomat
async function getAttendanceByDate(date, teacherId = null) {
  const db = getDB();
  const filter = { date };
  
  if (teacherId) {
    filter.teacherId = new ObjectId(teacherId);
  }
  
  return await db.collection(COLLECTION)
    .find(filter)
    .toArray();
}

module.exports = {
  createOrUpdateAttendance,
  getStudentAttendance,
  getTodayAttendance,
  getAttendanceByDate,
  COLLECTION
};