# Night Watch

**AI-Assisted Intrusion Detection and Incident Investigation**

Night Watch is a proposed open-source cybersecurity platform that
combines **Suricata IDS** with a locally hosted language model to help
analysts review network alerts, understand suspicious activity, and
manage investigations from a unified dashboard.

> **Project status:** MVP plan / proposed architecture. Features
> described in this README are planned until implemented and tested.

## Table of contents

- [Night Watch](#night-watch)
  - [Table of contents](#table-of-contents)
  - [Overview](#overview)
  - [Problem statement](#problem-statement)
  - [MVP scope](#mvp-scope)
  - [Architecture](#architecture)
    - [Data flow](#data-flow)
  - [Technology Stack](#technology-stack)
  - [Repository structure](#repository-structure)
  - [Getting started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Configure the backend](#2-configure-the-backend)
    - [3. Start the local AI model](#3-start-the-local-ai-model)
    - [4. Install and run the backend](#4-install-and-run-the-backend)
    - [5. Install and run the frontend](#5-install-and-run-the-frontend)
    - [6. Generate or load Suricata events](#6-generate-or-load-suricata-events)
  - [Proposed API overview](#proposed-api-overview)
  - [Team responsibilities](#team-responsibilities)
  - [Security and responsible use](#security-and-responsible-use)
  - [Testing plan](#testing-plan)
  - [Roadmap](#roadmap)
  - [Limitations](#limitations)
  - [License](#license)

## Overview

Intrusion Detection Systems (IDS) can produce alerts with technical
fields and signatures that require manual interpretation. Analysts also
need a consistent way to group related alerts, record findings, assign
investigation tasks, and track incident status.

Night Watch aims to bring these workflows together by allowing analysts
to:

-   Ingest and normalize Suricata events.
-   Search, filter, and inspect alerts.
-   Request AI-assisted explanations and investigation suggestions.
-   Create incidents and maintain notes, assignments, statuses, and
    audit history.
-   Retain human oversight over investigation and response decisions.

**Night Watch does not replace Suricata.** Suricata performs network
detection; the AI component helps interpret available evidence.
AI-generated content is advisory and must be reviewed by an analyst.

## Problem statement

Raw IDS alerts can be difficult to triage quickly, especially when
analysts must move between event logs, investigation notes, and incident
tracking tools. Night Watch proposes a single workflow for reviewing
alerts, using AI to assist with interpretation, and documenting incident
investigations.

## MVP scope

The planned minimum viable product includes:

1.  Upload a Suricata `eve.json` file and ingest alert events.
2.  Normalize and store supported alerts in MongoDB.
3.  Display alerts with filtering and pagination.
4.  Request and store AI analysis for a selected alert.
5.  Create incidents and associate one or more alerts with them.
6.  Update incident status and record investigation notes.
7.  Maintain an audit history for important incident changes.

Potential later additions include continuous event ingestion,
authentication and role-based access control, related-alert correlation,
Docker-based deployment, optional AWS hosting, and explicitly authorized
response integrations.

## Architecture

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

### Data flow

1.  Suricata generates EVE JSON events from an authorized monitoring
    environment.
2.  The ingestion service parses supported events, validates fields, and
    normalizes alert data.
3.  Normalized alerts and related records are stored in MongoDB.
4.  Analysts review and filter alerts in the Next.js dashboard.
5.  When requested, the backend sends relevant alert context to the
    local Ollama model.
6.  The backend validates and stores the model's analysis separately
    from the original alert.
7.  Analysts can create incidents, add notes, update statuses, and
    review audit history.

For the detailed architecture and data flows, see [High-Level
Design](docs/HLD.md). For proposed collections, API contracts,
validation, and implementation details, see [Low-Level
Design](docs/LLD.md).

## Technology Stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | Next.js, TypeScript | Alert dashboard, AI analysis view, and incident workspace |
| Backend | Node.js, Express, TypeScript | REST APIs, validation, business logic, and integrations |
| Database | MongoDB, Mongoose | Alert records, AI analyses, incidents, and audit records |
| Network Detection | Suricata | Generates security events, including `eve.json` |
| Local AI Runtime | Ollama | Runs the selected open-weight language model locally |
| Initial AI Model | `qwen2.5:3b` | Alert explanations and investigation suggestions |
| Containerization | Docker / Docker Compose (planned) | Reproducible development and deployment |
| Cloud | AWS (optional in a later phase) | Potential hosting for application components |


## Repository structure

The following layout is a proposal and may be adjusted as implementation
progresses.

``` text
NightWatch/
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
├── LICENSE
└── README.md
```

## Getting started

### Prerequisites

Install the following before starting development:

-   [Node.js](https://nodejs.org/) LTS and npm
-   [MongoDB](https://www.mongodb.com/try/download/community) or an
    approved MongoDB deployment
-   [Ollama](https://ollama.com/)
-   [Suricata](https://suricata.io/) to generate real events; sanitized
    sample events can be used for initial development
-   Git

### 1. Clone the repository

Replace the placeholder URL with the team's actual repository URL.

``` bash
git clone <repository-url>
cd NightWatch
```

### 2. Configure the backend

Create a backend `.env` file based on `.env.example`. Example
development settings:

``` dotenv
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/nightwatch
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
NODE_ENV=development
```

Adjust these values to match your local setup. Do not commit `.env`
files, credentials, tokens, production connection strings, or sensitive
event data.

### 3. Start the local AI model

Pull the selected model:

``` bash
ollama pull qwen2.5:3b
```

Ollama commonly runs as a background service. If it is not already
running in your environment, start it with:

``` bash
ollama serve
```

Do not start a second instance if the service is already running.
Confirm that the model is available before testing AI analysis.

### 4. Install and run the backend

``` bash
cd backend
npm install
npm run dev
```

The exact commands depend on the scripts defined in
`backend/package.json`. Add a development script during implementation
if one is not present.

### 5. Install and run the frontend

In a separate terminal:

``` bash
cd frontend
npm install
npm run dev
```

The expected local setup is a frontend at `http://localhost:3000` and an
API at `http://localhost:4000`, subject to the final application
configuration. Document any required API proxy or environment variables
when they are implemented.

### 6. Generate or load Suricata events

Configure Suricata in an authorized lab, or use sanitized sample data.
Suricata commonly writes EVE JSON events to a configured `eve.json` log
file. Upload the file through the Night Watch ingestion workflow once
that feature is implemented.

**Only monitor networks and systems for which you have explicit
authorization.**

## Proposed API overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/events/upload` | Upload and ingest a JSON-lines EVE file |
| `GET` | `/api/alerts` | List, filter, and paginate alerts |
| `GET` | `/api/alerts/stats` | Retrieve dashboard counts and summaries |
| `GET` | `/api/alerts/:id` | Retrieve a single alert |
| `POST` | `/api/alerts/:id/analyze` | Request AI analysis of an alert |
| `GET` | `/api/alerts/:id/analysis` | Retrieve saved AI analysis |
| `POST` | `/api/incidents` | Create an incident |
| `GET` | `/api/incidents` | List incidents |
| `GET` | `/api/incidents/:id` | Retrieve a single incident |
| `PATCH` | `/api/incidents/:id/status` | Change incident status |
| `POST` | `/api/incidents/:id/notes` | Add an investigation note |
| `GET` | `/api/incidents/:id/audit` | Retrieve incident audit history |

These are proposed API contracts. Request and response schemas should be finalized before frontend/backend integration.

## Team responsibilities

| Team member | Primary ownership | Shared responsibilities |
|---|---|---|
| **Member 1 — Detection** | Event upload, parsing, normalization, alert APIs, and alert dashboard | API contracts and testing |
| **Member 2 — AI Investigation** | Ollama client, prompts, output validation, analysis storage, and AI analysis UI | Security review and testing |
| **Member 3 — Incident Management** | Incident APIs, notes, assignments, status management, audit history, and incident UI | Integration and Docker/deployment |



All team members should understand the overall architecture and help
test the integrated workflow.

## Security and responsible use

-   Treat uploaded events and all log fields as untrusted input.
-   Treat alert text as data, not as instructions to the AI model.
-   Distinguish observed evidence from AI-generated hypotheses.
-   Do not describe an attack as confirmed unless the available evidence
    supports that conclusion.
-   Never execute AI recommendations automatically.
-   Require explicit authorization, appropriate access control,
    confirmation, and audit logging for any active response.
-   Restrict access to the backend, database, and Ollama service. Do not
    expose Ollama publicly.
-   Avoid collecting or retaining unnecessary personal or sensitive
    network data.
-   Validate file size, JSON format, event types, identifiers, and query
    parameters.
-   Never commit secrets or real incident logs to version control.

## Testing plan

The MVP should be tested to verify that:

-   Valid EVE JSON lines are ingested successfully.
-   Malformed JSON lines produce clear errors without crashing the
    service.
-   Non-alert event types follow the documented ingestion policy.
-   Alert pagination and filters return consistent results.
-   Invalid alert and incident IDs return appropriate client errors.
-   AI output is validated and stored separately from the original
    alert.
-   AI failures and timeouts do not corrupt alert records.
-   Incident status changes and audit records remain consistent.
-   Unauthorized or invalid response requests are rejected.
-   The application works with sanitized sample data and
    Suricata-generated test events.

Here’s a more polished and professional version of your roadmap, with clearer wording and a logical implementation sequence.

Writing

## Roadmap

- [ ] **Define shared data models and API contracts** to establish consistent communication between components.
- [ ] **Implement alert ingestion and dashboard functionality** to collect, process, and visualize alerts.
- [ ] **Integrate local AI-powered analysis using Ollama** to enable privacy-focused, locally hosted insights.
- [ ] **Develop incident management workflows and audit trails** to track incident lifecycles and maintain accountability.
- [ ] **Add integration tests and sanitized sample datasets** to validate system reliability and support development.
- [ ] **Set up Docker Compose and comprehensive setup documentation** to simplify local development and deployment.
- [ ] **Evaluate optional AWS deployment** to assess cloud hosting requirements, scalability, and operational costs.



## Limitations

- **AI Accuracy:** AI-generated outputs may be inaccurate, incomplete, or overconfident and should not be treated as definitive conclusions.
- **Alert Reliability:** A signature-based alert alone does not confirm a successful security breach or system compromise. Further investigation is required to validate the alert.
- **Human Verification:** Night Watch is designed as an analyst-assistance prototype. All AI-generated conclusions and incident response decisions must be reviewed and validated by a human analyst.
- **Performance Constraints:** System performance depends on available hardware resources, network event volume, and the selected AI model.
- **Model Limitations:** The capabilities of the AI analysis component are limited by the selected model's knowledge, reasoning ability, and capacity to interpret security events accurately.
- **Prototype Scope:** Night Watch is intended to support security monitoring and investigation rather than replace professional security analysts or established incident response procedures.

## License

Night Watch is licensed under the [MIT License](LICENSE).

You are free to use, modify, distribute, and contribute to this project
in accordance with the terms of the MIT License. See the
[`LICENSE`](LICENSE) file for the complete license text.
