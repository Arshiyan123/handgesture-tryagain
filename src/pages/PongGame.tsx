import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHandTracking, HandPosition } from '@/hooks/useHandTracking';

const W = 640;
const H = 480;
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_R = 8;
const PADDLE_MARGIN = 20;
const AI_SPEED = 3.5;
const BALL_SPEED_INIT = 4;
const BALL_SPEED_INC = 0.3;

export default function PongGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [handEnabled, setHandEnabled] = useState(true);

  const stateRef = useRef({
    playerY: H / 2 - PADDLE_H / 2,
    aiY: H / 2 - PADDLE_H / 2,
    ballX: W / 2,
    ballY: H / 2,
    ballVX: BALL_SPEED_INIT,
    ballVY: BALL_SPEED_INIT * 0.6,
    pScore: 0,
    aScore: 0,
    keysDown: new Set<string>(),
    handY: null as number | null,
    paused: false,
    rally: 0,
  });

  const resetBall = useCallback((dir: number) => {
    const s = stateRef.current;
    s.ballX = W / 2;
    s.ballY = H / 2;
    const speed = BALL_SPEED_INIT;
    const angle = (Math.random() - 0.5) * Math.PI * 0.5;
    s.ballVX = Math.cos(angle) * speed * dir;
    s.ballVY = Math.sin(angle) * speed;
    s.rally = 0;
  }, []);

  // Hand tracking
  const onHandFrame = useCallback((hand: HandPosition | null) => {
    stateRef.current.handY = hand ? hand.y : null;
  }, []);

  const { setVideoElement, isReady: handReady, error: handError } = useHandTracking({
    enabled: handEnabled,
    onFrame: onHandFrame,
  });

  // Keyboard
  useEffect(() => {
    const s = stateRef.current;
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
      s.keysDown.add(e.code);
    };
    const up = (e: KeyboardEvent) => s.keysDown.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    function loop() {
      raf = requestAnimationFrame(loop);
      const s = stateRef.current;

      // Player paddle: keyboard
      if (s.keysDown.has('ArrowUp')) s.playerY -= 6;
      if (s.keysDown.has('ArrowDown')) s.playerY += 6;

      // Player paddle: hand
      if (s.handY !== null) {
        const targetY = s.handY * H - PADDLE_H / 2;
        s.playerY += (targetY - s.playerY) * 0.15; // Smooth lerp
      }

      s.playerY = Math.max(0, Math.min(H - PADDLE_H, s.playerY));

      // AI paddle
      const aiTarget = s.ballY - PADDLE_H / 2;
      const aiDiff = aiTarget - s.aiY;
      s.aiY += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), AI_SPEED);
      s.aiY = Math.max(0, Math.min(H - PADDLE_H, s.aiY));

      // Ball movement
      s.ballX += s.ballVX;
      s.ballY += s.ballVY;

      // Top/bottom bounce
      if (s.ballY - BALL_R < 0) { s.ballY = BALL_R; s.ballVY *= -1; }
      if (s.ballY + BALL_R > H) { s.ballY = H - BALL_R; s.ballVY *= -1; }

      // Player paddle collision (right side)
      const playerPaddleX = W - PADDLE_MARGIN - PADDLE_W;
      if (s.ballVX > 0 && s.ballX + BALL_R >= playerPaddleX && s.ballX + BALL_R <= playerPaddleX + PADDLE_W + 4) {
        if (s.ballY >= s.playerY && s.ballY <= s.playerY + PADDLE_H) {
          s.ballX = playerPaddleX - BALL_R;
          const hitPos = (s.ballY - s.playerY) / PADDLE_H - 0.5;
          s.rally++;
          const speed = BALL_SPEED_INIT + s.rally * BALL_SPEED_INC;
          s.ballVX = -speed;
          s.ballVY = hitPos * speed * 1.5;
        }
      }

      // AI paddle collision (left side)
      const aiPaddleX = PADDLE_MARGIN;
      if (s.ballVX < 0 && s.ballX - BALL_R <= aiPaddleX + PADDLE_W && s.ballX - BALL_R >= aiPaddleX - 4) {
        if (s.ballY >= s.aiY && s.ballY <= s.aiY + PADDLE_H) {
          s.ballX = aiPaddleX + PADDLE_W + BALL_R;
          const hitPos = (s.ballY - s.aiY) / PADDLE_H - 0.5;
          s.rally++;
          const speed = BALL_SPEED_INIT + s.rally * BALL_SPEED_INC;
          s.ballVX = speed;
          s.ballVY = hitPos * speed * 1.5;
        }
      }

      // Scoring
      if (s.ballX < 0) {
        s.pScore++;
        setPlayerScore(s.pScore);
        resetBall(-1);
      }
      if (s.ballX > W) {
        s.aScore++;
        setAiScore(s.aScore);
        resetBall(1);
      }

      // ---- Draw ----
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a0e1a');
      grad.addColorStop(1, '#0d1520');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(160, 100, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Center line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(160, 100, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      // Player (right) - neon purple
      ctx.save();
      ctx.shadowColor = '#a064ff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#a064ff';
      ctx.fillRect(playerPaddleX, s.playerY, PADDLE_W, PADDLE_H);
      ctx.restore();

      // AI (left) - neon green
      ctx.save();
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(aiPaddleX, s.aiY, PADDLE_W, PADDLE_H);
      ctx.restore();

      // Ball
      ctx.save();
      ctx.shadowColor = '#33bbff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#33bbff';
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Ball trail
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#33bbff';
      ctx.beginPath();
      ctx.arc(s.ballX - s.ballVX * 2, s.ballY - s.ballVY * 2, BALL_R * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      ctx.arc(s.ballX - s.ballVX * 4, s.ballY - s.ballVY * 4, BALL_R * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Scores
      ctx.font = 'bold 48px Orbitron, monospace';
      ctx.textAlign = 'center';
      
      ctx.save();
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ffaa';
      ctx.fillText(String(s.aScore), W / 4, 60);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#a064ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#a064ff';
      ctx.fillText(String(s.pScore), (W * 3) / 4, 60);
      ctx.restore();

      // Labels
      ctx.font = '12px Rajdhani';
      ctx.fillStyle = '#556';
      ctx.fillText('AI', W / 4, 80);
      ctx.fillText('YOU', (W * 3) / 4, 80);
    }

    loop();
    return () => cancelAnimationFrame(raf);
  }, [resetBall]);

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center p-4 relative">
      <div className="scanline absolute inset-0 pointer-events-none opacity-20" />

      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 font-display text-sm text-muted-foreground hover:text-secondary transition-colors"
      >
        ← ARCADE
      </button>

      <button
        onClick={() => setHandEnabled(!handEnabled)}
        className={`absolute top-4 right-4 z-20 font-display text-xs px-3 py-1.5 rounded border transition-colors
          ${handEnabled ? 'border-secondary/50 text-secondary' : 'border-muted text-muted-foreground'}`}
      >
        {handEnabled ? '✋ ON' : '✋ OFF'}
      </button>

      <div className="mb-4 font-display text-lg">
        <span className="text-neon-green">AI {aiScore}</span>
        <span className="text-muted-foreground mx-4">vs</span>
        <span className="text-secondary">YOU {playerScore}</span>
      </div>

      <div className="relative rounded-xl overflow-hidden neon-border-purple">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block"
        />
      </div>

      {handEnabled && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="relative rounded-lg overflow-hidden border border-secondary/30 neon-border-purple">
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

      <div className="mt-4 text-xs text-muted-foreground font-body">
        ↑ / ↓ arrow keys • Or move your hand up/down ✋
      </div>
    </div>
  );
}
