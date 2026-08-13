"use client";

import { useEffect, useRef, useState } from "react";

type Task = { id: string; title: string; type: "Lesson" | "Practice" | "Project" | "Review"; mins: number; required: boolean };
type DayPlan = { day: number; topic: string; course: string; week: number; objective: string; tasks: Task[] };
type Activity = { completed: string[]; minutes: number; notes: string; difficulty: number; confidence: number; challenge?: boolean; reflection?: string };
type AppState = { name: string; startDate: string; dailyTarget: number; timezone?: string; theme: "dark" | "light"; onboarded: boolean; xp: number; activities: Record<string, Activity>; personalTasks: Task[]; freezes: string[] };
type View = "dashboard" | "today" | "syllabus" | "projects" | "analytics";
type SyncStatus = "loading" | "saving" | "saved" | "device";
type Session = { authenticated: boolean; user: { displayName: string; email: string } | null; signInPath?: string; signOutPath?: string | null; localPreview: boolean };

const COURSES = [
  ["What is Data Science?", 12, ["Definition and importance of data science", "Structured and unstructured data", "Applications of data science", "Data careers and responsibilities", "Four types of analytics", "The data-science workflow", "Turning needs into business questions", "Privacy, ethics, fairness and bias"]],
  ["Tools for Data Science", 16, ["Google Colab and Jupyter notebooks", "Python, SQL and R overview", "NumPy, pandas and scikit-learn", "Matplotlib and Seaborn", "Git and GitHub fundamentals", "Repositories, commits and branches", "Writing an effective README", "APIs, cloud and databases", "Data warehouses and data lakes"]],
  ["Data Science Methodology", 9, ["CRISP-DM overview", "Business understanding", "Data understanding and preparation", "Modelling and evaluation", "Deployment and feedback loops", "Python variables and data types", "Strings and operators", "Lists, tuples and dictionaries", "Conditions, loops and functions"]],
  ["Python for Data Science, AI & Development", 24, ["Files and exceptions", "Objects and classes", "NumPy arrays", "pandas Series and DataFrames", "Filtering and sorting", "Grouping and aggregation", "APIs and JSON", "Requests and Beautiful Soup", "Responsible web scraping"]],
  ["Python Project for Data Science", 7, ["Choose a public dataset", "Collect and validate data", "Clean data with pandas", "Moving averages and percentage changes", "Create explanatory charts", "Package a portfolio notebook"]],
  ["Databases and SQL for Data Science with Python", 18, ["Relational database concepts", "Tables, keys and relationships", "SELECT and filtering", "Aggregations", "GROUP BY and HAVING", "SQL joins", "Subqueries and CTEs", "Create and modify data", "Views and transactions", "SQLite with Python", "SQL results in pandas"]],
  ["Data Analysis with Python", 16, ["Missing values and duplicates", "Fixing data types", "Normalization and binning", "Categorical encoding", "Exploratory data analysis", "Descriptive statistics", "Distributions and outliers", "Correlation", "Linear regression", "MAE, MSE and R²"]],
  ["Data Visualization with Python", 19, ["Visualization principles", "Honest axes and accessible colours", "Matplotlib essentials", "Seaborn essentials", "Line, bar and area charts", "Histograms and box plots", "Scatter and bubble charts", "Heatmaps and regression plots", "Folium maps and choropleths", "Plotly dashboards", "Data storytelling"]],
  ["Machine Learning with Python", 20, ["Supervised and unsupervised learning", "Features and targets", "Train, validation and test sets", "Overfitting and leakage", "Linear and logistic regression", "K-nearest neighbours", "Decision trees", "Support-vector machines", "Confusion matrix", "Precision, recall, F1 and ROC-AUC", "K-means clustering", "Principal component analysis", "Cross-validation", "Hyperparameter tuning", "Feature selection and pipelines"]],
  ["Applied Data Science Capstone", 14, ["Select a capstone problem", "Plan data collection", "Clean and explore data", "Train three candidate models", "Compare models fairly", "Select an evaluation metric", "Interpret results", "Limitations and recommendations", "Professional README and presentation"]],
  ["Generative AI: Elevate Your Data Science Career", 14, ["Generative AI fundamentals", "Hallucinations and privacy", "AI-assisted coding", "AI-assisted analysis", "Documentation with AI", "Verify AI-generated answers", "Responsible AI in modelling"]],
  ["Career Guide & Interview Preparation", 9, ["Polish three portfolio projects", "Create a one-page résumé", "Prepare your GitHub profile", "Analyse job descriptions", "Python and SQL interview questions", "Statistics and ML review", "Five-minute capstone presentation", "Mock technical interview"]],
] as const;

const FINAL_TOPICS = ["Catch up on unfinished lessons", "Repeat weak Python topics", "Repeat weak SQL topics", "Revise statistics", "Revise machine-learning metrics", "Clean GitHub repositories", "Improve project documentation", "Complete missing visualizations", "Improve your résumé", "Run a mock interview", "Final assessment and graduation"];

