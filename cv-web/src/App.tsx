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
          <h1 className="text-3xl font-bold tracking-tight mb-2">{personalInfo.name}</h1>
          <p className="text-sm text-gray-500">
            {personalInfo.phone} · {personalInfo.email} · {personalInfo.location}
          </p>
        </header>

        {/* Personal Statement */}
        <Section title="Personal Statement">
          <p className="text-[15px] leading-relaxed text-gray-800">{personalStatement}</p>
        </Section>

        {/* Education */}
        <Section title="Education">
          {education.map((edu) => (
            <div key={edu.institution}>
              <p className="font-semibold text-[15px]">{edu.institution}</p>
              {edu.degrees.map((deg) => (
                <p key={deg} className="text-[15px] text-gray-800 ml-4">
                  {deg}
                </p>
              ))}
            </div>
          ))}
        </Section>

        {/* Technical Skills */}
        <Section title="Technical Skills">
          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            {technicalSkills.map((skill) => (
              <div key={skill.category} className="contents">
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  {skill.category}
                </span>
                <span className="text-[15px] text-gray-800">{skill.items}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Languages */}
        <Section title="Languages">
          <p className="text-[15px] text-gray-800">{languages}</p>
        </Section>

        {/* Interests */}
        <Section title="Interests">
          {interests.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-gray-800 mb-2 last:mb-0">
              {paragraph}
            </p>
          ))}
        </Section>

        {/* Projects */}
        <Section title="Projects">
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => openProject(project)} />
            ))}
          </div>
        </Section>
      </div>

      {/* Project Takeover */}
      {selectedProject && (
        <div
          className={`fixed inset-0 z-50 bg-[#f9fafb] transition-all duration-300 ease-out ${
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
          ? 'border-blue-200 bg-blue-50/60 hover:border-blue-400 hover:bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-[15px] text-gray-900 group-hover:text-accent transition-colors">
            {project.title}
            {project.subtitle && (
              <span className="text-gray-600">: {project.subtitle}</span>
            )}
          </h3>
          {project.label && (
            <span className="text-[11px] text-gray-500 font-medium">{project.label}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Try it live
            </span>
          )}
          <span className="text-[13px] text-gray-500">{project.year}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {project.tech.map((t) => (
          <span key={t} className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            {t}
          </span>
        ))}
      </div>
      <ul className="space-y-1">
        {project.bullets.map((bullet, i) => (
          <li key={i} className="text-[13px] text-gray-700 leading-snug pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-gray-400">
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4L6 10L12 16" />
          </svg>
          Back to CV
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {project.title}
            {project.subtitle && <span className="text-gray-600">: {project.subtitle}</span>}
          </h2>
          {project.type === 'live' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
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
              <h1 className="text-2xl font-bold mb-1 text-gray-900">
                {project.title}
                {project.subtitle && (
                  <span className="text-gray-500">: {project.subtitle}</span>
                )}
              </h1>
              {project.label && (
                <p className="text-sm text-gray-500">{project.label}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{project.year}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {project.tech.map((t) => (
                <span key={t} className="text-xs text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>

            {project.description && (
              <div className="mb-8">
                <p className="text-[15px] leading-relaxed text-gray-800">{project.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Key Points
              </h3>
              <ul className="space-y-2">
                {project.bullets.map((bullet, i) => (
                  <li key={i} className="text-[15px] text-gray-800 leading-relaxed pl-4 relative before:content-['·'] before:absolute before:left-0 before:text-gray-400 before:font-bold">
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
