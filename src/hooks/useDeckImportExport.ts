import type { ChangeEvent } from "react";
import type { Deck, Card } from "../types/types";
import { saveDecks, saveCards } from "../storage/storage";

type UseDeckImportExportProps = {
  decks: Deck[];
  cards: Card[];
  setDecks: (decks: Deck[]) => void;
  setCards: (cards: Card[]) => void;
};

type ExportData = {
  version: number;
  exportedAt: number;
  decks: Deck[];
  cards: Card[];
};

export function useDeckImportExport({
  decks,
  cards,
  setDecks,
  setCards
}: UseDeckImportExportProps) {

  // =========================
  // EXPORT
  // =========================
  function exportDecks(deckIds: string[]) {

    if (deckIds.length === 0) {
      alert("Selecione ao menos um deck.");
      return;
    }

    const decksToExport = decks.filter(d =>
      deckIds.includes(d.id)
    );

    const cardsToExport = cards.filter(c =>
      deckIds.includes(c.deckId)
    );

    const exportData: ExportData = {
      version: 1,
      exportedAt: Date.now(),
      decks: decksToExport,
      cards: cardsToExport
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "anki-decks-export.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  // =========================
  // IMPORT
  // =========================
  function importDecks(e: ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data: ExportData = JSON.parse(reader.result as string);

        if (!data.decks || !data.cards) {
          alert("Arquivo inválido.");
          return;
        }

        // ----- recria IDs -----
        const newDecks = data.decks.map(deck => ({
          ...deck,
          id: crypto.randomUUID()
        }));

        const deckIdMap = new Map(
          data.decks.map((oldDeck, index) => [
            oldDeck.id,
            newDecks[index].id
          ])
        );

        const newCards = data.cards.map(card => ({
          ...card,
          id: crypto.randomUUID(),
          deckId: deckIdMap.get(card.deckId)!
        }));

        const updatedDecks = [...decks, ...newDecks];
        const updatedCards = [...cards, ...newCards];

        setDecks(updatedDecks);
        setCards(updatedCards);

        saveDecks(updatedDecks);
        saveCards(updatedCards);

        alert("Importação concluída!");
      } catch {
        alert("Erro ao importar arquivo.");
      }
    };

    reader.readAsText(file);
  }

  return {
    exportDecks,
    importDecks
  };
}