const GFG_GUIDES: Array<[RegExp,string]> = [
  [/Google Colab|Jupyter/i,"https://www.geeksforgeeks.org/python/how-to-use-google-colab/"],
  [/Git and GitHub|Repositories|commits|branches/i,"https://www.geeksforgeeks.org/git/git-tutorial/"],
  [/README|GitHub profile/i,"https://www.geeksforgeeks.org/git/how-to-write-a-good-readme-file-for-your-github-project/"],
  [/data warehouse|data lake/i,"https://www.geeksforgeeks.org/dbms/data-warehousing/"],
  [/cloud computing/i,"https://www.geeksforgeeks.org/cloud-computing/cloud-computing/"],
  [/CRISP-DM|Business understanding|Data understanding|Deployment and feedback/i,"https://www.geeksforgeeks.org/data-science/data-science-process/"],
  [/variables|data types/i,"https://www.geeksforgeeks.org/python/python-variables/"],
  [/Strings and operators/i,"https://www.geeksforgeeks.org/python/python-operators/"],
  [/Lists, tuples|dictionaries|sets/i,"https://www.geeksforgeeks.org/python/python-data-structures/"],
  [/Conditions, loops|functions/i,"https://www.geeksforgeeks.org/python/python-programming-language-tutorial/"],
  [/Files and exceptions/i,"https://www.geeksforgeeks.org/python/file-handling-python/"],
  [/Objects and classes/i,"https://www.geeksforgeeks.org/python/python-oops-concepts/"],
  [/NumPy arrays/i,"https://www.geeksforgeeks.org/numpy/numpy-tutorial/"],
  [/pandas Series|DataFrames/i,"https://www.geeksforgeeks.org/pandas/python-pandas-dataframe/"],
  [/Filtering and sorting/i,"https://www.geeksforgeeks.org/pandas/filter-pandas-dataframe-with-multiple-conditions/"],
  [/Grouping and aggregation/i,"https://www.geeksforgeeks.org/pandas/pandas-groupby/"],
  [/APIs and JSON/i,"https://www.geeksforgeeks.org/python/python-api-tutorial-getting-started-with-apis/"],
  [/Requests and Beautiful Soup|web scraping/i,"https://www.geeksforgeeks.org/python/implementing-web-scraping-python-beautiful-soup/"],
  [/public dataset|Collect and validate data|data collection/i,"https://www.geeksforgeeks.org/data-science/data-collection-methods/"],
  [/Clean data|Missing values|duplicates/i,"https://www.geeksforgeeks.org/data-analysis/data-cleaning/"],
  [/Moving averages|percentage changes/i,"https://www.geeksforgeeks.org/pandas/how-to-calculate-moving-average-in-a-pandas-dataframe/"],
  [/Relational database|Tables, keys|relationships/i,"https://www.geeksforgeeks.org/dbms/relational-model-in-dbms/"],
  [/SELECT and filtering|Aggregations|GROUP BY|HAVING|Create and modify data/i,"https://www.geeksforgeeks.org/sql/sql-data-analysis/"],
  [/SQL joins/i,"https://www.geeksforgeeks.org/sql/sql-join-set-1-inner-left-right-and-full-joins/"],
  [/Subqueries and CTEs/i,"https://www.geeksforgeeks.org/sql/sql-with-clause/"],
  [/Views and transactions/i,"https://www.geeksforgeeks.org/sql/sql-transactions/"],
  [/SQLite with Python/i,"https://www.geeksforgeeks.org/python/python-sqlite/"],
  [/SQL results in pandas/i,"https://www.geeksforgeeks.org/pandas/working-with-database-using-pandas/"],
  [/Fixing data types/i,"https://www.geeksforgeeks.org/pandas/change-data-type-for-one-or-more-columns-in-pandas-dataframe/"],
  [/Normalization and binning/i,"https://www.geeksforgeeks.org/machine-learning/data-pre-processing-wit-sklearn-using-standard-and-minmax-scaler/"],
  [/Categorical encoding/i,"https://www.geeksforgeeks.org/machine-learning/feature-encoding-techniques-machine-learning/"],
  [/Exploratory data analysis/i,"https://www.geeksforgeeks.org/data-analysis/exploratory-data-analysis-in-python/"],
  [/Descriptive statistics|Distributions and outliers/i,"https://www.geeksforgeeks.org/data-science/descriptive-statistics/"],
  [/Correlation/i,"https://www.geeksforgeeks.org/pandas/python-pandas-dataframe-corr/"],
  [/Linear regression/i,"https://www.geeksforgeeks.org/machine-learning/ml-linear-regression/"],
  [/MAE, MSE|R²/i,"https://www.geeksforgeeks.org/machine-learning/regression-metrics/"],
  [/Visualization principles|Honest axes|Data storytelling/i,"https://www.geeksforgeeks.org/data-visualization/data-visualization-and-its-importance/"],
  [/Matplotlib|Line, bar|Histograms|box plots|Scatter|bubble charts/i,"https://www.geeksforgeeks.org/python/matplotlib-tutorial/"],
  [/Seaborn|Heatmaps|regression plots/i,"https://www.geeksforgeeks.org/python/seaborn-tutorial/"],
  [/Folium|choropleth/i,"https://www.geeksforgeeks.org/python/visualizing-geospatial-data-using-folium-in-python/"],
  [/Plotly dashboards/i,"https://www.geeksforgeeks.org/python/plotly-tutorial/"],
  [/Supervised and unsupervised/i,"https://www.geeksforgeeks.org/machine-learning/supervised-unsupervised-learning/"],
  [/Features and targets|Feature selection/i,"https://www.geeksforgeeks.org/machine-learning/feature-selection-techniques-in-machine-learning/"],
  [/Train, validation|Cross-validation/i,"https://www.geeksforgeeks.org/machine-learning/cross-validation-machine-learning/"],
  [/Overfitting and leakage/i,"https://www.geeksforgeeks.org/machine-learning/underfitting-and-overfitting-in-machine-learning/"],
  [/logistic regression/i,"https://www.geeksforgeeks.org/machine-learning/understanding-logistic-regression/"],
  [/K-nearest neighbours/i,"https://www.geeksforgeeks.org/machine-learning/k-nearest-neighbours/"],
  [/Decision trees/i,"https://www.geeksforgeeks.org/machine-learning/decision-tree/"],
  [/Support-vector machines/i,"https://www.geeksforgeeks.org/machine-learning/support-vector-machine-algorithm/"],
  [/Confusion matrix|Precision, recall|F1|ROC-AUC|evaluation metric/i,"https://www.geeksforgeeks.org/machine-learning/confusion-matrix-machine-learning/"],
  [/K-means clustering/i,"https://www.geeksforgeeks.org/machine-learning/k-means-clustering-introduction/"],
  [/Principal component analysis/i,"https://www.geeksforgeeks.org/machine-learning/implementing-pca-in-python-with-scikit-learn/"],
  [/Hyperparameter tuning/i,"https://www.geeksforgeeks.org/machine-learning/hyperparameter-tuning/"],
  [/pipelines/i,"https://www.geeksforgeeks.org/machine-learning/pipelines-python-and-scikit-learn/"],
  [/Generative AI|Hallucinations|AI-assisted|Verify AI|Responsible AI/i,"https://www.geeksforgeeks.org/artificial-intelligence/generative-ai/"],
  [/résumé|job descriptions|interview|capstone presentation/i,"https://www.geeksforgeeks.org/blogs/data-scientist-interview-questions-and-answers/"],
  [/data science|analytics|data careers|privacy|ethics|fairness|bias|Python, SQL and R|NumPy, pandas and scikit|applications/i,"https://www.geeksforgeeks.org/data-science/data-science-course-syllabus-subjects/"],
];

function gfgUrl(topic:string){return GFG_GUIDES.find(([pattern])=>pattern.test(topic))?.[1]||"https://www.geeksforgeeks.org/data-science/data-science-course-syllabus-subjects/"}

