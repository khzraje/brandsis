import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

const Login = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = await auth.login(user.trim(), pass);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError('اسم المستخدم أو الرقم السري غير صحيح');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">تسجيل الدخول</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">ادخل اسم المستخدم وكلمة المرور</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">اسم المستخدم</label>
            <input value={user} onChange={e => setUser(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="اسم المستخدم" />
          </div>
          <div>
            <label className="block text-sm mb-1">الرقم السري</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="الرقم السري" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <button type="submit" className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium" disabled={loading}>
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </div>
          {/* credential hint removed for security */}
        </form>
      </div>
    </div>
  );
};

export default Login;
