W = {

  // Globals
  // -------
  
  o: 0,
  p: {},    // previous states
  n: {},    // next states
  
  // WebGL helpers
  // -------------
  
  // Setup the WebGL program
  s: t => {
    
    // WebGL context
    gl = a.getContext("webgl2");

    // Compile program
    W.P = gl.createProgram();
    
    // Vertex shader
    gl.shaderSource(
      
      // t = gl.createShader(gl.VERTEX_SHADER);
      t = gl.createShader(35633),
      
      `#version 300 es
      in vec4 position; 
      in vec4 color;
      uniform mat4 p;
      uniform mat4 v;
      uniform mat4 pv;
      uniform mat4 m;
      uniform vec2 billboard;
      out vec4 v_color;
      out vec3 v_position;
      void main() {
        if(billboard.x > 0.){
          mat4 camera2world = inverse(v);
          vec4 mesh_center = m[3];
          gl_Position = p * v * (mesh_center + camera2world * (position * vec4(billboard, 1., 1.)));
        }
        else {
          gl_Position = p * v * m * position;
        }
        v_position = vec3(m * position);
        v_color = color;
      }`
    );
    gl.compileShader(t);
    gl.attachShader(W.P, t);
    console.log('vertex shader:', gl.getShaderInfoLog(t) || 'OK');
    
    // Fragment shader
    gl.shaderSource(

      // t = gl.createShader(gl.FRAGMENT_SHADER);
      t = gl.createShader(35632),
      
      `#version 300 es\nprecision mediump float;
      uniform vec3 light;
      in vec3 v_position;
      in vec4 v_color;
      out vec4 c;
      void main() {
        c = vec4(
          v_color.rgb * (
            max(dot(light, normalize(cross(dFdx(v_position), dFdy(v_position)))), 0.0) // ambient light
            + .2 // diffuse light
          ), 1
        );
      }`
    );
    gl.compileShader(t);
    gl.attachShader(W.P, t);
    console.log('fragment shader:', gl.getShaderInfoLog(t) || 'OK');
    
    gl.linkProgram(W.P);
    gl.useProgram(W.P);
    console.log('program:', gl.getProgramInfoLog(W.P) || 'OK');
    
    // Set background color (rgba)
    gl.clearColor(1, 1, 1, 1);
    
    // Enable depth-sorting
    // gl.enable(gl.DEPTH_TEST);
    gl.enable(2929);
  },

  // Transition helpers
  // ------------------

  // Interpolate a property between two values
  l: t => W.p[W.N][t] + (W.n[W.N][t] -  W.p[W.N][t]) * (W.n[W.N].f / W.n[W.N].t),
  
  // Transition an item
  t: t => t.translateSelf(W.l("x"), W.l("y"), W.l("z"))
           .rotateSelf(W.l("rx"),0,0)
           .rotateSelf(0,W.l("ry"),0)
           .rotateSelf(0,0,W.l("rz"))
           .scaleSelf(W.l("w"),W.l("h"),W.l("d")),
  
  
  // Framework
  // ---------

  // Set the new state of a 3D object (or group / camera / light source)
  i: t => {
    
    // Default name
    t.n ||= "o" + W.o++;
    
    // Merge previous state or default state with the new state passed in parameter
    t = {...(W.p[t.n] = W.n[t.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:"777"}), ...t};
    
    // Save the t duration (in frames), or 0 by default
    t.t ||= 1;
    
    // Reset t frame counter
    t.f = 1;                        
    
    // Save new state
    W.n[t.n] = t;
  },
  
  // Objects in the scene
  group: t => { t.T = "g"; W.i(t) },
  
  plane: t => { t.T = "q"; W.i(t) },
  
  sprite: t => { t.T = "s"; W.i(t) },
  
  cube: t => { t.T = "c"; W.i(t) },
  
  pyramid: t => { t.T = "p"; W.i(t) },
  
  move: t => W.i(t),
  
  camera: t => { t.n = "_c", W.i(t) },
    
  light: t => { t.n = "_l"; W.i(t) },
  
  // Draw
  d: (pv, p, v, m, i, s, vertices) => {
    
    // Clear canvas
    
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(16640);

    // Projection matrix
    // (perspective matrix: fov = .5 radian, aspect = a.width/a.height, near: 1, far: 1000)
    p = new DOMMatrix([
      1 / Math.tan(.5) / (a.width/a.height), 0, 0, 0, 
      0, 1 / Math.tan(.5), 0, 0, 
      0, 0, (900 + 1) * 1 / (1 - 900), -1,
      0, 0, (2 * 1 * 900) * 1 / (1 - 900), 0
    ]);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(W.P, 'p'),
      false,
      p.toFloat32Array()
    );
    
    // View matrix
    v = new DOMMatrix();
    W.N = "_c";
    W.t(v);
    gl.uniformMatrix4fv(
      gl.getUniformLocation(W.P, 'v'),
      false,
      v.toFloat32Array()
    );
    
    // Draw all the shapes
    vertices = [];
    for(i in W.n){
      s = W.n[i];
      if(s.f < s.t) s.f++;

      // Initialize a shape
      
      // Plane (2 x 2)
      //
      //  v1------v0
      //  |       |
      //  |   x   |
      //  |       |
      //  v2------v3
      
      if(s.T == "q"){
        vertices = [
          1, 1, 0,    -1, 1, 0,   -1,-1, 0,
          1, 1, 0,    -1,-1, 0,    1,-1, 0
        ];
      }
      
      // Cube (2x2x2)
      //
      //    v6----- v5
      //   /|      /|
      //  v1------v0|
      //  | |   x | |
      //  | |v7---|-|v4
      //  |/      |/
      //  v2------v3
      
      else if(s.T == "c"){
        
        vertices = [
          1, 1, 1,  -1, 1, 1,  -1,-1, 1, // front
          1, 1, 1,  -1,-1, 1,   1,-1, 1,
          1, 1, 1,   1,-1, 1,   1,-1,-1, // right
          1, 1, 1,   1,-1,-1,   1, 1,-1,
          1, 1, 1,   1, 1,-1,  -1, 1,-1, // up
          1, 1, 1,  -1, 1,-1,  -1, 1, 1,
         -1, 1, 1,  -1, 1,-1,  -1,-1,-1, // left
         -1, 1, 1,  -1,-1,-1,  -1,-1, 1,
         -1,-1,-1,   1,-1,-1,   1,-1, 1, // down
         -1,-1,-1,   1,-1, 1,  -1,-1, 1,
          1,-1,-1,  -1,-1,-1,  -1, 1,-1, // back
          1,-1,-1,  -1, 1,-1,   1, 1,-1
        ];
      }
      
      // Pyramid (2 x 2 x sqrt(3))
      // height = sqrt(3) / 2 * bottom == 3**.5
      //
      //      ^
      //     /\\
      //    // \ \
      //   /+---\-+
      //  //  x  \/
      //  +------+
      else if(s.T == "p"){
        
        vertices = [
          -1, 0, 1,    1, 0, 1,  0, 3**.5, 0,  // Front
           1, 0, 1,    1, 0,-1,  0, 3**.5, 0,  // Right
           1, 0,-1,   -1, 0,-1,  0, 3**.5, 0,  // Back
          -1, 0,-1,   -1, 0, 1,  0, 3**.5, 0,  // Left
          -1, 0, 1,   -1, 0,-1,  1, 0, 1,  // Base
          -1, 0,-1,    1, 0,-1,  1, 0, 1
        ];
      }          

      // Set the position buffer
      
      // gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bindBuffer(34962, gl.createBuffer());
      
      // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      gl.bufferData(34962, new Float32Array(vertices), 35044);
      
      gl.enableVertexAttribArray(gl.vertexAttribPointer(gl.getAttribLocation(W.P, 'position'), 3, 5126, false, 0, 0));

      // Set shape color
      gl.vertexAttrib3fv(
        gl.getAttribLocation(W.P, 'color'),
        [...s.b].map(a => ("0x" + a) / 16) // convert rgb hex string into 3 values between 0 and 1 
      );
        
      // Set the model matrix
      W.N = s.n;
      var m = new DOMMatrix();
      W.t(m);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(W.P, 'm'),
        false,
        m.toFloat32Array()
      );
      
      W.N = "_l";
      gl.uniform3f(
        gl.getUniformLocation(W.P, 'light'),
        W.l("x"), W.l("y"), W.l("z")
      );
      
      // Billboard ([width, height] if it's a billboard, [0,0] otherwise)
      gl.uniform2f(
        gl.getUniformLocation(W.P, 'billboard'),
        s.T == "s" ? s.w : 0,
        s.T == "s" ? s.h : 0,
      );
      
      // gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
      gl.drawArrays(4, 0, vertices.length/3);
    }
  }
}

// Initialize WebGL program, light, amera, action
W.s();
W.light({z:1});
W.camera({});
setInterval(W.d, 16);