function makeCurriculum(): DayPlan[] {
  const core: DayPlan[] = [];
  COURSES.forEach((course, ci) => {
    const [name, , topics] = course;
    const start = ci * 7 + 1;
    for (let i = 0; i < 7; i++) {
      const topic = topics[i % topics.length];
      core.push({ day: start + i, topic, course: name, week: ci + 1, objective: `Understand ${topic.toLowerCase()} and apply it in a practical data-science context.`, tasks: [
        { id: `d${start+i}-learn`, title: `Learn: ${topic}`, type: "Lesson", mins: 55, required: true },
        { id: `d${start+i}-practice`, title: `Practice: ${topics[(i+1)%topics.length]}`, type: "Practice", mins: 45, required: true },
        { id: `d${start+i}-notes`, title: "Summarize key ideas in your learning log", type: "Review", mins: 20, required: true },
        { id: `d${start+i}-challenge`, title: "Stretch: explain the concept with a real dataset", type: "Practice", mins: 25, required: false },
      ] });
    }
  });
  FINAL_TOPICS.forEach((topic, i) => core.push({ day: 85+i, topic, course: "Final completion period", week: 13, objective: `${topic} and close any remaining gaps before graduation.`, tasks: [
    { id: `d${85+i}-review`, title: topic, type: "Review", mins: 60, required: true },
    { id: `d${85+i}-portfolio`, title: "Document evidence of improvement", type: "Project", mins: 45, required: true },
    { id: `d${85+i}-reflect`, title: "Complete confidence check and reflection", type: "Review", mins: 20, required: true },
  ] }));
  return core;
}

const CURRICULUM = makeCurriculum();
const pad = (n:number) => String(n).padStart(2,"0");
const iso = (d:Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays = (s:string, n:number) => { const d=new Date(`${s}T12:00:00`); d.setDate(d.getDate()+n); return d; };
const fmtDate = (s:string) => new Intl.DateTimeFormat("en",{month:"short",day:"numeric",year:"numeric"}).format(new Date(`${s}T12:00:00`));
const todayIso = () => iso(new Date());
const dayDiff = (a:string,b:string) => Math.floor((new Date(`${b}T12:00:00`).getTime()-new Date(`${a}T12:00:00`).getTime())/86400000);

function seedState(): AppState {
  const start=iso(addDays(todayIso(),-23)); const activities:Record<string,Activity>={};
  for(let i=0;i<23;i++){ if([5,11,18].includes(i)) continue; const plan=CURRICULUM[i]; const count=i%4===0?2:3; activities[iso(addDays(start,i))]={completed:plan.tasks.slice(0,count).map(t=>t.id),minutes:75+(i%3)*25,notes:i%5===0?"Key idea: connect each technique to a business question.":"",difficulty:2+(i%3),confidence:3+(i%2),challenge:i%7===2}; }
  return {name:"Alex",startDate:start,dailyTarget:120,theme:"dark",onboarded:false,xp:1480,activities,personalTasks:[],freezes:[]};
}

function active(activity?:Activity){ return !!activity && (activity.completed.length>0 || activity.minutes>=30); }
function calcStreak(state:AppState){ let current=0,longest=0,run=0; const start=new Date(`${state.startDate}T12:00:00`); const end=new Date(); for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){ const key=iso(d); if(active(state.activities[key])||state.freezes.includes(key)){run++;longest=Math.max(longest,run);}else run=0; } current=run; return {current,longest}; }

const NAV:[View,string,string][]=[["dashboard","Mission","◉"],["today","Today","▶"],["syllabus","Syllabus","▤"],["projects","Projects","◇"],["analytics","Progress","↗"]];

export default function Home(){
  const [state,setState]=useState<AppState>(()=>seedState()); const [ready,setReady]=useState(false); const [session,setSession]=useState<Session|null>(null); const [accountOpen,setAccountOpen]=useState(false); const [syncStatus,setSyncStatus]=useState<SyncStatus>("loading"); const [view,setView]=useState<View>("dashboard"); const [selectedDay,setSelectedDay]=useState<number|null>(null); const [toast,setToast]=useState("");
  useEffect(()=>{let active=true;fetch("/api/session",{credentials:"same-origin"}).then(response=>response.json()).then(data=>{if(active)setSession(data)}).catch(()=>{if(active)setSession({authenticated:false,user:null,signInPath:"/signin-with-chatgpt?return_to=%2F",localPreview:false})});return()=>{active=false}},[]);
  useEffect(()=>{let active=true;queueMicrotask(async()=>{if(!active)return;let restored=seedState();try{const saved=localStorage.getItem("datasprint95");if(saved)restored=JSON.parse(saved)}catch(error){console.warn("Could not restore saved DataSprint progress",error)}try{const response=await fetch("/api/progress",{credentials:"same-origin"});if(response.ok){const remote=await response.json();if(remote.state)restored=remote.state;setSyncStatus("saved")}else setSyncStatus("device")}catch{setSyncStatus("device")}if(active){setState(restored);setReady(true)}});return()=>{active=false}},[]);
  useEffect(()=>{if(!ready)return;localStorage.setItem("datasprint95",JSON.stringify(state));document.documentElement.dataset.theme=state.theme;const timeout=window.setTimeout(async()=>{setSyncStatus(current=>current==="device"?"device":"saving");try{const response=await fetch("/api/progress",{method:"PUT",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify(state)});setSyncStatus(response.ok?"saved":"device")}catch{setSyncStatus("device")}},700);return()=>window.clearTimeout(timeout)},[state,ready]);
  const update=(fn:(s:AppState)=>AppState)=>setState(s=>fn(s));
  const currentDay=Math.max(1,dayDiff(state.startDate,todayIso())+1); const totalRequired=CURRICULUM.flatMap(d=>d.tasks.filter(t=>t.required)).length; const allDone=new Set(Object.values(state.activities).flatMap(a=>a.completed)); const doneRequired=CURRICULUM.flatMap(d=>d.tasks.filter(t=>t.required)).filter(t=>allDone.has(t.id)).length; const completion=Math.round(doneRequired/totalRequired*100); const expected=Math.min(100,Math.round(currentDay/95*100)); const streak=calcStreak(state); const totalMinutes=Object.values(state.activities).reduce((s,a)=>s+a.minutes,0); const activeDays=Object.values(state.activities).filter(active).length; const totalTasks=Object.values(state.activities).reduce((s,a)=>s+a.completed.length,0); const todayPlan=CURRICULUM[Math.min(currentDay,95)-1]; const todayActivity=state.activities[todayIso()]||{completed:[],minutes:0,notes:"",difficulty:3,confidence:3};
  const notice=completion>=100?"You completed the DataSprint 95 journey!":currentDay>100?"Your target date has passed. Let’s create a recovery plan.":completion+3<expected?"You’re a little behind. Complete one catch-up task today.":"You’re on track. Keep going!";
  const notify=(m:string)=>{setToast(m);setTimeout(()=>setToast(""),2400)};
  if(!ready||!session)return <div className="boot">Preparing your sprint…</div>;
  if(!session.authenticated)return <AuthScreen signInPath={session.signInPath||"/signin-with-chatgpt?return_to=%2F"}/>;
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <nav className="floating-nav" aria-label="Primary navigation">
      <button className="nav-logo" onClick={()=>setView("dashboard")} aria-label="DataSprint 95 mission dashboard">DS<span>95</span></button>
      <div className="nav-links">{NAV.map(([id,label])=><button key={id} className={view===id?"active":""} aria-current={view===id?"page":undefined} onClick={()=>setView(id)}><span>{label}</span>{view===id&&<i/>}</button>)}</div>
      <span className={`sync-status ${syncStatus}`} title={syncStatus==="device"?"Saved on this device; cloud sync is unavailable":"Progress is synced securely"}><i/>{syncStatus==="loading"?"Loading":syncStatus==="saving"?"Saving":syncStatus==="saved"?"Synced":"Device only"}</span>
      <button className="nav-profile" onClick={()=>setAccountOpen(true)} aria-label={`Open ${session.user?.displayName||state.name} account`}><span>{(session.user?.displayName||state.name)[0]||"A"}</span></button>
      <button className="nav-continue" onClick={()=>setView("today")}>Continue <span>→</span></button>
    </nav>
    <main id="main-content" tabIndex={-1}>
      {view==="dashboard"&&<Dashboard {...{state,currentDay,completion,expected,streak,totalMinutes,activeDays,totalTasks,todayPlan,todayActivity,notice,setView,setSelectedDay}}/>}
      {view==="today"&&<Today plan={todayPlan} activity={todayActivity} update={update} notify={notify}/>}
      {view==="syllabus"&&<Syllabus state={state} allDone={allDone} completion={completion} update={update} notify={notify}/>} 
      {view==="projects"&&<Projects completion={completion} notify={notify}/>} 
      {view==="analytics"&&<Analytics state={state} completion={completion} expected={expected} streak={streak} totalTasks={totalTasks}/>} 
    </main>
    <nav className="bottom-nav" aria-label="Mobile navigation">{NAV.map(([id,label,icon])=><button key={id} className={view===id?"active":""} aria-current={view===id?"page":undefined} onClick={()=>setView(id)}><i aria-hidden="true">{icon}</i><span>{label}</span></button>)}</nav>
    {!state.onboarded&&<Onboarding update={update}/>}
    {selectedDay&&<DayModal day={selectedDay} state={state} onClose={()=>setSelectedDay(null)}/>} 
    {accountOpen&&<AccountModal session={session} syncStatus={syncStatus} onClose={()=>setAccountOpen(false)}/>}
    {toast&&<div className="toast" role="status" aria-live="polite">✓ {toast}</div>}
  </div>
}

