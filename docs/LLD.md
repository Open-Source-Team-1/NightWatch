# NightWatch — Low-Level Design (LLD)

**Document Status:** Proposed implementation specification for the MVP\
**Backend:** Node.js, Express, TypeScript\
**Database:** MongoDB, Mongoose\
**Frontend:** Next.js, TypeScript

## 1\. Purpose and Scope

This document translates the High-Level Design (HLD) into an implementation-ready specification for the NightWatch MVP. It defines the proposed repository structure, backend module responsibilities, database schemas, API contracts, validation rules, security controls, and testing strategy.

The specifications in this document serve as the baseline for parallel development. Before implementation begins, the team should agree on shared TypeScript types, API contracts, database schemas, and key architectural decisions.

## 2\. Proposed Repository Structure

text

```
nightwatch/
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── alerts/
│   │   └── incidents/
│   ├── components/
│   ├── lib/
│   │   └── api-client.ts
│   └── types/
├── backend/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       │   ├── ingestion/
│       │   ├── alerts/
│       │   ├── ai/
│       │   ├── incidents/
│       │   └── audit/
│       ├── models/
│       ├── utils/
│       ├── app.ts
│       └── server.ts
├── docs/
│   ├── HLD.md
│   └── LLD.md
├── sample-data/
├── .env.example
└── README.md
```

## 3\. Backend Module Responsibilities

| Module | Suggested Files | Responsibilities |
| --- | --- | --- |
| Ingestion | `ingestion.routes.ts`, `ingestion.controller.ts`, `ingestion.service.ts`, `eve.parser.ts` | Upload, parse, normalize, validate, and deduplicate EVE events. |
| Alerts | `alert.model.ts`, `alert.routes.ts`, `alert.controller.ts`, `alert.service.ts` | Retrieve alerts, provide alert details, apply filters, and calculate statistics. |
| AI Analysis | `ai.routes.ts`, `ai.controller.ts`, `ai.service.ts`, `ollama.client.ts`, `ai.prompt.ts`, `ai.validator.ts`, `ai-analysis.model.ts` | Generate, validate, and persist AI-assisted alert analysis using Ollama. |
| Incidents | `incident.model.ts`, `incident.routes.ts`, `incident.controller.ts`, `incident.service.ts` | Create, retrieve, and manage incident records, notes, and status transitions. |
| Audit | `audit.model.ts`, `audit.service.ts`, `audit.routes.ts` | Record and retrieve incident-related audit events. |
| Shared Infrastructure | `error-handler.ts`, `validate-request.ts`, `db.ts`, `logger.ts` | Provide shared validation, database connectivity, logging, and error handling. |

### Architectural Guidelines

- **Routes** define endpoint paths and middleware.
- **Controllers** handle HTTP requests and construct responses.
- **Services** implement business logic and enforce domain rules.
- **Models** define MongoDB persistence schemas and indexes.
- **Shared utilities** provide reusable infrastructure and cross-cutting functionality.

Keep routes and controllers lightweight. Business rules should reside in services to improve testability, maintainability, and separation of concerns.

## 4\. MongoDB Data Models

### 4.1. Alerts Collection

Collection: `alerts`

| Field | Type | Validation and Notes |
| --- | --- | --- |
| `_id` | ObjectId | MongoDB primary key. |
| `eventTimestamp` | Date | Required source-event timestamp; validate date parsing. |
| `eventType` | String | Store `alert` events in the MVP. |
| `sourceIp` | String | Validate as an IPv4 or IPv6 address when present. |
| `sourcePort` | Number | Optional; valid range is 0–65535. |
| `destinationIp` | String | Validate as an IPv4 or IPv6 address when present. |
| `destinationPort` | Number | Optional; valid range is 0–65535. |
| `protocol` | String | Optional normalized protocol identifier. |
| `signatureId` | Number or String | Suricata detection signature identifier. |
| `signature` | String | Human-readable detection signature. |
| `category` | String | Optional alert category. |
| `severity` | Number | Suricata severity; lower numeric values commonly indicate higher severity. |
| `status` | Enum | Optional workflow status: `OPEN`, `INVESTIGATING`, `RESOLVED`. |
| `source` | Enum | Event source, initially `SURICATA`. |
| `eventFingerprint` | String | Stable deduplication key; use a unique index if the fingerprint strategy is reliable. |
| `rawEvent` | Mixed/Object | Original parsed event; enforce size limits and sanitize sensitive data. |
| `createdAt` | Date | Server-generated creation timestamp. |
| `updatedAt` | Date | Server-generated update timestamp. |

