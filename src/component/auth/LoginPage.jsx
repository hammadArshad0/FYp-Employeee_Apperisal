import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DataService from '../../services/axios'; 
import logo from "../../assets/bg-logo.png"; 
import bgImage from "../../assets/biit_image.png"; 

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await DataService.post(
        `Users/Login?id=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`
      );

      // Data extraction from enriched backend response
      const { role, userId: serverId, name, sessionName, sessionId } = response.data;

      const userData = {
        id: serverId,
        role: role,
        name: name,
        sessionName: sessionName,
        sessionId: sessionId
      };

      // Save to localStorage
      localStorage.setItem('userId', serverId); 
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('sessionName', sessionName);
      
      console.log("Login Success! User:", name);

      // Navigation Logic
      switch (role) {
        case 'HOD': navigate('/hod-dashboard'); break;
        case 'Teacher': navigate('/teacher-dashboard'); break;
        case 'Student':  navigate('/student-dashboard'); break;
          // if (serverId === '2') navigate('/student/confidential-evaluation') else;
        case 'Admin': navigate('/admin-dashboard'); break;
        case 'Director': navigate('/director-dashboard'); break;
        default: navigate('/'); 
      }

    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Invalid UserID or Password');
      } else {
        setError('Server error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans">
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-green-900/70"></div>
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-md py-5 px-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center">
          <img src={logo} alt="BIIT Logo" className="h-40 w-auto mx-auto object-contain drop-shadow-xl"/>
          <h1 className="text-3xl font-black text-green-800 tracking-tighter uppercase italic">BIIT</h1>
          <p className="text-gray-800 font-bold text-[12px] tracking-[0.2em] uppercase mt-1">Employee Performance Appraisal System</p>
        </div>

        {error && <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-xs font-bold">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4 mt-8">
          <div className="group">
            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">User ID</label>
            <input type="text" className="w-full p-4 bg-white/50 border-2 border-transparent rounded-2xl focus:border-green-600 outline-none font-bold" 
                   value={userId} onChange={(e) => setUserId(e.target.value)} placeholder=" Enter your ID" required />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input type="password" className="w-full p-4 bg-white/50 border-2 border-transparent rounded-2xl focus:border-green-600 outline-none font-bold" 
                   value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-green-700 hover:bg-black text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs mt-4 flex items-center justify-center transition-all">
            {loading ? 'Login...' : 'Login'}
          </button>
        </form>

        <div className="mt-7 text-center pt-6 border-t border-gray-200/50">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">
            New Student or Faculty? <Link to="/login" className="text-green-700 font-black ml-1 underline">LOGIN NOW</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;