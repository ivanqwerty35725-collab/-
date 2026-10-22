/* Ivan Aivazovsky manner: glowing sky, sun behind clouds, sun path on the water, translucent wave crest, distant ship, haze.
   Pass 1: procedural scene shader. Pass 2: painterly filter (Kuwahara) + glaze, canvas weave, varnish, vignette. */
(function () {
  "use strict";
  const { W, H, R, clamp, lerp, smooth, ease, eOut, seg, rgba, layer, path, spline, ellipse } = U;
  const out = document.getElementById("out"), ctx = out.getContext("2d");
  const glc = document.createElement("canvas"); glc.width = W; glc.height = H;
  const gl = glc.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });

  const VS = `#version 300 es
  in vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`;

  const COMMON = `#version 300 es
  precision highp float;
  uniform vec2 res; uniform float t;
  out vec4 o;
  float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p+n)); }
  float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
    vec2 ga = h22(i)*2.-1., gb = h22(i+vec2(1,0))*2.-1., gc = h22(i+vec2(0,1))*2.-1., gd = h22(i+vec2(1,1))*2.-1.;
    return mix(mix(dot(ga,f), dot(gb,f-vec2(1,0)), u.x), mix(dot(gc,f-vec2(0,1)), dot(gd,f-vec2(1,1)), u.x), u.y)*1.4; }
  const mat2 RT = mat2(0.8, 0.6, -0.6, 0.8);
  float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s += a*gnoise(p); p = RT*p*2.03 + 1.7; a *= .5; } return s; }
  float fbm3(vec2 p){ float s=0., a=.5; for(int i=0;i<3;i++){ s += a*gnoise(p); p = RT*p*2.03 + 1.7; a *= .5; } return s; }
  `;

  const FS_SCENE = COMMON + `
  uniform sampler2D ship;
  const float HY = 410.;
  const vec2 SUN = vec2(790., 318.);
  const float F = 900.;

  float billow(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s += a*(1.-abs(gnoise(p))); p = RT*p*2.07 + 3.1; a *= .5; } return s; }
  // cloud density: heavy upper mass with a lumpy lower edge + thin horizontal bands across the sun
  float cloudDens(vec2 p){
    vec2 dr = vec2(t*1.2, 0.);
    vec2 q = (p + dr)/vec2(470., 240.);
    q += 0.35*vec2(fbm3(q*0.9 + 3.1), fbm3(q*0.9 + 7.7));
    // rounded cumulus masses (soft metaballs) with ragged fbm edges
    float s = 0.;
    vec4 B[9] = vec4[9](vec4(60., 30., 330., 160.), vec4(400., 80., 260., 115.), vec4(700., 20., 300., 120.), vec4(990., 60., 270., 130.), vec4(1260., 40., 300., 175.),
                        vec4(230., 200., 210., 72.), vec4(1110., 205., 230., 82.), vec4(560., 160., 160., 58.), vec4(-40., 300., 240., 110.));
    for (int i = 0; i < 9; i++) { vec2 c = B[i].xy + vec2(t*1.4, 0.); vec2 d = (p - c)/B[i].zw; s += exp(-dot(d, d)*1.6); }
    float upper = (s - 0.42)*2.2 + 0.55*fbm3(q*2.4) + 0.25*(billow(q*1.6) - 0.5);
    // streaky bands near the horizon
    vec2 qs = (p + dr*1.6)/vec2(380., 11.);
    float band = (fbm3(qs + vec2(0., 4.)) + 0.02) * exp(-pow((p.y - 350.)/30., 2.)) * 2.6;
    float band2 = (fbm3(qs*vec2(0.7, 1.3) + vec2(9., 0.)) - 0.05) * exp(-pow((p.y - 262.)/18., 2.)) * 2.2;
    return max(upper, max(band, band2));
  }
  vec3 skyBase(vec2 p){
    float h = clamp((HY - p.y)/HY, 0., 1.);
    vec3 c = mix(vec3(1.0, 0.84, 0.58), vec3(0.97, 0.72, 0.52), smoothstep(0.0, 0.25, h));
    c = mix(c, vec3(0.80, 0.62, 0.56), smoothstep(0.2, 0.55, h));
    c = mix(c, vec3(0.50, 0.53, 0.52), smoothstep(0.5, 1.0, h));
    float ds = length((p - SUN)*vec2(0.75, 1.0));
    c += vec3(1.0, 0.96, 0.82)*exp(-ds/26.)*1.3 + vec3(1.0, 0.86, 0.58)*exp(-ds/120.)*0.55 + vec3(0.95, 0.66, 0.40)*exp(-ds/380.)*0.28;
    c = mix(c, vec3(1.0, 0.98, 0.90), smoothstep(23., 19., length(p - SUN))*0.9);
    return c;
  }
  vec3 sky(vec2 p, bool full){
    vec3 c = skyBase(p);
    float ds = length((p - SUN)*vec2(0.75, 1.0));
    float dn = cloudDens(p);
    float a = smoothstep(-0.28, 0.55, dn);
    vec2 toS = normalize(SUN - p + 1e-3);
    float lit = 0.;
    if (full) { float d2 = cloudDens(p + toS*22.); lit = clamp((dn - d2)*3.5, 0., 1.); }
    float nearS = exp(-ds/360.);
    vec3 dark = mix(vec3(0.30, 0.28, 0.33), vec3(0.56, 0.42, 0.40), nearS);
    dark = mix(dark, vec3(0.70, 0.52, 0.45), smoothstep(HY - 120., HY, p.y)*0.5);
    vec3 rim = mix(vec3(0.95, 0.66, 0.46), vec3(1.0, 0.90, 0.62), nearS);
    float glowIn = exp(-ds/170.);
    dark *= mix(1.15, 0.80, smoothstep(0.2, 1.6, dn));
    vec3 cc = mix(dark, rim, clamp(lit*(0.35 + 1.5*nearS) + 0.35*glowIn, 0., 1.));
    // thin parts glow (silver lining / translucent edges)
    float thin = 1. - smoothstep(-0.1, 0.5, dn);
    cc = mix(cc, c*1.05, thin*0.55);
    c = mix(c, cc, a);
    // crepuscular rays through the gaps
    vec2 v = p - SUN; float ang = atan(v.y, v.x);
    float ray = smoothstep(0.0, 0.8, gnoise(vec2(ang*7., 1.3)) + 0.35) * exp(-length(v)/520.) * (1. - a*0.7);
    c += vec3(1.0, 0.82, 0.52)*ray*0.09;
    // horizon haze
    c = mix(c, vec3(0.97, 0.80, 0.60), exp(-(HY - p.y)/26.)*0.6);
    return c;
  }
  // peaky trochoid-like swell
  float crestW(float x){ return 1. - abs(sin(x)); }
  float seaH(vec2 w, float lod){
    float h = 0.;
    h += 0.50*pow(crestW(dot(w, vec2(0.06, 0.42)) - t*0.55 + 1.2*gnoise(w*0.05)), 2.2);
    h += 0.30*pow(crestW(dot(w, vec2(-0.30, 0.66)) - t*0.75 + 0.9*gnoise(w*0.08 + 3.)), 2.);
    h += 0.18*pow(crestW(dot(w, vec2(0.52, 0.95)) - t*0.95), 1.6);
    h += lod*0.30*fbm3(w*vec2(0.8, 1.5) + vec2(0., -t*0.6));
    return h;
  }
  void main(){
    vec2 p = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y);
    vec3 col;
    float sunAl = exp(-abs(p.x - SUN.x)/360.);
    if (p.y < HY) {
      col = sky(p, true);
    } else {
      float dy = p.y - HY + 0.6;
      float z = F*3.0/dy;
      vec2 w = vec2((p.x - 640.)*z/F, z);
      float lod = smoothstep(240., 14., z);
      float e = 0.025*z + 0.04;
      float h0 = seaH(w, lod), hx = seaH(w + vec2(e, 0.), lod), hz = seaH(w + vec2(0., e), lod);
      float amp = mix(0.12, 1.0, smoothstep(0., 50., dy));
      vec3 n = normalize(vec3(-(hx - h0)/e*amp*0.6, 1., -(hz - h0)/e*amp*0.6));
      vec3 v = normalize(vec3(w.x, -3.0, w.y));
      vec3 r = reflect(v, n); r.y = max(r.y, 0.004);
      vec2 rp = vec2(640. + F*r.x/r.z, HY - F*r.y/r.z);
      vec3 refl = sky(clamp(rp, vec2(0., 2.), vec2(res.x, HY - 1.)), false);
      float fr = 0.04 + 0.96*pow(1. - max(dot(n, -v), 0.), 5.);
      vec3 deep = mix(vec3(0.16, 0.25, 0.24), vec3(0.05, 0.10, 0.12), smoothstep(0., 220., dy));
      // backlit crests: light passes through the thin water -> emerald / gold-green
      float crest = smoothstep(0.35, 0.95, h0);
      vec3 sss = mix(vec3(0.22, 0.52, 0.36), vec3(0.62, 0.80, 0.46), sunAl*0.7);
      vec3 water = deep + sss*crest*(0.35 + 0.65*sunAl)*mix(0.5, 1.0, lod);
      col = mix(water, refl, clamp(fr*0.85, 0., 0.85));
      // sun path: glints
      vec3 sd = normalize(vec3((SUN.x - 640.)/F, (HY - SUN.y)/F, 1.));
      float sp = max(dot(r, sd), 0.);
      float path = exp(-pow((p.x - SUN.x)/(26. + dy*0.75), 2.));
      float gl1 = pow(sp, 700.)*6. + pow(sp, 90.)*0.7;
      col += vec3(1.0, 0.90, 0.66)*gl1*(0.35 + 0.65*path);
      col += vec3(1.0, 0.78, 0.50)*path*0.12*exp(-dy/200.);
      // whitecaps
      float wc = smoothstep(0.86, 0.98, h0) * smoothstep(0.2, 0.6, fbm3(w*1.7 + t*0.2)) * lod;
      col = mix(col, vec3(0.93, 0.88, 0.78)*(0.75 + 0.35*sunAl), wc*0.8);
      col = mix(col, vec3(0.96, 0.80, 0.60), exp(-dy/14.)*0.7);
    }

    // ---- rows of waves receding to the horizon (back to front), the last one is the hero wave ----
    const int NR = 12;
    for (int k = 0; k < NR; k++) {
      float fk = float(k), kk = fk/float(NR - 1);
      bool hero = k == NR - 1;
      float kn = kk/(1. - 1./float(NR - 1)); float base = hero ? 790. : mix(434., 712., pow(kn, 1.5)) + 6.*gnoise(vec2(fk*3.1, 0.5))*kn;
      float A = hero ? 285. + 22.*sin(t*0.55 - 0.6) : mix(4., 66., pow(kn, 1.8))*(1. + 0.10*sin(t*0.8 + fk*1.7));
      float wl = hero ? 900. : mix(110., 430., kn);
      float u = p.x/wl + fk*0.37 - t*(0.010 + 0.022*kk);
      float humps = 0.5 + 0.5*sin(u*6.2832 + 1.6*gnoise(vec2(u*0.8, fk*1.3)));
      float envA = smoothstep(-0.25, 0.55, gnoise(vec2(p.x/(wl*1.1) + fk*2.3 - t*0.01, fk*0.7)) + 0.35*gnoise(vec2(p.x/(wl*0.45), fk*1.9)));
      humps = pow(humps, 1.7)*envA;
      if (hero) { float pk = 300. + 14.*sin(t*0.45) - t*5.; float dx = p.x - pk; humps = dx < 0. ? 1. - 0.10*smoothstep(0., 260., -dx) : exp(-pow(dx/300., 1.7)); humps *= 1. - smoothstep(760., 1060., p.x); }
      float hgt = A*(hero ? humps : 0.04 + 0.96*humps);
      float rip = (2. + A*0.05)*fbm3(vec2(p.x*(0.02 + 0.02*(1. - kk)) + t*0.12, fk*5.)) + (1. + A*0.02)*gnoise(vec2(p.x*0.07 - t*0.35, 2. + fk*3.));
      float yc = base - hgt + rip;
      float dd = p.y - yc;
      if (dd > -50. && (!hero || humps > 0.01)) {
        float aa = smoothstep(-0.8, 0.8, dd);
        float sA = exp(-abs(p.x - SUN.x)/(260. + 260.*kk)); if (hero) sA = max(sA, 0.62);
        float f01 = clamp(dd/(hgt + 10. + A*0.4), 0., 1.5);
        // translucent upper face, dark body, warm sky reflected in the lower slope
        float tr = exp(-dd/(4. + 0.22*hgt + 6.*kk)) * (0.10 + 0.90*sA) * (0.3 + 0.7*humps);
        vec3 deepF = mix(vec3(0.07, 0.11, 0.13), vec3(0.04, 0.08, 0.10), kk); deepF = mix(deepF, vec3(0.55, 0.47, 0.40), pow(1. - kk, 2.)*0.55);
        vec3 glassF = mix(vec3(0.22, 0.56, 0.44), vec3(0.72, 0.95, 0.60), sA*0.9)*(hero ? 1.15 : 1.0);
        vec3 face = mix(deepF, glassF, clamp(tr*1.3, 0., 1.));
        face = mix(face, col*mix(1.0, 0.75, kk), smoothstep(0.25, 1.1, f01)*mix(0.85, 0.45, kk));
        // sun path glitter on the reflecting slopes
        float path = exp(-pow((p.x - SUN.x)/(24. + (p.y - HY)*0.7), 2.));
        float gn = gnoise(vec2(p.x*0.09, p.y*0.35 - t*0.9 + fk*7.)) + 0.6*gnoise(vec2(p.x*0.21 + t*0.3, p.y*0.7));
        face += vec3(1.0, 0.86, 0.60)*path*smoothstep(0.35, 0.9, gn)*smoothstep(0.25, 0.9, f01)*1.3;
        face += vec3(0.9, 0.7, 0.45)*path*0.18*smoothstep(0.2, 1., f01);
        // water ridges running along the face
        float rid = fbm3(vec2(p.x*0.012/(0.4 + kk), dd*0.10/(0.3 + kk) - t*0.10) + vec2(fk*9.));
        face *= 0.86 + 0.30*smoothstep(-0.3, 0.4, rid);
        // foam: on breaking crests, lace draining down
        float brk = smoothstep(0.55, 0.95, humps) * (hero ? 1. : smoothstep(0.1, 0.5, gnoise(vec2(u*1.3, fk*2.1 + 0.5)) + 0.3));
        float cfw = hero ? 10. + 0.16*hgt : 3. + 0.07*hgt;
        float crestFoam = smoothstep(cfw, cfw*0.3, dd + (1. + 0.06*hgt)*gnoise(vec2(p.x*(hero ? 0.025 : 0.06), t*0.3 + fk)) + (hero ? 12.*fbm3(vec2(p.x*0.05, dd*0.08 - t*0.4)) : 0.)) * brk;
        vec2 fq = vec2(p.x*0.012/(0.35 + kk), dd*0.03/(0.25 + kk) - t*0.22) + fk*4.;
        fq += 0.8*vec2(fbm3(fq*1.7 + 2.), fbm3(fq*1.7 + 8.));
        float lace = fbm(fq*1.6);
        float vein = smoothstep(0.045, 0.0, abs(lace)) * exp(-dd/(8. + hgt*0.5)) * (0.3 + 0.7*brk);
        float fpatch = smoothstep(0.28, 0.5, lace) * exp(-dd/(5. + hgt*0.14)) * brk;
        vec3 foamC = mix(vec3(0.62, 0.64, 0.66), vec3(1.0, 0.95, 0.82), clamp(sA + crestFoam*0.3, 0., 1.));
        float fn = fbm3(vec2(p.x*0.045 - t*0.15, dd*0.09 - t*0.3) + fk*2.);
        foamC *= 0.72 + 0.36*smoothstep(-0.35, 0.35, fn) - 0.18*smoothstep(0., cfw, dd);
        crestFoam *= smoothstep(-0.45, -0.1, fn + 0.15*(1. - smoothstep(0., cfw, dd)));
        float foam = clamp(crestFoam*0.95 + vein*0.6 + fpatch*0.85, 0., 1.);
        face = mix(face, foamC, foam);
        col = mix(col, face, aa);
        // spray over breaking crests
        if (dd < 2.) {
          float sprayN = fbm(vec2(p.x*0.022 + t*0.20, p.y*0.035 - t*0.35) + fk*3.);
          float spray = smoothstep(0.0, 0.6, sprayN + 0.2) * exp(min(dd, 0.)/(2. + (hero ? 0.22 : 0.12)*hgt)) * brk;
          col = mix(col, vec3(1.0, 0.94, 0.82), spray*0.6);
        }
      }
    }
    // dark trough in the very foreground
    float tro = smoothstep(650., 720., p.y);
    col = mix(col, col*vec3(0.55, 0.62, 0.62), tro*0.6);
    vec4 s = texture(ship, vec2(gl_FragCoord.x/res.x, 1. - gl_FragCoord.y/res.y));
    col = mix(col, s.rgb, s.a);
    o = vec4(col, 1.);
  }`;

  const FS_PAINT = COMMON + `
  uniform sampler2D img;
  vec3 tx(vec2 p){ return texture(img, p/res).rgb; }
  float lu(vec3 c){ return dot(c, vec3(0.3, 0.55, 0.15)); }
  void main(){
    vec2 p = gl_FragCoord.xy;
    vec2 q = vec2(p.x, res.y - p.y);
    // edge-tangent flow from a wide gradient
    float r = 3.;
    float gx = lu(tx(p + vec2(r, 0.))) - lu(tx(p - vec2(r, 0.))) + 0.5*(lu(tx(p + vec2(r, r))) - lu(tx(p + vec2(-r, r))) + lu(tx(p + vec2(r, -r))) - lu(tx(p + vec2(-r, -r))));
    float gy = lu(tx(p + vec2(0., r))) - lu(tx(p - vec2(0., r))) + 0.5*(lu(tx(p + vec2(r, r))) - lu(tx(p + vec2(r, -r))) + lu(tx(p + vec2(-r, r))) - lu(tx(p + vec2(-r, -r))));
    vec2 g = vec2(gx, gy);
    float gm = length(g);
    vec2 tdir = gm > 0.004 ? normalize(vec2(-g.y, g.x)) : vec2(1., 0.);
    // blend with a gently wandering horizontal field where the image is flat
    float an = 0.25*gnoise(q*0.004);
    vec2 hdir = vec2(cos(an), sin(an));
    tdir = normalize(mix(hdir, tdir*sign(dot(tdir, hdir) + 1e-4), smoothstep(0.004, 0.05, gm)));
    // line-integral smear along the flow (brush drag)
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i = -6; i <= 6; i++) { float fi = float(i); float wgt = 1. - abs(fi)/7.; acc += tx(p + tdir*fi*1.6)*wgt; wsum += wgt; }
    vec3 col = acc/wsum;
    vec3 orig = tx(p);
    col = mix(col, orig, 0.18);
    // stroke texture aligned with the flow
    vec2 sp = vec2(dot(q, tdir*vec2(1., -1.)), dot(q, vec2(tdir.y, tdir.x)));
    float st = gnoise(vec2(sp.x*0.035, sp.y*0.55))*0.6 + gnoise(vec2(sp.x*0.09, sp.y*1.1))*0.4;
    float l = lu(col);
    col *= 1. + st*0.07;
    col += smoothstep(0.72, 1.0, l)*max(st, 0.)*0.07;    // impasto on the lights
    // canvas weave
    float wv = sin(q.x*2.2)*sin(q.y*2.2);
    col *= 1. + wv*0.02 + (h21(floor(q*0.5)) - 0.5)*0.02;
    // varnish, warm grade, darkened corners
    col = pow(col, vec3(1.03, 1.0, 1.07));
    col *= vec3(1.03, 0.99, 0.90);
    vec2 uv = q/res - 0.5;
    float vg = 1. - smoothstep(0.32, 0.86, length(uv*vec2(1.0, 1.3)));
    col *= mix(0.50, 1.0, vg);
    o = vec4(clamp(col, 0., 1.), 1.);
  }`;

  function compile(src, type) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function prog(fs) { const p = gl.createProgram(); gl.attachShader(p, compile(VS, gl.VERTEX_SHADER)); gl.attachShader(p, compile(fs, gl.FRAGMENT_SHADER)); gl.bindAttribLocation(p, 0, "a"); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
  function tex(w, h) { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; }

  let P1, P2, fbo, sceneTex, shipTex, shipL;
  // ---------- ship drawn in 2D (sails lit from the sunset side) ----------
  function drawShip(t) {
    const g = shipL.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    const x = 1012, y = 402 + Math.sin(t * 1.1) * 1.2, rot = Math.sin(t * 0.9) * 0.035, s = 1.0;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    const haze = "rgba(222,176,130,";
    // hull
    g.fillStyle = "rgba(40,30,34,0.95)"; g.beginPath(); g.moveTo(-30, -6); g.lineTo(28, -7); g.quadraticCurveTo(24, 2, 16, 3); g.lineTo(-24, 3); g.quadraticCurveTo(-29, 0, -30, -6); g.fill();
    // masts
    g.strokeStyle = "rgba(60,46,46,0.85)"; g.lineWidth = 1.1;
    for (const [mx, mh] of [[-14, 44], [2, 52], [16, 40]]) { g.beginPath(); g.moveTo(mx, -6); g.lineTo(mx, -6 - mh); g.stroke(); }
    g.beginPath(); g.moveTo(28, -7); g.lineTo(46, -20); g.stroke();
    // sails: lit side warm, shadow side dusky
    const sail = (mx, y0, w, h, lit) => { g.fillStyle = lit ? "rgba(246,214,170,0.92)" : "rgba(150,120,118,0.9)"; g.beginPath(); g.moveTo(mx - w / 2, y0); g.quadraticCurveTo(mx, y0 - 2, mx + w / 2, y0); g.quadraticCurveTo(mx + w / 2 - 2, y0 + h / 2, mx + w / 2 - 1, y0 + h); g.lineTo(mx - w / 2 + 1, y0 + h); g.quadraticCurveTo(mx - w / 2 + 2, y0 + h / 2, mx - w / 2, y0); g.fill(); };
    for (const [mx, mh] of [[-14, 44], [2, 52], [16, 40]]) { const n = 3; for (let i = 0; i < n; i++) { const y0 = -6 - mh + i * mh * 0.3 + 2, h = mh * 0.26, w = 16 - i * -2; sail(mx, y0, w, h, true); g.fillStyle = "rgba(120,90,90,0.35)"; g.fillRect(mx + 1, y0 + 1, w / 2 - 2, h - 1); } }
    g.fillStyle = "rgba(246,214,170,0.9)"; g.beginPath(); g.moveTo(30, -9); g.lineTo(45, -21); g.lineTo(32, -26); g.closePath(); g.fill();
    g.restore();
    // haze veil over the ship
    g.globalCompositeOperation = "source-atop"; g.fillStyle = haze + "0.25)"; g.fillRect(940, 330, 140, 90); g.globalCompositeOperation = "source-over";
    // tiny reflection streak under the ship
    g.fillStyle = "rgba(60,46,46,0.25)"; g.fillRect(x - 24, y + 5, 46, 2);
  }

  function build() {
    if (!gl) throw new Error("no webgl2");
    P1 = prog(FS_SCENE); P2 = prog(FS_PAINT);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    sceneTex = tex(W, H); fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    shipTex = tex(W, H); shipL = layer();
  }

  // ---------- text ----------
  const T = { v1: 0.9, v2: 5.6, v3: 7.9 };
  function txt(g, s, x, y, font, col, a, dy = 0) { g.globalAlpha = a; g.font = font; g.fillStyle = col; g.fillText(s, x, y + dy); }
  function glowPlate(g, x, y, w, h, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.translate(x + w / 2, y + h / 2); g.scale(1, (h + 80) / (w + 80));
    const R0 = (w + 80) / 2, gr = g.createRadialGradient(0, 0, 0, 0, 0, R0);
    gr.addColorStop(0, "rgba(255,236,206,0.55)"); gr.addColorStop(0.55, "rgba(255,232,200,0.35)"); gr.addColorStop(1, "rgba(255,230,200,0)");
    g.fillStyle = gr; g.fillRect(-R0, -R0, 2 * R0, 2 * R0); g.restore();
  }
  function text(g, t) {
    g.save(); g.textBaseline = "alphabetic";
    const X = 80, Y = 276, INKC = "#2b1e1a", RUC = "#5a3b2e";
    const out1 = 1 - ease(seg(t, T.v2 - 0.9, T.v2 - 0.4));
    const a1 = eOut(seg(t, T.v1 - 0.2, T.v1 + 0.5)) * out1;
    const r1 = eOut(seg(t, T.v1 + 1.6, T.v1 + 2.2)) * out1;
    glowPlate(g, X - 20, Y - 60, 680, 110, Math.max(a1, eOut(seg(t, T.v2 - 0.4, T.v2)) ) * 0.95);
    if (a1 > 0) txt(g, "A nagyapám tengerész volt.", X, Y, "600 54px 'Source Serif 4'", INKC, a1, (1 - a1) * 8);
    if (r1 > 0) txt(g, "Мой дед был моряком.", X + 2, Y + 44, "italic 400 30px 'Source Serif 4'", RUC, r1, (1 - r1) * 6);
    const b1 = eOut(seg(t, T.v2 - 0.3, T.v2 + 0.3)), b2 = seg(t, T.v2 + 0.25, T.v2 + 0.55), b3 = eOut(seg(t, T.v2 + 0.9, T.v2 + 1.4));
    if (b1 > 0) {
      g.font = "600 72px 'Source Serif 4'"; const w1 = g.measureText("a hajó").width;
      txt(g, "a hajó", X, Y + 6, "600 72px 'Source Serif 4'", INKC, b1, (1 - b1) * 8);
      if (b2 > 0) {
        const pulse = Math.exp(-Math.pow((t - (T.v3 + 0.45)) / 0.35, 2));
        g.save(); g.translate(X + w1 + 20, Y - 20); const sc = 1 + 0.25 * (1 - eOut(b2)) + 0.12 * pulse; g.scale(sc, sc);
        g.globalAlpha = b2; g.font = "600 72px 'Source Serif 4'"; g.fillStyle = "#3B6E9B"; g.fillText("n", -20, 26);
        g.restore();
      }
      if (b3 > 0) txt(g, "на корабле", X + 2, Y + 50, "italic 400 32px 'Source Serif 4'", RUC, b3, (1 - b3) * 6);
    }
    g.restore();
  }

  function frame(t) {
    drawShip(t);
    gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, shipTex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, shipL.c);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.useProgram(P1);
    gl.uniform2f(gl.getUniformLocation(P1, "res"), W, H); gl.uniform1f(gl.getUniformLocation(P1, "t"), t);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shipTex); gl.uniform1i(gl.getUniformLocation(P1, "ship"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.useProgram(P2);
    gl.uniform2f(gl.getUniformLocation(P2, "res"), W, H); gl.uniform1f(gl.getUniformLocation(P2, "t"), t);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex); gl.uniform1i(gl.getUniformLocation(P2, "img"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    // camera: slow drift toward the ship
    const k = ease(seg(t, 0, 10)), z = 1 + 0.035 * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(900, 400); ctx.scale(z, z); ctx.translate(-900, -400); ctx.drawImage(glc, 0, 0); ctx.restore();
    text(ctx, t);
  }
  window.SCENE = { dur: 10, build, frame };
})();
