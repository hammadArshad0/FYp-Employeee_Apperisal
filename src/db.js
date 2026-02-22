import Dexie from 'dexie';

export const db = new Dexie('ConfidentialDB');
db.version(1).stores({
  // studentId par indexing zaroori hai taake dashboard wahi data uthaye
  evaluations: 'id, studentId, courseCode, enrollmentId' 
});