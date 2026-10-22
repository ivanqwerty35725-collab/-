(function(){
"use strict";
function mulberry32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const NS="http://www.w3.org/2000/svg";
const U = {
  CAPTIONS:["Анимация шейп-слоёв","Матовое стекло (glassmorphism)","Сетчатый градиент / аврора","Объёмная типографика",
    "Неон и свет","Глитч / хроматическая аберрация","2,5D-камера с глубиной резкости","«Пластилиновый» 3D-вид (clay)","Дуотон-фотомонтаж"],
  W:1280,H:764,
  rng:(s)=>mulberry32(s),
  clamp:(v,a,b)=>v<a?a:v>b?b:v,
  lerp:(a,b,t)=>a+(b-a)*t,
  // html helper
  el(tag,attrs={},parent,html){const e=document.createElement(tag);for(const k in attrs){if(k==='style'&&typeof attrs[k]==='object')Object.assign(e.style,attrs[k]);else e.setAttribute(k,attrs[k]);}if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e;},
  svg(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;},
  // inject svg markup string into stage
  svgRoot(parent,w=1280,h=764,inner=""){const d=document.createElement('div');d.innerHTML=`<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;const s=d.firstChild;parent.appendChild(s);return s;},
  css(text){const s=document.createElement('style');s.textContent=text;document.head.appendChild(s);},
  noiseURL(size=256,alpha=40,seed=7,mono=true){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const d=x.createImageData(size,size);const r=mulberry32(seed);for(let i=0;i<d.data.length;i+=4){const v=r()*255;d.data[i]=v;d.data[i+1]=mono?v:r()*255;d.data[i+2]=mono?v:r()*255;d.data[i+3]=alpha;}x.putImageData(d,0,0);return c.toDataURL();},
};
window.U=U;
})();
