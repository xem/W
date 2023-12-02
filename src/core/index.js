// WebGL framework
// ===============
import baseVertex from '../shaders/baseVertex.glsl'
import baseFragment from '../shaders/baseFragment.glsl'

export default class Renderer {

  constructor(options) {
    this.debug = options.debug; // Enable shader/program compilation logs (optional)
    // List of 3D models that can be rendered by the framework
    // (See the end of the file for built-in models: plane, billboard, cube, pyramid...)
    this.models = {};
    // List of renderers
    // (see the end of the file for built-in renderers: triangles, lines...)
    this.renderers = {};

    this.transparent = []

    // Globals
    this.canvas = options.canvas;    // canvas element
    this.objs = 0;           // Object counter
    this.current = {};       // Objects current states
    this.next = {};          // Objects next states
    this.textures = {};      // Textures list

    // WebGL context
    this.gl = this.canvas.getContext('webgl2');
    // Default blending method for transparent objects
    this.gl.blendFunc(770 /* SRC_ALPHA */, 771 /* ONE_MINUS_SRC_ALPHA */);
    
    // Enable texture 0
    this.gl.activeTexture(33984 /* TEXTURE0 */);

    this.#start()
  }

  // Start the framework
  #start(){

    // Create a WebGL program
    this.program = this.gl.createProgram();
    
    // Hide polygons back-faces (optional)
    //W.gl.enable(2884 /* CULL_FACE */);
    
    // Create a Vertex shader
    // (this GLSL program is called for every vertex of the scene)
    this.gl.shaderSource(
      
      this.t = this.gl.createShader(35633 /* VERTEX_SHADER */),
      
      baseVertex
    );
    
    // Compile the Vertex shader and attach it to the program
    this.gl.compileShader(this.t);
    this.gl.attachShader(this.program, this.t);
    if(this.debug) console.log('vertex shader:', this.gl.getShaderInfoLog(this.t) || 'OK');
    
    // Create a Fragment shader
    // (This GLSL program is called for every fragment (pixel) of the scene)
    this.gl.shaderSource(

      this.t = this.gl.createShader(35632 /* FRAGMENT_SHADER */),
      
      baseFragment
    );
    
    // Compile the Fragment shader and attach it to the program
    this.gl.compileShader(this.t);
    this.gl.attachShader(this.program, this.t);
    if(this.debug) console.log('fragment shader:', this.gl.getShaderInfoLog(this.t) || 'OK');
    
    // Compile the program
    this.gl.linkProgram(this.program);
    this.gl.useProgram(this.program);
    if(this.debug) console.log('program:', this.gl.getProgramInfoLog(this.program) || 'OK');
    
    // Set the scene's background color (RGBA)
    this.gl.clearColor(1, 1, 1, 1);
    
    // Shortcut to set the clear color
    this.clearColor = c => this.gl.clearColor(...this.#col(c));
    this.clearColor("ffff");
    
    // Enable fragments depth sorting
    // (the fragments of close objects will automatically overlap the fragments of further objects)
    this.gl.enable(2929 /* DEPTH_TEST */);
    
    // When everything is loaded: set default light / camera, and draw the scene
    this.light({y: -1});
    this.camera({fov: 30});
    this.#draw();
  };

  // Set a state to an object
  #setState(state, type, texture, i, normal = [], A, B, C, Ai, Bi, Ci, AB, BC) {

    // Custom name or default name ('o' + auto-increment)
    this.state = state
    this.state.n ||= 'o' + this.objs++;
    
    // Size sets w, h and d at once (optional)
    if(this.state.size) this.state.w = this.state.h = this.state.d = this.state.size;

    // If a new texture is provided, build it and save it in W.textures
    if(this.state.t && this.state.t.width && !this.textures[this.state.t.id]){
      this.texture = this.gl.createTexture();
      this.gl.pixelStorei(37441 /* UNPACK_PREMULTIPLY_ALPHA_WEBGL */, true);
      this.gl.bindTexture(3553 /* TEXTURE_2D */, this.texture);
      this.gl.pixelStorei(37440 /* UNPACK_FLIP_Y_WEBGL */, 1);
      this.gl.texImage2D(3553 /* TEXTURE_2D */, 0, 6408 /* RGBA */, 6408 /* RGBA */, 5121 /* UNSIGNED_BYTE */, this.state.t);
      this.gl.generateMipmap(3553 /* TEXTURE_2D */);
      this.textures[this.state.t.id] = this.texture;
    }
    
