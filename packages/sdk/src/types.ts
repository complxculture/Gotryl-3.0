export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error' | 'cancelled';

export interface Project {
  id: string;
  accountId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: string;
  projectId: string;
  accountId: string;
  description: string;
  generatedCode: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Run {
  id: string;
  testId: string;
  status: RunStatus;
  targetUrl: string;
  durationMs: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface FailureBundle {
  snapshotId: string;
  failingStep: {
    lineNo: number;
    actionType: string;
    selector: string;
  };
  screenshotUrls: string[];
  domSnapshot: string;
  neighboringSteps: unknown[];
  testSource: string;
  rootCauseHypothesis: string;
  fixTarget: {
    file: string;
    lineRange: [number, number];
  };
}
