import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!isLogin && !username) {
      setError('Please enter a username');
      return;
    }
    if (isLogin) {
      const users = JSON.parse(localStorage.getItem('neon_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        setError('Invalid email or password');
        return;
      }
      localStorage.setItem('neon_current_user', JSON.stringify(user));
    } else {
      const users = JSON.parse(localStorage.getItem('neon_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        setError('Email already registered');
        return;
      }
      const newUser = { email, password, username, id: Date.now().toString() };
      users.push(newUser);
      localStorage.setItem('neon_users', JSON.stringify(users));
      localStorage.setItem('neon_current_user', JSON.stringify(newUser));
    }
    navigate('/');
  };
  return (
    <div className="min-h-screen grid-bg relative flex items-center justify-center px-4">
      <div className="scanline absolute inset-0 pointer-events-none opacity-20" />
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight neon-text text-primary mb-2">
            NEON ARCADE
          </h1>
          <p className="font-body text-muted-foreground text-sm">
            {isLogin ? 'Welcome back, player.' : 'Create your arcade identity.'}
          </p>
        </div>
        {/* Card */}
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8 neon-border">
          <div className="flex mb-8 rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 font-display text-sm font-bold tracking-wider transition-all duration-300 ${
                isLogin
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 font-display text-sm font-bold tracking-wider transition-all duration-300 ${
                !isLogin
                  ? 'bg-secondary text-secondary-foreground shadow-[0_0_15px_hsl(var(--secondary)/0.4)]'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              SIGN UP
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="font-display text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your callsign"
                  className="w-full h-11 rounded-lg border border-border bg-background px-4 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="font-display text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@neonarcade.io"
                className="w-full h-11 rounded-lg border border-border bg-background px-4 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="font-display text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-lg border border-border bg-background px-4 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 font-body text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              type="submit"
              className={`w-full h-12 rounded-lg font-display text-sm font-bold tracking-widest transition-all duration-300 ${
                isLogin
                  ? 'bg-primary text-primary-foreground hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] hover:scale-[1.02]'
                  : 'bg-secondary text-secondary-foreground hover:shadow-[0_0_25px_hsl(var(--secondary)/0.5)] hover:scale-[1.02]'
              }`}
            >
              {isLogin ? 'ENTER ARCADE' : 'CREATE ACCOUNT'}
            </button>
          </form>
          <p className="mt-6 text-center font-body text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already a player? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className={`font-semibold transition-colors ${isLogin ? 'text-primary hover:text-primary/80' : 'text-secondary hover:text-secondary/80'}`}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
        <p className="mt-6 text-center font-body text-xs text-muted-foreground/50">
          🕹️ Hand-tracking powered arcade games
        </p>
      </div>
    </div>
  );
}