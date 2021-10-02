// WebGL context
gl = a.getContext('webgl');

// Transition duration (number of frames)
transition = 100;

// Initial state
init = 1;


// Convert #rgb string to vec3
rgb = s => [+("0x"+s[1])/16,+("0x"+s[2])/16,+("0x"+s[3])/16];

// rrggbb = s => [+("0x"+s[1]+s[2])/256,+("0x"+s[3]+s[4])/256,+("0x"+s[5]+s[6])/256];

// Vertex shader
var vshader = `
attribute vec4 position; 
attribute vec4 color;
attribute vec4 normal;
uniform mat4 mvp;
uniform mat4 model;
uniform mat4 inverseTranspose;
varying vec4 v_color;
varying vec3 v_normal;
varying vec3 v_position;
void main() {
  gl_Position = mvp * position;
  v_position = vec3(model * position);
  v_normal = normalize(vec3(inverseTranspose * normal));
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
  float nDotL = max(dot(lightDirection, v_normal), 0.0);
  vec3 diffuse = v_color.rgb * nDotL;
  vec3 ambient = 0.2 * v_color.rgb;
  gl_FragColor = vec4(diffuse + ambient, 1.0);
}`;

// Compile program
var program = compile(gl, vshader, fshader);

// Set the clear color and enable the depth test
gl.clearColor(1, 1, 1, 1);
gl.enable(gl.DEPTH_TEST);

// Set default camera
var cameraMatrix = perspective({fov: 30, aspect: a.width/a.height, near: 1, far: 1000});
cameraMatrix.translateSelf(0, 0, -450);

// Set default light direction
var lightDirection = gl.getUniformLocation(program, 'lightDirection');
gl.uniform3f(lightDirection, 0.1, 0.6, 0.8);


