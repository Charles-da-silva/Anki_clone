import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { loadCards, saveCards, loadDecks, saveDecks } from "./storage/storage";
import type { Card, Deck } from "./types/types";

function App() {
  const [decks, setDecks] = useState<Deck[]>(loadDecks());
  const [deckName, setDeckName] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState("");

  const [question, setQuestion] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>(loadCards());
  const [alternatives, setAlternatives] = useState<{ id: number; text: string }[]>([
    { id: Date.now(), text: "" }
  ]);

  const [mode, setMode] = useState<"create" | "review">("create");
  const [currentQuestion, setcurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [reviewCards, setReviewCards] = useState<Card[]>([]);
  const [isReviewReady, setIsReviewReady] = useState(false);

  // --- FUNÇÕES DE EXCLUSÃO ---

  function deleteDeck(id: string) {
    if (window.confirm("Tem certeza que deseja excluir este deck e todos os seus cards?")) {
      const updatedDecks = decks.filter(d => d.id !== id);
      const updatedCards = cards.filter(c => c.deckId !== id);
      
      setDecks(updatedDecks);
      setCards(updatedCards);
      saveDecks(updatedDecks);
      saveCards(updatedCards);
      
      if (selectedDeckId === id) setSelectedDeckId("");
    }
  }

  function deleteCard(id: string) {
    if (window.confirm("Deseja excluir esta pergunta permanentemente?")) {
      // Remove do estado principal de todos os cards
      const updatedAllCards = cards.filter(c => c.id !== id);
      setCards(updatedAllCards);
      saveCards(updatedAllCards);

      // Remove da fila de revisão atual para não travar a tela
      const updatedReviewCards = reviewCards.filter(c => c.id !== id);
      setReviewCards(updatedReviewCards);
      
      // Reseta a resposta selecionada para a próxima carta
      setSelectedAnswer(null);
      
      // Se era a última carta, o sistema de "Sucesso" vai detectar automaticamente
      // se o currentQuestion agora for >= que o novo length
    }
  }

  // --- RESTANTE DAS FUNÇÕES ---

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function addDeck() {
    if (!deckName) return;
    const newDeck: Deck = { id: crypto.randomUUID(), name: deckName };
    const updated = [...decks, newDeck];
    setDecks(updated);
    saveDecks(updated);
    setDeckName("");
  }

  function addCard() {
    if (!selectedDeckId) return alert("Selecione um deck!");
    if (alternatives.length < 2) return alert("Adicione pelo menos 2 alternativas");
    if (correctAnswer === null) return alert("Selecione a resposta correta!");

    const newCard: any = {
      id: crypto.randomUUID(),
      deckId: selectedDeckId,
      question,
      image,
      alternatives: alternatives.map(a => a.text),
      correctAnswer,
      nextReview: Date.now()
    };

    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    saveCards(updatedCards);

    setQuestion("");
    setImage(null);
    setCorrectAnswer(null);
    setAlternatives([{ id: Date.now(), text: "" }]);
    alert("Pergunta salva!");
  }

  function scheduleCard(card: any, difficulty: "easy" | "medium" | "hard") {
    let delay = 0;
    if (difficulty === "easy") delay = 3 * 24 * 60 * 60 * 1000;
    if (difficulty === "medium") delay = 4 * 60 * 60 * 1000;
    if (difficulty === "hard") delay = 10 * 60 * 1000;

    const updatedCards = cards.map((c) =>
      c.id === card.id ? { ...c, nextReview: Date.now() + delay } : c
    );
    setCards(updatedCards);
    saveCards(updatedCards);
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const addAlternative = () => setAlternatives(prev => [...prev, { id: Date.now(), text: "" }]);
  
  const updateAlternative = (id: number, value: string) => {
    setAlternatives(prev => prev.map(alt => alt.id === id ? { ...alt, text: value } : alt));
  };

  useEffect(() => {
    if (mode === "review" && !isReviewReady) {
      const now = Date.now();
      const dueCards = cards.filter(c => c.deckId === selectedDeckId && c.nextReview <= now);
      setReviewCards(shuffleArray(dueCards));
      setcurrentQuestion(0);
      setSelectedAnswer(null);
      setIsReviewReady(true);
    }
  }, [mode, selectedDeckId, isReviewReady, cards]);

  const currentCard = reviewCards[currentQuestion] as any;

  return (
    <div style={{ padding: 20, maxWidth: "700px", margin: "0 auto", fontFamily: "sans-serif", alignContent: "center" }}>
      <header style={{ display: "flex",  alignItems: "center", justifyContent: "center"}}>        
        <h1 style={{ color: "#e25402"}}>Anki Clone</h1>
      </header>

      <hr />

      {mode === "review" && (
        <div style={{ marginTop: 20 }}>
          {isReviewReady && reviewCards.length > 0 && currentQuestion >= reviewCards.length && (
            <div style={{ textAlign: "center" }}>
              <h2>🎉 Deck revisado com sucesso!</h2>
            </div>
          )}

          {isReviewReady && reviewCards.length === 0 && (
            <p>☕ Nada para revisar agora.</p>
          )}

          {currentCard && currentQuestion < reviewCards.length && (
            <div style={{ position: "relative", padding: "20px", border: "1px solid #eee", borderRadius: "12px" }}>
              
              {/* Botão de Excluir Pergunta na Revisão */}
              <button 
                onClick={() => deleteCard(currentCard.id)}
                style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
                title="Excluir esta pergunta"
              >
                🗑️
              </button>

              <h3>Pergunta:</h3>
              <p style={{ fontSize: "1.2rem", whiteSpace: "pre-wrap", // 👈 ISSO AQUI mantém as quebras de linha e espaços
              wordWrap: "break-word", // Garante que textos longos não quebrem o layout              
              padding: "10px",
              borderRadius: "5px",
              textAlign: "left" }}>{currentCard.question}</p>
              
              {currentCard.image && (
                <img src={currentCard.image} alt="Pergunta" style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "15px" }} />
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {currentCard.alternatives.map((alt: string, index: number) => (
                  <button key={index} onClick={() => setSelectedAnswer(index)} 
                  style={{ textAlign: "left", padding: "12px", borderRadius: "8px", 
                  cursor: "pointer" }}>
                    {alt}
                  </button>
                ))}
              </div>

              {selectedAnswer !== null && (
                <div style={{ marginTop: 20, padding: "15px", backgroundColor: "#f0fdf4", borderRadius: "8px" }}>
                  {selectedAnswer === currentCard.correctAnswer ? (
                    <p style={{ color: "#0cbe51", fontWeight: "bold" }}>✅ Correto!</p>
                  ) : (
                    <p style={{ color: "#991b1b" }}>❌ Resposta certa: {currentCard.alternatives[currentCard.correctAnswer]}</p>
                  )}
                  
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => { scheduleCard(currentCard, "hard"); 
                      setcurrentQuestion(i => i + 1); setSelectedAnswer(null); }}
                      style={{ background: "orangered" }}>Difícil (10 min)</button>

                    <button onClick={() => { scheduleCard(currentCard, "medium"); 
                      setcurrentQuestion(i => i + 1); setSelectedAnswer(null); }} 
                      style={{ marginLeft: 10, background: "orange"}}>Médio (4 hs)</button>

                    <button onClick={() => { scheduleCard(currentCard, "easy"); 
                      setcurrentQuestion(i => i + 1); setSelectedAnswer(null); }} 
                      style={{ marginLeft: 10, background: "green" }}>Fácil (3 dias)</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button onClick={() => setMode("create")} style={{ marginTop: 30, marginRight: 10, color: "white", 
            border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer",
            background: "#dfac06" }}>Página inicial</button>
        </div>
      )}

      {mode === "create" && (
        <div style={{ marginTop: 20 }}>
          <section style={{ marginBottom: "30px", backgroundColor: "#16171d", padding: "15px", borderRadius: "8px" }}>
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input placeholder="Nome do novo deck" value={deckName} onChange={(e) => setDeckName(e.target.value)} style={{ flex: 1 }} />
              <button onClick={addDeck} style={{ 
                width: 100, background: "#0cbe51", color: "white", border: "none", 
                padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                >Criar Deck</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select value={selectedDeckId} onChange={(e) => setSelectedDeckId(e.target.value)} style={{ flex: 1, padding: "5px" }}>
                <option value="">Selecione um Deck para revisar ou criar novas perguntas</option>
                {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {selectedDeckId && (
                <>
                <button onClick={() => deleteDeck(selectedDeckId)} style={{ 
                  width: 110, backgroundColor: "#ef4444", color: "white", border: "none", padding: "6px 12px", 
                  borderRadius: "4px", cursor: "pointer" }}
                  >Excluir Deck
                </button>
                <button 
                  onClick={() => {
                    if (!selectedDeckId) return alert("Selecione um deck!");
                    setIsReviewReady(false);
                    setMode("review");
                  }} style={{ width: 110, color: "white", border: "none", padding: "6px 12px", 
                    borderRadius: "4px", cursor: "pointer", background: "#085ddd" }}
                >Revisar Deck
                </button></>
              )}
            </div>
          </section>

          {selectedDeckId && (
            <section style={{ padding: "20px", border: "2px solid #e2e8f0", borderRadius: "12px" }}>
              <h2>2. Nova Pergunta</h2>
              <textarea 
                placeholder="Qual a pergunta?" 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)} 
                style={{ width: "100%", height: "80px", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
              />
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "14px", color: "#64748b" }}>Imagem (opcional):</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {image && (
                  <div style={{ marginTop: "10px" }}>
                    <img src={image} alt="Preview" style={{ maxWidth: "100px", borderRadius: "4px" }} />
                    <button onClick={() => setImage(null)} style={{ marginLeft: "10px", fontSize: "12px" }}>Remover</button>
                  </div>
                )}
              </div>

              <h3>Alternativas:</h3>
              {alternatives.map((alt, index) => (
                <div key={alt.id} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                  <input type="radio" name="correct" checked={correctAnswer === index} onChange={() => setCorrectAnswer(index)} title="Marcar como correta" />
                  <input 
                    type="text" 
                    placeholder={`Opção ${index + 1}`} 
                    value={alt.text} 
                    onChange={(e) => updateAlternative(alt.id, e.target.value)} 
                    style={{ marginLeft: "10px", flex: 1, padding: "8px" }}
                  />
                </div>
              ))}
              <div style={{ marginTop: "15px" }}>
                <button onClick={addAlternative} style={{ backgroundColor: "#d49d07", 
                  color: "white", padding: "8px 12px", border: "none", borderRadius: "6px", 
                  cursor: "pointer", width: 150 }}>Adicionar alternativa</button>
                <button onClick={addCard} style={{ marginLeft: "10px", backgroundColor: "#10b981", 
                  color: "white", padding: "8px 12px", border: "none", borderRadius: "6px", 
                  cursor: "pointer", width: 130 }}>
                  Salvar Pergunta
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default App;