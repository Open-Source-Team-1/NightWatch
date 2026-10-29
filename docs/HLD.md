# NightWatch — High-Level Design (HLD)

**Document Status:** Proposed design for the MVP\
**System:** AI-Assisted Intrusion Detection and Incident Investigation System

## 1\. Purpose and Scope

This document defines the high-level architecture of NightWatch, including its major components, technology stack, external dependencies, deployment options, and end-to-end data flows.

It establishes a shared architectural understanding for the three-person development team before detailed implementation begins. The document also defines the MVP scope, quality attributes, security considerations, risks, and acceptance criteria.

## 2\. Problem Statement and Objectives

Intrusion Detection Systems (IDS) identify suspicious network activity and generate alerts that often require technical expertise to investigate. Security analysts also need a structured workflow to correlate alerts, document findings, assign responsibility, and track incident status.

NightWatch aims to simplify this process by combining traditional intrusion detection with locally hosted AI-assisted analysis and incident management.

### 2.1. Project Objectives

The system will:

1. Ingest Suricata EVE JSON events from authorized monitoring environments.
2. Normalize, validate, and persist supported alert data.
3. Provide a searchable dashboard for reviewing and filtering alerts.
4. Use a locally hosted open-weight language model to explain alerts and suggest investigation steps.
5. Support incident management, investigation notes, and an audit trail of important changes.
6. Keep investigation and response decisions under explicit human control.

### 2.2. Out of Scope for the Initial MVP

The following capabilities are excluded from the initial implementation:

- Replacing or modifying Suricata's detection engine.
- Guaranteeing the correctness of AI-generated classifications or explanations.
- Autonomous containment, automatic IP blocking, or other unapproved response actions.
- Enterprise-scale SIEM/SOAR capabilities.
- Guaranteed real-time ingestion before streaming or continuous ingestion is implemented and tested.

## 3\. Stakeholders and Use Cases

**Primary users:** Cybersecurity students, laboratory operators, small IT/security teams, and security analysts.

| Use Case | Primary Actor | Expected Outcome |
| --- | --- | --- |
| Import events | Analyst / Operator | EVE events are validated, processed, and stored as alerts. |
| Review alerts | Analyst | Alerts can be searched, filtered, sorted, and paginated. |
| Investigate alerts | Analyst | AI-assisted explanations distinguish observed evidence from hypotheses and recommendations. |
| Create incidents | Analyst | One or more existing alerts can be linked to an incident. |
| Update investigations | Analyst | Incident status, notes, assignment, and disposition can be maintained. |
| Review history | Analyst / Auditor | Important changes are available through audit records. |

Authentication and authorization should be implemented before multi-user or production deployment. If these capabilities are omitted from a classroom or local MVP, the limitation must be explicitly documented.

## 4\. System Architecture

The NightWatch architecture separates network monitoring, event ingestion, application services, data persistence, AI analysis, and the user interface.

### 4.1. Architecture Diagram

mermaid

```
flowchart TB
    NET["Authorized Monitored or Test Network"]
    IDS["Suricata IDS"]
    EVE["EVE JSON Log"]
    ING["Event Ingestion and Validation"]
    API["Node.js / Express REST API"]
    DB[("MongoDB")]
    UI["Next.js + TypeScript Dashboard"]
    AI["Ollama Local Model"]
    AUD["Audit Service"]
    INC["Incident Service"]

    NET --> IDS
    IDS --> EVE
    EVE --> ING
    ING --> API

    UI <--> API
    API <--> DB
    API <--> AI
    API --> AUD
    AUD --> DB
    API --> INC
    INC --> DB
```

### 4.2. Architectural Boundaries

- **Suricata IDS:** Monitors authorized network traffic and emits detection events. It operates independently of the AI analysis process.
- **Event Ingestion:** Accepts event files, parses JSON Lines records, enforces resource limits, validates supported fields, and normalizes alert data.
- **REST API:** Acts as the application's central entry point and enforces validation, business rules, and access controls.
- **MongoDB:** Stores canonical alert records, AI analyses, incidents, and audit logs.
- **Ollama:** Hosts the selected language model locally and receives only the context required for a requested analysis.
- **Frontend:** Presents alerts, analysis results, and incident workflows through the REST API. It must not connect directly to MongoDB or Ollama.
- **Audit Service:** Records important state changes and investigation activities for traceability.

