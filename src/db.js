// src/db/dexieDB.js
import Dexie from 'dexie';

const db = new Dexie('ConfidentialEvaluationDB');

db.version(1).stores({
  // Primary key: [studentId+enrollmentId+questionId] - composite unique key
  evaluations: '[studentId+enrollmentId+questionId], studentId, teacherId, sessionId, enrollmentId'
});

export default db;