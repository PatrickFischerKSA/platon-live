/* Scene-synchronous browser narration and user-selected official Spotify embeds. */
(() => {
 const ids=['7idFF9MpmX1sJI79zooVNJ','2b6NiX4B7KISemC0YnaNlS'];
 const titles=['Politeia oder der Staat · Buch IV–VI','Politeia oder vom Staat · Buch VII–X'];
 const dock=document.querySelector('#audio-dock'), panel=document.querySelector('#audio-panel');
 const status=document.querySelector('#audio-status'), voices=document.querySelector('#voice');
 let scene=null, active=false, paused=false, generation=0, spotify=null, chunks=[], cursor=0;
 const send=action => frame?.contentWindow.postMessage({type:'platon-audio-command',action},location.origin);
 function stop(){active=false;paused=false;generation++;window.speechSynthesis?.cancel();document.querySelector('#voice-toggle').textContent='Szenentext vorlesen';}
 function removeSpotify(){spotify?.remove();spotify=null;document.querySelector('#spotify-slot').replaceChildren();}
 function fillVoices(){if(!window.speechSynthesis)return;const selected=voices.value;voices.replaceChildren();for(const v of speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('de'))){const o=document.createElement('option');o.value=v.name;o.textContent=v.name;voices.append(o)}if(selected)voices.value=selected;if(!voices.options.length){const o=document.createElement('option');o.textContent='Deutsche Systemstimme';o.value='';voices.append(o)}}
 function speakPart(token){
  if(!active||token!==generation||paused)return;
  if(cursor>=chunks.length){status.textContent='Abschnitt beendet';if(document.querySelector('#audio-auto').checked&&!scene.last)send('next');else stop();return;}
  const u=new SpeechSynthesisUtterance(chunks[cursor]);let started=0;u.lang='de-DE';u.rate=Number(document.querySelector('#voice-rate').value);
  u.voice=speechSynthesis.getVoices().find(v=>v.name===voices.value)||null;
  u.onstart=()=>{started=Date.now();if(token===generation)status.textContent=scene.title+" · Abschnitt "+(scene.step+1)+" · Wird vorgelesen"};
  u.onend=()=>{if(token===generation&&active){if(chunks[cursor].trim().length>20&&(!started||Date.now()-started<80)){stop();status.textContent='Die Stimme hat keinen Ton ausgegeben. Bitte eine andere Stimme oder Spotify wählen.';return}cursor++;speakPart(token)}};
  u.onerror=e=>{if(token!==generation||e.error==='canceled'||e.error==='interrupted')return;stop();status.textContent='Vorlesen nicht verfügbar. Stimme wechseln oder Spotify verwenden.'};
  speechSynthesis.speak(u);
 }
 function narrate(){
  if(!scene){status.textContent='Die Szene lädt noch.';return;}
  if(!('speechSynthesis' in window)){status.textContent='Dieser Browser bietet keine Vorlesestimme. Bitte Spotify wählen.';return;}
  stop();removeSpotify();active=true;paused=false;const token=++generation;
  chunks=scene.text.match(/[^.!?…]+[.!?…]*(?:\s|$)/g)||[scene.text];cursor=0;
  status.textContent=scene.title+' · Abschnitt '+(scene.step+1)+' · Szenentext';document.querySelector('#voice-toggle').textContent='Vorlesen pausieren';
  send('immersive');speakPart(token);
 }
 document.querySelector('#audio-open').onclick=()=>{panel.hidden=!panel.hidden;if(spotify&& !panel.hidden){panel.append(document.querySelector('#spotify-slot'));spotify.style.height='352px'}document.querySelector('#audio-open').setAttribute('aria-expanded',String(!panel.hidden));send('menu')};
 document.querySelector('#audio-hide').onclick=()=>{panel.hidden=true;if(spotify){dock.append(document.querySelector('#spotify-slot'));spotify.style.height='152px';document.querySelector('#spotify-slot').style.width='390px';document.querySelector('#spotify-slot').style.maxWidth='100%'}document.querySelector('#audio-open').setAttribute('aria-expanded','false');send('immersive');frame?.focus()};
 document.querySelector('#voice-toggle').onclick=()=>{if(!active)return narrate();paused=!paused;if(paused){speechSynthesis.pause();status.textContent='Vorlesen pausiert'}else{speechSynthesis.resume();status.textContent=scene.title+' · Abschnitt '+(scene.step+1)+' · Szenentext';if(!speechSynthesis.speaking)speakPart(generation)}document.querySelector('#voice-toggle').textContent=paused?'Vorlesen fortsetzen':'Vorlesen pausieren'};
 document.querySelector('#voice-stop').onclick=()=>{stop();removeSpotify();status.textContent='Ton gestoppt'};
 document.querySelector('#audio-next').onclick=()=>send('next');
 document.querySelector('#audio-prev').onclick=()=>send('previous');
 for(const el of [voices,document.querySelector('#voice-rate')])el.onchange=()=>{if(active)narrate()};
 document.querySelectorAll('[data-album]').forEach(button=>button.onclick=()=>{
  stop();removeSpotify();const i=Number(button.dataset.album);
  spotify=document.createElement('iframe');spotify.title=titles[i];spotify.src='https://open.spotify.com/embed/album/'+ids[i];spotify.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';spotify.height='352';spotify.style.cssText='width:100%;height:352px;border:0;border-radius:12px';document.querySelector('#spotify-slot').append(spotify);
  status.textContent=titles[i]+' · Wiedergabe im Spotify-Player starten';send('immersive');
 });
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;
  if(e.data?.type==='platon-audio-scene'){
   scene=e.data;dock.hidden=false;if(active)narrate();else if(!spotify)status.textContent=scene.title+" · Abschnitt "+(scene.step+1);
  }else if(e.data?.type==='platon-audio-open'){panel.hidden=false;dock.hidden=false;if(spotify){panel.append(document.querySelector('#spotify-slot'));spotify.style.height='352px'}document.querySelector('#audio-open').setAttribute('aria-expanded','true');fillVoices()}
 });
 window.platonAudio={stop:()=>{stop();removeSpotify();dock.hidden=true;scene=null}, show:()=>{dock.hidden=false;panel.hidden=false}, scene:()=>scene};
 if(window.speechSynthesis)speechSynthesis.addEventListener('voiceschanged',fillVoices);fillVoices();
 window.addEventListener('pagehide',()=>stop());
})();