The backend is the only application layer permitted to access MongoDB and Ollama directly.

## 5\. Major System Components

### 5.1. Frontend

**Technology:** Next.js and TypeScript.

The frontend provides the analyst-facing interface for monitoring alerts, reviewing AI analysis, and managing incidents.

**Responsibilities**

- Display dashboard summary cards, charts, and recent alerts.
- Provide searchable, filterable, and paginated alert listings.
- Present alert details and relevant normalized event fields.
- Display AI-generated evidence, hypotheses, recommendations, and limitations separately.
- Provide incident lists and incident investigation workspaces.
- Support incident status, disposition, assignment, and note management.
- Handle loading, empty, validation, timeout, and server-error states.

The frontend communicates exclusively with the backend API and must never expose backend credentials or directly access internal services.

### 5.2. Backend

**Technology:** Node.js, Express, and TypeScript.

The backend implements the application's business logic, data access, AI integration, and security controls.

| Module | Responsibilities |
| --- | --- |
| Ingestion | Upload, parse, validate, normalize, and deduplicate EVE events. |
| Alerts | Retrieve alert details, apply filters, paginate results, and calculate statistics. |
| AI Analysis | Load alert data, construct constrained prompts, invoke Ollama, validate responses, and persist analysis results. |
| Incident Management | Create incidents, link alerts, manage notes and assignments, and enforce status transitions. |
| Audit | Record important changes and expose authorized audit history. |
| Shared Infrastructure | Manage configuration, logging, request validation, error handling, and database connectivity. |

The backend should use a modular structure with clear separation between routes, controllers, services, and persistence models.

### 5.3. Database

**Technology:** MongoDB with Mongoose.

The initial implementation uses four primary collections:

- `alerts` — canonical records of supported detection events.
- `ai_analyses` — AI-generated analysis results, including model and prompt version metadata.
- `incidents` — investigation records linking one or more alerts.
- `audit_logs` — records of important incident and resource changes.

AI analysis is stored separately from the original alert. This preserves the alert as the canonical record and allows analysis to be regenerated, reviewed, and versioned independently.

The database design should include appropriate indexes, schema validation, bounded document sizes, and a documented deduplication strategy.

### 5.4. Detection and AI Integration

- Suricata provides detection data through EVE JSON logs.
- Ollama exposes a local API for inference using the configured language model.
- The backend selects the model through environment configuration, for example, `qwen2.5:3b`.
- AI analysis is advisory and must be validated before persistence or display.
- AI-generated recommendations must not trigger automatic response actions.
- Model output must distinguish recorded evidence from plausible hypotheses and missing context.

The AI component supplements analyst investigation; it does not replace the detection engine or establish that a compromise has occurred.

## 6\. End-to-End Data Flows

### 6.1. Flow A — Event Ingestion

1. An operator uploads an authorized `eve.json` file.
2. The backend validates the file type, size, encoding, and JSON Lines format.
3. Each non-empty line is parsed independently.
4. Supported alert events are normalized into the NightWatch alert schema.
5. Invalid records are reported without terminating the entire import.
6. Valid records are persisted using the defined deduplication strategy.
7. The API returns counts for accepted, skipped, duplicate, and rejected records.
8. The frontend refreshes the alert list and dashboard statistics.

**Outcome:** Valid alert events become searchable records while malformed and unsupported records are handled in a controlled manner.

### 6.2. Flow B — AI-Assisted Alert Investigation

1. An analyst opens an alert and requests AI analysis.
2. The backend retrieves the authoritative alert record from MongoDB using its ID.
3. The backend constructs a constrained prompt containing only the relevant alert fields and analysis instructions.
4. Ollama generates a non-streaming response.
5. The backend validates the response schema and enforces timeout and output-size limits.
6. The result, model identifier, prompt version, timestamp, and alert reference are stored in `ai_analyses`.
7. The frontend displays the analysis as advisory content, clearly separating evidence from hypotheses and recommendations.

**Outcome:** Analysts receive structured, locally generated investigation guidance without modifying the original alert.

### 6.3. Flow C — Incident Management

1. An analyst creates an incident and links one or more existing alerts.
2. The backend validates the incident request and referenced alert IDs.
3. The incident is initialized with status `OPEN` and disposition `UNDETERMINED`.
4. An authorized user can assign the incident, add notes, and update its status.
5. The backend records important changes in the audit log.
6. The incident workspace displays the current state, linked alerts, notes, and relevant history.

**Outcome:** Related alerts and investigation activities are organized into a traceable incident workflow.

### 6.4. Flow D — Optional Response Actions

This flow is not required for the MVP.

If response integration is introduced in a future release:

1. An analyst explicitly requests a response action.
2. The backend validates authorization, target scope, and the permitted-action allow-list.
3. The interface requires explicit confirmation before execution.
4. The action executes only within an authorized environment.
5. The result, actor, and relevant metadata are recorded in the audit trail.

AI recommendations alone must never initiate or authorize a response action.

## 7\. Data Ownership and Relationships

### 7.1. Entity Relationship Diagram

mermaid

```
erDiagram
    ALERT ||--o{ AI_ANALYSIS : has
    ALERT }o--o{ INCIDENT : linked_to
    INCIDENT ||--o{ AUDIT_LOG : records
```

### 7.2. Relationship Definitions

- **Alert to AI Analysis:** One alert may have multiple analysis records, including re-analyses generated with different model or prompt versions.
- **Alert to Incident:** An incident may reference multiple alerts. An alert may belong to multiple incidents if the team permits it; otherwise, enforce a single-incident policy.
- **Incident to Audit Log:** An incident may have multiple audit entries recording important changes.
- **Actor Identity:** The `actorId` recorded in an audit entry must be derived from authenticated server context, not from an untrusted client-supplied identity field.

The backend owns all persistence operations and is responsible for enforcing the relationship and integrity rules.

## 8\. Quality Attributes and Design Approach

| Attribute | Design Approach |
| --- | --- |
| Security | Validate inputs, restrict access, protect secrets, and treat imported logs and AI output as untrusted data. |
| Reliability | Centralize error handling, bound requests, monitor database health, and handle AI timeouts gracefully. |
| Performance | Index frequently queried fields, paginate results, and enforce file-size and processing limits. |
| Maintainability | Use modular services, clear responsibilities, and shared TypeScript types and API contracts. |
| Explainability | Preserve original alert fields and distinguish observed evidence from AI-generated hypotheses. |
| Auditability | Record status, assignment, disposition, and response-related changes. |
| Privacy | Prefer local inference, minimize retained data, and restrict access to sensitive records. |
| Portability | Use environment-based configuration and support containerized deployment through Docker Compose. |

These design approaches establish the MVP's architectural priorities. Performance and reliability targets should be measured and documented during testing rather than assumed.

## 9\. Deployment Architecture

### 9.1. Local Development MVP

The initial development environment consists of:

- **Frontend:** Local Next.js development server.
- **Backend:** Local Node.js process running the Express API.
- **Database:** Local MongoDB instance or a controlled development database.
- **AI Runtime:** Local Ollama process.
- **Detection Source:** Suricata installed on an authorized lab host, or sanitized sample EVE data for development and testing.

This setup minimizes deployment complexity and allows the team to validate the complete workflow before introducing cloud infrastructure.

### 9.2. Containerized Deployment

Use Docker Compose to orchestrate the frontend, backend, and MongoDB services. Ollama may run on the host or as a separate containerized service, depending on hardware availability and resource requirements.

Deployment requirements:

