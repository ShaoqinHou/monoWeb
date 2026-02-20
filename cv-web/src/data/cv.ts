export interface Project {
  id: string
  title: string
  subtitle: string
  label?: string
  year: string
  tech: string[]
  bullets: string[]
  type: 'live' | 'detail'
  embedUrl?: string
  description?: string
}

export const personalInfo = {
  name: 'Shaoqin Hou',
  phone: '0220215064',
  email: 'hphashiqi@gmail.com',
  location: 'Auckland, New Zealand',
  website: '[website]',
  github: '[GitHub]',
}

export const personalStatement =
  'Recent Computer Science graduate who spends free time exploring open source AI repositories and following frontier research across visual processing, audio generation, and neural architectures. Builds interest driven projects end to end, favouring AI assisted workflows (Claude Code, Playwright) for rapid prototyping. Drawn to systems design and architecture: how things connect, how to optimise them, and why they work.'

export const education = [
  {
    institution: 'Auckland University of Technology',
    degrees: [
      'Master of Computer and Information Sciences (December 2025)',
      'Bachelor of Computer and Information Sciences: Software Development (July 2021)',
    ],
  },
]

export const technicalSkills = [
  { category: 'Languages', items: 'Python, TypeScript, JavaScript, SQL' },
  { category: 'Frameworks', items: 'React, PyTorch, Flask, FastAPI, Tailwind CSS' },
  { category: 'AI / ML', items: 'GNN, CNN, LSTM, DNAR, Gemini API, OpenAI API' },
  {
    category: 'Preferred Workflow',
    items: 'Claude Code + VS Code + Playwright, Git, Docker, Linux/WSL',
  },
  { category: 'Database', items: 'PostgreSQL' },
]

export const languages = 'English: Fluent | Mandarin Chinese: Native'

export const interests = [
  'Regularly explores open source AI projects across visual and audio processing, from early OpenCV and YOLO to modern generative models.',
  'Drawn to games built around interconnected systems: Factorio and Satisfactory for automated production chains, Shapez for pure logistics optimisation, Rimworld for cascading social and environmental outcomes, Mini Metro for distilled network design. Analyses these systems deeply: mechanics, economy loops, progression design, and what makes them work. Built a temple runner prototype to explore this firsthand: procedural level generation and core game system design.',
]

