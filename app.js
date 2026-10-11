(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const safeRead = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const today = () => new Date().toLocaleDateString();
  const pageNames = {overview:"Overview",usage:"Digital balance",activity:"Activity",history:"History & trends",band:"Smart band",settings:"Settings"};
  let currentPage = "overview";
  let isRegisterMode = false;
  const history = () => safeRead("livoraHistory", []);
  function showMessage(id, message) { const node=$(id); if(node) node.textContent=message; }
  function getProfile() { return safeRead("livoraProfile", null); }
  function setLoggedIn(profile) {
    safeWrite("livoraSession", {email:profile.email, name:profile.name || profile.email.split("@")[0]});
    renderSession(); navigateTo("overview");
  }
  function updateActivitySummary() {
    const data=safeRead("livoraActivity",null);
    const minutes=data && Number.isFinite(Number(data.minutes)) ? Number(data.minutes) : 0;
    const steps=data && Number.isFinite(Number(data.steps)) ? Number(data.steps) : 0;
    const big=$("activityBig"); if(big) big.textContent=String(minutes);
    const summary=$("activitySummary"); if(summary) summary.textContent=minutes+" min demo";
    const minutesNode=$("activityMinutesSummary"); if(minutesNode) minutesNode.innerHTML=`${minutes} <span style="font-size:13px;color:var(--muted)">minutes</span>`;
    const stepsNode=$("stepsSummary"); if(stepsNode) stepsNode.textContent=String(steps);
  }
  function renderSession() {
    const session=safeRead("livoraSession",null);
    const loggedIn=!!(session && session.email);
    $("loginScreen").hidden=loggedIn;
    $("appShell").hidden=!loggedIn;
    if(loggedIn){
      const name=session.name || session.email.split("@")[0];
      $("userDisplay").textContent=name;
      $("userAvatar").textContent=(name.trim()[0] || "L").toUpperCase();
      if($("settingsName") && !$("settingsName").value) $("settingsName").value=name;
      renderHistory(); updateUsageSummary(); updateActivitySummary();
    }
  }
  function navigateTo(pageId) {
    if(!pageNames[pageId] || !$("page-"+pageId)) { console.warn("Unknown LIVORA page:",pageId); return false; }
    const session=safeRead("livoraSession",null);
    if(!session || !session.email){ $("loginScreen").hidden=false; $("appShell").hidden=true; return false; }
    currentPage=pageId;
    document.querySelectorAll(".page-view").forEach(page => { page.hidden=page.id !== "page-"+pageId; });
    document.querySelectorAll("[data-page]").forEach(button => {
      const active=button.dataset.page===pageId;
      button.classList.toggle("active",active);
      if(active) button.setAttribute("aria-current","page"); else button.removeAttribute("aria-current");
    });
    const title=pageNames[pageId];
    $("breadcrumbPage").textContent=" / "+title;
    document.title="LIVORA — "+title;
    const sidebar=$("sidebar"); if(sidebar) sidebar.classList.remove("mobile-open");
    window.scrollTo({top:0,behavior:"smooth"});
    if(location.hash !== "#"+pageId) { try { window.history.pushState({page:pageId}, "", "#"+pageId); } catch {} }
    if(pageId==="history") renderHistory();
    if(pageId==="usage") updateUsageSummary();
    return true;
  }
  function historyReplace(hash){ try { window.history.replaceState({page:currentPage},"",hash); } catch {} }
  function updateUsageSummary() {
    const ids=["usageSocial","usageGames","usageVideo","usageStudy"];
    const values=ids.map(id=>Math.max(0,Math.min(1440,Number($(id)?.value)||0)));
    const total=values.reduce((a,b)=>a+b,0), recreational=values[0]+values[1]+values[2];
    if($("totalUsage")) $("totalUsage").innerHTML=`${total} <span style="font-size:13px;color:var(--muted)">min total</span>`;
    if($("recreationalUsage")) $("recreationalUsage").textContent=recreational+" min";
    if($("studyUsage")) $("studyUsage").textContent=values[3]+" min";
  }
  function saveUsage() {
    const ids=["usageSocial","usageGames","usageVideo","usageStudy"];
    const values=ids.map(id=>Number($(id).value));
    if(values.some(v=>!Number.isFinite(v)||v<0||v>1440)){ alert("Enter a number between 0 and 1440 minutes for each category."); return; }
    const record={date:today(),timestamp:Date.now(),social:values[0],games:values[1],video:values[2],study:values[3],recreational:values[0]+values[1]+values[2],total:values.reduce((a,b)=>a+b,0)};
    const records=safeRead("livoraUsageEntries",[]); records.unshift(record); safeWrite("livoraUsageEntries",records.slice(0,60));
    showMessage("usageSavedMessage",`Saved ${record.total} minutes total (${record.recreational} recreational) locally. This is manually entered data.`); updateUsageSummary();
  }
  function renderHistory() {
    const entries=history();
    ["history","fullHistory"].forEach(id=>{
      const list=$(id); if(!list)return; list.replaceChildren();
      if(!entries.length){ const li=document.createElement("li");li.textContent="No saved entries yet. Update the overview or save activity to start a history.";list.appendChild(li);return; }
      entries.forEach(entry=>{const li=document.createElement("li");li.textContent=`${entry.date} — Score: ${entry.score}, activity: ${entry.activityMinutes} minutes`;list.appendChild(li);});
    });
  }
  function calculateScore() {
    const minutes=Number($("activityMinutes").value);
    if(!Number.isFinite(minutes)||minutes<0||minutes>1440){alert("Enter a valid activity duration between 0 and 1440 minutes.");return;}
    const bonus=Math.min(20,Math.floor(minutes/5));
    const score=Math.max(0,Math.min(100,80+bonus));
    $("score").textContent=String(score);
    $("scoreMessage").textContent=score>=80?"Your illustrative demo score is in the green range.":score>=50?"Your illustrative demo score is in the yellow range.":"Review your wellness habits gently.";
    $("progress")?.style.setProperty("width",score+"%");
    $("activityBig").textContent=String(minutes); $("activitySummary").textContent=minutes+" min demo";
    const entries=history(); entries.unshift({date:new Date().toLocaleString(),score,activityMinutes:minutes}); safeWrite("livoraHistory",entries.slice(0,30));
    renderHistory();
  }
  function clearHistory() { if(confirm("Delete saved history on this device?")){localStorage.removeItem("livoraHistory");renderHistory();} }
  function saveActivity() {
    const minutes=Number($("activityEntry").value), steps=Number($("stepsEntry").value);
    if(!Number.isFinite(minutes)||minutes<0||minutes>1440||!Number.isFinite(steps)||steps<0||steps>100000){alert("Enter activity from 0–1440 minutes and steps from 0–100000.");return;}
    safeWrite("livoraActivity",{date:today(),minutes,steps,timestamp:Date.now()});
    $("activityMinutesSummary").innerHTML=`${minutes} <span style="font-size:13px;color:var(--muted)">minutes</span>`; $("stepsSummary").textContent=String(steps);
    showMessage("activitySavedMessage","Activity saved locally. These are manual demo values, not live band readings.");
  }
  function renderActivity() { const data=safeRead("livoraActivity",null); if(data){$("activityEntry").value=data.minutes;$("stepsEntry").value=data.steps;$("activityMinutesSummary").innerHTML=`${data.minutes} <span style="font-size:13px;color:var(--muted)">minutes</span>`;$("stepsSummary").textContent=data.steps;showMessage("activitySavedMessage","Latest manual activity entry loaded.");} }
  function checkBluetooth() {
    const supported=!!(navigator.bluetooth && typeof navigator.bluetooth.requestDevice==="function");
    const message=supported?"Web Bluetooth is available in this browser, but a compatible device service and GATT protocol must still be configured.":"Web Bluetooth is unavailable in this browser. Use a supported browser/device or a native Android integration.";
    ["deviceStatus","bandPageStatus"].forEach(id=>{const el=$(id);if(el)el.textContent=supported?"Browser support available; not connected":"Not connected";});
    showMessage("usageStatus","Web pages cannot automatically read other installed apps' usage statistics."); showMessage("bandMessage",message);
  }
  function handleLogin(event) {
    event.preventDefault();
    const email=$("loginEmail").value.trim().toLowerCase(), password=$("loginPassword").value;
    if(!email || !$("loginEmail").checkValidity()){showMessage("loginMessage","Enter a valid email address.");return;}
    if(password.length<6){showMessage("loginMessage","Password must contain at least 6 characters.");return;}
    const users=safeRead("livoraUsers",{});
    if(isRegisterMode){
      if(users[email]){showMessage("loginMessage","An account for this email already exists. Sign in instead.");return;}
      // Demo-only: client-side account records are not secure and should never store real passwords.
      users[email]={password,name:email.split("@")[0]}; safeWrite("livoraUsers",users);
      const profile={email,name:users[email].name};safeWrite("livoraProfile",profile);setLoggedIn(profile);return;
    }
    if(users[email]){
      if(users[email].password!==password){showMessage("loginMessage","That password does not match this local demo account.");return;}
      setLoggedIn({email,name:users[email].name});return;
    }
    showMessage("loginMessage","No local demo account found. Choose Create account first.");
  }
  function enterDemo() {
    const profile={email:"demo@livora.local",name:"LIVORA Demo"};
    safeWrite("livoraSession",profile);
    renderSession();
    navigateTo("overview");
    showMessage("loginMessage","");
  }
  function logout(){localStorage.removeItem("livoraSession");$("loginPassword").value="";showMessage("loginMessage","You have been logged out.");renderSession();window.scrollTo(0,0);}
  function clearAll(){if(confirm("Clear all LIVORA data saved in this browser, including demo accounts and history?")){["livoraSession","livoraUsers","livoraProfile","livoraHistory","livoraUsageEntries","livoraActivity","livoraSettings"].forEach(k=>localStorage.removeItem(k));renderSession();}}
  function saveSettings(){const name=$("settingsName").value.trim(),target=Number($("dailyTarget").value);if(!name){showMessage("settingsMessage","Enter a display name.");return;}if(!Number.isFinite(target)||target<0||target>1440){showMessage("settingsMessage","Daily target must be between 0 and 1440 minutes.");return;}safeWrite("livoraSettings",{name,target});const session=safeRead("livoraSession",{});session.name=name;safeWrite("livoraSession",session);$("userDisplay").textContent=name;$("userAvatar").textContent=name[0].toUpperCase();showMessage("settingsMessage","Settings saved locally.");}
  function loadSettings(){const settings=safeRead("livoraSettings",null),session=safeRead("livoraSession",null);if(settings){$("settingsName").value=settings.name;$("dailyTarget").value=settings.target;}else if(session){$("settingsName").value=session.name||session.email.split("@")[0];}}
  document.querySelectorAll("[data-page]").forEach(button=>button.addEventListener("click",()=>navigateTo(button.dataset.page)));
  $("loginForm").addEventListener("submit",handleLogin);
  $("demoLoginButton")?.addEventListener("click",enterDemo);
  $("registerButton").addEventListener("click",()=>{isRegisterMode=!isRegisterMode;$("loginTitle").textContent=isRegisterMode?"Create your LIVORA account.":"Welcome to your balance.";$("loginSubmit").textContent=isRegisterMode?"Create account":"Sign in";$("registerButton").textContent=isRegisterMode?"Back to sign in":"Create account";$("loginPassword").value="";showMessage("loginMessage",isRegisterMode?"Create a local demo account using an email and a password of at least 6 characters.":"");});
  $("logoutButton").addEventListener("click",logout); $("settingsLogoutButton").addEventListener("click",logout);
  $("calculateButton").addEventListener("click",calculateScore); $("clearButton").addEventListener("click",clearHistory); $("clearHistoryPageButton").addEventListener("click",clearHistory); $("refreshHistoryButton").addEventListener("click",renderHistory);
  $("saveUsageButton").addEventListener("click",saveUsage); ["usageSocial","usageGames","usageVideo","usageStudy"].forEach(id=>$(id).addEventListener("input",updateUsageSummary));
  $("saveActivityButton").addEventListener("click",saveActivity); $("bandCheckButton").addEventListener("click",checkBluetooth); $("connectButton").addEventListener("click",checkBluetooth); $("saveSettingsButton").addEventListener("click",saveSettings); $("clearAllButton").addEventListener("click",clearAll);
  $("mobileMenuButton").addEventListener("click",()=>$("sidebar").classList.toggle("mobile-open"));
  function syncMobileMenu(){ $("mobileMenuButton").style.display=window.matchMedia("(max-width: 520px)").matches?"inline-block":"none"; }
  window.addEventListener("resize",syncMobileMenu); syncMobileMenu();
  window.addEventListener("popstate",()=>{const page=location.hash.replace(/^#/,"");if(pageNames[page])navigateTo(page);});
  // Add semantic IDs to the existing sidebar and initialize the app.
  const sidebar=document.querySelector(".sidebar"); if(sidebar)sidebar.id="sidebar";
  const activitySaved=safeRead("livoraActivity",null); if(activitySaved)renderActivity();
  const originalName=safeRead("livoraSettings",null); if(originalName)loadSettings();
  const dateNode=$("todayDate"); if(dateNode)dateNode.textContent=new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(new Date());
  renderSession();
  const initial=location.hash.replace(/^#/,""); if(pageNames[initial] && safeRead("livoraSession",null))navigateTo(initial);
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));}
})();
