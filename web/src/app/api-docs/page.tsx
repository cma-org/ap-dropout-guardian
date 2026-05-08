import { BookOpen, Lock, Globe, Database, ArrowRight, Code2, ShieldCheck } from "lucide-react";

const BASE = "http://localhost:3001";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth: "jwt" | "public" | "webhook-secret";
  params?: string[];
  body?: Record<string, string>;
  example?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  POST:   "bg-blue-100 text-blue-800 border-blue-200",
  PUT:    "bg-amber-100 text-amber-800 border-amber-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
};

const sections: { title: string; icon: React.ReactNode; color: string; endpoints: Endpoint[] }[] = [
  {
    title: "Authentication",
    icon: <Lock className="h-4 w-4" />,
    color: "border-purple-200",
    endpoints: [
      {
        method: "POST", path: "/api/auth/login", auth: "public",
        description: "Authenticate a user and receive a JWT access token.",
        body: { email: "string", password: "string" },
        example: `{ "token": "eyJ...", "user": { "id": 1, "email": "...", "role": "teacher" } }`,
      },
      {
        method: "GET", path: "/api/auth/me", auth: "jwt",
        description: "Return the authenticated user's profile.",
        example: `{ "user": { "id": 1, "email": "teacher@zphs.ap.gov.in", "role": "teacher" } }`,
      },
    ],
  },
  {
    title: "Students",
    icon: <Database className="h-4 w-4" />,
    color: "border-blue-200",
    endpoints: [
      {
        method: "GET", path: "/api/students/:childSno", auth: "jwt",
        description: "Retrieve full student detail including risk score, SHAP drivers, attendance, and academic marks.",
        params: ["childSno — unique student identifier (child_sno)"],
        example: `{ "child_sno": 12345, "risk_score": 0.87, "tier": "Critical", "shap_drivers": [...] }`,
      },
    ],
  },
  {
    title: "Schools",
    icon: <Globe className="h-4 w-4" />,
    color: "border-emerald-200",
    endpoints: [
      {
        method: "GET", path: "/api/schools", auth: "jwt",
        description: "List all schools with aggregated risk counts (n_students, n_flagged).",
      },
      {
        method: "GET", path: "/api/schools/:schoolId", auth: "jwt",
        description: "Single school summary.",
        params: ["schoolId — numeric school code"],
      },
      {
        method: "GET", path: "/api/schools/:schoolId/roster", auth: "jwt",
        description: "Paginated at-risk student roster for a specific school.",
        params: ["schoolId — numeric school code"],
      },
      {
        method: "GET", path: "/api/schools/flagged", auth: "jwt",
        description: "Returns an array of schoolId numbers that have ≥1 flagged student.",
        example: `[28161790952, 28161790953, ...]`,
      },
    ],
  },
  {
    title: "Geography",
    icon: <Globe className="h-4 w-4" />,
    color: "border-amber-200",
    endpoints: [
      {
        method: "GET", path: "/api/mandals", auth: "jwt",
        description: "Mandal-level aggregated risk data for the hotspot map. Optional ?district= filter.",
        params: ["district (optional) — filter by district name"],
      },
      {
        method: "GET", path: "/api/districts", auth: "jwt",
        description: "List distinct district names available in the dataset.",
        example: `["NTR", "Krishna", "Guntur"]`,
      },
    ],
  },
  {
    title: "Interventions",
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "border-rose-200",
    endpoints: [
      {
        method: "GET", path: "/api/interventions", auth: "jwt",
        description: "List all interventions. Optional ?childSno= filter.",
        params: ["childSno (optional) — filter by student"],
      },
      {
        method: "POST", path: "/api/interventions", auth: "jwt",
        description: "Log a new intervention for a student.",
        body: {
          childSno: "number (required)",
          actionType: "string — e.g. 'Home visit'",
          status: "'pending' | 'in_progress' | 'completed'",
          assignedTo: "string (required)",
          notes: "string (optional)",
        },
      },
      {
        method: "PUT", path: "/api/interventions/:id", auth: "jwt",
        description: "Update intervention status, notes, or completion timestamp.",
        params: ["id — intervention record ID"],
        body: {
          status: "'pending' | 'in_progress' | 'completed' (optional)",
          notes: "string (optional)",
          completedAt: "ISO 8601 timestamp (optional)",
        },
      },
    ],
  },
  {
    title: "Model & Metrics",
    icon: <Code2 className="h-4 w-4" />,
    color: "border-zinc-200",
    endpoints: [
      {
        method: "GET", path: "/api/metrics", auth: "public",
        description: "Full model performance metrics: ROC-AUC, PR-AUC, confusion matrix, PR curve arrays, fairness audit, feature importances.",
      },
      {
        method: "GET", path: "/api/model/version", auth: "public",
        description: "Model version metadata: training cohort, feature count, performance metrics, retraining schedule, compliance info.",
      },
      {
        method: "GET", path: "/api/model/changelog", auth: "public",
        description: "Version changelog — list of all model iterations with dates, changes, and metrics.",
      },
      {
        method: "GET", path: "/api/counsellor-templates", auth: "jwt",
        description: "Bilingual counsellor response templates keyed by risk driver feature name.",
      },
    ],
  },
  {
    title: "Webhooks (Data Sync)",
    icon: <ArrowRight className="h-4 w-4" />,
    color: "border-orange-200",
    endpoints: [
      {
        method: "POST", path: "/api/webhooks/sync", auth: "webhook-secret",
        description: "Data-sync notification endpoint. Called by upstream ETL/government data pipelines when fresh student data is available. Triggers reprocessing in production.",
        body: {
          source: "string — data source name (e.g. 'SchoolEdDept')",
          academicYear: "string — e.g. '2025-26'",
          district: "string — district name or 'all'",
          recordCount: "number — students updated",
          timestamp: "ISO 8601 timestamp",
        },
        example: `{ "receivedAt": "...", "status": "acknowledged", "message": "..." }`,
      },
      {
        method: "GET", path: "/api/webhooks/health", auth: "public",
        description: "Check webhook endpoint availability and supported events.",
      },
    ],
  },
];

