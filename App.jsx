import React, { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Landmark, FileText, Images, Box, Users, Settings, Search, Bell, Plus, Upload, MapPin, ArrowUpRight, Menu, LogOut, ShieldCheck, LoaderCircle, X, Eye } from "lucide-react";

const API = "http://localhost:5000/api";
const blankSite = { name:"", state:"Punjab", district:"", village:"", historicalBackground:"", significance:"", architecturalStyle:"", constructionMaterials:"", condition:"", conservationRecommendations:"", protectionStatus:"Not verified", references:"" };
const blankReport = { title:"", site:"", reportType:"Architectural assessment", materialType:"", testMethod:"Visual condition assessment", equipment:"", inspectionDate:new Date().toISOString().slice(0,10), measurements:"", observations:"", limitations:"", recommendations:"", references:"" };

export default function App() {
  const [token,setToken] = useState(localStorage.getItem("dha_token") || "");
  const [user,setUser] = useState(JSON.parse(localStorage.getItem("dha_user") || "null"));
  const [page,setPage] = useState("Overview");
  useEffect(()=>{ const goSites=()=>setPage("Sites"); window.addEventListener("navigate-sites",goSites); return ()=>window.removeEventListener("navigate-sites",goSites); },[]);
  const [sites,setSites] = useState([]);
  const [reports,setReports] = useState([]);
  const [query,setQuery] = useState("");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [modal,setModal] = useState("");
  const [siteForm,setSiteForm] = useState(blankSite);
  const [reportForm,setReportForm] = useState(blankReport);
  const [selectedSite,setSelectedSite] = useState(null);
  const [files,setFiles] = useState([]);
  const [authMode,setAuthMode] = useState("login");
  const [authForm,setAuthForm] = useState({name:"",email:"",password:""});

  const api = async (path, options={}) => {
    const headers = { ...(options.body instanceof FormData ? {} : {"Content-Type":"application/json"}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(options.headers||{}) };
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(()=>({message:"Unexpected server response"}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  async function loadData() {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const [s,r] = await Promise.all([api("/sites"), api("/reports")]);
      setSites(s); setReports(r);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ loadData(); },[token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitAuth(e) {
    e.preventDefault(); setError("");
    try {
      const data = await api(`/auth/${authMode}`, {method:"POST", body:JSON.stringify(authForm)});
      setToken(data.token); setUser(data.user);
      localStorage.setItem("dha_token",data.token); localStorage.setItem("dha_user",JSON.stringify(data.user));
      setNotice(authMode==="login" ? "Welcome back." : "Account created. Your role is Contributor.");
    } catch(e) { setError(e.message); }
  }
  function logout() {
    setToken(""); setUser(null); localStorage.removeItem("dha_token"); localStorage.removeItem("dha_user");
    setSites([]); setReports([]); setPage("Overview");
  }
  async function saveSite(e) {
    e.preventDefault(); setError("");
    try {
      await api("/sites",{method:"POST",body:JSON.stringify(siteForm)});
      setModal(""); setSiteForm(blankSite); setNotice("Heritage site saved."); await loadData(); setPage("Sites");
    } catch(e) { setError(e.message); }
  }
  async function saveReport(e) {
    e.preventDefault(); setError("");
    try {
      await api("/reports",{method:"POST",body:JSON.stringify(reportForm)});
      setModal(""); setReportForm(blankReport); setNotice("Report saved."); await loadData(); setPage("Reports");
    } catch(e) { setError(e.message); }
  }
  async function uploadFiles(e) {
    e.preventDefault(); setError("");
    if (!files.length) return setError("Choose at least one file.");
    const form = new FormData();
    [...files].forEach(f=>form.append("files",f));
    form.append("siteId",selectedSite || ""); form.append("category","site-documentation");
    try {
      await api("/uploads",{method:"POST",body:form});
      setNotice("Upload complete."); setModal(""); setFiles([]); await loadData();
    } catch(e) { setError(e.message); }
  }
  const filteredSites = useMemo(()=>sites.filter(s=>`${s.name} ${s.district||""} ${s.state||""}`.toLowerCase().includes(query.toLowerCase())),[sites,query]);
  const stats = [
    {label:"Documented sites",value:sites.length,icon:Landmark,detail:"All accessible records"},
    {label:"Awaiting review",value:sites.filter(s=>s.status==="pending").length,icon:Eye,detail:"Pending submissions"},
    {label:"Research reports",value:reports.length,icon:FileText,detail:"Reports saved"},
    {label:"Approved sites",value:sites.filter(s=>s.status==="approved").length,icon:ShieldCheck,detail:"Reviewed records"}
  ];

  if (!token) return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} submitAuth={submitAuth} error={error} />;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Landmark size={23}/></div><div><b>Heritage Atlas</b><small>RESEARCH WORKSPACE</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{[
        ["Overview",LayoutDashboard],["Heritage Sites",Landmark],["Reports",FileText],["Media Library",Images],["3D Model Viewer",Box],["Team & Access",Users]
      ].map(([label,Icon])=><button key={label} className={`nav-item ${page===label || (label==="Heritage Sites"&&page==="Sites")?"active":""}`} onClick={()=>setPage(label==="Heritage Sites"?"Sites":label)}><Icon size={18}/><span>{label}</span>{label==="Reports"&&reports.length>0&&<em>{reports.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item" onClick={()=>setPage("Settings")}><Settings size={18}/>Settings</button><div className="profile"><div className="avatar">{user?.name?.[0]?.toUpperCase()||"U"}</div><div className="profile-text"><b>{user?.name||"User"}</b><small>{user?.role||"contributor"}</small></div><button className="icon-btn" title="Log out" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="crumb"><span>Workspace</span><b>/</b><strong>{page==="Sites"?"Heritage Sites":page}</strong></div><div className="top-actions"><div className="searchbox"><Search size={17}/><input placeholder="Search this workspace..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌘ K</kbd></div><button className="icon-btn notification" title="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{user?.name?.[0]?.toUpperCase()||"U"}</div></div></header>
      <div className="content">
        {error&&<div className="alert error"><X size={16}/>{error}<button onClick={()=>setError("")}>Dismiss</button></div>}
        {notice&&<div className="alert success">{notice}<button onClick={()=>setNotice("")}>Dismiss</button></div>}
        {loading&&<div className="loading"><LoaderCircle className="spin"/> Loading workspace…</div>}
        {page==="Overview"&&<Overview user={user} stats={stats} sites={sites} reports={reports} onAddSite={()=>setModal("site")} onAddReport={()=>setModal("report")} onUpload={()=>setModal("upload")} onOpenSite={s=>{setSelectedSite(s._id);setModal("detail");}} />}
        {page==="Sites"&&<SitesPage sites={filteredSites} onAdd={()=>setModal("site")} onOpen={s=>{setSelectedSite(s._id);setModal("detail");}} />}
        {page==="Reports"&&<ReportsPage reports={reports} sites={sites} onAdd={()=>setModal("report")} />}
        {page==="Media Library"&&<MediaPage sites={sites} onUpload={()=>setModal("upload")} onChoose={id=>{setSelectedSite(id);setModal("upload");}} />}
        {page==="3D Model Viewer"&&<ModelPage sites={sites} onUpload={()=>setModal("upload")} />}
        {page==="Team & Access"&&<InfoPage title="Team & access" text="Each registered account starts as a Contributor. Role-based server checks are included; administrator assignment must be done through a trusted process, not public registration." />}
        {page==="Settings"&&<InfoPage title="Workspace settings" text="This starter uses local browser login storage for the development session. Before deployment, configure secure cookie-based sessions, HTTPS, backups, and private file storage." />}
      </div>
    </main>

    {modal==="site"&&<Modal title="Add heritage site" close={()=>setModal("")}><form className="form-grid" onSubmit={saveSite}>
      <Field label="Site name *" required value={siteForm.name} onChange={v=>setSiteForm({...siteForm,name:v})} placeholder="e.g. Historic Baoli"/>
      <Field label="State" value={siteForm.state} onChange={v=>setSiteForm({...siteForm,state:v})}/>
      <Field label="District" value={siteForm.district} onChange={v=>setSiteForm({...siteForm,district:v})}/>
      <Field label="Village / town" value={siteForm.village} onChange={v=>setSiteForm({...siteForm,village:v})}/>
      <Field label="Architectural style" value={siteForm.architecturalStyle} onChange={v=>setSiteForm({...siteForm,architecturalStyle:v})}/>
      <Field label="Construction materials" value={siteForm.constructionMaterials} onChange={v=>setSiteForm({...siteForm,constructionMaterials:v})}/>
      <Field label="Protection / registration status" value={siteForm.protectionStatus} onChange={v=>setSiteForm({...siteForm,protectionStatus:v})}/>
      <label className="field full"><span>Historical background</span><textarea value={siteForm.historicalBackground} onChange={e=>setSiteForm({...siteForm,historicalBackground:e.target.value})} rows="3" placeholder="Add history and sources..."/></label>
      <label className="field full"><span>Cultural significance</span><textarea value={siteForm.significance} onChange={e=>setSiteForm({...siteForm,significance:e.target.value})} rows="2"/></label>
      <label className="field full"><span>Current condition and visible damage</span><textarea value={siteForm.condition} onChange={e=>setSiteForm({...siteForm,condition:e.target.value})} rows="2"/></label>
      <label className="field full"><span>Conservation recommendations</span><textarea value={siteForm.conservationRecommendations} onChange={e=>setSiteForm({...siteForm,conservationRecommendations:e.target.value})} rows="2"/></label>
      <label className="field full"><span>References / citations</span><textarea value={siteForm.references} onChange={e=>setSiteForm({...siteForm,references:e.target.value})} rows="2"/></label>
      <div className="form-actions full"><button type="button" className="btn secondary" onClick={()=>setModal("")}>Cancel</button><button className="btn primary">Save site</button></div>
    </form></Modal>}
    {modal==="report"&&<Modal title="Create research report" close={()=>setModal("")}><form className="form-grid" onSubmit={saveReport}>
      <Field label="Report title *" required value={reportForm.title} onChange={v=>setReportForm({...reportForm,title:v})} placeholder="e.g. North wall condition assessment"/>
      <label className="field"><span>Heritage site *</span><select required value={reportForm.site} onChange={e=>setReportForm({...reportForm,site:e.target.value})}><option value="">Choose a site</option>{sites.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}</select></label>
      <label className="field"><span>Report type</span><select value={reportForm.reportType} onChange={e=>setReportForm({...reportForm,reportType:e.target.value})}>{["Architectural assessment","Material testing","Research report"].map(x=><option key={x}>{x}</option>)}</select></label>
      <Field label="Inspection date" type="date" value={reportForm.inspectionDate} onChange={v=>setReportForm({...reportForm,inspectionDate:v})}/>
      <Field label="Material type" value={reportForm.materialType} onChange={v=>setReportForm({...reportForm,materialType:v})} placeholder="Brick, stone, wood…"/>
      <Field label="Test method" value={reportForm.testMethod} onChange={v=>setReportForm({...reportForm,testMethod:v})}/>
      <Field label="Equipment used" value={reportForm.equipment} onChange={v=>setReportForm({...reportForm,equipment:v})}/>
      <label className="field full"><span>Measurements and units</span><textarea value={reportForm.measurements} onChange={e=>setReportForm({...reportForm,measurements:e.target.value})} rows="2" placeholder="Enter actual readings and units only"/></label>
      <label className="field full"><span>Observations</span><textarea value={reportForm.observations} onChange={e=>setReportForm({...reportForm,observations:e.target.value})} rows="2"/></label>
      <label className="field full"><span>Limitations</span><textarea value={reportForm.limitations} onChange={e=>setReportForm({...reportForm,limitations:e.target.value})} rows="2"/></label>
      <label className="field full"><span>Recommendations</span><textarea value={reportForm.recommendations} onChange={e=>setReportForm({...reportForm,recommendations:e.target.value})} rows="2"/></label>
      <label className="field full"><span>References</span><textarea value={reportForm.references} onChange={e=>setReportForm({...reportForm,references:e.target.value})} rows="2"/></label>
      <div className="form-actions full"><button type="button" className="btn secondary" onClick={()=>setModal("")}>Cancel</button><button className="btn primary">Save report</button></div>
    </form></Modal>}
    {modal==="upload"&&<Modal title="Upload media and models" close={()=>setModal("")}><form className="upload-form" onSubmit={uploadFiles}>
      <p>Choose a heritage site to associate these files with. Supported formats include common images, documents, and 3D assets. Maximum 50 MB per file.</p>
      <label className="field"><span>Heritage site</span><select value={selectedSite||""} onChange={e=>setSelectedSite(e.target.value)}><option value="">Not linked to a site</option>{sites.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}</select></label>
      <label className="dropzone"><Upload size={26}/><b>Choose files to upload</b><span>JPG, PNG, WEBP, TIFF, PDF, DOCX, GLB, GLTF, OBJ, STL, PLY, FBX</span><input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,.pdf,.doc,.docx,.txt,.glb,.gltf,.obj,.stl,.ply,.fbx,.3mf,.bin,.mtl" onChange={e=>setFiles(e.target.files)}/></label>
      {files.length>0&&<div className="selected-files">{[...files].map(f=><div key={f.name}><FileText size={15}/>{f.name}<small>{(f.size/1024/1024).toFixed(2)} MB</small></div>)}</div>}
      <div className="form-actions"><button type="button" className="btn secondary" onClick={()=>setModal("")}>Cancel</button><button className="btn primary">Upload files</button></div>
    </form></Modal>}
    {modal==="detail"&&<Modal title="Heritage site details" close={()=>setModal("")}>{(()=>{const s=sites.find(x=>x._id===selectedSite);return s?<div className="detail-body"><span className={`status ${s.status}`}>{s.status}</span><h3>{s.name}</h3><p><MapPin size={15}/> {[s.village,s.district,s.state].filter(Boolean).join(", ")||"Location not entered"}</p><h4>History</h4><p>{s.historicalBackground||"No historical background entered."}</p><h4>Architecture</h4><p>{s.architecturalStyle||"Not documented"} · Materials: {s.constructionMaterials||"Not documented"}</p><h4>Condition</h4><p>{s.condition||"Not documented"}</p><h4>References</h4><p>{s.references||"No references added."}</p><button className="btn primary" onClick={()=>setModal("upload")}>Upload related files</button></div>:<p>Site not found.</p>})()}</Modal>}
  </div>;
}

function AuthScreen({authMode,setAuthMode,authForm,setAuthForm,submitAuth,error}) {
  return <div className="auth-shell"><div className="auth-art"><div className="brand light"><div className="brand-mark"><Landmark size={23}/></div><div><b>Heritage Atlas</b><small>DIGITAL PRESERVATION PLATFORM</small></div></div><div className="art-copy"><span className="eyebrow">DOCUMENT · PRESERVE · DISCOVER</span><h1>Every heritage site has a story worth preserving.</h1><p>Bring historical records, architectural documentation and 3D heritage models together in one research workspace.</p><div className="art-stats"><div><b>01</b><span>Document history</span></div><div><b>02</b><span>Capture condition</span></div><div><b>03</b><span>Preserve digitally</span></div></div></div><div className="art-foot">A digital workspace for heritage research and conservation.</div></div><div className="auth-panel"><form className="auth-card" onSubmit={submitAuth}><div className="mobile-brand"><Landmark/> Heritage Atlas</div><span className="eyebrow">{authMode==="login"?"WELCOME BACK":"CREATE YOUR ACCOUNT"}</span><h2>{authMode==="login"?"Sign in to workspace":"Join the workspace"}</h2><p>{authMode==="login"?"Continue your heritage documentation work.":"Create an account to contribute to heritage documentation."}</p>{error&&<div className="alert error">{error}</div>}{authMode==="register"&&<Field label="Full name" required value={authForm.name} onChange={v=>setAuthForm({...authForm,name:v})} placeholder="Your full name"/>}<Field label="Email address" required type="email" value={authForm.email} onChange={v=>setAuthForm({...authForm,email:v})} placeholder="you@example.com"/><Field label="Password" required type="password" value={authForm.password} onChange={v=>setAuthForm({...authForm,password:v})} placeholder="At least 8 characters"/><button className="btn primary wide">{authMode==="login"?"Sign in":"Create account"}</button><div className="auth-switch">{authMode==="login"?"New to Heritage Atlas?":"Already have an account?"}<button type="button" onClick={()=>setAuthMode(authMode==="login"?"register":"login")}>{authMode==="login"?"Create account":"Sign in"}</button></div><small className="security-note"><ShieldCheck size={14}/> Your research workspace is protected by account authentication.</small></form></div></div>;
}
function Field({label,value,onChange,type="text",placeholder="",required=false}) { return <label className="field"><span>{label}</span><input type={type} required={required} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>; }
function Modal({title,close,children}) { return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="modal"><header><h2>{title}</h2><button className="icon-btn" onClick={close}><X size={19}/></button></header>{children}</section></div>; }
function Overview({user,stats,sites,reports,onAddSite,onAddReport,onUpload,onOpenSite}) {
  return <><div className="page-heading"><div><span className="eyebrow">WEDNESDAY, YOUR RESEARCH WORKSPACE</span><h1>Good morning, {user?.name?.split(" ")[0]||"Researcher"} <span>✦</span></h1><p>Here's what's happening across your heritage documentation.</p></div><button className="btn primary" onClick={onAddSite}><Plus size={17}/> Add heritage site</button></div>
    <div className="stat-grid">{stats.map(({label,value,icon:Icon,detail},i)=><div className="stat-card" key={label}><div className={`stat-icon tone-${i}`}><Icon size={19}/></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>)}</div>
    <div className="section-grid"><section className="panel recent-panel"><div className="panel-head"><div><h2>Heritage sites</h2><p>Your latest documented places</p></div><button className="text-btn" onClick={()=>window.dispatchEvent(new CustomEvent("navigate-sites"))}>View all <ArrowUpRight size={15}/></button></div>{sites.length===0?<Empty title="No heritage sites yet" text="Start by adding the first site to your research workspace." action="Add a site" onClick={onAddSite}/>:<div className="site-list">{sites.slice(0,5).map(s=><button className="site-row" key={s._id} onClick={()=>onOpenSite(s)}><div className="site-thumb"><Landmark size={22}/></div><div className="site-meta"><b>{s.name}</b><span><MapPin size={13}/>{[s.district,s.state].filter(Boolean).join(", ")||"Location not specified"}</span></div><span className={`status ${s.status}`}>{s.status}</span><ArrowUpRight size={16} className="row-arrow"/></button>)}</div>}</section>
    <section className="panel actions-panel"><div className="panel-head"><div><h2>Quick actions</h2><p>Continue your documentation</p></div></div><button className="action-row" onClick={onAddSite}><div className="action-icon green"><Landmark size={19}/></div><div><b>Document a site</b><span>Record history and architecture</span></div><Plus size={17}/></button><button className="action-row" onClick={onUpload}><div className="action-icon amber"><Images size={19}/></div><div><b>Upload media</b><span>Photos, documents or 3D assets</span></div><Plus size={17}/></button><button className="action-row" onClick={onAddReport}><div className="action-icon purple"><FileText size={19}/></div><div><b>Create a report</b><span>Architectural or material testing</span></div><Plus size={17}/></button><div className="tip-box"><ShieldCheck size={17}/><p><b>Research integrity</b><br/>Record actual measurements and cite sources. Keep observations separate from tested results.</p></div></section></div>
    <section className="panel report-strip"><div className="panel-head"><div><h2>Recent reports</h2><p>Latest research and condition assessments</p></div><span className="muted-count">{reports.length} total</span></div>{reports.length===0?<Empty title="No reports created" text="Create a report and link it to a heritage site." action="Create report" onClick={onAddReport}/>:<div className="report-list">{reports.slice(0,4).map(r=><div className="report-row" key={r._id}><div className="report-file"><FileText size={19}/></div><div className="report-meta"><b>{r.title}</b><span>{r.site?.name||"Heritage site"} · {r.reportType}</span></div><small>{r.inspectionDate||new Date(r.createdAt).toLocaleDateString()}</small></div>)}</div>}</section>
  </>;
}
function SitesPage({sites,onAdd,onOpen}) { return <><div className="page-heading"><div><span className="eyebrow">DOCUMENTATION DIRECTORY</span><h1>Heritage sites</h1><p>Explore and manage historical site records.</p></div><button className="btn primary" onClick={onAdd}><Plus size={17}/> Add site</button></div>{sites.length===0?<div className="panel empty-panel"><Empty title="No matching sites" text="Add a site or change your search query." action="Add a heritage site" onClick={onAdd}/></div>:<div className="sites-grid">{sites.map(s=><button className="site-card" key={s._id} onClick={()=>onOpen(s)}><div className="site-card-art"><Landmark size={31}/><span className={`status ${s.status}`}>{s.status}</span></div><div className="site-card-body"><h3>{s.name}</h3><p><MapPin size={14}/>{[s.village,s.district,s.state].filter(Boolean).join(", ")||"Location not specified"}</p><div className="card-divider"/><span>{s.architecturalStyle||"Architectural style not recorded"}</span></div></button>)}</div>}</>; }
function ReportsPage({reports,sites,onAdd}) { return <><div className="page-heading"><div><span className="eyebrow">RESEARCH DOCUMENTS</span><h1>Reports</h1><p>Create structured architectural, material-testing and research reports.</p></div><button className="btn primary" onClick={onAdd} disabled={!sites.length}><Plus size={17}/> Create report</button></div>{!sites.length&&<div className="alert">Add a heritage site before creating a report.</div>}<div className="panel table-panel"><div className="panel-head"><div><h2>All reports</h2><p>Measurements and observations entered by your team</p></div></div>{reports.length===0?<Empty title="No reports yet" text="Your saved reports will appear here." action="Create report" onClick={onAdd}/>:<div className="table-wrap"><table><thead><tr><th>Report</th><th>Heritage site</th><th>Type</th><th>Inspection date</th><th>Created by</th></tr></thead><tbody>{reports.map(r=><tr key={r._id}><td><b>{r.title}</b><small>{r.materialType||"General assessment"}</small></td><td>{r.site?.name||"—"}</td><td>{r.reportType}</td><td>{r.inspectionDate||"—"}</td><td>{r.createdBy?.name||"—"}</td></tr>)}</tbody></table></div>}</div></>; }
function MediaPage({sites,onUpload,onChoose}) { return <><div className="page-heading"><div><span className="eyebrow">DIGITAL ASSETS</span><h1>Media library</h1><p>Upload images, documents, and 3D files linked to your sites.</p></div><button className="btn primary" onClick={onUpload}><Upload size={17}/> Upload files</button></div><div className="panel"><div className="panel-head"><div><h2>Choose a heritage site</h2><p>Uploads can be associated with a specific site.</p></div></div>{sites.length===0?<Empty title="No sites available" text="Create a heritage site first, or upload files without linking them." action="Upload files" onClick={onUpload}/>:<div className="media-site-list">{sites.map(s=><button className="media-site" key={s._id} onClick={()=>onChoose(s._id)}><div className="site-thumb"><Images size={21}/></div><div><b>{s.name}</b><span>{s.district||s.state||"Site record"}</span></div><Upload size={16}/></button>)}</div>}</div></>; }
function ModelPage({sites,onUpload}) { const [modelUrl,setModelUrl]=useState(""); return <><div className="page-heading"><div><span className="eyebrow">SPATIAL DOCUMENTATION</span><h1>3D model viewer</h1><p>Preview GLB and glTF models in your browser.</p></div><button className="btn primary" onClick={onUpload}><Upload size={17}/> Upload model</button></div><div className="panel viewer-panel"><div className="viewer-heading"><div><h2>Interactive model preview</h2><p>For reliable single-file viewing, use .glb. glTF files may need associated assets.</p></div></div><div className="model-drop"><Box size={35}/><b>Load a local GLB model</b><span>Choose a .glb file from your computer for a temporary preview.</span><input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={e=>{const f=e.target.files?.[0];if(f){if(modelUrl)URL.revokeObjectURL(modelUrl);setModelUrl(URL.createObjectURL(f));}}}/></div>{modelUrl&&<model-viewer src={modelUrl} camera-controls auto-rotate shadow-intensity="1" style={{width:"100%",height:"440px",background:"#f3f5f2",borderRadius:"14px"}}><span slot="progress-bar">Loading model…</span></model-viewer>}<div className="viewer-note"><ShieldCheck size={17}/><span>Local preview is temporary and does not upload the model. Use Upload model to store it on the server.</span></div></div><div className="format-grid">{[[".glb","Recommended","Geometry, materials and textures can be packaged together."],[".gltf","May need assets","Often references separate .bin and texture files."],[".obj / .fbx / .stl","Asset storage","This starter stores these formats; direct preview is not implemented for all of them."]].map(x=><div className="format-card" key={x[0]}><Box size={19}/><b>{x[0]}</b><span className="format-label">{x[1]}</span><p>{x[2]}</p></div>)}</div></>; }
function InfoPage({title,text}) { return <><div className="page-heading"><div><span className="eyebrow">WORKSPACE</span><h1>{title}</h1><p>Manage the way your research team works.</p></div></div><div className="panel info-panel"><ShieldCheck size={28}/><h2>About this starter</h2><p>{text}</p></div></>; }
function Empty({title,text,action,onClick}) { return <div className="empty-state"><div className="empty-icon"><Landmark size={23}/></div><b>{title}</b><p>{text}</p>{action&&<button className="btn secondary small" onClick={onClick}>{action}</button>}</div>; }
