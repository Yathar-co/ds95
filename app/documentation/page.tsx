import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./documentation.module.css";

export const metadata: Metadata = {
  title: "Complete Product Guide | DS95",
  description: "The complete guide to generating a personal syllabus, learning, building, tracking progress and shipping projects with DS95.",
};

const sections = [
  ["start", "Getting started"], ["mission", "Mission dashboard"], ["today", "Today & focus mode"],
  ["syllabus", "Syllabus"], ["lab", "DataSprint Lab"], ["projects", "Projects & badges"],
  ["analytics", "Progress & backups"], ["data", "Accounts & data"], ["mobile", "Mobile & accessibility"],
  ["troubleshooting", "Troubleshooting"],
] as const;

const features = [
  ["95", "guided days", "A personal path from your current level to one concrete outcome."],
  ["40", "AI subtopics", "Eight progressive modules generated for each learner and goal."],
  ["24", "IDE languages", "Local runtimes, sandboxed previews and isolated compilers."],
  ["3", "personal projects", "Goal-specific proof-of-learning projects with measurable milestones."],
];

export default function DocumentationPage() {
  return <main className={styles.docs}>
    <header className={styles.topbar}><Link href="/" className={styles.brand}>DS<span>95</span></Link><nav aria-label="Documentation actions"><a href="#contents">Contents</a><a className={styles.downloadSmall} href="/docs/datasprint95-complete-guide.pdf" download>Download PDF ↓</a><Link className={styles.openApp} href="/">Open DS95 →</Link></nav></header>

    <section className={styles.hero}>
      <div><span className={styles.eyebrow}>DS95 · COMPLETE PRODUCT MANUAL</span><h1>Choose the goal.<br/><strong>Build the path.</strong></h1><p>A detailed guide to AI roadmap generation, learning, coding, projects, progress and account security in DS95.</p><div className={styles.heroActions}><a className={styles.primary} href="/docs/datasprint95-complete-guide.pdf" download>Download the complete PDF <span>↓</span></a><a className={styles.secondary} href="#start">Read online <span>↘</span></a></div></div>
      <div className={styles.coverSignal} aria-hidden="true"><span>PRODUCT GUIDE</span><b>95</b><i/><small>LEARN · BUILD · MEASURE · SHIP</small></div>
    </section>

    <section className={styles.featureStrip} aria-label="Product overview">{features.map(([value,label,text])=><article key={label}><b>{value}</b><span>{label}</span><p>{text}</p></article>)}</section>

    <div className={styles.layout}>
      <aside id="contents" className={styles.toc}><span>ON THIS PAGE</span>{sections.map(([id,label],index)=><a key={id} href={`#${id}`}><i>{String(index+1).padStart(2,"0")}</i>{label}</a>)}<div><b>Offline copy</b><p>The PDF contains the full guide, screenshots, quick reference and troubleshooting notes.</p><a href="/docs/datasprint95-complete-guide.pdf" download>Download PDF ↓</a></div></aside>

      <article className={styles.manual}>
        <section id="start" className={styles.section}><Chapter number="01" label="Access & setup" title="Getting started" lead="Create one secure account, define the outcome you want and let AI build a personal 95-day learning system."/>
          <div className={styles.steps}><Step n="1" title="Create an account">Choose <b>Create account</b>, enter your name, email and a password of at least eight characters. Follow the email-verification link when required.</Step><Step n="2" title="Define your outcome">Enter the subject, what you want to make or achieve and your current experience. Specific outcomes produce stronger modules and projects.</Step><Step n="3" title="Generate your path">Choose your start date and daily target. DS95 researches direct GeeksforGeeks resources and creates 8 modules, 40 subtopics, 95 days and 3 projects.</Step></div>
          <Callout title="A true zero-progress start">A newly created account begins at 0% with no inherited tasks, project milestones, workspace files or activity. Every account maintains its own independent state.</Callout>
        </section>

        <section id="mission" className={styles.section}><Chapter number="02" label="Command center" title="Mission dashboard" lead="The dashboard converts your 95-day plan into a clear daily signal: what is done, what is next and whether your pace needs attention."/>
          <Figure src="/docs/images/dashboard.png" alt="DataSprint 95 mission dashboard showing overall completion, active days and current day" caption="Mission dashboard - overall completion, day position, active days and next action at a glance." priority/>
          <FeatureGrid items={[["95-day signal","Required curriculum completion, active days and total completed tasks."],["Pace notice","Compares actual completion with the expected percentage for the current day."],["Current mission","Shows today’s topic, course, estimate and next incomplete task."],["Streak metrics","Current streak, longest streak, focused time and active-day totals."],["Activity heatmap","Clickable day cells show full, partial, challenge, grace and overdue states."],["Weekly direction","A recommended next action and weekly study-goal summary."]]}/>
          <Tip>Only meaningful activity extends a streak: completing a task or logging at least 30 focused minutes.</Tip>
        </section>

        <section id="today" className={styles.section}><Chapter number="03" label="Daily execution" title="Today & focus mode" lead="Today turns the curriculum into a focused work session and keeps every completion synchronized with the syllabus."/>
          <FeatureGrid items={[["Daily objective","A concise outcome, total estimated time, difficulty and XP opportunity."],["Focus timer","Start, pause and stop a session; stopped time is added to today’s activity."],["Executable exercise","Choose a quick Python, JavaScript, SQL, R or Notes starter, then continue in the full 24-language Lab."],["Checklist","Required and optional tasks can be completed or reopened at any time."],["Two-way completion","Topics completed from Syllabus appear completed in Today when their day arrives."],["Reflection","Record understanding, difficulty, confidence, notes and useful links."]]}/>
          <Callout title="Finishing a day">The Finish day button becomes available after every required task is complete. Optional challenges award additional XP but do not block completion.</Callout>
        </section>

        <section id="syllabus" className={styles.section}><Chapter number="04" label="Learning roadmap" title="Syllabus" lead="Browse your AI-built curriculum, learn subtopics out of order and keep those completions ready for their scheduled day."/>
          <Figure src="/docs/images/syllabus.png" alt="Expanded DataSprint syllabus course showing topic completion controls and direct GeeksforGeeks resources" caption="Syllabus - expandable courses, topic-level completion and direct learning resources."/>
          <FeatureGrid items={[["Personal roadmap","Eight progressive modules and forty subtopics are tailored to the selected outcome and experience level."],["Search and filter","Search across module names and individual subtopics; review module completion percentages."],["Verified direct resources","A GeeksforGeeks link appears only when domain-restricted research finds a relevant direct article. Generic searches and unverified URLs are rejected."],["Honest fallback","For subjects GeeksforGeeks does not cover, DS95 clearly says no relevant guide was found while keeping the full syllabus usable."],["Manual completion","Select the numbered control beside any subtopic to mark it complete; select again to reopen it."],["Future-day awareness","Early completions remain stored and automatically appear complete when that subtopic becomes Today’s work."]]}/>
        </section>

        <section id="lab" className={styles.section}><Chapter number="05" label="Multi-language cloud IDE" title="DS95 Lab" lead="Create, save and run work across 24 languages with local runtimes, sandboxed web previews and isolated compilers."/>
          <Figure src="/docs/images/workspace.jpg" alt="DataSprint Lab browser IDE with project explorer, SQL editor and result table" caption="DataSprint Lab - account-saved files, language-aware editor and live PostgreSQL results."/>
          <div className={styles.runtimeTable}><div className={styles.tableHead}><span>Runtime</span><span>What it provides</span><span>Persistence</span></div><div><b>Local WebAssembly</b><span>Pyodide Python, WebR and PGlite PostgreSQL execute in the browser.</span><small>Source syncs; SQL data stays on device</small></div><div><b>Web preview</b><span>HTML and CSS render in a sandboxed frame with no deployment step.</span><small>Source syncs to the account</small></div><div><b>Isolated compilers</b><span>JavaScript, TypeScript, C/C++, Java, C#, Go, Rust, Kotlin, Swift, Ruby, PHP, Bash, Scala, Dart, Lua, Perl and Haskell.</span><small>Source syncs; execution is temporary</small></div></div>
          <h3>IDE controls</h3><FeatureGrid items={[["Explorer","Files are grouped into Today & Daily, Proof-of-Learning Projects and Scratch Files."],["Language picker","Choose among 24 grouped languages or use quick-create shortcuts for common daily work."],["General learning notebook","Non-code topics open a saved structure for understanding, evidence, questions and next actions."],["Run or preview","Use the primary action or Cmd/Ctrl + Enter and follow loading, execution and result states."],["Output","Read console text, compiler errors, SQL result tables or an isolated web preview."],["Execution safety","Remote code requires authentication and receives strict source, CPU, time, memory and network limits."]]}/>
          <Tip>The first Python or R run downloads its WebAssembly runtime and can take a moment. Remote compiler code leaves the browser for isolated execution, so never put credentials or private data in a runnable source file.</Tip>
        </section>

        <section id="projects" className={styles.section}><Chapter number="06" label="Proof of learning" title="Projects & badges" lead="Turn learning into visible evidence using three AI-designed projects connected to your specific outcome."/>
          <Figure src="/docs/images/projects.png" alt="DataSprint portfolio projects with milestones, progress bars and project actions" caption="Portfolio systems - milestone progress, live datasets, internal workspaces and achievement badges."/>
          <div className={styles.projectList}>{[
            ["Foundation artifact","Demonstrate command of the core concepts through a small, well-explained deliverable."],
            ["Applied outcome prototype","Combine multiple modules to build something useful and test it against clear criteria."],
            ["Final proof of learning","Create, refine and publish the strongest evidence that the selected outcome was achieved."],
          ].map(([title,text],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><div><b>{title}</b><p>{text}</p></div></article>)}</div>
          <FeatureGrid items={[["Goal-specific briefs","Project titles, tools and milestones are generated from the learner’s selected subject and outcome."],["Milestones","Every project checklist is interactive and produces a real completion percentage."],["Internal workspace","Open a language-matched Lab file attached to the selected project."],["Linked repository","Attach a normalized github.com/owner/repository URL, open it later or unlink it."],["Badge cabinet","Twelve account-specific badges reward first steps, streaks, study time, topics, modules and shipped projects."],["Portfolio progress","Calculated only from completed project milestones; no demo completion is inserted."]]}/>
        </section>

        <section id="analytics" className={styles.section}><Chapter number="07" label="Measurement" title="Progress, analytics & backups" lead="Understand your pace, preserve a portable copy and recover your learning state when needed."/>
          <FeatureGrid items={[["Progress metrics","Required syllabus percentage, current streak and total completed tasks."],["Trajectory","Actual progress compared with the expected 95-day pace."],["Study pace","Weekly focused-hour bars and a completion-day forecast."],["Topic signals","Highlighted strengths and topics recommended for review."],["CSV export","Download activity dates, focused minutes and task counts for analysis."],["JSON backup","Export the complete account state and import a valid DataSprint backup."]]}/>
          <Callout title="Backup before major changes">Download a JSON backup before importing another file. Invalid or incomplete structures are rejected instead of replacing the current state.</Callout>
        </section>

        <section id="data" className={styles.section}><Chapter number="08" label="Trust & persistence" title="Accounts, data & security" lead="Know exactly which information is cloud-synced, device-local or controlled by the authentication provider."/>
          <div className={styles.dataFlow}><article><span>01</span><b>Supabase Auth</b><p>Handles email sign-up, sign-in, verification, recovery sessions and password updates. DS95 does not store passwords.</p></article><i>→</i><article><span>02</span><b>Authenticated server APIs</b><p>Validate the bearer token before Groq planning, progress persistence or isolated compiler execution.</p></article><i>→</i><article><span>03</span><b>Neon Postgres</b><p>Stores one JSON progress document, including the generated path and source files, per authenticated user ID.</p></article></div>
          <div className={styles.scopeTable}><div><b>Cloud-synced</b><p>Profile preferences, start date, activities, topic completion, project milestones, personal tasks, workspace source files and repository links.</p></div><div><b>Device-local</b><p>The live PGlite SQL database and its tables are stored through IndexedDB in the current browser. Re-run saved SQL on another device to recreate them.</p></div><div><b>Never stored by DataSprint</b><p>Your plaintext password. Supabase owns the password and email-recovery flow.</p></div></div>
        </section>

        <section id="mobile" className={styles.section}><Chapter number="09" label="Use everywhere" title="Mobile & accessibility" lead="The interface adapts from a wide control room to a touch-friendly mobile learning companion."/>
          <FeatureGrid items={[["Responsive navigation","Desktop floating navigation becomes a six-item bottom navigation on small screens."],["Adaptive layouts","Dashboards, project grids, charts and the Lab explorer stack vertically when space is limited."],["Touch targets","Primary actions, checklist controls and navigation retain comfortable interactive areas."],["Keyboard workflow","Skip-to-content support, semantic controls and Cmd/Ctrl + Enter execution in the editor."],["Screen-reader state","Current navigation, task completion and pressed-state information use accessible attributes."],["Reduced motion","System reduced-motion preferences disable nonessential animation and transitions."]]}/>
        </section>

        <section id="troubleshooting" className={styles.section}><Chapter number="10" label="Quick fixes" title="Troubleshooting" lead="Use these checks before assuming your work is lost."/>
          <div className={styles.faq}><details open><summary>Progress says “Device only”</summary><p>The app saved the current state in this browser but could not reach cloud storage. Check the connection, keep the page open and retry after the connection returns.</p></details><details><summary>Python or R takes time on the first run</summary><p>The language runtime is downloaded lazily. Wait for the loading label to change to Running. Later runs are faster because browser caching can reuse assets.</p></details><details><summary>SQL tables are missing on another device</summary><p>PGlite tables are intentionally browser-local. Your SQL source file still syncs; run its CREATE and INSERT statements on the second device.</p></details><details><summary>A syllabus topic already appears complete</summary><p>It may have been marked complete earlier from the Syllabus. The same topic completion is shown in Today when its assigned day arrives.</p></details><details><summary>Password reset email does not arrive</summary><p>Check spam, verify the address and wait briefly before requesting another message. Reset links must return to an allowed production URL configured in Supabase.</p></details><details><summary>A GitHub link is rejected</summary><p>Use a repository URL shaped like github.com/owner/repository. Profile pages, non-GitHub hosts and deeper paths are not accepted.</p></details></div>
        </section>

        <section className={styles.quickReference}><span className={styles.eyebrow}>QUICK REFERENCE</span><h2>Five habits for a healthy sprint.</h2><ol><li><b>Complete or reopen honestly.</b><span>Progress should represent what you can explain and reproduce.</span></li><li><b>Use the timer for focused work.</b><span>Thirty meaningful minutes can extend your activity streak.</span></li><li><b>Write code in the Lab.</b><span>Keep examples beside the day or project that created them.</span></li><li><b>Ship milestone evidence.</b><span>Link a repository and document decisions, checks and limitations.</span></li><li><b>Back up periodically.</b><span>Keep a JSON snapshot before large imports or account changes.</span></li></ol><a href="/docs/datasprint95-complete-guide.pdf" download>Keep the complete guide offline ↓</a></section>
      </article>
    </div>
    <footer className={styles.footer}><div><Link href="/" className={styles.brand}>DS<span>95</span></Link><p>One goal. One personal path. Ninety-five days.</p></div><div><a href="/docs/datasprint95-complete-guide.pdf" download>PDF manual</a><a href="#contents">Contents</a><Link href="/">Open app</Link></div><small>DS95 Product Guide · Updated August 2026</small></footer>
  </main>;
}

function Chapter({number,label,title,lead}:{number:string,label:string,title:string,lead:string}) { return <header className={styles.chapter}><span>{number} · {label.toUpperCase()}</span><h2>{title}</h2><p>{lead}</p></header> }
function Step({n,title,children}:{n:string,title:string,children:React.ReactNode}) { return <article><span>{n}</span><h3>{title}</h3><p>{children}</p></article> }
function FeatureGrid({items}:{items:string[][]}) { return <div className={styles.featureGrid}>{items.map(([title,text])=><article key={title}><span>✓</span><div><b>{title}</b><p>{text}</p></div></article>)}</div> }
function Figure({src,alt,caption,priority=false}:{src:string,alt:string,caption:string,priority?:boolean}) { return <figure className={styles.figure}><div><Image src={src} alt={alt} width={1600} height={920} priority={priority}/></div><figcaption><span>SCREEN</span>{caption}</figcaption></figure> }
function Callout({title,children}:{title:string,children:React.ReactNode}) { return <aside className={styles.callout}><span>✦</span><div><b>{title}</b><p>{children}</p></div></aside> }
function Tip({children}:{children:React.ReactNode}) { return <p className={styles.tip}><b>PRO TIP</b>{children}</p> }
