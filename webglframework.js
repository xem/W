// WebGL context
gl = a.getContext('webgl');

// Convert #rgb string to vec3
rgb = s => [+("0x"+s[1])/16,+("0x"+s[2])/16,+("0x"+s[3])/16];

// Vertex shader
var vshader = `
attribute vec4 position; 
attribute vec4 color;
attribute vec4 normal;
uniform mat4 mvp;
uniform mat4 model;            // model matrix
uniform mat4 inverseTranspose; // inversed transposed model matrix
varying vec4 v_color;
varying vec3 v_normal;
varying vec3 v_position;
void main() {

  // Apply the model matrix and the camera matrix to the vertex position
  gl_Position = mvp * position;
  
  // Set varying position for the fragment shader
  v_position = vec3(model * position);
  
  // Recompute the face normal
  v_normal = normalize(vec3(inverseTranspose * normal));
  
  // Set the color
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
  
  // Compute angle between the normal and that direction
  float nDotL = max(dot(lightDirection, v_normal), 0.0);
  
  // Compute diffuse light proportional to this angle
  vec3 diffuse = v_color.rgb * nDotL;
  
  // Compute ambient light
  vec3 ambient = 0.2 * v_color.rgb;
  
  // Compute total light (diffuse + ambient)
  gl_FragColor = vec4(diffuse + ambient, 1.0);
}`;

// Compile program
var program = compile(gl, vshader, fshader);

// Set the clear color and enable the depth test
gl.clearColor(1, 1, 1, 1);
gl.enable(gl.DEPTH_TEST);

// Set the camera
var cameraMatrix = perspective({fov: 30, aspect: 1, near: 1, far: 1000});
cameraMatrix.translateSelf(0, 0, -450)

var lightDirection = gl.getUniformLocation(program, 'lightDirection');
gl.uniform3f(lightDirection, 0.1, 0.6, 0.8);


W = {

  camX: 0,
  camY: 0,
  camZ: 0,
  camRX: 0,
  camRY: 0,
  camRZ: 0,
  sprite_count: 0,
  sprites: [],
  plane_count: 0,
  cube_count: 0,
  pyramid_count: 0,
  options: {},
  
  init: t => {
    t.g||(t.g="scene"),
    t.o||(t.o="center"),
    t.o=="top left"&&(t.x+=t.w/2,t.y+=t.h/2),
    t.o=="top"&&(t.y+=t.h/2),
    t.o=="top right"&&(t.x-=t.w/2,t.y+=t.h/2),
    t.o=="right"&&(t.x-=t.w/2),
    t.o=="bottom right"&&(t.x-=t.w/2,t.y-=t.h/2),
    t.o=="bottom"&&(t.y-=t.h/2),
    t.o=="bottom left"&&(t.x+=t.w/2,t.y-=t.h/2),
    t.o=="left"&&(t.x+=t.w/2),
    t.w||(t.w=0),
    t.h||(t.h=0),
    t.x||(t.x=0),
    t.y||(t.y=0),
    t.z||(t.z=0),
    t.rx||(t.rx=0),
    t.ry||(t.ry=0),
    t.rz||(t.rz=0),
    W.options[t.n]=t
  },
  
  plane: t => {
  
    t.n||(t.n=`plane${W.plane_count++}`);
    W.init(t);
  
    // Initialize a shape
    var vertices, normals, indices;
    [vertices, normals, indices] = plane(t);

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
    gl.vertexAttrib3fv(color, rgb(t.b));
    
    // Get uniforms used in the loop
    var model = gl.getUniformLocation(program, 'model');
    var mvp = gl.getUniformLocation(program, 'mvp');
    var inverseTranspose = gl.getUniformLocation(program, 'inverseTranspose');

    var shapeAngle = 0;
      
    // Set the model matrix
    var modelMatrix = new DOMMatrix();
    modelMatrix.translateSelf(t.x,t.y,t.z).rotateSelf(0, 0, 0);
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
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  },
  
  sprite: () => {},
  cube: t => {
    
    t.n||(t.n=`plane${W.plane_count++}`);
    W.init(t);
  
    // Initialize a shape
    var vertices, normals, indices;
    [vertices, normals, indices] = cube(t);

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
    gl.vertexAttrib3fv(color, rgb(t.b));
    
    // Get uniforms used in the loop
    var model = gl.getUniformLocation(program, 'model');
    var mvp = gl.getUniformLocation(program, 'mvp');
    var inverseTranspose = gl.getUniformLocation(program, 'inverseTranspose');

    var shapeAngle = 0;
      
    // Set the model matrix
    var modelMatrix = new DOMMatrix();
    modelMatrix.translateSelf(t.x,t.y,t.z).rotateSelf(0, 0, 0);
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
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
    
    
  },
  pyramid: () => {},
  camera: t => {
    t&&(t.x||0===t.x)&&(W.camX=t.x),
    t&&(t.y||0===t.y)&&(W.camY=t.y),
    t&&(t.z||0===t.z)&&(W.camZ=t.z),
    t&&(t.rx||0===t.rx)&&(W.camRX=t.rx),
    t&&(t.ry||0===t.ry)&&(W.camRY=t.ry),
    t&&(t.rz||0===t.rz)&&(W.camRZ=t.rz),
    
    // Set the camera
    cameraMatrix = perspective({fov: 30, aspect: 1, near: 1, far: 1000});
    cameraMatrix.translateSelf(W.camX, W.camY, W.camZ-500).rotateSelf(W.camRX,0,0).rotateSelf(0,0,W.camRZ);
  },
  move: () => {},
}