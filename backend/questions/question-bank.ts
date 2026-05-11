import type { Question } from "@/backend/shared/types";

export const questionBank: Question[] = [
  {
    id: "q_maths_1",
    subjectType: "MATHS",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "EASY",
    microTopic: "Fractions",
    instruction: "Choose the correct answer.",
    questionData: { mode: "text", content: "What is 1/4 of 48?" },
    options: [
      { mode: "text", content: "8" },
      { mode: "text", content: "10" },
      { mode: "text", content: "12" },
      { mode: "text", content: "16" }
    ],
    answer: "12",
    explanation: "Divide 48 by 4. One quarter of 48 is 12.",
    skillTags: ["arithmetic", "fractions", "mental maths"],
    estimatedSeconds: 45
  },
  {
    id: "q_maths_2",
    subjectType: "MATHS",
    questionType: "SHORT_ANSWER",
    difficultyLevel: "MEDIUM",
    microTopic: "Sequences",
    instruction: "Write the next number only.",
    questionData: { mode: "text", content: "Find the next number in the sequence: 3, 6, 12, 24, ?" },
    options: [],
    answer: "48",
    explanation: "Each term doubles, so 24 x 2 = 48.",
    skillTags: ["sequences", "doubling", "number patterns"],
    estimatedSeconds: 60
  },
  {
    id: "q_maths_3",
    subjectType: "MATHS",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Ratio",
    instruction: "Choose the correct answer.",
    stimulus: {
      title: "Recipe Ratio",
      mode: "text",
      content: "A fruit drink uses orange juice and apple juice in the ratio 3:2."
    },
    questionData: { mode: "text", content: "If 600 ml of orange juice is used, how much apple juice is needed?" },
    options: [
      { mode: "text", content: "200 ml" },
      { mode: "text", content: "300 ml" },
      { mode: "text", content: "400 ml" },
      { mode: "text", content: "900 ml" }
    ],
    answer: "400 ml",
    explanation: "3 parts orange equals 600 ml, so 1 part is 200 ml. Apple is 2 parts, so 400 ml.",
    skillTags: ["ratio", "proportion"],
    estimatedSeconds: 85
  },
  {
    id: "q_maths_4",
    subjectType: "MATHS",
    questionType: "SHORT_ANSWER",
    difficultyLevel: "MEDIUM",
    microTopic: "Area",
    instruction: "Write the answer with units.",
    questionData: { mode: "text", content: "A rectangle is 9 cm long and 6 cm wide. What is its area?" },
    options: [],
    answer: "54 cm2",
    explanation: "Area of a rectangle is length x width. 9 x 6 = 54 square centimetres.",
    skillTags: ["geometry", "area"],
    estimatedSeconds: 70
  },
  {
    id: "q_maths_5",
    subjectType: "MATHS",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "HARD",
    microTopic: "Percentages",
    instruction: "Choose the best answer.",
    questionData: { mode: "text", content: "A coat costing GBP 80 is reduced by 15%. What is the sale price?" },
    options: [
      { mode: "text", content: "GBP 12" },
      { mode: "text", content: "GBP 65" },
      { mode: "text", content: "GBP 68" },
      { mode: "text", content: "GBP 92" }
    ],
    answer: "GBP 68",
    explanation: "15% of GBP 80 is GBP 12. Subtract GBP 12 from GBP 80 to get GBP 68.",
    skillTags: ["percentages", "money"],
    estimatedSeconds: 90
  },
  {
    id: "q_eng_1",
    subjectType: "ENGLISH",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "EASY",
    microTopic: "Vocabulary in Context",
    instruction: "Read the sentence and choose the closest meaning.",
    stimulus: {
      title: "Sentence",
      mode: "text",
      content: "Maya was cautious as she stepped across the icy path, testing each stone before placing her full weight on it."
    },
    questionData: { mode: "text", content: "In this sentence, what does 'cautious' most nearly mean?" },
    options: [
      { mode: "text", content: "Careful" },
      { mode: "text", content: "Noisy" },
      { mode: "text", content: "Quick" },
      { mode: "text", content: "Hungry" }
    ],
    answer: "Careful",
    explanation: "Maya is testing each stone before stepping, so she is being careful.",
    skillTags: ["vocabulary", "context clues"],
    estimatedSeconds: 55
  },
  {
    id: "q_eng_2",
    subjectType: "ENGLISH",
    questionType: "SHORT_ANSWER",
    difficultyLevel: "MEDIUM",
    microTopic: "Comprehension",
    instruction: "Read the passage carefully, then answer in one complete sentence.",
    stimulus: {
      title: "The Lantern Path",
      mode: "passage",
      content:
        "The lane behind Devansh's house was usually quiet after sunset, but that evening it shimmered with tiny lanterns. Each one hung from a low branch, throwing warm circles of light onto the stones below. Devansh slowed down. He had planned to hurry home before the rain returned, yet the path seemed to be asking him to notice things he normally missed: the silver trail of a snail, the smell of wet leaves, and the soft tick of water dripping from the wall. At the final bend, he found a card tied with blue thread. It read, 'For those who look closely, every ordinary road becomes an adventure.'"
    },
    questionData: { mode: "text", content: "What lesson does Devansh learn from walking along the lantern path?" },
    options: [],
    answer: "ordinary things can become special when you look closely",
    explanation: "The passage shows Devansh noticing small details and learning that ordinary places can feel adventurous when observed carefully.",
    skillTags: ["inference", "theme", "evidence"],
    estimatedSeconds: 150
  },
  {
    id: "q_eng_3",
    subjectType: "ENGLISH",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Comprehension",
    instruction: "Use evidence from the passage to answer.",
    stimulus: {
      title: "The Lantern Path",
      mode: "passage",
      content:
        "The lane behind Devansh's house was usually quiet after sunset, but that evening it shimmered with tiny lanterns. Each one hung from a low branch, throwing warm circles of light onto the stones below. Devansh slowed down. He had planned to hurry home before the rain returned, yet the path seemed to be asking him to notice things he normally missed: the silver trail of a snail, the smell of wet leaves, and the soft tick of water dripping from the wall."
    },
    questionData: { mode: "text", content: "Which phrase best shows that the setting feels magical?" },
    options: [
      { mode: "text", content: "usually quiet after sunset" },
      { mode: "text", content: "shimmered with tiny lanterns" },
      { mode: "text", content: "planned to hurry home" },
      { mode: "text", content: "the rain returned" }
    ],
    answer: "shimmered with tiny lanterns",
    explanation: "The word 'shimmered' and the image of tiny lanterns create a magical atmosphere.",
    skillTags: ["evidence retrieval", "setting", "word choice"],
    estimatedSeconds: 75
  },
  {
    id: "q_eng_4",
    subjectType: "ENGLISH",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Grammar",
    instruction: "Choose the sentence with the correct punctuation.",
    questionData: { mode: "text", content: "Which sentence is punctuated correctly?" },
    options: [
      { mode: "text", content: "Although it was raining Devansh went outside." },
      { mode: "text", content: "Although it was raining, Devansh went outside." },
      { mode: "text", content: "Although, it was raining Devansh went outside." },
      { mode: "text", content: "Although it was raining Devansh, went outside." }
    ],
    answer: "Although it was raining, Devansh went outside.",
    explanation: "A comma is needed after the subordinate clause at the start of the sentence.",
    skillTags: ["punctuation", "clauses"],
    estimatedSeconds: 60
  },
  {
    id: "q_eng_5",
    subjectType: "ENGLISH",
    questionType: "SHORT_ANSWER",
    difficultyLevel: "HARD",
    microTopic: "Author's Technique",
    instruction: "Answer in one sentence using evidence from the passage.",
    stimulus: {
      title: "The Lantern Path",
      mode: "passage",
      content:
        "Each lantern hung from a low branch, throwing warm circles of light onto the stones below. Devansh slowed down. He had planned to hurry home before the rain returned, yet the path seemed to be asking him to notice things he normally missed."
    },
    questionData: { mode: "text", content: "How does the writer show that the path changes Devansh's mood?" },
    options: [],
    answer: "he slows down and notices details he normally missed",
    explanation: "The writer shows a change because Devansh stops hurrying and begins noticing small details around him.",
    skillTags: ["inference", "writer's technique", "evidence"],
    estimatedSeconds: 140
  },
  {
    id: "q_vr_1",
    subjectType: "VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Anagrams",
    instruction: "Find the option that is true.",
    questionData: { mode: "text", content: "Which word can be made from the letters 'LPAET'?" },
    options: [
      { mode: "text", content: "Plate" },
      { mode: "text", content: "Petal" },
      { mode: "text", content: "Pleat" },
      { mode: "text", content: "All of these" }
    ],
    answer: "All of these",
    explanation: "The same letters can form plate, petal, and pleat.",
    skillTags: ["anagrams", "letter manipulation"],
    estimatedSeconds: 50
  },
  {
    id: "q_vr_2",
    subjectType: "VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Word Relationships",
    instruction: "Choose the pair that completes the relationship.",
    stimulus: {
      title: "Relationship",
      mode: "text",
      content: "Puppy is to dog as kitten is to ____."
    },
    questionData: { mode: "text", content: "Which word completes the analogy?" },
    options: [
      { mode: "text", content: "Cat" },
      { mode: "text", content: "Cub" },
      { mode: "text", content: "Foal" },
      { mode: "text", content: "Calf" }
    ],
    answer: "Cat",
    explanation: "A puppy grows into a dog. A kitten grows into a cat.",
    skillTags: ["analogies", "vocabulary"],
    estimatedSeconds: 45
  },
  {
    id: "q_vr_3",
    subjectType: "VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Odd One Out",
    instruction: "Choose the word that does not belong.",
    questionData: { mode: "text", content: "Which word is the odd one out?" },
    options: [
      { mode: "text", content: "violin" },
      { mode: "text", content: "flute" },
      { mode: "text", content: "trumpet" },
      { mode: "text", content: "canvas" }
    ],
    answer: "canvas",
    explanation: "Violin, flute, and trumpet are musical instruments. Canvas is used for painting.",
    skillTags: ["classification", "vocabulary"],
    estimatedSeconds: 45
  },
  {
    id: "q_vr_4",
    subjectType: "VERBAL_REASONING",
    questionType: "SHORT_ANSWER",
    difficultyLevel: "HARD",
    microTopic: "Letter Codes",
    instruction: "Write the missing coded word.",
    stimulus: {
      title: "Code Rule",
      mode: "text",
      content: "In a code, CAT is written as DBU. Each letter moves one place forward in the alphabet."
    },
    questionData: { mode: "text", content: "How would DOG be written in the same code?" },
    options: [],
    answer: "EPH",
    explanation: "D becomes E, O becomes P, and G becomes H.",
    skillTags: ["codes", "alphabet"],
    estimatedSeconds: 75
  },
  {
    id: "q_vr_5",
    subjectType: "VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "HARD",
    microTopic: "Compound Words",
    instruction: "Choose the word that can go after the first word and before the second word.",
    stimulus: {
      title: "Word Link",
      mode: "text",
      content: "sun ( ? ) case"
    },
    questionData: { mode: "text", content: "Which word completes both compound words?" },
    options: [
      { mode: "text", content: "light" },
      { mode: "text", content: "flower" },
      { mode: "text", content: "shine" },
      { mode: "text", content: "glass" }
    ],
    answer: "glass",
    explanation: "Sunglass/sunglasses and glass case both form meaningful word links.",
    skillTags: ["compound words", "word links"],
    estimatedSeconds: 70
  },
  {
    id: "q_nvr_1",
    subjectType: "NON_VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "HARD",
    microTopic: "Rotation",
    instruction: "Study the sequence. Choose the figure that should come next.",
    stimulus: {
      title: "Shape Sequence",
      mode: "svg",
      content:
        "<svg viewBox='0 0 520 140' role='img' aria-label='Non-verbal sequence of rotating L shapes'><g fill='none' stroke='#111' stroke-width='6' stroke-linejoin='round'><path d='M40 35 h45 v45 h35'/><path d='M150 35 v45 h45 v35'/><path d='M280 80 h-45 v-45 h-35'/><path d='M390 115 v-45 h-45 v-35'/></g><text x='480' y='82' font-size='42' font-weight='700' fill='#111'>?</text></svg>",
      caption: "The L-shape rotates 90 degrees clockwise each step."
    },
    questionData: { mode: "text", content: "Which figure continues the sequence?" },
    options: [
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><path d='M28 22 h34 v34 h27' fill='none' stroke='#111' stroke-width='7' stroke-linejoin='round'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><path d='M78 20 v34 h-34 v25' fill='none' stroke='#111' stroke-width='7' stroke-linejoin='round'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><path d='M88 60 h-34 v-34 h-27' fill='none' stroke='#111' stroke-width='7' stroke-linejoin='round'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><path d='M32 70 v-34 h34 v-25' fill='none' stroke='#111' stroke-width='7' stroke-linejoin='round'/></svg>" }
    ],
    answer: "<svg viewBox='0 0 120 90'><path d='M28 22 h34 v34 h27' fill='none' stroke='#111' stroke-width='7' stroke-linejoin='round'/></svg>",
    explanation: "The L-shape rotates 90 degrees clockwise. After the fourth figure, the next position matches option A.",
    skillTags: ["rotation", "spatial reasoning", "shape patterns"],
    estimatedSeconds: 70
  },
  {
    id: "q_nvr_2",
    subjectType: "NON_VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Reflection",
    instruction: "Choose the exact mirror image across the vertical dotted line.",
    stimulus: {
      title: "Mirror Line",
      mode: "svg",
      content:
        "<svg viewBox='0 0 420 150' role='img' aria-label='Asymmetric figure beside a mirror line'><line x1='220' y1='12' x2='220' y2='138' stroke='#111' stroke-width='3' stroke-dasharray='8 7'/><g fill='none' stroke='#111' stroke-width='5'><rect x='60' y='38' width='62' height='62'/><circle cx='95' cy='69' r='12' fill='#111'/><path d='M122 38 L155 69 L122 100 Z'/><line x1='72' y1='112' x2='142' y2='112'/></g><text x='196' y='144' font-size='13' fill='#111'>mirror</text></svg>",
      caption: "Reflect every part of the figure, including the filled dot and base line."
    },
    questionData: { mode: "text", content: "Which option is the mirror image?" },
    options: [
      { mode: "svg", content: "<svg viewBox='0 0 130 100'><g fill='none' stroke='#111' stroke-width='5'><rect x='48' y='18' width='44' height='44'/><circle cx='67' cy='40' r='8' fill='#111'/><path d='M48 18 L22 40 L48 62 Z'/><line x1='34' y1='76' x2='94' y2='76'/></g></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 130 100'><g fill='none' stroke='#111' stroke-width='5'><rect x='38' y='18' width='44' height='44'/><circle cx='63' cy='40' r='8' fill='#111'/><path d='M82 18 L108 40 L82 62 Z'/><line x1='36' y1='76' x2='96' y2='76'/></g></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 130 100'><g fill='none' stroke='#111' stroke-width='5'><rect x='48' y='18' width='44' height='44'/><circle cx='73' cy='40' r='8' fill='#111'/><path d='M48 18 L22 40 L48 62 Z'/><line x1='34' y1='12' x2='94' y2='12'/></g></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 130 100'><g fill='none' stroke='#111' stroke-width='5'><rect x='48' y='18' width='44' height='44'/><circle cx='67' cy='40' r='8' fill='#111'/><path d='M92 18 L118 40 L92 62 Z'/><line x1='34' y1='76' x2='94' y2='76'/></g></svg>" }
    ],
    answer: "<svg viewBox='0 0 130 100'><g fill='none' stroke='#111' stroke-width='5'><rect x='48' y='18' width='44' height='44'/><circle cx='67' cy='40' r='8' fill='#111'/><path d='M48 18 L22 40 L48 62 Z'/><line x1='34' y1='76' x2='94' y2='76'/></g></svg>",
    explanation: "The triangle moves to the left of the square and the filled dot reverses position inside the square.",
    skillTags: ["reflection", "spatial reasoning"],
    estimatedSeconds: 75
  },
  {
    id: "q_nvr_3",
    subjectType: "NON_VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    microTopic: "Matrices",
    instruction: "Find the missing shape in the 2 by 2 matrix.",
    stimulus: {
      title: "Shape Matrix",
      mode: "svg",
      content:
        "<svg viewBox='0 0 300 220' role='img' aria-label='Three box matrix with missing fourth box'><g fill='none' stroke='#111' stroke-width='4'><rect x='25' y='25' width='92' height='68'/><circle cx='71' cy='59' r='20'/><rect x='155' y='25' width='92' height='68'/><circle cx='201' cy='59' r='20'/><line x1='181' y1='39' x2='221' y2='79'/><rect x='25' y='125' width='92' height='68'/><polygon points='71,139 95,179 47,179'/><rect x='155' y='125' width='92' height='68'/><text x='190' y='172' font-size='42' font-weight='700'>?</text></g></svg>",
      caption: "Across each row, a diagonal line is added inside the shape."
    },
    questionData: { mode: "text", content: "Which figure completes the matrix?" },
    options: [
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><g fill='none' stroke='#111' stroke-width='5'><polygon points='60,18 92,72 28,72'/><line x1='38' y1='28' x2='82' y2='72'/></g></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><g fill='none' stroke='#111' stroke-width='5'><polygon points='60,18 92,72 28,72'/><line x1='28' y1='72' x2='92' y2='72'/></g></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><g fill='none' stroke='#111' stroke-width='5'><circle cx='60' cy='45' r='26'/><line x1='38' y1='25' x2='82' y2='65'/></g></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><g fill='none' stroke='#111' stroke-width='5'><polygon points='60,18 92,72 28,72'/><line x1='60' y1='18' x2='60' y2='72'/></g></svg>" }
    ],
    answer: "<svg viewBox='0 0 120 90'><g fill='none' stroke='#111' stroke-width='5'><polygon points='60,18 92,72 28,72'/><line x1='38' y1='28' x2='82' y2='72'/></g></svg>",
    explanation: "The second column keeps the original shape and adds a diagonal line. The triangle therefore needs the same diagonal.",
    skillTags: ["matrices", "pattern rules"],
    estimatedSeconds: 90
  },
  {
    id: "q_nvr_4",
    subjectType: "NON_VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "HARD",
    microTopic: "Sequences",
    instruction: "Study the changing number of sides.",
    stimulus: {
      title: "Polygon Sequence",
      mode: "svg",
      content:
        "<svg viewBox='0 0 480 130' role='img' aria-label='Shaded polygon sequence'><g stroke='#111' stroke-width='4'><polygon points='55,95 85,35 115,95' fill='white'/><polygon points='175,35 225,35 225,85 175,85' fill='#111'/><polygon points='315,28 360,48 350,98 280,98 270,48' fill='white'/><text x='425' y='78' font-size='42' font-weight='700' fill='#111'>?</text></g></svg>",
      caption: "The number of sides increases by one and the shading alternates."
    },
    questionData: { mode: "text", content: "Which shape should come next?" },
    options: [
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><polygon points='35,20 85,20 105,45 85,70 35,70 15,45' fill='#111' stroke='#111' stroke-width='4'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><polygon points='60,15 98,35 88,75 32,75 22,35' fill='#111' stroke='#111' stroke-width='4'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><circle cx='60' cy='45' r='30' fill='#111' stroke='#111' stroke-width='4'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 120 90'><polygon points='35,20 85,20 105,45 85,70 35,70 15,45' fill='white' stroke='#111' stroke-width='4'/></svg>" }
    ],
    answer: "<svg viewBox='0 0 120 90'><polygon points='35,20 85,20 105,45 85,70 35,70 15,45' fill='#111' stroke='#111' stroke-width='4'/></svg>",
    explanation: "The sequence is triangle, square, pentagon, so the next shape is a hexagon. Shading alternates, so it should be filled black.",
    skillTags: ["sequences", "polygons"],
    estimatedSeconds: 70
  },
  {
    id: "q_nvr_5",
    subjectType: "NON_VERBAL_REASONING",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "HARD",
    microTopic: "Folding",
    instruction: "Imagine the paper is folded on the dotted line.",
    stimulus: {
      title: "Paper Fold",
      mode: "svg",
      content:
        "<svg viewBox='0 0 360 170' role='img' aria-label='Folded paper with punched holes'><rect x='60' y='25' width='220' height='115' fill='white' stroke='#111' stroke-width='4'/><line x1='170' y1='25' x2='170' y2='140' stroke='#111' stroke-width='3' stroke-dasharray='8 7'/><circle cx='105' cy='62' r='10' fill='none' stroke='#111' stroke-width='4'/><circle cx='135' cy='105' r='10' fill='none' stroke='#111' stroke-width='4'/><text x='140' y='158' font-size='13' fill='#111'>fold</text></svg>",
      caption: "The paper is folded along the dotted line, then unfolded."
    },
    questionData: { mode: "text", content: "Which unfolded paper shows all the holes?" },
    options: [
      { mode: "svg", content: "<svg viewBox='0 0 130 90'><rect x='18' y='12' width='94' height='64' fill='white' stroke='#111' stroke-width='4'/><line x1='65' y1='12' x2='65' y2='76' stroke='#111' stroke-width='2' stroke-dasharray='5 4'/><circle cx='38' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='52' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='92' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='78' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 130 90'><rect x='18' y='12' width='94' height='64' fill='white' stroke='#111' stroke-width='4'/><line x1='65' y1='12' x2='65' y2='76' stroke='#111' stroke-width='2' stroke-dasharray='5 4'/><circle cx='38' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='52' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='92' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='78' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 130 90'><rect x='18' y='12' width='94' height='64' fill='white' stroke='#111' stroke-width='4'/><line x1='65' y1='12' x2='65' y2='76' stroke='#111' stroke-width='2' stroke-dasharray='5 4'/><circle cx='38' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='52' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/></svg>" },
      { mode: "svg", content: "<svg viewBox='0 0 130 90'><rect x='18' y='12' width='94' height='64' fill='white' stroke='#111' stroke-width='4'/><line x1='65' y1='12' x2='65' y2='76' stroke='#111' stroke-width='2' stroke-dasharray='5 4'/><circle cx='38' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='52' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='92' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/></svg>" }
    ],
    answer: "<svg viewBox='0 0 130 90'><rect x='18' y='12' width='94' height='64' fill='white' stroke='#111' stroke-width='4'/><line x1='65' y1='12' x2='65' y2='76' stroke='#111' stroke-width='2' stroke-dasharray='5 4'/><circle cx='38' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='52' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='92' cy='34' r='6' fill='none' stroke='#111' stroke-width='3'/><circle cx='78' cy='58' r='6' fill='none' stroke='#111' stroke-width='3'/></svg>",
    explanation: "The holes reflect across the fold line, so matching holes appear on the right at mirrored horizontal positions and the same heights.",
    skillTags: ["folding", "reflection"],
    estimatedSeconds: 85
  }
];
