
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from "../../assets/bg-logo.png"; 
import bgImage from "../../assets/biit_image.png"; 

const SignupPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = (e) => {
    e.preventDefault();

    
    const existingUsers = JSON.parse(localStorage.getItem('db_users')) || [];

  
    if (existingUsers.find(user => user.email === formData.email)) {
      alert("This email is already registered!");
      return;
    }

  
    const updatedUsers = [...existingUsers, formData];

    
    localStorage.setItem('db_users', JSON.stringify(updatedUsers));

    alert("Account Created Successfully! Please Login.");
    navigate('/login');
  };

  return (
    
    <div className="relative min-h-screen flex items-center justify-center py-2 px-4 sm:px-6 lg:px-8">
      
  
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

  
      <div className="relative z-10 max-w-md w-full bg-white/85 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-100">
        
 
        <div className="text-center mb-4">
   
          <img 
            src={logo} 
            alt="BIIT Logo" 
            className="h-20 w-auto mx-auto mb-2 object-contain"
          />

          <h2 className="text-2xl font-extrabold text-green-800">Join BIIT Portal</h2>
          <p className="mt-1 text-xs text-gray-600 font-medium uppercase tracking-wider">
            Barani Institute of Information Technology
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSignup}>
          
       
          <div>
            <label className="block text-sm font-semibold text-gray-700">Full Name</label>
            <div className="mt-1">
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
                placeholder="Muhammad Ahmed"
                onChange={handleChange}
              />
            </div>
          </div>

      
          <div>
            <label className="block text-sm font-semibold text-gray-700">Email Address</label>
            <div className="mt-1">
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
                placeholder="student@biit.edu.pk"
                onChange={handleChange}
              />
            </div>
          </div>

       
          <div>
            <label className="block text-sm font-semibold text-gray-700">Password</label>
            <div className="mt-1">
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
          </div>

      
          <div>
            <label className="block text-sm font-semibold text-gray-700">Select Role</label>
            <div className="mt-1">
              <select
                name="role"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all cursor-pointer shadow-sm"
                onChange={handleChange}
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="HOD">HOD</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

      
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Create Account
            </button>
          </div>
        </form>

    
        <div className="mt-6 text-center border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-green-700 hover:text-green-900 hover:underline">
              Log in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default SignupPage;