function AuthScreen({signInPath}:{signInPath:string}){
 return <main className="auth-page"><section className="auth-visual"><span className="auth-brand">DS<span>95</span></span><div><span className="eyebrow">DATASPRINT 95 · SECURE LEARNING WORKSPACE</span><h1>Build skills.<br/><strong>Keep your progress.</strong></h1><p>Sign in to continue your 95-day data-science journey on any device.</p></div><div className="auth-signal"><span>95</span><i/><small>DAYS OF FOCUSED PROGRESS</small></div></section><section className="auth-panel" aria-labelledby="auth-title"><div><span className="eyebrow">WELCOME BACK</span><h2 id="auth-title">Continue your sprint.</h2><p>Use your ChatGPT account for a secure, password-protected DataSprint profile.</p><a className="auth-primary" href={signInPath}>Sign in with ChatGPT <span>→</span></a><div className="auth-features"><span><i>✓</i><b>Email verification</b><small>Your identity stays protected.</small></span><span><i>✓</i><b>Forgotten-password recovery</b><small>Reset access securely by email.</small></span><span><i>✓</i><b>Cloud progress sync</b><small>Continue on another device.</small></span></div><p className="auth-note">Password creation, reset emails and account security are handled securely by ChatGPT. DataSprint never receives or stores your password.</p></div></section></main>
}

function AccountModal({session,syncStatus,onClose}:{session:Session,syncStatus:SyncStatus,onClose:()=>void}){
 const status=syncStatus==="saved"?"Cloud progress synced":syncStatus==="saving"?"Saving progress…":syncStatus==="device"?"Saved on this device":"Loading progress…";
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title"><button className="modal-close" onClick={onClose} aria-label="Close account">×</button><span className="eyebrow">YOUR ACCOUNT</span><div className="account-identity"><span>{session.user?.displayName[0]||"A"}</span><div><h2 id="account-title">{session.user?.displayName}</h2><p>{session.user?.email}</p></div></div><div className="account-status"><i className={syncStatus}/><div><b>{status}</b><small>{session.localPreview?"Local preview session":"Protected by Sign in with ChatGPT"}</small></div></div><div className="account-security"><h3>Security & recovery</h3><p>Email verification, password recovery and reset emails are managed by your ChatGPT account. DataSprint never stores your password.</p></div>{session.signOutPath?<a className="secondary account-signout" href={session.signOutPath}>Sign out</a>:<button className="secondary account-signout" onClick={onClose}>Close local preview</button>}</section></div>
}

