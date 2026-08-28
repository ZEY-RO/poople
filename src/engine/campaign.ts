import { CampaignStage } from '../types/game';
import { findShortestPath } from './solver';

const RAW_STAGES: Array<{
  id: number;
  name: string;
  category: string;
  startWord: string;
  targetWord: string;
  description: string;
}> = [
  // Chapter 1: The Bathroom Basics (1-10)
  { id: 1, name: "Gentle Flush", category: "Chapter 1: The Porcelain Basics", startWord: "LOOP", targetWord: "POOP", description: "A simple 1-letter change to learn the ropes!" },
  { id: 2, name: "Chicken Pen", category: "Chapter 1: The Porcelain Basics", startWord: "COOP", targetWord: "POOP", description: "From the roost straight into the bowl." },
  { id: 3, name: "Splash Down", category: "Chapter 1: The Porcelain Basics", startWord: "PLOP", targetWord: "POOP", description: "That distinct sound when something drops." },
  { id: 4, name: "Dirty Waters", category: "Chapter 1: The Porcelain Basics", startWord: "SLOP", targetWord: "POOP", description: "Messy spillage leading directly to POOP." },
  { id: 5, name: "Morning Cheer", category: "Chapter 1: The Porcelain Basics", startWord: "TOOT", targetWord: "POOP", description: "A small sound before the grand finale." },
  { id: 6, name: "Winter Chill", category: "Chapter 1: The Porcelain Basics", startWord: "COOL", targetWord: "POOP", description: "Keep your cool as you guide COOL down to POOP." },
  { id: 7, name: "Deep End", category: "Chapter 1: The Porcelain Basics", startWord: "POOL", targetWord: "POOP", description: "Dive into the swimming pool and emerge at POOP." },
  { id: 8, name: "Penny Pincher", category: "Chapter 1: The Porcelain Basics", startWord: "POOR", targetWord: "POOP", description: "A classic single letter change from POOR." },
  { id: 9, name: "Night Glow", category: "Chapter 1: The Porcelain Basics", startWord: "MOON", targetWord: "POOP", description: "Look up at the glowing moon, then look down." },
  { id: 10, name: "Root Canal", category: "Chapter 1: The Porcelain Basics", startWord: "ROOT", targetWord: "POOP", description: "Digging through the root system." },

  // Chapter 2: The Plumber's Apprentice (11-20)
  { id: 11, name: "Silent But Deadly", category: "Chapter 2: The Plumber's Apprentice", startWord: "FART", targetWord: "POOP", description: "The iconic rite of passage. Turn gas into solid." },
  { id: 12, name: "Cold Snap", category: "Chapter 2: The Plumber's Apprentice", startWord: "COLD", targetWord: "POOP", description: "Thaw the frozen pipes and reach the drain." },
  { id: 13, name: "Hay Day", category: "Chapter 2: The Plumber's Apprentice", startWord: "BARN", targetWord: "POOP", description: "Mucking out the stalls of the old barn." },
  { id: 14, name: "Casual Banter", category: "Chapter 2: The Plumber's Apprentice", startWord: "CHAT", targetWord: "POOP", description: "Bathroom gossip travels fast." },
  { id: 15, name: "Quick Nip", category: "Chapter 2: The Plumber's Apprentice", startWord: "BEER", targetWord: "POOP", description: "What goes in must eventually come out." },
  { id: 16, name: "Hot Broth", category: "Chapter 2: The Plumber's Apprentice", startWord: "SOUP", targetWord: "POOP", description: "Warm digestive journey from soup to POOP." },
  { id: 17, name: "Clock Watcher", category: "Chapter 2: The Plumber's Apprentice", startWord: "TIME", targetWord: "POOP", description: "Taking a leisurely 15-minute phone break." },
  { id: 18, name: "Royal Throne", category: "Chapter 2: The Plumber's Apprentice", startWord: "KING", targetWord: "POOP", description: "Even monarchs must visit the porcelain seat." },
  { id: 19, name: "Sweet Treat", category: "Chapter 2: The Plumber's Apprentice", startWord: "CAKE", targetWord: "POOP", description: "The ultimate metabolic cycle of cake." },
  { id: 20, name: "Avian Mascot", category: "Chapter 2: The Plumber's Apprentice", startWord: "DUCK", targetWord: "POOP", description: "The rubber duck floating in the tub." },

  // Chapter 3: The Porcelain Labyrinth (21-30)
  { id: 21, name: "Shining Trophy", category: "Chapter 3: The Porcelain Labyrinth", startWord: "GOLD", targetWord: "POOP", description: "All that glitters is not gold." },
  { id: 22, name: "Cheeky Smirk", category: "Chapter 3: The Porcelain Labyrinth", startWord: "GRIN", targetWord: "POOP", description: "Wipe that smile off and get flushing!" },
  { id: 23, name: "Deep Affection", category: "Chapter 3: The Porcelain Labyrinth", startWord: "LOVE", targetWord: "POOP", description: "Poetry meets plumbing in this 5-step puzzle." },
  { id: 24, name: "Recreation", category: "Chapter 3: The Porcelain Labyrinth", startWord: "PLAY", targetWord: "POOP", description: "Playing mobile games on the throne." },
  { id: 25, name: "Wild Beast", category: "Chapter 3: The Porcelain Labyrinth", startWord: "LION", targetWord: "POOP", description: "Taming the ferocious jungle predator." },
  { id: 26, name: "Stormy Weather", category: "Chapter 3: The Porcelain Labyrinth", startWord: "RAIN", targetWord: "POOP", description: "When it pours, the sewer drains overflow." },
  { id: 27, name: "Bonfire Blaze", category: "Chapter 3: The Porcelain Labyrinth", startWord: "FIRE", targetWord: "POOP", description: "After spicy curry night, you'll need this fire ladder." },
  { id: 28, name: "Underwater", category: "Chapter 3: The Porcelain Labyrinth", startWord: "FISH", targetWord: "POOP", description: "Swimming upstream against the tide." },
  { id: 29, name: "Melody Maker", category: "Chapter 3: The Porcelain Labyrinth", startWord: "SING", targetWord: "POOP", description: "Acapella shower concertos." },
  { id: 30, name: "Fortune Favors", category: "Chapter 3: The Porcelain Labyrinth", startWord: "LUCK", targetWord: "POOP", description: "May good fortune guide your single-letter swaps." },

  // Chapter 4: Pipe Dreams & Obstacles (31-40)
  { id: 31, name: "Conduit Flow", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "PIPE", targetWord: "POOP", description: "Navigating the subterranean PVC maze." },
  { id: 32, name: "Plunger Power", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "PUMP", targetWord: "POOP", description: "Mechanical suction for stubborn clogs." },
  { id: 33, name: "Sanitary Bubble", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "SOAP", targetWord: "POOP", description: "Remember to wash your hands afterwards!" },
  { id: 34, name: "Muddy Track", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "DIRT", targetWord: "POOP", description: "Grime, grit, and bathroom soil." },
  { id: 35, name: "Air Flow", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "VENT", targetWord: "POOP", description: "Turning on the exhaust fan to clear the air." },
  { id: 36, name: "Drainage Basin", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "BOWL", targetWord: "POOP", description: "The bowl itself awaits your final stroke." },
  { id: 37, name: "Paper Dispenser", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "ROLL", targetWord: "POOP", description: "Never run out of 2-ply toilet paper!" },
  { id: 38, name: "Tight Stopper", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "PLUG", targetWord: "POOP", description: "Unplugging the bathtub drain." },
  { id: 39, name: "Hot Soak", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "BATH", targetWord: "POOP", description: "Relaxing in the bubbles before disaster strikes." },
  { id: 40, name: "Sewer U-Bend", category: "Chapter 4: Pipe Dreams & Obstacles", startWord: "TRAP", targetWord: "POOP", description: "The U-bend P-trap holding water seal." },

  // Chapter 5: Grandmaster Commode (41-50)
  { id: 41, name: "The Stench", category: "Chapter 5: Grandmaster Commode", startWord: "ODOR", targetWord: "POOP", description: "A pungent aroma requiring mastery to conquer." },
  { id: 42, name: "Blocked Flow", category: "Chapter 5: Grandmaster Commode", startWord: "CLOG", targetWord: "POOP", description: "A treacherous 6-step clog requiring surgical precision." },
  { id: 43, name: "Noxious Hazard", category: "Chapter 5: Grandmaster Commode", startWord: "FOUL", targetWord: "POOP", description: "Only the cleanest minds can clear this foul route." },
  { id: 44, name: "Slow Drip", category: "Chapter 5: Grandmaster Commode", startWord: "LEAK", targetWord: "POOP", description: "Fix the phantom leak before water damage occurs." },
  { id: 45, name: "Final Polish", category: "Chapter 5: Grandmaster Commode", startWord: "WIPE", targetWord: "POOP", description: "The most essential bathroom tool." },
  { id: 46, name: "Cosmic Odyssey", category: "Chapter 5: Grandmaster Commode", startWord: "STAR", targetWord: "POOP", description: "From celestial heights down to earthly realities." },
  { id: 47, name: "Courage Under Pressure", category: "Chapter 5: Grandmaster Commode", startWord: "HERO", targetWord: "POOP", description: "Heroes are forged in the most dire bathroom emergencies." },
  { id: 48, name: "Stirring the Cauldron", category: "Chapter 5: Grandmaster Commode", startWord: "STIR", targetWord: "POOP", description: "Complex word ladder navigation across 6 distinct steps." },
  { id: 49, name: "Deepest Depths", category: "Chapter 5: Grandmaster Commode", startWord: "DARK", targetWord: "POOP", description: "When the power goes out in the restroom." },
  { id: 50, name: "The Golden Throne", category: "Chapter 5: Grandmaster Commode", startWord: "DAWN", targetWord: "POOP", description: "The ultimate 50th stage crowning your master plumber status!" }
];

export const CAMPAIGN_STAGES: CampaignStage[] = RAW_STAGES.map(s => {
  const path = findShortestPath(s.startWord, s.targetWord) || [];
  const par = Math.max(1, path.length - 1);
  let difficulty: CampaignStage['difficulty'] = 'easy';
  if (par >= 6) difficulty = 'master';
  else if (par >= 4) difficulty = 'hard';
  else if (par >= 3) difficulty = 'medium';

  return {
    ...s,
    par,
    difficulty
  };
});
