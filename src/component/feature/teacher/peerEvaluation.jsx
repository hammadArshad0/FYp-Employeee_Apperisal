import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ShieldCheck, Loader2, BookOpen, ArrowRight, ShieldAlert } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvaluation = () => {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEvaluator, setIsEvaluator] = useState(false);
  const navigate = useNavigate();

  const loggedInTeacherId = localStorage.getItem('userId'); 

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    try {
      setLoading(true);
      // 1. Pehle check karein kya ye peer evaluator hai
      const accessRes = await DataService.get(`/Peer/CheckPeerStatus/${loggedInTeacherId}`);
      
      if (accessRes.data.isPeerEvaluator) {
        setIsEvaluator(true);
        // 2. Agar hai toh list fetch karein
        const targetRes = await DataService.get(`/Peer/GetTeachersToEvaluate/${loggedInTeacherId}`);
        setPeers(targetRes.data);
      } else {
        setIsEvaluator(false);
      }
    } catch (err) {
      console.error("Error fetching peer data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Loading State ---
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-green-700" size={48} />
      <p className="font-black text-gray-400 uppercase tracking-widest text-sm text-center">
        Verifying Credentials & <br/> Synchronizing Colleagues...
      </p>
    </div>
  );

  // --- No Access View ---
  if (!isEvaluator) return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in duration-700">
      <div className="bg-red-50 p-8 rounded-[3rem] border-2 border-red-100 max-w-md">
        <div className="bg-red-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
          <ShieldAlert size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2 uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-gray-500 font-medium leading-relaxed">
          You are not designated as a <span className="text-red-600 font-bold">Peer Evaluator</span> for the current academic session.
        </p>
        <button 
          onClick={() => navigate('/teacher-dashboard')}
          className="mt-8 bg-gray-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  // --- Main List View (Peer Evaluator Only) ---
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-green-700 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-green-100 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Peer Evaluation</h2>
          <p className="text-green-100 font-medium opacity-90">Select a colleague from the enrollment list to begin evaluation.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 relative z-10">
          <ShieldCheck size={48} className="text-white" />
        </div>
        <UserCheck size={180} className="absolute -right-10 -bottom-10 text-white opacity-10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {peers.length > 0 ? (
          peers.map((peer, index) => (
            <div key={index} className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 flex items-center justify-between group hover:border-green-600 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-green-50">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-green-700 group-hover:text-white transition-all shadow-inner">
                  <span className="text-xl font-black uppercase">{peer.TeacherName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-800 leading-tight">{peer.TeacherName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen size={14} className="text-green-600" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      {peer.CourseTitle} ({peer.CourseCode})
                    </p>
                  </div>
                  {peer.IsEvaluated && (
                    <span className="mt-2 inline-block bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">Completed</span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => navigate(`/teacher-dashboard/peer-form/${peer.TeacherID}/${peer.CourseCode}`)}
                disabled={peer.IsEvaluated}
                className={`p-4 rounded-2xl transition-all shadow-lg hover:scale-110 active:scale-95 
                  ${peer.IsEvaluated 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                    : 'bg-green-700 text-white hover:bg-black group-hover:shadow-green-100'}`}
              >
                <ArrowRight size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest italic">No colleagues found for evaluation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerEvaluation;