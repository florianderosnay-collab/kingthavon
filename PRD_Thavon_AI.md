# Product Requirements Document (PRD): Thavon AI

## 1. Executive Summary
Thavon is an AI-powered voice receptionist and outbound lead management SaaS specifically designed for the real estate industry. It provides real estate agents and agencies with a high-performance, low-latency AI agent that can handle inbound inquiries 24/7, qualify leads, book appointments, and manage outbound FSBO (For Sale By Owner) campaigns.

## 2. Product Vision
To revolutionize real estate communication by providing an AI assistant that sounds human, responds instantly, and integrates deeply with real estate workflows, ensuring no lead ever goes unanswered.

## 3. Core Features & Functional Requirements

### 3.1 AI Voice Receptionist (Inbound)
- **Transient Assistant Architecture**: Server-side dynamic configuration generation for every call to ensure zero-state overhead and maximum flexibility.
- **Low-Latency Pipeline**: Optimized stack (Deepgram Nova-3, GPT-4o-mini, ElevenLabs Turbo v2.5) achieving sub-300ms response times.
- **Smart Endpointing**: Integration with LiveKit for natural turn-taking and interruptions.
- **Dynamic Greeting**: Real-time script updates via the dashboard that reflect on the next call.
- **Priority-Based Conversational Flow**:
    - **P0**: Stop signals / Removal requests.
    - **P1**: Objection handling (e.g., "I have an agent").
    - **P2**: Qualification (one question at a time).
    - **P3**: Appointment booking & availability checks.

### 3.2 Lead Management & FSBO Outbound
- **Lead Dashboard**: Centralized view for managing prospects.
- **CSV Data Import**: Bulk upload capability for For Sale By Owner (FSBO) lists.
- **Click-to-Call**: Direct dashboard-initiated outbound calls to leads.
- **Status Tracking**: Automated status updates (New, Calling, Contacted, Qualified, etc.).
- **Last Call Logging**: Precise tracking of when a lead was last contacted.

### 3.3 Agent Dashboard
- **Overview Metrics**: Call volume, success rates, and active campaigns.
- **Script Editor**: Interface to modify "Opening Lines" and "Qualification Questions."
- **Call History**: Detailed table of recent calls with status, duration, and metadata.
- **Test Call Dialog**: Ability to trigger a test call to a specific phone number to verify script changes.

### 3.4 Automated Post-Call Workflows
- **Call Logging**: Automatic storage of transcripts, duration, and summaries in the database.
- **Email Summaries**: Instant email notifications via Resend containing call transcript and AI-generated summary.
- **Structured Analytics**: Extraction of caller intent, objections, and qualification status.

## 4. Technical Architecture

### 4.1 Technology Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide React icons.
- **Backend**: Next.js API Routes (Serverless-first approach).
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: Clerk.
- **Voice Stack**:
    - **STT**: Deepgram (Nova-3).
    - **LLM**: OpenAI (GPT-4o-mini).
    - **TTS**: ElevenLabs (Turbo v2.5).
    - **Platform**: Vapi for call orchestration.
- **Notifications**: Resend.

### 4.2 Data Models
- **Organization**: Stores agency settings, phone configurations, and pricing plans.
- **Lead**: Manages individual prospect data, contact information, and interaction history.
- **CallLog**: Records every interaction, including duration, summary, and full transcripts.

## 5. Non-Functional Requirements
- **Latency**: Sub-300ms voice pipeline response.
- **Scalability**: Designed to handle hundreds of concurrent calls via Vapi's infrastructure.
- **Reliability**: Serverless dynamic configuration ensures high availability.
- **Security**: Secured API endpoints and Clerk-authenticated dashboard access.

## 6. Development Roadmap (Completed Tasks)
- [x] Initial Dashboard UI (Next.js + Tailwind).
- [x] Clerk Authentication integration.
- [x] Vapi Inbound Webhook (Server-first transient architecture).
- [x] Database Schema Design (Prisma + Postgres).
- [x] Voice Pipeline Optimization (Nova-3, GPT-4o-mini, Turbo v2.5).
- [x] Lead Management Module (CSV Import + Dashboard UI).
- [x] Automated Post-Call Email Notifications.
- [x] Refined Call Logging & Analytics.
