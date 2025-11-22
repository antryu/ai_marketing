"use client"

import { Persona } from "@/types/persona.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Target, TrendingUp, Heart } from "lucide-react"

interface PersonaDisplayProps {
  personas: Persona[]
}

export function PersonaDisplay({ personas }: PersonaDisplayProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {personas.map((persona, index) => (
        <Card key={persona.id || index} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">{persona.name}</CardTitle>
                <CardDescription>{persona.description}</CardDescription>
              </div>
              {persona.is_primary && (
                <Badge variant="default">주요</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {/* Demographics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                인구통계
              </div>
              <div className="text-sm text-muted-foreground">
                {persona.age_range && <div>연령: {persona.age_range}</div>}
                {persona.location && persona.location.length > 0 && (
                  <div>위치: {persona.location.join(", ")}</div>
                )}
                {persona.job_title && persona.job_title.length > 0 && (
                  <div>직책: {persona.job_title.slice(0, 2).join(", ")}</div>
                )}
              </div>
            </div>

            {/* Pain Points */}
            {persona.pain_points && persona.pain_points.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  주요 고민
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.pain_points.slice(0, 2).map((pain, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {pain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {persona.goals && persona.goals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  목표
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.goals.slice(0, 2).map((goal, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Values */}
            {persona.values && persona.values.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Heart className="h-4 w-4" />
                  가치관
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.values.map((value, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms */}
            {persona.platforms && persona.platforms.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  주요 플랫폼: {persona.platforms.join(", ")}
                </div>
              </div>
            )}

            {/* Confidence Score */}
            {persona.confidence_score && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">AI 신뢰도</span>
                  <span className="font-medium">
                    {(persona.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
