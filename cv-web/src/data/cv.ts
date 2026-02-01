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
    year: '2024–2025',
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
