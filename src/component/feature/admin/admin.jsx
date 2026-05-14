import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Users,
  UserCheck,
  BookOpen,
  Upload,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataService from "../../../services/axios";

const AdminUploadPanel = () => {
  const navigate = useNavigate();
  const studentInputRef = useRef(null);
  const teacherInputRef = useRef(null);
  const courseInputRef = useRef(null);
  const chrInputRef = useRef(null);
  const enrollmentInputRef = useRef(null);

  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingChr, setLoadingChr] = useState(false);
  const [loadingEnrollment, setLoadingEnrollment] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  // Separate states for sessions to prevent data mix-up
  const [studentSession, setStudentSession] = useState("");
  const [chrSession, setChrSession] = useState("");
  const [enrollmentSession, setEnrollmentSession] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await DataService.get("session/list");
        setSessions(res.data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };
    fetchSessions();
  }, []);

  const addUploadedFile = (fileName, type, status, message) => {
    const newFile = {
      id: Date.now(),
      fileName,
      type,
      status,
      message,
      timestamp: new Date().toLocaleString(),
    };
    setUploadedFiles((prev) => [newFile, ...prev]);
  };

  const handleStudentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!studentSession) {
      alert("Please select a session for Student upload!");
      return;
    }

    setLoadingStudent(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", studentSession);

    try {
      const response = await DataService.post("student/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const msg = response.data.Message || response.data || "Students uploaded!";
      alert(msg);
      addUploadedFile(file.name, "Student", "success", msg);
    } catch (err) {
      const errorMsg = err.response?.data || "Error uploading students";
      alert(errorMsg);
      addUploadedFile(file.name, "Student", "error", errorMsg);
    } finally {
      setLoadingStudent(false);
      event.target.value = "";
    }
  };

  const handleTeacherUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoadingTeacher(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await DataService.post("teacher/upload", formData);
      alert(response.data || "Teachers uploaded successfully!");
      addUploadedFile(file.name, "Teacher", "success", response.data || "Uploaded successfully");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Error uploading teachers";
      alert(errorMsg);
      addUploadedFile(file.name, "Teacher", "error", errorMsg);
    } finally {
      setLoadingTeacher(false);
      event.target.value = "";
    }
  };

  const handleCourseUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoadingCourse(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await DataService.post("course/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const msg = response.data.Message || response.data || "Courses uploaded!";
      alert(msg);
      addUploadedFile(file.name, "Course", "success", msg);
    } catch (err) {
      const errorMsg = err.response?.data || "Error uploading courses";
      alert(errorMsg);
      addUploadedFile(file.name, "Course", "error", errorMsg);
    } finally {
      setLoadingCourse(false);
      event.target.value = "";
    }
  };

  const handleChrUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!chrSession) {
      alert("Please select a session for CHR Report!");
      event.target.value = "";
      return;
    }

    setLoadingChr(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionID", chrSession);

    try {
      const response = await DataService.post("CHR/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const successMsg = response.data.Message || "CHR Report uploaded successfully!";
      alert(successMsg);
      addUploadedFile(file.name, "CHR Report", "success", successMsg);
    } catch (err) {
      const errorMsg = typeof err.response?.data === "string" ? err.response.data : "Error uploading CHR report";
      alert(errorMsg);
      addUploadedFile(file.name, "CHR Report", "error", errorMsg);
    } finally {
      setLoadingChr(false);
      event.target.value = "";
    }
  };

  const handleEnrollmentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!enrollmentSession) {
      alert("Please select a session for Enrollment!");
      return;
    }

    setLoadingEnrollment(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", enrollmentSession);

    try {
      const response = await DataService.post("Enrollment/UploadExcel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const msg = response.data || "Enrollment uploaded successfully!";
      alert(msg);
      addUploadedFile(file.name, "Enrollment", "success", msg);
    } catch (err) {
      const errorMsg = err.response?.data || "Error uploading Enrollment";
      alert(errorMsg);
      addUploadedFile(file.name, "Enrollment", "error", errorMsg);
    } finally {
      setLoadingEnrollment(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <input type="file" ref={studentInputRef} onChange={handleStudentUpload} accept=".xlsx,.xls" className="hidden" />
      <input type="file" ref={teacherInputRef} onChange={handleTeacherUpload} accept=".xlsx,.xls" className="hidden" />
      <input type="file" ref={courseInputRef} onChange={handleCourseUpload} accept=".xlsx,.xls" className="hidden" />
      <input type="file" ref={chrInputRef} onChange={handleChrUpload} accept=".xlsx,.xls" className="hidden" />
      <input type="file" ref={enrollmentInputRef} onChange={handleEnrollmentUpload} accept=".xlsx,.xls" className="hidden" />

      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-green-700">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Data Cell Dashboard</h1>
          <p className="text-gray-500">Upload and manage university academic records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          
          {/* Student Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-t-4 border-blue-500">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4"><Users className="text-blue-600" size={32} /></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Student</h3>
              <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1"><Info size={12}/> Needs: UserID, Name, CGPA</p>
              <select value={studentSession} onChange={(e) => setStudentSession(e.target.value)} className="mb-3 w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                <option value="">Select Session</option>
                {sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <button onClick={() => studentInputRef.current.click()} disabled={loadingStudent} className="w-full bg-[#108944] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-70">
                {loadingStudent ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {loadingStudent ? "Processing..." : "Upload Now"}
              </button>
            </div>
          </div>

          {/* Teacher Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-t-4 border-purple-500">
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 p-4 rounded-full mb-4"><UserCheck className="text-purple-600" size={32} /></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Teacher</h3>
              <div className="mb-[42px]"></div>
              <button onClick={() => teacherInputRef.current.click()} disabled={loadingTeacher} className="w-full bg-[#108944] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-70">
                {loadingTeacher ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {loadingTeacher ? "Processing..." : "Upload Now"}
              </button>
            </div>
          </div>

          {/* Course Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-t-4 border-orange-500">
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-100 p-4 rounded-full mb-4"><BookOpen className="text-orange-600" size={32} /></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Course</h3>
              <div className="mb-[42px]"></div>
              <button onClick={() => courseInputRef.current.click()} disabled={loadingCourse} className="w-full bg-[#108944] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-70">
                {loadingCourse ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {loadingCourse ? "Processing..." : "Upload Now"}
              </button>
            </div>
          </div>

          {/* CHR Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-t-4 border-green-500">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-4"><FileText className="text-[#108944]" size={32} /></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">CHR Report</h3>
              <p className="text-[10px] text-transparent mb-2">spacer</p>
              <select value={chrSession} onChange={(e) => setChrSession(e.target.value)} className="mb-3 w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                <option value="">Select Session</option>
                {sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <button onClick={() => chrInputRef.current.click()} disabled={loadingChr} className="w-full bg-[#108944] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-70">
                {loadingChr ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {loadingChr ? "Processing..." : "Upload Now"}
              </button>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-t-4 border-indigo-500">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-4"><Users className="text-indigo-600" size={32} /></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Enrollment</h3>
              <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1"><Info size={12}/> Needs: Section, Grade</p>
              <select value={enrollmentSession} onChange={(e) => setEnrollmentSession(e.target.value)} className="mb-3 w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                <option value="">Select Session</option>
                {sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <button onClick={() => enrollmentInputRef.current.click()} disabled={loadingEnrollment} className="w-full bg-[#108944] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-70">
                {loadingEnrollment ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {loadingEnrollment ? "Processing..." : "Upload Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Uploads Table */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recently Uploaded Files</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">File Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Message</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedFiles.map((file) => (
                    <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{file.fileName}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">{file.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        {file.status === "success" ? (
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle size={16} /> Success</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">× Failed</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{file.message}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">{file.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUploadPanel;