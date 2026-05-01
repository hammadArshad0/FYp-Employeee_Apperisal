import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import DataService from '../../../services/axios';

const ConfidentialEvaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = async () => {
    try {
      const res = await DataService.get("/email/getall");
      setEmailList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvaluations = async (email) => {
    if (!email) return;
    try {
      setLoading(true);
      setEvaluations([]);

      const res = await DataService.post("/email/get-evaluations", { mail: email });
      const result = res.data;
      console.log("RAW DATA:", JSON.stringify(result, null, 2));

      if (!result.success) {
  alert("Error: " + result.error + "\nDetail: " + (result.detail || ''));
  return;
}
      if (!result.success) {
        alert("Error: " + (result.error || "Unknown error"));
        return;
      }

      setEvaluations(result.data || []);
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const scoreLabel = (score) => {
    const s = Number(score) || 0;
    if (s >= 4) return { label: 'Excellent', color: 'bg-green-50 text-green-700 border border-green-100' };
    if (s >= 3) return { label: 'Good',      color: 'bg-blue-50 text-blue-700 border border-blue-100' };
    if (s >= 2) return { label: 'Fair',      color: 'bg-orange-50 text-orange-700 border border-orange-100' };
    return              { label: 'Poor',      color: 'bg-red-50 text-red-700 border border-red-100' };
  };

  // ✅ camelCase aur PascalCase dono se value nikalo
  const val = (obj, ...keys) => {
    if (!obj) return null;
    for (let k of keys) {
      if (obj[k] != null) return obj[k];
      const c = k.charAt(0).toLowerCase() + k.slice(1);
      if (obj[c] != null) return obj[c];
      const p = k.charAt(0).toUpperCase() + k.slice(1);
      if (obj[p] != null) return obj[p];
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

      {/* Email Dropdown */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <label className="block text-sm text-gray-500 mb-2">Email select karein</label>
        <select
          value={selectedEmail}
          onChange={(e) => {
            setSelectedEmail(e.target.value);
            fetchEvaluations(e.target.value);
          }}
          className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="">-- Email Select Karein --</option>
          {emailList.map((e) => (
            <option key={e.id} value={e.mail}>{e.mail}</option>
          ))}
        </select>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[2rem] p-6 shadow border">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-purple-700 text-white rounded-3xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black">Confidential Reviews</h3>
            <p className="text-xs text-gray-500">
              {evaluations.length > 0
                ? `${evaluations.length} teacher evaluation(s) mili hain`
                : 'Koi email select karein'}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" size={40} />
          </div>
        )}

        {/* No Data */}
        {!loading && evaluations.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <ShieldCheck size={50} className="mx-auto mb-2" />
            <p>Koi evaluation nahi mili</p>
          </div>
        )}

        {/* Evaluations List */}
        <div className="space-y-6">
          {evaluations.map((item, idx) => {

            // ✅ dono formats se data nikalo
            const studentName = val(item, 'studentName', 'StudentName') || 'N/A';
            const studentId   = val(item, 'studentId',   'StudentId', 'StudentID') || 'N/A';
            const session     = val(item, 'session',     'Session') || 'N/A';
            const teacherName = val(item, 'teacherName', 'TeacherName') || 'N/A';
            const teacherId   = val(item, 'teacherId',   'TeacherId', 'TeacherID') || 'N/A';
            const subjectCode = val(item, 'subjectCode', 'SubjectCode', 'courseCode', 'CourseCode') || 'N/A';
            const submittedOn = val(item, 'submittedOn', 'SubmittedOn');

            // ✅ evaluation array - camelCase ya PascalCase
            const evals = val(item, 'evaluation', 'Evaluation', 'Evaluations', 'evaluations') || [];

            // ✅ Unique questions - dono field name formats check karo
            const uniqueEvals = evals.filter((q, i, arr) =>
              arr.findIndex(x =>
                (val(x, 'questionText', 'Question', 'QuestionText') || '') ===
                (val(q, 'questionText', 'Question', 'QuestionText') || '')
              ) === i
            );

            const avgScore = uniqueEvals.length > 0
              ? (uniqueEvals.reduce((s, q) =>
                  s + (Number(val(q, 'score', 'Score')) || 0), 0
                ) / uniqueEvals.length).toFixed(1)
              : 'N/A';

            return (
              <div key={idx} className="border-2 border-purple-100 rounded-2xl overflow-hidden">

                {/* Student Header */}
                <div className="bg-purple-700 text-white p-4">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-lg font-bold">{studentName}</p>
                      <p className="text-sm text-purple-200">Student ID: {studentId}</p>
                      <p className="text-sm text-purple-200">Session: {session}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-200">
                        {submittedOn
                          ? new Date(submittedOn).toLocaleDateString('en-PK')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teacher + Course */}
                <div className="bg-gray-900 text-white p-3 flex justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold">{teacherName}</p>
                    <p className="text-xs text-gray-400">Teacher ID: {teacherId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{subjectCode}</p>
                    <p className="text-xs mt-1">
                      Avg Score: <span className="text-yellow-300 font-bold">{avgScore}</span>
                    </p>
                  </div>
                </div>

                {/* Questions */}
                {uniqueEvals.length === 0 ? (
                  <div className="p-4 text-gray-400 text-sm text-center">
                    Koi question nahi mila
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {uniqueEvals.map((q, qIdx) => {
                      const score    = Number(val(q, 'score', 'Score')) || 0;
                      const question = val(q, 'questionText', 'Question', 'QuestionText') || `Question ${qIdx + 1}`;
                      const { label, color } = scoreLabel(score);
                      return (
                        <div key={qIdx} className="flex justify-between items-center gap-4 p-3 bg-white hover:bg-gray-50">
                          <p className="text-sm text-gray-700 flex-1">{question}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${color}`}>
                            {label} ({score})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default ConfidentialEvaluations;