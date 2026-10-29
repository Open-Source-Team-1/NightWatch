# NightWatch

**AI-Assisted Intrusion Detection and Incident Investigation System**

NightWatch is an open-source-oriented cybersecurity project that
combines **Suricata IDS** with a locally running open-weight language
model to help analysts review suspicious network events, understand
alerts, and manage investigations in one dashboard.

> **Project status:** Proposed architecture / MVP plan. Features
> described here should be treated as planned until implemented and
> tested.

## Problem statement

Intrusion Detection Systems can generate alerts containing technical
fields and signatures that require manual interpretation. Analysts also
need a structured way to group related alerts, record findings, assign
work, and track incident status.

NightWatch aims to bring these workflows together: - Ingest and
normalize Suricata events. - Display, filter, and inspect alerts. -
Generate AI-assisted explanations and investigation suggestions. -
Manage incidents, notes, assignments, dispositions, and audit history. -
Keep the analyst in control of any response action.

NightWatch **does not replace Suricata**. Suricata performs network
detection; the AI helps interpret the available evidence.

## MVP features

1.  Upload a Suricata `eve.json` file and ingest alert events.
2.  Store normalized alerts in MongoDB.
3.  Display alerts with filtering and pagination.
4.  Request and store AI analysis for a selected alert.
5.  Create incidents and link one or more alerts.
6.  Update incident status and record investigation notes.
7.  Record important incident changes in audit history.

Potential later additions include continuous event ingestion,
authentication and role-based authorization, related-alert correlation,
Docker-based deployment, AWS hosting, and explicitly authorized response
integrations.

## Architecture at a glance

``` mermaid
flowchart TD
    A[Authorized test or monitored network] --> B[Suricata IDS]
    B --> C[eve.json events]
    C --> D[Express API and ingestion service]
    D --> E[(MongoDB)]
    E --> F[Next.js dashboard]
    F --> G[Request alert analysis]
    G --> D
    D --> H[Ollama local inference]
    H --> D
    D --> E
    F --> I[Incident management APIs]
    I --> E
```

See [High-Level Design](docs/HLD.md) for architecture and data flows,
and [Low-Level Design](docs/LLD.md) for proposed collections, APIs,
validation, and implementation details.

## Technology stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js + TypeScript    Alert dashboard, AI
                                                  analysis view, incident
                                                  workspace

  Backend                 Node.js + Express +     REST APIs, validation,
                          TypeScript              business logic,
                                                  integration

  Database                MongoDB + Mongoose      Alerts, AI analyses,
                                                  incidents, audit
                                                  records

  Network detection       Suricata                Produces security
                                                  events, including
                                                  `eve.json`

  Local AI runtime        Ollama                  Serves the selected
                                                  open-weight model

  Initial model           `qwen2.5:3b`            Alert explanation and
                                                  investigation
                                                  suggestions

  Packaging               Docker / Docker Compose Reproducible
                          (planned)               development and
                                                  deployment

  Cloud                   AWS (optional later     Potential hosting for
                          phase)                  the application
  -----------------------------------------------------------------------

## Suggested repository structure

``` text
nightwatch/
├── frontend/                  # Next.js + TypeScript
├── backend/                   # Express + TypeScript
│   └── src/
│       ├── modules/
│       │   ├── alerts/
│       │   ├── ai/
│       │   ├── incidents/
│       │   └── audit/
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── app.ts
│       └── server.ts
├── docs/
│   ├── HLD.md
│   └── LLD.md
├── sample-data/               # Sanitized, non-sensitive test events
├── docker-compose.yml         # Planned
├── .env.example
└── README.md
```

This is a suggested layout, not a requirement. The team may adjust it
before implementation.

## Local development prerequisites

Install the following before starting: - Node.js LTS and npm - MongoDB
Community Server or an approved MongoDB deployment - Ollama - Suricata
(only needed to generate real events; sample `eve.json` data can be used
for initial UI/API development) - Git

### 1. Get the code

``` bash
git clone <your-repository-url>
cd nightwatch
```

Replace `<your-repository-url>` with the team's repository URL.

### 2. Configure the backend

Create a backend `.env` file based on `.env.example`. Example values:

``` dotenv
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/nightwatch
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
NODE_ENV=development
```

Do not commit `.env` files, credentials, tokens, production connection
strings, or sensitive event data.

### 3. Start the local AI model

``` bash
ollama pull qwen2.5:3b
ollama serve
```

If Ollama is already running as a background service, do not start a
second instance. Confirm that the model is available before testing AI
analysis.

### 4. Install and run the backend

``` bash
cd backend
npm install
npm run dev
```

The exact scripts depend on the backend's `package.json`; add a `dev`
script as part of implementation.

