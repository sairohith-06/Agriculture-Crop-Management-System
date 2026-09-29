import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

const iconPaths = {
  dashboard: "M4 11 12 4l8 7v8H4zM9 20v-6h6v6",
  farmers: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 3.2a4 4 0 0 1 0 7.6",
  fields: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5M8 9h.01M12 9h.01M16 9h.01",
  crops: "M12 21V9M12 13c-4 0-7-2-8-6 4-.4 7 1 8 4 1-3 4-4.4 8-4-1 4-4 6-8 6Z",
  cultivation: "M3 18h18M5 18l2-7h10l2 7M9 11V7h6v4M4 21h3M17 21h3",
  irrigation: "M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z",
  fertilizer: "M9 3h6M10 3v5l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8",
  harvest: "M4 7h16v13H4zM8 7V4h8v3M8 11h8M8 15h5",
  search: "m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  edit: "m4 16-1 4 4-1L18 8l-3-3L4 16ZM13.5 6.5l3 3",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M4 6h16M4 12h16M4 18h16",
  database: "M4 6c0-2 16-2 16 0v12c0 2-16 2-16 0V6Zm0 6c0 2 16 2 16 0M4 6c0 2 16 2 16 0",
  leaf: "M20 4C10 4 4 9 4 16c0 3 2 4 4 4 7 0 12-6 12-16ZM4 20c3-5 7-8 12-10",
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPaths[name] || iconPaths.leaf} />
    </svg>
  );
}

const idFields = {
  Farmers: "farmer_id", Fields: "field_id", Crops: "crop_id",
  Cultivation: "cultivation_id", Irrigation: "irrigation_id",
  Fertilizer: "fertilizer_id", Harvest: "harvest_id",
};