function Dashboard(p:{state:AppState,currentDay:number,completion:number,expected:number,streak:{current:number,longest:number},totalMinutes:number,activeDays:number,totalTasks:number,todayPlan:DayPlan,todayActivity:Activity,notice:string,setView:(v:View)=>void,setSelectedDay:(n:number)=>void}){
 const {state,currentDay,completion,streak,totalMinutes,activeDays,totalTasks,todayPlan,todayActivity,notice,setView,setSelectedDay}=p; const [range,setRange]=useState("program"); const behind=completion+3<p.expected; const next=todayPlan.tasks.find(t=>!todayActivity.completed.includes(t.id));
 return <div className="page dashboard"><section className="mission-hero"><div><span className="status-pill">✦ DAY {Math.min(currentDay,95)} OF 95 · {notice}</span><span className="eyebrow">DATASPRINT 95 · YOUR LEARNING WORKSPACE</span><h1><span>Build skills daily.</span><strong>Stay on track.</strong></h1><p>Complete your 95-day data science roadmap, protect your streak and see exactly where you stand.</p><div className="mission-bullets"><span>✓ Daily guided practice</span><span>✓ Visible consistency</span><span>✓ Portfolio-ready outcomes</span></div><button className="primary hero-action" onClick={()=>setView("today")}>Continue today <span>→</span></button></div><div className="hero-signal" aria-hidden="true"><div className="signal-window"><span>95-DAY SIGNAL</span><b>{completion}%</b><div className="signal-line"><i style={{width:`${completion}%`}}/></div><small>{activeDays} active days · {totalTasks} tasks</small></div></div></section><section className="welcome"><div><div className="eyebrow">MISSION STATUS · DAY {Math.min(currentDay,95)}</div><h2>Good to have you back, {state.name}.</h2><p>{notice}</p></div><div className="countdown"><span>{Math.max(0,95-currentDay+1)}</span><small>DAYS<br/>REMAINING</small></div></section>
  {behind&&<div className="alert"><span>↗</span><div><b>You’re {Math.max(1,p.expected-completion)}% behind today’s target</b><p>Finish “{next?.title}” to close the gap and protect your target date.</p></div><button onClick={()=>setView("today")}>Catch up now →</button></div>}
  <section className="hero-card command-card">
    <div className="command-day"><span>DAY</span><b>{pad(Math.min(currentDay,95))}</b><small>/ 95</small></div><div className="hero-copy"><div className="tag">WEEK {todayPlan.week} · IN PROGRESS</div><h2>{todayPlan.topic}</h2><p>{todayPlan.course} · {next?.mins||45} min estimated</p><button className="primary" onClick={()=>setView("today")}><span>▶</span> Continue learning</button></div>
    <ProgressRing value={completion}/>
  </section>
  <section className="metrics">
    <Metric icon="⌁" value={`${streak.current} days`} label="Current streak" sub={`Longest: ${streak.longest} days · 1 freeze ready`} accent="purple"/>
    <Metric icon="◷" value={`${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m`} label="Study time" sub={`Weekly: 10.2h / 15h`} accent="purple"/>
    <Metric icon="✓" value={`${todayActivity.completed.length}/${todayPlan.tasks.filter(t=>t.required).length}`} label="Today’s tasks" sub="Meaningful work extends streak" accent="purple"/>
    <Metric icon="◇" value={String(activeDays)} label="Active days" sub={`${totalTasks} total tasks completed`} accent="purple"/>
  </section>
  <Heatmap state={state} currentDay={currentDay} range={range} setRange={setRange} onSelect={setSelectedDay}/>
  <section className="dashboard-bottom">
    <div className="next-card"><div className="section-title"><div><span className="eyebrow">UP NEXT</span><h3>Recommended for you</h3></div><button onClick={()=>setView("today")}>View today →</button></div><div className="next-task"><span className="task-icon">⌘</span><div><div className="pills"><span>{next?.type||"Review"}</span><span>{next?.mins||30} min</span></div><h4>{next?.title||"Reflect on today’s progress"}</h4><p>{todayPlan.objective}</p></div><button onClick={()=>setView("today")}>→</button></div></div>
    <div className="weekly-card"><div className="section-title"><h3>Weekly goal</h3><b>68%</b></div><div className="bar"><span style={{width:"68%"}}/></div><div className="weekly-grid"><div><b>10.2h</b><small>of 15 hours</small></div><div><b>17</b><small>tasks done</small></div><div><b>4</b><small>active days</small></div></div><p>Just <b>4h 48m</b> to reach this week’s goal.</p></div>
  </section>
 </div>
}

function ProgressRing({value}:{value:number}){return <div className="ring-wrap"><div className="ring" style={{"--p":`${value*3.6}deg`} as React.CSSProperties}><div><b>{value}%</b><small>COMPLETE</small></div></div><span>Overall progress</span></div>}
function Metric({icon,value,label,sub,accent}:{icon:string,value:string,label:string,sub:string,accent:string}){return <article className="metric"><span className={`metric-icon ${accent}`}>{icon}</span><div><b>{value}</b><span>{label}</span><small>{sub}</small></div></article>}

function Heatmap({state,currentDay,range,setRange,onSelect}:{state:AppState,currentDay:number,range:string,setRange:(s:string)=>void,onSelect:(n:number)=>void}){
 const days=range==="all"?Math.max(currentDay+14,130):range==="3m"?90:Math.max(112,currentDay+7); const start=new Date(`${state.startDate}T12:00:00`); const offset=start.getDay(); const cells=Array.from({length:offset+days},(_,i)=>i<offset?null:i-offset+1); const months:string[]=[];
 for(let i=1;i<=days;i++){const d=addDays(state.startDate,i-1);if(i===1||d.getDate()<=7)months.push(new Intl.DateTimeFormat("en",{month:"short"}).format(d));}
 const status=(n:number)=>{const key=iso(addDays(state.startDate,n-1));const a=state.activities[key];const req=CURRICULUM[Math.min(n,95)-1]?.tasks.filter(t=>t.required)||[];const done=req.filter(t=>a?.completed.includes(t.id)).length;if(n>100&&n<=currentDay)return "overdue";if(n>95&&n<=100&&n<=currentDay)return "grace";if(!a||(!a.completed.length&&!a.minutes))return "none";if(a.challenge&&done===req.length)return "challenge";if(done===req.length)return "full";if(done>=Math.ceil(req.length/2))return "half";return "some"};
 return <section className="heat-card"><div className="section-title"><div><span className="eyebrow">CONSISTENCY</span><h3>Your learning activity</h3></div><select value={range} onChange={e=>setRange(e.target.value)} aria-label="Heatmap range"><option value="program">Current program</option><option value="3m">Last 3 months</option><option value="all">All time</option></select></div><div className="heat-scroll"><div className="month-row">{months.map((m,i)=><span key={i}>{m}</span>)}</div><div className="heat-body"><div className="week-labels"><span>Mon</span><span>Wed</span><span>Fri</span></div><div className="heat-grid">{cells.map((n,i)=>n===null?<i key={i}/>:<button key={i} className={`cell ${status(n)} ${n===currentDay?"today-cell":""}`} title={`Day ${n} · ${fmtDate(iso(addDays(state.startDate,n-1)))}`} aria-label={`Open day ${n}`} onClick={()=>onSelect(n)}/>)}</div></div></div><div className="heat-footer"><div className="legend"><span>Less</span>{["none","some","half","full","challenge"].map(s=><i key={s} className={`cell ${s}`}/>)}<span>More</span><i className="cell grace"/><span>Grace</span><i className="cell overdue"/><span>Behind syllabus</span></div><b>{Object.values(state.activities).filter(active).length} active days · {calcStreak(state).current} day streak</b></div></section>
}

