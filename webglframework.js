W = {

  // Globals
  // -------
  
  o: 0,
  p: {},    // previous states
  n: {},    // next states
  textures: {},
  
  // WebGL helpers
  // -------------
  
  // Setup the WebGL program
  s: async t => {
    
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
      in vec2 tex;
      uniform mat4 pv;
      uniform mat4 eye;
      uniform mat4 m;
      uniform vec3 billboard;
      out vec4 v_color;
      out vec3 v_position;
      out vec2 v_texCoord;
      void main() {
        if(billboard.z > 0.){
          gl_Position = pv * (m[3] + eye * (position * vec4(billboard, 0)));
        }
        else {
          gl_Position = pv * m * position;
        }
        v_position = vec3(m * position);
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
      in vec3 v_position;
      in vec4 v_color;
      in vec2 v_texCoord;
      uniform vec3 light;
      uniform sampler2D sampler;
      out vec4 c;
      void main() {
        if(v_color.a > 0.){
          c = (v_color);
        }
        else {
          if(texture(sampler, v_texCoord).a == 0.) discard;
          else {
          c = (texture(sampler, v_texCoord)) * vec4(
            v_color.rgb * (
              max(dot(light, normalize(cross(dFdx(v_position), dFdy(v_position)))), 0.0) // ambient light
              + .2 // diffuse light
            ), 1
          );
          }
        }
      }
      `
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

    function makeTexture(image) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      return texture;
    }

    // Look for img elements in the document and create textures from them.
    let loadingImages = [];
    for (let img of document.querySelectorAll("img")) {
      if (img.complete) {
        loadingImages.push(img);
      } else {
        loadingImages.push(new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(img);
        }));
      }
    }

    let loadedImages = await Promise.all(loadingImages);
    for (let img of loadedImages) {
      W.textures[img.id] = makeTexture(img);
    }
  },

  // Transition helpers
  // ------------------

  // Interpolate a property between two values
  l: t => W.p[W.N][t] + (W.n[W.N][t] -  W.p[W.N][t]) * (W.n[W.N].f / W.n[W.N].transition),
  
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
    
    // Save the transition duration (in frames), or 0 by default
    t.transition ||= 1;
    
    // Reset t frame counter
    t.f = 1;                        
    
    // Save new state
    W.n[t.n] = t;
  },
  
  // Objects in the scene
  group: t => { t.T = "g"; W.i(t) },
  
  plane: t => { t.T = "q"; W.i(t) },
  
  billboard: t => { t.T = "b"; W.i(t) },
  
  cube: t => { t.T = "c"; W.i(t) },
  
  pyramid: t => { t.T = "p"; W.i(t) },
  
  move: t => W.i(t),
  
  camera: t => { t.n = "C", W.i(t) },
    
  light: t => { t.n = "L"; W.i(t) },
  
  // Draw
  d: (pv, eye, m, i, s, vertices, tex, buffer) => {
    
    // Clear canvas
    
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(16640);
    


      // Projection View matrix
      // (perspective matrix: fov = .5 radian, aspect = a.width/a.height, near: 1, far: 1000)
      pv = new DOMMatrix([
        1 / Math.tan(.5) / (a.width/a.height), 0, 0, 0, 
        0, 1 / Math.tan(.5), 0, 0, 
        0, 0, (900 + 1) * 1 / (1 - 900), -1,
        0, 0, (2 * 1 * 900) * 1 / (1 - 900), 0
      ]);
      
      // Eye Matrix (inverted View matrix)
      eye = new DOMMatrix();
      
      W.N = "C";
      W.t(pv);
      W.t(eye);

      gl.uniformMatrix4fv(
        gl.getUniformLocation(W.P, 'pv'),
        false,
        pv.toFloat32Array()
      );
      
      gl.uniformMatrix4fv(
        gl.getUniformLocation(W.P, 'eye'),
        false,
        eye.invertSelf().toFloat32Array()
      );

      // Draw all the shapes
      vertices = [];

      texCoords = [];

      for(i in W.n){

        s = W.n[i];

        if (s.diffuseMap) {
          // Enable texture 0
          gl.activeTexture(gl.TEXTURE0);

          // Set the texture's target (2D or cubemap)
          gl.bindTexture(gl.TEXTURE_2D, W.textures[s.diffuseMap]);

          // Pass texture 0 to the sampler
          gl.uniform1i(gl.getUniformLocation(W.P, 'sampler'), 0);
        }

        if(s.f < s.transition) s.f++;

        // Initialize a shape
        
        // Plane (2 x 2)
        //
        //  v1------v0
        //  |       |
        //  |   x   |
        //  |       |
        //  v2------v3
        if(s.T == "q" || s.T == "b"){
        
          vertices = [
            1, 1, 0,    -1, 1, 0,   -1,-1, 0,
            1, 1, 0,    -1,-1, 0,    1,-1, 0
          ];
          
          texCoords = [
            1, 1,     0, 1,    0, 0,
            1, 1,     0, 0,    1, 0
          ]
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

        // Anything else
        else {
          vertices = [];
          texCoords = [];
        }

        // Set the position buffer
        
        //gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bindBuffer(34962, gl.createBuffer());
        
        //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bufferData(34962, new Float32Array(vertices), 35044);      
        
        // gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'position'), 3, gl.FLOAT, false, 0, 0)
        gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'position'), 3, 5126, false, 0, 0)
        
        gl.enableVertexAttribArray(buffer);
        
        
        // Texture coords buffer
        
        // gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bindBuffer(34962, gl.createBuffer());
        
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bufferData(34962, new Float32Array(texCoords), 35044);
        
        // gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'tex'), 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(buffer = gl.getAttribLocation(W.P, 'tex'), 2, 5126, false, 0, 0);
        
        gl.enableVertexAttribArray(buffer);
        

        // Set shape color
        
        console.log()
        gl.vertexAttrib4fv(
          gl.getAttribLocation(W.P, 'color'),
          [...[...s.b].map(a => ("0x" + a) / 16), s.diffuseMap ? 0 : 1] // convert rgb hex string into 3 values between 0 and 1, if a == 0, we use a texture instead
        );
        
        
        // Set the model matrix
        W.N = s.n;
        var m = new DOMMatrix(W?.n[s.g]?.m);
        W.t(m);
        W.n[s.n].m=m;
        gl.uniformMatrix4fv(
          gl.getUniformLocation(W.P, 'm'),
          false,
          m.toFloat32Array()
        );
        
        W.N = "L";
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
        
        // gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
        gl.drawArrays(4, 0, vertices.length/3);
    }
  }
}

// Initialize WebGL program, light, amera, action
async function main() {
  await W.s();
  W.light({z:1});
  W.camera({});
  setInterval(W.d, 16);
  W.d();
}