W = {

  camX: 0,
  camY: 0,
  camZ: 0,
  camRX: 0,
  camRY: 0,
  camRZ: 0,
  oldCamX: 0,
  oldCamY: 0,
  oldCamZ: 0,
  oldCamRX: 0,
  oldCamRY: 0,
  oldCamRZ: 0,
  nextCamX: 0,
  nextCamY: 0,
  nextCamZ: 0,
  nextCamRX: 0,
  nextCamRY: 0,
  nextCamRZ: 0,
  
  cam_frame: 0,
  sprite_count: 0,
  sprites: [],
  plane_count: 0,
  cube_count: 0,
  pyramid_count: 0,
  shapes: {},
  
  
  init: t => {
    t.g||(t.g="scene"),
    t.w||(t.w=0),
    t.h||(t.h=0),
    t.x||(t.x=0),
    t.y||(t.y=0),
    t.z||(t.z=0),
    t.rx||(t.rx=0),
    t.ry||(t.ry=0),
    t.rz||(t.rz=0),
    W.shapes[t.n]=t
  },
  
  group: () => {},
  
  plane: t => {
  
    t.n||(t.n=`plane${W.plane_count++}`);
    t.type = "plane";
    W.init(t);
    //W.draw();
    init = 0;
  },
  
  sprite: () => {},
  
  cube: t => {
    
    t.n||(t.n=`plane${W.plane_count++}`);
    t.type = "cube";
    W.init(t);
    //W.draw();
    init = 0;
  },
  
  pyramid: t => {
    
    t.n||(t.n=`plane${W.plane_count++}`);
    t.type = "pyramid";
    W.init(t);
    //W.draw();
    init = 0;
    
  },
  
  move: () => {},
  
  camera: t => {
    
    // Handle params
    console.log(init, JSON.stringify(W));
    W.oldCamX = W.camX;
    W.oldCamY = W.camY;
    W.oldCamZ = W.camZ;
    W.oldCamRX = W.camRX;
    W.oldCamRY = W.camRY;
    W.oldCamRZ = W.camRZ;
    t&&(t.x||0===t.x)&&(W.nextCamX=t.x),
    t&&(t.y||0===t.y)&&(W.nextCamY=t.y),
    t&&(t.z||0===t.z)&&(W.nextCamZ=t.z),
    t&&(t.rx||0===t.rx)&&(W.nextCamRX=t.rx),
    t&&(t.ry||0===t.ry)&&(W.nextCamRY=t.ry),
    t&&(t.rz||0===t.rz)&&(W.nextCamRZ=t.rz);
    if(init){
      W.camX = W.nextCamX;
      W.camY = W.nextCamY;
      W.camZ = W.nextCamZ;
      W.camRX = W.nextCamRX;
      W.camRY = W.nextCamRY;
      W.camRZ = W.nextCamRZ;
    }
    
    // Draw the scene
    //W.draw();
    
    // Remove init status
    init = 0;
    W.cam_frame = 0;
    
  },
  
  light: t => {
    t=t||{x:0,y:0,z:1};
    var lightDirection = gl.getUniformLocation(program, 'lightDirection');
    gl.uniform3f(lightDirection, t.x||0, t.y||0, t.z||0);
  },
  
  draw: () => {
    
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Set the camera
    cameraMatrix = perspective({fov: 30, aspect: a.width/a.height, near: 1, far: 1000});
    cameraMatrix.translateSelf(W.camX, W.camY, W.camZ-100).rotateSelf(W.camRX,0,0).rotateSelf(0,0,W.camRZ);
    
    // Draw all the shapes
    for(var i in W.shapes){
      var shape = W.shapes[i];

      // Initialize a shape
      var vertices, normals, indices;
      [vertices, normals, indices] = top[shape.type]();

      // Count vertices
      var n = indices.length;

      // Set position, normal buffers
      buffer(gl, vertices, program, 'position', 3, gl.FLOAT);
      buffer(gl, normals, program, 'normal', 3, gl.FLOAT);

      // Set indices
      var indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

      // Set shape color
      var color = gl.getAttribLocation(program, 'color');
      gl.vertexAttrib3fv(color, rgb(shape.b));
      
      // Get uniforms used in the loop
      var model = gl.getUniformLocation(program, 'model');
      var mvp = gl.getUniformLocation(program, 'mvp');
      var inverseTranspose = gl.getUniformLocation(program, 'inverseTranspose');

      var shapeAngle = 0;
        
      // Set the model matrix
      var modelMatrix = new DOMMatrix();
      modelMatrix.translateSelf(shape.x,shape.y,shape.z).rotateSelf(shape.rx,shape.ry,shape.rz).scaleSelf(shape.w,shape.h,shape.d);
      gl.uniformMatrix4fv(model, false, modelMatrix.toFloat32Array());
      
      // Set the shape's mvp matrix (camera x model)
      var mvpMatrix = new DOMMatrix(modelMatrix);
      mvpMatrix.preMultiplySelf(cameraMatrix);
      gl.uniformMatrix4fv(mvp, false, mvpMatrix.toFloat32Array());
      
      // Set the inverse transpose of the model matrix
      var inverseTransposeMatrix = new DOMMatrix(modelMatrix);
      inverseTransposeMatrix = transpose(inverseTransposeMatrix.invertSelf());
      gl.uniformMatrix4fv(inverseTranspose, false, inverseTransposeMatrix.toFloat32Array());

      // Render
      gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
    }
  }
}

setInterval(()=>{
  
  // Camera movement
  if(W.cam_frame < transition){
    
    var progress = W.cam_frame/transition;
  
    // Transition camera
    //W.camRX = W.oldCamRX * progress + W.nextCamRX * 1/progress;
    W.camX = W.oldCamX + (W.nextCamX - W.oldCamX) * progress**2;
    W.camY = W.oldCamY + (W.nextCamY - W.oldCamY) * progress**2;
    W.camZ = W.oldCamZ + (W.nextCamZ - W.oldCamZ) * progress**2;
    W.camRX = W.oldCamRX + (W.nextCamRX - W.oldCamRX) * progress**2;
    W.camRY = W.oldCamRY + (W.nextCamRY - W.oldCamRY) * progress**2;
    W.camRZ = W.oldCamRZ + (W.nextCamRZ - W.oldCamRZ) * progress**2;
    
    W.cam_frame++;
  

  }
  
  // Render the scene
  W.draw()
  
}, 16);