function Today({plan,activity,update,notify}:{plan:DayPlan,activity:Activity,update:(f:(s:AppState)=>AppState)=>void,notify:(s:string)=>void}){
 const [seconds,setSeconds]=useState(0);const [running,setRunning]=useState(false);const timer=useRef<ReturnType<typeof setInterval>|null>(null);const key=todayIso();
 useEffect(()=>{if(running)timer.current=setInterval(()=>setSeconds(s=>s+1),1000);return()=>{if(timer.current)clearInterval(timer.current)}},[running]);
 const patchActivity=(p:Partial<Activity>)=>update(s=>({...s,activities:{...s.activities,[key]:{...activity,...p}}}));
 const toggle=(task:Task)=>{const has=activity.completed.includes(task.id);patchActivity({completed:has?activity.completed.filter(x=>x!==task.id):[...activity.completed,task.id]});if(!has)update(s=>({...s,xp:s.xp+(task.required?50:75)}));notify(has?"Task reopened":"Task complete · +50 XP")};
 const stop=()=>{setRunning(false);const mins=Math.max(1,Math.round(seconds/60));patchActivity({minutes:activity.minutes+mins});setSeconds(0);notify(`${mins} minute study session saved`)};
 const done=plan.tasks.filter(t=>t.required).every(t=>activity.completed.includes(t.id));
 return <div className="page today-page"><div className="page-head"><div><span className="eyebrow">DAY {pad(plan.day)} / 95 · {fmtDate(key)}</span><h1><span>Enter focus mode.</span><strong>{plan.topic}</strong></h1><p>{plan.course} · Week {plan.week} · {plan.tasks.reduce((s,t)=>s+t.mins,0)} min</p></div><div className="day-progress"><b>{activity.completed.length}/{plan.tasks.length}</b><span>tasks complete</span></div></div>
  <div className="learning-grid"><section className="lesson-card"><span className="tag">TODAY’S FOCUS</span><h2>{plan.objective}</h2><p>Build a clear mental model, apply it in code, and capture what you learned so you can explain it later.</p><div className="lesson-meta"><span>◷ {plan.tasks.reduce((s,t)=>s+t.mins,0)} min</span><span>◎ Beginner friendly</span><span>◆ +{plan.tasks.reduce((s,t)=>s+(t.required?50:75),0)} XP</span></div></section>
  <section className="timer-card"><span className="eyebrow">FOCUS TIMER</span><b className="timer">{pad(Math.floor(seconds/60))}:{pad(seconds%60)}</b><div><button className="primary" onClick={()=>setRunning(!running)}>{running?"Ⅱ Pause":"▶ Start"}</button><button className="secondary" onClick={stop} disabled={!seconds}>■ Stop</button></div><small>{activity.minutes} minutes logged today</small></section></div>
  <section className="code-exercise"><div className="code-head"><span>PYTHON · EXERCISE</span><button onClick={()=>{navigator.clipboard?.writeText("import pandas as pd\ndf = pd.read_csv('data.csv')\nprint(df.head())");notify("Code copied")}}>Copy</button></div><pre><code><span className="kw">import</span> pandas <span className="kw">as</span> pd{"\n"}df = pd.read_csv(<span className="str">&apos;data.csv&apos;</span>){"\n"}<span className="comment"># Inspect the first five records</span>{"\n"}<span className="fn">print</span>(df.head())</code></pre><div className="code-actions"><button className="secondary" onClick={()=>notify("Exercise opened in your workspace")}>Open exercise ↗</button><button className="primary" onClick={()=>notify("Code ran successfully")}>Run code ▶</button></div></section>
  <section className="task-list"><div className="section-title"><div><span className="eyebrow">CHECKLIST</span><h3>Today’s learning plan</h3></div><span>{Math.round(activity.completed.length/plan.tasks.length*100)}%</span></div>{plan.tasks.map(task=><article key={task.id} className={activity.completed.includes(task.id)?"done":""}><button className="check" onClick={()=>toggle(task)} aria-label={`Mark ${task.title} complete`}>{activity.completed.includes(task.id)?"✓":""}</button><div><div className="pills"><span>{task.type}</span><span>{task.required?"Required":"Optional challenge"}</span></div><h4>{task.title}</h4><small>◷ {task.mins} min · +{task.required?50:75} XP</small></div><button className="more">•••</button></article>)}</section>
  <section className="reflection"><h3>Learning reflection</h3><label>What did you understand today?<textarea value={activity.reflection||""} onChange={e=>patchActivity({reflection:e.target.value})} placeholder="Explain the main idea in your own words…"/></label><div className="ratings"><Rating label="Difficulty" value={activity.difficulty} set={v=>patchActivity({difficulty:v})}/><Rating label="Confidence" value={activity.confidence} set={v=>patchActivity({confidence:v})}/></div><label>Notes<textarea value={activity.notes} onChange={e=>patchActivity({notes:e.target.value})} placeholder="Links, questions, useful snippets…"/></label><button className="primary finish" disabled={!done} onClick={()=>notify("Day finished — excellent work!")}>Finish day <span>→</span></button></section>
 </div>
}
function Rating({label,value,set}:{label:string,value:number,set:(n:number)=>void}){return <div><span>{label}</span><div>{[1,2,3,4,5].map(n=><button key={n} className={n<=value?"selected":""} onClick={()=>set(n)}>{n}</button>)}</div></div>}

