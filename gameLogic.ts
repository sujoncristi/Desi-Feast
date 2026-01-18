
import { FoodType, TileData, SpecialEffect } from './types.ts';
import { FOOD_ITEMS, GRID_SIZE } from './constants.tsx';

export const createTile = (type: FoodType, special: SpecialEffect = SpecialEffect.NONE, locked: boolean = false): TileData => ({
  id: Math.random().toString(36).substr(2, 9),
  type,
  special,
  locked
});

export const getRandomFoodType = (includeSpecial: boolean = false): FoodType => {
  const types = (Object.keys(FOOD_ITEMS) as FoodType[]).filter(t => t !== 'LOCKED_CHEF');
  return types[Math.floor(Math.random() * types.length)];
};

export const initializeBoard = (lockedIndices: {r: number, c: number}[] = []): (TileData | null)[][] => {
  const board: (TileData | null)[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    board[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let type: FoodType;
      const isLocked = lockedIndices.some(li => li.r === r && li.c === c);
      
      do {
        type = getRandomFoodType();
      } while (
        (c >= 2 && board[r][c-1]?.type === type && board[r][c-2]?.type === type) ||
        (r >= 2 && board[r-1][c]?.type === type && board[r-2][c]?.type === type)
      );
      board[r][c] = createTile(type, SpecialEffect.NONE, isLocked);
    }
  }
  return board;
};

export const checkMatches = (board: (TileData | null)[][]) => {
  const matchedIndices = new Set<string>();
  const specialGenerations: { r: number, c: number, effect: SpecialEffect, type: FoodType }[] = [];

  const hMatches: Map<number, Set<number>> = new Map();
  const vMatches: Map<number, Set<number>> = new Map();

  for (let r = 0; r < GRID_SIZE; r++) {
    let start = 0;
    while (start < GRID_SIZE) {
      let end = start + 1;
      while (end < GRID_SIZE && board[r][end]?.type === board[r][start]?.type && board[r][start] !== null) {
        end++;
      }
      const length = end - start;
      if (length >= 3) {
        if (!hMatches.has(r)) hMatches.set(r, new Set());
        for (let i = start; i < end; i++) {
          matchedIndices.add(`${r},${i}`);
          hMatches.get(r)!.add(i);
        }
        if (length === 4) specialGenerations.push({ r, c: Math.floor((start+end-1)/2), effect: SpecialEffect.STRIPED_H, type: board[r][start]!.type });
        if (length >= 5) specialGenerations.push({ r, c: Math.floor((start+end-1)/2), effect: SpecialEffect.COLOR_BOMB, type: board[r][start]!.type });
      }
      start = end;
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let start = 0;
    while (start < GRID_SIZE) {
      let end = start + 1;
      while (end < GRID_SIZE && board[end][c]?.type === board[start][c]?.type && board[start][c] !== null) {
        end++;
      }
      const length = end - start;
      if (length >= 3) {
        if (!vMatches.has(c)) vMatches.set(c, new Set());
        for (let i = start; i < end; i++) {
          matchedIndices.add(`${i},${c}`);
          vMatches.get(c)!.add(i);
        }
        if (length === 4) specialGenerations.push({ r: Math.floor((start+end-1)/2), c, effect: SpecialEffect.STRIPED_V, type: board[start][c]!.type });
        if (length >= 5) {
          const exists = specialGenerations.find(s => s.r === Math.floor((start+end-1)/2) && s.c === c && s.effect === SpecialEffect.COLOR_BOMB);
          if (!exists) specialGenerations.push({ r: Math.floor((start+end-1)/2), c, effect: SpecialEffect.COLOR_BOMB, type: board[start][c]!.type });
        }
      }
      start = end;
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (hMatches.get(r)?.has(c) && vMatches.get(c)?.has(r)) {
        specialGenerations.push({ r, c, effect: SpecialEffect.WRAPPED, type: board[r][c]!.type });
      }
    }
  }

  const matches = Array.from(matchedIndices).map(s => {
    const [r, c] = s.split(',').map(Number);
    return { r, c };
  });

  return { matches, specialMatches: specialGenerations };
};

export const applyGravity = (board: (TileData | null)[][]) => {
  const newBoard = board.map(row => [...row]);
  for (let c = 0; c < GRID_SIZE; c++) {
    let emptySpots = 0;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (newBoard[r][c] === null) {
        emptySpots++;
      } else if (emptySpots > 0) {
        newBoard[r + emptySpots][c] = newBoard[r][c];
        newBoard[r][c] = null;
      }
    }
    for (let r = 0; r < emptySpots; r++) {
      newBoard[r][c] = createTile(getRandomFoodType());
    }
  }
  return { newBoard };
};

export const getExplosionArea = (r: number, c: number, effect: SpecialEffect, board: (TileData | null)[][]) => {
  const area: {r: number, c: number}[] = [];
  if (effect === SpecialEffect.STRIPED_H) {
    for (let i = 0; i < GRID_SIZE; i++) area.push({ r, c: i });
  } else if (effect === SpecialEffect.STRIPED_V) {
    for (let i = 0; i < GRID_SIZE; i++) area.push({ r: i, c });
  } else if (effect === SpecialEffect.WRAPPED) {
    for (let i = r-1; i <= r+1; i++) {
      for (let j = c-1; j <= c+1; j++) {
        if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) area.push({ r: i, c: j });
      }
    }
  }
  return area;
};

export const getComboExplosion = (r1: number, c1: number, s1: SpecialEffect, r2: number, c2: number, s2: SpecialEffect) => {
  const area: {r: number, c: number}[] = [];
  
  // Color Bomb + Color Bomb = CLEAR ALL BOARD
  if (s1 === SpecialEffect.COLOR_BOMB && s2 === SpecialEffect.COLOR_BOMB) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        area.push({ r, c });
      }
    }
    return area;
  }

  // Striped + Striped = Cross
  if ((s1 === SpecialEffect.STRIPED_H || s1 === SpecialEffect.STRIPED_V) && 
      (s2 === SpecialEffect.STRIPED_H || s2 === SpecialEffect.STRIPED_V)) {
    for (let i = 0; i < GRID_SIZE; i++) {
      area.push({ r: r1, c: i });
      area.push({ r: i, c: c1 });
    }
  }
  // Striped + Wrapped = 3 rows and 3 columns clear
  else if (((s1 === SpecialEffect.STRIPED_H || s1 === SpecialEffect.STRIPED_V) && s2 === SpecialEffect.WRAPPED) ||
           (s1 === SpecialEffect.WRAPPED && (s2 === SpecialEffect.STRIPED_H || s2 === SpecialEffect.STRIPED_V))) {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let offset = -1; offset <= 1; offset++) {
        const nr = r1 + offset;
        const nc = c1 + offset;
        if (nr >= 0 && nr < GRID_SIZE) area.push({ r: nr, c: i });
        if (nc >= 0 && nc < GRID_SIZE) area.push({ r: i, c: nc });
      }
    }
  }
  // Wrapped + Wrapped = Huge explosion
  else if (s1 === SpecialEffect.WRAPPED && s2 === SpecialEffect.WRAPPED) {
    for (let i = r1 - 2; i <= r1 + 2; i++) {
      for (let j = c1 - 2; j <= c1 + 2; j++) {
        if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) area.push({ r: i, c: j });
      }
    }
  }
  return area;
};
