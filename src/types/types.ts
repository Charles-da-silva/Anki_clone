export type Card = {
  id: string;
  deckId: string;

  title: string;      // ex: Questão 1
  context: string;    // texto grande

  alternatives: string[];

  correctAnswer: number;

  nextReview: number;
};

export type Deck = {
  id: string;
  name: string;
};