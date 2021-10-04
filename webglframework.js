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
    gl = a.getContext`webgl`;

    // Compile program
    
    // var vs = gl.createShader(gl.VERTEX_SHADER);
    var vs = gl.createShader(35633);
    
    // Vertex shader
    gl.shaderSource(
      vs,
      `
        attribute vec4 position; 
        attribute vec4 color;
        uniform mat4 mvp;
        uniform float mvpfactor;
        uniform mat4 model;
        uniform mat4 modelInverse;
        varying vec4 v_color;
        varying vec3 v_position;
        void main() {
          gl_Position = mvp * position;
          v_position = vec3(model * position);
          v_color = color;
        }
      `
    );
    gl.compileShader(vs);
    
    // var fs = gl.createShader(gl.FRAGMENT_SHADER);
    var fs = gl.createShader(35632);
    
    // Fragment shader
    gl.shaderSource(
      fs,
      `
        precision mediump float;
        uniform vec3 light;
        varying vec3 v_position;
        varying vec4 v_color;
        void main() {
          vec3 normal = normalize(cross(dFdx(v_position), dFdy(v_position)));
          float nDotL = max(dot(light, normal), 0.0);
          vec3 diffuse = v_color.rgb * nDotL;
          vec3 ambient = 0.2 * v_color.rgb;
          gl_FragColor = vec4(diffuse + ambient, 1.0);
        }
      `
    );
    gl.compileShader(fs);
    W.P = gl.createProgram();
    gl.attachShader(W.P, vs);
    gl.attachShader(W.P, fs);
    gl.linkProgram(W.P);
    gl.useProgram(W.P);
    
    // Log errors
    console.log('vertex shader:', gl.getShaderInfoLog(vs) || 'OK');
    console.log('fragment shader:', gl.getShaderInfoLog(fs) || 'OK');
    console.log('program:', gl.getProgramInfoLog(W.P) || 'OK');
    
    // Set background color (rgba)
    gl.clearColor(1, 1, 1, 1);
    
    // Enable depth-sorting
    // gl.enable(gl.DEPTH_TEST);
    gl.enable(2929);
  },

  // Bind a data buffer to an attribute, fill it with data and enable it
  b: (data, attribute) => {
    
    // gl.bindBuffer(gl.ARRAY_b, gl.createBuffer());
    gl.bindBuffer(34962, gl.createBuffer());
    
    //gl.bufferData(gl.ARRAY_b, data, gl.STATIC_DRAW);
    gl.bufferData(34962, data, 35044);
    
    var a = gl.getAttribLocation(W.P, attribute);
    
    // gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(a, 3, 5126, false, 0, 0);
    
    gl.enableVertexAttribArray(a);
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
    
    // Consider previous state, or the default state
    var prev = W.p[t.n] = W.n[t.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:"777"};
    
    // Merge it with the new state passed in parameter
    t = {...prev, ...t};
    
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
  
  d: t => {
    
    // Clear canvas
    
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(16640);

    // Set the camera matrix (perspective matrix: fov = .5 radian, aspect = a.width/a.height, near: 1, far: 1000)
    var cameraMatrix = new DOMMatrix([
      1 / Math.tan(.5) / (a.width/a.height), 0, 0, 0, 
      0, 1 / Math.tan(.5), 0, 0, 
      0, 0, (1000 + 1) * 1 / (1 - 1000), -1,
      0, 0, (2 * 1 * 1000) * 1 / (1 - 1000), 0
    ]);
    W.N = "_c";
    W.t(cameraMatrix);
    
    // Draw all the shapes
    var vertices = [], indices = [];
    for(var i in W.n){
      var shape = W.n[i];
      if(shape.f < shape.t) shape.f++;

      // Initialize a shape
      
      // Plane (2 x 2)
      //
      //  v1------v0
      //  |       |
      //  |   x   |
      //  |       |
      //  v2------v3
      
      if(shape.T == "q"){
        vertices = [
          1, 1, 0,
         -1, 1, 0,
         -1,-1, 0,
          1,-1, 0
        ];

        indices = [
          0, 1, 2,
          0, 2, 3
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
      
      else if(shape.T == "c"){
        
        vertices = [
          1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1, // front
          1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1, // right
          1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1, // up
         -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1, // left
         -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1, // down
          1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1  // back
        ];

        indices = [
          0, 1, 2,   0, 2, 3,  // front
          4, 5, 6,   4, 6, 7,  // right
          8, 9, 10,  8, 10,11, // up
          12,13,14,  12,14,15, // left
          16,17,18,  16,18,19, // down
          20,21,22,  20,22,23  // back
        ];
      }
      
      // Pyramid (2 x 2 x sqrt(3))
      //
      //      ^
      //     /\\
      //    // \ \
      //   /+---\-+
      //  //  x  \/
      //  +------+
      else if(shape.T == "p"){
        var h = 3**.5; // height = sqrt(3) / 2 * bottom
        
        vertices = [
          -1, 0, 1,    1, 0, 1,  0, h, 0,  // Front
           1, 0, 1,    1, 0,-1,  0, h, 0,  // Right
           1, 0,-1,   -1, 0,-1,  0, h, 0,  // Back
          -1, 0,-1,   -1, 0, 1,  0, h, 0,  // Left
          -1, 0, 1,   -1, 0,-1,  1, 0, 1,  // Base
          -1, 0,-1,    1, 0,-1,  1, 0, 1
        ];

        indices = [
          0, 1, 2,    // Front
          3, 4, 5,    // Right
          6, 7, 8,    // Back
          9, 10, 11,  // Left
          12, 13, 14, // Base
          15, 16, 17
        ];
      }          

      // Set the position buffer
      
      // W.b(vertices, 'position');
      W.b(new Float32Array(vertices), 'position');
      
      // gl.bindBuffer(gl.ELEMENT_ARRAY_b, indexb);
      gl.bindBuffer(34963, gl.createBuffer());
      
      // gl.bufferData(gl.ELEMENT_ARRAY_b, indices, gl.STATIC_DRAW);
      gl.bufferData(34963, new Uint16Array(indices), 35044);

      // Set shape color
      gl.vertexAttrib3fv(
        gl.getAttribLocation(W.P, 'color'),
        [...shape.b].map(a => ("0x" + a) / 16) // convert rgb hex string into 3 values between 0 and 1 
      );
        
      // Set the model matrix
      W.N = shape.n;
      var modelMatrix = new DOMMatrix();
      W.t(modelMatrix);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(W.P, 'model'),
        false,
        modelMatrix.toFloat32Array()
      );
      
      // Set the inverse of the model matrix
      gl.uniformMatrix4fv(
        gl.getUniformLocation(W.P, 'modelInverse'),
        false,
        modelMatrix.inverse().toFloat32Array()
      );
      
      // Set the model's mvp matrix (cam x model)
      modelMatrix.preMultiplySelf(cameraMatrix);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(W.P, 'mvp'),
        false,
        modelMatrix.toFloat32Array()
      );
      
      W.N = "_l";
      gl.uniform3f(
        gl.getUniformLocation(W.P, 'light'),
        W.l("x"), W.l("y"), W.l("z")
      );

      // Render
      
      // gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
      gl.drawElements(4, indices.length, 5123, 0);
    }
  }
}

// Initialize WebGL program, light, amera, action
W.s();
W.light({z:1});
W.camera({});
setInterval(W.d, 16);