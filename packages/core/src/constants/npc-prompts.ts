/**
 * Gaming NPC Voice Sample Prompts
 *
 * A diverse collection of NPC dialogue samples covering various archetypes
 * for testing different voice characteristics in game development.
 */

export interface NPCPrompt {
  id: string;
  archetype: string;
  text: string;
  description: string;
}

export const NPC_VOICE_PROMPTS: NPCPrompt[] = [
  {
    id: "merchant-friendly",
    archetype: "Friendly Merchant",
    text: "Welcome, traveler! I have the finest wares in all the realm. Perhaps you need a healing potion for your journey?",
    description: "Warm, welcoming tone with slight enthusiasm",
  },
  {
    id: "guard-stern",
    archetype: "Stern Guard",
    text: "Halt! State your business in the city. Any trouble and you will answer to the royal guard.",
    description: "Authoritative, commanding, no-nonsense",
  },
  {
    id: "wizard-wise",
    archetype: "Wise Wizard",
    text: "Ah, young apprentice. The ancient texts speak of a prophecy, one that may hold the key to our salvation.",
    description: "Elderly, mysterious, contemplative",
  },
  {
    id: "villain-menacing",
    archetype: "Menacing Villain",
    text: "Foolish hero. You think you can stop me? My power grows stronger with each passing moment!",
    description: "Threatening, confident, slightly sinister",
  },
  {
    id: "questgiver-urgent",
    archetype: "Urgent Questgiver",
    text: "Please, you must help us! The monsters have taken my daughter into the dark forest. Time is running out!",
    description: "Desperate, pleading, emotional",
  },
  {
    id: "innkeeper-jovial",
    archetype: "Jovial Innkeeper",
    text: "Ha! Another round for everyone! Drink up, my friends, for tomorrow we may face dragons!",
    description: "Cheerful, boisterous, friendly",
  },
  {
    id: "rogue-sly",
    archetype: "Sly Rogue",
    text: "Keep your voice down. I know where the treasure is hidden, but we need to move quickly and quietly.",
    description: "Secretive, cunning, whispering tone",
  },
  {
    id: "oracle-ethereal",
    archetype: "Ethereal Oracle",
    text: "The threads of fate weave a complex tapestry. I see great danger ahead, but also the promise of glory.",
    description: "Mystical, distant, otherworldly",
  },
  {
    id: "blacksmith-gruff",
    archetype: "Gruff Blacksmith",
    text: "You want me to forge a legendary weapon? It will take time, rare materials, and a hefty sum of gold.",
    description: "Rough, practical, slightly impatient",
  },
  {
    id: "child-innocent",
    archetype: "Innocent Child",
    text: "Are you a real adventurer? Have you fought dragons? Can you teach me to be brave like you?",
    description: "Young, excited, curious",
  },
  {
    id: "general-tactical",
    archetype: "Tactical General",
    text: "Listen carefully. We attack at dawn. The enemy expects us from the east, but we will strike from the north.",
    description: "Strategic, focused, military bearing",
  },
  {
    id: "healer-gentle",
    archetype: "Gentle Healer",
    text: "Rest now, brave warrior. Your wounds are deep, but my herbs and prayers will restore your strength.",
    description: "Caring, soothing, compassionate",
  },
  {
    id: "jester-playful",
    archetype: "Playful Jester",
    text: "Why did the knight bring a ladder to battle? Because he wanted to reach new heights of victory!",
    description: "Energetic, silly, entertaining",
  },
  {
    id: "undead-haunting",
    archetype: "Haunting Undead",
    text: "Death is not the end. Join us in eternal darkness, where pain and suffering fade into nothingness.",
    description: "Eerie, hollow, disturbing",
  },
  {
    id: "bard-dramatic",
    archetype: "Dramatic Bard",
    text: "Gather round and hear the tale of the dragon slayer! A story of courage, sacrifice, and legendary triumph!",
    description: "Theatrical, expressive, storytelling",
  },
];

/**
 * Get a random NPC prompt
 */
export function getRandomNPCPrompt(): NPCPrompt {
  return NPC_VOICE_PROMPTS[
    Math.floor(Math.random() * NPC_VOICE_PROMPTS.length)
  ];
}

/**
 * Get NPC prompt by archetype
 */
export function getNPCPromptByArchetype(
  archetype: string,
): NPCPrompt | undefined {
  return NPC_VOICE_PROMPTS.find((p) =>
    p.archetype.toLowerCase().includes(archetype.toLowerCase()),
  );
}

/**
 * Distribute prompts evenly across a list of items
 * Returns an array where each item gets a unique prompt if possible
 */
export function distributeNPCPrompts<T>(
  items: T[],
): Array<{ item: T; prompt: NPCPrompt }> {
  const result: Array<{ item: T; prompt: NPCPrompt }> = [];

  for (let i = 0; i < items.length; i++) {
    // Cycle through prompts, repeating if there are more items than prompts
    const promptIndex = i % NPC_VOICE_PROMPTS.length;
    result.push({
      item: items[i],
      prompt: NPC_VOICE_PROMPTS[promptIndex],
    });
  }

  return result;
}
