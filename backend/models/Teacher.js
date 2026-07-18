const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');

const COLLECTION = 'teachers';

// Teacher yaratish
async function createTeacher(data) {
  const db = getDB();
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const teacher = {
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    phone: data.phone || '',
    adminCustomerId: new ObjectId(data.adminCustomerId),
    students: [],
    status: data.status || 'active',
    createdAt: new Date()
  };
  
  const result = await db.collection(COLLECTION).insertOne(teacher);
  
  // AdminCustomerga teacher ni qo'shish
  await db.collection('admincustomers').updateOne(
    { _id: new ObjectId(data.adminCustomerId) },
    { $push: { teachers: result.insertedId } }
  );
  
  return { ...teacher, _id: result.insertedId };
}

// AdminCustomerga tegishli teacherlar
async function findByAdminId(adminCustomerId) {
  const db = getDB();
  return await db.collection(COLLECTION)
    .find({ adminCustomerId: new ObjectId(adminCustomerId) })
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

// Email bo'yicha topish
async function findByEmail(email) {
  const db = getDB();
  return await db.collection(COLLECTION).findOne({ 
    email: email.toLowerCase() 
  });
}

module.exports = {
  createTeacher,
  findByAdminId,
  findById,
  findByEmail,
  COLLECTION
};