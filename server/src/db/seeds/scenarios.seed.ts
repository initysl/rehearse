import { db } from "../../config/db";
import { CharacterProfile, DifficultyVariant } from "../../types/global.types";

type SeedScenario = {
  title: string;
  category: "work" | "health" | "family" | "social" | "financial" | "legal";
  description: string;
  characterProfile: CharacterProfile;
  difficultyVariants: DifficultyVariant[];
};

const scenarios: SeedScenario[] = [
  {
    title: "Salary Negotiation with Manager",
    category: "work",
    description:
      "You are negotiating compensation after a strong performance review and want a fair raise.",
    characterProfile: {
      name: "Jordan Lee",
      role: "Engineering Manager",
      personality: ["pragmatic", "budget-conscious", "respectful"],
      goals: [
        "Keep compensation within team budget",
        "Retain high-performing employees",
      ],
      emotionalState: "calm but cautious",
    },
    difficultyVariants: [
      {
        level: "cooperative",
        behaviorModifier: "Open to discussion and proactive about options.",
      },
      {
        level: "neutral",
        behaviorModifier: "Listens carefully but asks for strong evidence.",
      },
      {
        level: "resistant",
        behaviorModifier: "Deflects with budget constraints and delayed timelines.",
      },
      {
        level: "hostile",
        behaviorModifier: "Dismissive and challenges the request aggressively.",
      },
    ],
  },
  {
    title: "Discussing Test Results with Doctor",
    category: "health",
    description:
      "You need to ask clear questions about recent lab results and next treatment steps.",
    characterProfile: {
      name: "Dr. Priya Raman",
      role: "Primary Care Physician",
      personality: ["efficient", "professional", "direct"],
      goals: [
        "Explain results accurately",
        "Ensure patient follows a realistic care plan",
      ],
      emotionalState: "focused and time-constrained",
    },
    difficultyVariants: [
      {
        level: "cooperative",
        behaviorModifier: "Patiently explains details and encourages follow-up questions.",
      },
      {
        level: "neutral",
        behaviorModifier: "Provides concise answers and expects structured questions.",
      },
      {
        level: "resistant",
        behaviorModifier: "Speaks in jargon and rushes through explanations.",
      },
      {
        level: "hostile",
        behaviorModifier: "Appears impatient and minimizes concerns.",
      },
    ],
  },
  {
    title: "Setting Boundaries with Parent",
    category: "family",
    description:
      "You need to communicate personal boundaries respectfully while preserving the relationship.",
    characterProfile: {
      name: "Samira",
      role: "Parent",
      personality: ["protective", "opinionated", "emotionally expressive"],
      goals: [
        "Stay involved in your life decisions",
        "Ensure family expectations are respected",
      ],
      emotionalState: "concerned and sensitive",
    },
    difficultyVariants: [
      {
        level: "cooperative",
        behaviorModifier: "Willing to listen and compromise.",
      },
      {
        level: "neutral",
        behaviorModifier: "Pushes back gently and asks many questions.",
      },
      {
        level: "resistant",
        behaviorModifier: "Guilt-oriented framing and frequent interruptions.",
      },
      {
        level: "hostile",
        behaviorModifier: "Escalates emotionally and rejects boundaries.",
      },
    ],
  },
  {
    title: "Addressing Noise Complaint with Neighbor",
    category: "social",
    description:
      "You need to resolve recurring late-night noise issues without escalating conflict.",
    characterProfile: {
      name: "Alex",
      role: "Neighbor",
      personality: ["defensive", "social", "independent"],
      goals: [
        "Avoid feeling controlled",
        "Keep social freedom in their apartment",
      ],
      emotionalState: "guarded",
    },
    difficultyVariants: [
      {
        level: "cooperative",
        behaviorModifier: "Apologetic and quick to suggest practical fixes.",
      },
      {
        level: "neutral",
        behaviorModifier: "Acknowledges issue but downplays severity.",
      },
      {
        level: "resistant",
        behaviorModifier: "Denies responsibility and shifts blame.",
      },
      {
        level: "hostile",
        behaviorModifier: "Confrontational and dismissive of your concerns.",
      },
    ],
  },
  {
    title: "Requesting Loan Repayment Plan",
    category: "financial",
    description:
      "You are asking a friend to agree on a concrete repayment plan for borrowed money.",
    characterProfile: {
      name: "Taylor",
      role: "Friend and borrower",
      personality: ["avoidant", "friendly", "embarrassed"],
      goals: ["Maintain friendship", "Delay payment pressure"],
      emotionalState: "anxious and defensive",
    },
    difficultyVariants: [
      {
        level: "cooperative",
        behaviorModifier: "Takes accountability and proposes dates immediately.",
      },
      {
        level: "neutral",
        behaviorModifier: "Agrees in principle but needs prompting on specifics.",
      },
      {
        level: "resistant",
        behaviorModifier: "Makes vague promises without commitment.",
      },
      {
        level: "hostile",
        behaviorModifier: "Frames request as mistrust and pushes back strongly.",
      },
    ],
  },
];

const seed = async () => {
  console.log("Seeding default scenarios...");
  for (const scenario of scenarios) {
    await db.query(
      `INSERT INTO public.scenarios (
        title,
        category,
        description,
        character_profile,
        difficulty_variants,
        is_custom,
        created_by
      )
      SELECT
        $1,
        $2,
        $3,
        $4::jsonb,
        $5::jsonb,
        FALSE,
        NULL
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.scenarios
        WHERE title = $1
          AND is_custom = FALSE
      )`,
      [
        scenario.title,
        scenario.category,
        scenario.description,
        JSON.stringify(scenario.characterProfile),
        JSON.stringify(scenario.difficultyVariants),
      ]
    );
  }

  console.log(`Seed complete: ${scenarios.length} base scenarios ensured.`);
};

seed()
  .catch((error) => {
    console.error("Scenario seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
