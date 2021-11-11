// WebGL framework
// ===============

W = {
  
  // List of 3D models that can be rendered by the framework
  // (See the end of the file for built-in models: plane, billboard, cube, pyramid...)
  models: {},
  
  // List of renderers
  // (see the end of the file for built-in models: triangle, wireframe...)
  renderers: {},

  // Reset the framework
  // param: a <canvas> element
  reset: canvas => {
    
    // Globals
    W.lastFrame = 0;    // Timestamp of last frame
    W.objs = 0;         // Object counter
    W.current = {};     // Objects current states
    W.next = {};        // Objects next states
    W.textures = {};    // Textures list
    //W.vertices = {};    // Vertex buffers
    //W.uv = {};          // Texture coordinates buffers 
    //W.indices = {};     // Index buffers
    W.perspective =     // Perspective matrix (fov: .5rad, aspect: canvas.width/canvas.height, near: 1, far: 1000)
      new DOMMatrix([
        1 / Math.tan(.5) / (canvas.width/canvas.height), 0, 0, 0, 
        0, 1 / Math.tan(.5), 0, 0, 
        0, 0, (900 + 1) * 1 / (1 - 900), -1,
        0, 0, (2 * 1 * 900) * 1 / (1 - 900), 0
      ]);

    // WebGL context
    W.gl = canvas.getContext('webgl2');
    
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
      
      `#version 300 es
      in vec4 pos, col, uv;                   // Vertex attributes: position, color, texture coordinates
      uniform mat4 pv, eye, m;                // Uniform transformation matrices: projection * view, eye, model
      uniform vec4 bb;                        // If the current shape is a billboard: bb = [w, h, 1.0, 0.0]
      out vec4 v_pos, v_col, v_uv;            // Varyings sent to the fragment shader: position, color, texture coordinates
      void main() {
        gl_Position = pv * (                  // Set vertex position: p * v * v_pos
          v_pos = bb.z > 0.                   // Set v_pos varying:
          ? m[3] - eye * (pos * bb)           // Billboards always face the camera:  p * v * distance - eye * (position * [w, h, 1.0, 0.0])
          : m * pos                           // Other objects rotate normally:      p * v * m * position
        );
        v_col = col, v_uv = uv;               // Set v_col and v_uv varyings 
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
      
      `#version 300 es
      precision highp float;                  // Set default float precision
      in vec4 v_pos, v_col, v_uv;             // Varyings received from the vertex shader: position, color, texture coordinates
      uniform vec3 light;                     // Uniform: light direction
      uniform sampler2D sampler;              // Uniform: 2D texture
      out vec4 c;                             // Output: final fragment color

      // The code below displays either colored or textured fragments
      // To simplify, we decided to enable texturing if the Alpha value of the color is '0.0', and to use a color otherwise
      void main() {
        // base color (rgba or texture)
        c = v_col.a > 0. ? v_col : texture(sampler, v_uv.xy);

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
    
    // When everything is loaded: set light, camera, and draw
    W.light({z:1});
    W.camera({});
    W.draw();
  },

  // Interpolate a property between two values
  lerp: (item, property) => 
    W.next[item]?.t
    ? W.current[item][property] + (W.next[item][property] -  W.current[item][property]) * (W.next[item].f / W.next[item].t)
    : W.next[item][property],
  
  // Transition an item
  transition: item =>
    W.next[item]
    ? (new DOMMatrix)
      .translateSelf(W.lerp(item, 'x'), W.lerp(item, 'y'), W.lerp(item, 'z'))
      .rotateSelf(W.lerp(item, 'rx'),W.lerp(item, 'ry'),W.lerp(item, 'rz'))
      .scaleSelf(W.lerp(item, 'w'),W.lerp(item, 'h'),W.lerp(item, 'd'))
    : new DOMMatrix,

  // Set a state to an object
  setState: (state, type, texture) => {
    
    //console.log(state);
    
    // Custom name or default name ('o' + auto-increment)
    state.n ||= 'o' + W.objs++;
    
    // If a new texture is provided, build it and save it in W.textures
    if(state.b && state.b.id && state.b.width && !W.textures[state.b.id]){
      texture = W.gl.createTexture();
      W.gl.pixelStorei(37441 /* UNPACK_PREMULTIPLY_ALPHA_WEBGL */, true);
      W.gl.bindTexture(3553 /* TEXTURE_2D */, texture);
      W.gl.pixelStorei(37440 /* UNPACK_FLIP_Y_WEBGL */, 1);
      W.gl.texImage2D(3553 /* TEXTURE_2D */, 0, 6408 /* RGBA */, 6408 /* RGBA */, 5121 /* UNSIGNED_BYTE */, state.b);
      W.gl.generateMipmap(3553 /* TEXTURE_2D */);
      W.textures[state.b.id] = texture;
    }
    
    // Merge previous state or default state with the new state passed in parameter
    state = {type, ...(W.current[state.n] = W.next[state.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:'000'}), ...state};
    
    // Save the transition duration (in frames), or 0 by default
    state.t ||= 0;
    
    // Reset the transition timer.
    state.f = 0;
    
    // Save new state
    W.next[state.n] = state;
  },
  
  // Objects in the scene
  group: t => W.setState(t, 'group'),
  
  move: t => W.setState(t),
  
  delete: t => delete W.n[t.n],
  
  camera: t => W.setState(t, t.n = 'camera'),
    
  light: t => W.setState(t, t.n = 'light'),
  
  // Draw
  draw: (now, p, v, m, i, s, dt, buffer, transparent = []) => {
    dt = now - W.lastFrame;
    W.lastFrame = now;
    requestAnimationFrame(W.draw);
    
    // Clear canvas
    W.gl.clear(16640 /* W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT */);
    
    // Create a matrix called v
    v = new DOMMatrix;    // create an identity Matrix v
    v = W.transition('camera');  // apply the camera transformations to v
    
    // Send it to the shaders as the Eye matrix
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'eye'),
      false,
      v.toFloat32Array()
    );
    
    // Invert it to obtain the View matrix
    // then premultiply the Perspective matrix created in W.reset() to obtain a Projection-View matrix
    v.invertSelf();
    v.preMultiplySelf(W.perspective);
    
    // send it to the shaders as the pv matrix
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'pv'),
      false,
      v.toFloat32Array()
    );
    
    // Render all the objects in the scene
    //console.log(W.next);
    
    for(i in W.next){
      
      // Render the shapes with no transparency (alpha blending disabled)
      if(!W.next[i].b.id && !W.next[i].b[3]){
        W.render(W.next[i], dt);
      }
      
      // Add the objects with transparency (rgba or texture) in an array
      else {
        transparent.push(W.next[i]);
      }
    }
    
    //console.log(transparent);
    
    // Order transparent objects from back to front
    transparent.sort((a, b) => {
      // Return a value > 0 if b is closer to the camera than a
      // Return a value < 0 if a is closer to the camera than b
      return a.m && b.m && (W.dist(b.m, W.next.camera.m) - W.dist(a.m, W.next.camera.m));
    });

    // Enable alpha plending
    W.gl.enable(3042 /* BLEND */);
    
    // Render the objects
    for(i in transparent){
      W.render(transparent[i], dt);
    }
    
    // Disable alpha blending for next frame
    W.gl.disable(3042 /* BLEND */);
  },
  
  // Compute the distance squared between two objects (useful for sorting transparent items)
  dist: (a, b) => (b.m41 - a.m41)**2 + (b.m42 - a.m42)**2 + (b.m43 - a.m43)**2,
  
  // Render an object
  render: (object, dt, vertices, uv, buffer) => {
    
    //console.log(W.models[object.type]);
    
    // Build vertices buffer if it doesn't exist yet
    if(W.models[object.type]?.vertices && !W.models?.[object.type].verticesBuffer){
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].verticesBuffer = W.gl.createBuffer());
      W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[object.type].vertices), 35044 /*STATIC_DRAW*/); 
    }
    
    // Build uv buffer if it doesn't exist yet
    if(W.models[object.type]?.uv && !W.models[object.type].uvBuffer){
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].uvBuffer = W.gl.createBuffer());
      W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[object.type].uv), 35044 /*STATIC_DRAW*/); 
    }
    
    //console.log(W.models[object.type]);

    // If the object has a texture
    if (object.b.id) {

      // Set the texture's target (2D or cubemap)
      W.gl.bindTexture(3553 /* TEXTURE_2D */, W.textures[object.b.id]);

      // Pass texture 0 to the sampler
      W.gl.uniform1i(W.gl.getUniformLocation(W.program, 'sampler'), 0);
    }

    // If the object has a transition, increment its timer...
    if(object.f < object.t) object.f += dt;
    
    // ...but don't let it go over the transition duration.
    if(object.f > object.t) object.f = object.t;

    // Compose the model matrix from lerped transformations
    W.next[object.n].m = W.transition(object.n);

    // If the object is in a group:
    if(W.next[object.g]){

      // premultiply the model matrix by the group's model matrix.
      W.next[object.n].m.preMultiplySelf(W.next[object.g].m);
    }

    // send the model matrix to the shaders
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'm'),
      false,
      W.next[object.n].m.toFloat32Array()
    );
    
    // Don't render camera, light, groups
    if(!['camera','light','group'].includes(object.type)){

      // Set the position buffer
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].verticesBuffer);
      W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'pos'), 3, 5126 /* FLOAT */, false, 0, 0)
      W.gl.enableVertexAttribArray(buffer);
      
      // Set the texture coordinatess buffer (if any)
      if(W.models[object.type].uvBuffer){
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].uvBuffer);
        W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'uv'), 2, 5126 /* FLOAT */, false, 0, 0);
        W.gl.enableVertexAttribArray(buffer);
      }
        
      // Set the color / texture
      W.gl.vertexAttrib4fv(
        W.gl.getAttribLocation(W.program, 'col'),
        object.b.id ? [0,0,0,0] : [...[...object.b].map(a => ('0x' + a) / 16),
        object.b.id ? 0 : 1] // convert rgb hex string into 3 values between 0 and 1, if a == 0, we use a texture instead
      );
      
      // Transition the light's direction and sent it to the shaders
      W.gl.uniform3f(
        W.gl.getUniformLocation(W.program, 'light'),
        W.lerp('light','x'), W.lerp('light','y'), W.lerp('light','z')
      );
      
      // If the object is a billboard: send a specific uniform to the shaders:
      // [width, height, isBillboard = 1, 0]
      W.gl.uniform4f(
        W.gl.getUniformLocation(W.program, 'bb'),
        object.w,
        object.h,
        object.type == 'billboard',
        0
      );

      // Draw
      W.gl.drawArrays(4 /* TRIANGLES */, 0, W.models[object.type].vertices.length / 3);
    }
    
  }
};

