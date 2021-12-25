// WebGL framework
// ===============

debug = 1; // Enable shader/program compilation logs (optional)

W = {
  
  // List of 3D models that can be rendered by the framework
  // (See the end of the file for built-in models: plane, billboard, cube, pyramid...)
  models: {},
  
  // List of renderers
  // (see the end of the file for built-in renderers: triangles, lines...)
  renderers: {},

  // Reset the framework
  // param: a <canvas> element
  reset: canvas => {
    
    // Globals
    W.canvas = canvas;    // canvas element
    W.objs = 0;           // Object counter
    W.current = {};       // Objects current states
    W.next = {};          // Objects next states
    W.textures = {};      // Textures list

    // WebGL context
    W.gl = canvas.getContext('webgl2');
    
    // Default blending method for transparent objects
    W.gl.blendFunc(770 /* SRC_ALPHA */, 771 /* ONE_MINUS_SRC_ALPHA */);
    
    // Enable texture 0
    W.gl.activeTexture(33984 /* TEXTURE0 */);

    // Create a WebGL program
    W.program = W.gl.createProgram();
    
    // Hide polygons back-faces (optional)
    //W.gl.enable(2884 /* CULL_FACE */);
    
    // Create a Vertex shader
    // (this GLSL program is called for every vertex of the scene)
    W.gl.shaderSource(
      
      t = W.gl.createShader(35633 /* VERTEX_SHADER */),
      
      `#version 300 es
      precision highp float;                  // Set default float precision
      in vec4 pos, col, uv, normal;           // Vertex attributes: position, color, texture coordinates, normal (if any)
      uniform mat4 pv, eye, m, im;            // Uniform transformation matrices: projection * view, eye, model, inverse model
      uniform vec4 bb;                        // If the current shape is a billboard: bb = [w, h, 1.0, 0.0]
      out vec4 v_pos, v_col, v_uv, v_normal;  // Varyings sent to the fragment shader: position, color, texture coordinates, normal (if any)
      void main() {
        gl_Position = pv * (                  // Set vertex position: p * v * v_pos
          v_pos = bb.z > 0.                   // Set v_pos varying:
          ? m[3] + eye * (pos * bb)           // Billboards always face the camera:  p * v * distance + eye * (position * [w, h, 1.0, 0.0])
          : m * pos                           // Other objects rotate normally:      p * v * m * position
        );
        v_col = col;                          // Set varyings 
        v_uv = uv;
        v_normal = transpose(inverse(m)) * normal;  // recompute normals
      }`
    );
    
    // Compile the Vertex shader and attach it to the program
    W.gl.compileShader(t);
    W.gl.attachShader(W.program, t);
    if(debug) console.log('vertex shader:', W.gl.getShaderInfoLog(t) || 'OK');
    
    // Create a Fragment shader
    // (This GLSL program is called for every fragment (pixel) of the scene)
    W.gl.shaderSource(

      t = W.gl.createShader(35632 /* FRAGMENT_SHADER */),
      
      `#version 300 es
      precision highp float;                  // Set default float precision
      in vec4 v_pos, v_col, v_uv, v_normal;   // Varyings received from the vertex shader: position, color, texture coordinates, normal (if any)
      uniform vec3 light;                     // Uniform: light direction, smooth normals enabled
      uniform vec4 o;                         // options [smooth, shading enabled, ambient, mix]
      uniform sampler2D sampler;              // Uniform: 2D texture
      out vec4 c;                             // Output: final fragment color

      // The code below displays either colored or textured fragments
      // To simplify, we decided to enable texturing if the Alpha value of the color is '0.0', and to use a color otherwise
      void main() {
        // base color (rgba or texture)
        c = mix(texture(sampler, v_uv.xy), v_col, o[3]);

        if(o[1] > 0.){
          // output = vec4(base color's RGB * (directional light + ambient light)), base color's Alpha) 
          if(o[0] > 0.){
            c = vec4(c.rgb * (max(dot(light, -normalize(vec3(v_normal.xyz))), 0.0) + o[2]), c.a);
          }
          else {
            c = vec4(c.rgb * (max(dot(light, -normalize(cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz)))), 0.0) + o[2]), c.a);
          }
        }
      }`
    );
    
    // Compile the Fragment shader and attach it to the program
    W.gl.compileShader(t);
    W.gl.attachShader(W.program, t);
    if(debug) console.log('fragment shader:', W.gl.getShaderInfoLog(t) || 'OK');
    
    // Compile the program
    W.gl.linkProgram(W.program);
    W.gl.useProgram(W.program);
    if(debug) console.log('program:', W.gl.getProgramInfoLog(W.program) || 'OK');
    
    // Set the scene's background color (RGBA)
    W.gl.clearColor(1, 1, 1, 1);
    
    // Shortcut to set the clear color
    W.clearColor = c => W.gl.clearColor(...W.col(c));
    W.clearColor("ffff");
    
    // Enable fragments depth sorting
    // (the fragments of close objects will automatically overlap the fragments of further objects)
    W.gl.enable(2929 /* DEPTH_TEST */);
    
    // When everything is loaded: set default light / camera, and draw the scene
    W.light({y: -1});
    W.camera({fov: 30});
    W.draw();
  },

  // Set a state to an object
  setState: (state, type, texture, i, normal = [], A, B, C, Ai, Bi, Ci, AB, BC) => {

    // Custom name or default name ('o' + auto-increment)
    state.n ||= 'o' + W.objs++;
    
    // Size sets w, h and d at once (optional)
    if(state.size) state.w = state.h = state.d = state.size;
    
    // If a new texture is provided, build it and save it in W.textures
    if(state.t && state.t.width && !W.textures[state.t.id]){
      texture = W.gl.createTexture();
      W.gl.pixelStorei(37441 /* UNPACK_PREMULTIPLY_ALPHA_WEBGL */, true);
      W.gl.bindTexture(3553 /* TEXTURE_2D */, texture);
      W.gl.pixelStorei(37440 /* UNPACK_FLIP_Y_WEBGL */, 1);
      W.gl.texImage2D(3553 /* TEXTURE_2D */, 0, 6408 /* RGBA */, 6408 /* RGBA */, 5121 /* UNSIGNED_BYTE */, state.t);
      W.gl.generateMipmap(3553 /* TEXTURE_2D */);
      W.textures[state.t.id] = texture;
    }
    
    // Save object's type,
    // merge previous state (or default state) with the new state passed in parameter,
    // and reset f (the animation timer)
    state = {type, ...(W.current[state.n] = W.next[state.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:'888', mode:4, mix: 0}), ...state, f:0};
    
    // Build the model's vertices buffer if it doesn't exist yet
    if(W.models[state.type]?.vertices && !W.models?.[state.type].verticesBuffer){
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].verticesBuffer = W.gl.createBuffer());
      W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].vertices), 35044 /*STATIC_DRAW*/); 
    }
    
    // Build the model's uv buffer (if any) if it doesn't exist yet
    if(W.models[state.type]?.uv && !W.models[state.type].uvBuffer){
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].uvBuffer = W.gl.createBuffer());
      W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].uv), 35044 /*STATIC_DRAW*/); 
    }
    
    // Build the model's index buffer (if any) and smooth normals if they don't exist yet
    if(W.models[state.type]?.indices && !W.models[state.type].indicesBuffer){
      W.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, W.models[state.type].indicesBuffer = W.gl.createBuffer());
      W.gl.bufferData(34963 /* ELEMENT_ARRAY_BUFFER */, new Uint16Array(W.models[state.type].indices), 35044 /* STATIC_DRAW */);
      
      // Compute smooth normals (optional)
      if(!W.models[state.type].smoothNormals && W.smooth) W.smooth(state);
      
      // Make a buffer from the smooth normals (if any)
      if(W.models[state.type].smoothNormals){
        // Smooth normals buffer
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].smoothNormalsBuffer = W.gl.createBuffer());
        W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].smoothNormals.flat()), 35044 /*STATIC_DRAW*/); 
      }
    }
    
    // Set mix to 1 if no texture is set
    if(!state.t){
      state.mix = 1;
    }

    // set mix to 0 by default if a texture is set
    else if(state.t && !state.mix){
      state.mix = 0;
    }
    
    // Save new state
    W.next[state.n] = state;
    
    // Set fov if the camera's state contains it
    if(state.fov){
      W.perspective =     
        new DOMMatrix([
          1 / Math.tan(state.fov * .0175) / (W.canvas.width/W.canvas.height), 0, 0, 0, 
          0, 1 / Math.tan(state.fov * .0175), 0, 0, 
          0, 0, (999 + 1) * 1 / (1 - 999), -1,
          0, 0, (2 * 1 * 999) * 1 / (1 - 999), 0
        ]);
    }
  },
  
  // Draw the scene
  draw: (now, dt, v, i, transparent = []) => {
    
    // Loop and measure time delta between frames
    dt = now - W.lastFrame;
    W.lastFrame = now;
    requestAnimationFrame(W.draw);
    
    // Clear canvas
    W.gl.clear(16640 /* W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT */);
    
    // Create a matrix called v containing the current camera transformation
    v = W.animation('camera');
    
    // Send it to the shaders as the Eye matrix
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'eye'),
      false,
      v.toFloat32Array()
    );
    
    // Invert it to obtain the View matrix
    v.invertSelf();

    // Premultiply it with the Perspective matrix to obtain a Projection-View matrix
    v.preMultiplySelf(W.perspective);
    
    // send it to the shaders as the pv matrix
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'pv'),
      false,
      v.toFloat32Array()
    );
    
    // Transition the light's direction and send it to the shaders
    W.gl.uniform3f(
      W.gl.getUniformLocation(W.program, 'light'),
      W.lerp('light','x'), W.lerp('light','y'), W.lerp('light','z')
    );
    
    // Render all the objects in the scene
    for(i in W.next){
      
      // Render the shapes with no texture and no transparency (RGB1 color)
      if(!W.next[i].t && W.col(W.next[i].b)[3] == 1){
        W.render(W.next[i], dt);
      }
      
      // Add the objects with transparency (RGBA or texture) in an array
      else {
        transparent.push(W.next[i]);
      }
    }
    
    // Order transparent objects from back to front
    transparent.sort((a, b) => {
      // Return a value > 0 if b is closer to the camera than a
      // Return a value < 0 if a is closer to the camera than b
      return W.dist(b) - W.dist(a);
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
  
  // Render an object
  render: (object, dt, buffer) => {

    // If the object has a texture
    if(object.t) {

      // Set the texture's target (2D or cubemap)
      W.gl.bindTexture(3553 /* TEXTURE_2D */, W.textures[object.t.id]);

      // Pass texture 0 to the sampler
      W.gl.uniform1i(W.gl.getUniformLocation(W.program, 'sampler'), 0);
    }

    // If the object has an animation, increment its timer...
    if(object.f < object.a) object.f += dt;
    
    // ...but don't let it go over the animation duration.
    if(object.f > object.a) object.f = object.a;

    // Compose the model matrix from lerped transformations
    W.next[object.n].m = W.animation(object.n);

    // If the object is in a group:
    if(W.next[object.g]){

      // premultiply the model matrix by the group's model matrix.
      W.next[object.n].m.preMultiplySelf(W.next[object.g].M || W.next[object.g].m);
    }
    
    // send the model matrix to the vertex shader
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'm'),
      false,
      (W.next[object.n].M || W.next[object.n].m).toFloat32Array()
    );
    
    // send the inverse of the model matrix to the vertex shader
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'im'),
      false,
      (new DOMMatrix(W.next[object.n].M || W.next[object.n].m)).invertSelf().toFloat32Array()
    );
    
    // Don't render invisible items (camera, light, groups)
    if(!['camera','light','group'].includes(object.type)){
      
      // Set up the position buffer
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].verticesBuffer);
      W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'pos'), 3, 5126 /* FLOAT */, false, 0, 0)
      W.gl.enableVertexAttribArray(buffer);
      
      // Set up the texture coordinatess buffer (if any)
      if(W.models[object.type].uvBuffer){
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].uvBuffer);
        W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'uv'), 2, 5126 /* FLOAT */, false, 0, 0);
        W.gl.enableVertexAttribArray(buffer);
      }
      
      // Set the normals buffer
      if(object.s && W.models[object.type].smoothNormalsBuffer){
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].smoothNormalsBuffer);
        W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'normal'), 3, 5126 /* FLOAT */, false, 0, 0);
        W.gl.enableVertexAttribArray(buffer);
      }
      
      // Other options: [smooth, shading enabled, ambient light, texture/color mix]
      W.gl.uniform4f(

        W.gl.getUniformLocation(W.program, 'o'), 
        
        // Enable smooth shading if "s" is true
        object.s,
        
        // Enable shading if in TRIANGLE* mode and object.ns disabled
        ((object.mode > 3) || (W.gl[object.mode] > 3)) && !object.ns ? 1 : 0,
        
        // Ambient light
        W.ambientLight || 0.2,
        
        // Texture/color mix (if a texture is present. 0: fully textured, 1: fully colored)
        object.mix
      );
      
      // If the object is a billboard: send a specific uniform to the shaders:
      // [width, height, isBillboard = 1, 0]
      W.gl.uniform4f(
        W.gl.getUniformLocation(W.program, 'bb'),
        
        // Size
        object.w,
        object.h,               

        // is a billboard
        object.type == 'billboard',
        
        // Reserved
        0
      );
      
      // Set up the indices (if any)
      if(W.models[object.type].indicesBuffer){
        W.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, W.models[object.type].indicesBuffer);
      }
      
      // Use a renderer (custom / default)
      if(object.r){
        W.renderers[object.r](object);
      }
      else {
        // Set the object's color
        W.gl.vertexAttrib4fv(
          W.gl.getAttribLocation(W.program, 'col'),
          W.col(object.b)
        );

        // Draw
        // Both indexed and unindexed models are supported.
        // You can keep the "drawElements" only if all your models are indexed.
        if(W.models[object.type].indicesBuffer){
          W.gl.drawElements(+object.mode || W.gl[object.mode], W.models[object.type].indices.length, 5123 /* UNSIGNED_SHORT */, 0);
        }
        else {
          W.gl.drawArrays(+object.mode || W.gl[object.mode], 0, W.models[object.type].vertices.length / 3);
        }
      }
    }
  },
  
  // Helpers
  // -------
  
  // Interpolate a property between two values
  lerp: (item, property) => 
    W.next[item]?.a
    ? W.current[item][property] + (W.next[item][property] -  W.current[item][property]) * (W.next[item].f / W.next[item].a)
    : W.next[item][property],
  
  // Transition an item
  animation: (item, m = new DOMMatrix) =>
    W.next[item]
    ? m
      .translateSelf(W.lerp(item, 'x'), W.lerp(item, 'y'), W.lerp(item, 'z'))
      .rotateSelf(W.lerp(item, 'rx'),W.lerp(item, 'ry'),W.lerp(item, 'rz'))
      .scaleSelf(W.lerp(item, 'w'),W.lerp(item, 'h'),W.lerp(item, 'd'))
    : m,
    
  // Compute the distance squared between two objects (useful for sorting transparent items)
  dist: (a, b = W.next.camera) => a?.m && b?.m ? (b.m.m41 - a.m.m41)**2 + (b.m.m42 - a.m.m42)**2 + (b.m.m43 - a.m.m43)**2 : 0,
  
  // Set the ambient light level (0 to 1)
  ambient: a => W.ambientLight = a,
  
  // Convert an rgb/rgba hex string into a vec4
  col: c => {
    c = c.replace("#","");
    if(c.length < 5) return [...[...c].map(a => ('0x' + a) / 15), 1]; // rgb / rgba
    else return [...c.match(/../g).map(a => ('0x' + a) / 255), 1]; // rrggbb / rrggbbaa
  },
  
  // Add a new 3D model
  add: (name, objects) => {
    W.models[name] = objects;
    W[name] = settings => W.setState(settings, name);
  },
  
  // Built-in objects
  // ----------------
  
  group: t => W.setState(t, 'group'),
  
  move: (t, delay) => setTimeout(()=>{ W.setState(t) }, delay || 1),
  
  delete: (t, delay) => setTimeout(()=>{ delete W.next[t.n] }, delay || 1),
  
  camera: (t, delay) => setTimeout(()=>{ W.setState(t, t.n = 'camera') }, delay || 1),
    
  light: (t, delay) => delay ? setTimeout(()=>{ W.setState(t, t.n = 'light') }, delay) : W.setState(t, t.n = 'light'),
};

