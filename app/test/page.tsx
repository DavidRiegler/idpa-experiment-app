"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"

// Testfragen
const questions = [
  {
    question: "Was ist die Hauptstadt von Deutschland?",
    options: ["Berlin", "München", "Hamburg", "Köln"],
    correct: "Berlin",
  },
  {
    question: "Wie viele Bundesländer hat Deutschland?",
    options: ["12", "14", "16", "18"],
    correct: "16",
  },
  {
    question: "Welches ist das größte Bundesland Deutschlands?",
    options: ["Bayern", "Niedersachsen", "Baden-Württemberg", "Nordrhein-Westfalen"],
    correct: "Bayern",
  },
  {
    question: "In welchem Jahr fiel die Berliner Mauer?",
    options: ["1987", "1989", "1991", "1993"],
    correct: "1989",
  },
  {
    question: "Welcher Fluss fließt durch Berlin?",
    options: ["Rhein", "Elbe", "Spree", "Donau"],
    correct: "Spree",
  },
  {
    question: "Wie heißt der höchste Berg Deutschlands?",
    options: ["Zugspitze", "Watzmann", "Feldberg", "Brocken"],
    correct: "Zugspitze",
  },
  {
    question: "Welche Farben hat die deutsche Flagge?",
    options: ["Schwarz, Rot, Gold", "Schwarz, Rot, Gelb", "Rot, Weiß, Schwarz", "Blau, Weiß, Rot"],
    correct: "Schwarz, Rot, Gold",
  },
  {
    question: "Wer war der erste Bundeskanzler der Bundesrepublik Deutschland?",
    options: ["Willy Brandt", "Konrad Adenauer", "Helmut Kohl", "Helmut Schmidt"],
    correct: "Konrad Adenauer",
  },
  {
    question: "Welche Stadt ist bekannt für das Oktoberfest?",
    options: ["Berlin", "Hamburg", "München", "Frankfurt"],
    correct: "München",
  },
  {
    question: "Wie viele Nachbarländer hat Deutschland?",
    options: ["7", "9", "11", "13"],
    correct: "9",
  },
]

function TestContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("sessionId")
  const participantId = searchParams.get("participantId")

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [tabSwitches, setTabSwitches] = useState(0)
  const [copyPasteEvents, setCopyPasteEvents] = useState(0)
  const [focusLosses, setFocusLosses] = useState(0)
  const [mouseMovements, setMouseMovements] = useState(0)
  const [keyboardEvents, setKeyboardEvents] = useState(0)

  const supabase = createClient()

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
        // Alle 50 Bewegungen speichern
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
        // Alle 10 Tastendrücke speichern
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

  const handleNextQuestion = async () => {
    if (!selectedAnswer) {
      alert("Bitte wählen Sie eine Antwort aus.")
      return
    }

    const responseTime = Date.now() - questionStartTime
    const isCorrect = selectedAnswer === questions[currentQuestion].correct

    // Speichere Antwort
    await supabase.from("test_responses").insert({
      session_id: sessionId,
      question_number: currentQuestion + 1,
      answer: selectedAnswer,
      response_time: responseTime,
      is_correct: isCorrect,
    })

    // Prüfe auf Zeit-Anomalien (zu schnell < 2s oder zu langsam > 60s)
    if (responseTime < 2000 || responseTime > 60000) {
      await supabase.from("behavioral_data").insert({
        session_id: sessionId,
        event_type: "time_anomaly",
        data: { response_time: responseTime, question: currentQuestion + 1 },
      })
    }

    // Speichere Antwortlatenz
    await supabase.from("behavioral_data").insert({
      session_id: sessionId,
      event_type: "response_latency",
      data: { response_time: responseTime, question: currentQuestion + 1 },
    })

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer("")
      setQuestionStartTime(Date.now())
    } else {
      // Test abgeschlossen
      await completeTest()
    }
  }

  const completeTest = async () => {
    // Berechne Cheat-Score
    const { data: cheatScoreData } = await supabase.rpc("calculate_cheat_score", {
      p_session_id: sessionId,
    })

    // Aktualisiere Session
    await supabase
      .from("test_sessions")
      .update({
        end_time: new Date().toISOString(),
        cheat_score: cheatScoreData,
        completed: true,
      })
      .eq("id", sessionId)

    // Navigiere zur Ergebnisseite
    router.push(`/results?sessionId=${sessionId}&participantId=${participantId}`)
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            Frage {currentQuestion + 1} von {questions.length}
          </CardTitle>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{questions[currentQuestion].question}</h3>
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button onClick={handleNextQuestion} className="w-full" size="lg">
            {currentQuestion < questions.length - 1 ? "Nächste Frage" : "Test abschließen"}
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
