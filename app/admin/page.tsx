"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ParticipantResult {
  id: string
  participant_code: string
  experiment_group: string
  cheat_score: number
  completed: boolean
  created_at: string
}

export default function AdminDashboard() {
  const ADMIN_PASSWORD = "idpaimst"
  const [isAuthedAdmin, setIsAuthedAdmin] = useState(false)
  const [adminPwInput, setAdminPwInput] = useState("")
  const [results, setResults] = useState<ParticipantResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    avgCheatScore: 0,
    controlGroup: 0,
    experimentalGroup: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("admin-auth")
      if (s === "true") setIsAuthedAdmin(true)
    } catch (e) {
      // ignore
    }

    const fetchResults = async () => {
      if (!isAuthedAdmin) return
      // Hole alle Test-Sitzungen mit Teilnehmer-Informationen
      const { data, error } = await supabase
        .from("test_sessions")
        .select(
          `
          id,
          cheat_score,
          completed,
          created_at,
          participants (
            id,
            participant_code,
            experiment_group
          )
        `,
        )
        .order("cheat_score", { ascending: false, nullsFirst: false })

      if (error) {
        console.error("[v0] Error fetching results:", error)
      } else {
        const formattedResults = data.map((session: any) => ({
          id: session.id,
          participant_code: session.participants.participant_code,
          experiment_group: session.participants.experiment_group,
          cheat_score: session.cheat_score || 0,
          completed: session.completed,
          created_at: session.created_at,
        }))

        setResults(formattedResults)

        // Berechne Statistiken
        const completed = formattedResults.filter((r) => r.completed).length
        const avgScore =
          formattedResults.reduce((sum, r) => sum + (r.cheat_score || 0), 0) / (formattedResults.length || 1)
        const control = formattedResults.filter((r) => r.experiment_group === "control").length
        const experimental = formattedResults.filter((r) => r.experiment_group === "experimental").length

        setStats({
          total: formattedResults.length,
          completed,
          avgCheatScore: avgScore,
          controlGroup: control,
          experimentalGroup: experimental,
        })
      }
      setIsLoading(false)
    }

    fetchResults()

    // Auto-refresh alle 10 Sekunden (nur wenn authed)
    const interval = setInterval(() => {
      if (isAuthedAdmin) fetchResults()
    }, 10000)
    return () => clearInterval(interval)
  }, [supabase, isAuthedAdmin])

  const handleAdminPwSubmit = () => {
    if (adminPwInput === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem("admin-auth", "true")
      } catch (e) {
        // ignore
      }
      setIsAuthedAdmin(true)
    } else {
      alert("Falsches Admin-Passwort.")
    }
  }

  if (!isAuthedAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Adminbereich geschützt</CardTitle>
            <CardDescription>Bitte Admin-Passwort eingeben.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              placeholder="Admin-Passwort"
              value={adminPwInput}
              onChange={(e) => setAdminPwInput(e.target.value)}
              className="w-full border rounded p-2"
            />
            <Button onClick={handleAdminPwSubmit} className="w-full">
              Zugang
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Lädt Dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Übersicht aller Testergebnisse</p>
          </div>
          <Link href="/">
            <Button variant="outline">Neuer Test</Button>
          </Link>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gesamt Teilnehmer</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Abgeschlossen</CardDescription>
              <CardTitle className="text-3xl">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ø Cheat-Score</CardDescription>
              <CardTitle className="text-3xl">{stats.avgCheatScore.toFixed(1)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Kontrollgruppe</CardDescription>
              <CardTitle className="text-3xl">{stats.controlGroup}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Experimentalgruppe</CardDescription>
              <CardTitle className="text-3xl">{stats.experimentalGroup}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Ergebnistabelle */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Ergebnisse (sortiert nach Cheat-Score)</CardTitle>
            <CardDescription>Teilnehmer mit den höchsten Scores zuerst</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rang</TableHead>
                  <TableHead>Teilnehmer-Code</TableHead>
                  <TableHead>Gruppe</TableHead>
                  <TableHead>Cheat-Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Noch keine Ergebnisse vorhanden
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result, index) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-bold">#{index + 1}</TableCell>
                      <TableCell className="font-mono">{result.participant_code}</TableCell>
                      <TableCell>
                        <Badge variant={result.experiment_group === "control" ? "secondary" : "default"}>
                          {result.experiment_group === "control" ? "Kontrolle" : "Experimental"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${
                            result.cheat_score > 50
                              ? "text-red-600"
                              : result.cheat_score > 25
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {result.cheat_score.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.completed ? "default" : "outline"}>
                          {result.completed ? "Abgeschlossen" : "In Bearbeitung"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(result.created_at).toLocaleString("de-DE")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Legende */}
        <Card>
          <CardHeader>
            <CardTitle>Cheat-Score Interpretation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-sm">0-25: Niedriges Betrugsrisiko</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-600 rounded"></div>
              <span className="text-sm">25-50: Mittleres Betrugsrisiko</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-sm">50-100: Hohes Betrugsrisiko</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Der Cheat-Score basiert auf 7 gewichteten Verhaltensmetriken: Tab-Wechsel (20%), Copy/Paste (15%),
              Zeitanomalien (15%), Antwortlatenz (10%), Mausbewegungen (10%), Tastatur-Muster (15%), Fokus-Verlust (15%)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