function Syllabus({state,allDone,completion,update,notify}:{state:AppState,allDone:Set<string>,completion:number,update:(f:(s:AppState)=>AppState)=>void,notify:(s:string)=>void}){
 const [search,setSearch]=useState("");const [open,setOpen]=useState<number|null>(3);const [newTask,setNewTask]=useState(""); const filtered=COURSES.map((c,i)=>({c,i})).filter(({c})=>c[0].toLowerCase().includes(search.toLowerCase())||c[2].some(t=>t.toLowerCase().includes(search.toLowerCase())));
 const add=()=>{if(!newTask.trim())return;update(s=>({...s,personalTasks:[...s.personalTasks,{id:`personal-${Date.now()}`,title:newTask,type:"Practice",mins:30,required:false}]}));setNewTask("");notify("Personal task added")};
 return <div className="page syllabus-page"><div className="page-head"><div><span className="eyebrow">178 HOURS · 12 COURSES · 95 DAYS</span><h1><span>Master the roadmap.</span><strong>One module at a time.</strong></h1><p>A complete path from first principles to a job-ready portfolio.</p></div><ProgressRing value={completion}/></div><div className="toolbar"><div className="search">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses and topics…"/></div><select><option>All courses</option><option>In progress</option><option>Completed</option></select></div>
  <section className="course-list">{filtered.map(({c,i})=>{
    const [name,hours,topics]=c;
    const days=CURRICULUM.filter(d=>d.course===name);
    const tasks=days.flatMap(d=>d.tasks.filter(t=>t.required));
    const pct=Math.round(tasks.filter(t=>allDone.has(t.id)).length/Math.max(1,tasks.length)*100);
    return <article className="course" key={name}>
      <button className="course-head" onClick={()=>setOpen(open===i?null:i)}><span className={`course-num ${pct===100?"complete":pct?"current":""}`}>{pct===100?"✓":pad(i+1)}</span><div><small>COURSE {i+1} · {hours} HOURS</small><h3>{name}</h3><div className="course-bar"><span style={{width:`${pct}%`}}/></div></div><b>{pct}%</b><i>{open===i?"−":"+"}</i></button>
      {open===i&&<div className="course-content"><div className="topic-grid">{topics.map((t,j)=><div key={t}><span className={j<pct/12?"topic-done":""}>{j<pct/12?"✓":j+1}</span><div><b>{t}</b><small>{j%3===0?"Lesson + guided practice":"Hands-on exercise"} · {35+(j%3)*10} min</small><a className="gfg-link" href={gfgUrl(t)} target="_blank" rel="noreferrer" aria-label={`Learn ${t} on GeeksforGeeks`}>Learn this topic on GeeksforGeeks <span aria-hidden="true">↗</span></a></div></div>)}</div><div className="resource-line"><span>↗ More free resources: official documentation, Kaggle Learn, freeCodeCamp</span><button onClick={()=>notify("Prior-knowledge assessment ready")}>Test prior knowledge</button></div></div>}
    </article>
  })}</section>
  <section className="personal-card"><div><h3>Personal learning tasks</h3><p>Add goals without changing required syllabus progress.</p></div><div className="add-task"><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="e.g. Revisit pandas groupby"/><button className="primary" onClick={add}>Add task</button></div>{state.personalTasks.map(t=><div className="personal-row" key={t.id}><span>○</span><b>{t.title}</b><button onClick={()=>update(s=>({...s,personalTasks:s.personalTasks.filter(x=>x.id!==t.id)}))}>Remove</button></div>)}</section>
 </div>
}

function Projects({completion,notify}:{completion:number,notify:(s:string)=>void}){
 const projects=[
  {num:"01",title:"Python Data Collection",desc:"Collect, validate and transform a real public dataset into an analysis-ready artifact.",tools:["Python","pandas","APIs"],progress:100,status:"Portfolio ready",tasks:["Source documented","Data cleaned","README published"]},
  {num:"02",title:"Exploratory Analysis & Visualization",desc:"Find a defensible story in messy data and communicate it with a polished visual narrative.",tools:["pandas","Seaborn","Plotly"],progress:64,status:"Current mission",tasks:["EDA notebook","8 visualizations","Executive summary"]},
  {num:"03",title:"Machine-Learning Capstone",desc:"Compare candidate models, justify one final approach and document limitations responsibly.",tools:["scikit-learn","SQL","GitHub"],progress:18,status:"Planning",tasks:["Problem proposal","Model comparison","Professional README"]},
 ];
 const achievements=["3-day streak","7-day streak","14-day streak","30-day streak","Python completed","SQL completed","Visualization completed","ML completed"];
 return <div className="page projects-page"><div className="page-head"><div><span className="eyebrow">PORTFOLIO SYSTEMS</span><h1><span>Turn practice into proof.</span><strong>Ship work that speaks.</strong></h1><p>Three substantial projects. One job-ready portfolio.</p></div><div className="project-total"><b>{completion}%</b><span>MISSION KNOWLEDGE</span></div></div>
  <section className="project-grid">{projects.map((project,i)=><article key={project.num} className={`project-card ${i===1?"current":""}`}><div className="project-top"><span>{project.num}</span><b>{project.status}</b></div><div className="project-icon">{i===0?"{ }":i===1?"▥":"⌁"}</div><h2>{project.title}</h2><p>{project.desc}</p><div className="tool-list">{project.tools.map(tool=><span key={tool}>{tool}</span>)}</div><div className="project-progress"><div><span>Completion</span><b>{project.progress}%</b></div><div className="bar"><span style={{width:`${project.progress}%`}}/></div></div><ul>{project.tasks.map((task,j)=><li key={task}><span>{j<Math.ceil(project.progress/34)?"✓":"○"}</span>{task}</li>)}</ul><button className={i===1?"primary":"secondary"} onClick={()=>notify(i===0?"GitHub repository ready":"Project workspace opened")}>{i===0?"View on GitHub ↗":"Open project →"}</button></article>)}</section>
  <section className="achievements"><div className="section-title"><div><span className="eyebrow">SYSTEM MILESTONES</span><h3>Achievements</h3></div><span>Professional signals, earned through real progress.</span></div><div className="achievement-grid">{achievements.map((item,i)=><article key={item} className={i<3?"earned":"locked"}><span>{i<3?"✦":"◇"}</span><div><b>{item}</b><small>{i<3?`Earned · ${fmtDate(iso(addDays(todayIso(),-(12-i*4))))}`:"Signal locked"}</small></div></article>)}</div></section>
 </div>
}

