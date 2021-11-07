// WebGL framework
// ===============

W = {

  // Reset the framework
  // param: <canvas> element
  reset: canvas => {
    
    // Globals
    W.lastFrame = 0;    // timestamp of last frame
    W.objs = 0;         // object counter
    W.models = {};      // list of 3D models that can be rendered by the framework
    W.p = {};           // objects previous states
    W.n = {};           // objects next states
    W.textures = {};    // textures list
    W.vertices = {};    // vertex buffers
    W.texCoords = {};   // texture coordinates buffers 
    W.indices = {};     // index buffers
    W.perspective =     // perspective matrix (fov:.5rad, aspect:canvas.width/canvas.height, near:1, far:1000)
      new DOMMatrix([
        1 / Math.tan(.5) / (canvas.width/canvas.height), 0, 0, 0, 
        0, 1 / Math.tan(.5), 0, 0, 
        0, 0, (900 + 1) * 1 / (1 - 900), -1,
        0, 0, (2 * 1 * 900) * 1 / (1 - 900), 0
      ]);

    // WebGL context
    W.gl = canvas.getContext("webgl2");
    
    // Default blending method for transparent objects
    W.gl.blendFunc(770 /* SRC_ALPHA */, 771 /* ONE_MINUS_SRC_ALPHA */);
    
    // Enable texture 0
    W.gl.activeTexture(33984 /* TEXTURE0 */);

    // Create a WebGL program
    W.program = W.gl.createProgram();
    
    // Create a Vertex shader
    // (this GLSL program is called for every vertex of the scene)
    W.gl.shaderSource(
      
      t = W.gl.createShader(35633 /* VERTEX_SHADER */),
      
      `#version 300 es                        // WebGL 2.0 header
      in vec4 pos, col, tex;                  // Vertex attributes: position, color, texture coordinates
      uniform mat4 pv, eye, m;                // Uniform transformation matrices: projection * view, eye, model
      uniform vec4 bb;                        // If the current shape is a billboard: bb = [w, h, 1.0, 0.0]
      out vec4 v_pos, v_col, v_tex;           // Varyings sent to the fragment shader: position, color, texture coordinates
      void main() {
        gl_Position = pv * (                  // Set vertex position: p * v * v_pos
          v_pos = bb.z > 0.                   // Set v_pos varying:
          ? m[3] - eye * (pos * bb)           // Billboards always face the camera:  p * v * distance - eye * (position * [w, h, 1.0, 0.0])
          : m * pos                           // Other objects rotate normally:      p * v * m * position
        );
        v_col = col, v_tex = tex;             // Set v_col and v_tex varyings 
      }`
    );
    
    // Compile the Vertex shader and attach it to the program
    W.gl.compileShader(t);
    W.gl.attachShader(W.program, t);
    console.log('vertex shader:', W.gl.getShaderInfoLog(t) || 'OK');
    
    // Create a Fragment shader
    // (This GLSL program is called for every fragment (pixel) of the scene)
    W.gl.shaderSource(

      t = W.gl.createShader(35632 /* FRAGMENT_SHADER */),
      
      `#version 300 es                        // WebGL 2.0 header
      precision highp float;                  // Set default float precision
      in vec4 v_pos, v_col, v_tex;            // Varyings received from the vertex shader: position, color, texture coordinates
      uniform vec3 light;                     // Uniform: light direction
      uniform sampler2D sampler;              // Uniform: 2D texture
      out vec4 c;                             // Output: final fragment color

      // The code below displays either colored or textured fragments
      // To simplify, we decided to enable texturing if the Alpha value of the color is "0.0", and to use a color otherwise
      void main() {
        // base color (rgba or texture)
        c = v_col.a > 0. ? v_col : texture(sampler, v_tex.xy);

        // output = vec4(base color's RGB * (directional light + ambient light)), base color's Alpha) 
        c = vec4(c.rgb * (max(dot(light, normalize(cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz)))), 0.0) + .2), c.a);  
      }`
    );
    
    // Compile the Fragment shader and attach it to the program
    W.gl.compileShader(t);
    W.gl.attachShader(W.program, t);
    console.log('fragment shader:', W.gl.getShaderInfoLog(t) || 'OK');
    
    // Compile the program
    W.gl.linkProgram(W.program);
    W.gl.useProgram(W.program);
    console.log('program:', W.gl.getProgramInfoLog(W.program) || 'OK');
    
    // Set the scene's background color (RGBA)
    W.gl.clearColor(1, 1, 1, 1);
    
    // Enable fragments depth sorting
    // (the fragments of close objects will automatically overlap the fragments of further objects)
    W.gl.enable(2929 /* DEPTH_TEST */);
    
    // Declare vertice positions and texture coordinates buffers of built-in shapes
    
    // Cube
    //
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |  x  | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.vertices.c = W.gl.createBuffer());
    W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array([
      .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5, // front
      .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
      .5, .5, .5,   .5,-.5, .5,   .5,-.5,-.5, // right
      .5, .5, .5,   .5,-.5,-.5,   .5, .5,-.5,
      .5, .5, .5,   .5, .5,-.5,  -.5, .5,-.5, // up
      .5, .5, .5,  -.5, .5,-.5,  -.5, .5, .5,
     -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5, // left
     -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
     -.5,-.5, .5,   .5,-.5 ,.5,   .5,-.5,-.5, // down
     -.5,-.5, .5,   .5,-.5,-.5,  -.5,-.5,-.5,
      .5,-.5,-.5,  -.5,-.5,-.5,  -.5, .5,-.5, // back
      .5,-.5,-.5,  -.5, .5,-.5,   .5, .5,-.5
    ]), 35044 /* STATIC_DRAW */); 

    W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.texCoords.c = W.gl.createBuffer());
    W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array([
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
    ]), 35044 /* STATIC_DRAW */);
    
    // Pyramid
    //
    //      ^
    //     /\\
    //    // \ \
    //   /+-x-\-+
    //  //     \/
    //  +------+
    
    W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.vertices.p = W.gl.createBuffer());
    W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array([
      -.5, -.5, .5,    .5, -.5, .5,    0, .5, 0,  // Front
       .5, -.5, .5,    .5, -.5,-.5,    0, .5, 0,  // Right
       .5, -.5,-.5,   -.5, -.5,-.5,    0, .5, 0,  // Back
      -.5, -.5,-.5,   -.5, -.5, .5,    0, .5, 0,  // Left
      -.5, -.5, .5,   -.5, -.5,-.5,   .5,-.5,.5,  // Base
      -.5, -.5,-.5,    .5, -.5,-.5,   .5,-.5,.5
    ]), 35044 /* STATIC_DRAW */); 

    W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.texCoords.p = W.gl.createBuffer());
    W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array([
       0, 0,   1, 0,  .5, 1,  // Front
       0, 0,   1, 0,  .5, 1,  // Right
       0, 0,   1, 0,  .5, 1,  // Back
       0, 0,   1, 0,  .5, 1,  // Left
       1, 0,   0, 0,   0, 1,  // base
       1, 0,   0, 1,   1, 1,
    ]), 35044 /* STATIC_DRAW */);
    
    // Quad / billboard
    //
    //  v1------v0
    //  |       |
    //  |   x   |
    //  |       |
    //  v2------v3
    
    W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.vertices.q = W.vertices.b = W.gl.createBuffer());
    W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array([
      .5, .5, 0,    -.5, .5, 0,   -.5,-.5, 0,
      .5, .5, 0,    -.5,-.5, 0,    .5,-.5, 0
    ]), 35044 /* STATIC_DRAW */); 

    W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.texCoords.q = W.texCoords.b = W.gl.createBuffer());
    W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array([
      1, 0,     0, 0,    0, 1,
      1, 0,     0, 1,    1, 1
    ]), 35044 /* STATIC_DRAW */);
    
    // When everything is loaded: set light, camera, and draw
    W.light({z:1});
    W.camera({});
    W.d();
  },

  // Transition helpers
  // ------------------

  // Interpolate a property between two values
  l: t => W.n[W.N]?.t ?
    W.p[W.N][t] + (W.n[W.N][t] -  W.p[W.N][t]) * (W.n[W.N].f / W.n[W.N].t)
    : W.n[W.N][t],
  
  // Transition an item
  t: () =>
    (
      W.n[W.N]
      ? (new DOMMatrix)
        .translateSelf(W.l("x"), W.l("y"), W.l("z"))
        .rotateSelf(W.l("rx"),W.l("ry"),W.l("rz"))
        .scaleSelf(W.l("w"),W.l("h"),W.l("d"))
      : new DOMMatrix
    )
  ,
  
  // Framework
  // ---------

  // Init an object (or set a new state to it)
  i: (t, texture) => {
    
    // Custom name or default name ("o" + auto-increment)
    t.n ||= "o" + W.objs++;
    
    // If a new texture is provided, build it and save it in W.textures
    if(t.b && t.b.id && t.b.width && !W.textures[t.b.id]){
      texture = W.gl.createTexture();
      W.gl.pixelStorei(37441 /* UNPACK_PREMULTIPLY_ALPHA_WEBGL */, true);
      W.gl.bindTexture(3553 /* TEXTURE_2D */, texture);
      W.gl.pixelStorei(37440 /* UNPACK_FLIP_Y_WEBGL */, 1);
      W.gl.texImage2D(3553 /* TEXTURE_2D */, 0, 6408 /* RGBA */, 6408 /* RGBA */, 5121 /* UNSIGNED_BYTE */, t.b);
      W.gl.generateMipmap(3553 /* TEXTURE_2D */);
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
  
  cube: t => { t.T = "c"; W.i(t) },
  
  pyramid: t => { t.T = "p"; W.i(t) },
  
  move: t => W.i(t),
  
  camera: t => { t.n = "C", W.i(t) },
    
  light: t => { t.n = "L"; W.i(t) },
  
  // Draw
  d: (now, p, v, m, i, s, dt, buffer, transparent = []) => {
    dt = now - W.lastFrame;
    W.lastFrame = now;
    requestAnimationFrame(W.d);
    
    // Clear canvas
    W.gl.clear(16640 /* W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT */);
    
    // View Matrix (inverse of Camera Matrix)
    v = new DOMMatrix;    // create an identity Matrix v
    W.N = "C";            // consider the camera
    v = W.t(v);           // apply the camera transformations to v
    
    W.gl.uniformMatrix4fv(  // send it to the shaders
      W.gl.getUniformLocation(W.program, 'eye'),
      false,
      v.toFloat32Array()
    );
    
    // Eye matrix → View matrix (inverted camera's model matrix)
    v.invertSelf();

    // PV matrix (projection matrix * view matrix)
    v.preMultiplySelf(W.perspective);
    
    W.gl.uniformMatrix4fv(  // send it to the shaders
      W.gl.getUniformLocation(W.program, 'pv'),
      false,
      v.toFloat32Array()
    );
    
    for(i in W.n){
      
      // Render the shapes with no transparency (alpha blending disabled)
      if(!W.n[i].b.id && !W.n[i].b[3]){
        W.r(W.n[i], dt);
      }
      
      // Add the objects with transparency (rgba or texture) in an array
      else {
        transparent.push(W.n[i]);
      }
    }
    
    // Order transparent objects from back to front
    transparent.sort((a, b) => {
      // Return a value > 0 if b is closer to the camera than a
      // Return a value < 0 if a is closer to the camera than b
      return a.m && b.m && (W.dist(b.m, W.n.C.m) - W.dist(a.m, W.n.C.m));
    });

    // And render them (alpha blending enabled, backgace culling disabled)
    W.gl.enable(3042 /* BLEND */);
    for(i in transparent){
      W.r(transparent[i], dt);
    }
    
    // Disable alpha blending and enable backface culling for next frame
    W.gl.disable(3042 /* BLEND */);
  },
  
  // Render an object
  r: (s, dt, center = [0,0,0], vertices, texCoords, buffer) => {

    // If the object has a texture
    if (s.b.id) {

      // Set the texture's target (2D or cubemap)
      W.gl.bindTexture(3553 /* TEXTURE_2D */, W.textures[s.b.id]);

      // Pass texture 0 to the sampler
      W.gl.uniform1i(W.gl.getUniformLocation(W.program, 'sampler'), 0);
    }

    // If the object has a transition, increment its timer...
    if(s.f < s.t) s.f += dt;
    
    // ...but don't let it go over the transition duration.
    if(s.f > s.t) s.f = s.t;
    
    //s.vertices = vertices;
    //s.texCoords = texCoords;
    s.center = center;

    // Set the object as the currently updated object.
    W.N = s.n;

    // Compose the model matrix from lerped transformations.
    W.n[s.n].m = W.t();

    // If the object is in a group…
    if (W.n[s.g]) {

      // …left-multiply the model matrix by the group's model matrix.
      W.n[s.n].m.preMultiplySelf(W.n[s.g].m);
    }

    W.gl.uniformMatrix4fv(  // send it to the shaders
      W.gl.getUniformLocation(W.program, 'm'),
      false,
      W.n[s.n].m.toFloat32Array()
    );
    
    // Ignore camera, light, groups
    if(!["C","L"].includes(s.n) && s.T != "g"){
      s.center = center;

      // Set the position buffer
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.vertices[s.T]);
      W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'pos'), 3, 5126 /* FLOAT */, false, 0, 0)
      W.gl.enableVertexAttribArray(buffer);
      
      // Set the texture coordinatess buffer
      if(W.texCoords[s.T]){
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.texCoords[s.T]);
        W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'tex'), 2, 5126 /* FLOAT */, false, 0, 0);
        W.gl.enableVertexAttribArray(buffer);
      }
        
      // Set the color / texture
      W.gl.vertexAttrib4fv(
        W.gl.getAttribLocation(W.program, 'col'),
        s.b.id ? [0,0,0,0] : [...[...s.b].map(a => ("0x" + a) / 16),
        s.b.id ? 0 : 1] // convert rgb hex string into 3 values between 0 and 1, if a == 0, we use a texture instead
      );
      
      // Consider the light
      W.N = "L";
      
      // Transition the light's direction and sent it to the shaders
      W.gl.uniform3f(
        W.gl.getUniformLocation(W.program, 'light'),
        W.l("x"), W.l("y"), W.l("z")
      );
      
      // Billboard info: [width, height, isBillboard, 0]
      W.gl.uniform4f(
        W.gl.getUniformLocation(W.program, 'bb'),
        s.w,
        s.h,
        s.T == "b",
        0
      );

      // Draw
      W.gl.drawArrays(4 /* TRIANGLES */, 0, W.gl.getBufferParameter(34962 /* ARRAY_BUFFER */, 34660 /* BUFFER_SIZE */) / 8);
    }
    
  },
  
  // Compute the distance squared between two objects (useful for sorting transparent items)
  dist: (a, b) => (b.m41 - a.m41)**2 + (b.m42 - a.m42)**2 + (b.m43 - a.m43)**2
}