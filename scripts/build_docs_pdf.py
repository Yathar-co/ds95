from pathlib import Path
from shutil import copyfile

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "datasprint95-complete-guide.pdf"
PUBLIC = ROOT / "public" / "docs" / "datasprint95-complete-guide.pdf"
TMP = ROOT / "tmp" / "pdfs" / "docs-images"
IMG = ROOT / "public" / "docs" / "images"

INK = colors.HexColor("#F4F4F2")
MUTED = colors.HexColor("#8E8E97")
ACCENT = colors.HexColor("#9187FF")
ACCENT_DARK = colors.HexColor("#25213D")
CANVAS = colors.HexColor("#0A0A0C")
SURFACE = colors.HexColor("#151518")
LINE = colors.HexColor("#303037")
GREEN = colors.HexColor("#79D5A2")


def register_fonts():
    candidates = [
        ("DSRegular", "/System/Library/Fonts/Supplemental/Arial.ttf"),
        ("DSBold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        ("DSMono", "/System/Library/Fonts/Supplemental/Courier New.ttf"),
    ]
    for name, path in candidates:
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))
    return {
        "regular": "DSRegular" if "DSRegular" in pdfmetrics.getRegisteredFontNames() else "Helvetica",
        "bold": "DSBold" if "DSBold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold",
        "mono": "DSMono" if "DSMono" in pdfmetrics.getRegisteredFontNames() else "Courier",
    }


FONTS = register_fonts()
styles = getSampleStyleSheet()
S = {
    "eyebrow": ParagraphStyle("Eyebrow", fontName=FONTS["mono"], fontSize=7.5, leading=10, textColor=ACCENT, spaceAfter=7, tracking=1.2),
    "h1": ParagraphStyle("H1", fontName=FONTS["bold"], fontSize=35, leading=37, textColor=INK, spaceAfter=11),
    "h2": ParagraphStyle("H2", fontName=FONTS["bold"], fontSize=24, leading=27, textColor=INK, spaceAfter=9),
    "h3": ParagraphStyle("H3", fontName=FONTS["bold"], fontSize=12, leading=15, textColor=INK, spaceBefore=4, spaceAfter=5),
    "lead": ParagraphStyle("Lead", fontName=FONTS["regular"], fontSize=10.5, leading=16, textColor=colors.HexColor("#B7B7BD"), spaceAfter=16),
    "body": ParagraphStyle("Body", fontName=FONTS["regular"], fontSize=8.7, leading=13.5, textColor=MUTED, spaceAfter=7),
    "small": ParagraphStyle("Small", fontName=FONTS["regular"], fontSize=7.2, leading=10.5, textColor=MUTED),
    "caption": ParagraphStyle("Caption", fontName=FONTS["regular"], fontSize=7, leading=10, textColor=colors.HexColor("#777780"), spaceBefore=5, spaceAfter=10),
    "card_title": ParagraphStyle("CardTitle", fontName=FONTS["bold"], fontSize=9, leading=12, textColor=INK, spaceAfter=4),
    "card_body": ParagraphStyle("CardBody", fontName=FONTS["regular"], fontSize=7.4, leading=11, textColor=MUTED),
    "toc": ParagraphStyle("Toc", fontName=FONTS["regular"], fontSize=9, leading=13, textColor=INK),
}


def dark_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CANVAS)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    if doc.page > 1:
        canvas.setStrokeColor(LINE)
        canvas.line(18 * mm, A4[1] - 15 * mm, A4[0] - 18 * mm, A4[1] - 15 * mm)
        canvas.setFont(FONTS["mono"], 6.5)
        canvas.setFillColor(colors.HexColor("#707078"))
        canvas.drawString(18 * mm, A4[1] - 11.5 * mm, "DS95 - COMPLETE PRODUCT GUIDE")
        canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"{doc.page:02d}")
    canvas.restoreState()


def chapter(number, label, title, lead):
    return [
        Paragraph(f"{number} - {label.upper()}", S["eyebrow"]),
        Paragraph(title, S["h1"]),
        Paragraph(lead, S["lead"]),
    ]


