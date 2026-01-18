
export type FoodType = 'BHAAT' | 'DAAL' | 'SHOBJIE' | 'RUTI' | 'BEGUN_BHORTHA' | 'ALU_BHORTHA' | 'CHICKEN_BIRYANI' | 'LOCKED_CHEF' | 'BURNT_FOOD' | 'ILISH_MAACH' | 'MISHTI_DOI';

export enum SpecialEffect {
  NONE = 'NONE',
  STRIPED_H = 'STRIPED_H',
  STRIPED_V = 'STRIPED_V',
  WRAPPED = 'WRAPPED',
  COLOR_BOMB = 'COLOR_BOMB'
}

export type BoosterType = 'HAMMER' | 'SHUFFLE' | 'ROW_CLEAR';

export interface TileData {
  id: string;
  type: FoodType;
  special: SpecialEffect;
  locked?: boolean;
}

export interface LevelGoal {
  type: 'SCORE' | 'COLLECT' | 'CLEAR_BURNT' | 'COLLECT_ALL';
  target: number;
  foodType?: FoodType;
}

export interface Level {
  id: number;
  moves: number;
  goals: LevelGoal[];
  description: string;
  isDaily?: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface ScoreAnimation {
  id: number;
  x: number;
  y: number;
  value: number;
}

export interface GameState {
  currentLevel: number;
  score: number;
  movesLeft: number;
  board: (TileData | null)[][];
  burntBoard: boolean[][];
  isAnimating: boolean;
  collected: Record<string, number>;
  unlockedLevels: number;
  settings: GameSettings;
  aiHint: { r: number, c: number }[] | null;
  activeBooster: BoosterType | null;
  boosters: Record<BoosterType, number>;
  streak: number;
}