// Smooth normals computation plug-in (optional)
// =============================================

W.smooth = (state, dict = {}, vertices = []) => {
  
  // Prepare smooth normals arrays
  W.models[state.type].smoothNormals = [];
  
  // Fill vertices array, smooth normals array (with zeroes), dictionnary
  for(i = 0; i < W.models[state.type].vertices.length; i+=3){
    vertices.push([W.models[state.type].vertices[i], W.models[state.type].vertices[i+1], W.models[state.type].vertices[i+2]]);
  }
  
  // Indexed model
  if(W.models[state.type].indices){
    
    // Compute normals of each triangle and accumulate them for each vertex
    for(i = 0; i < W.models[state.type].indices.length; i+=3){
      A = vertices[Ai = W.models[state.type].indices[i]];
      B = vertices[Bi = W.models[state.type].indices[i+1]];
      C = vertices[Ci = W.models[state.type].indices[i+2]];
      AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
      BC = [C[0] - B[0], C[1] - B[1], C[2] - B[2]];
      normal = [AB[1] * BC[2] - AB[2] * BC[1], AB[2] * BC[0] - AB[0] * BC[2], AB[0] * BC[1] - AB[1] * BC[0]];
      dict[A[0]+"_"+A[1]+"_"+A[2]] ||= [0,0,0];
      dict[B[0]+"_"+B[1]+"_"+B[2]] ||= [0,0,0];
      dict[C[0]+"_"+C[1]+"_"+C[2]] ||= [0,0,0];
      dict[A[0]+"_"+A[1]+"_"+A[2]] = dict[A[0]+"_"+A[1]+"_"+A[2]].map((a,i) => a + normal[i]);
      dict[B[0]+"_"+B[1]+"_"+B[2]] = dict[B[0]+"_"+B[1]+"_"+B[2]].map((a,i) => a + normal[i]);
      dict[C[0]+"_"+C[1]+"_"+C[2]] = dict[C[0]+"_"+C[1]+"_"+C[2]].map((a,i) => a + normal[i]);
    }
    
    for(i = 0; i < W.models[state.type].indices.length; i+=3){
      A = vertices[Ai = W.models[state.type].indices[i]];
      B = vertices[Bi = W.models[state.type].indices[i+1]];
      C = vertices[Ci = W.models[state.type].indices[i+2]];
      W.models[state.type].smoothNormals[Ai] = dict[A[0]+"_"+A[1]+"_"+A[2]];
      W.models[state.type].smoothNormals[Bi] = dict[B[0]+"_"+B[1]+"_"+B[2]];
      W.models[state.type].smoothNormals[Ci] = dict[C[0]+"_"+C[1]+"_"+C[2]];
    }
  }
  
  // Unindexed model
  else {
    
    // Compute normals of each triangle and accumulate them for each vertex
    for(i = 0; i < vertices.length; i+=3){
      A = vertices[i];
      B = vertices[i+1];
      C = vertices[i+2];
      AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
      BC = [C[0] - B[0], C[1] - B[1], C[2] - B[2]];
      normal = [AB[1] * BC[2] - AB[2] * BC[1], AB[2] * BC[0] - AB[0] * BC[2], AB[0] * BC[1] - AB[1] * BC[0]];
      dict[A[0]+"_"+A[1]+"_"+A[2]] = dict[A[0]+"_"+A[1]+"_"+A[2]].map((a,i) => a + normal[i]);
      dict[B[0]+"_"+B[1]+"_"+B[2]] = dict[B[0]+"_"+B[1]+"_"+B[2]].map((a,i) => a + normal[i]);
      dict[C[0]+"_"+C[1]+"_"+C[2]] = dict[C[0]+"_"+C[1]+"_"+C[2]].map((a,i) => a + normal[i]);
    }
    
    for(i = 0; i < vertices.length; i+=3){
      A = vertices[i];
      B = vertices[i+1];
      C = vertices[i+2];
      W.models[state.type].smoothNormals[Ai] = dict[A[0]+"_"+A[1]+"_"+A[2]];
      W.models[state.type].smoothNormals[Bi] = dict[B[0]+"_"+B[1]+"_"+B[2]];
      W.models[state.type].smoothNormals[Ci] = dict[C[0]+"_"+C[1]+"_"+C[2]];
    }
  }
}


