
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion as m } from 'framer-motion';
import { GameState, FoodType, TileData, SpecialEffect, BoosterType, ScoreAnimation } from './types.ts';
import { FOOD_ITEMS, LEVELS, GRID_SIZE as GS, CREATOR_INFO } from './constants.tsx';
import { initializeBoard, checkMatches, applyGravity, createTile, getRandomFoodType } from './gameLogic.ts';
import Tile from './components/Tile.tsx';
import ResultOverlay from './components/ResultOverlay.tsx';
import SettingsMenu from './components/SettingsMenu.tsx';
import TutorialOverlay from './components/TutorialOverlay.tsx';
import PauseMenu from './components/PauseMenu.tsx';
import { playPop, playSwap, playSpecial, playWin, playLose, startBackgroundMusic, stopBackgroundMusic } from './utils/sounds.ts';
import { getAiHint } from './utils/ai.ts';

const motion = m as any;

const PRAISE_WORDS = ["Shabash!", "Darun!", "Khub Bhalo!", "Chomokdar!", "Delicious!", "Mouthwatering!", "Fatafati!", "Boss Style!"];

const App: React.FC = () => {
  const [screen, setScreen] = useState<'START' | 'LEVEL_SELECT' | 'GAME' | 'PAUSE' | 'WIN' | 'LOSE'>('START');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [comboText, setComboText] = useState<{text: string, id: number} | null>(null);
  const [shake, setShake] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScoreAnimation[]>([]);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedUnlocked = localStorage.getItem('desiCrushUnlocked');
    const savedSettings = localStorage.getItem('desiCrushSettings');
    const savedBoosters = localStorage.getItem('desiCrushBoosters');
    
    return {
      currentLevel: 1,
      score: 0,
      movesLeft: 0,
      board: [],
      burntBoard: Array(GS).fill(0).map(() => Array(GS).fill(false)),
      isAnimating: false,
      collected: {} as Record<string, number>,
      unlockedLevels: savedUnlocked ? Number(savedUnlocked) : 1,
      settings: savedSettings ? JSON.parse(savedSettings) : { soundEnabled: true, musicEnabled: true },
      aiHint: null,
      activeBooster: null,
      boosters: savedBoosters ? JSON.parse(savedBoosters) : { HAMMER: 3, SHUFFLE: 2, ROW_CLEAR: 1 },
      streak: 0
    };
  });

  const [selectedTile, setSelectedTile] = useState<{ r: number, c: number } | null>(null);

  useEffect(() => {
    if (gameState.settings.musicEnabled && (screen === 'GAME' || screen === 'START')) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [gameState.settings.musicEnabled, screen]);

  useEffect(() => {
    localStorage.setItem('desiCrushSettings', JSON.stringify(gameState.settings));
    localStorage.setItem('desiCrushBoosters', JSON.stringify(gameState.boosters));
    localStorage.setItem('desiCrushUnlocked', gameState.unlockedLevels.toString());
  }, [gameState.settings, gameState.boosters, gameState.unlockedLevels]);

  const sound = useCallback((fn: () => void) => {
    if (gameState.settings.soundEnabled) fn();
  }, [gameState.settings.soundEnabled]);

  const addScorePopup = (r: number, c: number, value: number) => {
    const id = Date.now() + Math.random();
    setScorePopups(prev => [...prev, { id, x: c, y: r, value }]);
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const startLevel = (levelId: number) => {
    const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    const initialBoardState = initializeBoard();
    setGameState(prev => ({
      ...prev,
      currentLevel: levelId,
      score: 0,
      movesLeft: level.moves,
      board: initialBoardState,
      burntBoard: Array(GS).fill(0).map(() => Array(GS).fill(false)),
      isAnimating: false,
      collected: {},
      aiHint: null,
      activeBooster: null,
      streak: 0
    }));
    setScreen('GAME');
    setSelectedTile(null);
    setAiComment(null);
  };

  const processMatches = async (board: (TileData | null)[][], combo: number = 0): Promise<void> => {
    const { matches, specialMatches } = checkMatches(board);
    if (matches.length === 0) {
      setGameState(prev => ({ ...prev, isAnimating: false }));
      return;
    }

    setGameState(prev => ({ ...prev, isAnimating: true }));
    sound(playPop);
    
    if (combo > 1) {
      const text = PRAISE_WORDS[Math.min(combo - 2, PRAISE_WORDS.length - 1)];
      setComboText({ text, id: Math.random() });
      setTimeout(() => setComboText(null), 1200);
    }

    const newBoard = board.map(row => [...row]);
    const collectedInTurn: Record<string, number> = {};

    matches.forEach(({ r, c }) => {
      const tile = newBoard[r][c];
      if (tile) {
        collectedInTurn[tile.type] = (collectedInTurn[tile.type] || 0) + 1;
        addScorePopup(r, c, 10 * (combo + 1));
        newBoard[r][c] = null;
      }
    });

    specialMatches.forEach(({ r, c, effect, type }) => {
      newBoard[r][c] = createTile(type, effect);
    });

    setGameState(prev => {
      const newCollected = { ...prev.collected };
      Object.entries(collectedInTurn).forEach(([type, count]) => {
        newCollected[type] = (newCollected[type] || 0) + count;
      });
      return {
        ...prev,
        board: newBoard,
        score: prev.score + (matches.length * 10 * (combo + 1)),
        collected: newCollected
      };
    });

    await new Promise(r => setTimeout(r, 300));
    const { newBoard: gravityBoard } = applyGravity(newBoard);
    setGameState(prev => ({ ...prev, board: gravityBoard }));
    await new Promise(r => setTimeout(r, 300));
    
    return processMatches(gravityBoard, combo + 1);
  };

  const swapTiles = async (r1: number, c1: number, r2: number, c2: number) => {
    const board = gameState.board.map(row => [...row]);
    const t1 = board[r1][c1];
    const t2 = board[r2][c2];

    if (!t1 || !t2) return;

    board[r1][c1] = t2;
    board[r2][c2] = t1;

    setGameState(prev => ({ ...prev, board, isAnimating: true, movesLeft: prev.movesLeft - 1 }));
    sound(playSwap);

    await new Promise(r => setTimeout(r, 400));

    const { matches } = checkMatches(board);
    if (matches.length > 0) {
      processMatches(board);
    } else {
      const revertBoard = board.map(row => [...row]);
      revertBoard[r1][c1] = t1;
      revertBoard[r2][c2] = t2;
      setGameState(prev => ({ ...prev, board: revertBoard, isAnimating: false }));
      sound(playSwap);
    }
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameState.isAnimating) return;

    if (selectedTile) {
      const { r: r1, c: c1 } = selectedTile;
      const isAdjacent = Math.abs(r1 - r) + Math.abs(c1 - c) === 1;

      if (isAdjacent) {
        swapTiles(r1, c1, r, c);
        setSelectedTile(null);
      } else {
        setSelectedTile({ r, c });
      }
    } else {
      setSelectedTile({ r, c });
    }
  };

  const handleAiHint = async () => {
    if (isAiThinking || gameState.isAnimating) return;
    setIsAiThinking(true);
    const hint = await getAiHint(gameState.board);
    if (hint) {
      setAiComment(hint.comment);
      setGameState(prev => ({ ...prev, aiHint: [{ r: hint.r1, c: hint.c1 }, { r: hint.r2, c: hint.c2 }] }));
      setTimeout(() => {
        setGameState(prev => ({ ...prev, aiHint: null }));
        setAiComment(null);
      }, 5000);
    }
    setIsAiThinking(false);
  };

  const checkWinCondition = useCallback(() => {
    const level = LEVELS.find(l => l.id === gameState.currentLevel);
    if (!level) return;

    const allGoalsMet = level.goals.every(goal => {
      if (goal.type === 'SCORE') return gameState.score >= goal.target;
      if (goal.type === 'COLLECT') return (gameState.collected[goal.foodType!] || 0) >= goal.target;
      if (goal.type === 'COLLECT_ALL') {
         const total = Object.values(gameState.collected).reduce((a, b) => a + (b || 0), 0);
         return total >= goal.target;
      }
      return false;
    });

    if (allGoalsMet) {
      sound(playWin);
      setScreen('WIN');
      const s = Math.min(3, Math.floor(gameState.score / (level.goals[0].target / 1.5)));
      setStars(s || 1);
      if (gameState.currentLevel === gameState.unlockedLevels) {
        setGameState(prev => ({ ...prev, unlockedLevels: prev.unlockedLevels + 1 }));
      }
    } else if (gameState.movesLeft <= 0 && !gameState.isAnimating) {
      sound(playLose);
      setScreen('LOSE');
    }
  }, [gameState.score, gameState.collected, gameState.movesLeft, gameState.currentLevel, gameState.unlockedLevels, gameState.isAnimating, sound]);

  useEffect(() => {
    if (screen === 'GAME') {
      checkWinCondition();
    }
  }, [gameState.score, gameState.collected, gameState.movesLeft, screen, checkWinCondition]);

  return (
    <div className="min-h-screen bg-[#FFF5E1] font-sans overflow-hidden select-none">
      <AnimatePresence>
        {screen === 'START' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <motion.div 
              animate={{ y: [0, -20, 0] }} 
              transition={{ repeat: Infinity, duration: 3 }}
              className="mb-8"
            >
              <h1 className="text-7xl font-black text-orange-950 font-bubbly drop-shadow-xl mb-2">Desi Crush</h1>
              <div className="text-xl font-bold text-pink-500 uppercase tracking-widest">Dadi's Special Recipe</div>
            </motion.div>
            
            <div className="grid grid-cols-3 gap-4 mb-12">
               {['🍚', '🍗', '🍨'].map((emoji, i) => (
                 <motion.div 
                   key={i}
                   animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                   transition={{ delay: i * 0.2, repeat: Infinity, duration: 2 }}
                   className="text-6xl bg-white p-6 rounded-[2rem] shadow-xl"
                 >
                   {emoji}
                 </motion.div>
               ))}
            </div>

            <div className="space-y-4 w-full max-w-xs">
              <button 
                onClick={() => setScreen('LEVEL_SELECT')}
                className="w-full py-6 bg-pink-500 text-white rounded-[2rem] text-3xl font-black shadow-2xl border-b-8 border-pink-700 hover:bg-pink-400 active:scale-95 transition-all font-bubbly"
              >
                PLAY GAME
              </button>
              <button 
                onClick={() => setShowTutorial(true)}
                className="w-full py-4 bg-orange-100 text-orange-900 rounded-[2rem] text-xl font-black border-b-4 border-orange-200"
              >
                HOW TO PLAY
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-[2rem] text-xl font-black"
              >
                SETTINGS
              </button>
            </div>
          </motion.div>
        )}

        {screen === 'LEVEL_SELECT' && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            className="p-8 min-h-screen max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-10">
               <button onClick={() => setScreen('START')} className="text-4xl">⬅️</button>
               <h2 className="text-5xl font-black text-orange-950 font-bubbly">Select Level</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-6">
              {LEVELS.filter(l => !l.isDaily).map((level) => {
                const isLocked = level.id > gameState.unlockedLevels;
                return (
                  <button
                    key={level.id}
                    disabled={isLocked}
                    onClick={() => startLevel(level.id)}
                    className={`aspect-square rounded-[2rem] text-3xl font-black flex items-center justify-center relative transition-all active:scale-90
                      ${isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-orange-950 shadow-xl border-b-8 border-orange-200 hover:bg-orange-50'}`}
                  >
                    {isLocked ? '🔒' : level.id}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {screen === 'GAME' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col h-screen max-w-xl mx-auto p-4"
          >
            <div className="flex justify-between items-center mb-4 bg-white/80 backdrop-blur p-4 rounded-[2rem] shadow-sm border-2 border-white">
              <div className="flex flex-col">
                 <span className="text-xs font-black text-pink-500 uppercase tracking-widest">Score</span>
                 <span className="text-3xl font-black text-orange-950 font-bubbly">{gameState.score}</span>
              </div>
              <div className="bg-orange-100 px-6 py-2 rounded-full border-2 border-orange-200">
                 <span className="text-3xl font-black text-orange-950 font-bubbly">{gameState.movesLeft}</span>
                 <span className="text-xs font-bold text-orange-700 ml-2 uppercase">Moves</span>
              </div>
              <button onClick={() => setScreen('PAUSE')} className="text-3xl p-2">⏸️</button>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {LEVELS.find(l => l.id === gameState.currentLevel)?.goals.map((goal, i) => {
                const current = goal.type === 'SCORE' ? gameState.score : 
                                goal.type === 'COLLECT' ? (gameState.collected[goal.foodType!] || 0) :
                                Object.values(gameState.collected).reduce((a, b) => a + (b || 0), 0);
                const isDone = current >= goal.target;
                return (
                  <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 shrink-0 ${isDone ? 'bg-green-100 border-green-200' : 'bg-white border-slate-100'}`}>
                    <span className="text-xl">{goal.type === 'SCORE' ? '⭐' : (goal.foodType ? FOOD_ITEMS[goal.foodType].icon : '🥗')}</span>
                    <span className={`font-black ${isDone ? 'text-green-700' : 'text-slate-700'}`}>{current}/{goal.target}</span>
                  </div>
                );
              })}
            </div>

            <div className={`relative flex-1 aspect-square bg-[#FFE4C4] rounded-[2.5rem] p-3 shadow-inner border-8 border-white/50 overflow-hidden`}>
               <div className="grid grid-cols-8 grid-rows-8 gap-1.5 h-full w-full">
                  {gameState.board.map((row, r) => row.map((tile, c) => (
                    <Tile 
                      key={tile?.id || `${r}-${c}`}
                      tile={tile}
                      onClick={() => handleTileClick(r, c)}
                      isSelected={selectedTile?.r === r && selectedTile?.c === c}
                      isHinted={gameState.aiHint?.some(h => h.r === r && h.c === c)}
                    />
                  )))}
               </div>

               <AnimatePresence>
                 {comboText && (
                   <motion.div
                     key={comboText.id}
                     initial={{ scale: 0, y: 50, opacity: 0 }}
                     animate={{ scale: 1.5, y: -100, opacity: 1 }}
                     exit={{ opacity: 0, scale: 2 }}
                     className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]"
                   >
                     <span className="text-5xl font-black text-pink-500 font-bubbly drop-shadow-[0_4px_0_white]">{comboText.text}</span>
                   </motion.div>
                 )}
               </AnimatePresence>

               <AnimatePresence>
                 {aiComment && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border-2 border-pink-200 z-[110]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">👵</span>
                        <p className="text-sm font-bold text-slate-700 italic">"{aiComment}"</p>
                      </div>
                    </motion.div>
                 )}
               </AnimatePresence>

               {scorePopups.map(p => (
                 <motion.div
                    key={p.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -50 }}
                    className="absolute text-xl font-black text-orange-950 pointer-events-none z-[90]"
                    style={{ left: `${(p.x / GS) * 100 + 5}%`, top: `${(p.y / GS) * 100 + 5}%` }}
                 >
                   +{p.value}
                 </motion.div>
               ))}
            </div>

            <div className="flex justify-between items-center mt-6 gap-4">
               <button 
                 onClick={handleAiHint}
                 disabled={isAiThinking}
                 className="flex-1 py-4 bg-white rounded-2xl shadow-md border-b-4 border-slate-100 font-black text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
               >
                 <span className="text-2xl">{isAiThinking ? '⏳' : '👵'}</span>
                 <span>Ask Dadi</span>
               </button>
               
               <div className="flex gap-2">
                 {(Object.keys(gameState.boosters) as BoosterType[]).map(type => (
                   <button
                     key={type}
                     className="w-14 h-14 bg-white rounded-2xl shadow-md border-b-4 border-slate-100 flex flex-col items-center justify-center relative"
                   >
                     <span className="text-2xl">{type === 'HAMMER' ? '🔨' : type === 'SHUFFLE' ? '🔄' : '↔️'}</span>
                     <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                       {gameState.boosters[type]}
                     </span>
                   </button>
                 ))}
               </div>
            </div>
          </motion.div>
        )}

        {screen === 'WIN' && (
          <ResultOverlay 
            title="Victory!" 
            message="Oma! You cook like a master!" 
            onAction={() => setScreen('LEVEL_SELECT')} 
            actionText="NEXT LEVEL" 
            score={gameState.score} 
            success={true}
            stars={stars}
          />
        )}

        {screen === 'LOSE' && (
          <ResultOverlay 
            title="Burned Out!" 
            message="Arre wah... try again, don't worry beta!" 
            onAction={() => startLevel(gameState.currentLevel)} 
            actionText="TRY AGAIN" 
            score={gameState.score} 
            success={false}
          />
        )}
      </AnimatePresence>

      {showSettings && (
        <SettingsMenu 
          settings={gameState.settings} 
          onUpdate={s => setGameState(p => ({...p, settings: s}))} 
          onClose={() => setShowSettings(false)}
          onReset={() => {
            localStorage.clear();
            window.location.reload();
          }}
        />
      )}

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      
      {screen === 'PAUSE' && (
        <PauseMenu 
          onContinue={() => setScreen('GAME')}
          onRestart={() => startLevel(gameState.currentLevel)}
          onQuit={() => setScreen('START')}
          onSettings={() => setShowSettings(true)}
        />
      )}
    </div>
  );
};

export default App;
