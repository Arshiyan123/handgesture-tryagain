import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '@/components/GameCard';

export default function GameLibrary() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const stored = localStorage.getItem('neon_current_user');
    if (!stored) {
      navigate('/auth');
      return;
    }
    setUser(JSON.parse(stored));
  }, [navigate]);
  const handleLogout = () => {
    localStorage.removeItem('neon_current_user');
    navigate('/auth');
  };
  if (!user) return null;
  return (
    <div className="min-h-screen grid-bg relative">
      <div className="scanline absolute inset-0 pointer-events-none opacity-20" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-3">
              <span className="font-body text-sm text-muted-foreground">
                👾 {user.username || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-lg border border-border bg-muted/30 font-display text-xs font-bold tracking-wider text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all"
              >
                LOGOUT
              </button>
            </div>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight neon-text text-primary mb-4">
            NEON ARCADE
          </h1>
          <p className="font-body text-xl text-muted-foreground max-w-lg mx-auto">
            Play with your hands — or your keyboard. Camera-powered gesture controls meet classic arcade games.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted-foreground font-body">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
              Hand Tracking
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-neon" />
              Keyboard Fallback
            </span>
          </div>
        </div>

        {/* Game Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <GameCard
            title="Flappy Bird"
            description="Navigate through pipes by raising your hand or pressing Space. How far can you fly?"
            icon="🐦"
            route="/flappy-bird"
            color="green"
          />
          <GameCard
            title="Pong"
            description="Move your hand up and down to control the paddle — or use arrow keys. Beat the AI!"
            icon="🏓"
            route="/pong"
            color="purple"
          />
        </div>

        {/* Controls Info */}
        <div className="mt-16 rounded-xl border border-border bg-card/50 p-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">HOW TO PLAY</h2>
          <div className="grid md:grid-cols-2 gap-6 font-body text-muted-foreground">
            <div>
              <h3 className="text-primary font-semibold mb-2">✋ Hand Gestures</h3>
              <ul className="space-y-1 text-sm">
                <li>• Allow camera access when prompted</li>
                <li>• <strong>Flappy Bird:</strong> Raise your hand to flap</li>
                <li>• <strong>Pong:</strong> Move hand up/down to control paddle</li>
              </ul>
            </div>
            <div>
              <h3 className="text-secondary font-semibold mb-2">⌨️ Keyboard</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Flappy Bird:</strong> Space or ↑ to flap</li>
                <li>• <strong>Pong:</strong> ↑ / ↓ arrow keys</li>
                <li>• Works alongside or without camera</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