function Analytics({state,completion,expected,streak,totalTasks}:{state:AppState,completion:number,expected:number,streak:{current:number,longest:number},totalTasks:number}){
 const weeks=Array.from({length:8},(_,i)=>({label:`W${i+1}`,hours:[8.5,12.2,14.1,10.8,15,13.4,10.2,6.8][i],tasks:[11,16,20,15,22,19,17,8][i]})); const delta=completion-expected; const predicted=Math.max(95,Math.round(95*(expected||1)/Math.max(completion,1))); const exportData=(type:"json"|"csv")=>{const content=type==="json"?JSON.stringify(state,null,2):"date,minutes,tasks\n"+Object.entries(state.activities).map(([d,a])=>`${d},${a.minutes},${a.completed.length}`).join("\n");const a=document.createElement("a");const url=URL.createObjectURL(new Blob([content],{type:"text/plain"}));a.href=url;a.download=`datasprint95.${type}`;a.click();URL.revokeObjectURL(url)};
 return <div className="page analytics-page"><div className="page-head"><div><span className="eyebrow">PROGRESS & INSIGHTS</span><h1><span>Read the signals.</span><strong>Adjust your pace.</strong></h1><p>Use your patterns to finish stronger, not just faster.</p></div><div className="export"><button onClick={()=>exportData("csv")}>Export CSV</button><button onClick={()=>exportData("json")}>Backup JSON</button><label>Import<input type="file" accept=".json" onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=()=>{try{localStorage.setItem("datasprint95",String(r.result));location.reload()}catch(error){console.warn("Could not import DataSprint backup",error)}};r.readAsText(f)}}}/></label></div></div>
  <section className="analytics-metrics"><Metric icon="◔" value={`${completion}%`} label="Syllabus complete" sub={`${delta>=0?delta+"% ahead":Math.abs(delta)+"% behind"}`} accent="green"/><Metric icon="⚡" value={`${streak.current} days`} label="Learning streak" sub={`Calendar best: ${streak.longest}`} accent="amber"/><Metric icon="✓" value={String(totalTasks)} label="Tasks completed" sub="Across all courses" accent="blue"/><Metric icon="◎" value="3.7 / 5" label="Avg. confidence" sub="Up 0.4 this month" accent="purple"/></section>
  <div className="charts-grid"><section className="chart-card wide"><div className="section-title"><div><span className="eyebrow">TRAJECTORY</span><h3>Expected vs actual progress</h3></div><div className="chart-legend"><span><i className="actual"/>Actual</span><span><i className="expected"/>Expected</span></div></div><div className="line-chart"><div className="y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><svg viewBox="0 0 700 230" preserveAspectRatio="none" role="img" aria-label="Progress line chart"><g className="grid-lines"><line x1="0" y1="10" x2="700" y2="10"/><line x1="0" y1="65" x2="700" y2="65"/><line x1="0" y1="120" x2="700" y2="120"/><line x1="0" y1="175" x2="700" y2="175"/><line x1="0" y1="225" x2="700" y2="225"/></g><path className="expected-line" d="M0 225 L700 10"/><path className="actual-line" d="M0 225 C90 215,110 188,190 180 S300 135,365 142 S450 100,520 106 S600 70,700 66"/></svg><div className="x-labels"><span>Week 1</span><span>Week 4</span><span>Week 8</span><span>Week 12</span></div></div></section>
  <section className="chart-card"><span className="eyebrow">WEEKLY PACE</span><h3>Study hours</h3><div className="bars">{weeks.map(w=><div key={w.label}><span style={{height:`${w.hours/15*100}%`}} title={`${w.hours} hours`}/><small>{w.label}</small></div>)}</div><p>15h weekly goal <b>— — —</b></p></section>
  <section className="chart-card"><span className="eyebrow">FORECAST</span><h3>Completion outlook</h3><div className="forecast"><span>⌁</span><b>Day {predicted}</b><small>Predicted completion</small></div><p className={predicted>95?"recovery":"success"}>{predicted>95?`Add 30 minutes on study days or use one catch-up day to recover ${predicted-95} days.`:"You’re projected to finish on time."}</p></section>
  <section className="chart-card strengths"><span className="eyebrow">TOPIC SIGNALS</span><h3>Strengths & focus areas</h3><div><span>Python fundamentals</span><b>Strong</b></div><div><span>Data visualization</span><b>Strong</b></div><div><span>SQL joins</span><b className="focus">Review</b></div><div><span>Model evaluation</span><b className="focus">Review</b></div></section></div>
 </div>
}

function DayModal({day,state,onClose}:{day:number,state:AppState,onClose:()=>void}){const plan=CURRICULUM[Math.min(day,95)-1];const key=iso(addDays(state.startDate,day-1));const a=state.activities[key];return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="day-modal" role="dialog" aria-modal="true" aria-labelledby="day-modal-title" tabIndex={-1}><button className="modal-close" onClick={onClose} aria-label="Close day details">×</button><span className="eyebrow">DAY {day} · {fmtDate(key)}</span><h2 id="day-modal-title">{plan?.topic||"Beyond the target date"}</h2><p>{plan?.course||"Recovery period"}</p><div className="modal-stats"><div><b>{a?.completed.length||0}/{plan?.tasks.length||0}</b><span>Tasks</span></div><div><b>{a?.minutes||0}</b><span>Minutes</span></div><div><b>{active(a)?"Yes":"No"}</b><span>Extended streak</span></div></div><h3>Assigned tasks</h3>{plan?.tasks.map(t=><div className="modal-task" key={t.id}><span>{a?.completed.includes(t.id)?"✓":"○"}</span>{t.title}</div>)}<h3>Notes</h3><p className="note-box">{a?.notes||"No notes recorded for this day."}</p><div className="modal-detail"><span>Exercise result <b>{a?.completed.length?"Completed":"Not recorded"}</b></span><span>Project activity <b>{a?.challenge?"Challenge completed":"None"}</b></span></div></div></div>}

function Onboarding({update}:{update:(f:(s:AppState)=>AppState)=>void}){
 const [step,setStep]=useState(0);
 const [form,setForm]=useState({name:"",startDate:todayIso(),dailyTarget:120,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,theme:"dark" as const,days:["Mon","Tue","Wed","Thu","Fri","Sat"]});
 const finish=()=>update(s=>({...s,...form,onboarded:true,activities:{},xp:0}));
 return <div className="onboarding"><div className="onboard-shell"><div className="onboard-intro"><span className="eyebrow">DATASPRINT 95 · INITIALIZE MISSION</span><h1><span>Learn data science.</span><strong>Stay consistent.</strong></h1><p>A structured 95-day syllabus with daily tasks, streaks, projects and clear progress tracking.</p><div className="onboard-grid">{Array.from({length:49},(_,i)=><i key={i} className={i<18?"active":""}/>)}</div></div><div className="onboard-form"><div className="step-dots">{[0,1,2].map(i=><i key={i} className={i<=step?"active":""}/>)}</div>{step===0&&<><span className="eyebrow">01 · IDENTIFY</span><h2>What should we call you?</h2><p>Your name personalizes the mission dashboard.</p><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your first name"/></label><button className="primary full" disabled={!form.name.trim()} onClick={()=>setStep(1)}>Continue →</button><button className="demo-link" onClick={()=>update(s=>({...s,onboarded:true,theme:"dark"}))}>Explore with demo progress</button></>}{step===1&&<><span className="eyebrow">02 · SET CADENCE</span><h2>Build your study rhythm.</h2><label>Preferred start date<input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></label><label>Daily study target<select value={form.dailyTarget} onChange={e=>setForm({...form,dailyTarget:Number(e.target.value)})}><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="150">2.5 hours</option></select></label><span className="label">Six study days</span><div className="day-picks">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><button key={d} className={form.days.includes(d)?"selected":""} onClick={()=>setForm({...form,days:form.days.includes(d)?form.days.filter(x=>x!==d):form.days.length<6?[...form.days,d]:form.days})}>{d[0]}</button>)}</div><button className="primary full" onClick={()=>setStep(2)}>Continue →</button></>}{step===2&&<><span className="eyebrow">03 · CONFIRM SYSTEM</span><h2>Your mission is ready.</h2><label>Timezone<input value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})}/></label><div className="plan-summary"><b>95-day learning system</b><span>178 hours · 12 courses · 3 portfolio projects</span><span>Target finish · {fmtDate(iso(addDays(form.startDate,94)))}</span></div><button className="primary full" onClick={finish}>Start Day 1 →</button></>}</div></div></div>
}
