import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

const GAME_TIME = 30;
const APPLE_COUNT = 16;
const CORRECT_SCORE = 10;
const WRONG_SCORE = -5;

type GameState = "idle" | "playing" | "roundResult" | "finalResult";

interface Apple {
  id: number;
  number: number;
  isCorrect: boolean;
  shakeKey: number;
}

function generateApples(targetNumber: number): Apple[] {
  const numbers = new Set<number>([targetNumber]);
  while (numbers.size < APPLE_COUNT) {
    numbers.add(Math.floor(Math.random() * 30) + 1);
  }
  const numArr = Array.from(numbers).sort(() => Math.random() - 0.5);
  return numArr.map((n, i) => ({
    id: i,
    number: n,
    isCorrect: n === targetNumber,
    shakeKey: 0,
  }));
}

function generateHint(target: number): string {
  const variants: (() => string)[] = [
    () => `이 숫자가 적힌 사과를 찾아라! 🍎  [  ${target}  ]`,
    () => {
      const a = Math.floor(Math.random() * (target - 1)) + 1;
      return `계산해서 정답 사과를 찾아라! 🍎  [  ${a} + ${target - a}  ]`;
    },
    () => {
      const a = Math.floor(Math.random() * 10) + target;
      return `계산해서 정답 사과를 찾아라! 🍎  [  ${a} - ${a - target}  ]`;
    },
    () => {
      for (let f = 2; f <= Math.min(target, 9); f++) {
        if (target % f === 0 && target / f <= 9) {
          return `계산해서 정답 사과를 찾아라! 🍎  [  ${f} × ${target / f}  ]`;
        }
      }
      return `이 숫자가 적힌 사과를 찾아라! 🍎  [  ${target}  ]`;
    },
  ];
  return variants[Math.floor(Math.random() * variants.length)]();
}

function getRoundMessage(score: number, correct: number): { emoji: string; msg: string; color: string } {
  if (correct >= 8) return { emoji: "🏆", msg: "완벽한 라운드!", color: "#f7c045" };
  if (correct >= 5) return { emoji: "🎉", msg: "잘했어요!", color: "#3a7d1e" };
  if (correct >= 3) return { emoji: "👍", msg: "나쁘지 않아요!", color: "#e8241a" };
  return { emoji: "💪", msg: "다음 라운드엔 더 잘 할 수 있어!", color: "#7a4a2e" };
}

function getFinalMessage(totalScore: number): { emoji: string; title: string; color: string } {
  if (totalScore >= 200) return { emoji: "🥇", title: "천재 사과 탐정!", color: "#f7c045" };
  if (totalScore >= 120) return { emoji: "🥈", title: "사과 찾기 고수!", color: "#3a7d1e" };
  if (totalScore >= 60) return { emoji: "🥉", title: "잘했어요! 계속 도전!", color: "#e8241a" };
  return { emoji: "🌱", title: "다음엔 더 잘할 수 있어!", color: "#7a4a2e" };
}

const MAX_ROUNDS = 3;

