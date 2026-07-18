const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const COLLECTION = 'students';

// Student yaratish
async function createStudent(data) {
  const db = getDB();
  
  const student = {
    fullName: data.fullName,
    email: data.email ? data.email.toLowerCase() : '',
    phone: data.phone || '',
    teacherId: new ObjectId(data.teacherId),
    totalXP: 0,
    status: data.status || 'active',
    createdAt: new Date()
  };
  
  const result = await db.collection(COLLECTION).insertOne(student);
  
  // Teacherga student ni qo'shish
  await db.collection('teachers').updateOne(
    { _id: new ObjectId(data.teacherId) },
    { $push: { students: result.insertedId } }
  );
  
  return { ...student, _id: result.insertedId };
}

// Teacherga tegishli studentlar
async function findByTeacherId(teacherId) {
  const db = getDB();
  return await db.collection(COLLECTION)
    .find({ teacherId: new ObjectId(teacherId) })
    .sort({ createdAt: -1 })
    .toArray();
}

// ID bo'yicha topish
async function findById(id) {
  const db = getDB();
  return await db.collection(COLLECTION).findOne({ 
    _id: new ObjectId(id) 
  });
}

// XP qo'shish
async function addXP(studentId, xp) {
  const db = getDB();
  return await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(studentId) },
    { $inc: { totalXP: xp } }
  );
}

// Barcha studentlar
async function findAll() {
  const db = getDB();
  return await db.collection(COLLECTION)
    .find()
    .sort({ createdAt: -1 })
    .toArray();
}

module.exports = {
  createStudent,
  findByTeacherId,
  findById,
  addXP,
  findAll,
  COLLECTION
};