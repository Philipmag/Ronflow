/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Step {
  id: string;
  order: number;
  title: string;
  description: string;
  actionType: string;
  completed?: boolean;
  elementDetails: {
    tag: string;
    text: string;
    ariaLabel: string;
    placeholder: string;
    value?: string;
  };
  pageTitle: string;
  url: string;
  notes?: string;
  annotation: {
    x: number; // percentage
    y: number; // percentage
    width: number;
    height: number;
  };
  screenshotState: string;
}

export interface Document {
  id: string;
  title: string;
  summary: string;
  prerequisites: string[];
  estimatedTime: string;
  status: "Draft" | "Published" | "Needs review";
  reviewIntervalDays: number;
  lastReviewedAt: string;
  tags: string[];
  steps: Step[];
  createdAt: string;
  updatedAt: string;
  scenariosUsed: string;
}

export interface SimulatedScenario {
  id: string;
  name: string;
  portalName: string;
  startUrl: string;
  states: {
    [key: string]: {
      pageTitle: string;
      url: string;
      layoutType: string; // 'dashboard', 'form', 'success_alert', etc.
      headline: string;
      subtext: string;
      fields: Array<{
        id: string;
        type: "button" | "input" | "radio" | "select" | "checkbox" | "quick_action" | "calendar_cell";
        label: string;
        text: string;
        ariaLabel: string;
        placeholder: string;
        value?: string;
        x: number; // visual placement %
        y: number; // visual placement %
        w: number; // width px
        h: number; // height px
        nextState: string; // triggered layout state
      }>;
    };
  };
}
