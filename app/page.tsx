"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function HomePage() {
  const [consentGiven, setConsentGiven] = useState(false)
  const [group, setGroup] = useState<"control" | "experimental">("control")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStartTest = async () => {
    if (!consentGiven) {
      alert("Bitte stimmen Sie der Teilnahme zu, um fortzufahren.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Erstelle Teilnehmer
      const participantCode = `P${Date.now()}`
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          participant_code: participantCode,
          experiment_group: group,
          consent_given: true,
        })
        .select()
        .single()

      if (participantError) throw participantError

      // Erstelle Test-Sitzung
      const { data: session, error: sessionError } = await supabase
        .from("test_sessions")
        .insert({
          participant_id: participant.id,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Navigiere zum Test
      router.push(`/test?sessionId=${session.id}&participantId=${participant.id}`)
    } catch (error) {
      console.error("[v0] Error creating participant:", error)
      alert("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Online-Betrugserkennungs-Experiment</CardTitle>
          <CardDescription className="text-center text-lg">Willkommen zu unserer Forschungsstudie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informationen zur Studie</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Diese Studie untersucht das Verhalten von Teilnehmern bei Online-Tests. Sie werden gebeten, eine Reihe von
              Fragen zu beantworten. Ihre Interaktionen werden aufgezeichnet, um Verhaltensmuster zu analysieren.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Die Teilnahme ist freiwillig und Sie können Ihre Daten am Ende des Tests löschen lassen. Die Studie dauert
              etwa 10-15 Minuten.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Experimentgruppe auswählen</h3>
            <RadioGroup value={group} onValueChange={(value) => setGroup(value as "control" | "experimental")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="control" id="control" />
                <Label htmlFor="control" className="cursor-pointer">
                  Kontrollgruppe
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="experimental" id="experimental" />
                <Label htmlFor="experimental" className="cursor-pointer">
                  Experimentalgruppe
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Einverständniserklärung</h3>
            <div className="flex items-start space-x-2">
              <Checkbox id="consent" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(!!checked)} />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                Ich habe die Informationen zur Studie gelesen und verstanden. Ich stimme freiwillig der Teilnahme zu und
                bin mir bewusst, dass meine Interaktionen aufgezeichnet werden. Ich kann meine Daten am Ende des Tests
                löschen lassen.
              </Label>
            </div>
          </div>

          <Button onClick={handleStartTest} disabled={!consentGiven || isLoading} className="w-full" size="lg">
            {isLoading ? "Wird geladen..." : "Test starten"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
