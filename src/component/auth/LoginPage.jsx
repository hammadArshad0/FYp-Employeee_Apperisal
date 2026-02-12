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
      // Backend request
      const response = await DataService.post(
        `Users/Login?id=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`
      );

      // --- ERROR FIX START ---
      // Hum poora object bhi save karenge aur 'userId' ko alag se bhi 
      // taake dashboard ko direct T001 mil jaye.
      const userData = {
        id: userId,
        role: response.data.role,
        name: response.data.role === 'HOD' ? 'Dr. Munir' : (response.data.Name || response.data.FullName || userId),
      };

      // 1. Dashboard ki API calls ke liye direct ID save karein
      localStorage.setItem('userId', userId); 

      // 2. Profile aur checks ke liye poora object save karein
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log("Login Success! Saved ID:", userId);
      // --- ERROR FIX END ---

      // Navigation Logic
      switch (userData.role) {
        case 'HOD': navigate('/hod-dashboard'); break;
        case 'Teacher': navigate('/teacher-dashboard'); break;
        case 'Student': navigate('/student-dashboard'); break;
        case 'Admin': navigate('/admin-dashboard'); break;
        case 'Director': navigate('/director-dashboard'); break;
        default: navigate('/'); 
      }

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setError('Invalid UserID or Password');
      } else {
        setError('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans">
      {/* Background Section */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-green-900/70"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center">
          <img src={logo} alt="BIIT Logo" className="h-24 w-auto mx-auto mb-4 object-contain drop-shadow-xl"/>
          <h1 className="text-4xl font-black text-green-800 tracking-tighter uppercase italic">BIIT</h1>
          <p className="text-gray-600 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">
            Barani Institute of Information Technology
          </p>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-xs font-bold animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mt-8">
          <div className="group">
            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">User ID</label>
            <input 
              type="text" 
              className="w-full p-4 bg-white/50 border-2 border-transparent rounded-2xl focus:border-green-600 focus:bg-white transition-all outline-none shadow-sm font-bold text-gray-700 placeholder:text-gray-300" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. T001"
              required 
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full p-4 bg-white/50 border-2 border-transparent rounded-2xl focus:border-green-600 focus:bg-white transition-all outline-none shadow-sm font-bold text-gray-700 placeholder:text-gray-300" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-700 hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg shadow-green-900/20 active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-xs mt-4 flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2 italic">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : 'Login to Portal'}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-gray-200/50 pt-6">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">
            New Student or Faculty? 
            <Link to="/login" className="text-green-700 font-black hover:text-black transition-colors ml-1 underline decoration-2 underline-offset-4">LOGIN NOW</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;