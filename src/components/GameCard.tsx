import { useNavigate } from 'react-router-dom';

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: 'green' | 'purple';
}

export function GameCard({ title, description, icon, route, color }: GameCardProps) {
  const navigate = useNavigate();
  const isGreen = color === 'green';

  return (
    <button
      onClick={() => navigate(route)}
      className={`game-card-hover relative overflow-hidden rounded-xl border p-8 text-left w-full
        ${isGreen ? 'border-neon-green/30 neon-border' : 'border-neon-purple/30 neon-border-purple'}
        bg-card`}
    >
      {/* Scanline overlay */}
      <div className="scanline absolute inset-0 pointer-events-none opacity-30" />
      
      <div className="relative z-10">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className={`font-display text-2xl font-bold mb-2 ${isGreen ? 'neon-text text-primary' : 'neon-text-purple text-secondary'}`}>
          {title}
        </h3>
        <p className="text-muted-foreground font-body text-lg leading-relaxed">
          {description}
        </p>
        <div className={`mt-6 inline-flex items-center gap-2 font-display text-sm font-semibold tracking-wider uppercase
          ${isGreen ? 'text-primary' : 'text-secondary'}`}>
          Play Now
          <span className="text-lg">→</span>
        </div>
      </div>

      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 
        ${isGreen ? 'bg-primary/5' : 'bg-secondary/5'}`}
        style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
      />
    </button>
  );
}