// 3D models
// =========

// Each model has:
// - A vertices array [x, y, z, x, y, z...]
// - A uv array [u, v, u, v...] (optional. Allows texturing... if absent: RGBA coloring only)
// - An indices array (optional, enables drawElements rendering... if absent: drawArrays is ised)
// - A normals array [nx, ny, nz, nx, ny, nz...] (optional... if absent: hard/smooth normals are computed by the framework when they're needed)
// The buffers (vertices, uv, indices) are built automatically when they're needed
// All models are optional, you can remove the ones you don't need to save space
// Custom models can be added from the same model, an OBJ importer is available on https://xem.github.io/WebGLFramework/obj2js/

// Plane / billboard
//
//  v1------v0
//  |       |
//  |   x   |
//  |       |
//  v2------v3

W.models.plane = W.models.billboard = {
  vertices: [
    .5, .5, 0,    -.5, .5, 0,   -.5,-.5, 0,
    .5, .5, 0,    -.5,-.5, 0,    .5,-.5, 0
  ],
  
  uv: [
    1, 1,     0, 1,    0, 0,
    1, 1,     0, 0,    1, 0
  ],
};
W.plane = settings => W.setState(settings, 'plane');
W.billboard = settings => W.setState(settings, 'billboard');

// Cube
//
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |  x  | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3

