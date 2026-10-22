// 4. Volumetric typography: real extruded 3D type (three.js) — chrome + candy-green + house-frame lockup
(function () {
  let R = {};
  window.SCENE = {
    still: 3.5,
    async build(st, mode) {
      const THREE = await import("three");
      const { TTFLoader } = await import("three/addons/loaders/TTFLoader.js");
      const { Font } = await import("three/addons/loaders/FontLoader.js");
      const { TextGeometry } = await import("three/addons/geometries/TextGeometry.js");
      const W = 1280, H = 764;
      U.css(`#vig4{left:0;top:0;width:1280px;height:764px;background:radial-gradient(120% 95% at 50% 45%,rgba(0,0,0,0) 55%,rgba(10,20,50,.35) 100%)}
        #c4{left:0;top:0;width:1280px;height:764px}
        #ru4{left:0;top:0;transform:translate(-50%,0);font-family:'Source Serif 4';font-style:italic;font-size:50px;color:#0e1a36;white-space:nowrap}`);
      const canvas = U.el("canvas", { id: "c4", width: W, height: H }, st);
      U.el("div", { id: "vig4" }, st);
      const ru = U.el("div", { id: "ru4" }, st, "в дом");
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(mode === "cell" ? 1.25 : 1);
      renderer.setSize(W, H, false);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
      const scene = new THREE.Scene();
      const BGC = new THREE.Color("#2c4682");
      scene.background = BGC;

      // studio env: bright top, dark horizon band, warm floor + softboxes => readable chrome
      const env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide,
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
        fragmentShader: `varying vec3 vP; void main(){ float y=vP.y;
          vec3 sky=mix(vec3(0.40,0.55,0.85), vec3(1.0,0.98,0.95), smoothstep(0.05,0.6,y));
          vec3 hor=vec3(0.03,0.04,0.08); vec3 flo=vec3(0.10,0.12,0.2);
          vec3 c = y>0.02 ? mix(hor, sky, smoothstep(0.02,0.14,y)) : mix(hor, flo, smoothstep(0.0,-0.5,y));
          c += vec3(1.0,0.9,0.8)*1.8*smoothstep(0.035,0.0,abs(y+0.10))*step(0.0,vP.z);
          gl_FragColor=vec4(c,1.); }` })));
      const box = (w, h, pos, c, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
      box(26, 8, [0, 26, 4], "#ffffff", 4);
      box(4, 30, [-24, 6, 12], "#ffd9b8", 3);
      box(4, 30, [24, 6, 12], "#dbeeff", 3);
      box(50, 1.2, [0, 9, 30], "#ffffff", 5);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(env, 0.015).texture;

      const cam = new THREE.PerspectiveCamera(24, W / H, 0.1, 200);
      const target = new THREE.Vector3(-0.05, 1.8, 0);

      // cyclorama
      const prof = [];
      for (let i = 0; i <= 10; i++) prof.push([24 - i * 3, 0]);
      for (let i = 1; i <= 18; i++) { const a = (i / 18) * Math.PI / 2; prof.push([-6 - Math.sin(a) * 8, 8 - Math.cos(a) * 8]); }
      prof.push([-14, 40]);
      const cg = new THREE.BufferGeometry(), pos = [], idx = [], NX = 2;
      prof.forEach(([z, y]) => { for (let k = 0; k <= NX; k++) pos.push(-60 + k * 60, y, z); });
      for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < NX; k++) { const a = i * (NX + 1) + k, b = a + NX + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      cg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); cg.setIndex(idx); cg.computeVertexNormals();
      const cyc = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: new THREE.Color("#6d93d4"), roughness: 1, side: THREE.DoubleSide, envMapIntensity: 0.12 }));
      cyc.receiveShadow = true; scene.add(cyc);

      scene.add(new THREE.HemisphereLight(0xe2ebff, 0x3a4a7a, 1.1));
      const key = new THREE.SpotLight(0xfff1de, 1300, 0, 0.62, 1.0, 2);
      key.position.set(-13, 12, 11); key.target.position.set(0.5, 1.0, -2.5); scene.add(key.target);
      key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.blurSamples = 16; key.shadow.bias = -0.0004;
      key.shadow.camera.near = 4; key.shadow.camera.far = 50;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xbcd2ff, 0.35); fill.position.set(10, 4, 8); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffe2c4, 0.5); rim.position.set(6, 7, -10); scene.add(rim);
      const json = await new Promise((ok, err) => new TTFLoader().load("fonts/Unbounded-800.ttf", ok, undefined, err));
      const font = new Font(json);
      const textGeo = (s, size, depth) => {
        const g = new TextGeometry(s, { font, size, depth, curveSegments: 14, bevelEnabled: true, bevelThickness: 0.11, bevelSize: 0.06, bevelSegments: 8 });
        g.computeBoundingBox(); return g;
      };
      const chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.07 });
      const green = new THREE.MeshPhysicalMaterial({ color: 0x2f8c62, metalness: 0.25, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04 });
      const greenSide = new THREE.MeshPhysicalMaterial({ color: 0x1f5f43, metalness: 0.25, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });

      const SIZE = 1.3, DEPTH = 0.6;
      const g1 = textGeo("a ház", SIZE, DEPTH), g2 = textGeo("ba", SIZE, DEPTH);
      const w1 = g1.boundingBox.max.x - g1.boundingBox.min.x, w2 = g2.boundingBox.max.x - g2.boundingBox.min.x;
      const gap = 0.07, total = w1 + gap + w2;
      const word = new THREE.Group(); scene.add(word);
      const m1 = new THREE.Mesh(g1, chrome); m1.castShadow = m1.receiveShadow = true;
      const m2 = new THREE.Mesh(g2, [green, greenSide]); m2.castShadow = true;
      m1.position.x = -g1.boundingBox.min.x; m2.position.x = w1 + gap - g2.boundingBox.min.x;
      const p1 = new THREE.Group(); p1.add(m1); word.add(p1);
      const p2 = new THREE.Group(); p2.add(m2); word.add(p2);
      word.position.set(-total / 2, 0.11, -DEPTH / 2);

      // house-shaped frame around the word (lockup), terracotta with tile texture on the roof
      const tileTex = (() => {
        const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
        x.fillStyle = "#8f3218"; x.fillRect(0, 0, 512, 512);
        const r = U.rng(5);
        for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
          const cx = col * 64 + (row % 2) * 32 - 32, cy = row * 58 - 8;
          const g = x.createLinearGradient(0, cy, 0, cy + 62);
          const h = 12 + r() * 9, l = 44 + r() * 10;
          g.addColorStop(0, `hsl(${h},66%,${l + 10}%)`); g.addColorStop(0.7, `hsl(${h},66%,${l}%)`); g.addColorStop(1, `hsl(${h},60%,${l - 18}%)`);
          x.fillStyle = g; x.beginPath(); x.moveTo(cx + 3, cy); x.lineTo(cx + 61, cy); x.lineTo(cx + 61, cy + 46); x.quadraticCurveTo(cx + 32, cy + 68, cx + 3, cy + 46); x.closePath(); x.fill();
        }
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(0.9, 0.9); t.anisotropy = 8; return t;
      })();
      const FW = total / 2 + 0.6, FH = 2.15, RH = 1.45, T = 0.34; // half width, wall height, roof height, thickness
      const outer = new THREE.Shape();
      outer.moveTo(-FW - T, 0); outer.lineTo(FW + T, 0); outer.lineTo(FW + T, FH); outer.lineTo(FW + T + 0.35, FH); outer.lineTo(0, FH + RH + T * 1.6); outer.lineTo(-FW - T - 0.35, FH); outer.lineTo(-FW - T, FH); outer.closePath();
      const inner = new THREE.Path();
      inner.moveTo(-FW, 0.0001); inner.lineTo(-FW, FH); inner.lineTo(0, FH + RH); inner.lineTo(FW, FH); inner.lineTo(FW, 0.0001); inner.closePath();
      outer.holes.push(inner);
      const frameGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.9, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 6 });
      const terr = new THREE.MeshPhysicalMaterial({ color: 0xd2603a, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2 });
      const terrSide = new THREE.MeshPhysicalMaterial({ map: tileTex, roughness: 0.5, clearcoat: 0.3 });
      const frame = new THREE.Mesh(frameGeo, [terr, terrSide]); frame.castShadow = frame.receiveShadow = true;
      frame.position.z = -1.1; scene.add(frame);
      // round window in the gable
      [chrome, green, greenSide, terr, terrSide].forEach((m) => { m.envMap = envTex; });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 24, 64), chrome); ring.position.set(0, FH + RH * 0.42, -0.65); ring.castShadow = true; scene.add(ring);
      // chimney
      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.7), terr); chim.position.set(FW * 0.55, FH + RH * 0.62, -0.65); chim.castShadow = true; scene.add(chim);

      const ease = (t) => 1 - Math.pow(1 - U.clamp(t, 0, 1), 3);
      const back = (t) => { t = U.clamp(t, 0, 1); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
      const proj = new THREE.Vector3();
      R.seek = (t) => {
        const f = back(t / 1.0), a = ease((t - 0.35) / 1.1), b = back((t - 1.05) / 0.9);
        frame.scale.set(1, Math.max(0.001, f), 1); ring.scale.setScalar(Math.max(0.001, back((t - 0.6) / 0.6))); chim.scale.set(1, Math.max(0.001, back((t - 0.7) / 0.6)), 1);
        p1.position.y = (1 - a) * 4.5; p1.rotation.x = (1 - a) * -1.0;
        p2.position.set((1 - b) * -0.0, (1 - b) * 0.0, (1 - b) * 9); p2.rotation.y = (1 - b) * -1.4;
        const orbit = -0.36 + ease(t / 3.5) * 0.2;
        const dist = 20.5 - ease(t / 3.5) * 1.3;
        cam.position.set(Math.sin(orbit) * dist, 3.3 + (1 - ease(t / 3.5)) * 0.6, Math.cos(orbit) * dist);
        cam.lookAt(target);
        renderer.render(scene, cam);
        proj.set(0, -0.45, 0.9).project(cam);
        ru.style.left = ((proj.x + 1) / 2 * W) + "px"; ru.style.top = ((1 - proj.y) / 2 * H) + "px";
        ru.style.opacity = U.clamp((t - 1.6) / 0.6, 0, 1);
      };
      R.seek(0);
    },
    seek(t) { R.seek(t); },
  };
})();
