import React from "react";
import {
  FileText,
  TestTube2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import { GeneratedItemList } from "../common";
import type { GeneratedPlaytest, Grade } from "@/types/playtester";

import { formatDateTime } from "@/utils";

interface GeneratedPlaytestListProps {
  playtests: GeneratedPlaytest[];
  selectedPlaytest: GeneratedPlaytest | null;
  onPlaytestSelect: (playtest: GeneratedPlaytest) => void;
}

const getGradeIcon = (grade: Grade) => {
  switch (grade) {
    case "A":
    case "B":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "C":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case "D":
    case "F":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <FileText className="w-4 h-4 text-text-tertiary" />;
  }
};

const getGradeColor = (grade: Grade): string => {
  switch (grade) {
    case "A":
      return "text-green-500";
    case "B":
      return "text-blue-500";
    case "C":
      return "text-yellow-500";
    case "D":
      return "text-orange-500";
    case "F":
      return "text-red-500";
    default:
      return "text-text-tertiary";
  }
};

export const GeneratedPlaytestList: React.FC<GeneratedPlaytestListProps> = ({
  playtests,
  selectedPlaytest,
  onPlaytestSelect,
}) => {
  return (
    <GeneratedItemList
      items={playtests}
      selectedItem={selectedPlaytest}
      onItemSelect={onPlaytestSelect}
      title={
        <div className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-tertiary" />
          Test Results ({playtests.length})
        </div>
      }
      emptyIcon={TestTube2}
      emptyTitle="No playtests yet"
      emptyDescription="Run a playtest to see results here"
      getItemKey={(playtest) => playtest.id}
      cardClassName="h-full flex flex-col"
      contentClassName="flex-1 overflow-y-auto p-4 space-y-2"
      renderItem={(playtest, isSelected) => {
        const grade = playtest.result.report.summary.grade;
        const gradeScore = playtest.result.report.summary.gradeScore;

        return (
          <button
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border-primary bg-bg-tertiary/30 hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">{getGradeIcon(grade)}</div>

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
                  {formatDateTime(playtest.createdAt)}
                </div>
              </div>
            </div>
          </button>
        );
      }}
    />
  );
};
