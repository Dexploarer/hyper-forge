/**
 * AI Playtester Swarm Types
 * TypeScript interfaces for playtester swarm testing
 */

import type { QualityLevel } from './content'

// Playtest content types
export type PlaytestContentType = 'quest' | 'dialogue' | 'npc' | 'combat' | 'puzzle'
export type PlaytestView = 'config' | 'progress' | 'results'

// Tester archetypes
export type PlaytesterArchetype =
  | 'completionist'
  | 'speedrunner'
  | 'explorer'
  | 'casual'
  | 'minmaxer'
  | 'roleplayer'
  | 'breaker'

export type KnowledgeLevel = 'beginner' | 'intermediate' | 'expert'
export type Pacing = 'too_fast' | 'just_right' | 'too_slow' | 'unknown'
export type BugSeverity = 'critical' | 'major' | 'minor'
export type Recommendation = 'pass' | 'pass_with_changes' | 'fail'
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'
export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'info'

// Tester persona configuration
export interface TesterPersona {
  name: string
  archetype: PlaytesterArchetype
  personality: string
  expectations: string[]
}

export interface CustomTesterProfile {
  id?: string
  name: string
  archetype?: string
  knowledgeLevel?: KnowledgeLevel
  personality: string
  expectations?: string[]
}

// Bug report
export interface BugReport {
  description: string
  severity: BugSeverity
  reporter: string
  reportCount: number
  reporters: string[]
}

// Test metrics
export interface QualityMetrics {
  completionRate: string
  difficulty: {
    overall: string
    byLevel: Record<string, { average: number; count: number }>
  }
  engagement: {
    overall: string
    byArchetype: Record<string, { average: number; count: number }>
  }
  pacing: {
    too_fast: number
    just_right: number
    too_slow: number
    unknown: number
  }
}

export interface IssuesSummary {
  critical: number
  major: number
  minor: number
  total: number
  topIssues: Array<{
    description: string
    severity: BugSeverity
    reportedBy: string[]
    reportCount: number
  }>
}

export interface PlayerFeedback {
  commonConfusions: Array<{
    confusion: string
    reportCount: number
  }>
  testerAgreement: 'strong' | 'moderate'
  consensusSummary: string
}

export interface ActionableRecommendation {
  priority: Priority
  category: 'bugs' | 'completion' | 'difficulty' | 'engagement' | 'pacing' | 'quality'
  message: string
  action: string
}

export interface TestSummary {
  grade: Grade
  gradeScore: number
  recommendation: Recommendation
  confidence: number
  readyForProduction: boolean
}

export interface TestingDetails {
  duration: string
  testerCount: number
  contentType: string
  timestamp: string
}

// Complete test report
export interface PlaytestReport {
  summary: TestSummary
  qualityMetrics: QualityMetrics
  issues: IssuesSummary
  playerFeedback: PlayerFeedback
  recommendations: ActionableRecommendation[]
  testingDetails: TestingDetails
}

// Individual tester result
export interface IndividualTestResult {
  testerId: string
  testerName: string
  archetype: PlaytesterArchetype
  knowledgeLevel: KnowledgeLevel
  success: boolean
  playthrough: string
  completed: boolean
  difficulty: number
  engagement: number
  pacing: Pacing
  bugs: Array<{
    description: string
    severity: BugSeverity
    reporter: string
    archetype: PlaytesterArchetype
  }>
  confusionPoints: string[]
  feedback: string
  recommendation: Recommendation
  error?: string
}

// Full playtest result from API
export interface PlaytestResult {
  sessionId: string
  contentType: string
  testCount: number
  duration: number
  report: PlaytestReport
  individualResults: IndividualTestResult[]
  metadata: {
    generatedBy: string
    model: string
    timestamp: string
    parallel: boolean
  }
}

// Playtest request params
export interface RunPlaytestParams {
  contentToTest: any
  contentType: PlaytestContentType
  testerProfiles?: Array<string | CustomTesterProfile>
  testConfig?: {
    parallel?: boolean
    temperature?: number
  }
  model?: QualityLevel
}

// Available personas response
export interface AvailablePersonasResponse {
  availablePersonas: string[]
  personas: Record<string, TesterPersona>
  defaultSwarm: string[]
  description: string
}

// Generated playtest session
export interface GeneratedPlaytest {
  id: string
  contentType: PlaytestContentType
  name: string
  result: PlaytestResult
  createdAt: string
}
