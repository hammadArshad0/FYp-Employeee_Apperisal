// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import HODLayout from './component/common/hodLayout';
import DirectorLayout from './component/common/directorLayout';
import Teacherlayout from './component/common/teacherLayout';

// --- PAGES & COMPONENTS ---
import LoginPage from './component/auth/LoginPage';
import SignupPage from './component/auth/SignupPage';
import HODDashboard from './component/feature/hod/dashbord';
import AddKPI from './component/feature/hod/addKpi';
import AddPeerEvaluator from './component/feature/hod/addPeerEvaluator';
import SeePerformance from './component/feature/hod/seePerformance';
import CourseManagement from './component/feature/hod/courseManagment';
import StudentDashboard from './component/feature/student/StudentDashboard';
import AdminUploadPanel from './component/feature/admin/admin';
import DirectorDashboard from './component/feature/director/dashborad';
import MakeQuestionnaireStudent from './component/feature/director/QuestionnaireManagemen';
import CreateEvaluationQuestionaire from './component/feature/director/createQuestionnaire';
import EditEvaluationQuestionnaire from './component/feature/director/editQuestionnaire';
import EvaluationForm from './component/feature/student/EvaluationForm';
import CHRManagement from './component/feature/hod/chrManagment';
import TeacherStats from './component/feature/teacher/TeacherDashboard';
import ClassHeldReport from './component/feature/teacher/ClassHeldReport';
import PeerEvaluation from './component/feature/teacher/peerEvaluation';
import SeeCourseManagement from './component/feature/teacher/coursemanagment';
import SeePerformanceTeacher from './component/feature/teacher/SeeperformanceTeacher';
import CHRDetails from './component/feature/teacher/CHRDetails';
import PeerEvaluationForm from './component/feature/teacher/PeerEvaluationForm';

// --- CONFIDENTIAL COMPONENTS ---
// Admin view
import ConfidentialEvaluationsForm from './component/feature/student/confidentialEvalForm'; // S03 Form
import ConfidentialEvaluationsData from './component/feature/student/confidentialEvalution'; // S03 List
import ConfidentialEvaluations from './component/feature/director/seeConfidentialEvaluations';
import SocietyManagement from './component/feature/hod/SocietyManagement';
import EmailSettings from './component/feature/director/EmailSettings';
import FilterPerformance from './component/feature/director/FilterPerformance';
import ComparisonPage from './component/feature/director/Detailscomparison';
import AcademicPerformance from './component/feature/director/academicPerformnce';
import TeacherQuestionsRatingSee from './component/feature/director/teacherQuestionsRatingSee';
import ChairpersonMentorEval from './component/feature/teacher/ChairpersonMentorEval';
import HODChairpersonEval from './component/feature/hod/HODChairpersonEval';
import MyPerformanceAcdemic from './component/feature/teacher/myPerformanceAcdemic';
import CourseComparison from './component/feature/teacher/courseComparison';
import QuestionRatings from './component/feature/teacher/Questionratings';
import CourseEvalutionRating from './component/feature/director/CourseEvalutionRating';
import QuestionRatingDetail from './component/feature/director/courseEvalutionQuestionRating';
import CriticalAnalyticsScreen from './component/feature/director/criticalAnalytics';