// Built-in models
// ===============

// Each model has:
// - A vertices array [x, y, z, x, y, z...]
// - A uv array [u, v, u, v...] (optional. Allows texturing... if absent: RGBA coloring only)
// - An indices array (optional, enables drawElements rendering... if absent: drawArrays is ised)
// - A normals array [nx, ny, nz, nx, ny, nz...] (optional... if absent: hard/smooth normals are computed by the framework when they're needed)
// The buffers (vertices, uv, indices) are built automatically when they're needed
// Any built-in model can be removed to save space
// Custom models can be added from the same model, an OBJ importer is available on https://xem.github.io/WebGLFramework/obj2js/

// Plane / billboard
W.models.plane = W.models.billboard = {
  vertices: [
    .5, .5, 0,    -.5, .5, 0,   -.5,-.5, 0,
    .5, .5, 0,    -.5,-.5, 0,    .5,-.5, 0
  ],
  
  uv: [
    1, 0,     0, 0,    0, 1,
    1, 0,     0, 1,    1, 1
  ],
};
W.plane = settings => W.setState(settings, 'plane');
W.billboard = settings => W.setState(settings, 'billboard');

// Cube
W.models.cube = {
  vertices: [
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
  ],
  uv: [
    1, 1,   0, 1,   0, 0, // front
    1, 1,   0, 0,   1, 0,            
    1, 1,   0, 1,   0, 0, // right
    1, 1,   0, 0,   1, 0, 
    1, 1,   0, 1,   0, 0, // up
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // left
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // down
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // back
    1, 1,   0, 0,   1, 0,
  ]
};
W.cube = settings => W.setState(settings, 'cube');

