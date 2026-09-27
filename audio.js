/* Scene cues below are verified against public previews of the requested recordings.
 * Full audio stays inside the official Spotify player. See docs/AUDIO-ZUORDNUNG.md. */
(() => {
 const cues = {
 "0": {
  "title": "Sokrates & Glaukon",
  "album": "iv",
  "tracks": [
   {
    "number": 81,
    "id": "7x9I05CMsmfQqOtwQh3hB5"
   },
   {
    "number": 82,
    "id": "63iRST14PCowYjCN1bZ2ju"
   }
  ]
 },
 "1": {
  "title": "Das Sonnengleichnis",
  "album": "iv",
  "tracks": [
   {
    "number": 83,
    "id": "3FCP9ERnNSoegctQLh8x9z"
   },
   {
    "number": 84,
    "id": "4xLuMZmPuqxz4nYbG5qUrO"
   },
   {
    "number": 85,
    "id": "3Se2vfgOBI2isLcgmD34hZ"
   }
  ]
 },
 "2": {
  "title": "Die geteilte Linie",
  "album": "iv",
  "tracks": [
   {
    "number": 85,
    "id": "3Se2vfgOBI2isLcgmD34hZ"
   },
   {
    "number": 86,
    "id": "01KjFkdPpRSUsSsW7z27L2"
   },
   {
    "number": 87,
    "id": "4o78fVRltWOO6lD1EcBh0G"
   }
  ]
 },
 "3": {
  "title": "Gefangenschaft & Befreiung",
  "album": "vii",
  "tracks": [
   {
    "number": 2,
    "id": "6bIk4P3zyB8lcaoyCQzPAo"
   }
  ]
 },
 "4": {
  "title": "Aufstieg & neue Sicht",
  "album": "vii",
  "tracks": [
   {
    "number": 3,
    "id": "5tEjee77yqJ7nRhkyX1jIA"
   }
  ]
 },
 "5": {
  "title": "Rückkehr in die Höhle",
  "album": "vii",
  "tracks": [
   {
    "number": 3,
    "id": "5tEjee77yqJ7nRhkyX1jIA"
   }
  ]
 },
 "6": {
  "title": "Bildung als Umwendung",
  "album": "vii",
  "tracks": [
   {
    "number": 4,
    "id": "70DRBJ1Qv8EL7rd4ao9Dq6"
   },
   {
    "number": 5,
    "id": "0KpFnADHI2YDXCBSNQgOlz"
   }
  ]
 }
};
 const $=id=>document.querySelector('#'+id);
 const dock=$('audio-dock'),panel=$('audio-panel'),slot=$('spotify-slot'),status=$('audio-status');
 let scene=null,controller=null,api=null,loading=false,enabled=false,expanded=false,cueKey=null,index=0,generation=0,wantsPlay=false,activeUri=null;
 const send=action=>frame?.contentWindow.postMessage({type:'platon-audio-command',action},location.origin);
 const keyFor=s=>s&&Object.hasOwn(cues,s.chapter)?String(s.chapter):null;
 const cue=()=>cues[cueKey];
 function layout(open){
  expanded=open;panel.hidden=!open&&!enabled;dock.classList.toggle('compact',!open);
  $('audio-open').setAttribute('aria-expanded',String(open));
 }
 function labels(){
  const c=cue(),t=c?.tracks[index];
  $('audio-title').textContent=c?.title||'Keine Lesung für diese Szene';
  $('audio-track').textContent=t?`Kapitel ${t.number} · ${index+1}/${c.tracks.length}`:'';
  $('audio-prev').disabled=!t||index===0;$('audio-next').disabled=!t||index===c.tracks.length-1;
  $('audio-link').hidden=!t;if(t)$('audio-link').href='https://open.spotify.com/track/'+t.id;
  $('audio-open').textContent='♫ Lesung';
 }
 function loadTrack(n,play){
  const c=cue();if(!c||n<0||n>=c.tracks.length)return;
  index=n;labels();const uri='spotify:track:'+c.tracks[n].id;
  if(activeUri===uri)return; // Shared passage: outside and return must not restart the same track.
  activeUri=uri;wantsPlay=play;
  status.textContent='Passende Aufnahme ausgewählt · Wiedergabe mit ▶.';
  if(controller){controller.loadUri(uri);if(play)controller.play();}
 }
 function create(){
  if(!api||!enabled||controller||loading||!cue())return;
  loading=true;const token=++generation;const mount=document.createElement('div');slot.replaceChildren(mount);
  api.createController(mount,{uri:activeUri,width:'100%',height:80},c=>{
   if(token!==generation||!enabled){c.destroy();return;}
   controller=c;loading=false;
   c.addListener('ready',()=>{if(controller===c&&wantsPlay)c.play();});
   c.addListener('playback_update',e=>{
    if(controller!==c||e.data.playingURI!==activeUri)return;
    const d=e.data;
    if(!d.isBuffering)wantsPlay=!d.isPaused;
    if(d.position>0)status.textContent=d.duration<60000?'Spotify spielt eine Hörprobe. Der Track-Link öffnet die Aufnahme in Spotify.':'Lesung zur Szene · Volker Braumann';
    // Only complete tracks advance; a preview is never passed off as the whole passage.
    if(d.duration>60000&&d.position>=d.duration-400&&index<cue().tracks.length-1)loadTrack(index+1,true);
   });
   // The scene may have changed while the controller was being created.
   if(activeUri)c.loadUri(activeUri);
  });
 }
 window.onSpotifyIframeApiReady=ready=>{api=ready;create();};
 function ensureApi(){
  if(api){create();return;}
  if(document.querySelector('#spotify-api'))return;
  const script=document.createElement('script');script.id='spotify-api';script.src='https://open.spotify.com/embed/iframe-api/v1';
  script.onerror=()=>{status.textContent='Spotify konnte nicht geladen werden. Öffne den ausgewählten Track über den Link.';script.remove();};
  document.head.append(script);
 }
 function stop(){
  enabled=false;wantsPlay=false;generation++;loading=false;controller?.destroy();controller=null;activeUri=null;slot.replaceChildren();
 }
 function sync(){
  const key=keyFor(scene);if(key===cueKey)return;
  cueKey=key;index=0;
  if(!cue()){stop();labels();status.textContent='Für das Materiallabor gibt es keine Hörbuchpassage.';layout(expanded);return;}
  labels();if(enabled){loadTrack(0,wantsPlay);create();}
 }
 function open(){
  dock.hidden=false;layout(true);send('menu');
  if(!cue()){labels();return;}
  if(!enabled){enabled=true;loadTrack(0,true);ensureApi();}
 }
 function collapse(){layout(false);send('immersive');frame?.focus();}
 $('audio-open').onclick=()=>expanded?collapse():open();$('audio-hide').onclick=collapse;
 $('spotify-stop').onclick=()=>{stop();layout(false);};
 $('audio-prev').onclick=()=>loadTrack(index-1,true);$('audio-next').onclick=()=>loadTrack(index+1,true);
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;
  if(e.data?.type==='platon-audio-scene'){scene=e.data;dock.hidden=false;sync();}
  else if(e.data?.type==='platon-audio-open')open();
 });
 window.platonAudio={stop:()=>{stop();layout(false);dock.hidden=true;scene=null;cueKey=null;},show:open,scene:()=>scene};
 window.addEventListener('pagehide',stop);
})();
