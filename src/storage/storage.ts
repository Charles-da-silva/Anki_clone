import type { Card, Deck } from "../types/types";

const CARD_KEY = "study_cards";
const DECK_KEY = "study_decks";

/* CARDS */

export function loadCards(): Card[] {
  const data = localStorage.getItem(CARD_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveCards(cards: Card[]) {
  localStorage.setItem(CARD_KEY, JSON.stringify(cards));
}

/* DECKS */

export function loadDecks(): Deck[] {
  const data = localStorage.getItem(DECK_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveDecks(decks: Deck[]) {
  localStorage.setItem(DECK_KEY, JSON.stringify(decks));
}