**Recommended indexes**

- `eventTimestamp`
- `severity`
- `sourceIp`
- `destinationIp`
- `signatureId`
- A unique index on `eventFingerprint`, if supported by the chosen deduplication strategy.

**Design decision:** Avoid maintaining competing workflow states. If incident status is the authoritative investigation state, alert status must not be presented as equivalent. The team should explicitly define whether alerts have independent lifecycle states.

### 4.2. AI Analyses Collection

Collection: `ai_analyses`

One alert may have multiple AI analyses, allowing analysts to review previous results and compare analyses generated with different models or prompt versions.

| Field | Type | Validation and Notes |
| --- | --- | --- |
| `_id` | ObjectId | Primary key. |
| `alertId` | ObjectId | Required reference to an existing alert. |
| `model` | String | Model identifier, such as `qwen2.5:3b`. |
| `promptVersion` | String | Identifies the prompt version used for reproducibility. |
| `summary` | String | Concise explanation of the alert. |
| `observedEvidence` | String array | Evidence grounded in the stored alert fields. |
| `hypotheses` | Object array | Proposed explanations with rationale and uncertainty. |
| `recommendedChecks` | Object array | Safe investigative checks; not automatically executed actions. |
| `limitations` | String array | Missing context, assumptions, and caveats. |
| `createdAt` | Date | Server-generated analysis timestamp. |

**Recommended indexes:** `alertId` and `createdAt`.

### 4.3. Incidents Collection

Collection: `incidents`

| Field | Type | Validation and Notes |
| --- | --- | --- |
| `_id` | ObjectId | Primary key. |
| `title` | String | Required, trimmed, and length-limited. |
| `description` | String | Optional, length-limited description. |
| `alertIds` | ObjectId array | References to existing alerts. |
| `severity` | Enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `status` | Enum | `OPEN`, `INVESTIGATING`, `RESOLVED`. |
| `disposition` | Enum | `TRUE_POSITIVE`, `FALSE_POSITIVE`, `UNDETERMINED`. |
| `assignedTo` | ObjectId, String, or null | Authenticated user reference when identity management is implemented. |
| `notes` | Array or separate collection | Embedded, bounded notes for the MVP; separate collection if future scale requires it. |
| `createdBy` | ObjectId or String | Actor identity derived from authenticated server context. |
| `createdAt` | Date | Server-generated creation timestamp. |
| `updatedAt` | Date | Server-generated update timestamp. |

**Recommended indexes:** `status`, `severity`, `updatedAt`, and `assignedTo` when applicable.

### 4.4. Audit Logs Collection

Collection: `audit_logs`

| Field | Type | Validation and Notes |
| --- | --- | --- |
| `_id` | ObjectId | Primary key. |
| `resourceType` | Enum | `INCIDENT`, `ALERT`, `RESPONSE`. |
| `resourceId` | ObjectId or String | Identifier of the affected resource. |
| `incidentId` | ObjectId | Optional reference to the associated incident. |
| `actorId` | ObjectId or String | Derived from authenticated server context. |
| `action` | String | Action identifier, such as `INCIDENT_STATUS_CHANGED` or `NOTE_ADDED`. |
| `previousValue` | Mixed | Optional previous value; exclude secrets and sensitive information. |
| `newValue` | Mixed | Optional updated value. |
| `details` | Object | Bounded, sanitized metadata. |
| `createdAt` | Date | Server-generated timestamp. |

**Audit integrity requirements**

- Treat audit records as append-only at the application level.
- Restrict update and delete permissions.
- Record relevant state changes with the corresponding actor and timestamp.
- Use transactions when supported and appropriate for coupled state changes.
- Consider external immutable storage if stronger tamper resistance is required.

MongoDB documents are not inherently tamper-proof. Application-level append-only behavior alone does not guarantee immutability.

