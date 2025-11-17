import {
  FileJson,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Clock,
  TestTube2,
} from "lucide-react";
import React, { useState } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "../common";
import { notify, formatDateTime } from "@/utils";
import type {
  PlaytestResult,
  Grade,
  BugSeverity,
  Priority,
} from "@/types/playtester";

interface PlaytestReportCardProps {
  result: PlaytestResult;
}

export const PlaytestReportCard: React.FC<PlaytestReportCardProps> = ({
  result,
}) => {
  const [copied, setCopied] = useState(false);
  const { report } = result;

  const handleCopyJSON = () => {
    const jsonData = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonData);
    setCopied(true);
    notify.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonData = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playtest-report-${result.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Downloaded JSON file!");
  };

  const handleDownloadTXT = () => {
    let textContent = `AI PLAYTESTER SWARM REPORT\n`;
    textContent += `Session ID: ${result.sessionId}\n`;
    textContent += `Content Type: ${result.contentType}\n`;
    textContent += `Date: ${report.testingDetails.timestamp}\n\n`;

    textContent += `SUMMARY\n`;
    textContent += `Grade: ${report.summary.grade} (${report.summary.gradeScore}/100)\n`;
    textContent += `Recommendation: ${report.summary.recommendation.toUpperCase().replace("_", " ")}\n`;
    textContent += `Ready for Production: ${report.summary.readyForProduction ? "YES" : "NO"}\n\n`;

    textContent += `QUALITY METRICS\n`;
    textContent += `Completion Rate: ${report.qualityMetrics.completionRate}\n`;
    textContent += `Difficulty: ${report.qualityMetrics.difficulty.overall}\n`;
    textContent += `Engagement: ${report.qualityMetrics.engagement.overall}\n\n`;

    textContent += `ISSUES FOUND\n`;
    textContent += `Critical: ${report.issues.critical}\n`;
    textContent += `Major: ${report.issues.major}\n`;
    textContent += `Minor: ${report.issues.minor}\n\n`;

    if (report.issues.topIssues.length > 0) {
      textContent += `TOP ISSUES:\n`;
      report.issues.topIssues.forEach((issue, i) => {
        textContent += `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}\n`;
      });
      textContent += "\n";
    }

    textContent += `RECOMMENDATIONS\n`;
    report.recommendations.forEach((rec, i) => {
      textContent += `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}\n`;
      textContent += `   Action: ${rec.action}\n\n`;
    });

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playtest-report-${result.sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Downloaded text file!");
  };

  const getGradeColor = (grade: Grade): string => {
    switch (grade) {
      case "A":
        return "from-green-500 to-emerald-500";
      case "B":
        return "from-blue-500 to-cyan-500";
      case "C":
        return "from-yellow-500 to-orange-500";
      case "D":
        return "from-orange-500 to-red-500";
      case "F":
        return "from-red-500 to-rose-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  const getSeverityColor = (severity: BugSeverity): string => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 border-red-500/30 text-red-500";
      case "major":
        return "bg-orange-500/10 border-orange-500/30 text-orange-500";
      case "minor":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
      default:
        return "bg-gray-500/10 border-gray-500/30 text-gray-500";
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case "critical":
        return <XCircle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      case "low":
        return <Minus className="w-4 h-4" />;
      case "info":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-blue-500";
      case "info":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary border-border-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Playtest Report
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJSON}
              className="text-text-secondary hover:text-text-primary"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadJSON}
              className="text-text-secondary hover:text-text-primary"
            >
              <FileJson className="w-4 h-4 mr-1" />
              JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTXT}
              className="text-text-secondary hover:text-text-primary"
            >
              <FileText className="w-4 h-4 mr-1" />
              TXT
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Grade Badge */}
            <div
              className={`relative w-24 h-24 rounded-xl bg-gradient-to-br ${getGradeColor(report.summary.grade)} p-0.5`}
            >
              <div className="w-full h-full bg-bg-primary rounded-xl flex flex-col items-center justify-center">
                <div
                  className={`text-4xl font-bold bg-gradient-to-br ${getGradeColor(report.summary.grade)} bg-clip-text text-transparent`}
                >
                  {report.summary.grade}
                </div>
                <div className="text-xs text-text-tertiary">
                  {report.summary.gradeScore}/100
                </div>
              </div>
            </div>

            {/* Summary Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {report.summary.readyForProduction ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {report.summary.readyForProduction
                    ? "Ready for Production"
                    : "Not Ready for Production"}
                </span>
              </div>
              <p className="text-sm text-text-secondary capitalize">
                Recommendation:{" "}
                {report.summary.recommendation.replace("_", " ")}
              </p>
              <p className="text-xs text-text-tertiary">
                Confidence: {(report.summary.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Consensus Summary */}
          <div className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg">
            <p className="text-sm text-text-secondary">
              {report.playerFeedback.consensusSummary}
            </p>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Quality Metrics
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-bg-tertiary/30 border border-border-primary rounded-lg">
              <div className="text-xs text-text-tertiary mb-1">
                Completion Rate
              </div>
              <div className="text-lg font-bold text-text-primary">
                {report.qualityMetrics.completionRate}
              </div>
            </div>
            <div className="p-3 bg-bg-tertiary/30 border border-border-primary rounded-lg">
              <div className="text-xs text-text-tertiary mb-1">Difficulty</div>
              <div className="text-lg font-bold text-text-primary">
                {report.qualityMetrics.difficulty.overall}
              </div>
            </div>
            <div className="p-3 bg-bg-tertiary/30 border border-border-primary rounded-lg">
              <div className="text-xs text-text-tertiary mb-1">Engagement</div>
              <div className="text-lg font-bold text-text-primary">
                {report.qualityMetrics.engagement.overall}
              </div>
            </div>
          </div>

          <div className="p-3 bg-bg-tertiary/30 border border-border-primary rounded-lg">
            <div className="text-xs text-text-tertiary mb-2">Pacing</div>
            <div className="flex gap-2 text-xs">
              <span className="text-text-secondary">
                Too Fast: {report.qualityMetrics.pacing.too_fast}
              </span>
              <span className="text-green-500">
                Just Right: {report.qualityMetrics.pacing.just_right}
              </span>
              <span className="text-text-secondary">
                Too Slow: {report.qualityMetrics.pacing.too_slow}
              </span>
            </div>
          </div>
        </div>

        {/* Issues */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Issues Found ({report.issues.total})
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="text-xs text-red-400 mb-1">Critical</div>
              <div className="text-2xl font-bold text-red-500">
                {report.issues.critical}
              </div>
            </div>
            <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
              <div className="text-xs text-orange-400 mb-1">Major</div>
              <div className="text-2xl font-bold text-orange-500">
                {report.issues.major}
              </div>
            </div>
            <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <div className="text-xs text-yellow-400 mb-1">Minor</div>
              <div className="text-2xl font-bold text-yellow-500">
                {report.issues.minor}
              </div>
            </div>
          </div>

          {/* Top Issues */}
          {report.issues.topIssues.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-text-tertiary">
                Top Issues:
              </div>
              {report.issues.topIssues.map((issue, i) => (
                <div
                  key={i}
                  className="p-3 bg-bg-tertiary/30 border border-border-primary rounded-lg space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                    <p className="text-sm text-text-primary flex-1">
                      {issue.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <Users className="w-3 h-3" />
                    <span>Reported by {issue.reportCount} tester(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Common Confusions */}
        {report.playerFeedback.commonConfusions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">
              Common Confusions
            </h4>
            <div className="space-y-2">
              {report.playerFeedback.commonConfusions.map((confusion, i) => (
                <div
                  key={i}
                  className="p-3 bg-bg-tertiary/30 border border-border-primary rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">
                      {confusion.confusion}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      Reported {confusion.reportCount} time(s)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary">
            Recommendations
          </h4>
          <div className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className={getPriorityColor(rec.priority)}>
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {rec.message}
                    </p>
                    <p className="text-xs text-text-secondary">{rec.action}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={`text-xs ${getPriorityColor(rec.priority)} border-current bg-current/10`}
                      >
                        {rec.priority}
                      </Badge>
                      <Badge className="text-xs text-text-tertiary border-border-primary bg-bg-tertiary/50">
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testing Details */}
        <div className="space-y-2 pt-4 border-t border-border-primary">
          <h4 className="text-sm font-semibold text-text-primary">
            Testing Details
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <TestTube2 className="w-4 h-4 text-text-tertiary" />
              <span>{report.testingDetails.testerCount} testers</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="w-4 h-4 text-text-tertiary" />
              <span>{report.testingDetails.duration}</span>
            </div>
          </div>
          <p className="text-xs text-text-tertiary">
            Session ID: {result.sessionId}
          </p>
          <p className="text-xs text-text-tertiary">
            {formatDateTime(report.testingDetails.timestamp)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
