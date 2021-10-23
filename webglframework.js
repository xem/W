// WebGL framework
// ===============
W = {

  // Globals
  // -------
  
  last: 0,        // timestamp of last frame
  dt: 0,          // delta time
  o: 0,           // object counter
  p: {},          // objects previous states (list 1: opaque items, list 2: items with transparency)
  n: {},          // objects next states
  textures: {},   // textures list
  vertices: {},   // vertex buffers 
  texCoords: {},  // texture coordinates buffers 
  perspective:    // perspective matrix: fov = .5rad, aspect = a.width/a.height, near: 1, far: 1000)
    new DOMMatrix([
      1 / Math.tan(.5) / (a.width/a.height), 0, 0, 0, 
      0, 1 / Math.tan(.5), 0, 0, 
      0, 0, (900 + 1) * 1 / (1 - 900), -1,
      0, 0, (2 * 1 * 900) * 1 / (1 - 900), 0
    ]),
  
  // WebGL helpers
  // -------------
  
  // Setup the WebGL program
  s: t => {
    
    // WebGL context
    gl = a.getContext("webgl2");
    
    // Don't compute triangles back faces (optional)
    // gl.enable(gl.CULL_FACE);
    
    // Default blending method for transparent objects
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(770, 771);
    
    // Enable texture 0
    // gl.activeTexture(gl.TEXTURE0);
    gl.activeTexture(33984);

    // New WebGL program
    W.P = gl.createProgram();
    
    // Vertex shader
    gl.shaderSource(
      
      // t = gl.createShader(gl.VERTEX_SHADER);
      t = gl.createShader(35633),
      
      `#version 300 es
      in vec4 position, color, tex;
      uniform mat4 pv, eye, m;
      uniform vec3 billboard;
      out vec4 v_position, v_color, v_texCoord;
      void main() {
        
        // Vertex position in the world space
        v_position = (billboard.z > 0.)
          ? (m[3] + eye * (position * -vec4(billboard, 0))) // billboards
          : (m * position); // other objects

        gl_Position = pv * v_position;

        // Other varyings passed to the fragment shader.
        v_color = color;
        v_texCoord = tex;
      }`
    );
    gl.compileShader(t);
    gl.attachShader(W.P, t);
    console.log('vertex shader:', gl.getShaderInfoLog(t) || 'OK');
    
    // Fragment shader
    gl.shaderSource(

      // t = gl.createShader(gl.FRAGMENT_SHADER);
      t = gl.createShader(35632),
      
      `#version 300 es
      precision highp float;
      in vec4 v_position, v_color, v_texCoord;
      uniform vec3 light;
      uniform sampler2D sampler;
      out vec4 c;
      void main() {
        vec4 col = (v_color.a == 0. ? texture(sampler, v_texCoord.xy) : v_color);
        c = vec4(col.rgb * (
          max(dot(normalize(light), normalize(cross(dFdx(v_position.xyz), dFdy(v_position.xyz)))), 0.0) // ambient light
          + .2 // diffuse light
        ), col.a);
      }
      `
    );
    gl.compileShader(t);
    gl.attachShader(W.P, t);
    console.log('fragment shader:', gl.getShaderInfoLog(t) || 'OK');
    
    // Compile program
    gl.linkProgram(W.P);
    gl.useProgram(W.P);
    console.log('program:', gl.getProgramInfoLog(W.P) || 'OK');
    
    // Set background color (rgba)
    gl.clearColor(1, 1, 1, 1);
    
    // Enable depth-sorting
    // gl.enable(gl.DEPTH_TEST);
    gl.enable(2929);
    
    // Declare vertice positions and texture coordinates buffers of built-in shapes
    
    // Cube (2x2x2)
    //
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |  x  | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    gl.bindBuffer(34962, W.vertices.c = gl.createBuffer());
    
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(34962, new Float32Array([
      1, 1, 1,  -1, 1, 1,  -1,-1, 1, // front
      1, 1, 1,  -1,-1, 1,   1,-1, 1,
      1, 1, 1,   1,-1, 1,   1,-1,-1, // right
      1, 1, 1,   1,-1,-1,   1, 1,-1,
      1, 1, 1,   1, 1,-1,  -1, 1,-1, // up
      1, 1, 1,  -1, 1,-1,  -1, 1, 1,
     -1, 1, 1,  -1, 1,-1,  -1,-1,-1, // left
     -1, 1, 1,  -1,-1,-1,  -1,-1, 1,
     -1,-1, 1,   1,-1 ,1,   1,-1,-1, // down
     -1,-1, 1,   1,-1,-1,  -1,-1,-1,
      1,-1,-1,  -1,-1,-1,  -1, 1,-1, // back
      1,-1,-1,  -1, 1,-1,   1, 1,-1
    ]), 35044); 

    gl.bindBuffer(34962, W.texCoords.c = gl.createBuffer());
    
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(34962, new Float32Array([
      1, 1,      0, 1,   0, 0, // front
      1, 1,      0, 0,   1, 0,            
      1, 1,      0, 1,   0, 0, // right
      1, 1,      0, 0,   1, 0, 
      1, 1,      0, 1,   0, 0, // up
      1, 1,      0, 0,   1, 0,
      1, 1,      0, 1,   0, 0, // left
      1, 1,      0, 0,   1, 0,
      1, 1,      0, 1,   0, 0, // down
      1, 1,      0, 0,   1, 0,
      1, 1,      0, 1,   0, 0, // back
      1, 1,      0, 0,   1, 0,
    ]), 35044);
    
    
    // Pyramid (2 x 2 x 2)
    //
    //      ^
    //     /\\
    //    // \ \
    //   /+-x-\-+
    //  //     \/
    //  +------+
    
    gl.bindBuffer(34962, W.vertices.p = gl.createBuffer());
    
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(34962, new Float32Array([
      -1, -1, 1,    1, -1, 1,  0, 1, 0,  // Front
       1, -1, 1,    1, -1,-1,  0, 1, 0,  // Right
       1, -1,-1,   -1, -1,-1,  0, 1, 0,  // Back
      -1, -1,-1,   -1, -1, 1,  0, 1, 0,  // Left
      -1, -1, 1,   -1, -1,-1,  1,-1, 1,  // Base
      -1, -1,-1,    1, -1,-1,  1,-1, 1
    ]), 35044); 

    gl.bindBuffer(34962, W.texCoords.p = gl.createBuffer());
    
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(34962, new Float32Array([
       0, 0,   1, 0,  .5, 1,  // Front
       0, 0,   1, 0,  .5, 1,  // Right
       0, 0,   1, 0,  .5, 1,  // Back
       0, 0,   1, 0,  .5, 1,  // Left
       1, 0,   0, 0,   0, 1,  // base
       1, 0,   0, 1,   1, 1,
    ]), 35044);
    
    
    // Quad / billboard (2 x 2)
    //
    //  v1------v0
    //  |       |
    //  |   x   |
    //  |       |
    //  v2------v3
    
    gl.bindBuffer(34962, W.vertices.q = W.vertices.b = gl.createBuffer());
    
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(34962, new Float32Array([
      1, 1, 0,    -1, 1, 0,   -1,-1, 0,
      1, 1, 0,    -1,-1, 0,    1,-1, 0
    ]), 35044); 

    gl.bindBuffer(34962, W.texCoords.q = W.texCoords.b = gl.createBuffer());
    
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(34962, new Float32Array([
      1, 0,     0, 0,    0, 1,
      1, 0,     0, 1,    1, 1
    ]), 35044);
  },

  // Transition helpers
  // ------------------

  // Interpolate a property between two values
  l: t => W.n[W.N].t ?
    W.p[W.N][t] + (W.n[W.N][t] -  W.p[W.N][t]) * (W.n[W.N].f / W.n[W.N].t)
    : W.n[W.N][t],
  
  // Transition an item
  t: t => (new DOMMatrix)
    .translateSelf(W.l("x"), W.l("y"), W.l("z"))
    .rotateSelf(W.l("rx"),W.l("ry"),W.l("rz"))
    .scaleSelf(W.l("w")/2,W.l("h")/2,W.l("d")/2)
    .multiplySelf(t),
  
  // Framework
  // ---------

  // Set the new state of a 3D object (or group / camera / light source)
  i: (t, texture) => {
    
    // Custom name or default name ("o" + auto-increment)
    t.n ||= "o" + W.o++;
    
    // If a new texture is provided, build it and save it in W.textures
    if(t.b && t.b.id && !W.textures[t.b.id]){
      
      texture = gl.createTexture();
      
      //gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.pixelStorei(37441, true);
      
      //gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindTexture(3553, texture);
      
      //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(37440, 1);
      
      //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.b);
      gl.texImage2D(3553, 0, 6408, 6408, 5121, t.b);
      
      //gl.generateMipmap(gl.TEXTURE_2D);
      gl.generateMipmap(3553);
      
      W.textures[t.b.id] = texture;
    }
    
    // Merge previous state or default state with the new state passed in parameter
    t = {...(W.p[t.n] = W.n[t.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:"777"}), ...t};
    
    // Save the transition duration (in frames), or 0 by default
    t.t ||= 0;
    
    // Reset the transition timer.
    t.f = 0;
    
    // Save new state
    W.n[t.n] = t;
  },
  
  // Objects in the scene
  group: t => { t.T = "g"; W.i(t) },
  
  plane: t => { t.T = "q"; W.i(t) },
  
  billboard: t => { t.T = "b"; W.i(t) },
  
  cube: t => { 
  
    t.T = "c"; W.i(t)
    
  },
  
  pyramid: t => { t.T = "p"; W.i(t) },
  
  move: t => W.i(t),
  
  camera: t => { t.n = "C", W.i(t) },
    
  light: t => { t.n = "L"; W.i(t) },
  
  // Draw
  d: (now, p, v, m, i, s, buffer, transparent = []) => {
    W.dt = (now - W.last) / 1000;
    W.last = now;
    requestAnimationFrame(W.d);
    
    // Clear canvas
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(16640);
    
    // View Matrix (inverse of Camera Matrix)
    v = new DOMMatrix;    // create an identity Matrix v
    W.N = "C";            // consider the camera
    v = W.t(v);           // apply the camera transformations to v
    
    gl.uniformMatrix4fv(  // send it to the shaders
      gl.getUniformLocation(W.P, 'eye'),
      false,
      v.toFloat32Array()
    );
    
    // Eye matrix → View matrix (inverted camera's model matrix)
    v.invertSelf();

    // PV matrix (projection matrix * view matrix)
    v.preMultiplySelf(W.perspective);
    
    gl.uniformMatrix4fv(  // send it to the shaders
      gl.getUniformLocation(W.P, 'pv'),
      false,
      v.toFloat32Array()
    );
    
    for(i in W.n){
      
      // Render the shapes with no transparency (alpha blending disabled)
      if(!W.n[i].b.id && !W.n[i].b[3]){
        W.r(W.n[i]);
      }
      
      // Add the objects with transparency (rgba or texture) in an array
      else {
        transparent.push(W.n[i]);
      }
    }
    
    // Order transparent objects from back to front
    transparent.sort((a,b) => {
      // Return a value > 0 if b is closer to the camera than a
      // Return a value < 0 if a is closer to the camera than b
      return a.m && b.m && (W.dist(b.m, W.n.C.m) - W.dist(a.m, W.n.C.m));
    });

    // And render them (alpha blending enabled)
    gl.enable(gl.BLEND);
    for(i in transparent){
      W.r(transparent[i]);
    }
    
    // Disable alpha blending for next frame
    gl.disable(gl.BLEND);
  },
  
  // Render an object
  r: (s, center = [0,0,0], vertices, texCoords) => {

    // If the object has a texture
    if (s.b.id) {

      // Set the texture's target (2D or cubemap)
      // gl.bindTexture(gl.TEXTURE_2D, W.textures[s.b.id]);
      gl.bindTexture(3553, W.textures[s.b.id]);

      // Pass texture 0 to the sampler
      gl.uniform1i(gl.getUniformLocation(W.P, 'sampler'), 0);
    }

    // If the object has a transition, increment its timer...
    if(s.f < s.t) s.f += W.dt;
    
    // ...but don't let it go over the transition duration.
    if(s.f > s.t) s.f = s.t;
    
    s.vertices = vertices;
    s.texCoords = texCoords;
    s.center = center;

    // Set the model matrix
    W.N = s.n;
    var m = new DOMMatrix(W?.n[s.g]?.m);
    m = W.t(m);
    W.n[s.n].m=m;
    gl.uniformMatrix4fv(  // send it to the shaders
      gl.getUniformLocation(W.P, 'm'),
      false,
      m.toFloat32Array()
    );

    // Ignore camera, light
    if(!["C","L"].includes(s.n)){

      // Set the position buffer
      
      //gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bindBuffer(34962, W.vertices[s.T]);
      
      // gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'position'), 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'position'), 3, 5126, false, 0, 0);
      
      gl.enableVertexAttribArray(buffer);
      
      // Set the texture coordinatess buffer
      
      // gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bindBuffer(34962, W.texCoords[s.T]);
      
      // gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'tex'), 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'tex'), 2, 5126, false, 0, 0);
      
      gl.enableVertexAttribArray(buffer);
      
      // Set the color / texture
      gl.vertexAttrib4fv(
        gl.getAttribLocation(W.P, 'color'),
        s.b.id ? [0,0,0,0] : [...[...s.b].map(a => ("0x" + a) / 16),
        s.b.id ? 0 : 1] // convert rgb hex string into 3 values between 0 and 1, if a == 0, we use a texture instead
      );
      
      // Consider the light
      W.N = "L";
      
      // Transition the light's direction and sent it to the shaders
      gl.uniform3f(
        gl.getUniformLocation(W.P, 'light'),
        W.l("x"), W.l("y"), W.l("z")
      );
      
      // Billboard info: [width, height, isBillboard]
      gl.uniform3f(
        gl.getUniformLocation(W.P, 'billboard'),
        s.w,
        s.h,
        s.T == "b"
      );
    
      // Draw
      // gl.drawArrays(gl.TRIANGLES, 0, gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE));
      gl.drawArrays(4, 0, gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE));
    }
  },
  
  // Compute the distance squared between two objects (useful for sorting transparent items)
  dist: (a, b) => (b.m41 - a.m41)**2 + (b.m42 - a.m42)**2 + (b.m43 - a.m43)**2
}

// When everything is loaded: setup WebGL program, light, camera, action
W.s();
W.light({z:1});
W.camera({});
W.d();
