// Declare a plane (2x2)
// Returns [vertices (Float32Array), normals (Float32Array), indices (Uint16Array)] 
//
//  v1------v0
//  |       |
//  |   x   |
//  |       |
//  v2------v3

plane = t => {

  var vertices = new Float32Array([
    1, 1, 0,
   -1, 1, 0,
   -1,-1, 0,
    1,-1, 0
  ]);

  var normals = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
  ]);

  var indices = new Uint16Array([
    0, 1, 2,
    0, 2, 3
  ]);
  
  return [vertices, normals, indices];
};


// Declare a cube (2x2x2)
// Returns [vertices (Float32Array), normals (Float32Array), indices (Uint16Array)] 
//
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |   x | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3

cube = t => {

  var vertices = new Float32Array([
     1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1, // front
     1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1, // right
     1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1, // up
    -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1, // left
    -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1, // down
     1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1  // back
  ]);

  var normals = new Float32Array([
    0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,  // front
    1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,  // right
    0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,  // up
   -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  // left
    0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,  // down
    0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1   // back
  ]);

  var indices = new Uint16Array([
    0, 1, 2,   0, 2, 3,  // front
    4, 5, 6,   4, 6, 7,  // right
    8, 9, 10,  8, 10,11, // up
    12,13,14,  12,14,15, // left
    16,17,18,  16,18,19, // down
    20,21,22,  20,22,23  // back
  ]);
  
  return [vertices, normals, indices];
};

// Declare a pyramid (base: 2x2 square, sides: equilateral triangles)
// Returns [vertices (Float32Array), normals (Float32Array), indices (Uint16Array)] 
pyramid = () => {
  var h = 3**.5; // height = sqrt(3) / 2 * bottom
  
  var vertices = new Float32Array([
    -1, 0, 1,    1, 0, 1,  0, h, 0,  // Front
     1, 0, 1,    1, 0,-1,  0, h, 0,  // Right
     1, 0,-1,   -1, 0,-1,  0, h, 0,  // Back
    -1, 0,-1,   -1, 0, 1,  0, h, 0,  // Left
    -1, 0, 1,   -1, 0,-1,  1, 0, 1,  // Base
    -1, 0,-1,    1, 0,-1,  1, 0, 1
  ]);

  var normals = new Float32Array([
    0,-1, h,   0,-1, h,  0,-1, h,  // Back
    h,-1, 0,   h,-1, 0,  h,-1, 0,  // Left
    0,-1,-h,   0,-1,-h,  0,-1,-h,  // Front
   -h,-1, 0,  -h,-1, 0, -h,-1, 0,  // Right
    0, 1, 0,   0, 1, 0,  0, 1, 0,  // Base
    0, 1, 0,   0, 1, 0,  0, 1, 0
  ]);

  var indices = new Uint16Array([
    0, 1, 2,    // Front
    3, 4, 5,    // Right
    6, 7, 8,    // Back
    9, 10, 11,  // Left
    12, 13, 14, // Base
    15, 16, 17
  ]);
  
  return [vertices, normals, indices];
}


/*// Draw a model
drawModel = (gl, program, cameraMatrix, modelMatrix, n) => {
  
  // Set the model matrix (add the custom scale if any)
  var model = gl.getUniformLocation(program, 'model');
  gl.uniformMatrix4fv(model, false, modelMatrix.toFloat32Array());

  // Set the cube's mvp matrix (camera x model)
  var mvpMatrix = (new DOMMatrix(modelMatrix)).preMultiplySelf(cameraMatrix);
  var mvp = gl.getUniformLocation(program, 'mvp');
  gl.uniformMatrix4fv(mvp, false, mvpMatrix.toFloat32Array());

  // Set the inverse transpose of the model matrix
  var inverseTransposeMatrix = transpose((new DOMMatrix(modelMatrix)).invertSelf());
  var inverseTranspose = gl.getUniformLocation(program, 'inverseTranspose');
  gl.uniformMatrix4fv(inverseTranspose, false, inverseTransposeMatrix.toFloat32Array());

  // Render
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
};*/


