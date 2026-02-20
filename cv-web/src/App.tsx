import { useState, useEffect } from 'react'
import {
  personalInfo,
  personalStatement,
  education,
  technicalSkills,
  languages,
  interests,
  projects,
  type Project,
} from './data/cv'

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const openProject = (project: Project) => {
    setSelectedProject(project)
    requestAnimationFrame(() => setIsVisible(true))
    document.body.style.overflow = 'hidden'
  }

  const closeProject = () => {
    if (isClosing) return
    setIsClosing(true)
    setIsVisible(false)
    setTimeout(() => {
      setSelectedProject(null)
      setIsClosing(false)
      document.body.style.overflow = ''
    }, 300)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProject) closeProject()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedProject])

  return (
    <div className="min-h-screen">
      {/* Main CV Page */}
      <div className="max-w-[800px] mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-100">{personalInfo.name}</h1>
          <p className="text-sm text-slate-400">
            {personalInfo.phone} · {personalInfo.email} · {personalInfo.location}
          </p>
        </header>

        {/* Personal Statement */}
        <Section title="Personal Statement">
          <p className="text-[15px] leading-relaxed text-slate-300">{personalStatement}</p>
        </Section>

        {/* Education */}
        <Section title="Education">
          {education.map((edu) => (
            <div key={edu.institution}>
              <p className="font-semibold text-[15px] text-slate-200">{edu.institution}</p>
              {edu.degrees.map((deg) => (
                <p key={deg} className="text-[15px] text-slate-300 ml-4">
                  {deg}
                </p>
              ))}
            </div>
          ))}
        </Section>

        {/* Interests */}
        <Section title="Interests">
          {interests.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-slate-300 mb-2 last:mb-0">
              {paragraph}
            </p>
          ))}
        </Section>

        {/* Projects */}
        <Section title="Projects">
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} id={`project-${project.id}`} className="scroll-mt-6">
                <ProjectCard project={project} onClick={() => openProject(project)} />
              </div>
            ))}
          </div>
        </Section>

        {/* Technical Skills */}
        <Section title="Technical Skills">
          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            {technicalSkills.map((skill) => (
              <div key={skill.category} className="contents">
                <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
                  {skill.category}
                </span>
                <span className="text-[15px] text-slate-300">{skill.items}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Languages */}
        <Section title="Languages">
          <p className="text-[15px] text-slate-300">{languages}</p>
        </Section>

        {/* Application Note */}
        <Section title="Application Note">
          <div className="text-[15px] leading-relaxed text-slate-300 space-y-4">
            <p>
              This is my first job application. I graduated last year with no prior work experience, but what I do bring is genuine, self-driven engagement with the field. Every project on this page exists because I wanted to build it, not because it was assigned. I'm applying because the requirements align closely with what I already spend my time on, and the remote fixed-term format is a realistic entry point for someone in my position.
            </p>
            <p>
              My AI experience spans two directions. On the integration side, I build applications where LLMs operate as autonomous agents with tool calling: the{' '}
              <ProjectLink id="invoice-extractor">Invoice Extractor</ProjectLink> uses an agentic loop with investigation tools and structured submission;{' '}
              the <ProjectLink id="pdf-ai">PDF AI Assistant</ProjectLink> gives Gemini five declared tools and lets it plan multi-step document operations;{' '}
              the <ProjectLink id="power-plan">Power Plan AI Comparator</ProjectLink> extracts structured rate data from screenshots via function calling.
              On the deep learning side, my{' '}
              <ProjectLink id="dnar">Master's dissertation</ProjectLink> trained Graph Neural Networks with attention-based message passing to learn A* pathfinding — enough to understand training pipelines, model architecture, and generalisation, and enough to adapt to different domains.
            </p>
            <p>
              On the development workflow side, I use Claude Code extensively — to the point of hitting 90% of my Claude Max (400 NZD) plan's weekly limit by day five, across four concurrent projects. But I want to be clear about what that means: the{' '}
              <ProjectLink id="xero-replica">Xero Replica</ProjectLink> demonstrates the methodology. It reached roughly 90% of its current state from about an hour of initial research, exploration, and test setup — then ran for seven hours straight with no human in the loop. It operates under seven self-correcting hooks, enforces TDD with blocking test gates, and uses a Playwright audit pipeline that compares output against the real product. The codebase has 2,866 tests across 272 files. That's not "vibe coding" — it's using AI as a disciplined engineering multiplier. I started that project this week.
            </p>
            <p>
              On a personal note: I have genuinely poor memory for procedural and contextual details. A project I haven't touched for three or four days — I'll forget the directory structure, the file layout, sometimes even which language-specific patterns I used. Concepts like shallow versus deep copy, I understand fully, but which syntax in which language? I'd have to look it up. What I do retain is algorithmic and architectural knowledge: pathfinding algorithms, which neural architecture fits which problem, trade-offs between approaches. And what I lack in recall I compensate for in pickup speed — I can re-orient in an unfamiliar codebase or learn a new tool quickly, which is partly why AI-assisted workflows suit me well.
            </p>
            <p>
              I've always worked alone. Not by strong preference — I just haven't had the opportunity for meaningful collaboration. University group work at AUT was shallow in my experience; most people were pleasant but not particularly invested in the work itself. I'm genuinely eager to try working in a team where people actually care about what they're building.
            </p>
            <p>
              I'm aware that the current job market isn't favourable for new graduates, and I won't pretend I have a strong external incentive pushing me to apply broadly. I'm driven by interest in the work itself, and this role is the first listing where the requirements genuinely match what I already do. I'd rather wait for the right fit than take something I'm not engaged with.
            </p>
          </div>
        </Section>

        {/* Development Workflow */}
        <Section title="Development Workflow">
          <div className="text-[15px] leading-relaxed text-slate-300 space-y-4">
            <p>
              <span className="font-semibold text-slate-200">Fast prototyping, then TDD.</span>{' '}
              To set expectations: the <ProjectLink id="xero-replica">Xero Replica</ProjectLink> reached roughly 90% of its current state from about an hour of back-and-forth research, exploration, and test setup — followed by seven hours of fully autonomous agent execution with no human input. That's the speed this workflow enables. But speed without structure produces chaos. Just giving an AI agent a brief goal is not enough. Without a detailed architecture design up front, it will pick arbitrary — sometimes mixed — approaches for no reason. This was significantly worse with earlier models in early 2025, and while later models are better, the problem hasn't disappeared. Equally important are detailed requirements: if you describe 100 features loosely, the AI might deliver 20 and interpret the rest differently from what you intended. The architecture document and feature specification exist to constrain the AI toward your actual goal before any code is written.
            </p>
            <p>
              <span className="font-semibold text-slate-200">AI-assisted test writing.</span>{' '}
              TDD wasn't invented for LLMs, but it fits the agentic workflow remarkably well. I never particularly enjoyed writing tests ahead of implementation myself — the mocking, the setup, the upfront cost that rarely felt rewarding in the moment. But with AI, that changes. The key is that you can't just ask the agent to "write tests" — it won't produce much of value. What you need is a clear test-writing workflow document loaded alongside the project requirements and architecture specification. Even a rough early-stage workflow is enough for the AI to start producing a meaningful volume of tests, and the quality improves as the workflow matures.
            </p>
            <p>
              <span className="font-semibold text-slate-200">Verification beyond tests.</span>{' '}
              Unit tests, integration tests, end-to-end tests — they're necessary but not sufficient, because AI-written tests carry their own blind spots. A lot of oversight gets baked in. That's why it's important to trial the workflow on a small feature first, identify where the AI's tests miss things, and reinforce the workflow before scaling up. The final verification layer is the most critical: giving the LLM tools to check its own output against reality. In the{' '}
              <ProjectLink id="xero-replica">Xero Replica</ProjectLink>, the real Xero application is always available for the AI to explore via Playwright — it can capture DOM structure, API field shapes, and combobox options, then diff against its own replica. The core idea is: always make sure the LLM has enough tools to verify its own results.
            </p>
            <p>
              <span className="font-semibold text-slate-200">Six months of iteration.</span>{' '}
              I've been using this type of workflow for a little over half a year. My workflow itself hasn't changed much — the improvements come from the tooling side. Model quality keeps improving. Around October, MCP and the skill system both received significant upgrades — improved tool use, better code execution, more reliable dynamic discovery. Agent teams were introduced more recently and are substantially better than the previous sub-agent system for this kind of coordinated development, despite some drawbacks. The broader trend is that these tools are adapting themselves to users, not just the other way around. More people with less LLM-specific programming experience can use them effectively now.
            </p>
            <p>
              <span className="font-semibold text-slate-200">Customisation and trust trade-offs.</span>{' '}
              Claude Code out of the box is not nearly as useful as it is with a proper setup. The customisation itself is straightforward — rules, hooks, workflow documents, skill definitions — but it's hard to replicate across different projects because each one uses different architectures, testing strategies, and tool chains. The workflow also isn't fully rigid: you can set rules and hooks to constrain the agent, but it can sometimes find loopholes. If a skill document says the agent cannot use a certain tool, the agent might read the skill file and work around the restriction since it isn't hard-coded. These workflows really need to be maintained by the person who set them up.
            </p>
            <p>
              A concrete example of the trust trade-off: most of the time you grant the AI full read/write access to your project directory — it saves enormous time and is usually intended. But the AI can surprise you. It's smart enough to add <code className="text-slate-200 bg-slate-700/60 px-1.5 py-0.5 rounded text-[13px]">.env</code> to <code className="text-slate-200 bg-slate-700/60 px-1.5 py-0.5 rounded text-[13px]">.gitignore</code>, but if it encounters an API key while implementing a service, it might decide that key is "worth remembering" and store a copy in its local memory file (<code className="text-slate-200 bg-slate-700/60 px-1.5 py-0.5 rounded text-[13px]">.claude/</code> directory). If you sync that directory via GitHub to keep your workflow consistent across workspaces — which is a reasonable thing to do — you've just leaked your keys. Not because the key was in your code, but because the LLM decided to memorise it. That's how some API keys get leaked accidentally, and it's the kind of edge case you only learn about by using these tools seriously.
            </p>
          </div>
        </Section>
      </div>

      {/* Project Takeover */}
      {selectedProject && (
        <div
          className={`fixed inset-0 z-50 bg-slate-900 transition-all duration-300 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <ProjectDetailView project={selectedProject} onClose={closeProject} />
        </div>
      )}
    </div>
  )
}

function ProjectLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a
      href={`#project-${id}`}
      className="text-accent hover:text-accent/80 underline underline-offset-2 decoration-accent/40 hover:decoration-accent/70 transition-colors"
      onClick={(e) => {
        e.preventDefault()
        document.getElementById(`project-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }}
    >
      {children}
    </a>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 border-b border-accent/20 pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const isLive = project.type === 'live'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left group cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
        isLive
          ? 'border-blue-700/50 bg-blue-950/40 hover:border-blue-500 hover:bg-blue-950/60 shadow-sm'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-600 shadow-sm'
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-[15px] text-slate-100 group-hover:text-accent transition-colors">
            {project.title}
            {project.subtitle && (
              <span className="text-slate-400">: {project.subtitle}</span>
            )}
          </h3>
          {project.label && (
            <span className="text-[11px] text-slate-500 font-medium">{project.label}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full group-hover:bg-emerald-500/30 transition-colors">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              Click to Try
            </span>
          )}
          <span className="text-[13px] text-slate-500">{project.year}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {project.tech.map((t) => (
          <span key={t} className="text-[11px] text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded">
            {t}
          </span>
        ))}
      </div>
      <ul className="space-y-1">
        {project.bullets.map((bullet, i) => (
          <li key={i} className="text-[13px] text-slate-400 leading-snug pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-slate-600">
            {bullet}
          </li>
        ))}
      </ul>
    </button>
  )
}

function ProjectDetailView({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="flex items-center gap-2 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-lg"
        >
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4L6 10L12 16" />
          </svg>
          Back to CV
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-100">
            {project.title}
            {project.subtitle && <span className="text-slate-400">: {project.subtitle}</span>}
          </h2>
          {project.type === 'live' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="w-20" />
      </div>

      {/* Content */}
      {project.type === 'live' ? (
        <div className="flex-1 relative">
          <iframe
            src={project.embedUrl}
            className="w-full h-full border-0"
            title={project.title}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[700px] mx-auto px-6 py-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1 text-slate-100">
                {project.title}
                {project.subtitle && (
                  <span className="text-slate-400">: {project.subtitle}</span>
                )}
              </h1>
              {project.label && (
                <p className="text-sm text-slate-500">{project.label}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">{project.year}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {project.tech.map((t) => (
                <span key={t} className="text-xs text-slate-300 bg-slate-700/60 border border-slate-600 px-3 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>

            {project.description && (
              <div className="mb-8">
                <p className="text-[15px] leading-relaxed text-slate-300">{project.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Key Points
              </h3>
              <ul className="space-y-2">
                {project.bullets.map((bullet, i) => (
                  <li key={i} className="text-[15px] text-slate-300 leading-relaxed pl-4 relative before:content-['·'] before:absolute before:left-0 before:text-slate-500 before:font-bold">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