### 5. Install and run the frontend

In another terminal:

``` bash
cd frontend
npm install
npm run dev
```

The exact frontend URL and API proxy settings should be documented once
the application is implemented. A common local frontend URL is
`http://localhost:3000`, with the API on `http://localhost:4000`.

### 6. Generate or obtain Suricata events

Configure Suricata in an authorized lab or use sanitized sample event
data. Suricata commonly writes EVE JSON events to a configured
`eve.json` log file. Upload the file through the NightWatch ingestion
workflow once that feature is implemented.

Do not monitor networks without permission. Use a controlled lab or
traffic explicitly authorized for monitoring.

## Proposed API overview

  -----------------------------------------------------------------------------
  Method                  Endpoint                      Purpose
  ----------------------- ----------------------------- -----------------------
  `POST`                  `/api/events/upload`          Upload and ingest a
                                                        JSON-lines EVE file

  `GET`                   `/api/alerts`                 List, filter, and
                                                        paginate alerts

  `GET`                   `/api/alerts/stats`           Dashboard counts and
                                                        summaries

  `GET`                   `/api/alerts/:id`             Retrieve one alert

  `POST`                  `/api/alerts/:id/analyze`     Request AI analysis

  `GET`                   `/api/alerts/:id/analysis`    Retrieve saved analysis

  `POST`                  `/api/incidents`              Create an incident

  `GET`                   `/api/incidents`              List incidents

  `GET`                   `/api/incidents/:id`          Retrieve an incident

  `PATCH`                 `/api/incidents/:id/status`   Change incident status

  `POST`                  `/api/incidents/:id/notes`    Add an investigation
                                                        note

  `GET`                   `/api/incidents/:id/audit`    Retrieve incident audit
                                                        history
  -----------------------------------------------------------------------------

These are proposed contracts; request and response schemas should be
finalized before frontend/backend integration.

## Team responsibilities

  -----------------------------------------------------------------------
  Team member             Primary ownership       Shared responsibilities
  ----------------------- ----------------------- -----------------------
  Member 1 --- Detection  Event upload, parsing,  API contracts, testing
                          normalization, alert    
                          APIs, alert dashboard   

  Member 2 --- AI         Ollama client, prompts, Security review,
  investigation           output validation,      testing
                          analysis storage and UI 

  Member 3 --- Incident   Incident APIs, notes,   Integration,
  management              assignments, status,    Docker/deployment
                          audit history and       
                          incident UI             
  -----------------------------------------------------------------------

All members should understand the overall architecture and help test the
integrated workflow.

## Security and responsible use

-   Treat uploaded events and all log fields as **untrusted input**.
-   Treat alert text as data, not instructions to the AI model.
-   Distinguish observed evidence from AI-generated hypotheses.
-   Do not state that an attack is confirmed unless the available
    evidence supports that conclusion.
-   Never execute AI recommendations automatically.
-   Any active response must require explicit authorization, appropriate
    access control, confirmation, and an audit record; keep
    demonstrations inside an authorized lab.
-   Restrict access to the backend, database, and Ollama service. Do not
    expose Ollama publicly.
-   Avoid collecting or retaining unnecessary personal or sensitive
    network data.
-   Validate file size, JSON format, event types, identifiers, and query
    parameters.
-   Do not commit secrets or real incident logs to Git.

## Testing plan

-   Valid EVE JSON lines ingest successfully.
-   Malformed JSON lines produce clear errors and do not crash the
    service.
-   Non-alert event types are handled according to the documented
    ingestion policy.
-   Alert list pagination and filters return consistent results.
-   Invalid alert and incident IDs return appropriate client errors.
-   AI output is validated and stored separately from the original
    alert.
-   AI failures or timeouts do not corrupt alert records.
-   Incident status changes and audit records remain consistent.
-   Unauthorized or invalid response requests are rejected.
-   The app works with sanitized sample data and with Suricata-generated
    test events.

## Roadmap

-   [ ] Agree on shared data models and API contracts.
-   [ ] Build alert ingestion and dashboard.
-   [ ] Integrate local Ollama analysis.
-   [ ] Build incident workflow and audit trail.
-   [ ] Add integration tests and sanitized sample data.
-   [ ] Add Docker Compose and setup documentation.
-   [ ] Evaluate optional AWS deployment.

## Limitations

AI output can be inaccurate, incomplete, or overconfident. A signature
alert is not automatically proof of a successful compromise. NightWatch
is an analyst-assistance prototype; decisions must be based on evidence
and human review. Performance depends on hardware, event volume, and the
selected model.

## License

Choose and add a license before public release (for example, MIT if
appropriate for all contributors and dependencies). Do not claim a
license until the repository actually includes it.
