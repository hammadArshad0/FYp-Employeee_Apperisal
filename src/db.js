// src/db/dexieDB.js
// import Dexie from 'dexie';

// const db = new Dexie('ConfidentialEvaluationDB');

// db.version(1).stores({
//   // Primary key: [studentId+enrollmentId+questionId] - composite unique key
//   evaluations: '[studentId+enrollmentId+questionId], studentId, teacherId, sessionId, enrollmentId'
// });

// export default db;

// src/db/dexieDB.js
// import Dexie from 'dexie';

// const db = new Dexie('ConfidentialEvaluationDB');

// db.version(2).stores({
//   evaluations: `
//     [studentId+enrollmentId+questionId],
//     [teacherId+sessionId],
//     studentId,
//     teacherId,
//     sessionId,
//     enrollmentId
//   `
// });

// export default db;


// src/db/dexieDB.js

import Dexie from 'dexie';

const db = new Dexie('ConfidentialEvaluationDB');

db.version(1).stores({
  evaluations:
    '[studentId+enrollmentId+questionId], studentId, teacherId, sessionId, enrollmentId'
});

// ✅ Updated Schema
db.version(2).stores({
  evaluations: `
    [studentId+enrollmentId+questionId],
    studentId,
    studentName,
    teacherId,
    sessionId,
    enrollmentId,
    questionId,
    questionText,
    questionType,
    isCritical,
    courseCode,
    score
  `
});

export default db;