- Persist MongoDB data using a managed Docker volume.
- Keep credentials and environment-specific secrets outside the repository.
- Use service names and internal networking for container-to-container communication.
- Restrict access to internal service ports.
- Configure health checks and startup dependencies where appropriate.

**Networking consideration:** When the backend runs inside a container, `localhost` refers to that container rather than the host machine. If Ollama runs on the host, configure a reachable host address. If Ollama runs in the same Compose environment, use its service name and internal port.

Do not expose the Ollama API publicly.

### 9.3. Optional AWS Deployment

AWS deployment may be evaluated after the local MVP is stable, subject to time, budget, and operational requirements.

Potential deployment components include:

- A restricted hosting environment for the dashboard and backend API.
- A suitably secured MongoDB deployment.
- A private or otherwise appropriately isolated AI inference service.
- Secure connectivity between the monitored network and the event ingestion endpoint.

The monitored network must provide Suricata with appropriate visibility into its traffic and securely deliver the resulting events to NightWatch.

Hosting the dashboard or API in AWS does not automatically grant Suricata visibility into traffic on a private network. Network placement, routing, access controls, and secure event forwarding must be designed separately.

## 10\. Risks and Mitigation Strategies

| Risk | Mitigation |
| --- | --- |
| Incorrect AI conclusions | Label results as advisory, display supporting source fields, and require human verification. |
| Prompt injection in log data | Treat imported content as untrusted data, delimit it in prompts, and never follow embedded instructions. |
| Oversized or malformed uploads | Enforce file and line limits, parse records independently, and apply request timeouts. |
| Duplicate event ingestion | Define a stable event fingerprint and enforce a consistent deduplication strategy. |
| Inconsistent incident and audit state | Use transactions where supported or implement a recoverable write strategy. |
| Sensitive data exposure | Minimize and redact sensitive data where appropriate, restrict access, and secure transport and storage. |
| Local model resource constraints | Start with a small model and bounded workloads, then measure inference latency and memory usage. |
| Unauthorized response actions | Exclude active response from the MVP or require explicit authorization, allow-listing, confirmation, and auditing. |
| Dependency failure | Handle database and AI service errors gracefully and expose actionable, non-sensitive error messages. |

## 11\. MVP Acceptance Criteria

The MVP is considered functionally complete when the following criteria are met:

- [ ] **A valid**, sanitized Suricata EVE JSON file can be uploaded successfully.
- [ ] **Supported alert** events appear in the dashboard with the expected normalized fields.
- [ ] **Alert filtering** and pagination work correctly.
- [ ] **An alert** can be analyzed using the configured local Ollama model.
- [ ] **AI analysis** is stored separately from the original alert and can be retrieved.
- [ ] **An incident** can be created and linked to existing alerts.
- [ ] **Incident notes** and status updates can be saved and retrieved.
- [ ] **Important** incident changes generate audit entries.
- [ ] **Malformed** input and AI failures produce controlled, useful errors without corrupting stored data.
- [ ] **AI-generated** evidence, hypotheses, and recommendations are clearly distinguished in the interface.
- [ ] **AI output** cannot automatically trigger response actions.
- [ ] **Setup** and configuration instructions work in a clean development environment.
- [ ] **Security** limitations, including any deferred authentication requirements, are documented.

## 12\. Implementation Priorities

The recommended implementation sequence is:

1. Establish the repository structure, local development environment, and configuration.
2. Agree on shared API contracts, data models, and validation rules.
3. Implement event ingestion, alert persistence, filtering, and dashboard APIs.
4. Build the alert dashboard and detail views.
5. Integrate Ollama with structured output validation and analysis persistence.
6. Develop the AI investigation interface.
7. Implement incident management, notes, status transitions, and audit history.
8. Add integration tests, sanitized sample data, and security checks.
9. Complete Docker Compose configuration and local setup documentation.
10. Evaluate optional AWS deployment after the core workflow is stable.

The team should treat this document as the architectural baseline for the MVP and use the corresponding Low-Level Design (LLD) to define implementation-specific schemas, endpoint contracts, module interfaces, and test cases.
