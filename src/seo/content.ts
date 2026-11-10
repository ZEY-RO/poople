import type { GameMode } from '../types/game';

export interface SeoSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface SeoPage {
  path: string;
  title: string;
  description: string;
  heading: string;
  intro: string[];
  sections: SeoSection[];
  faqs?: { question: string; answer: string }[];
  mode?: GameMode;
}

export const SEO_PAGES: SeoPage[] = [
  {
    path: '/',
    title: 'Poople — Free Word Ladder Game & Daily Word Puzzle',
    description: 'Play Poople, a free four-letter word ladder game. Change one letter at a time to reach POOP, with daily puzzles, unlimited practice, and timed challenges.',
    heading: 'Poople: a free word ladder game',
    mode: 'daily',
    intro: [
      'Four letters. One small change per turn. Poople is a browser word puzzle where you build a chain of valid words from a starting word to POOP. The challenge is finding the shortest route through the words in between.',
      'Start with today’s puzzle, play as many ladders as you like in Unlimited, or try a two-minute Rush. You can play on a phone, tablet, or computer without creating an account or downloading an app.',
    ],
    sections: [
      {
        heading: 'How a word ladder works',
        paragraphs: [
          'For example, POLL → POOL → POOP is a complete ladder in two moves. Each step changes exactly one letter in the same position, and every new word must be in the game dictionary. The starting word does not count as a move.',
          'Type your next four-letter word and press Enter, or use the keyboard on screen. The par number shows the fewest possible moves. Hints, legal next words, and a shortest-path comparison after a win help you explore another route.',
        ],
      },
      {
        heading: 'Choose your next challenge',
        paragraphs: ['Five modes offer different ways to play the same one-letter rule.'],
        bullets: [
          'Daily: one date-based puzzle, personal streaks, and a 30-day archive.',
          'Unlimited: random solvable ladders across Easy, Medium, Hard, and Master difficulties.',
          'Rush: solve as many ladders as you can in two minutes.',
          'Versus Bot: race a computer opponent to the target.',
          'The Gauntlet: complete a campaign of 50 stages across five chapters.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Poople free to play?',
        answer: 'Yes. Poople is free to play in your browser, with no account, subscription, or app download required.',
      },
      {
        question: 'Can I play more than one Poople puzzle a day?',
        answer: 'Yes. Unlimited mode has no daily play limit. Daily mode offers one puzzle for each date, and its archive lets you revisit the last 30 puzzles.',
      },
      {
        question: 'How is a word ladder different from a word guessing game?',
        answer: 'In a word ladder, you can see the starting word and the target. You build a chain between them by changing exactly one letter per step, instead of guessing a hidden answer.',
      },
      {
        question: 'Where is my progress saved?',
        answer: 'Poople saves daily progress, settings, and personal records in this browser on this device. They do not automatically sync to other devices, and clearing site data can remove them.',
      },
    ],
  },
  {
    path: '/unlimited/',
    title: 'Poople Unlimited — Free Word Ladder Puzzles',
    description: 'Play unlimited word ladder puzzles in Poople. Choose Easy, Medium, Hard, or Master, change one letter per move, and find the shortest route to POOP.',
    heading: 'Poople Unlimited: word ladders whenever you like',
    mode: 'unlimited',
    intro: [
      'Want another puzzle after the daily? Unlimited gives you a new random, solvable word ladder whenever you choose. There is no daily cap and no timer: take your time finding a route to POOP.',
    ],
    sections: [
      {
        heading: 'Pick a distance, then find a path',
        paragraphs: ['Difficulty is based on the shortest possible route from the starting word to POOP. You can finish with more moves than par; matching par is the extra challenge.'],
        bullets: [
          'Easy: a shortest route of 2–3 moves.',
          'Medium: a shortest route of 4–5 moves.',
          'Hard: a shortest route of 6–7 moves.',
          'Master: a shortest route of 8–10 moves.',
        ],
      },
      {
        heading: 'Practice without waiting for tomorrow',
        paragraphs: [
          'Use New to start another ladder, or Reset to retry the current starting word. Changing difficulty starts a fresh puzzle at that level. A longer route may require a detour through words that look less like the target.',
          'If you get stuck, Hint starts with a letter-position clue. Moves lists legal next words and highlights options on a shortest route. After solving, Compare paths lets you see where your ladder differs from a shortest solution.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does Poople Unlimited have a time limit?',
        answer: 'No. Unlimited mode has neither a countdown nor a daily puzzle limit. For a timed challenge, choose Rush.',
      },
      {
        question: 'Can I replay the same Unlimited puzzle?',
        answer: 'Yes. Reset restarts the current ladder, and Play again after a win gives you another random puzzle. You can also share the solved word pair as a custom challenge.',
      },
    ],
  },
  {
    path: '/daily/',
    title: 'Daily Poople — Today’s Free Word Ladder Puzzle',
    description: 'Solve today’s Poople word ladder, build a daily streak, and explore the 30-day archive. Change one letter per step and try to reach POOP at par.',
    heading: 'Daily Poople: one word ladder each day',
    mode: 'daily',
    intro: [
      'Make a little room for a daily word puzzle. Each date has a set starting word and a route to POOP. Find your own chain of four-letter words, then see whether you can match the shortest possible path.',
    ],
    sections: [
      {
        heading: 'A fresh puzzle at local midnight',
        paragraphs: [
          'Daily Poople follows the date on your device. Players opening the same date get the same starting puzzle. The countdown shows how long remains until the next local midnight.',
          'Your current ladder is saved in this browser, so you can return to an unfinished daily puzzle. Complete daily puzzles on consecutive days to build your streak, and open Your stats to check your personal records.',
        ],
      },
      {
        heading: 'Catch up with the daily archive',
        paragraphs: [
          'Open Archive to browse the last 30 daily puzzles. Each entry shows its starting word and par, or your completed move count. Select a date to play it and use Back to today to return to the current challenge.',
          'After a win, share your result or compare your route with a shortest solution. If you want a new word pair immediately, Unlimited mode is ready without waiting for the next daily reset.',
        ],
      },
    ],
    faqs: [
      {
        question: 'When does the daily Poople puzzle change?',
        answer: 'A new daily puzzle is selected for each calendar date on your device. The countdown runs to your next local midnight.',
      },
      {
        question: 'Can I play an older daily word ladder?',
        answer: 'Yes. The Archive button opens the last 30 daily puzzles, including their starting words and par scores.',
      },
    ],
  },
  {
    path: '/rush/',
    title: 'Poop Rush — Two-Minute Word Ladder Challenge | Poople',
    description: 'Race the clock in Poople’s free Rush mode. Solve word ladders in two minutes, build a scoring combo, and try to beat your personal high score.',
    heading: 'Poop Rush: two minutes of word ladders',
    mode: 'rush',
    intro: [
      'Find the words before the clock runs out. Rush gives you two minutes to solve as many ladders to POOP as you can. Each completed puzzle leads straight into another, keeping the same countdown running.',
    ],
    sections: [
      {
        heading: 'How Rush scoring works',
        paragraphs: [
          'Select Start Rush when you are ready. Your combo starts at 1×. Solving a ladder earns 100 points multiplied by the current combo, plus 50 bonus points if you match par. The combo then increases by one for the next puzzle.',
          'Your first solve is worth 100 points, or 150 at par. Your second consecutive solve is worth 200 points, or 250 at par. Your best score and best number of ladders solved are kept in this browser.',
        ],
      },
      {
        heading: 'Decide when to move on',
        paragraphs: [
          'Skip replaces a difficult puzzle, but costs five seconds and resets your combo to 1×. A quick skip can free you from a route you cannot see, while repeated skips leave little time to build points.',
          'The countdown continues while you think and when the tab is in the background. Practice common word connections in Unlimited first, then return to Rush when you want to test how quickly you can use them.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long is a Poop Rush game?',
        answer: 'Each run starts with 120 seconds. Skipping a puzzle subtracts five seconds; solving a ladder does not restart the clock.',
      },
    ],
  },
  {
    path: '/versus/',
    title: 'Poople Versus Bot — Race a Word Ladder Opponent',
    description: 'Race a computer opponent in Poople’s free word ladder game. Pick one of three bots, build your path one letter at a time, and reach POOP first.',
    heading: 'Versus Bot: a race to the final word',
    mode: 'versus',
    intro: [
      'You and a computer opponent start from the same four-letter word. Both build a ladder to POOP, one legal change at a time. Reach the target before the bot to win the round.',
    ],
    sections: [
      {
        heading: 'Choose your opponent',
        paragraphs: ['Three bots offer different speeds and habits. Changing opponents starts a new round.'],
        bullets: [
          'Sloppy Plunger takes more time between moves and sometimes follows a detour.',
          'Speedy Flush moves faster and takes fewer detours.',
          'Grandmaster Commode moves fastest and follows a shortest route.',
        ],
      },
      {
        heading: 'Think ahead while the bot keeps moving',
        paragraphs: [
          'The race display shows both players’ progress and move counts. A legal word can still take you farther from the goal, so a short pause to plan your next two moves may save a longer detour.',
          'If the bot reaches POOP first, try a rematch or choose a more relaxed opponent. Your versus wins and losses are saved in your browser. This mode uses computer opponents; it does not match you with another person online.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Poople Versus an online multiplayer game?',
        answer: 'Versus mode races you against one of three computer-controlled bots. To challenge a friend to the same word pair, use the custom puzzle builder and share its link.',
      },
    ],
  },
  {
    path: '/campaign/',
    title: 'The Gauntlet — 50 Word Ladder Levels | Poople',
    description: 'Play The Gauntlet, Poople’s free 50-stage word ladder campaign. Complete five chapters, unlock the next level, and match par to earn three stars.',
    heading: 'The Gauntlet: a 50-stage word ladder campaign',
    mode: 'campaign',
    intro: [
      'Prefer a map of puzzles to a random starting word? The Gauntlet gives you 50 fixed word ladders across five chapters. Begin with short connections to POOP and work through a wider range of starting words.',
    ],
    sections: [
      {
        heading: 'Complete a stage to open the next',
        paragraphs: [
          'Choose Start stage 1 on the campaign map. Completing a stage unlocks the following stage, while completed stages stay available to replay. The map shows the word pair, par, and stars for every level.',
          'The five chapters are The Porcelain Basics, The Plumber’s Apprentice, The Porcelain Labyrinth, Pipe Dreams & Obstacles, and Grandmaster Commode. Each contains ten stages.',
        ],
      },
      {
        heading: 'Aim for all 150 stars',
        paragraphs: [
          'Finish at par to earn three stars. A route one or two moves over par earns two stars; any longer completed route earns one. A win still unlocks the next stage, so you can come back to shorten a difficult ladder later.',
          'Your best star result for each stage is saved in this browser. Use Compare paths after solving to study a shortest solution, then replay the stage to try a more direct route.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How many levels are in Poople’s campaign?',
        answer: 'The Gauntlet has 50 stages divided into five chapters of ten. Each stage can earn up to three stars, for 150 stars in total.',
      },
      {
        question: 'Do I need three stars to unlock the next level?',
        answer: 'No. Completing a stage with any star result unlocks the following stage. You can replay completed stages to improve your best result.',
      },
    ],
  },
  {
    path: '/how-to-play/',
    title: 'How to Play Poople — Word Ladder Rules & Examples',
    description: 'Learn Poople’s word ladder rules with a worked example. See how to change one letter, count moves, use hints, and create a custom puzzle for a friend.',
    heading: 'How to play Poople',
    intro: [
      'The goal of Poople is to connect two four-letter words through a series of valid words. Most puzzles end at POOP. You know the destination from the start; your job is to discover the words that lead there.',
    ],
    sections: [
      {
        heading: 'The three word ladder rules',
        paragraphs: ['Read the starting word at the top of the ladder, then type the complete word you want to use next.'],
        bullets: [
          'Every word must have exactly four letters and appear in Poople’s game dictionary.',
          'Change exactly one letter from the previous word. Keep all other letters in their positions.',
          'Keep making valid changes until the new word matches the target.',
        ],
      },
      {
        heading: 'A complete example: POLL to POOP',
        paragraphs: [
          'POLL → POOL → POOP is a legal two-move ladder. First, change the third letter of POLL from L to O to make POOL. Then change the fourth letter of POOL from L to P to make POOP.',
          'POLL → POOP is not a legal single move because both the third and fourth letters change. Rearranging letters, adding a letter, or submitting the same word again is also not allowed. Count the changes, not the words: the example has three words but only two moves.',
        ],
      },
      {
        heading: 'Enter words and explore your options',
        paragraphs: [
          'Use your physical keyboard or tap the keys on screen. Enter submits your word, and Backspace deletes a letter before submission. An invalid word or change shows a message so you can correct it.',
          'Hint first identifies a letter position, then offers a definition clue, and finally fills in a suggested next word for you to submit. Moves shows valid next words and highlights choices on a shortest route. The information icon beside a ladder word opens its definition.',
          'Undo removes the last accepted move. Reset starts the ladder again. Hard Mode in Settings disables undo and rewinding, so switch it off if you want to experiment freely.',
        ],
      },
      {
        heading: 'Understand par and the result screen',
        paragraphs: [
          'Par is the fewest moves needed between the starting word and the target using the game dictionary. Reaching the target completes the puzzle even when you take a longer route. A shortest path may be less obvious than a series of words that look closer to the target.',
          'After a win, the result screen shows your moves, par, and route. Compare paths puts your solution beside a shortest solution; Replay steps through your own ladder. Share result creates a scorecard and a link you can send to a friend.',
        ],
      },
      {
        heading: 'Make your own word ladder',
        paragraphs: [
          'Open the custom puzzle builder and enter different four-letter start and target words. The builder checks that both words are in the dictionary and that a connecting ladder exists before you play or copy its link.',
          'Custom targets do not have to be POOP. For example, COLD → CORD → CARD → WARD → WARM is a legal four-move ladder between COLD and WARM. You can preview a shortest solution in the builder or leave it hidden while your friend tries the puzzle.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why does Poople reject my word?',
        answer: 'A move must contain four letters, be in the game dictionary, and differ from the previous word in exactly one position. A word can be familiar to you and still be absent from this game’s dictionary.',
      },
      {
        question: 'Is there only one correct solution?',
        answer: 'No. Many word pairs have more than one legal ladder, and there can also be multiple shortest routes. Any valid chain that reaches the target completes the puzzle.',
      },
    ],
  },
  {
    path: '/word-ladder-strategies/',
    title: 'Word Ladder Strategies — Find Shorter Paths | Poople',
    description: 'Find better word ladder routes with practical Poople strategies. Learn to work backward, spot useful word families, plan detours, and practice against par.',
    heading: 'Word ladder strategies for shorter routes',
    intro: [
      'A word ladder tests connections as much as vocabulary. Knowing the target does not make the route obvious: you may need to change a letter that already matches or visit a word that seems farther away. These approaches help you search with a plan.',
    ],
    sections: [
      {
        heading: 'Count the different letters first',
        paragraphs: [
          'Compare your current word with the target, position by position. Every different position needs at least one change, so the number of differences is a lower bound on the moves still needed. Dictionary restrictions can make the real shortest path longer.',
          'For POLL and POOP, the third and fourth positions differ. POLL → POOL → POOP changes each of those positions once and reaches the target in two moves. Finding a word that looks closer is useful, but it is only helpful when the next steps remain legal.',
        ],
      },
      {
        heading: 'Work backward from the destination',
        paragraphs: [
          'Ask which words can reach the target in one move. POOL, POOR, LOOP, and COOP each connect directly to POOP. If you can reach one of these, the final step is already settled.',
          'Now look for a connection between your current word and one of those approach words. You do not need to guess the entire ladder at once: connecting two short partial routes can make a longer puzzle easier to reason about.',
        ],
      },
      {
        heading: 'Look for word families and useful detours',
        paragraphs: [
          'Try changing one position at a time while holding the other three letters fixed. Families such as COOL, FOOL, POOL, and TOOL give you several options without needing to search every four-letter word you know.',
          'A matching letter is not locked. Sometimes changing it opens a word family with a path to the goal. For example, a shortest route from PLUG to POOP begins with PLUG → SLUG, changing the first letter even though P already matches the target. Check connections rather than judging a move only by appearance.',
        ],
      },
      {
        heading: 'Use help to learn the connection',
        paragraphs: [
          'When stuck, start with the first Hint before revealing a full next word. Knowing which position to change narrows your search while leaving the vocabulary choice to you. Moves can show a connection you missed; read a word’s definition if it is unfamiliar.',
          'After solving, compare your route with a shortest path. Find the first point where the routes separate and ask which word family you overlooked. Replay the same ladder to practice that connection, or choose a new Unlimited puzzle at a manageable difficulty.',
        ],
      },
      {
        heading: 'Change your plan for timed modes',
        paragraphs: [
          'In Daily and Unlimited, you can pause and explore without a countdown. In Rush, a completed ladder earns points even when it is over par, so a familiar longer route can be more useful than spending the remaining time searching for a perfect one.',
          'Rush adds a par bonus, but skipping costs five seconds and resets the combo. Against a bot, planning a couple of moves ahead can reduce the pauses between submissions. Use untimed practice to learn the connections you want to recognize quickly later.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does every word ladder move need to look closer to the target?',
        answer: 'No. A legal solution can require changing a matching letter or temporarily increasing the number of letters that differ from the target. The available dictionary words determine which routes connect.',
      },
      {
        question: 'What does a highlighted word in Moves mean?',
        answer: 'Highlighted choices are legal next words on a shortest route from the current word to the target. Other listed words are legal moves, but may lead to a longer route.',
      },
    ],
  },
];
