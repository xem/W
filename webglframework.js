W = {

  // Globals
  // -------
  
  sprite_count: 0,
  plane_count: 0,
  cube_count: 0,
  pyramid_count: 0,
  objects1: {},    // previous states
  objects2: {},    // next states
  
  // WebGL helpers
  // -------------
  
  // Compile the WebGL program
  compile: t => {
    
    // Vertex shader
    var vshader = `
    attribute vec4 position; 
    attribute vec4 color;
    attribute vec4 normal;
    uniform mat4 mvp;
    uniform float mvpfactor;
    uniform mat4 model;
    uniform mat4 modelInverse;
    varying vec4 v_color;
    varying vec3 v_normal;
    varying vec3 v_position;
    void main() {
      gl_Position = mvp * position;
      v_position = vec3(model * position);
      v_normal = vec3(normal * modelInverse);
      v_color = color;
    }`;

    // Fragment shader
    var fshader = `
    precision mediump float;
    uniform vec3 lightDirection;
    varying vec3 v_normal;
    varying vec3 v_position;
    varying vec4 v_color;
    void main() {
      float nDotL = max(dot(lightDirection, normalize(v_normal)), 0.0);
      vec3 diffuse = v_color.rgb * nDotL;
      vec3 ambient = 0.2 * v_color.rgb;
      gl_FragColor = vec4(diffuse + ambient, 1.0);
    }`;

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vshader);
    gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fshader);
    gl.compileShader(fs);
    W.program = gl.createProgram();
    gl.attachShader(W.program, vs);
    gl.attachShader(W.program, fs);
    gl.linkProgram(W.program);
    gl.useProgram(W.program);
    /*console.log('vertex shader:', gl.getShaderInfoLog(vs) || 'OK');
    console.log('fragment shader:', gl.getShaderInfoLog(fs) || 'OK');
    console.log('program:', gl.getProgramInfoLog(program) || 'OK');*/
  },

  // Bind a data buffer to an attribute, fill it with data and enable it
  buffer: (gl, data, program, attribute, size, type) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    var a = gl.getAttribLocation(program, attribute);
    gl.vertexAttribPointer(a, size, type, false, 0, 0);
    gl.enableVertexAttribArray(a);
  },
  
  // Matrix helpers
  // --------------

  // Transpose a DOMMatrix
  transpose: m => {
    return new DOMMatrix([
      m.m11, m.m21, m.m31, m.m41,
      m.m12, m.m22, m.m32, m.m42,
      m.m13, m.m23, m.m33, m.m43,
      m.m14, m.m24, m.m34, m.m44,
    ]);
  },
  
  // Color helpers
  // -------------
  
  // Convert #rgb string to vec3
  rgb: s => [+("0x"+s[1])/16, +("0x"+s[2])/16, +("0x"+s[3])/16],
  // rrggbb: s => [+("0x"+s[1]+s[2])/256, +("0x"+s[3]+s[4])/256, +("0x"+s[5]+s[6])/256],
  
  // Transition helpers
  // ------------------

  // Interpolate a property between two values
  lerp: t => {
    var progress = 1;
    var shape1 = W.objects1[W.name];
    var shape2 = W.objects2[W.name];
    if(shape2.f < shape2.t){
      return shape1[t] + (shape2[t] - shape1[t]) * (shape2.f / shape2.t);
    }
    return shape2[t];
  },
  
  // Transition an item
  transition: t => {
    t.translateSelf(W.lerp("x"), W.lerp("y"), W.lerp("z")).rotateSelf(W.lerp("rx"),0,0).rotateSelf(0,W.lerp("ry"),0).rotateSelf(0,0,W.lerp("rz"));
    if(W.name != "cam"){
      t.scaleSelf(W.lerp("w"),W.lerp("h"),W.lerp("d"));
    }
  },
  
  
  // Framework
  // ---------

  // Set the new state of a 3D object (or group / camera / light source)
  init: t => {
    
    // Save previous state, if any
    var prev = W.objects1[t.n] = W.objects2[t.n] || {};
    
    // For each attribute, take the new value passed in t, or the previous value, or a default value
    t.g = t.g || prev.g || "scene"; // parent group
    t.type = t.type || prev.type;   // type
    t.b = t.b || prev.b || "#888";  // color
    t.w = t.w || prev.w || 0;       // width
    t.h = t.h || prev.h || 0;       // height
    t.d = t.d || prev.d || 1;       // depth
    t.x = ((t.x || t.x === 0) ? t.x : (prev.x || 0));       // position
    t.y = ((t.y || t.y === 0) ? t.y : (prev.y || 0));
    t.z = ((t.z || t.z === 0) ? t.z : (prev.z || 0));
    t.rx = ((t.rx || t.rx === 0) ? t.rx : (prev.rx || 0));  // angle
    t.ry = ((t.ry || t.ry === 0) ? t.ry : (prev.ry || 0));
    t.rz = ((t.rz || t.rz === 0) ? t.rz : (prev.rz || 0));
    
    // Save the transition duration (in frames), or 0 by default
    t.t ||= 1;
    
    // Reset transition frame counter
    t.f = 0;                        
    
    // Save new state
    W.objects2[t.n] = t;
  },
  
  //group: t => {},
  
  plane: t => {
  
    t.n||(t.n=`plane${W.plane_count++}`);
    t.type = "plane";
    W.init(t);
  },
  
  /*sprite: () => {
    t.n||(t.n=`sprite${W.sprite_count++}`);
    t.type = "sprite";
    W.init(t);
  },*/
  
  cube: t => {
    
    t.n||(t.n=`plane${W.cube_count++}`);
    t.type = "cube";
    W.init(t);
  },
  
  pyramid: t => {
    
    t.n||(t.n=`plane${W.pyramid_count++}`);
    t.type = "pyramid";
    W.init(t);
    
  },
  
  move: t => {
    W.init(t);
  },
  
  camera: t => {
    t.n = "cam";
    W.init(t);
  },
  
  light: t => {
    t.n = "light";
    W.init(t);
  },
  
  draw: t => {
    
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the camera matrix (perspective matrix: fov = .5 radian, aspect = a.width/a.height, near: 1, far: 1000)
    var cameraMatrix = new DOMMatrix([
      1 / Math.tan(.5) / (a.width/a.height), 0, 0, 0, 
      0, 1 / Math.tan(.5), 0, 0, 
      0, 0, (1000 + 1) * 1 / (1 - 1000), -1,
      0, 0, (2 * 1 * 1000) * 1 / (1 - 1000), 0
    ]);
    W.name = "cam";
    W.transition(cameraMatrix);
    
    // Draw all the shapes
    var vertices, normals, indices;
    for(var i in W.objects2){
      var shape1 = W.objects1[i];
      var shape2 = W.objects2[i];
      if(shape2.f < shape2.t) shape2.f++;

      // Initialize a shape
      
      // Plane (2 x 2)
      //
      //  v1------v0
      //  |       |
      //  |   x   |
      //  |       |
      //  v2------v3
      
      if(shape2.type){
        
        if(shape2.type == "plane"){
            vertices = new Float32Array([
            1, 1, 0,
           -1, 1, 0,
           -1,-1, 0,
            1,-1, 0
          ]);

          normals = new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
          ]);

          indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
          ]);
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
        
        else if(shape2.type == "cube"){
          
          vertices = new Float32Array([
             1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1, // front
             1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1, // right
             1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1, // up
            -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1, // left
            -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1, // down
             1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1  // back
          ]);

          normals = new Float32Array([
            0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,  // front
            1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,  // right
            0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,  // up
           -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  // left
            0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,  // down
            0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1   // back
          ]);

          indices = new Uint16Array([
            0, 1, 2,   0, 2, 3,  // front
            4, 5, 6,   4, 6, 7,  // right
            8, 9, 10,  8, 10,11, // up
            12,13,14,  12,14,15, // left
            16,17,18,  16,18,19, // down
            20,21,22,  20,22,23  // back
          ]);
        }
        
        // Pyramid (2 x 2 x sqrt(3))
        else if(shape2.type == "pyramid"){
          var h = 3**.5; // height = sqrt(3) / 2 * bottom
          
          vertices = new Float32Array([
            -1, 0, 1,    1, 0, 1,  0, h, 0,  // Front
             1, 0, 1,    1, 0,-1,  0, h, 0,  // Right
             1, 0,-1,   -1, 0,-1,  0, h, 0,  // Back
            -1, 0,-1,   -1, 0, 1,  0, h, 0,  // Left
            -1, 0, 1,   -1, 0,-1,  1, 0, 1,  // Base
            -1, 0,-1,    1, 0,-1,  1, 0, 1
          ]);

          normals = new Float32Array([
            0,-1, h,   0,-1, h,  0,-1, h,  // Back
            h,-1, 0,   h,-1, 0,  h,-1, 0,  // Left
            0,-1,-h,   0,-1,-h,  0,-1,-h,  // Front
           -h,-1, 0,  -h,-1, 0, -h,-1, 0,  // Right
            0, 1, 0,   0, 1, 0,  0, 1, 0,  // Base
            0, 1, 0,   0, 1, 0,  0, 1, 0
          ]);

          indices = new Uint16Array([
            0, 1, 2,    // Front
            3, 4, 5,    // Right
            6, 7, 8,    // Back
            9, 10, 11,  // Left
            12, 13, 14, // Base
            15, 16, 17
          ]);
        }          
      
        // Count vertices
        var n = indices.length;

        // Set position, normal buffers
        W.buffer(gl, vertices, W.program, 'position', 3, gl.FLOAT);
        W.buffer(gl, normals, W.program, 'normal', 3, gl.FLOAT);

        // Set indices
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // Set shape color
        var color = gl.getAttribLocation(W.program, 'color');
        gl.vertexAttrib3fv(color, W.rgb(shape2.b));
        
        // Get uniforms used in the loop
        var model = gl.getUniformLocation(W.program, 'model');
        var mvp = gl.getUniformLocation(W.program, 'mvp');
        var modelInverse = gl.getUniformLocation(W.program, 'modelInverse');
        var lightDirection = gl.getUniformLocation(W.program, 'lightDirection');
          
        // Set the model matrix
        var modelMatrix = new DOMMatrix();
        W.name = shape2.n;
        W.transition(modelMatrix);
        gl.uniformMatrix4fv(model, false, modelMatrix.toFloat32Array());
        
        // Set the model's mvp matrix (cam x model)
        var mvpMatrix = new DOMMatrix(modelMatrix);
        mvpMatrix.preMultiplySelf(cameraMatrix);
        gl.uniformMatrix4fv(mvp, false, mvpMatrix.toFloat32Array());
        
        // Set the inverse of the model matrix
        gl.uniformMatrix4fv(modelInverse, false, modelMatrix.inverse().toFloat32Array());
        
        W.name = "light";
        gl.uniform3f(lightDirection, W.lerp("x"), W.lerp("y"), W.lerp("z"));

        // Render
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
      }
    }
  }
}

// Initialize WebGL program, light, amera, action
gl = a.getContext('webgl');
W.compile();
gl.clearColor(1, 1, 1, 1);
gl.enable(gl.DEPTH_TEST);
W.light({z:1});
W.camera({});
setInterval(W.draw, 16);