def cards(items, columns=2):
    cells = []
    for title, text in items:
        cells.append([Paragraph(title, S["card_title"]), Paragraph(text, S["card_body"] )])
    rows = [cells[index:index + columns] for index in range(0, len(cells), columns)]
    if rows and len(rows[-1]) < columns:
        rows[-1].extend([""] * (columns - len(rows[-1])))
    table = Table(rows, colWidths=[(159 * mm - (columns - 1) * 3 * mm) / columns] * columns, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), .5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 11), ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
    ]))
    return table


def callout(title, text):
    table = Table([[Paragraph("TIP", S["eyebrow"]), [Paragraph(title, S["card_title"]), Paragraph(text, S["card_body"])]]], colWidths=[18 * mm, 141 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#171427")), ("BOX", (0, 0), (-1, -1), .75, colors.HexColor("#494272")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12), ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return table


def optimized_image(name, max_width=1800):
    source = IMG / name
    target = TMP / f"{source.stem}.jpg"
    target.parent.mkdir(parents=True, exist_ok=True)
    with PILImage.open(source) as image:
        image = image.convert("RGB")
        if image.width > max_width:
            ratio = max_width / image.width
            image = image.resize((max_width, int(image.height * ratio)), PILImage.Resampling.LANCZOS)
        image.save(target, "JPEG", quality=88, optimize=True)
    return target


def screenshot(name, caption, max_height=103 * mm):
    path = optimized_image(name)
    with PILImage.open(path) as image:
        ratio = image.height / image.width
    width = 159 * mm
    height = min(width * ratio, max_height)
    if height == max_height:
        width = height / ratio
    return KeepTogether([
        Image(str(path), width=width, height=height, hAlign="LEFT"),
        Paragraph(f"SCREEN - {caption}", S["caption"]),
    ])


def runtime_table():
    data = [
        ["RUNTIME", "EXECUTION", "PERSISTENCE"],
        ["Local WASM", "Pyodide Python, WebR and PGlite PostgreSQL execute directly in the browser.", "Source syncs; SQL data stays on device."],
        ["Web preview", "HTML and CSS render in a sandboxed preview without deployment.", "Source syncs to the account."],
        ["Compilers", "18 programming languages execute in an isolated Judge0 service.", "Source syncs; execution is temporary."],
        ["Notes", "A structured notebook for understanding, evidence, questions and next actions.", "Content syncs to the account."],
    ]
    table = Table([[Paragraph(str(cell), S["small"] if row else S["eyebrow"]) for cell in line] for row, line in enumerate(data)], colWidths=[29 * mm, 82 * mm, 48 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT_DARK), ("BACKGROUND", (0, 1), (-1, -1), SURFACE),
        ("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return table


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=25 * mm, rightMargin=26 * mm, topMargin=24 * mm, bottomMargin=18 * mm, title="DS95 Complete Product Guide", author="DS95")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="dark", frames=[frame], onPage=dark_page)])
    story = []

    # Cover
    story += [Spacer(1, 32 * mm), Paragraph("DS95 - COMPLETE PRODUCT MANUAL", S["eyebrow"]), Paragraph("Choose the goal.<br/><font color='#9187FF'>Build the path.</font>", ParagraphStyle("Cover", parent=S["h1"], fontSize=39, leading=42, spaceAfter=18)), Paragraph("A detailed guide to AI roadmap generation, learning, coding, projects, progress and account security in DS95.", ParagraphStyle("CoverLead", parent=S["lead"], fontSize=13, leading=20)), Spacer(1, 38 * mm)]
    signal = Table([[Paragraph("PRODUCT GUIDE", S["eyebrow"]), ""], [Paragraph("95", ParagraphStyle("Signal", parent=S["h1"], fontSize=72, leading=75)), Paragraph("LEARN<br/>BUILD<br/>MEASURE<br/>SHIP", ParagraphStyle("SignalText", parent=S["small"], leading=15, alignment=TA_LEFT))]], colWidths=[95 * mm, 58 * mm])
    signal.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#17151F")), ("BOX", (0, 0), (-1, -1), .75, LINE), ("SPAN", (0, 0), (1, 0)), ("LEFTPADDING", (0, 0), (-1, -1), 18), ("RIGHTPADDING", (0, 0), (-1, -1), 18), ("TOPPADDING", (0, 0), (-1, -1), 16), ("BOTTOMPADDING", (0, 0), (-1, -1), 16), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story += [signal, Spacer(1, 14 * mm), Paragraph("Version 1.0 - August 2026 - ds95.xyz", S["small"]), PageBreak()]

    # Contents
    story += chapter("00", "Navigation", "Contents", "Use this guide as an end-to-end walkthrough or jump directly to the part of the product you need.")
    contents = [
        ("01", "Getting started", "Account creation, sign-in, recovery and onboarding"), ("02", "Mission dashboard", "Daily signal, heatmap, streak and recommendations"),
        ("03", "Today and focus mode", "Timer, resources, exercises, tasks and reflection"), ("04", "Syllabus", "AI modules, subtopic completion and direct resources"),
        ("05", "DS95 Lab", "24 languages, previews, compilers, files and runtime behavior"), ("06", "Projects and badges", "Three personal projects, repositories and achievements"),
        ("07", "Progress and backups", "Analytics, forecasts, CSV, JSON and restore"), ("08", "Accounts and data", "Cloud sync, device-local data and security"),
        ("09", "Mobile and accessibility", "Responsive and keyboard behavior"), ("10", "Troubleshooting", "Common issues and fast resolutions"),
    ]
    toc_rows = [[Paragraph(n, S["eyebrow"]), Paragraph(f"<b>{title}</b><br/><font color='#777780'>{desc}</font>", S["toc"])] for n, title, desc in contents]
    toc = Table(toc_rows, colWidths=[18 * mm, 141 * mm])
    toc.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    story += [toc, PageBreak()]

    # Product map
    story += chapter("00", "At a glance", "The complete learning system", "DS95 turns one chosen outcome into a personal syllabus, a daily execution loop, practical work and proof-of-learning projects.")
    story += [cards([("95 guided days", "A sequenced route from the learner's current level to one concrete outcome."), ("8 modules and 40 subtopics", "AI-generated lessons, practice, checkpoints and reviews."), ("24-language IDE", "Local runtimes, web previews, isolated compilers and a learning notebook."), ("3 personal projects", "Goal-specific milestone plans that turn learning into evidence."), ("Verified GFG resources", "Direct articles appear only when domain-restricted research finds a relevant source."), ("Portable backups", "CSV activity exports and full JSON backup and restore.")]), Spacer(1, 8 * mm), callout("The daily loop", "Open Today, learn from the direct resource when available, complete focused practice, record a reflection and convert the learning into project evidence."), PageBreak()]

    # Getting started
    story += chapter("01", "Access and setup", "Getting started", "Create one secure account, define what you want to make or achieve and let AI build a personal 95-day system.")
    story += [cards([("1. Create an account", "Enter your name, email and a password of at least eight characters. Verify the email when required."), ("2. Define the outcome", "Enter a subject, a specific result and your current experience level."), ("3. Set your cadence", "Choose the start date, daily target, study days and timezone used to calculate Today."), ("4. Generate the path", "DS95 creates eight modules, forty subtopics, ninety-five days and three projects.")]), Spacer(1, 8 * mm), callout("Passwords and AI keys", "Supabase owns passwords. The Groq key remains server-only and is never sent to the browser."), Spacer(1, 8 * mm), Paragraph("Changing direction", S["h2"]), Paragraph("Build a new learning path from the account panel when your goal changes. Curriculum and project completion reset for the new path, while saved Lab files remain available. Existing users without an AI path keep the original Data Science roadmap and progress.", S["body"]), PageBreak()]

    # Dashboard two pages
    story += chapter("02", "Command center", "Mission dashboard", "The dashboard converts the 95-day plan into a clear daily signal: what is done, what is next and whether your pace needs attention.")
    story += [screenshot("dashboard.png", "Mission dashboard with completion signal, active days and current mission.", 96 * mm), PageBreak()]
    story += [Paragraph("Dashboard feature map", S["h2"]), cards([("95-day signal", "Required curriculum completion, active days and total completed tasks."), ("Pace notice", "Actual completion compared with the expected percentage for the current day."), ("Current mission", "Today's topic, course, estimate and first incomplete task."), ("Streak metrics", "Current streak, longest streak, focused time and active-day totals."), ("Activity heatmap", "Clickable cells show full, partial, challenge, grace and overdue states."), ("Weekly direction", "Recommended next action and weekly study-goal summary.")]), Spacer(1, 7 * mm), callout("Meaningful activity", "Completing a task or logging at least 30 focused minutes counts as an active day. Empty visits do not extend a streak."), PageBreak()]

    # Today
    story += chapter("03", "Daily execution", "Today and focus mode", "Today turns the curriculum into one focused work session and keeps every completion synchronized with the syllabus.")
    story += [cards([("Daily objective", "A concise outcome, total time estimate, difficulty and XP opportunity."), ("Focus timer", "Start, pause and stop a session. Stopped time is added to today's activity."), ("Executable exercise", "Use a common-language starter and continue it in the full 24-language Lab."), ("Interactive checklist", "Complete or reopen required tasks and optional challenges at any time."), ("Two-way completion", "A Syllabus topic already completed is shown complete when its day arrives."), ("Reflection", "Capture understanding, difficulty, confidence, notes and useful links.")]), Spacer(1, 8 * mm), Paragraph("Completion rules", S["h2"]), Paragraph("The Finish day action becomes available after all required tasks are complete. Optional challenges award extra XP but never block the day. Reopening a topic updates both Syllabus and Today when they refer to the same curriculum topic.", S["body"]), Spacer(1, 5 * mm), callout("Use the Lab handoff", "Choose a starter in Today's exercise and select Open and run in Lab. DataSprint creates a day-linked file only once and reopens the same saved work later."), PageBreak()]

    # Syllabus
    story += chapter("04", "Learning roadmap", "Syllabus", "Browse the AI-built curriculum, learn subtopics out of order and keep early completions ready for their scheduled day.")
    story += [screenshot("syllabus.png", "Expandable modules with topic completion and direct learning resources.", 86 * mm), Spacer(1, 4 * mm), cards([("Personal structure", "Eight progressive modules contain five concrete subtopics each."), ("Verified direct links", "A GeeksforGeeks article appears only when its URL is present in the web-search sources."), ("Honest fallback", "No relevant guide found is shown when GeeksforGeeks does not cover a subtopic."), ("Manual completion", "Select a numbered topic control to complete it; select the check again to reopen it."), ("Future-day awareness", "Early completion remains stored and automatically appears in Today when scheduled."), ("Module percentages", "Each percentage is calculated from its actual completed subtopics.")]), PageBreak()]

    # Lab two pages
    story += chapter("05", "Multi-language cloud IDE", "DS95 Lab", "Create, save and run work across 24 languages using local runtimes, web previews and isolated compilers.")
    story += [screenshot("workspace.jpg", "Project explorer, SQL editor, account-save signal and result table.", 119 * mm), PageBreak()]
    story += [Paragraph("Runtime behavior", S["h2"]), runtime_table(), Spacer(1, 7 * mm), Paragraph("IDE controls", S["h2"]), cards([("Explorer", "Groups Today and Daily, Proof-of-Learning Projects and Scratch Files."), ("Language picker", "Choose 24 grouped languages or use quick-create shortcuts."), ("General notebook", "Non-code topics open a structured place for understanding, evidence and questions."), ("Run and shortcut", "Use Run, Preview or Cmd/Ctrl + Enter and follow every execution state."), ("Rich output", "Read console text, compiler errors, SQL result tables or a web preview."), ("Execution limits", "Remote jobs are authenticated, size-limited, time-limited and network-disabled.")]), Spacer(1, 7 * mm), callout("Privacy boundary", "Python, R and PostgreSQL run locally. Code in other compiler languages is sent to the configured isolated execution service, so never put credentials or private data in runnable source."), PageBreak()]

    # Projects two pages
    story += chapter("06", "Proof of learning", "Projects and badges", "Turn learning into visible evidence using three AI-designed projects connected to the selected outcome.")
    story += [screenshot("projects.png", "Project cards with milestone progress and resource actions.", 102 * mm), PageBreak()]
    projects = [("01 Foundation artifact", "Demonstrate command of the core concepts with a small, well-explained deliverable."), ("02 Applied outcome prototype", "Combine modules to build something useful and test it against clear criteria."), ("03 Final proof of learning", "Create, refine and publish the strongest evidence that the selected outcome was achieved.")]
    story += [Paragraph("Three progressive project briefs", S["h2"]), cards(projects), Spacer(1, 7 * mm), cards([("Goal-specific design", "Titles, tools and milestones are generated from the selected subject and outcome."), ("Milestones", "Every checklist item updates the real project completion percentage."), ("Project workspace", "Open a language-matched Lab file attached to the project."), ("GitHub repository", "Link one github.com/owner/repository URL, open it later or unlink it."), ("Twelve badges", "Achievements reward first steps, streaks, focused time, topics, modules and shipped projects."), ("No demo progress", "Project completion and badges are calculated only from this account's state.")]), PageBreak()]

    # Analytics
    story += chapter("07", "Measurement", "Progress, analytics and backups", "Understand your pace, preserve a portable copy and restore your learning state when needed.")
    story += [cards([("Syllabus completion", "Percentage of required curriculum work completed."), ("Streak and tasks", "Current and longest streak plus total completed tasks."), ("Trajectory", "Actual progress compared with the expected 95-day line."), ("Weekly pace", "Focused-hour bars and a completion-day forecast."), ("Topic signals", "Strengths and recommended review areas."), ("CSV export", "Dates, focused minutes and task counts for external analysis."), ("JSON backup", "The complete state including workspaces and repository links."), ("Validated import", "Malformed structures are rejected before replacing current state.")]), Spacer(1, 8 * mm), callout("Safe backup habit", "Download a JSON backup before importing another file. Keep periodic snapshots when you make major project or workspace changes."), Spacer(1, 8 * mm), Paragraph("Reading the forecast", S["h2"]), Paragraph("Expected progress is based on the current day divided by 95 and is capped at 100 percent. The completion outlook compares that expectation with actual required-task completion and suggests a pace adjustment when the projected finish moves beyond Day 95.", S["body"]), PageBreak()]

    # Data
    story += chapter("08", "Trust and persistence", "Accounts, data and security", "Know which information is cloud-synced, device-local or controlled by the authentication provider.")
    flow = Table([[Paragraph("01", S["eyebrow"]), "", Paragraph("02", S["eyebrow"]), "", Paragraph("03", S["eyebrow"])], [Paragraph("<b>Supabase Auth</b><br/><font color='#8E8E97'>Verifies the user and issues the access token.</font>", S["body"]), Paragraph("->", S["lead"]), Paragraph("<b>AI and progress APIs</b><br/><font color='#8E8E97'>Generate paths and validate saved state.</font>", S["body"]), Paragraph("->", S["lead"]), Paragraph("<b>Neon Postgres</b><br/><font color='#8E8E97'>Stores the personal path and progress.</font>", S["body"]) ]], colWidths=[45 * mm, 12 * mm, 45 * mm, 12 * mm, 45 * mm])
    flow.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ALIGN", (1, 0), (1, -1), "CENTER"), ("ALIGN", (3, 0), (3, -1), "CENTER"), ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    story += [flow, Spacer(1, 8 * mm), cards([("Cloud-synced", "Generated path, preferences, activities, topics, project milestones, personal tasks, source files and repository links."), ("Device-local", "The live PGlite SQL database is stored through IndexedDB. Re-run saved SQL on another device to recreate tables."), ("Never exposed", "The plaintext password and server-side Groq API key."), ("Offline fallback", "The browser retains a user-specific local copy when cloud progress is temporarily unavailable."), ("Resource safeguards", "Search is domain-restricted; generic searches, other hosts and unverified links are removed."), ("Account isolation", "Storage keys and database records are scoped to the authenticated user ID.")]), PageBreak()]

    # Mobile
    story += chapter("09", "Use everywhere", "Mobile and accessibility", "The interface adapts from a wide control room to a touch-friendly mobile learning companion.")
    story += [cards([("Responsive navigation", "Desktop floating navigation becomes a six-item bottom bar on small screens."), ("Adaptive layouts", "Cards, charts and the Lab explorer stack when space is limited."), ("Touch-friendly actions", "Primary actions, checks and navigation retain usable target sizes."), ("Keyboard workflow", "Skip-to-content support and Cmd/Ctrl + Enter execution in the editor."), ("Screen-reader state", "Current navigation, completion and pressed states use semantic attributes."), ("Reduced motion", "System reduced-motion preferences disable nonessential movement.")]), Spacer(1, 9 * mm), Paragraph("Mobile Lab behavior", S["h2"]), Paragraph("On screens below 720 pixels, the file explorer moves above the editor and becomes a bounded scroll area. The editor, output panel and runtime notes remain accessible in a single vertical flow. The source code remains cloud-synced exactly as it is on desktop.", S["body"]), Spacer(1, 5 * mm), callout("Best mobile use", "Use mobile for reading, completing tasks, short experiments and reflections. A wider screen is more comfortable for long project notebooks or complex SQL."), PageBreak()]

    # Troubleshooting
    story += chapter("10", "Quick fixes", "Troubleshooting", "Use these checks before assuming your work is lost.")
    issues = [("Progress says Device only", "The browser saved locally but could not reach cloud persistence. Keep the page open, restore connectivity and make another small update."), ("Python or R is loading", "The runtime is downloaded lazily on first use. Wait for Loading runtime to change to Running."), ("Compiler service unavailable", "The isolated execution service may be busy. Retry shortly or check the configured Judge0 deployment."), ("SQL tables are missing elsewhere", "PGlite tables are browser-local. Run the saved CREATE and INSERT statements on the other device."), ("A topic is already complete", "It may have been completed earlier from Syllabus. The same topic is reflected in Today."), ("No password reset email", "Check spam, verify the address and ensure the production return URL is allowed in Supabase."), ("GitHub URL rejected", "Use github.com/owner/repository. Profiles, other hosts and deeper paths are rejected."), ("Import rejected", "Only a valid DataSprint JSON backup is accepted. Restore the original file or export a new backup.")]
    story += [cards(issues), PageBreak()]

    # Quick reference
    story += chapter("11", "Keep nearby", "Quick reference", "Five habits keep the sprint accurate, portable and portfolio-ready.")
    habits = [("01", "Complete honestly", "Mark work complete only when you can explain or reproduce it."), ("02", "Focus deliberately", "Use the timer; thirty meaningful minutes can extend an active day."), ("03", "Keep code with context", "Store examples beside the day or project that produced them."), ("04", "Ship evidence", "Link a repository and document decisions, checks, results and limitations."), ("05", "Back up periodically", "Keep a JSON snapshot before large imports or major account changes.")]
    habit_table = Table([[Paragraph(n, S["eyebrow"]), [Paragraph(title, S["h3"]), Paragraph(text, S["body"])]] for n, title, text in habits], colWidths=[22 * mm, 137 * mm])
    habit_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 13), ("RIGHTPADDING", (0, 0), (-1, -1), 13), ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12)]))
    story += [habit_table, Spacer(1, 12 * mm), callout("The shortest successful loop", "Open Today, complete one meaningful task, use the direct resource when available, write one reflection sentence and save one piece of evidence."), Spacer(1, 18 * mm), Paragraph("One goal. One personal path. Ninety-five days.", ParagraphStyle("End", parent=S["h1"], alignment=TA_CENTER, textColor=ACCENT)), Paragraph("ds95.xyz", ParagraphStyle("EndUrl", parent=S["small"], alignment=TA_CENTER, textColor=INK))]

    doc.build(story)
    copyfile(OUT, PUBLIC)
    print(f"Created {OUT}")
    print(f"Copied {PUBLIC}")


if __name__ == "__main__":
    build()
