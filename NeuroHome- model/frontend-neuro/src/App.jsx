import React, { useMemo, useState } from "react";
import RealHome3D from "./RealHome3D";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";const MODEL = { accuracy:"70.07%", balanced:"69.25%", targetF1:"43.59%", threshold:"0.40", channels:32, runs:6, epochs:838, window:"100–700 ms" };

const DEVICES = [
  { id:"light", name:"Light" },
  { id:"telephone", name:"Telephone" },
  { id:"window", name:"Window" },
  { id:"door", name:"Door" },
  { id:"tv", name:"TV" },
  { id:"radio", name:"Radio" }
];

export default function App(){
  const [page,setPage]=useState("Dashboard");
  const [eegFile,setEegFile]=useState(null),[eventsFile,setEventsFile]=useState(null);
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [devices,setDevices]=useState({light:false,telephone:false,window:false,door:false,tv:false,radio:false});
  
function announceCommand(command, confidence) {
  if (!("speechSynthesis" in window) || !command) return;

  const text = String(command).toUpperCase();
  let message = "";

  if (text.includes("LIGHT") && text.includes("ON")) {
    message = "Light switched on.";
  } else if (text.includes("TELEPHONE")) {
    message = "Telephone activated.";
  } else if (text.includes("WINDOW")) {
    message = "Window opened.";
  } else if (text.includes("DOOR")) {
    message = "Door opened.";
  } else if (text.includes("TV") || text.includes("TELEVISION")) {
    message = "Television switched on.";
  } else if (text.includes("RADIO")) {
    message = "Radio switched on.";
  }

  if (!message) return;

  window.speechSynthesis.cancel();

  const confidenceText =
  Number.isFinite(Number(confidence))
    ? ` Confidence level: ${Number(confidence).toFixed(1)} percent.`
    : "";

const utterance = new SpeechSynthesisUtterance(
  message + confidenceText
);

utterance.lang = "en-IN";
utterance.rate = 0.95;

window.speechSynthesis.speak(utterance);
}


  async function predict(){
    if(!eegFile||!eventsFile)return;
    setBusy(true); setError(""); setData(null);
    const form=new FormData();
    form.append("eeg_file",eegFile); form.append("events_file",eventsFile);
    try{
      const res=await fetch(`${API}/predict`,{method:"POST",body:form});
      const json=await res.json();
      console.log("ALL PREDICTIONS:", json.predictions);
      console.log("APPLIANCE ACTIONS:", json.appliance_actions);
      console.log("APPLIANCE STATE:", json.appliance_state);
      if(!res.ok)throw new Error(json.detail||"Prediction failed");
      const synced={light:false,telephone:false,window:false,door:false,tv:false,radio:false,...(json.appliance_state||{})};
      setData(json);
setDevices(synced);
setPage("Smart Home");

const actions = json.appliance_actions || [];
const lastAction = actions[actions.length - 1];

if (lastAction?.command) {
  announceCommand(lastAction.command, lastAction.confidence);
}
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  const latest=data?.predictions?.length?data.predictions[data.predictions.length-1]:null;
  const lastAccepted=data?.appliance_actions?.length?data.appliance_actions[data.appliance_actions.length-1]:null;
  const targetPct=data?.epochs?((data.predicted_target_count/data.epochs)*100).toFixed(1):"—";
  const activeCount=Object.values(devices).filter(Boolean).length;
  const content=useMemo(()=>{
    if(page==="EEG Signal")return <EEGPage {...{eegFile,eventsFile,data,busy,error,setEegFile,setEventsFile,predict}}/>;
    if(page==="Brain Response")return <BrainPage data={data} latest={latest}/>;
    if(page==="Smart Home")return <SmartHome devices={devices} activeCount={activeCount} lastAccepted={lastAccepted} data={data}/>;
    if(page==="3D Home")return <RealHome3D devices={devices}/>;
    if(page==="Model Results")return <ModelPage/>;
    return <Dashboard data={data} targetPct={targetPct} latest={latest} lastAccepted={lastAccepted} setPage={setPage}/>;
  },[page,data,latest,lastAccepted,eegFile,eventsFile,busy,error,devices,activeCount,targetPct]);

  return <div className="appShell"><aside className="sidebar"><div className="logo">NEURO<span>HOME</span></div><div className="sideTag">P300 BCI SYSTEM</div><nav>{["Dashboard","EEG Signal","Brain Response","Smart Home","3D Home","Model Results"].map(item=><button key={item} className={`navItem ${page===item?"active":""}`} onClick={()=>setPage(item)}><span className="navDot">{item==="Dashboard"?"⌂":item==="EEG Signal"?"∿":item==="Brain Response"?"◌":item==="Smart Home"?"⌁":"◈"}</span>{item}</button>)}</nav><div className="sideBottom"><div className="backend"><i/> Backend connected</div><div className="modelMini">EEGNet · 32 channels<br/>100–700 ms · threshold 0.40</div></div></aside><main className="mainArea"><header className="topbar"><div><div className="pageKicker">NEUROHOME / {page.toUpperCase()}</div><h2>{page}</h2></div><div className="live"><i/> SYSTEM ONLINE</div></header><div className="content">{content}</div></main></div>
}

function Dashboard({data,targetPct,latest,lastAccepted,setPage}){return <><section className="heroGrid"><div className="heroCopy"><div className="eyebrow">BRAIN–COMPUTER INTERFACE</div><h1>NEUROHOME — BRAIN-CONTROLLED SMART HOME</h1><p>P300-based real-time appliance control.</p><button className="primary" onClick={()=>setPage("EEG Signal")}>UPLOAD REAL EEG <b>→</b></button></div><div className="brainCard"><div className="brainRing"><div>EEG<br/><strong>P300</strong></div></div><div className="brainMeta"><span>MODEL</span><strong>EEGNet</strong><span>STATUS</span><strong className="green">READY</strong></div></div></section><section className="statsGrid"><Stat label="ACCURACY" value={MODEL.accuracy} sub="Untouched Run 5"/><Stat label="BALANCED ACC." value={MODEL.balanced} sub="Untouched Run 5"/><Stat label="TARGET F1" value={MODEL.targetF1} sub="P300 target class"/><Stat label="PREDICTED TARGETS" value={data?data.predicted_target_count:"—"} sub={data?`${targetPct}% of epochs`:"Run an EEG analysis"}/></section><section className="twoCol"><Panel title="SYSTEM FLOW"><div className="flow"><Flow n="01" t="REAL EEG"/><b>→</b><Flow n="02" t="PREPROCESS"/><b>→</b><Flow n="03" t="EEGNet"/><b>→</b><Flow n="04" t="TARGET / NON-TARGET"/><b>→</b><Flow n="05" t="ONE APPLIANCE"/></div></Panel><Panel title="LATEST COMMAND"><div className="commandBox"><span>{lastAccepted?.command||"WAITING FOR EEG"}</span><small>{lastAccepted?`${lastAccepted.confidence.toFixed(1)}% confidence`:"No accepted command yet"}</small></div></Panel></section><section className="datasetStrip"><div><span>DATASET</span><strong>6 runs</strong></div><div><span>USABLE EPOCHS</span><strong>838</strong></div><div><span>CHANNELS</span><strong>32</strong></div><div><span>MODEL WINDOW</span><strong>100–700 ms</strong></div><div><span>THRESHOLD</span><strong>0.40</strong></div></section></>}

function EEGPage({eegFile,eventsFile,data,busy,error,setEegFile,setEventsFile,predict}){return <><section className="sectionIntro"><div className="eyebrow">REAL EEG DATASET</div><h1>Run the trained model.</h1><p>Upload the matching BDF and events file. Each 1.5-second window selects the highest-confidence accepted Target and executes its mapped smart-home command once.</p></section><div className="uploadPanel"><label><span>EEG BDF</span><input type="file" accept=".bdf" onChange={e=>setEegFile(e.target.files[0]||null)}/>{eegFile&&<em>{eegFile.name}</em>}</label><label><span>EVENTS TSV</span><input type="file" accept=".tsv,.txt,.csv" onChange={e=>setEventsFile(e.target.files[0]||null)}/>{eventsFile&&<em>{eventsFile.name}</em>}</label><button className="primary analyze" onClick={predict} disabled={!eegFile||!eventsFile||busy}>{busy?"ANALYZING…":"ANALYZE EEG →"}</button></div>{error&&<div className="error">{error}</div>}<div className="infoGrid"><Info label="RAW SAMPLING" value="2048 Hz"/><Info label="MODEL SAMPLING" value="256 Hz"/><Info label="EPOCH" value="−0.2 to 0.8 s"/><Info label="MODEL WINDOW" value="100–700 ms"/></div>{data&&<ResultSummary data={data}/>}</>}

function BrainPage({data,latest}){const predictions=data?.predictions||[];const selected=data?.appliance_actions?.length?data.appliance_actions[data.appliance_actions.length-1]:null;const c=selected?selected.confidence:null;return <><section className="sectionIntro"><div className="eyebrow">BRAIN RESPONSE</div><h1>P300 prediction timeline.</h1><p>The model classifies each EEG epoch as Target or Non-Target.</p></section><div className="responseCards"><Stat label="TARGETS" value={data?.predicted_target_count??"—"} sub="P300 detected"/><Stat label="NON-TARGETS" value={data?.predicted_nontarget_count??"—"} sub="background events"/><Stat label="CONFIDENCE" value={c===null?"—":`${c}%`} sub={c===null?"Awaiting EEG":"Highest-confidence accepted epoch"}/></div><Panel title="PREDICTION TIMELINE"><div className="timeline">{predictions.slice(-60).map(p=><div key={p.epoch} className={`bar ${p.label==="Target"?"target":""}`} style={{height:`${Math.max(7,p.probability*100)}%`}} title={`Epoch ${p.epoch}: ${p.label} ${(p.probability*100).toFixed(1)}%`}/>)}{!predictions.length&&<div className="empty">Analyze EEG to populate the timeline.</div>}</div></Panel>{data&&<ResultSummary data={data}/>}</>}

function SmartHome({devices,activeCount,lastAccepted,data}){
  const activeDevices=DEVICES.filter(d=>Boolean(devices[d.id]));
  const latestWindowStart=lastAccepted?.window_start_sec ?? data?.predictions?.[data.predictions.length-1]?.decision_window_start_sec;
  const windowSignals=(data?.predictions||[]).filter(p=>p.decision_window_start_sec===latestWindowStart);
  return <><section className="sectionIntro"><div className="eyebrow">AUTOMATIC SMART HOME</div><h1>Automatic smart-home control.</h1><p>Multiple EEG signals are collected within each 1.5-second window. The highest-confidence signal is selected and executed once.</p></section><div className="deviceGrid">{DEVICES.map(d=><div className={`device device-${d.id} ${devices[d.id]?"on":""}`} key={d.id}><DeviceVisual type={d.id} on={devices[d.id]}/><div><h3>{d.name}</h3><small>{d.id==="door"?(devices[d.id]?"OPEN":"CLOSED"):(devices[d.id]?"ON":"OFF")}</small></div><div className={`autoState ${devices[d.id]?"active":""}`}>{devices[d.id]?"ACTIVE":"STANDBY"}</div></div>)}</div><div className="homeHeader"><div><span>ACTIVE DEVICES</span><strong>{activeCount} / 6</strong></div><div><span>LAST BCI COMMAND</span><strong>{lastAccepted?.command||"WAITING FOR EEG"}</strong></div></div><section className="activeNow"><div className="panelTitle">ACTIVE NOW</div>{activeDevices.length?<div className="activeList">{activeDevices.map(d=><div className="activeItem" key={d.id}><b>{d.name}</b><span>{d.id==="door"?"OPEN":"ON"}</span></div>)}</div>:<div className="empty">No device is active. All six devices are OFF/CLOSED.</div>}</section><div className="mapping"><span><b>LIGHT</b></span><span><b>TELEPHONE</b></span><span><b>WINDOW</b></span><span><b>DOOR</b></span><span><b>TV</b></span><span><b>RADIO</b></span></div><section className="compactNovelty"><div className="compactNoveltyTitle">HIGHEST CONFIDENCE · 1.5 S WINDOW</div><div className="compactWinner"><span><small>EPOCH</small><b>{lastAccepted?.epoch??"—"}</b></span><span><small>COMMAND</small><b>{lastAccepted?.command||"WAITING"}</b></span><span><small>CONFIDENCE</small><b>{lastAccepted?`${Number(lastAccepted.confidence).toFixed(1)}%`:"—"}</b></span><span className="executed"><small>STATUS</small><b>{lastAccepted?"EXECUTED":"WAITING"}</b></span></div><div className="signalTableTitle">ALL SIGNALS CAPTURED IN 1.5 SECONDS</div><div className="signalTable">{windowSignals.length>0?<><div className="signalHeader"><span>Epoch</span><span>Confidence</span></div>{windowSignals.map(row=><div className={`signalRow ${lastAccepted&&row.epoch===lastAccepted.epoch?"winner":""}`} key={row.epoch}><span>{row.epoch}</span><span>{Number(row.confidence).toFixed(1)}%</span></div>)}</>:<div className="empty">Analyze EEG to display all signals from the 1.5-second window.</div>}</div></section></>}

function DeviceVisual({type,on}){
  if(type==="light")return <div className={`deviceVisual bulbVisual ${on?"active":""}`}><div className="bulb"><span/></div><div className="bulbBase"/></div>;
  if(type==="tv")return <div className={`deviceVisual tvVisual ${on?"active":""}`}><div className="tvScreen"><span>{on?"LIVE":"OFF"}</span></div><div className="tvStand"/></div>;
  if(type==="telephone")return <div className={`deviceVisual telephoneVisual ${on?"active":""}`}><div className="phoneBody"><span>☎</span></div>{on&&<div className="callWaves"><i/><i/><i/></div>}</div>;
  if(type==="window")return <div className={`deviceVisual windowVisual ${on?"active":""}`}><div className="windowFrame"><i/><i/><i/><i/></div></div>;
  if(type==="radio")return <div className={`deviceVisual radioVisual ${on?"active":""}`}><div className="radioBox"><span className="radioDial"/><span className="radioLabel">RADIO</span><div className="songSignal"><i/><i/><i/><i/><i/><i/><i/></div></div></div>;
  return <div className={`deviceVisual doorVisual ${on?"open":"closed"}`}><div className="doorFrame"><div className="doorLeaf"><span/></div></div></div>;
}

function ModelPage(){return <><section className="sectionIntro"><div className="eyebrow">MODEL RESULTS</div><h1>EEGNet performance.</h1><p>Final evaluation on the untouched Run 5. These are the model metrics integrated into this prototype.</p></section><section className="metricsLarge"><Metric title="Accuracy" value={MODEL.accuracy}/><Metric title="Balanced Accuracy" value={MODEL.balanced}/><Metric title="Target F1" value={MODEL.targetF1}/></section><div className="twoCol"><Panel title="MODEL CONFIGURATION"><div className="details"><Info label="ARCHITECTURE" value="EEGNet"/><Info label="INPUT" value="32 × 154 × 1"/><Info label="WINDOW" value={MODEL.window}/><Info label="THRESHOLD" value={MODEL.threshold}/><Info label="TRAINING RUNS" value="0–4"/><Info label="TEST RUN" value="5"/></div></Panel><Panel title="CONFUSION MATRIX"><div className="matrix"><div>TRUE \ PRED</div><b>NonTarget</b><b>Target</b><b>NonTarget</b><strong>86</strong><strong>36</strong><b>Target</b><strong>8</strong><strong>17</strong></div></Panel></div></>}
function ResultSummary({data}){return <div className="resultSummary"><span>ANALYSIS COMPLETE</span><strong>{data.epochs} epochs</strong><b>{data.predicted_target_count} Target</b><b>{data.predicted_nontarget_count} Non-Target</b></div>}
function Stat({label,value,sub}){return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>}
function Metric({title,value}){return <div className="metric"><span>{title}</span><strong>{value}</strong><div className="meter"><i style={{width:value.replace('%','')+'%'}}/></div></div>}
function Info({label,value}){return <div className="info"><span>{label}</span><strong>{value}</strong></div>}
function Flow({n,t}){return <div className="flowItem"><small>{n}</small><strong>{t}</strong></div>}
function Panel({title,children}){return <section className="panel"><div className="panelTitle">{title}</div>{children}</section>}


function Home3D({ devices }) {
  return (
    <section className="home3d-page">
      <div className="sectionIntro">
        <div className="eyebrow">NEUROHOME · 3D ENVIRONMENT</div>
        <h1>Your brain-controlled home.</h1>
        <p>
          Watch your home respond to executed EEG appliance commands.
        </p>
      </div>

      <div className="home3d-scene">
        <div className="home3d-room">
          <div className="home3d-backwall">
            <div className={`home3d-window ${devices.window ? "opened" : ""}`}>
              <div className="home3d-glass left" />
              <div className="home3d-glass right" />
              <span>{devices.window ? "OPEN" : "CLOSED"}</span>
            </div>

            <div className={`home3d-door ${devices.door ? "opened" : ""}`}>
              <div className="home3d-door-panel" />
              <span>{devices.door ? "OPEN" : "CLOSED"}</span>
            </div>
          </div>

          <div className="home3d-ceiling-light">
            <div className={`home3d-bulb ${devices.light ? "lit" : ""}`} />
            <span>{devices.light ? "LIGHT ON" : "LIGHT OFF"}</span>
          </div>

          <div className="home3d-floor">
            <div className="home3d-sofa">SOFA</div>

            <div className="home3d-tv">
              <div className={devices.tv ? "screen on" : "screen"}>
                {devices.tv ? "NOW PLAYING" : "POWER OFF"}
              </div>
              <span>TELEVISION</span>
            </div>

            <div className={`home3d-radio ${devices.radio ? "playing" : ""}`}>
              <div className="radio-speaker" />
              <span>{devices.radio ? "PLAYING" : "RADIO OFF"}</span>
            </div>

            <div className={`home3d-phone ${devices.telephone ? "calling" : ""}`}>
              ☎
              <span>{devices.telephone ? "CALL ACTIVE" : "TELEPHONE"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="home3d-status">
        {[
          ["Light", devices.light, "ON", "OFF"],
          ["Window", devices.window, "OPEN", "CLOSED"],
          ["Door", devices.door, "OPEN", "CLOSED"],
          ["TV", devices.tv, "ON", "OFF"],
          ["Radio", devices.radio, "ON", "OFF"],
          ["Telephone", devices.telephone, "ACTIVE", "IDLE"]
        ].map(([name, active, onText, offText]) => (
          <div className="home3d-status-card" key={name}>
            <span>{name}</span>
            <strong className={active ? "active" : ""}>
              {active ? onText : offText}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
