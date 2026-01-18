
import { FoodType, Level } from './types';

export const GRID_SIZE = 8;

export const CREATOR_INFO = {
  name: "Sujon Kumar Roy",
  facebook: "sujonworld0"
};

export const FOOD_ITEMS: Record<string, { name: string, color: string, icon: string, textColor: string }> = {
  BHAAT: { name: 'Bhaat', color: '#FFFFFF', textColor: '#475569', icon: '🍚' },
  DAAL: { name: 'Daal', color: '#FACC15', textColor: '#854D0E', icon: '🥣' },
  SHOBJIE: { name: 'Shobjie', color: '#4ADE80', textColor: '#166534', icon: '🥦' },
  RUTI: { name: 'Ruti', color: '#FDE68A', textColor: '#92400E', icon: '🫓' },
  BEGUN_BHORTHA: { name: 'Begun Bhortha', color: '#A855F7', textColor: '#581C87', icon: '🍆' },
  ALU_BHORTHA: { name: 'Alu Bhortha', color: '#EAB308', textColor: '#713F12', icon: '🥔' },
  CHICKEN_BIRYANI: { name: 'Chicken Biryani', color: '#EF4444', textColor: '#FFFFFF', icon: '🍗' },
  ILISH_MAACH: { name: 'Ilish Maach', color: '#94A3B8', textColor: '#FFFFFF', icon: '🐟' },
  MISHTI_DOI: { name: 'Mishti Doi', color: '#FDE68A', textColor: '#92400E', icon: '🍨' },
  LOCKED_CHEF: { name: 'Locked Dish', color: '#64748b', textColor: '#FFFFFF', icon: '🔒' },
  BURNT_FOOD: { name: 'Charred Food', color: '#2d2d2d', textColor: '#FFFFFF', icon: '🔥' },
};

export const LEVELS: Level[] = [
  { id: 1, moves: 45, goals: [{ type: 'SCORE', target: 800 }], description: 'Dadi says: Welcome to the kitchen! Make some simple matches.' },
  { id: 2, moves: 40, goals: [{ type: 'COLLECT', target: 12, foodType: 'BHAAT' }], description: 'Bhaat is the heart of every meal. Collect 12 plates!' },
  { id: 3, moves: 35, goals: [{ type: 'COLLECT', target: 15, foodType: 'DAAL' }], description: 'Healthy and tasty! Match 15 bowls of Daal.' },
  { id: 4, moves: 35, goals: [{ type: 'CLEAR_BURNT', target: 16 }], description: 'The stove is smoking! Clear 16 burnt patches on the board.' },
  { id: 5, moves: 30, goals: [{ type: 'COLLECT', target: 10, foodType: 'ILISH_MAACH' }], description: 'The King of Fish! Catch 10 Ilish Maach.' },
  { id: 6, moves: 30, goals: [{ type: 'COLLECT_ALL', target: 80 }], description: 'Grand Family Feast! Collect 80 items of any kind.' },
  { id: 7, moves: 25, goals: [{ type: 'COLLECT', target: 12, foodType: 'MISHTI_DOI' }], description: 'Time for dessert! Match 12 pots of Mishti Doi.' },
  { id: 8, moves: 25, goals: [{ type: 'SCORE', target: 12000 }], description: 'Royal Banquet! Reach 12,000 points with big combos.' },
  { id: 9, moves: 22, goals: [{ type: 'CLEAR_BURNT', target: 24 }], description: 'Kitchen Fire! Clear 24 burnt spots before time runs out.' },
  { id: 10, moves: 28, goals: [{ type: 'SCORE', target: 25000 }, { type: 'COLLECT', target: 10, foodType: 'CHICKEN_BIRYANI' }], description: 'Masterchef Finale! Huge score and Biryani needed!' },
  { id: 999, moves: 20, goals: [{ type: 'SCORE', target: 10000 }], description: 'Daily Special: A fast and spicy recipe for you!', isDaily: true },
];
