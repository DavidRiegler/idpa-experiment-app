"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

// Testfragen für Sekundarstufe (7.-9. Klasse)
const questions = [
  // Multiple Choice
  {
    type: "multiple_choice",
    question: "Welches chemische Element hat das Symbol 'Fe'?",
    options: ["Eisen", "Fluor", "Ferrum", "Phosphor"],
    correct: "Eisen",
  },
  {
    type: "multiple_choice",
    question: "Wer schrieb das Drama 'Wilhelm Tell'?",
    options: ["Johann Wolfgang von Goethe", "Gotthold Ephraim Lessing", "Heinrich Heine", "Friedrich Schiller"],
    correct: "Friedrich Schiller",
  },
  {
    type: "multiple_choice",
    question: "Wie viele Planeten hat unser Sonnensystem?",
    options: ["7", "8", "9", "10"],
    correct: "8",
  },
  
  // Lückentext
  {
    type: "fill_in_blank",
    question: "Die Formel für die Berechnung der Fläche eines Rechtecks lautet: A = ___ × ___",
    correctAnswers: ["länge", "breite"],
    placeholders: 2,
    hint: "Zwei Seitenlängen werden multipliziert"
  },
  {
    type: "fill_in_blank",
    question: "Der grösste Ozean der Erde ist der ___-Ozean.",
    correctAnswers: ["pazifische", "pazifischer", "pazifik"],
    placeholders: 1,
  },
  {
    type: "fill_in_blank",
    question: "Die drei Aggregatzustände von Wasser sind: fest (___), flüssig (___) und gasförmig (___).",
    correctAnswers: ["eis", "wasser", "wasserdampf"],
    placeholders: 3,
  },
  
  // Zuordnung (Matching) - Optionen absichtlich in anderer Reihenfolge anzeigen
  {
    type: "matching",
    question: "Ordne die Hauptstädte den Ländern zu:",
    options: ["Madrid", "Paris", "Warschau", "Rom"],
    pairs: [
      { left: "Frankreich", right: "Paris" },
      { left: "Italien", right: "Rom" },
      { left: "Spanien", right: "Madrid" },
      { left: "Polen", right: "Warschau" },
    ],
  },
  {
    type: "matching",
    question: "Ordne die mathematischen Begriffe den Formeln zu:",
    options: ["πr²", "(g × h) / 2", "a × b", "2πr"],
    pairs: [
      { left: "Kreisumfang", right: "2πr" },
      { left: "Kreisfläche", right: "πr²" },
      { left: "Rechteckfläche", right: "a × b" },
      { left: "Dreiecksfläche", right: "(g × h) / 2" },
    ],
  },
  
  // Weitere Multiple Choice
  {
    type: "multiple_choice",
    question: "Was bedeutet 'Photosynthese'?",
    options: [
      "Zellatmung bei Tieren",
      "Umwandlung von Lichtenergie in chemische Energie",
      "Fortpflanzung von Pflanzen",
      "Wasseraufnahme durch Wurzeln"
    ],
    correct: "Umwandlung von Lichtenergie in chemische Energie",
  },
  
  // Reihenfolge - mit gemischten Options
  {
    type: "ordering",
    question: "Bringe die folgenden historischen Ereignisse in die richtige zeitliche Reihenfolge:",
    options: [
      "Französische Revolution",
      "Erster Weltkrieg",
      "Erfindung des Buchdrucks",
      "Entdeckung Amerikas durch Kolumbus"
    ],
    correctOrder: [
      "Erfindung des Buchdrucks",
      "Entdeckung Amerikas durch Kolumbus",
      "Französische Revolution",
      "Erster Weltkrieg"
    ],
  },

  
  // Lückentext
  {
    type: "fill_in_blank",
    question: "In einem rechtwinkligen Dreieck lautet der Satz des Pythagoras: a² + b² = ___",
    correctAnswers: ["c²", "c2", "c hoch 2", "c squared", "c^2"],
    placeholders: 1,
  },
  
  // Multiple Choice
  {
    type: "multiple_choice",
    question: "Welche Wortart ist das Wort 'schnell'?",
    options: ["Nomen", "Verb", "Adjektiv", "Präposition"],
    correct: "Adjektiv",
  },
  
  // Zuordnung
  {
    type: "matching",
    question: "Ordne die Organe ihren Funktionen zu:",
    options: ["Nimmt Sauerstoff auf", "Entgiftet den Körper", "Pumpt Blut durch den Körper", "Verdaut Nahrung"],
    pairs: [
      { left: "Herz", right: "Pumpt Blut durch den Körper" },
      { left: "Lunge", right: "Nimmt Sauerstoff auf" },
      { left: "Leber", right: "Entgiftet den Körper" },
      { left: "Magen", right: "Verdaut Nahrung" },
    ],
  },
  
  // Lückentext
  {
    type: "fill_in_blank",
    question: "Die Hauptstadt der Schweiz ist ___.",
    correctAnswers: ["bern"],
    placeholders: 1,
  },
  
  // Multiple Choice
  {
    type: "multiple_choice",
    question: "Welche dieser Zahlen ist eine Primzahl?",
    options: ["15", "21", "23", "27"],
    correct: "23",
  },
]

function TestContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("sessionId")
  const participantId = searchParams.get("participantId")

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [fillInAnswers, setFillInAnswers] = useState<string[]>([])
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({})
  const [orderingItems, setOrderingItems] = useState<string[]>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [tabSwitches, setTabSwitches] = useState(0)
  const [copyPasteEvents, setCopyPasteEvents] = useState(0)
  const [focusLosses, setFocusLosses] = useState(0)
  const [mouseMovements, setMouseMovements] = useState(0)
  const [keyboardEvents, setKeyboardEvents] = useState(0)
  const [randomizedQuestions, setRandomizedQuestions] = useState<any[]>([])

  const supabase = createClient()

  // Randomize questions on mount
  useEffect(() => {
    const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5)

    const randomized = shuffleArray(questions).map(q => {
      if (q.type === "multiple_choice") {
        return { ...q, options: shuffleArray(q.options) }
      }
      if (q.type === "matching") {
        return { ...q, options: shuffleArray(q.options) }
      }
      if (q.type === "ordering") {
        return { ...q, options: shuffleArray(q.options) }
      }
      return q
    })

    setRandomizedQuestions(randomized)
  }, [])

  const currentQ = randomizedQuestions[currentQuestion]

  // Reset answers when question changes
  useEffect(() => {
    if (!currentQ) return
    setSelectedAnswer("")
    setFillInAnswers([])
    setMatchingAnswers({})

    if (currentQ.type === "ordering") {
      setOrderingItems((prev) => {
        // Nur neu mischen, wenn noch leer
        if (prev.length === 0) {
          const shuffled = [...(currentQ as any).options].sort(() => Math.random() - 0.5)
          return shuffled
        }
        return prev
      })
    }
  }, [currentQuestion, currentQ])

  // Verhaltens-Tracking: Tab-Wechsel
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1)
        await supabase.from("behavioral_data").insert({
          session_id: sessionId,
          event_type: "tab_switch",
          data: { count: tabSwitches + 1 },
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [sessionId, tabSwitches, supabase])

  // Verhaltens-Tracking: Fokus-Verlust
  useEffect(() => {
    const handleBlur = async () => {
      setFocusLosses((prev) => prev + 1)
      await supabase.from("behavioral_data").insert({
        session_id: sessionId,
        event_type: "focus_loss",
        data: { count: focusLosses + 1 },
      })
    }

    window.addEventListener("blur", handleBlur)
    return () => window.removeEventListener("blur", handleBlur)
  }, [sessionId, focusLosses, supabase])

  // Verhaltens-Tracking: Copy/Paste
  useEffect(() => {
    const handleCopyPaste = async (e: ClipboardEvent) => {
      setCopyPasteEvents((prev) => prev + 1)
      await supabase.from("behavioral_data").insert({
        session_id: sessionId,
        event_type: "copy_paste",
        data: { type: e.type, count: copyPasteEvents + 1 },
      })
    }

    document.addEventListener("copy", handleCopyPaste)
    document.addEventListener("paste", handleCopyPaste)
    return () => {
      document.removeEventListener("copy", handleCopyPaste)
      document.removeEventListener("paste", handleCopyPaste)
    }
  }, [sessionId, copyPasteEvents, supabase])

  // Verhaltens-Tracking: Mausbewegungen
  useEffect(() => {
    let movementCount = 0
    const handleMouseMove = async () => {
      movementCount++
      if (movementCount % 50 === 0) {
        setMouseMovements((prev) => prev + 1)
        await supabase.from("behavioral_data").insert({
          session_id: sessionId,
          event_type: "mouse_movement",
          data: { count: movementCount },
        })
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [sessionId, supabase])

  // Verhaltens-Tracking: Tastatur-Muster
  useEffect(() => {
    const handleKeyDown = async () => {
      setKeyboardEvents((prev) => prev + 1)
      if (keyboardEvents % 10 === 0) {
        await supabase.from("behavioral_data").insert({
          session_id: sessionId,
          event_type: "keyboard_pattern",
          data: { count: keyboardEvents + 1 },
        })
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [sessionId, keyboardEvents, supabase])

  const checkAnswer = () => {
    const q = currentQ as any
    
    switch (q.type) {
      case "multiple_choice":
        return selectedAnswer === q.correct
      
      case "fill_in_blank":
        return fillInAnswers.every((answer, index) => {
          const normalized = answer.toLowerCase().trim()
          const correctOptions = Array.isArray(q.correctAnswers[index]) 
            ? q.correctAnswers[index] 
            : [q.correctAnswers[index]]
          return correctOptions.some((opt: string) => opt.toLowerCase() === normalized)
        })
      
      case "matching":
        return q.pairs.every((pair: any) => 
          matchingAnswers[pair.left] === pair.right
        )
      
      case "ordering":
        return JSON.stringify(orderingItems) === JSON.stringify(q.correctOrder)
      
      default:
        return false
    }
  }

  const getCurrentAnswer = () => {
    const q = currentQ as any
    
    switch (q.type) {
      case "multiple_choice":
        return selectedAnswer
      case "fill_in_blank":
        return fillInAnswers.join(", ")
      case "matching":
        return JSON.stringify(matchingAnswers)
      case "ordering":
        return orderingItems.join(" -> ")
      default:
        return ""
    }
  }

  const handleNextQuestion = async () => {
    const answer = getCurrentAnswer()
    
    if (!answer) {
      alert("Bitte beantworte die Frage.")
      return
    }

    const responseTime = Date.now() - questionStartTime
    const isCorrect = checkAnswer()

    await supabase.from("test_responses").insert({
      session_id: sessionId,
      question_number: currentQuestion + 1,
      answer: answer,
      response_time: responseTime,
      is_correct: isCorrect,
    })

    if (responseTime < 2000 || responseTime > 60000) {
      await supabase.from("behavioral_data").insert({
        session_id: sessionId,
        event_type: "time_anomaly",
        data: { response_time: responseTime, question: currentQuestion + 1 },
      })
    }

    await supabase.from("behavioral_data").insert({
      session_id: sessionId,
      event_type: "response_latency",
      data: { response_time: responseTime, question: currentQuestion + 1 },
    })

    if (currentQuestion < randomizedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setQuestionStartTime(Date.now())
    } else {
      await completeTest()
    }
  }

  const completeTest = async () => {
    const { data: cheatScoreData } = await supabase.rpc("calculate_cheat_score", {
      p_session_id: sessionId,
    })

    await supabase
      .from("test_sessions")
      .update({
        end_time: new Date().toISOString(),
        cheat_score: cheatScoreData,
        completed: true,
      })
      .eq("id", sessionId)

    router.push(`/results?sessionId=${sessionId}&participantId=${participantId}`)
  }

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...orderingItems]
    const newIndex = direction === "up" ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < newItems.length) {
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]]
      setOrderingItems(newItems)
    }
  }

  const progress = ((currentQuestion + 1) / randomizedQuestions.length) * 100

  if (randomizedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div>Lädt Fragen...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            Frage {currentQuestion + 1} von {randomizedQuestions.length}
          </CardTitle>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{currentQ.question}</h3>

            {/* Multiple Choice */}
            {currentQ.type === "multiple_choice" && (
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                {(currentQ as any).options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Fill in the Blank */}
            {currentQ.type === "fill_in_blank" && (
              <div className="space-y-3">
                {(currentQ as any).hint && (
                  <p className="text-sm text-muted-foreground italic">Hinweis: {(currentQ as any).hint}</p>
                )}
                {Array.from({ length: (currentQ as any).placeholders }).map((_, index) => (
                  <div key={index}>
                    <Label htmlFor={`blank-${index}`}>Lücke {index + 1}:</Label>
                    <Input
                      id={`blank-${index}`}
                      value={fillInAnswers[index] || ""}
                      onChange={(e) => {
                        const newAnswers = [...fillInAnswers]
                        newAnswers[index] = e.target.value
                        setFillInAnswers(newAnswers)
                      }}
                      placeholder="Antwort eingeben..."
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Matching */}
            {currentQ.type === "matching" && (
              <div className="space-y-3">
                {(currentQ as any).pairs.map((pair: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-blue-50 rounded-md font-medium">
                      {pair.left}
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <select
                      value={matchingAnswers[pair.left] || ""}
                      onChange={(e) => setMatchingAnswers({
                        ...matchingAnswers,
                        [pair.left]: e.target.value
                      })}
                      className="flex-1 p-3 border rounded-md"
                    >
                      <option value="">Wähle...</option>
                      {(currentQ as any).options.map((opt: string, i: number) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Ordering */}
            {currentQ.type === "ordering" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Nutze die Pfeile, um die Elemente zu sortieren:
                </p>
                {orderingItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1 p-3 bg-slate-50 rounded-md">
                      {item}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveItem(index, "down")}
                        disabled={index === orderingItems.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleNextQuestion} className="w-full" size="lg">
            {currentQuestion < randomizedQuestions.length - 1 ? "Nächste Frage" : "Test abschliessen"}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            Ihre Interaktionen werden für Forschungszwecke aufgezeichnet.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <TestContent />
    </Suspense>
  )
}