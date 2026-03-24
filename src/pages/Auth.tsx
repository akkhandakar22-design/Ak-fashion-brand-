import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google!');
      navigate('/');
    } catch (error: any) {
      console.error('Google Auth error:', error);
      toast.error(error.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container bg-white">
      <div className="p-8 space-y-8">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="p-2 bg-gray-100 rounded-full text-gray-600">
          <ChevronLeft size={24} />
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-gray-500">{isLogin ? 'Sign in to continue shopping' : 'Join Ak Shop today'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Full Name" 
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 outline-none"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 outline-none"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-sm font-bold text-primary">Forgot Password?</button>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}</span>
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold flex items-center justify-center space-x-3 active:scale-95 transition-transform disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Google</span>
        </button>

        <div className="text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="text-primary font-bold">{isLogin ? 'Sign Up' : 'Sign In'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
