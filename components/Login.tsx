
import React, { useState } from 'react';
import { GitBranch, Lock, Mail, ArrowRight, Loader2, User as UserIcon } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('darren@nexus.ai');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isLogin) {
        res = await authService.login(email, password);
      } else {
        res = await authService.signup(name, email, password);
      }

      if (res.success && res.data) {
        onLogin(res.data);
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    // Clear demo creds if switching to signup
    if (isLogin) {
      setEmail('');
      setPassword('');
      setName('');
    } else {
      setEmail('darren@nexus.ai');
      setPassword('password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 pb-0 flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <GitBranch className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isLogin ? 'Welcome back' : 'Create an account'}</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {isLogin ? 'Sign in to your autonomous engineering workspace' : 'Start automating your workflow today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all outline-none text-sm bg-white text-gray-900 placeholder-gray-400"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all outline-none text-sm bg-white text-gray-900 placeholder-gray-400"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all outline-none text-sm bg-white text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"/> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>}
          </button>
          
          <div className="text-center mt-2">
            <button type="button" onClick={toggleMode} className="text-xs text-blue-600 hover:underline">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {isLogin && (
            <div className="text-center mt-4 text-xs text-gray-400">
               Demo Credentials: <b>darren@nexus.ai</b> / <b>password</b>
            </div>
          )}
        </form>
      </div>
      <div className="mt-8 text-center text-xs text-gray-400">
        &copy; 2025 Nexus AI Inc. Protected Environment.
      </div>
    </div>
  );
};

export default Login;