export const projects: Project[] = [
  {
    id: 'xero-replica',
    title: 'Xero Replica',
    subtitle: 'Full-Stack Accounting SPA',
    year: '2026',
    tech: ['React', 'TypeScript', 'Hono', 'SQLite', 'Tailwind CSS', 'Claude Code'],
    bullets: [
      'Architected a monorepo (web / api / shared) replicating Xero\'s accounting platform: invoices, bills, contacts, payroll, reporting, bank reconciliation, and 15+ feature modules with shared Zod schemas enforcing identical validation on client and server',
      'Designed an AI-driven TDD workflow where Claude Code operates under seven self-correcting hooks: post-edit behavioural checks, agent team rule injection, blocking test gates on task completion, and a mandatory browser verification gate before session end',
      'Built a Playwright-based audit pipeline (/audit-xero \u2192 /audit-replica \u2192 /ux-compare) that captures live Xero\'s DOM structure, API field shapes, and combobox options, then diffs against the replica to produce a prioritised fix list',
      'Codebase reached 272 test files and 2,866 tests with parallel agent team coordination: nine feature agents each run only their own ~40 tests, while the lead agent runs the full suite once at the end \u2014 replacing what would otherwise be 9 agents x 3 runs x 2,866 tests each',
    ],
    type: 'live',
    embedUrl: import.meta.env.DEV ? 'http://localhost:5174' : '/invoice-app/',
    description:
      'A full-stack replica of Xero\'s accounting platform built as a monorepo with three packages: a React SPA frontend, a Hono API server with SQLite, and shared Zod schemas for identical validation on client and server. Features 15+ modules including invoices, bills, contacts, payroll, reporting, and bank reconciliation. Development used an AI-driven TDD workflow with Claude Code operating under self-correcting hooks and a Playwright-based audit pipeline that compares the replica against live Xero to produce prioritised fix lists.',
  },
  {
    id: 'invoice-extractor',
    title: 'Invoice Extractor',
    subtitle: 'Template-Free Document Processing',
    year: '2026',
    tech: ['React', 'TypeScript', 'Hono', 'SQLite', 'Python', 'Tesseract', 'PaddleOCR', 'LLM Tool Calling'],
    bullets: [
      'Replaced traditional template-matching extraction (which requires a fixed layout per supplier) with an LLM agentic loop: the model receives raw OCR text plus three investigation tools (page lookup, text search, context retrieval), reasons about the document\'s structure across multiple turns, then calls a structured submit_invoice tool \u2014 handling any supplier, any layout, and any content complexity without per-format configuration',
      'Handles multi-service invoices that defeat conventional parsers: a combined utilities bill with broadband charges, electricity usage (kWh rates, meter readings, billing periods), previous balance adjustments, and discounts is automatically decomposed into semantically grouped entries with consistent per-group attrs columns, ready for tabular display',
      'Built a three-tier OCR pipeline (PyMuPDF text-layer extraction \u2192 Tesseract with confidence scoring \u2192 PaddleOCR deep learning fallback) that accepts any input format \u2014 PDF with embedded text, scanned documents, and phone photos (HEIC/JPG) \u2014 with automatic quality assessment and cross-referencing between tiers to catch OCR errors before they reach the LLM',
      'Designed the pipeline as persistent Python workers communicating via NDJSON over stdin/stdout, with semaphore-based concurrency control and idle auto-shutdown, feeding into a two-page review UI where extracted data is prefetched into the query cache so fields appear instantly when the user clicks an invoice',
    ],
    type: 'live',
    embedUrl: import.meta.env.DEV ? 'http://localhost:5175' : '/invoice-extractor/',
    description:
      'A template-free invoice extraction system that uses an LLM agentic loop instead of traditional per-supplier template matching. The model receives raw OCR text and three investigation tools, reasons about document structure across multiple turns, then submits structured data. Features a three-tier OCR pipeline (PyMuPDF, Tesseract, PaddleOCR) accepting any input format. Note: currently uses GLM-5 as the LLM provider, which runs at roughly 14 tokens/sec \u2014 so even a simple text document may take about a minute to process. Switching to a faster provider would dramatically improve speed.',
  },
  {
    id: 'dnar',
    title: 'DNAR-A*',
    subtitle: 'Neural Pathfinding Framework',
    label: "Master's Dissertation",
    year: '2025',
    tech: ['Python', 'PyTorch', 'NumPy', 'NetworkX'],
    bullets: [
      'Trained Graph Neural Networks to learn and execute A* pathfinding on grid environments',
      'Implemented Message Passing Neural Network with attention mechanisms for step by step algorithmic execution',
      'Achieved ~98% node level pointer accuracy with strong generalisation across grid sizes and obstacle densities',
    ],
    type: 'detail',
    description:
      'Redesigned the DNAR framework to train Graph Neural Networks that learn to execute the A* pathfinding algorithm step by step on grid environments. The model uses a Message Passing Neural Network with attention mechanisms, trained to predict algorithmic execution traces. It generalises across different grid sizes and obstacle densities, achieving ~98% node level pointer accuracy. This was the core of the Master\'s dissertation at AUT.',
  },
  {
    id: 'pdf-ai',
    title: 'PDF AI Assistant',
    subtitle: 'Intelligent Document Editor',
    year: '2025',
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'Gemini API'],
    bullets: [
      'Integrated Gemini function calling as an autonomous task planner: AI receives five tools (list, delete, merge, extract, insert) and executes them in a multi turn loop',
      'Fully client side: all PDF processing runs in browser with no server uploads, plus drag and drop page reordering and workspace assembly',
    ],
    type: 'live',
    embedUrl: import.meta.env.DEV ? 'http://localhost:3001' : '/pdf-ai-assistant/',
    description:
      'A client side PDF manipulation tool with an AI powered natural language interface. The AI acts as an autonomous task planner: it receives five declared tools (listFiles, deletePages, mergePages, extractPages, insertPages) and executes them in a multi turn loop. A command like "Combine pages 1-2 of Report A with page 3 of Report B, then remove the last page of Report C" chains merge and extract operations, producing new files autonomously. All PDF processing runs entirely in the browser with no server uploads. Includes drag and drop page reordering, cross file workspace assembly, and real time thumbnail rendering.',
  },
  {
    id: 'power-plan',
    title: 'Power Plan AI Comparator',
    subtitle: 'Energy Cost Calculator',
    year: '2025',
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'Gemini API'],
    bullets: [
      'Paste text or a screenshot of any power plan and AI automatically extracts rates, free hour periods, joining credits, and discount rules into structured data',
      'Describe your lifestyle (e.g. "I charge my EV overnight") and AI generates a matching hourly usage profile',
      'Interactive graph with hour by hour cost calculation across weekday/weekend schedules, colour coded by peak, off peak, and free zones',
    ],
    type: 'live',
    embedUrl: import.meta.env.DEV ? 'http://localhost:3000' : '/power-plan-ai-comparator/',
    description:
      'An AI powered electricity plan comparison tool for the NZ energy market. Users draw their hourly usage on an interactive graph and instantly compare costs across 15+ real provider plans. Paste text or a screenshot of any power plan and Gemini AI extracts all the details automatically: time of use rates, free hour periods, joining credits, and discount rules. Describe your lifestyle (e.g. "I work from home" or "I charge my EV overnight") and the AI generates a matching usage profile. Features hour by hour rate matching across weekday/weekend schedules with realistic 30 day billing cycles, and graph bars colour coded to peak, off peak, and free zones in real time.',
  },
  {
    id: 'notepiece',
    title: 'NotePiece',
    subtitle: 'Browser Based Music Sequencer',
    year: '2024\u20132025',
    tech: ['React', 'TypeScript', 'Web Audio API'],
    bullets: [
      'Built audio synthesis engine using Web Audio API with polyphonic voice management',
      'Implemented sample accurate timing for playback independent of the main JavaScript thread',
      'Interactive piano roll interface with drag and drop note placement and real time visualization',
    ],
    type: 'detail',
    description:
      'A browser based music sequencer built entirely with the Web Audio API. Features a custom audio synthesis engine with polyphonic voice management, sample accurate timing that runs independent of the main JavaScript thread, and an interactive piano roll interface with drag and drop note placement and real time audio visualization.',
  },
  {
    id: 'gov-data',
    title: 'Government Data Acquisition & Analysis Platform',
    subtitle: '',
    year: '2024',
    tech: ['Python', 'Flask', 'Playwright', 'OpenAI API'],
    bullets: [
      'Built a scraping system with a web dashboard where operators solve CAPTCHAs in real time as the scraper encounters them',
      'Automatically extracts article content from any news website by analysing page structure',
      'Processes articles through LLM pipeline to produce structured data, with automatic retry and model rotation on failure',
    ],
    type: 'detail',
    description:
      'A human in the loop web scraping and analysis platform. Features a real time web dashboard where operators solve CAPTCHAs as the scraper encounters them. Automatically extracts article content from any news website by analysing page structure. Processes extracted articles through an LLM pipeline to produce structured data, with automatic retry and model rotation on failure.',
  },
  {
    id: 'sheep',
    title: 'Sheep Identification System',
    subtitle: '',
    label: "Bachelor's Final Year Project",
    year: '2021',
    tech: ['Python', 'YOLO', 'Raspberry Pi'],
    bullets: [
      'Built automated visual counting system for sheep using object detection with a single fixed camera',
      'Deployed YOLO model on Raspberry Pi for real time edge inference',
    ],
    type: 'detail',
    description:
      'Developed an automated visual counting system for sheep on farms using object detection with a single fixed camera input. The YOLO model was deployed on a Raspberry Pi for real time edge inference, designed for practical farm use.',
  },
]