W.models.cube = {
  vertices: [
    .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5, // front
    .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
    .5, .5,-.5,   .5, .5, .5,   .5,-.5, .5, // right
    .5, .5,-.5,   .5,-.5, .5,   .5,-.5,-.5,
    .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5, // up
    .5, .5,-.5,  -.5, .5, .5,   .5, .5, .5,
   -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5, // left
   -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
   -.5, .5,-.5,   .5, .5,-.5,   .5,-.5,-.5, // back
   -.5, .5,-.5,   .5,-.5,-.5,  -.5,-.5,-.5,
    .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
    .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
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
    1, 1,   0, 1,   0, 0, // back
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // down
    1, 1,   0, 0,   1, 0
  ]
};
W.cube = settings => W.setState(settings, 'cube');

// Pyramid
//
//      ^
//     /\\
//    // \ \
//   /+-x-\-+
//  //     \/
//  +------+

W.models.pyramid = {
  vertices: [
    -.5,-.5, .5,   .5,-.5, .5,    0, .5,  0,  // Front
     .5,-.5, .5,   .5,-.5,-.5,    0, .5,  0,  // Right
     .5,-.5,-.5,  -.5,-.5,-.5,    0, .5,  0,  // Back
    -.5,-.5,-.5,  -.5,-.5, .5,    0, .5,  0,  // Left
     .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
     .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: [
    0, 0,   1, 0,  .5, 1,  // Front
    0, 0,   1, 0,  .5, 1,  // Right
    0, 0,   1, 0,  .5, 1,  // Back
    0, 0,   1, 0,  .5, 1,  // Left
    1, 1,   0, 1,   0, 0,  // down
    1, 1,   0, 0,   1, 0
  ]
};
W.pyramid = settings => W.setState(settings, 'pyramid');


// Sphere
//
//          =   =
//       =         =
//      =           =
//     =      x      =
//      =           =
//       =         =
//          =   =

((i, ai, j, aj, p1, p2, vertices = [], indices = [], uv = [], precision = 15) => {
  for (j = 0; j <= precision; j++) {
    aj = j * Math.PI / precision;
    for (i = 0; i <= precision; i++) {
      ai = i * 2 * Math.PI / precision;
      vertices.push(+(Math.sin(ai) * Math.sin(aj)/2).toFixed(6), +(Math.cos(aj)/2).toFixed(6), +(Math.cos(ai) * Math.sin(aj)/2).toFixed(6));
      uv.push((Math.sin((i/precision)))*3.5, -Math.sin(j/precision))
      if(i < precision && j < precision){
        p1 = j * (precision+1) + i;
        p2 = p1 + (precision+1);
        indices.push(p1, p2, (p1 + 1), (p1 + 1), p2, (p2 + 1));
      }
    }
  }
  W.models.sphere = {vertices, uv, indices};
})();
W.sphere = settings => W.setState(settings, 'sphere');