export default function App() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [round, setRound] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [apples, setApples] = useState<Apple[]>([]);
  const [hint, setHint] = useState("");
  const [feedback, setFeedback] = useState<{ id: number; correct: boolean } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [appleSetKey, setAppleSetKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextApples = useCallback(() => {
    const target = Math.floor(Math.random() * 20) + 1;
    setHint(generateHint(target));
    setApples(generateApples(target));
    setAppleSetKey((k) => k + 1);
    setFeedback(null);
  }, []);

  const startRound = useCallback((roundNum: number) => {
    setRound(roundNum);
    setRoundScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTimeLeft(GAME_TIME);
    setGameState("playing");
    const target = Math.floor(Math.random() * 20) + 1;
    setHint(generateHint(target));
    setApples(generateApples(target));
    setAppleSetKey((k) => k + 1);
    setFeedback(null);
  }, []);

  const startGame = () => {
    setTotalScore(0);
    startRound(1);
  };

  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setGameState("roundResult");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [gameState]);

  const handleAppleClick = (apple: Apple) => {
    if (feedback) return;
    setFeedback({ id: apple.id, correct: apple.isCorrect });

    if (apple.isCorrect) {
      const gain = CORRECT_SCORE;
      setRoundScore((s) => s + gain);
      setTotalScore((s) => s + gain);
      setCorrectCount((c) => c + 1);
      setTimeout(() => nextApples(), 550);
    } else {
      setRoundScore((s) => s + WRONG_SCORE);
      setTotalScore((s) => s + WRONG_SCORE);
      setWrongCount((w) => w + 1);
      setApples((prev) =>
        prev.map((a) => (a.id === apple.id ? { ...a, shakeKey: a.shakeKey + 1 } : a))
      );
      setTimeout(() => setFeedback(null), 550);
    }
  };

  const goNextRound = () => {
    if (round >= MAX_ROUNDS) {
      setGameState("finalResult");
    } else {
      startRound(round + 1);
    }
  };

  const timerPct = (timeLeft / GAME_TIME) * 100;
  const timerColor = timeLeft > 15 ? "#3a7d1e" : timeLeft > 7 ? "#f7c045" : "#e8241a";
  const roundMsg = getRoundMessage(roundScore, correctCount);
  const finalMsg = getFinalMessage(totalScore);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-6 px-4"
      style={{
        background: "linear-gradient(135deg, #fff8f0 0%, #ffe4cc 50%, #fff0f8 100%)",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Title */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="text-center mb-4"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <span style={{ fontSize: "2.2rem" }}>🍎</span>
          <h1
            style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              color: "#e8241a",
              textShadow: "3px 3px 0px #ffd0cc, 5px 5px 0px rgba(232,36,26,0.15)",
              letterSpacing: "-1px",
            }}
          >
            사과 찾기 게임
          </h1>
          <span style={{ fontSize: "2.2rem" }}>🍏</span>
        </div>
        <p style={{ color: "#7a4a2e", fontSize: "0.95rem", fontWeight: 700 }}>
          힌트를 보고 정답 사과를 클릭하세요! 빠를수록 더 많은 점수!
        </p>
      </motion.div>

      {/* HUD — score, timer, round */}
      {(gameState === "playing") && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex gap-3 mb-4 w-full max-w-lg"
        >
          {/* Round badge */}
          <div
            className="flex flex-col items-center justify-center px-4 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #e8241a, #ff5c4d)",
              color: "#fff",
              minWidth: "70px",
              boxShadow: "0 4px 16px rgba(232,36,26,0.3)",
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 800, opacity: 0.85 }}>ROUND</span>
            <span style={{ fontSize: "1.7rem", fontWeight: 900, lineHeight: 1.1 }}>{round}</span>
            <span style={{ fontSize: "0.65rem", opacity: 0.75 }}>/ {MAX_ROUNDS}</span>
          </div>

          {/* Score */}
          <div
            className="flex-1 flex flex-col items-center justify-center py-2 rounded-2xl"
            style={{
              background: "#ffffff",
              boxShadow: "0 4px 16px rgba(232,36,26,0.12)",
              border: "3px solid #ffd0cc",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "#7a4a2e", fontWeight: 700 }}>⭐ 점수</span>
            <motion.span
              key={roundScore}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              style={{ fontSize: "1.7rem", fontWeight: 900, color: "#e8241a", lineHeight: 1.1 }}
            >
              {roundScore}
            </motion.span>
            <span style={{ fontSize: "0.65rem", color: "#bbb", fontWeight: 600 }}>
              ✅{correctCount} ❌{wrongCount}
            </span>
          </div>

          {/* Timer */}
          <div
            className="flex-1 flex flex-col items-center justify-center py-2 rounded-2xl gap-1"
            style={{
              background: "#ffffff",
              boxShadow: "0 4px 16px rgba(58,125,30,0.12)",
              border: "3px solid #c8f0b0",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "#3a7d1e", fontWeight: 700 }}>⏱ 남은 시간</span>
            <motion.span
              key={timeLeft}
              initial={{ scale: timeLeft <= 5 ? 1.35 : 1 }}
              animate={{ scale: 1 }}
              style={{ fontSize: "1.7rem", fontWeight: 900, color: timerColor, lineHeight: 1.1 }}
            >
              {timeLeft}초
            </motion.span>
            <div className="w-4/5 rounded-full overflow-hidden" style={{ height: "5px", background: "#e8f5e0" }}>
              <motion.div
                animate={{ width: `${timerPct}%` }}
                transition={{ duration: 0.4 }}
                style={{ height: "100%", background: timerColor, borderRadius: "99px" }}
              />
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ───── IDLE ───── */}
        {gameState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-5 w-full max-w-lg"
          >
            <div className="flex gap-3 justify-center flex-wrap mb-1">
              {["🍎", "🍏", "🍎", "🍏", "🍎"].map((e, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  style={{ fontSize: "2.8rem" }}
                >
                  {e}
                </motion.span>
              ))}
            </div>

            <div
              className="rounded-3xl p-6 text-center w-full"
              style={{ background: "#ffffff", boxShadow: "0 8px 32px rgba(232,36,26,0.12)", border: "3px solid #ffd0cc" }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2d1a0e", marginBottom: "0.75rem" }}>
                🎮 게임 설명
              </h2>
              <ul className="text-left space-y-2" style={{ color: "#5a3020", fontWeight: 600, fontSize: "0.95rem" }}>
                <li>📌 화면의 사과들 중 힌트에 맞는 정답 사과를 클릭!</li>
                <li>✅ 정답 클릭 → <span style={{ color: "#3a7d1e" }}>+{CORRECT_SCORE}점</span></li>
                <li>❌ 오답 클릭 → <span style={{ color: "#e8241a" }}>{WRONG_SCORE}점</span></li>
                <li>⏱ {GAME_TIME}초 × {MAX_ROUNDS}라운드, 최고 점수를 노려라!</li>
              </ul>
            </div>

            <Btn onClick={startGame} size="lg">🍎 게임 시작!</Btn>
          </motion.div>
        )}

        {/* ───── PLAYING ───── */}
        {gameState === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 w-full max-w-2xl"
          >
            {/* Hint */}
            <motion.div
              key={hint}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-full rounded-2xl px-5 py-3 text-center"
              style={{
                background: "linear-gradient(135deg, #3a7d1e, #5aaa2e)",
                color: "#ffffff",
                fontSize: "1.05rem",
                fontWeight: 800,
                boxShadow: "0 4px 16px rgba(58,125,30,0.3)",
              }}
            >
              {hint}
            </motion.div>

            {/* Apple grid */}
            <div className="grid gap-3 w-full" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {apples.map((apple) => {
                const isClicked = feedback?.id === apple.id;
                const isOk = isClicked && feedback?.correct;
                const isBad = isClicked && !feedback?.correct;

                return (
                  <motion.button
                    key={`${appleSetKey}-${apple.id}-${apple.shakeKey}`}
                    onClick={() => handleAppleClick(apple)}
                    initial={{ scale: 0, rotate: (apple.id % 2 === 0 ? 1 : -1) * (Math.random() * 12 + 4) }}
                    animate={
                      isBad
                        ? { x: [0, -8, 8, -6, 6, 0], scale: 1, rotate: 0 }
                        : isOk
                        ? { scale: [1, 1.25, 0], rotate: 0 }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={
                      isBad || isOk
                        ? { duration: 0.4 }
                        : { type: "spring", stiffness: 380, delay: apple.id * 0.025 }
                    }
                    whileHover={!feedback ? { scale: 1.1 } : {}}
                    whileTap={!feedback ? { scale: 0.88 } : {}}
                    className="flex flex-col items-center justify-center rounded-2xl aspect-square cursor-pointer"
                    style={{
                      background: isOk
                        ? "linear-gradient(135deg, #3a7d1e, #5aaa2e)"
                        : isBad
                        ? "linear-gradient(135deg, #b01810, #e8241a)"
                        : "linear-gradient(135deg, #fff5f0, #ffffff)",
                      border: isOk
                        ? "3px solid #2a6010"
                        : isBad
                        ? "3px solid #901010"
                        : "3px solid #ffd0cc",
                      boxShadow: isOk
                        ? "0 4px 16px rgba(58,125,30,0.4)"
                        : isBad
                        ? "0 4px 16px rgba(232,36,26,0.4)"
                        : "0 4px 12px rgba(232,36,26,0.1)",
                    }}
                  >
                    <span style={{ fontSize: "1.9rem", lineHeight: 1 }}>
                      {isOk ? "✅" : isBad ? "❌" : "🍎"}
                    </span>
                    <span
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 900,
                        color: isOk || isBad ? "#fff" : "#2d1a0e",
                        marginTop: "2px",
                      }}
                    >
                      {apple.number}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ───── ROUND RESULT ───── */}
        {gameState === "roundResult" && (
          <motion.div
            key="roundResult"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 280 }}
            className="flex flex-col items-center gap-5 w-full max-w-md"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              style={{ fontSize: "4.5rem" }}
            >
              {roundMsg.emoji}
            </motion.div>

            <div
              className="w-full rounded-3xl p-7 text-center"
              style={{ background: "#fff", boxShadow: "0 8px 40px rgba(232,36,26,0.16)", border: `4px solid ${roundMsg.color}` }}
            >
              <div style={{ fontSize: "0.85rem", color: "#7a4a2e", fontWeight: 700, marginBottom: "4px" }}>
                ROUND {round} / {MAX_ROUNDS} 결과
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: roundMsg.color, marginBottom: "1.2rem" }}>
                {roundMsg.msg}
              </h2>

              <div className="flex justify-center gap-5 mb-5">
                <Stat label="이번 점수" value={roundScore} color="#e8241a" />
                <div style={{ width: "1px", background: "#ffd0cc" }} />
                <Stat label="누적 점수" value={totalScore} color="#3a7d1e" />
                <div style={{ width: "1px", background: "#ffd0cc" }} />
                <Stat label="정답률" value={`${correctCount + wrongCount > 0 ? Math.round(correctCount / (correctCount + wrongCount) * 100) : 0}%`} color="#7a4a2e" />
              </div>

              {round < MAX_ROUNDS ? (
                <Btn onClick={goNextRound} size="lg" color="green">
                  🍏 {round + 1}라운드 시작!
                </Btn>
              ) : (
                <Btn onClick={goNextRound} size="lg">
                  🏁 최종 결과 보기
                </Btn>
              )}
            </div>

            <button
              onClick={startGame}
              style={{ color: "#aaa", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}
            >
              처음부터 다시하기
            </button>
          </motion.div>
        )}

        {/* ───── FINAL RESULT ───── */}
        {gameState === "finalResult" && (
          <motion.div
            key="finalResult"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 280 }}
            className="flex flex-col items-center gap-5 w-full max-w-md"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -8, 8, 0], y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: "5rem" }}
            >
              {finalMsg.emoji}
            </motion.div>

            <div
              className="w-full rounded-3xl p-8 text-center"
              style={{ background: "#fff", boxShadow: "0 8px 40px rgba(232,36,26,0.18)", border: `4px solid ${finalMsg.color}` }}
            >
              <div style={{ fontSize: "0.8rem", color: "#7a4a2e", fontWeight: 700, marginBottom: "6px" }}>
                🏁 {MAX_ROUNDS}라운드 최종 결과
              </div>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 900, color: finalMsg.color, marginBottom: "1.2rem" }}>
                {finalMsg.title}
              </h2>

              <div
                className="rounded-2xl py-4 px-6 mb-5"
                style={{ background: "#fff8f0", border: "2px solid #ffd0cc" }}
              >
                <div style={{ fontSize: "3rem", fontWeight: 900, color: "#e8241a" }}>{totalScore}점</div>
                <div style={{ fontSize: "0.85rem", color: "#7a4a2e", fontWeight: 600 }}>총 획득 점수</div>
              </div>

              <Btn onClick={startGame} size="lg">🔄 다시 도전!</Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Btn({
  children,
  onClick,
  size = "md",
  color = "red",
}: {
  children: React.ReactNode;
  onClick: () => void;
  size?: "md" | "lg";
  color?: "red" | "green";
}) {
  const bg =
    color === "green"
      ? "linear-gradient(135deg, #3a7d1e, #5aaa2e)"
      : "linear-gradient(135deg, #e8241a, #ff5c4d)";
  const shadow =
    color === "green"
      ? "0 6px 20px rgba(58,125,30,0.4), 0 2px 0 #2a6010"
      : "0 6px 20px rgba(232,36,26,0.4), 0 2px 0 #b01810";
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      style={{
        background: bg,
        color: "#fff",
        fontSize: size === "lg" ? "1.25rem" : "1rem",
        fontWeight: 900,
        border: "none",
        borderRadius: "9999px",
        padding: size === "lg" ? "14px 44px" : "10px 28px",
        boxShadow: shadow,
        cursor: "pointer",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {children}
    </motion.button>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span style={{ fontSize: "2rem", fontWeight: 900, color }}>{value}</span>
      <span style={{ fontSize: "0.78rem", color: "#7a4a2e", fontWeight: 700 }}>{label}</span>
    </div>
  );
}
