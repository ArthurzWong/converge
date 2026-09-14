import type { Story } from "../types";

export const DEMO_INPUT =
  "A manufacturing SME receives customer enquiries through WhatsApp, email and phone. Salespeople manually record leads and prepare quotations. Follow-ups are inconsistent and management has little visibility into the sales pipeline.";

export const DEMO_STORY: Story = {
  id: "demo-sme-sales",
  createdAt: "2026-01-01T00:00:00.000Z",
  mode: "business",
  input: DEMO_INPUT,
  provider: "curated demo",
  analysis: {
    title: "SME Sales Transformation",
    problem: "Sales follow-up depends on individual effort, so opportunities leak and leaders fly blind.",
    summary:
      "Enquiries arrive through three channels and are handled by hand. Quotations, follow-ups and pipeline tracking all live in people's heads and spreadsheets.",
    entities: [
      { id: "customer", label: "Customer", kind: "person" },
      { id: "whatsapp", label: "WhatsApp", kind: "channel" },
      { id: "email", label: "Email", kind: "channel" },
      { id: "phone", label: "Phone", kind: "channel" },
      { id: "sales", label: "Salesperson", kind: "team" },
      { id: "quotation", label: "Quotation", kind: "document" },
      { id: "spreadsheet", label: "Spreadsheet", kind: "system" },
      { id: "management", label: "Management", kind: "person" },
      { id: "pipeline", label: "Sales pipeline", kind: "concept" },
    ],
    relationships: [
      { from: "customer", to: "whatsapp", kind: "flow" },
      { from: "customer", to: "email", kind: "flow" },
      { from: "customer", to: "phone", kind: "flow" },
      { from: "whatsapp", to: "sales", kind: "flow" },
      { from: "email", to: "sales", kind: "flow" },
      { from: "phone", to: "sales", kind: "flow" },
      { from: "sales", to: "quotation", kind: "flow" },
      { from: "sales", to: "spreadsheet", kind: "flow" },
      { from: "spreadsheet", to: "management", kind: "flow", label: "weekly, if at all" },
    ],
    insights: [
      { type: "problem", text: "Three inbound channels with no single inbox means enquiries are missed or answered twice." },
      { type: "cause", text: "Each salesperson keeps their own list, so follow-up depends on memory and mood." },
      { type: "problem", text: "Quotations are prepared by hand, so response time stretches from hours to days." },
      { type: "effect", text: "Warm leads go cold before a quote arrives; competitors reply first." },
      { type: "effect", text: "Management sees the pipeline only when someone compiles a spreadsheet." },
      { type: "assumption", text: "Customers will accept an AI-assisted first response if a human follows up quickly." },
    ],
    opportunities: [
      "Capture every enquiry in one place automatically",
      "Draft quotations from a template in minutes, not days",
      "Make follow-up systematic with reminders and ownership",
      "Give management a live view of the pipeline",
    ],
    actions: [
      {
        id: "a1",
        action: "Centralise WhatsApp, email and phone enquiries into one inbox",
        reason: "You cannot follow up what you never captured.",
        priority: "high",
        outcome: "Zero missed enquiries; one source of truth",
      },
      {
        id: "a2",
        action: "Introduce AI-assisted lead qualification",
        reason: "Salespeople spend hours on enquiries that will never convert.",
        priority: "high",
        outcome: "Sales time focused on the top 30% of leads",
      },
      {
        id: "a3",
        action: "Automate quotation preparation from a template",
        reason: "Speed of quote is the biggest driver of win rate.",
        priority: "medium",
        outcome: "Quotes in under 1 hour instead of 2 days",
      },
      {
        id: "a4",
        action: "Add follow-up reminders with a named owner",
        reason: "Consistency beats heroics.",
        priority: "medium",
        outcome: "Every lead touched within 48 hours",
      },
      {
        id: "a5",
        action: "Track conversion and response time weekly",
        reason: "Visibility turns activity into improvement.",
        priority: "low",
        outcome: "Management steers with data, not anecdotes",
      },
    ],
  },
  logic: [
    {
      stage: "problem",
      title: "Sales follow-up is inconsistent",
      points: ["Enquiries arrive via WhatsApp, email and phone", "Each salesperson works from their own notes", "Nobody owns the whole pipeline"],
    },
    {
      stage: "cause",
      title: "Everything is manual and personal",
      points: ["Leads are recorded by hand", "Quotations are built from scratch", "Follow-up relies on memory"],
    },
    {
      stage: "consequence",
      title: "Opportunities leak, leaders fly blind",
      points: ["Slow quotes lose warm leads", "Duplicate or missed replies", "Pipeline visible only in retrospect"],
    },
    {
      stage: "opportunity",
      title: "Automate the routine, keep the human touch",
      points: ["One inbox for all channels", "Templated, assisted quotations", "Reminders with named owners"],
    },
    {
      stage: "solution",
      title: "AI agent + CRM + human approval",
      points: ["Agent captures and qualifies every enquiry", "CRM holds the single pipeline", "Humans approve quotes and build relationships"],
    },
    {
      stage: "action",
      title: "A 90-day path",
      points: ["Days 1–30: centralise and capture", "Days 31–60: assist quotes and follow-ups", "Days 61–90: measure and tune"],
    },
  ],
  scenes: [
    {
      id: "demo-s1",
      number: 1,
      title: "The Current Situation",
      purpose: "Show how enquiries move through the business today.",
      narration:
        "Today, customer enquiries arrive through WhatsApp, email and phone. A salesperson picks them up, types the details into a spreadsheet, prepares a quotation by hand, and management hears about it later, if at all.",
      visualConcept: "A left-to-right flow from customer through channels to salesperson, spreadsheet and manager.",
      visual: {
        layout: "flow",
        nodes: [
          { id: "customer", label: "Customer", style: "person" },
          { id: "channels", label: "WhatsApp · Email · Phone", style: "pill" },
          { id: "sales", label: "Salesperson", style: "person" },
          { id: "sheet", label: "Spreadsheet", style: "cylinder" },
          { id: "manager", label: "Manager", style: "person" },
        ],
        edges: [
          { from: "customer", to: "channels" },
          { from: "channels", to: "sales" },
          { from: "sales", to: "sheet", label: "manual entry" },
          { from: "sheet", to: "manager", label: "weekly" },
        ],
        caption: "Every step depends on one person remembering",
      },
      durationSec: 10,
    },
    {
      id: "demo-s2",
      number: 2,
      title: "Where Things Break",
      purpose: "Expose the friction points that cost revenue.",
      narration:
        "Look closer and the cracks appear. Enquiries are missed between channels. Two people reply to the same customer. Quotes take days. And by the time a follow-up happens, the customer has already bought elsewhere.",
      visualConcept: "The core problem at the centre with four concrete breakdowns around it, connected by broken lines.",
      visual: {
        layout: "breakdown",
        nodes: [
          { id: "core", label: "Inconsistent follow-up", style: "warning" },
          { id: "p1", label: "Missed enquiries", style: "box" },
          { id: "p2", label: "Duplicate replies", style: "box" },
          { id: "p3", label: "Quotes take days", style: "box" },
          { id: "p4", label: "No pipeline visibility", style: "box" },
        ],
        edges: [
          { from: "core", to: "p1", broken: true },
          { from: "core", to: "p2", broken: true },
          { from: "core", to: "p3", broken: true },
          { from: "core", to: "p4", broken: true },
        ],
        caption: "Each crack is small. Together they leak revenue.",
      },
      durationSec: 9,
    },
    {
      id: "demo-s3",
      number: 3,
      title: "The Opportunity",
      purpose: "Reframe the pain as an opening for assistance.",
      narration:
        "Every one of those cracks is also an opening. Capture every enquiry automatically. Draft quotations from a template in minutes. Remind people to follow up. And show management the pipeline as it happens.",
      visualConcept: "A spark at the centre radiating to four opportunities.",
      visual: {
        layout: "hub",
        nodes: [
          { id: "spark", label: "AI assistance", style: "spark" },
          { id: "o1", label: "Capture every enquiry", style: "cloud" },
          { id: "o2", label: "Draft quotes in minutes", style: "cloud" },
          { id: "o3", label: "Systematic follow-up", style: "cloud" },
          { id: "o4", label: "Live pipeline view", style: "cloud" },
        ],
        edges: [
          { from: "spark", to: "o1" },
          { from: "spark", to: "o2" },
          { from: "spark", to: "o3" },
          { from: "spark", to: "o4" },
        ],
        caption: "Automate the routine. Keep the human touch.",
      },
      durationSec: 9,
    },
    {
      id: "demo-s4",
      number: 4,
      title: "The Future State",
      purpose: "Show the target way of working.",
      narration:
        "Picture the same enquiries flowing through one path. An AI agent captures and qualifies each one, the CRM holds a single pipeline, a human approves every quotation, and the customer hears back within the hour.",
      visualConcept: "Customer → AI agent → CRM → human approval → customer, one clean flow.",
      visual: {
        layout: "flow",
        nodes: [
          { id: "customer", label: "Customer", style: "person" },
          { id: "agent", label: "AI Agent", style: "cylinder", note: "captures & qualifies" },
          { id: "crm", label: "CRM", style: "box", note: "one pipeline" },
          { id: "human", label: "Human approval", style: "person" },
          { id: "reply", label: "Quote in 1 hour", style: "pill" },
        ],
        edges: [
          { from: "customer", to: "agent" },
          { from: "agent", to: "crm" },
          { from: "crm", to: "human" },
          { from: "human", to: "reply" },
        ],
        caption: "One path. Visible to everyone.",
      },
      durationSec: 10,
    },
    {
      id: "demo-s5",
      number: 5,
      title: "The Action Plan",
      purpose: "Lay out a 30 / 60 / 90 day roadmap.",
      narration:
        "Start small and build momentum. In the first thirty days, centralise every channel into one inbox. By day sixty, add assisted quotations and follow-up reminders. By day ninety, measure conversion and response time, and tune from there.",
      visualConcept: "A horizontal timeline with three milestones.",
      visual: {
        layout: "timeline",
        nodes: [
          { id: "m1", label: "Centralise enquiries", note: "Days 1–30", style: "box" },
          { id: "m2", label: "Assist quotes & follow-ups", note: "Days 31–60", style: "box" },
          { id: "m3", label: "Measure & tune", note: "Days 61–90", style: "box" },
        ],
        edges: [],
        caption: "30 / 60 / 90 day roadmap",
      },
      durationSec: 9,
    },
  ],
};