    // Save object's type,
    // merge previous state (or default state) with the new state passed in parameter,
    // and reset f (the animation timer)
    this.state = {type, ...(this.current[this.state.n] = this.next[this.state.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:'888', mode:4, mix: 0}), ...this.state, f:0};
    
    if(this.models) {
      // Build the model's vertices buffer if it doesn't exist yet
      if(this.models[this.state.type]?.vertices && !this.models?.[this.state.type].verticesBuffer){
        this.gl.bindBuffer(34962 /* ARRAY_BUFFER */, this.models[this.state.type].verticesBuffer = this.gl.createBuffer());
        this.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(this.models[this.state.type].vertices), 35044 /*STATIC_DRAW*/); 
      }
      
      // Build the model's uv buffer (if any) if it doesn't exist yet
      if(this.models[this.state.type]?.uv && !this.models[this.state.type].uvBuffer){
        this.gl.bindBuffer(34962 /* ARRAY_BUFFER */, this.models[this.state.type].uvBuffer = this.gl.createBuffer());
        this.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(this.models[this.state.type].uv), 35044 /*STATIC_DRAW*/); 
      }

      // Build the model's index buffer (if any) and smooth normals if they don't exist yet
      if(this.models[this.state.type]?.indices && !this.models[this.state.type].indicesBuffer){
        this.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, this.models[this.state.type].indicesBuffer = this.gl.createBuffer());
        this.gl.bufferData(34963 /* ELEMENT_ARRAY_BUFFER */, new Uint16Array(this.models[this.state.type].indices), 35044 /* STATIC_DRAW */);
        
        // Compute smooth normals (optional)
        if(!this.models[this.state.type].smoothNormals && this.#smooth) this.#smooth(this.state);
        
        // Make a buffer from the smooth normals (if any)
        if(this.models[this.state.type].smoothNormals){
          // Smooth normals buffer
          this.gl.bindBuffer(34962 /* ARRAY_BUFFER */, this.models[this.state.type].smoothNormalsBuffer = this.gl.createBuffer());
          this.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(this.models[this.state.type].smoothNormals.flat()), 35044 /*STATIC_DRAW*/); 
        }
      }
    }
    
    // Set mix to 1 if no texture is set
    if(!this.state.t){
      this.state.mix = 1;
    }

    // set mix to 0 by default if a texture is set
    else if(this.state.t && !this.state.mix){
      this.state.mix = 0;
    }
    
    // Save new state
    this.next[this.state.n] = this.state;
    
    // Set fov if the camera's state contains it
    if(this.state.fov){
      this.perspective =     
        new DOMMatrix([
          1 / Math.tan(this.state.fov * .0175) / (this.canvas.width/this.canvas.height), 0, 0, 0, 
          0, 1 / Math.tan(this.state.fov * .0175), 0, 0, 
          0, 0, (999 + 1) * 1 / (1 - 999), -1,
          0, 0, (2 * 1 * 999) * 1 / (1 - 999), 0
        ]);
    }
  };
  
  // Draw the scene
  #draw(now = 0, dt, v, i, transparent = []) {

    this.transparent =  transparent

    this.lastFrame ||= 0

    // Loop and measure time delta between frames
    this.dt = now - this.lastFrame;
    
    this.lastFrame = now;
    
    // Clear canvas
    this.gl.clear(16640 /* W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT */);
    
    // Create a matrix called v containing the current camera transformation
    this.v = v
    this.v = this.#animation('camera');
    
    // Send it to the shaders as the Eye matrix
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.program, 'eye'),
      false,
      this.v.toFloat32Array()
    );
    
    // Invert it to obtain the View matrix
    this.v.invertSelf();

    // Premultiply it with the Perspective matrix to obtain a Projection-View matrix
    this.v.preMultiplySelf(this.perspective);
    
    // send it to the shaders as the pv matrix
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.program, 'pv'),
      false,
      this.v.toFloat32Array()
    );
    
    // Transition the light's direction and send it to the shaders
    this.gl.uniform3f(
      this.gl.getUniformLocation(this.program, 'light'),
      this.#lerp('light','x'), this.#lerp('light','y'), this.#lerp('light','z')
    );
    
    // Render all the objects in the scene
    for(i in this.next){
      
      // Render the shapes with no texture and no transparency (RGB1 color)
      if(!this.next[i].t && this.#col(this.next[i].b)[3] == 1){
        this.#render(this.next[i], this.dt);
      }
      
      // Add the objects with transparency (RGBA or texture) in an array
      else {
        this.transparent.push(this.next[i]);
      }
    }
    
    // Order transparent objects from back to front
    this.transparent.sort((a, b) => {
      // Return a value > 0 if b is closer to the camera than a
      // Return a value < 0 if a is closer to the camera than b
      return this.#dist(b) - this.#dist(a);
    });

    // Enable alpha plending
    this.gl.enable(3042 /* BLEND */);
    
    // Render the objects
    for(i in this.transparent){
      this.#render(this.transparent[i], this.dt);
    }
    
    // Disable alpha blending for next frame
    this.gl.disable(3042 /* BLEND */);

    requestAnimationFrame(() => this.#draw());
  };
  
  // Render an object
  #render(object, dt, buffer) {
    
    this.object = object
    this.buffer = buffer
    // If the object has a texture
    if(this.object.t) {

      // Set the texture's target (2D or cubemap)
      this.gl.bindTexture(3553 /* TEXTURE_2D */, this.textures[this.object.t.id]);

      // Pass texture 0 to the sampler
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'sampler'), 0);
    }

    // If the object has an animation, increment its timer...
    if(this.object.f < this.object.a) this.object.f += dt;
    
    // ...but don't let it go over the animation duration.
    if(this.object.f > this.object.a) this.object.f = this.object.a;

    // Compose the model matrix from lerped transformations
    this.next[this.object.n].m = this.#animation(this.object.n);

    // If the object is in a group:
    if(this.next[this.object.g]){

      // premultiply the model matrix by the group's model matrix.
      this.next[this.object.n].m.preMultiplySelf(this.next[this.object.g].M || this.next[this.object.g].m);
    }
    
    // send the model matrix to the vertex shader
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.program, 'm'),
      false,
      (this.next[this.object.n].M || this.next[this.object.n].m).toFloat32Array()
    );
    
    // send the inverse of the model matrix to the vertex shader
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.program, 'im'),
      false,
      (new DOMMatrix(this.next[this.object.n].M || this.next[this.object.n].m)).invertSelf().toFloat32Array()
    );
    
    // Don't render invisible items (camera, light, groups)
    if(!['camera','light','group'].includes(this.object.type)){
      // Set up the position buffer
      this.gl.bindBuffer(34962 /* ARRAY_BUFFER */, this.models[this.object.type].verticesBuffer);
      this.gl.vertexAttribPointer(this.buffer = this.gl.getAttribLocation(this.program, 'pos'), 3, 5126 /* FLOAT */, false, 0, 0)
      this.gl.enableVertexAttribArray(this.buffer);
      
      // Set up the texture coordinatess buffer (if any)
      if(this.models[this.object.type].uvBuffer){
        this.gl.bindBuffer(34962 /* ARRAY_BUFFER */, this.models[this.object.type].uvBuffer);
        this.gl.vertexAttribPointer(this.buffer = this.gl.getAttribLocation(this.program, 'uv'), 2, 5126 /* FLOAT */, false, 0, 0);
        this.gl.enableVertexAttribArray(this.buffer);
      }
      
      // Set the normals buffer
      if(this.object.s && this.models[this.object.type].smoothNormalsBuffer){
        this.gl.bindBuffer(34962 /* ARRAY_BUFFER */, this.models[this.object.type].smoothNormalsBuffer);
        this.gl.vertexAttribPointer(this.buffer = this.gl.getAttribLocation(this.program, 'normal'), 3, 5126 /* FLOAT */, false, 0, 0);
        this.gl.enableVertexAttribArray(this.buffer);
      }
      
      // Other options: [smooth, shading enabled, ambient light, texture/color mix]
      this.gl.uniform4f(

        this.gl.getUniformLocation(this.program, 'o'), 
        
        // Enable smooth shading if "s" is true
        this.object.s,
        
        // Enable shading if in TRIANGLE* mode and object.ns disabled
        ((this.object.mode > 3) || (this.gl[this.object.mode] > 3)) && !this.object.ns ? 1 : 0,
        
        // Ambient light
        this.ambientLight || 0.2,
        
        // Texture/color mix (if a texture is present. 0: fully textured, 1: fully colored)
        this.object.mix
      );
      
      // If the object is a billboard: send a specific uniform to the shaders:
      // [width, height, isBillboard = 1, 0]
      this.gl.uniform4f(
        this.gl.getUniformLocation(this.program, 'bb'),
        
        // Size
        this.object.w,
        this.object.h,               

        // is a billboard
        this.object.type == 'billboard',
        
        // Reserved
        0
      );
      
      // Set up the indices (if any)
      if(this.models[this.object.type].indicesBuffer){
        this.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, this.models[this.object.type].indicesBuffer);
      }
      
      // Use a renderer (custom / default)
      if(this.object.r){
        this.renderers[this.object.r](this.object);
      }
      else {
        // Set the object's color
        this.gl.vertexAttrib4fv(
          this.gl.getAttribLocation(this.program, 'col'),
          this.#col(this.object.b)
        );

        // Draw
        // Both indexed and unindexed models are supported.
        // You can keep the "drawElements" only if all your models are indexed.
        if(this.models[this.object.type].indicesBuffer){
          this.gl.drawElements(+this.object.mode || this.gl[this.object.mode], this.models[this.object.type].indices.length, 5123 /* UNSIGNED_SHORT */, 0);
        }
        else {
          this.gl.drawArrays(+this.object.mode || this.gl[this.object.mode], 0, this.models[this.object.type].vertices.length / 3);
        }
      }
    }
  }

  // Interpolate a property between two values
  #lerp(item, property){
    return this.next[item]?.a
    ? this.current[item][property] + (this.next[item][property] -  this.current[item][property]) * (this.next[item].f / this.next[item].a)
    : this.next[item][property]
  }
  
  // Transition an item
  #animation(item, m = new DOMMatrix) {
    return this.next[item]
    ? m
      .translateSelf(this.#lerp(item, 'x'), this.#lerp(item, 'y'), this.#lerp(item, 'z'))
      .rotateSelf(this.#lerp(item, 'rx'),this.#lerp(item, 'ry'),this.#lerp(item, 'rz'))
      .scaleSelf(this.#lerp(item, 'w'),this.#lerp(item, 'h'),this.#lerp(item, 'd'))
    : m
  }
    
  // Compute the distance squared between two objects (useful for sorting transparent items)
  #dist(a, b = this.next.camera){
    return a?.m && b?.m ? (b.m.m41 - a.m.m41)**2 + (b.m.m42 - a.m.m42)**2 + (b.m.m43 - a.m.m43)**2 : 0
  } 
  
  // Set the ambient light level (0 to 1)
  ambient(a){return this.ambientLight = a}
  
  // Convert an rgb/rgba hex string into a vec4
  #col(c){
    c = c.replace("#","");
    if(c.length < 5) return [...[...c].map(a => ('0x' + a) / 15), 1]; // rgb / rgba
    else return [...c.match(/../g).map(a => ('0x' + a) / 255), 1]; // rrggbb / rrggbbaa
  }
  
  // Add a new 3D model
  add(name, objects, settings){
    this.models[name] = objects;
    this.#setState(settings, name);
  }
  
  // Built-in objects
  // ----------------
  
  group(t) {return this.#setState(t, 'group')} 
  
  move(t, delay) {
    setTimeout(()=>{ this.#setState(t) }, delay || 1)
  }
  
  delete(t, delay) {
    setTimeout(()=>{ delete this.next[t.n] }, delay || 1)
  }
  
  camera(t, delay){
    setTimeout(()=>{ this.#setState(t, t.n = 'camera') }, delay || 1)
  }
    
  light(t, delay) {
    delay ? setTimeout(()=>{ this.#setState(t, t.n = 'light') }, delay) : this.#setState(t, t.n = 'light')
  }
  // Smooth normals computation plug-in (optional)
// =============================================
  #smooth(state, dict = {}, vertices = []){
  
  // Prepare smooth normals arrays
  this.models[state.type].smoothNormals = [];
  
  // Fill vertices array, smooth normals array (with zeroes), dictionnary
  for(var i = 0; i < this.models[state.type].vertices.length; i+=3){
    vertices.push([this.models[state.type].vertices[i], this.models[state.type].vertices[i+1], this.models[state.type].vertices[i+2]]);
  }
  
  // Indexed model
  if(this.models[state.type].indices){
    
    // Compute normals of each triangle and accumulate them for each vertex
    for(var i = 0; i < this.models[state.type].indices.length; i+=3){
      this.A = vertices[this.Ai = this.models[state.type].indices[i]];
      this.B = vertices[this.Bi = this.models[state.type].indices[i+1]];
      this.C = vertices[this.Ci = this.models[state.type].indices[i+2]];
      this.AB = [this.B[0] - this.A[0], this.B[1] - this.A[1], this.B[2] - this.A[2]];
      this.BC = [this.C[0] - this.B[0], this.C[1] - this.B[1], this.C[2] - this.B[2]];
      this.normal = [this.AB[1] * this.BC[2] - this.AB[2] * this.BC[1], this.AB[2] * this.BC[0] - this.AB[0] * this.BC[2], this.AB[0] * this.BC[1] - this.AB[1] * this.BC[0]];
      dict[this.A[0]+"_"+this.A[1]+"_"+this.A[2]] ||= [0,0,0];
      dict[this.B[0]+"_"+this.B[1]+"_"+this.B[2]] ||= [0,0,0];
      dict[this.C[0]+"_"+this.C[1]+"_"+this.C[2]] ||= [0,0,0];
      dict[this.A[0]+"_"+this.A[1]+"_"+this.A[2]] = dict[this.A[0]+"_"+this.A[1]+"_"+this.A[2]].map((a,i) => a + this.normal[i]);
      dict[this.B[0]+"_"+this.B[1]+"_"+this.B[2]] = dict[this.B[0]+"_"+this.B[1]+"_"+this.B[2]].map((a,i) => a + this.normal[i]);
      dict[this.C[0]+"_"+this.C[1]+"_"+this.C[2]] = dict[this.C[0]+"_"+this.C[1]+"_"+this.C[2]].map((a,i) => a + this.normal[i]);
    }
    
    for(var i = 0; i < this.models[state.type].indices.length; i+=3){
      this.A = vertices[this.Ai = this.models[state.type].indices[i]];
      this.B = vertices[this.Bi = this.models[state.type].indices[i+1]];
      this.C = vertices[this.Ci = this.models[state.type].indices[i+2]];
      this.models[state.type].smoothNormals[this.Ai] = dict[this.A[0]+"_"+this.A[1]+"_"+this.A[2]];
      this.models[state.type].smoothNormals[this.Bi] = dict[this.B[0]+"_"+this.B[1]+"_"+this.B[2]];
      this.models[state.type].smoothNormals[this.Ci] = dict[this.C[0]+"_"+this.C[1]+"_"+this.C[2]];
    }
  }
  
  // Unindexed model
  else {
    
    // Compute normals of each triangle and accumulate them for each vertex
    for(var i = 0; i < vertices.length; i+=3){
      this.A = vertices[i];
      this.B = vertices[i+1];
      this.C = vertices[i+2];
      this.AB = [this.B[0] - this.this.A[0], this.B[1] - this.A[1], this.B[2] - this.A[2]];
      this.BC = [this.C[0] - this.B[0], this.C[1] - this.B[1], this.C[2] - this.B[2]];
      this.normal = [this.AB[1] * this.BC[2] - this.AB[2] * this.BC[1], this.AB[2] * this.BC[0] - this.AB[0] * this.BC[2], this.AB[0] * this.BC[1] - this.AB[1] * this.BC[0]];
      dict[this.A[0]+"_"+this.A[1]+"_"+this.A[2]] = dict[this.A[0]+"_"+this.A[1]+"_"+this.A[2]].map((a,i) => a + this.normal[i]);
      dict[this.B[0]+"_"+this.B[1]+"_"+this.B[2]] = dict[this.B[0]+"_"+this.B[1]+"_"+this.B[2]].map((a,i) => a + this.normal[i]);
      dict[this.C[0]+"_"+this.C[1]+"_"+this.C[2]] = dict[this.C[0]+"_"+this.C[1]+"_"+this.C[2]].map((a,i) => a + this.normal[i]);
    }
    
    for(var i = 0; i < vertices.length; i+=3){
      this.A = vertices[i];
      this.B = vertices[i+1];
      this.C = vertices[i+2];
      this.models[state.type].smoothNormals[this.Ai] = dict[this.A[0]+"_"+this.A[1]+"_"+this.A[2]];
      this.models[state.type].smoothNormals[this.Bi] = dict[this.B[0]+"_"+this.B[1]+"_"+this.B[2]];
      this.models[state.type].smoothNormals[this.Ci] = dict[this.C[0]+"_"+this.C[1]+"_"+this.C[2]];
    }
  }
}
};