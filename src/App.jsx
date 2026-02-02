// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import HODLayout from './component/common/hodLayout';
import DirectorLayout from './component/common/directorLayout'; // Create this based on your image

// --- PUBLIC PAGES ---
import LoginPage from './component/auth/LoginPage';
import SignupPage from './component/auth/SignupPage';

// --- HOD COMPONENTS ---
import HODDashboard from './component/feature/hod/dashbord';
import AddKPI from './component/feature/hod/addKpi';
import AddPeerEvaluator from './component/feature/hod/addPeerEvaluator';
import SeePerformance from './component/feature/hod/seePerformance';
import CourseManagement from './component/feature/hod/courseManagment';


import TeacherDashboard from './component/feature/teacher/TeacherDashboard';
import StudentDashboard from './component/feature/student/StudentDashboard';
import AdminUploadPanel from './component/feature/admin/admin';
import DirectorDashboard from './component/feature/director/dashborad';
import MakeQuestionnaireTeacher from './component/feature/director/makeQuestionnaireTeacher';
import MakeQuestionnaireStudent from './component/feature/director/makeQuestionnaireStudent';
import ConfidentialEvaluations from './component/feature/director/confidentialEvaluations';
import EvaluationForm from './component/feature/student/EvaluationForm';


const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRole && user.role !== allowedRole) {
    const rolePaths = {
      Director: "/director-dashboard",
      HOD: "/hod-dashboard",
      Teacher: "/teacher-dashboard",
      Student: "/student-dashboard",
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
      
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />




        <Route 
          path="/director-dashboard" 
          element={
            <ProtectedRoute allowedRole="Director">
              <DirectorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DirectorDashboard />} />
          <Route path="make-questionnaire-teacher" element={<MakeQuestionnaireTeacher />} />
            <Route path="make-questionnaire-student" element={<MakeQuestionnaireStudent />} />
          <Route path="add-kpi" element={<AddKPI />} />
          <Route path="performance" element={<SeePerformance />} />
          <Route path="confidential" element={<ConfidentialEvaluations />} />
        </Route>

 
        <Route 
          path="/hod-dashboard" 
          element={
            <ProtectedRoute allowedRole="HOD">
              <HODLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HODDashboard />} />
          <Route path="add-kpi" element={<AddKPI />} />
          <Route path="add-evaluator" element={<AddPeerEvaluator />} />
          <Route path="performance" element={<SeePerformance />} />
          <Route path="courses" element={<CourseManagement/>} />
        </Route>

      
        <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRole="Teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/student-dashboard" element={<ProtectedRoute allowedRole="Student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="Admin"><AdminUploadPanel /></ProtectedRoute>} />
        <Route path="/student/evaluate" element={<ProtectedRoute allowedRole="Student"><EvaluationForm /></ProtectedRoute>} />

        {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
      </Routes>
    </Router>
  );
};

export default App;