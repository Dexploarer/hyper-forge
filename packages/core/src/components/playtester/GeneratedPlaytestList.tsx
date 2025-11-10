import React from 'react'
import { FileText, TestTube2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent } from '../common'
import type { GeneratedPlaytest, Grade } from '@/types/playtester'

interface GeneratedPlaytestListProps {
  playtests: GeneratedPlaytest[]
  selectedPlaytest: GeneratedPlaytest | null
  onPlaytestSelect: (playtest: GeneratedPlaytest) => void
}

export const GeneratedPlaytestList: React.FC<GeneratedPlaytestListProps> = ({
  playtests,
  selectedPlaytest,
  onPlaytestSelect
}) => {
  const getGradeIcon = (grade: Grade) => {
    switch (grade) {
      case 'A':
      case 'B':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'C':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'D':
      case 'F':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-text-tertiary" />
    }
  }

  const getGradeColor = (grade: Grade): string => {
    switch (grade) {
      case 'A':
        return 'text-green-500'
      case 'B':
        return 'text-blue-500'
      case 'C':
        return 'text-yellow-500'
      case 'D':
        return 'text-orange-500'
      case 'F':
        return 'text-red-500'
      default:
        return 'text-text-tertiary'
    }
  }

  if (playtests.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Test Results</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <TestTube2 className="w-12 h-12 mx-auto mb-4 text-text-tertiary/50" />
            <p className="text-sm text-text-secondary">No playtests yet</p>
            <p className="text-xs text-text-tertiary mt-1">
              Run a playtest to see results here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-tertiary" />
          Test Results ({playtests.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
        {playtests.map((playtest) => {
          const isSelected = selectedPlaytest?.id === playtest.id
          const grade = playtest.result.report.summary.grade
          const gradeScore = playtest.result.report.summary.gradeScore

          return (
            <button
              key={playtest.id}
              onClick={() => onPlaytestSelect(playtest)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border-primary bg-bg-tertiary/30 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getGradeIcon(grade)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary truncate capitalize">
                      {playtest.contentType}
                    </span>
                    <span className={`text-xs font-bold ${getGradeColor(grade)}`}>
                      {grade}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    <span>{playtest.result.testCount} testers</span>
                    <span>•</span>
                    <span>{gradeScore}/100</span>
                  </div>

                  <div className="text-xs text-text-tertiary mt-1">
                    {new Date(playtest.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