// --- PROTECTED ROUTE LOGIC ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  // userId ko define karna zaroori hai taake condition chale
  const userId = localStorage.getItem('userId') || (user ? user.id : null);

  if (!user) return <Navigate to="/login" replace />;

  // Agar user ka role allowed nahi hai, toh usey uske sahi dashboard par bhejo
  if (allowedRole && user.role !== allowedRole) {
    const rolePaths = {
      Director: "/director-dashboard",
      HOD: "/hod-dashboard",
      Teacher: "/teacher-dashboard",
      Student: "/student-dashboard",
      // userId === "2" ? "/student/confidential-evaluation" :
      Admin: "/admin-dashboard"
    };
    return <Navigate to={rolePaths[user.role] || "/login"} replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* --- DIRECTOR ROUTES --- */}
        <Route path="/director-dashboard" element={<ProtectedRoute allowedRole="Director"><DirectorLayout /></ProtectedRoute>}>
          <Route index element={<DirectorDashboard />} />
          <Route path="make-questionnaire" element={<MakeQuestionnaireStudent />} />
          <Route path="add-new" element={<CreateEvaluationQuestionaire />} />
          <Route path="edit/:id" element={<EditEvaluationQuestionnaire />} />
          <Route path="add-kpi" element={<AddKPI />} />
          <Route path="performance" element={<SeePerformance />} />
          <Route path="confidential" element={<ConfidentialEvaluations />} />
          <Route path="email" element={<EmailSettings />} />
          <Route path="filter-performance" element={<FilterPerformance />} />
          <Route path="filter-performance/comparison" element={<ComparisonPage />} />
          <Route path="academic-performance" element={<AcademicPerformance />} />
          <Route path="teacher-performance/:id" element={<TeacherQuestionsRatingSee />} />
          <Route path="course-evaluation" element={<CourseEvalutionRating />} />
          <Route path="course-evaluation/question-rating-detail/:teacherId/:sessionId/:courseCode/:evalType"element={<QuestionRatingDetail />}/>
          <Route path="critical-analytics" element={<CriticalAnalyticsScreen />} />
        </Route>

        {/* --- HOD ROUTES --- */}
        <Route path="/hod-dashboard" element={<ProtectedRoute allowedRole="HOD"><HODLayout /></ProtectedRoute>}>
          <Route index element={<HODDashboard />} />
          <Route path="add-kpi" element={<AddKPI />} />
          <Route path="add-evaluator" element={<AddPeerEvaluator />} />
          <Route path="performance" element={<SeePerformance />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="chr" element={<CHRManagement />} />
          <Route path="societies" element={<SocietyManagement />} />
          <Route path="society-evaluation" element={<HODChairpersonEval />} />

        </Route>

        {/* --- TEACHER ROUTES --- */}
        <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRole="Teacher"><Teacherlayout /></ProtectedRoute>}>
          <Route index element={<TeacherStats />} />
          <Route path="performance" element={<SeePerformanceTeacher />} />
          <Route path="Class-report" element={<ClassHeldReport />} />
          <Route path="Class-report/details" element={<CHRDetails />} />
          <Route path="courses" element={<SeeCourseManagement />} />
          <Route path="peer" element={<PeerEvaluation />} />
          <Route path="evaluate/:teacherId/:courseCode" element={<PeerEvaluationForm />} />
          <Route path="society-evaluation" element={<ChairpersonMentorEval />} />
          <Route path="acdemic-performance" element={<MyPerformanceAcdemic />} />
          <Route path="acdemic-performance/course-comparison" element={<CourseComparison />} />
          <Route path="acdemic-performance/question-ratings" element={<QuestionRatings />} />
        </Route>

        {/* --- STUDENT ROUTES --- */}
        <Route path="/student-dashboard" element={<ProtectedRoute allowedRole="Student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/evaluate" element={<ProtectedRoute allowedRole="Student"><EvaluationForm /></ProtectedRoute>} />

        {/* --- S03 SPECIAL ROUTES (STUDENT ROLE) --- */}
        <Route
          path="/student/confidential-evaluation"
          element={
            <ProtectedRoute allowedRole="Student">
              <ConfidentialEvaluationsData />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/confidential-evaluation/confidential-form"
          element={
            <ProtectedRoute allowedRole="Student">
              <ConfidentialEvaluationsForm />
            </ProtectedRoute>
          }
        />

        {/* --- ADMIN ROUTES --- */}
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="Admin"><AdminUploadPanel /></ProtectedRoute>} />

        {/* Catch-all Redirect */}
        {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
      </Routes>
    </Router>
  );
};

export default App;