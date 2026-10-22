# Claude Migration Assistant

A browser-based tool for migrating your Claude data from one account to another (e.g., Team to Enterprise, or personal to work). Processes everything client-side -- no data leaves your machine.

## What It Does

When you switch Claude accounts, you lose your conversation history, memory, projects, and artifacts. This tool helps you:

1. **Process your data export** -- Parses the native Claude export (ZIP or admin JSON), extracts conversations, artifacts, and generates migration documents
2. **Capture memory** -- Guides you through exporting Claude's memory of you from the old account
3. **Recreate projects** -- Helps transfer project custom instructions and knowledge documents
4. **Validate the migration** -- Provides prompts to verify everything transferred correctly

## Two Export Modes

### Personal Export
For individual users. Go to Claude Settings > Privacy > Export Data, download the ZIP, and drop it into the tool.

### Admin Team Export
For team admins closing an account. The admin export produces a folder of JSON files (`conversations.json`, `users.json`, `memories.json`, `projects.json`) covering all team members. The tool lets you:
- Upload all JSON files at once
- Pick a specific team member from a user list
- Auto-populate their memory and projects from the admin data (skipping the manual prompt steps)

## Getting Started

No build step, no dependencies to install. Just serve the files:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .

# Or any static file server
```

Then open http://localhost:8000 in your browser.

## How It Works

The app walks you through 10 steps in two tracks:

**Track A (Automated)** -- processes the export file client-side:
- A1: Choose export type and run the data export
- A2: Upload and process the export (ZIP or admin JSON files)
- A3: Review the auto-generated context document
- A4: Review and mark important artifacts

**Track B (Manual)** -- guides you through prompt-based migration:
- B1: Capture Claude's memory from the old account
- B2: Capture project blueprints from the old account
- B3: Restore memory in the new account
- B4: Recreate projects in the new account
- B5: Upload critical artifacts
- B6: Validate the migration

In admin mode, steps B1 and B2 are auto-populated from the export data.

## What Transfers

| Data | Fidelity | Method |
|---|---|---|
| Conversation text | Exact copy (read-only archive) | Parsed from export JSON, incl. thinking, tool calls/results, citations, attachment text |
| Artifact source code | Exact copy (as files), every version | Replays artifact create/update/rewrite and file-tool edits |
| Memory (synthesized) | Exact when `memories.json` is present | Auto from export (personal or admin); prompt-based capture otherwise |
| Project memory | Exact when present | From `memories.json` `project_memories` |
| Project instructions + knowledge docs | Exact | From `projects.json` (personal or admin) |
| Raw export data | Lossless | Original JSON copied to `raw/` in the package |
| Binary uploads (images/PDFs) | Not available | Claude exports contain only extracted text and filenames |

## Architecture

Static single-page app with no server component:

```
index.html              # Shell with CSP + SRI-pinned CDN deps (JSZip, Marked, DOMPurify, Lucide, FileSaver)
css/
  variables.css         # Design tokens
  layout.css            # App shell layout
  components.css        # UI component styles
js/
  app.js                # Entry point, session management
  state.js              # Reactive state with localStorage persistence
  utils.js              # Shared utilities
  data/
    step-definitions.js # Step metadata
    prompts.js          # Copy-paste prompts for manual steps
  processing/
    zip-reader.js       # Reads personal export ZIPs (conversations/projects/memories/users)
    admin-reader.js     # Reads admin export JSON files
    conversation-parser.js
    artifact-extractor.js
    context-generator.js
    memory-generator.js
    markdown-formatter.js
    zip-writer.js       # Builds migration package ZIP
  ui/
    sidebar.js          # Step navigation
    step-renderer.js    # Dynamic step loading
    components/         # Reusable UI components
    steps/              # One module per step (step-a1.js .. step-b6.js)
```

## Privacy & Security

All processing happens in your browser. The app:
- Does not make any network requests beyond loading pinned CDN libraries. A Content-Security-Policy
  (`connect-src 'none'`) enforces this, and every CDN script is pinned to an exact version with
  Subresource Integrity hashes.
- Renders export-derived Markdown only through DOMPurify (falls back to plain text if it fails to load)
- Sanitizes every file and folder name written to the migration package (no `../` path traversal)
- Stores step progress in localStorage. This includes your **edited context document** (step A3)
  and **memory capture text** (step B1), so use **Reset** when finished on a shared machine.
  Session export files contain the same data -- treat them as sensitive.
- In admin mode, the package's `raw/` folder contains only the selected user's records

## License

MIT
