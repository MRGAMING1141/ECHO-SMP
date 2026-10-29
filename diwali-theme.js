/* ECHO SMP — temporary Diwali decoration layer
 * Visual-only: does not access cart, payment, order, auth, Supabase or Firebase logic.
 * Automatically expires after 12 Nov 2026 (local date).
 */
(() => {
  "use strict";
  const today = new Date();
  const expiry = new Date(2026, 10, 13, 0, 0, 0); // inclusive through 12 Nov
  if (today >= expiry || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const style = document.createElement("style");
  style.textContent = `
    #echo-diwali-layer{position:fixed;inset:0;z-index:4;pointer-events:none;overflow:hidden;isolation:isolate}
    #echo-diwali-layer *{box-sizing:border-box}
    .ed-lights{position:absolute;top:0;left:0;width:100%;height:30px;display:flex;justify-content:space-around;align-items:flex-start;opacity:.92}
    .ed-wire{position:absolute;top:7px;left:0;width:100%;height:18px;border-top:1px solid rgba(255,204,112,.5);border-radius:50%}
    .ed-bulb{position:relative;margin-top:5px;width:8px;height:12px;border-radius:50% 50% 45% 45%;background:#ffc45c;box-shadow:0 0 9px 3px rgba(255,170,62,.55);animation:edGlow 2.4s ease-in-out infinite alternate}
    .ed-bulb:nth-child(3n){background:#ff815c;animation-delay:.7s}.ed-bulb:nth-child(4n){background:#ffe9a1;animation-delay:1.2s}
    .ed-diya{position:absolute;bottom:18px;width:52px;height:29px;filter:drop-shadow(0 0 12px rgba(255,155,45,.42));opacity:.9}
    .ed-diya.left{left:8px}.ed-diya.right{right:8px;transform:scaleX(-1)}
    .ed-flame{position:absolute;left:20px;top:-17px;width:12px;height:22px;border-radius:80% 15% 70% 25%;transform:rotate(45deg);background:linear-gradient(135deg,#fff3b0,#ff9a35 72%);box-shadow:0 0 15px #ffad45;animation:edFlame 1.3s ease-in-out infinite alternate}
    .ed-bowl{position:absolute;bottom:0;left:3px;width:46px;height:19px;border-radius:5px 5px 24px 24px;background:linear-gradient(90deg,#9e421c,#e88b35 48%,#8d361c);border-bottom:2px solid #ffd07b}
    .ed-spark{position:absolute;top:-15px;color:#ffd27a;text-shadow:0 0 9px #ff9f43;animation:edFall linear forwards}
    #echo-diwali-greeting{position:fixed;z-index:6;top:38px;left:50%;transform:translateX(-50%);max-width:calc(100vw - 24px);padding:8px 14px;border:1px solid rgba(255,196,100,.35);border-radius:999px;background:rgba(34,22,16,.78);backdrop-filter:blur(10px);color:#ffe4ae;font:600 12px/1.25 system-ui,sans-serif;letter-spacing:.25px;text-align:center;white-space:nowrap;pointer-events:none;box-shadow:0 5px 22px rgba(0,0,0,.18)}
    #echo-diwali-action{position:fixed;z-index:7;right:14px;bottom:18px;border:1px solid rgba(255,196,100,.48);border-radius:999px;padding:10px 14px;background:rgba(53,30,18,.92);color:#ffe4b0;font:600 12px system-ui,sans-serif;box-shadow:0 5px 20px rgba(0,0,0,.22);cursor:pointer;pointer-events:auto}
    #echo-diwali-action:active{transform:scale(.96)}
    .ed-burst{position:absolute;width:5px;height:5px;border-radius:50%;background:#ffd27a;box-shadow:0 0 8px 2px #ff9f43;animation:edBurst .8s ease-out forwards}
    @keyframes edGlow{from{opacity:.55;filter:brightness(.8)}to{opacity:1;filter:brightness(1.35)}}
    @keyframes edFlame{from{transform:rotate(38deg) scale(.9)}to{transform:rotate(52deg) scale(1.08)}}
    @keyframes edFall{to{transform:translate3d(18px,105vh,0) rotate(240deg);opacity:0}}
    @keyframes edBurst{to{transform:translate(var(--dx),var(--dy)) scale(.1);opacity:0}}
    @media(max-width:600px){#echo-diwali-greeting{top:34px;font-size:11px;padding:7px 11px}.ed-diya{transform:scale(.82);transform-origin:bottom left}.ed-diya.right{transform:scaleX(-1) scale(.82)}#echo-diwali-action{right:10px;bottom:12px;padding:9px 12px}}
  `;
  document.head.appendChild(style);

  const layer=document.createElement("div");
  layer.id="echo-diwali-layer";
  layer.setAttribute("aria-hidden","true");
  layer.innerHTML='<div class="ed-lights"><i class="ed-wire"></i>'+Array.from({length:22},()=>'<i class="ed-bulb"></i>').join("")+'</div>'+
    '<div class="ed-diya left"><i class="ed-flame"></i><i class="ed-bowl"></i></div>'+
    '<div class="ed-diya right"><i class="ed-flame"></i><i class="ed-bowl"></i></div>';
  document.body.appendChild(layer);

  const greeting=document.createElement("div");
  greeting.id="echo-diwali-greeting";
  greeting.textContent="🪔 Happy Diwali from Echo SMP ✨";
  document.body.appendChild(greeting);

  const action=document.createElement("button");
  action.id="echo-diwali-action";
  action.type="button";
  action.textContent="✨ Light a virtual firework";
  action.setAttribute("aria-label","Launch a virtual Diwali firework");
  document.body.appendChild(action);

  let paused=document.hidden;
  let sparkTimer=null, fireTimer=null;
  const random=(a,b)=>Math.random()*(b-a)+a;
  function sparkle(){
    if(paused)return;
    const s=document.createElement("span");
    s.className="ed-spark";s.textContent=Math.random()>.5?"✦":"·";
    s.style.left=random(2,98)+"vw";s.style.fontSize=random(9,17)+"px";
    s.style.animationDuration=random(5,9)+"s";
    layer.appendChild(s);
    setTimeout(()=>s.remove(),9500);
  }
  function burst(x,y){
    if(paused)return;
    for(let i=0;i<18;i++){
      const p=document.createElement("i");p.className="ed-burst";
      p.style.left=x+"px";p.style.top=y+"px";
      const angle=(Math.PI*2*i)/18, distance=random(34,95);
      p.style.setProperty("--dx",Math.cos(angle)*distance+"px");
      p.style.setProperty("--dy",Math.sin(angle)*distance+"px");
      layer.appendChild(p);setTimeout(()=>p.remove(),900);
    }
  }
  function autoFirework(){
    if(paused)return;
    burst(random(innerWidth*.12,innerWidth*.88),random(innerHeight*.16,innerHeight*.52));
  }
  action.addEventListener("click",()=>{
    burst(innerWidth-95,innerHeight-62);
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(Ctx){const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.type="triangle";osc.frequency.setValueAtTime(520,ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110,ctx.currentTime+.22);
        gain.gain.setValueAtTime(.08,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.24);
        osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.25);
        osc.onended=()=>ctx.close();
      }
    }catch(_){}
  });
  function start(){
    if(sparkTimer||paused)return;
    sparkTimer=setInterval(sparkle,850);
    fireTimer=setInterval(autoFirework,8500);
  }
  function stop(){
    clearInterval(sparkTimer);clearInterval(fireTimer);
    sparkTimer=fireTimer=null;
  }
  document.addEventListener("visibilitychange",()=>{
    paused=document.hidden;if(paused)stop();else start();
  });
  start();

  // Runtime removal is a second expiry guard if the page stays open across midnight.
  const expiryDelay=Math.max(0,expiry.getTime()-Date.now());
  setTimeout(()=>{
    stop();layer.remove();greeting.remove();action.remove();style.remove();
  },Math.min(expiryDelay,2147483647));
})();