function AuthBadge({ auth }: { auth: string }) {
  if (auth === "jwt") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5">
      <Lock className="h-2.5 w-2.5" /> JWT required
    </span>
  );
  if (auth === "webhook-secret") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5">
      <Lock className="h-2.5 w-2.5" /> X-Webhook-Secret header
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5">
      <Globe className="h-2.5 w-2.5" /> Public
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-[color:var(--ap-navy)]" />
          API Reference
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          REST API for AP Dropout Guardian — base URL: <code className="bg-zinc-100 rounded px-1.5 py-0.5 text-xs font-mono">{BASE}</code>
        </p>
      </div>

      {/* Auth overview */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 px-5 py-4">
        <div className="flex items-center gap-2 font-semibold text-purple-900 text-sm mb-2">
          <Lock className="h-4 w-4" /> Authentication
        </div>
        <p className="text-sm text-purple-800 leading-relaxed mb-2">
          Protected endpoints require a JWT in the <code className="bg-purple-100 rounded px-1 font-mono text-xs">Authorization</code> header:
        </p>
        <code className="block text-xs font-mono bg-purple-100 rounded-lg px-4 py-2 text-purple-900">
          Authorization: Bearer &lt;token&gt;
        </code>
        <p className="text-xs text-purple-700 mt-2">
          Obtain a token via <code className="font-mono bg-purple-100 rounded px-1">POST /api/auth/login</code>. Tokens expire in 7 days.
        </p>
      </div>

      {/* Endpoint sections */}
      {sections.map((section) => (
        <div key={section.title} className={`rounded-xl border ${section.color} bg-white`}>
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <span className="text-[color:var(--ap-navy)]">{section.icon}</span>
            <h2 className="text-sm font-semibold text-zinc-800">{section.title}</h2>
            <span className="ml-auto text-xs text-zinc-400">{section.endpoints.length} endpoint{section.endpoints.length > 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-zinc-50">
            {section.endpoints.map((ep) => (
              <div key={`${ep.method}:${ep.path}`} className="px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider rounded border px-2 py-0.5 ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-zinc-800">{ep.path}</code>
                  <AuthBadge auth={ep.auth} />
                </div>
                <p className="text-sm text-zinc-600">{ep.description}</p>

                {ep.params && (
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Parameters</div>
                    <ul className="space-y-0.5">
                      {ep.params.map((p) => (
                        <li key={p} className="text-xs text-zinc-600 font-mono bg-zinc-50 rounded px-2 py-1">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ep.body && (
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Request body</div>
                    <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-4 py-3 text-xs font-mono space-y-1">
                      {"{"}
                      {Object.entries(ep.body).map(([k, v]) => (
                        <div key={k} className="pl-4">
                          <span className="text-blue-700">&quot;{k}&quot;</span>
                          <span className="text-zinc-400">: </span>
                          <span className="text-zinc-600">{v}</span>
                        </div>
                      ))}
                      {"}"}
                    </div>
                  </div>
                )}

                {ep.example && (
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Response example</div>
                    <pre className="text-xs font-mono bg-zinc-900 text-emerald-300 rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap">
                      {ep.example}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-xs text-zinc-500 leading-relaxed">
        <strong className="text-zinc-700">Rate limiting:</strong> Not enforced in PoC. Production deployment would apply per-user rate limits (100 req/min).
        {" "}<strong className="text-zinc-700">Data residency:</strong> All data stored in AP State Data Centre (Amaravati) in production.
        {" "}<strong className="text-zinc-700">TLS:</strong> HTTPS enforced in production; HTTP used for local development only.
      </div>
    </div>
  );
}
