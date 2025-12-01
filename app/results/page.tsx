"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SessionData {
  cheat_score: number
  completed: boolean
}

function ResultsContent() {
  const RESULTS_PASSWORD = "idpa2025"
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("sessionId")
  const participantId = searchParams.get("participantId")

  const [isAuthed, setIsAuthed] = useState(false)
  const [pwInput, setPwInput] = useState("")

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [deleteData, setDeleteData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Prüfe, ob bereits ein Session-Auth-Token für Ergebnisse gesetzt ist
    try {
      const s = sessionStorage.getItem("results-auth")
      if (s === "true") setIsAuthed(true)
    } catch (e) {
      // ignore
    }

    const fetchSessionData = async () => {
      if (!isAuthed) return

      const { data, error } = await supabase
        .from("test_sessions")
        .select("cheat_score, completed")
        .eq("id", sessionId)
        .single()

      if (error) {
        console.error("Error fetching session data:", error)
      } else {
        setSessionData(data)
      }
      setIsLoading(false)
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId, supabase, isAuthed])

  const handlePwSubmit = () => {
    if (pwInput === RESULTS_PASSWORD) {
      try {
        sessionStorage.setItem("results-auth", "true")
      } catch (e) {
        // ignore
      }
      setIsAuthed(true)
    } else {
      alert("Falsches Passwort.")
    }
  }

  const handleFinish = async () => {
    if (deleteData) {
      // Lösche alle Daten des Teilnehmers
      await supabase.from("participants").update({ data_deletion_requested: true }).eq("id", participantId)

      // Lösche Teilnehmer (CASCADE löscht automatisch alle verknüpften Daten)
      await supabase.from("participants").delete().eq("id", participantId)

      alert("Ihre Daten wurden erfolgreich gelöscht.")
    }

    router.push("/admin")
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Ergebnisse geschützt</CardTitle>
            <CardDescription>
              BLEIBEN SIE BITTE AUF DER WEBSEITE. Warten Sie bitte auf die Prüfungsaufsicht um den Code zu deinen Resultaten zu erhalten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              placeholder="Passwort eingeben"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              className="w-full border rounded p-2"
            />
            <Button onClick={handlePwSubmit} className="w-full">
              Passwort prüfen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Lädt Ergebnisse...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Test abgeschlossen!</CardTitle>
          <CardDescription className="text-center text-lg">Vielen Dank für Ihre Teilnahme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ihre Ergebnisse</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Cheat-Score:</p>
              <p className="text-4xl font-bold text-primary">{sessionData?.cheat_score?.toFixed(2) || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-2">
                (Basierend auf Verhaltensanalyse: Tab-Wechsel, Copy/Paste, Zeitanomalien, etc.)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Datenschutz</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ihre Daten wurden für Forschungszwecke gespeichert. Wenn Sie möchten, dass Ihre Daten gelöscht werden,
              aktivieren Sie bitte die Option unten.
            </p>
            <div className="flex items-start space-x-2">
              <Checkbox id="delete" checked={deleteData} onCheckedChange={(checked) => setDeleteData(!!checked)} />
              <Label htmlFor="delete" className="text-sm leading-relaxed cursor-pointer">
                Ja, ich möchte, dass meine Daten gelöscht werden.
              </Label>
            </div>
          </div>

          <Button onClick={handleFinish} className="w-full" size="lg">
            {deleteData ? "Daten löschen und beenden" : "Zum Dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <ResultsContent />
    </Suspense>
  )
}