## 5\. API Contracts

All endpoints in this section are proposed contracts for the MVP.

Use a consistent JSON response structure, shared request/response TypeScript types, centralized validation, and common error middleware.

### 5.1. Upload EVE Events

`POST /api/events/upload`

**Request:** `multipart/form-data`

- Field: `file`
- Content: JSON Lines (JSONL) file containing Suricata EVE events.

**Example response:**

json

```
{
  "data": {
    "accepted": 120,
    "duplicates": 3,
    "skipped": 15,
    "rejected": 2
  },
  "errors": [
    {
      "line": 17,
      "code": "INVALID_JSON",
      "message": "The line could not be parsed as JSON."
    }
  ]
}
```

**Validation and processing rules**

- Enforce maximum file size and maximum event-line size.
- Parse one JSON object per non-empty line.
- Report malformed records without aborting the entire import.
- Process only records where `event_type === "alert"` in the MVP.
- Count unsupported event types as skipped records.
- Never execute or interpret imported log content as commands.
- Avoid including full raw events in error messages.
- Return bounded, structured line-level errors.

### 5.2. List Alerts

`GET /api/alerts?page=1&limit=20&severity=1&sourceIp=192.0.2.10&search=scan`

**Supported query parameters**

| Parameter | Validation |
| --- | --- |
| `page` | Integer greater than or equal to 1. |
| `limit` | Integer between 1 and 100. |
| `severity` | Valid numeric severity value. |
| `sourceIp` | Valid IPv4 or IPv6 address. |
| `destinationIp` | Valid IPv4 or IPv6 address. |
| `from` | Valid start date-time. |
| `to` | Valid end date-time. |
| `search` | Length-limited text search. |

Validate date ranges and reject invalid combinations, such as a `from` value later than `to`. Do not construct MongoDB query operators directly from untrusted user input.

**Example response:**

json

