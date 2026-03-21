import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHandTracking, HandPosition } from '@/hooks/useHandTracking';

const CANVAS_W = 480;
const CANVAS_H = 640;
const BIRD_SIZE = 28;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.45;
const FLAP_FORCE = -7.5;
const PIPE_SPEED = 2.5;

interface Pipe {
  x: number;
  topH: number;
  scored: boolean;
}

export default function FlappyBirdGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');
  const [handEnabled, setHandEnabled] = useState(true);

  const stateRef = useRef({
    birdY: CANVAS_H / 2,
    birdVel: 0,
    pipes: [] as Pipe[],
    score: 0,
    state: 'idle' as 'idle' | 'playing' | 'dead',
    frame: 0,
    lastFlap: false, // for hand: track if hand was already raised
  });

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.state === 'idle') {
      s.state = 'playing';
      s.birdY = CANVAS_H / 2;
      s.birdVel = FLAP_FORCE;
      s.pipes = [];
      s.score = 0;
      s.frame = 0;
      setGameState('playing');
      setScore(0);
    } else if (s.state === 'playing') {
      s.birdVel = FLAP_FORCE;
    } else if (s.state === 'dead') {
      s.state = 'idle';
      s.birdY = CANVAS_H / 2;
      s.birdVel = 0;
      s.pipes = [];
      s.score = 0;
      setGameState('idle');
      setScore(0);
    }
  }, []);

  // Hand tracking callback
  const onHandFrame = useCallback((hand: HandPosition | null) => {
    const s = stateRef.current;
    if (hand && hand.isRaised && !s.lastFlap) {
      flap();
    }
    s.lastFlap = hand ? hand.isRaised : false;
  }, [flap]);

  const { setVideoElement, isReady: handReady, error: handError } = useHandTracking({
    enabled: handEnabled,
    onFrame: onHandFrame,
  });

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flap]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    function loop() {
      raf = requestAnimationFrame(loop);
      const s = stateRef.current;

      // Update
      if (s.state === 'playing') {
        s.birdVel += GRAVITY;
        s.birdY += s.birdVel;
        s.frame++;

        // Spawn pipes
        if (s.frame % 90 === 0) {
          const topH = 60 + Math.random() * (CANVAS_H - PIPE_GAP - 120);
          s.pipes.push({ x: CANVAS_W, topH, scored: false });
        }

        // Move pipes & check score
        for (const p of s.pipes) {
          p.x -= PIPE_SPEED;
          if (!p.scored && p.x + PIPE_WIDTH < CANVAS_W / 4) {
            p.scored = true;
            s.score++;
            setScore(s.score);
          }
        }
        s.pipes = s.pipes.filter(p => p.x > -PIPE_WIDTH);

        // Collision
        const bx = CANVAS_W / 4;
        const by = s.birdY;
        if (by < 0 || by + BIRD_SIZE > CANVAS_H) {
          s.state = 'dead';
          setGameState('dead');
        }
        for (const p of s.pipes) {
          if (bx + BIRD_SIZE > p.x && bx < p.x + PIPE_WIDTH) {
            if (by < p.topH || by + BIRD_SIZE > p.topH + PIPE_GAP) {
              s.state = 'dead';
              setGameState('dead');
            }
          }
        }
      }

      // Draw
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, '#0a0e1a');
      grad.addColorStop(1, '#0d1520');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y < CANVAS_H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }

      // Pipes
      for (const p of s.pipes) {
        // Top pipe
        ctx.fillStyle = '#00ffaa20';
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH);
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topH);

        // Bottom pipe
        const bottomY = p.topH + PIPE_GAP;
        ctx.fillStyle = '#00ffaa20';
        ctx.fillRect(p.x, bottomY, PIPE_WIDTH, CANVAS_H - bottomY);
        ctx.strokeStyle = '#00ffaa';
        ctx.strokeRect(p.x, bottomY, PIPE_WIDTH, CANVAS_H - bottomY);
      }

      // Bird
      const bx = CANVAS_W / 4;
      const by = s.birdY;
      ctx.save();
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath();
      ctx.arc(bx + BIRD_SIZE / 2, by + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Bird eye
      ctx.fillStyle = '#0a0e1a';
      ctx.beginPath();
      ctx.arc(bx + BIRD_SIZE * 0.65, by + BIRD_SIZE * 0.35, 4, 0, Math.PI * 2);
      ctx.fill();

      // Score
      ctx.font = 'bold 32px Orbitron, monospace';
      ctx.fillStyle = '#00ffaa';
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(String(s.score), CANVAS_W / 2, 50);
      ctx.shadowBlur = 0;

      // Overlays
      if (s.state === 'idle') {
        ctx.fillStyle = 'rgba(10, 14, 26, 0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.font = 'bold 28px Orbitron';
        ctx.fillStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 15;
        ctx.fillText('FLAPPY BIRD', CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.shadowBlur = 0;
        ctx.font = '16px Rajdhani';
        ctx.fillStyle = '#8892a4';
        ctx.fillText('Raise hand or press Space', CANVAS_W / 2, CANVAS_H / 2 + 20);
      }

      if (s.state === 'dead') {
        ctx.fillStyle = 'rgba(10, 14, 26, 0.8)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.font = 'bold 28px Orbitron';
        ctx.fillStyle = '#ff4466';
        ctx.shadowColor = '#ff4466';
        ctx.shadowBlur = 15;
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 40);
        ctx.shadowBlur = 0;
        ctx.font = 'bold 20px Orbitron';
        ctx.fillStyle = '#00ffaa';
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 10);
        ctx.font = '16px Rajdhani';
        ctx.fillStyle = '#8892a4';
        ctx.fillText('Raise hand or press Space to restart', CANVAS_W / 2, CANVAS_H / 2 + 50);
      }
    }

    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center p-4 relative">
      <div className="scanline absolute inset-0 pointer-events-none opacity-20" />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 font-display text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        ← ARCADE
      </button>

      {/* Hand toggle */}
      <button
        onClick={() => setHandEnabled(!handEnabled)}
        className={`absolute top-4 right-4 z-20 font-display text-xs px-3 py-1.5 rounded border transition-colors
          ${handEnabled ? 'border-primary/50 text-primary' : 'border-muted text-muted-foreground'}`}
      >
        {handEnabled ? '✋ ON' : '✋ OFF'}
      </button>

      {/* Score display */}
      <div className="mb-4 font-display text-lg text-primary neon-text">
        SCORE: {score}
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden neon-border">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={flap}
          className="cursor-pointer block"
        />
      </div>

      {/* Camera feed */}
      {handEnabled && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="relative rounded-lg overflow-hidden border border-primary/30 neon-border">
            <video
              ref={setVideoElement}
              className="w-32 h-24 object-cover"
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(-1)' }}
            />
            {!handReady && !handError && (
              <div className="absolute inset-0 bg-card/80 flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-body">Loading...</span>
              </div>
            )}
            {handError && (
              <div className="absolute inset-0 bg-card/80 flex items-center justify-center p-2">
                <span className="text-xs text-destructive font-body text-center">Camera error</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="mt-4 text-xs text-muted-foreground font-body">
        Space / ↑ to flap • Click canvas • Or raise your hand ✋
      </div>
    </div>
  );
}
