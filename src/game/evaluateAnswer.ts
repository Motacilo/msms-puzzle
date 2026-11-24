import {
  CANNOT_BUILD,
  CANNOT_BUILD_LABEL,
  type AnswerDraft,
  type Choice,
  type ChoiceProblem,
  type Judgment,
  type Problem,
} from "./types.ts";

export function assessAnswer(problem: Problem, draft: AnswerDraft): Judgment {
  if (problem.type === "choice" && problem.question.kind === "composition") {
    return assessComposition(problem, draft);
  }

  if (problem.type === "choice") {
    if (!draft.choiceId) {
      return {
        status: "incomplete",
        message: "候補を1つ選んでから回答してください。",
      };
    }
    const selected = problem.choices.find((choice) => choice.id === draft.choiceId);
    const correct = problem.choices.find(
      (choice) => choice.id === problem.correctChoiceId,
    );
    if (!selected || !correct) {
      return {
        status: "incomplete",
        message: "候補を1つ選んでから回答してください。",
      };
    }
    if (selected.id === correct.id) {
      return { status: "correct", answer: selected.sequence, correct: correct.sequence };
    }
    return {
      status: "incorrect",
      answer: selected.sequence,
      correct: correct.sequence,
    };
  }

  const expected = problem.correctSequence.length;
  if (draft.placed.length === 0) {
    return {
      status: "incomplete",
      message: "アミノ酸を並べてから回答してください。",
    };
  }
  if (draft.placed.length < expected) {
    const rest = expected - draft.placed.length;
    return {
      status: "incomplete",
      message: `あと${rest}残基です。${expected}残基まで並べてください。`,
    };
  }

  const answer = draft.placed.map(canonicalCode).join("");
  const correct = [...problem.correctSequence].map(canonicalCode).join("");
  if (answer === correct) {
    return { status: "correct", answer, correct: problem.correctSequence };
  }
  return { status: "incorrect", answer, correct: problem.correctSequence };
}

/** 質量が同じ I/L と K/Q は区別できないので、どちらを置いても同じ答えとして扱う。 */
export function canonicalCode(code: string): string {
  if (code === "L/I" || code === "I") return "L";
  if (code === "K/Q" || code === "Q") return "K";
  return code;
}

function assessComposition(problem: ChoiceProblem, draft: AnswerDraft): Judgment {
  if (problem.question.kind !== "composition") {
    return { status: "incomplete", message: "候補を1つ選んでから回答してください。" };
  }
  const correct =
    problem.question.plus === 18
      ? CANNOT_BUILD_LABEL
      : inChoiceOrder([...problem.sequence], problem.choices);
  if (draft.choiceId === CANNOT_BUILD) {
    return {
      status: problem.question.plus === 18 ? "correct" : "incorrect",
      answer: CANNOT_BUILD_LABEL,
      correct,
    };
  }
  if (draft.placed.length === 0) {
    return {
      status: "incomplete",
      message: "アミノ酸を選ぶか、「作れない」を選んでください。",
    };
  }
  const answer = inChoiceOrder(draft.placed, problem.choices);
  const matches = sameLetters(answer, problem.sequence);
  return {
    status: problem.question.plus === 19 && matches ? "correct" : "incorrect",
    answer,
    correct,
  };
}

function inChoiceOrder(codes: readonly string[], choices: readonly Choice[]): string {
  const selected = new Set(codes);
  return choices
    .map((choice) => choice.sequence)
    .filter((code) => selected.has(code))
    .join("");
}

function sameLetters(left: string, right: string): boolean {
  return [...left].sort().join("") === [...right].sort().join("");
}
