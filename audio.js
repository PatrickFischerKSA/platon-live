/* Only the user's two official Spotify audiobook players. */
(() => {
 const ids=['7idFF9MpmX1sJI79zooVNJ','2b6NiX4B7KISemC0YnaNlS'];
 const titles=['Politeia oder der Staat · Buch IV–VI','Politeia oder vom Staat · Buch VII–X'];
 const dock=document.querySelector('#audio-dock'),panel=document.querySelector('#audio-panel'),slot=document.querySelector('#spotify-slot'),status=document.querySelector('#audio-status');
 let scene=null,spotify=null,album=-1,expanded=false;
 const send=action=>frame?.contentWindow.postMessage({type:'platon-audio-command',action},location.origin);
 function removePlayer(){spotify?.remove();spotify=null;album=-1;slot.replaceChildren();}
 function layout(open){
  expanded=open;panel.hidden=!open&&!spotify;dock.classList.toggle('compact',!open);
  slot.style.width='390px';slot.style.maxWidth='100%';
  if(spotify)spotify.style.height=open?'352px':'152px';
  document.querySelector('#audio-open').setAttribute('aria-expanded',String(open));
 }
 function selectAlbum(i){
  if(spotify&&album===i)return;
  removePlayer();album=i;
  spotify=document.createElement('iframe');spotify.title=titles[i];spotify.src='https://open.spotify.com/embed/album/'+ids[i];spotify.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';spotify.style.cssText='width:100%;height:352px;border:0;border-radius:12px';slot.append(spotify);
  status.textContent=titles[i]+' · Im Spotify-Player auf ▶ drücken.';
  layout(true);send('immersive');
 }
 function open(){
  dock.hidden=false;layout(true);
  if(!spotify)selectAlbum(scene&&scene.chapter>=3&&scene.chapter<=5?1:0);
  send('menu');
 }
 function collapse(){layout(false);send('immersive');frame?.focus();}
 document.querySelector('#audio-open').onclick=()=>expanded?collapse():open();
 document.querySelector('#audio-hide').onclick=collapse;
 document.querySelector('#spotify-stop').onclick=()=>{removePlayer();layout(true);status.textContent='Spotify gestoppt. Wähle ein Hörbuch, um wieder zu starten.'};
 document.querySelectorAll('[data-album]').forEach(button=>button.onclick=()=>selectAlbum(Number(button.dataset.album)));
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;
  if(e.data?.type==='platon-audio-scene'){scene=e.data;dock.hidden=false;}
  else if(e.data?.type==='platon-audio-open')open();
 });
 window.platonAudio={stop:()=>{removePlayer();layout(false);dock.hidden=true;scene=null},show:open,scene:()=>scene};
 window.addEventListener('pagehide',removePlayer);
})();