// Pyramid
W.models.pyramid = {
  vertices: [
    -.5, -.5, .5,    .5, -.5, .5,  0, .5, 0,  // Front
     .5, -.5, .5,    .5, -.5,-.5,  0, .5, 0,  // Right
     .5, -.5,-.5,   -.5, -.5,-.5,  0, .5, 0,  // Back
    -.5, -.5,-.5,   -.5, -.5, .5,  0, .5, 0,  // Left
    -.5, -.5, .5,   -.5, -.5,-.5, .5,-.5, .5, // Base
    -.5, -.5,-.5,    .5, -.5,-.5, .5,-.5, .5
  ],
  uv: [
     0, 0,   1, 0,  .5, 1,  // Front
     0, 0,   1, 0,  .5, 1,  // Right
     0, 0,   1, 0,  .5, 1,  // Back
     0, 0,   1, 0,  .5, 1,  // Left
     1, 0,   0, 0,   0, 1,  // base
     1, 0,   0, 1,   1, 1,
  ]
};
W.pyramid = settings => W.setState(settings, 'pyramid');





// Built-in renderers
// ==================

// Each rendered defines a way to draw a 3D model on the canvas
// Default: TRIANGLES mode, optional: LINES mode
// Custom renderers can be added from the same model
W.renderers.triangles = () => {
  
};

W.renderers.lines = () => {
  
};