import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DataService from '../../services/axios'; // Axios instance
import logo from "../../assets/bg-logo.png"; 
import bgImage from "../../assets/biit_image.png"; 

const LoginPage = () => {
  const [userId, setUserId] = useState('');  // Use UserID, not email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send as query string because backend expects id and password as simple parameters
      const response = await DataService.post(
        `Users/Login?id=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`
      );

      const user = {
        id: userId,
        role: response.data.role,
        name: response.data.role === 'HOD' ? 'Dr. Munir' : userId,
      };

      // Save user in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Navigate based on role
      switch (user.role) {
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
    <div className="relative min-h-screen flex items-center justify-center">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-green-800/65"></div>
      </div>

      <div className="relative z-10 bg-white/70 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="text-center">
          <img src={logo} alt="BIIT Logo" className="h-24 w-auto mx-auto mb-4 object-contain drop-shadow-md"/>
          <h1 className="text-3xl font-extrabold text-green-800 tracking-tight">BIIT</h1>
          <p className="text-gray-700 font-semibold text-xs tracking-widest uppercase mt-2">
            Barani Institute of Information Technology
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">User ID</label>
            <input 
              type="text" 
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-all outline-none shadow-sm" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your User ID"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-all outline-none shadow-sm" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-800 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {loading ? 'Logging in...' : 'Login to Portal'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            New Student or Faculty? <Link to="/login" className="text-green-700 font-bold hover:underline ml-1">login Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