```
{
  "data": [
    {
      "id": "66f000000000000000000001",
      "eventTimestamp": "2026-10-29T10:00:00.000Z",
      "sourceIp": "192.0.2.10",
      "destinationIp": "192.0.2.20",
      "protocol": "TCP",
      "signature": "Example test signature",
      "severity": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

Use documentation-only IP ranges in examples. Example records are illustrative and do not establish that a real security incident occurred.

### 5.3. Retrieve Alert Details

`GET /api/alerts/:id`

- Validate the alert ID format.
- Return normalized alert fields and explicitly selected raw-event fields.
- Return `404 Not Found` when the alert does not exist.
- Exclude unrelated sensitive event data.
- Apply the same authorization policy as other alert endpoints.

### 5.4. Retrieve Alert Statistics

`GET /api/alerts/stats`

**Example response:**

json

```
{
  "data": {
    "total": 120,
    "bySeverity": {
      "1": 10,
      "2": 35,
      "3": 75
    },
    "byCategory": [
      {
        "category": "Example Category",
        "count": 12
      }
    ]
  }
}
```

Calculate statistics from stored alert data. Define whether totals represent all stored alerts or a specified time window, and apply filters consistently where supported.

### 5.5. Generate AI Analysis

`POST /api/alerts/:id/analyze`

**Request:** Empty JSON body or no body for the initial version.

The backend must retrieve the alert from MongoDB using the supplied alert ID. The client must not be trusted to provide authoritative alert contents.

**Example response:**

json

```
{
  "data": {
    "analysisId": "66f000000000000000000099",
    "alertId": "66f000000000000000000001",
    "model": "qwen2.5:3b",
    "summary": "This alert indicates activity matching the recorded detection signature.",
    "observedEvidence": [
      "The stored event reports a TCP connection."
    ],
    "hypotheses": [
      {
        "text": "The activity could be reconnaissance.",
        "rationale": "The signature and event context may be consistent with probing.",
        "confidence": "uncertain"
      }
    ],
    "recommendedChecks": [
      {
        "text": "Review nearby events from the same source.",
        "type": "investigation"
      }
    ],
    "limitations": [
      "A single alert does not prove a successful compromise."
    ]
  }
}
```

**Processing requirements**

1. Validate the alert ID and retrieve the stored alert.
2. Select only the fields required for analysis.
3. Treat event fields, signatures, and log text as untrusted input.
4. Instruct the model to distinguish observed evidence from hypotheses.
5. Request structured JSON output and validate it server-side.
6. Enforce request timeouts and output-size limits.
7. Persist the analysis with its model identifier and prompt version.
8. Handle Ollama unavailability, timeouts, malformed output, and model errors without modifying the original alert.
9. Apply rate limiting and authorization before shared or production deployment.

The AI must not automatically execute investigation or remediation actions.

### 5.6. Retrieve AI Analysis

`GET /api/alerts/:id/analysis`

Return the latest analysis or a documented list of historical analyses.

Choose one consistent behavior when no analysis exists, such as returning an empty collection or `404 Not Found`, and document it in the API contract.

### 5.7. Create an Incident

`POST /api/incidents`

**Request:**

json

```
{
  "title": "Suspicious network activity",
  "description": "Initial investigation of related IDS alerts.",
  "alertIds": [
    "66f000000000000000000001"
  ],
  "severity": "MEDIUM"
}
```

**Server-managed defaults**

- `status`: `OPEN`
- `disposition`: `UNDETERMINED`
- `createdAt`: server-generated timestamp
- `updatedAt`: server-generated timestamp
- `createdBy`: authenticated actor, when authentication is implemented

Validate that all referenced alerts exist. Decide whether an alert may be linked to multiple incidents and enforce the chosen policy consistently.

### 5.8. List and Retrieve Incidents

**List incidents**

`GET /api/incidents?status=OPEN&severity=HIGH&page=1&limit=20`

**Retrieve incident details**

`GET /api/incidents/:id`

Return incident metadata and linked alert summaries. Avoid embedding unbounded raw event payloads in list responses.

Validate filters and pagination, and return a consistent response envelope.

### 5.9. Update Incident Status

`PATCH /api/incidents/:id/status`

**Request:**

json

```
{
  "status": "INVESTIGATING"
}
```

**Allowed values:** `OPEN`, `INVESTIGATING`, `RESOLVED`.

The incident service must:

1. Validate the incident ID and requested status.
2. Retrieve the current incident state.
3. Validate the requested transition against the defined workflow.
4. Apply the update.
5. Create an audit record containing the previous and new states.
6. Return the updated incident.

Use a MongoDB transaction for the incident update and audit insertion when the deployment supports transactions and the operations require atomicity.

If transactions are unavailable, implement an explicit recovery strategy and tests for partial failures. Do not assume independent database writes are atomic.

### 5.10. Add an Incident Note

`POST /api/incidents/:id/notes`

**Request:**

json

```
{
  "text": "Reviewed the source and destination event context."
}
```

- Validate the incident ID and note length.
- Record the actor and timestamp.
- Render note content as text rather than executable HTML.
- Apply the authorization policy for incident modifications.
- Record the note creation in the audit history where required.

An investigation note records an analyst's observation; it does not establish that the observation is correct.

### 5.11. Retrieve Audit History

`GET /api/incidents/:id/audit?page=1&limit=50`

Return paginated audit records for the incident.

Document whether results are ordered newest-first or oldest-first. Validate pagination parameters and enforce authorization before returning audit data.

## 6\. AI Prompt and Output Policy

The AI analysis prompt should include:

- The task: explain a network security alert for a human analyst.
- Selected alert fields, clearly delimited as untrusted data.
- Instructions to distinguish observed evidence, plausible hypotheses, and missing information.
- An explicit instruction to ignore commands or instructions embedded in event content.
- A prohibition on inventing IP addresses, ports, signatures, outcomes, or confidence levels.
- Safe investigation recommendations rather than unapproved remediation commands.
- A fixed, machine-readable output schema.

### 6.1. Proposed Output Schema

json

```
{
  "summary": "string",
  "observedEvidence": [
    "string"
  ],
  "hypotheses": [
    {
      "text": "string",
      "rationale": "string",
      "confidence": "low | uncertain | moderate"
    }
  ],
  "recommendedChecks": [
    {
      "text": "string",
      "type": "investigation"
    }
  ],
  "limitations": [
    "string"
  ]
}
```

The backend must validate every generated response regardless of the model's instructions. Valid JSON does not guarantee factual accuracy.

The frontend must clearly label the result as **AI-generated analysis** and visually distinguish evidence from hypotheses and recommendations.

## 7\. Event Ingestion and Deduplication

Implement ingestion as a bounded, record-by-record processing pipeline.

### 7.1. Processing Workflow

1. Validate the uploaded file size and encoding.
2. Read the JSONL file using a streaming or otherwise memory-bounded parser.
3. Parse each non-empty line independently.
4. Check whether `event_type === "alert"`.
5. Extract, normalize, and validate supported fields.
6. Compute an event fingerprint from stable source fields.
7. Insert or upsert the record using the agreed uniqueness strategy.
8. Track accepted, duplicate, skipped, and rejected record counts.
9. Return a bounded list of line-level errors.

### 7.2. Fingerprint Strategy

Potential fingerprint inputs include:

- Event timestamp.
- Signature identifier.
- Source and destination IP addresses.
- Source and destination ports.
- Protocol.
- Selected flow metadata, when available.

The exact fingerprint inputs and normalization rules must be documented and tested.

A fingerprint can collide when its inputs are too coarse. Not all EVE records contain every field, so missing-field behavior must be defined explicitly.

Use a database uniqueness constraint to protect against duplicate insertion during concurrent imports. Ensure the API distinguishes actual duplicate events from rejected or failed writes.

## 8\. Frontend Pages and Components

| Page | Main Components | API Dependencies |
| --- | --- | --- |
| Dashboard | Summary cards, severity and category charts, recent alerts | `/api/alerts/stats`, `/api/alerts` |
| Alert List | Filter controls, sortable table, pagination | `/api/alerts` |
| Alert Details | Event fields, raw-event disclosure, analysis action | `/api/alerts/:id` |
| AI Analysis | Summary, evidence, hypotheses, recommendations, limitations | `/api/alerts/:id/analyze`, `/api/alerts/:id/analysis` |
| Incident List | Status and severity filters, assignment, pagination | `/api/incidents` |
| Incident Details | Linked alerts, notes, status, disposition, audit timeline | `/api/incidents/:id` and related note, status, and audit endpoints |

### Frontend Implementation Requirements

- Configure the API base URL through environment configuration.
- Share TypeScript interfaces for API requests and responses.
- Handle loading, empty, validation, and server-error states.
- Render event content as text; never execute imported HTML.
- Keep backend secrets out of frontend code and browser-accessible environment variables.
- Access MongoDB and Ollama exclusively through the backend API.
- Ensure incident changes and AI analysis results are reflected in the interface after successful responses.

## 9\. Environment Configuration

Example `.env.example`:

dotenv

```
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/nightwatch
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
MAX_UPLOAD_MB=20
AI_TIMEOUT_MS=60000
```

These values are development defaults and should be adjusted following testing.

**Deployment considerations**

- If the backend runs in Docker and Ollama runs on the host, configure a reachable host address.
- If Ollama runs as another Docker Compose service, use its service name and internal port.
- Keep MongoDB and Ollama off public interfaces.
- Never commit actual credentials or production secrets.
- Validate required environment variables during backend startup.

## 10\. Error Handling

Use a consistent error response envelope across API endpoints.

**Example:**

json

```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid input.",
    "requestId": "generated-correlation-id"
  }
}
```

### 10.1. HTTP Status Codes

| Status | Usage |
| --- | --- |
| `400 Bad Request` | Invalid input, malformed query parameters, or invalid identifiers. |
| `404 Not Found` | Requested alert or incident does not exist. |
| `413 Payload Too Large` | Uploaded file exceeds the configured size limit. |
| `415 Unsupported Media Type` | Unsupported upload content type. |
| `422 Unprocessable Content` | Request is syntactically valid but fails domain validation, if adopted consistently. |
| `429 Too Many Requests` | Rate limit exceeded. |
| `500 Internal Server Error` | Unexpected server-side failure. |
| `502 Bad Gateway` | Invalid or unexpected response from an upstream AI service. |
| `503 Service Unavailable` | AI service unavailable. |
| `504 Gateway Timeout` | AI service request timed out. |

Never expose stack traces, database credentials, internal secrets, or sensitive raw logs in production error responses.

Generate a correlation ID for troubleshooting and include it in appropriate server logs and API errors.

## 11\. Security Requirements

The MVP must implement the following security controls:

- Validate and constrain all incoming data.
- Configure CORS to allow only approved frontend origins.
- Add authentication and role-based authorization before shared or production deployment.
- Derive actor identity from authenticated server context rather than client-supplied identity fields.
- Protect upload endpoints against oversized files and excessive resource consumption.
- Rate-limit AI analysis requests.
- Keep MongoDB and Ollama inaccessible from public interfaces.
- Use least-privilege database credentials and service accounts.
- Treat imported events, analyst notes, and AI-generated output as untrusted content.
- Require explicit authorization and confirmation for optional response integrations.
- Never store secrets in Git or browser-accessible environment variables.
- Apply appropriate access controls to audit records and sensitive event data.
- Avoid automatic execution of AI-generated commands or remediation actions.

Security controls must be enforced on the backend; frontend restrictions alone are insufficient.

## 12\. Testing Strategy

### 12.1. Unit Tests

- EVE parser: valid, malformed, empty, and missing-field records.
- Event normalization and fingerprint generation.
- Query parameter and request-body validation.
- AI output schema validation.
- Incident status transition rules.
- Audit record creation.
- Error mapping and handling of unavailable dependencies.

### 12.2. Integration Tests

- Upload a sanitized EVE sample file and retrieve the resulting alerts.
- Re-upload the same file and verify duplicate handling.
- Generate analysis for a stored alert using a mocked Ollama client.
- Simulate AI timeouts and malformed model output.
- Create an incident, update its status, add a note, and retrieve its audit history.
- Simulate failure during incident and audit writes.
- Verify validation and error responses for invalid identifiers and query parameters.

### 12.3. Manual Acceptance Tests

- The dashboard loads correctly with an empty database.
- Sanitized sample data is displayed correctly.
- Filtering and pagination work together.
- Invalid identifiers return controlled errors.
- AI analysis clearly separates evidence, hypotheses, and recommendations.
- Incident updates remain consistent after page refresh.
- Audit records reflect the expected state changes.
- Imported event content cannot execute as HTML or scripts.
- No action is executed automatically from AI-generated output.

## 13\. Implementation Plan

Follow the sequence below to minimize dependencies and enable parallel development.

1. **Project Setup:** Create the repository, environment configuration, linting, formatting, and backend/frontend scaffolding.
2. **Contract Definition:** Finalize shared TypeScript types, MongoDB schemas, API request/response contracts, and core design decisions.
3. **Alert Ingestion and Retrieval:** Implement EVE parsing, validation, deduplication, alert listing, details, filtering, and statistics.
4. **Dashboard Development:** Build the dashboard against the agreed alert API contracts.
5. **AI Integration:** Implement the Ollama client, versioned prompts, output validation, error handling, and analysis persistence.
6. **AI Investigation UI:** Build the analysis interface and integrate it with the backend.
7. **Incident Management:** Implement incident creation, retrieval, notes, status transitions, and audit history.
8. **Incident UI:** Integrate incident workflows with the frontend.
9. **Quality and Security:** Add integration tests, sanitized sample datasets, error-path coverage, and security checks.
10. **Deployment:** Add Docker Compose, document local setup, and evaluate AWS deployment after the local workflow is stable.

## 14\. Key Decisions Before Implementation

The following decisions should be finalized before parallel development begins:

- **Alert lifecycle:** Determine whether alerts have their own status or inherit workflow state from incidents.
- **Event deduplication:** Define fingerprint inputs, normalization, and unique-index behavior.
- **Incident relationships:** Decide whether one alert may belong to multiple incidents.
- **Audit consistency:** Choose transaction support and a recovery strategy for failed writes.
- **AI analysis history:** Define whether the API returns the latest analysis or historical results.
- **Authentication and authorization:** Define the minimum access-control model for shared deployments.
- **API conventions:** Standardize pagination, error envelopes, date-time formats, and identifier validation.