const endpoints = {
  Farmers: "farmers", Fields: "fields", Crops: "crops",
  Cultivation: "cultivations", Irrigation: "irrigations",
  Fertilizer: "fertilizers", Harvest: "harvests",
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [farmers, setFarmers] = useState([]);
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [cultivations, setCultivations] = useState([]);
  const [irrigations, setIrrigations] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalPage, setModalPage] = useState("");
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const collections = [
    ["farmers", setFarmers], ["fields", setFields], ["crops", setCrops],
    ["cultivations", setCultivations], ["irrigations", setIrrigations],
    ["fertilizers", setFertilizers], ["harvests", setHarvests],
  ];

  const loadData = async () => {
    setLoading(true);
    await Promise.all(collections.map(async ([name, setter]) => {
      try {
        const r = await fetch(`${API}/${name}`);
        if (r.ok) setter(await r.json());
      } catch (e) {
        console.error(`${name} API failed`, e);
      }
    }));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const navigate = (page) => {
    setActivePage(page);
    setSearchTerm("");
    setSidebarOpen(false);
  };

  const farmerName = (id) =>
    farmers.find(x => Number(x.farmer_id) === Number(id))?.farmer_name || `Farmer #${id}`;

  const fieldName = (id) =>
    fields.find(x => Number(x.field_id) === Number(id))?.field_name || `Field #${id}`;

  const cropName = (id) =>
    crops.find(x => Number(x.crop_id) === Number(id))?.crop_name || `Crop #${id}`;

  const cultivationName = (id) => {
    const c = cultivations.find(x => Number(x.cultivation_id) === Number(id));
    return c ? `${cropName(c.crop_id)} · ${fieldName(c.field_id)}` : `Cultivation #${id}`;
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "farmer_id") return `${farmerName(value)} (#${value})`;
    if (key === "field_id") return `${fieldName(value)} (#${value})`;
    if (key === "crop_id") return `${cropName(value)} (#${value})`;
    if (key === "cultivation_id") return cultivationName(value);
    return String(value);
  };

  const dateOnly = (v) => v ? String(v).slice(0, 10) : "—";

  const formConfig = (page) => ({
    Farmers: {
      title: editingId ? "Edit Farmer" : "Add Farmer",
      fields: [
        ["farmer_name","Farmer Name","text",true],["phone","Phone Number","text",false],["village","Village","text",true]
      ]
    },
    Fields: {
      title: editingId ? "Edit Field" : "Add Field",
      fields: [
        ["farmer_id","Farmer","select",true,farmers.map(x=>[x.farmer_id,`${x.farmer_name} (#${x.farmer_id})`])],
        ["field_name","Field Name","text",true],["area_acres","Area (Acres)","number",true],
        ["soil_type","Soil Type","text",false],["irrigation_type","Irrigation Type","text",false]
      ]
    },
    Crops: {
      title: editingId ? "Edit Crop" : "Add Crop",
      fields: [
        ["crop_name","Crop Name","text",true],["crop_type","Crop Type","text",false],
        ["season","Season","text",false],["duration_days","Duration (Days)","number",false]
      ]
    },
    Cultivation: {
      title: editingId ? "Edit Cultivation" : "Add Cultivation",
      fields: [
        ["field_id","Field","select",true,fields.map(x=>[x.field_id,`${x.field_name} (#${x.field_id})`])],
        ["crop_id","Crop","select",true,crops.map(x=>[x.crop_id,`${x.crop_name} (#${x.crop_id})`])],
        ["sowing_date","Sowing Date","date",true],["expected_harvest_date","Expected Harvest Date","date",false],
        ["quantity_planted","Quantity Planted","number",false],
        ["status","Status","select",false,[["Active","Active"],["Completed","Completed"],["Cancelled","Cancelled"]]]
      ]
    },
    Irrigation: {
      title: editingId ? "Edit Irrigation" : "Add Irrigation",
      fields: [
        ["cultivation_id","Cultivation","select",true,cultivations.map(x=>[x.cultivation_id,cultivationName(x.cultivation_id)])],
        ["irrigation_date","Irrigation Date","date",true],["water_quantity","Water Quantity","number",false],
        ["method","Method","text",false],["remarks","Remarks","text",false]
      ]
    },
    Fertilizer: {
      title: editingId ? "Edit Fertilizer" : "Add Fertilizer",
      fields: [
        ["cultivation_id","Cultivation","select",true,cultivations.map(x=>[x.cultivation_id,cultivationName(x.cultivation_id)])],
        ["fertilizer_name","Fertilizer Name","text",true],["quantity","Quantity","number",false],
        ["application_date","Application Date","date",true],["remarks","Remarks","text",false]
      ]
    },
    Harvest: {
      title: editingId ? "Edit Harvest" : "Add Harvest",
      fields: [
        ["cultivation_id","Cultivation","select",true,cultivations.map(x=>[x.cultivation_id,cultivationName(x.cultivation_id)])],
        ["harvest_date","Harvest Date","date",true],["quantity_harvested","Quantity Harvested","number",false],
        ["quality_grade","Quality Grade","text",false],["selling_price","Selling Price","number",false],["remarks","Remarks","text",false]
      ]
    }
  }[page]);

  const openAdd = (page) => {
    setModalPage(page); setEditingId(null);
    const initial = {};
    formConfig(page).fields.forEach(([name]) => initial[name] = name === "status" ? "Active" : "");
    setFormData(initial); setShowModal(true);
  };

  const openEdit = (page, item) => {
    const copy = {...item};
    Object.keys(copy).forEach(k => { if (k.includes("date") && copy[k]) copy[k] = String(copy[k]).slice(0,10); });
    setModalPage(page); setEditingId(item[idFields[page]]); setFormData(copy); setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {...formData};
      ["farmer_id","area_acres","duration_days","field_id","crop_id","quantity_planted","cultivation_id","water_quantity","quantity","quantity_harvested","selling_price"]
        .forEach(k => { if (payload[k] !== undefined && payload[k] !== "") payload[k] = Number(payload[k]); });
      Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });
      const endpoint = endpoints[modalPage];
      const editing = editingId !== null;
      const url = editing ? `${API}/${endpoint}/${editingId}` : `${API}/${endpoint}`;
      const r = await fetch(url, { method: editing ? "PUT":"POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (!r.ok) {
        let msg = `Unable to ${editing ? "update":"add"} ${modalPage}`;
        try { const d = await r.json(); if (d.detail) msg = typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail); } catch {}
        throw new Error(msg);
      }
      setShowModal(false); setEditingId(null); setFormData({}); await loadData();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const remove = async (page, item) => {
    const id = item[idFields[page]];
    if (!window.confirm(`Delete this ${page.slice(0,-1).toLowerCase()}?\n\nID: ${id}`)) return;
    try {
      const r = await fetch(`${API}/${endpoints[page]}/${id}`, {method:"DELETE"});
      if (!r.ok) { let msg=`Unable to delete ${page}`; try { const d=await r.json(); if(d.detail) msg=typeof d.detail==="string"?d.detail:JSON.stringify(d.detail); } catch{} throw new Error(msg); }
      await loadData();
    } catch(e) { alert(e.message); }
  };

  const menu = [
    ["Dashboard","dashboard"],["Farmers","farmers"],["Fields","fields"],["Crops","crops"],
    ["Cultivation","cultivation"],["Irrigation","irrigation"],["Fertilizer","fertilizer"],["Harvest","harvest"]
  ];

  const stat = (label,value,icon,tone,note) => (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon name={icon} size={18}/></div>
      <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
    </div>
  );

  const dashboard = () => {
    const active = cultivations.filter(x=>String(x.status||"").toLowerCase()==="active").length;
    const completed = cultivations.filter(x=>String(x.status||"").toLowerCase()==="completed").length;
    const area = fields.reduce((s,x)=>s+Number(x.area_acres||0),0);
    const water = irrigations.reduce((s,x)=>s+Number(x.water_quantity||0),0);
    const harvestQty = harvests.reduce((s,x)=>s+Number(x.quantity_harvested||0),0);
    const sales = harvests.reduce((s,x)=>s+Number(x.selling_price||0),0);

    return <>
      <div className="hero-row">
        <div><span className="eyebrow"><Icon name="leaf" size={13}/> SMART AGRICULTURE MANAGEMENT</span><h1>Good evening, Admin.</h1><p>Here's what's happening across your agricultural operations.</p></div>
        <button className="btn primary" onClick={()=>openAdd("Cultivation")}><Icon name="plus" size={16}/> Add cultivation</button>
      </div>

      <div className="stats-grid">
        {stat("Total Farmers",farmers.length,"farmers","green","Registered farmers")}
        {stat("Total Fields",fields.length,"fields","olive",`${area.toFixed(1)} acres managed`)}
        {stat("Total Crops",crops.length,"crops","sage","Crop varieties")}
        {stat("Cultivations",cultivations.length,"cultivation","gold",`${active} currently active`)}
        {stat("Irrigation",irrigations.length,"irrigation","blue",`${water.toLocaleString()} water units`)}
        {stat("Harvest Records",harvests.length,"harvest","amber",`${harvestQty.toLocaleString()} units harvested`)}
      </div>

      <div className="grid-two">
        <section className="card">
          <div className="card-head"><div><span className="kicker">OPERATIONS</span><h2>Agricultural overview</h2></div><button className="link-btn" onClick={()=>navigate("Cultivation")}>View records <Icon name="arrow" size={14}/></button></div>
          <div className="overview-body">
            <div className="ring"><div><strong>{cultivations.length}</strong><span>cultivations</span></div></div>
            <div className="status-list">
              <div><span><i className="dot active"/>Active</span><b>{active}</b></div>
              <div><span><i className="dot complete"/>Completed</span><b>{completed}</b></div>
              <div><span><i className="dot neutral"/>Other</span><b>{Math.max(cultivations.length-active-completed,0)}</b></div>
            </div>
          </div>
          <div className="metric-strip"><div><span>Area managed</span><b>{area.toFixed(1)} ac</b></div><div><span>Water usage</span><b>{water.toLocaleString()}</b></div><div><span>Harvest value</span><b>₹{sales.toLocaleString("en-IN")}</b></div></div>
        </section>

        <section className="card">
          <div className="card-head"><div><span className="kicker">CROP CATALOG</span><h2>Crop overview</h2></div><button className="icon-btn" onClick={()=>navigate("Crops")}><Icon name="arrow" size={15}/></button></div>
          <div className="crop-list">
            {crops.slice(0,5).map(c=><button className="crop-row" key={c.crop_id} onClick={()=>navigate("Crops")}><span className="crop-icon"><Icon name="crops" size={16}/></span><span><b>{c.crop_name}</b><small>{c.crop_type||"Crop"} · {c.season||"Season not set"}</small></span><em>{c.duration_days ? `${c.duration_days}d` : "—"}</em></button>)}
            {!crops.length && <div className="empty-inline">No crops added yet.</div>}
          </div>
        </section>
      </div>

      <div className="grid-two">
        <section className="card">
          <div className="card-head"><div><span className="kicker">RECENT ACTIVITY</span><h2>Recent farmers</h2></div><button className="link-btn" onClick={()=>navigate("Farmers")}>View all <Icon name="arrow" size={14}/></button></div>
          <div className="table-wrap"><table><thead><tr><th>Farmer</th><th>Village</th><th>Phone</th></tr></thead><tbody>
            {[...farmers].sort((a,b)=>Number(b.farmer_id)-Number(a.farmer_id)).slice(0,5).map(f=><tr key={f.farmer_id}><td><div className="person"><span className="avatar">{f.farmer_name?.charAt(0).toUpperCase()}</span><span><b>{f.farmer_name}</b><small>#{f.farmer_id}</small></span></div></td><td>{f.village}</td><td>{f.phone||"—"}</td></tr>)}
          </tbody></table></div>
        </section>

        <section className="card">
          <div className="card-head"><div><span className="kicker">PRODUCTION</span><h2>Harvest summary</h2></div><button className="link-btn" onClick={()=>navigate("Harvest")}>View all <Icon name="arrow" size={14}/></button></div>
          <div className="harvest-box"><div><span>Total harvested</span><strong>{harvestQty.toLocaleString()}</strong><small>production units</small></div><div><span>Recorded value</span><strong>₹{sales.toLocaleString("en-IN")}</strong><small>total selling price</small></div></div>
          <div className="mini-list">{harvests.slice(-3).reverse().map(h=><div key={h.harvest_id}><span>{cultivationName(h.cultivation_id)}</span><b>{h.quantity_harvested??0}</b></div>)}{!harvests.length&&<div className="empty-inline">No harvest records yet.</div>}</div>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><div><span className="kicker">LAND MANAGEMENT</span><h2>Field overview</h2></div><button className="link-btn" onClick={()=>navigate("Fields")}>Manage fields <Icon name="arrow" size={14}/></button></div>
        <div className="table-wrap"><table><thead><tr><th>Field</th><th>Farmer</th><th>Area</th><th>Soil</th><th>Irrigation</th></tr></thead><tbody>
          {fields.map(f=><tr key={f.field_id}><td><b>{f.field_name}</b><small className="sub">#{f.field_id}</small></td><td>{farmerName(f.farmer_id)}</td><td>{f.area_acres} ac</td><td><span className="badge">{f.soil_type||"Not set"}</span></td><td>{f.irrigation_type||"—"}</td></tr>)}
        </tbody></table></div>
      </section>
    </>;
  };

  const tablePage = () => {
    const map={Farmers:farmers,Fields:fields,Crops:crops,Cultivation:cultivations,Irrigation:irrigations,Fertilizer:fertilizers,Harvest:harvests};
    const data=map[activePage]||[];
    const filtered=data.filter(item=>Object.values(item).some(v=>String(v??"").toLowerCase().includes(searchTerm.toLowerCase())));
    const singular=activePage==="Farmers"?"Farmer":activePage==="Fields"?"Field":activePage==="Crops"?"Crop":activePage;

    return <>
      <div className="page-head"><div><span className="kicker">{activePage.toUpperCase()}</span><h1>{activePage}</h1><p>Manage and maintain your {activePage.toLowerCase()} records.</p></div><button className="btn primary" onClick={()=>openAdd(activePage)}><Icon name="plus" size={16}/> Add {singular}</button></div>
      <section className="card data-card">
        <div className="toolbar"><div className="search"><Icon name="search" size={16}/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder={`Search ${activePage.toLowerCase()}...`}/></div><span>{filtered.length} of {data.length} records</span></div>
        {loading?<div className="loading"><div/><div/><div/></div>:filtered.length===0?<div className="empty-state"><div className="empty-icon"><Icon name="database" size={22}/></div><h3>No {activePage.toLowerCase()} found</h3><p>Add a record or change your search.</p><button className="btn primary" onClick={()=>openAdd(activePage)}><Icon name="plus" size={15}/> Add {singular}</button></div>:
        <div className="table-wrap"><table className="data-table"><thead><tr>{Object.keys(data[0]).map(k=><th key={k}>{k.replaceAll("_"," ")}</th>)}<th>Actions</th></tr></thead><tbody>
          {filtered.map((item,i)=><tr key={i}>{Object.entries(item).map(([k,v])=><td key={k}>{formatValue(k,v)}</td>)}<td><div className="actions"><button className="row-btn edit" onClick={()=>openEdit(activePage,item)}><Icon name="edit" size={15}/></button><button className="row-btn delete" onClick={()=>remove(activePage,item)}><Icon name="trash" size={15}/></button></div></td></tr>)}
        </tbody></table></div>}
      </section>
    </>;
  };

  const modal = () => {
    if (!showModal) return null;
    const cfg=formConfig(modalPage);
    return <div className="modal-bg" onMouseDown={e=>e.target===e.currentTarget&&setShowModal(false)}>
      <div className="modal">
        <div className="modal-head"><div><span className="kicker">{editingId?"EDIT RECORD":"NEW RECORD"}</span><h2>{cfg.title}</h2><p>Enter the details below.</p></div><button className="icon-btn" onClick={()=>setShowModal(false)}><Icon name="close" size={17}/></button></div>
        <form onSubmit={submit}><div className="form-grid">
          {cfg.fields.map(([name,label,type,required,options])=><label key={name}><span>{label}{required&&<em>*</em>}</span>{type==="select"?<select value={formData[name]??""} onChange={e=>setFormData({...formData,[name]:e.target.value})} required={required}><option value="">Select {label}</option>{options?.map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>:<input type={type} step={type==="number"?"0.01":undefined} value={formData[name]??""} onChange={e=>setFormData({...formData,[name]:e.target.value})} required={required} placeholder={`Enter ${label.toLowerCase()}`}/>}</label>)}
        </div><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>setShowModal(false)}>Cancel</button><button className="btn primary" disabled={saving}>{saving?"Saving...":editingId?"Save changes":`Add ${modalPage}`}</button></div></form>
      </div>
    </div>;
  };

  return <div className="app">
    {sidebarOpen&&<div className="mobile-bg" onClick={()=>setSidebarOpen(false)}/>}
    <aside className={`sidebar ${sidebarOpen?"open":""}`}>
      <div className="brand"><div className="brand-mark"><Icon name="leaf" size={19}/></div><div><b>AgriCrop</b><small>Management platform</small></div></div>
      <div className="nav-title">WORKSPACE</div>
      <nav>{menu.map(([name,icon])=><button key={name} className={activePage===name?"active":""} onClick={()=>navigate(name)}><Icon name={icon} size={18}/><span>{name}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="db-status"><i/><div><b>Oracle Database</b><small>Connected · Live</small></div></div><div className="user"><span className="avatar">S</span><div><b>Administrator</b><small>System Manager</small></div></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setSidebarOpen(true)}><Icon name="menu" size={20}/></button><div className="crumb"><span>Workspace</span><b>/</b><strong>{activePage}</strong></div><div className="top-actions"><div className="quick-search"><Icon name="search" size={15}/><input placeholder="Quick search..." value={activePage==="Dashboard"?"":searchTerm} onChange={e=>activePage!=="Dashboard"&&setSearchTerm(e.target.value)}/></div><button className="icon-btn"><Icon name="bell" size={17}/><i/></button><div className="profile"><span className="avatar">S</span><div><b>Administrator</b><small>System Manager</small></div></div></div></header>
      <div className="content">{activePage==="Dashboard"?dashboard():tablePage()}</div>
    </main>
    {modal()}
  </div>;
}

export default App;
