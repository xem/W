// parseOBJ
// ========
//
// This function is a minimal OBJ file loader and parser for WebGL.
// A more complete OBJ/MTL parser is availale on https://github.com/xem/webgl-guide
// It takes the content of an OBJ file path as parameter and returns a hierarchy of objects and groups:
// return = [obj, obj, ..., meta]
// obj = [group, group, ...]
// group = {originalv, v, vt, indexv, indexvt, indices, s}
// meta = {minX, maxX, minY, maxY, minZ, maxZ, size, v, vn, vt}

// How to use it with WebGL:
// - Unindexed buffers: v and vt can be rendered using drawArrays. (v can be replaced with originalv to disable centering)
// - indexed buffers: indexv, indexvt and indices can be rendered using drawElements (indexv can be replaced with indexoriginalv)
// - vt and indexvt can be empty if the model isn't textured. 

parseOBJ = async (file) => {
  
  // Temp vars
  var
  v = [],         // all the vertices
  vt = [],        // all the texture coordinates
  //vn = [],        // all the normals
  vi = [],        // indexed vertices for current group
  vti = [],       // indexed texture coordinates for current group
  //vni = [],       // normals indices for current group
  //mtl = [],       // materials 
  indices = [],   // indices (vertices and texture coordinates combined)
  indexDict = [], // dictionnary
  indexv = [],    // vertices index for current group
  indexvt = [],   // texture coordinates index for current group
  //currentvn = [], // current group normals
  obj = [],       // output
  currentobj = {groups: []},
  currentgroup = {},
  //currentmtl = {},
  currents = 1,
  currentusemtl,
  //objfolder,
  //mtlfolder,
  //objlines,
  //mtllines,
  //objline,
  //mtlline,
  objcommand,
  //mtlcommand,
  objparam,
  //mtlparam,
  objlist,
  //mtllist,
  //normal,
  //file,
  tmp, i, j,
  A, B, C,
  AB, BC,
  minX = 9e9, minY = 9e9, minZ = 9e9,
  maxX = -9e9, maxY = -9e9, maxZ = -9e9,
  
  // This function is called when a group is complete
  // It saves the data buffers (v, originalv, vt / indexv, indexoriginalv, indexvt, indices) and smoothing (s) for the current group
  // The group is then added to the current object and a new one is created
  // todo: save ucurrentusemtl too
  endGroup = x => {
    
    //console.log("save group");
    //console.log(v, vt, vi);
    
    currentgroup.originalv = [];
    currentgroup.v = [];
    currentgroup.vt = [];
    //currentgroup.vn = [];
    currentgroup.indices = [];
    indexDict = [];
    currentgroup.indexv = [];
    currentgroup.indexoriginalv = [];
    currentgroup.indexvt = [];
    //currentgroup.rgb = [];
    //currentvn = [];
    currentDict = [];
    lastIndex = 0;

    // For every vertex triplet
    for(i = 0; i < vi.length; i += 3){
      
      // Retrieve vertices
      A = [v[vi[i+0] * 3], v[vi[i+0] * 3 + 1], v[vi[i+0] * 3 + 2]];
      B = [v[vi[i+1] * 3], v[vi[i+1] * 3 + 1], v[vi[i+1] * 3 + 2]];
      C = [v[vi[i+2] * 3], v[vi[i+2] * 3 + 1], v[vi[i+2] * 3 + 2]];
      
      // If the model is textured, create a single index for both vertices and texture coordinates
      if(vti.length){
        
        // Vertex 1
        currentDict = vi[i+0] + "/" + vti[i+0];

        // Add current dict entry into dictionary if not already present
        // And push corresponding items in indexv and indexvt
        if((t = indexDict.indexOf(currentDict)) == -1){
          indexDict.push(currentDict);
          currentgroup.indexoriginalv.push(...A);
          currentgroup.indexv.push(A[0]-minX, A[1]-minY, A[2]-minZ);
          currentgroup.indexvt.push(vt[vti[i+0] * 2], vt[vti[i+0] * 2 + 1]);
        }
        
        // Add an entry
        t = indexDict.indexOf(currentDict);
        currentgroup.indices.push(t);
        
        // Vertex 2
        currentDict = vi[i+1] + "/" + vti[i+1];

        // Add current dict entry into dictionary if not already present
        // And push corresponding items in indexv and indexvt
        if((t = indexDict.indexOf(currentDict)) == -1){
          indexDict.push(currentDict);
          currentgroup.indexoriginalv.push(...B);
          currentgroup.indexv.push(B[0]-minX, B[1]-minY, B[2]-minZ);
          currentgroup.indexvt.push(vt[vti[i+1] * 2], vt[vti[i+1] * 2 + 1]);
        }
        
        // Add an entry
        t = indexDict.indexOf(currentDict);
        currentgroup.indices.push(t);
        
        // Vertex 3
        currentDict = vi[i+2] + "/" + vti[i+2];

        // Add current dict entry into dictionary if not already present
        // And push corresponding items in indexv and indexvt
        if((t = indexDict.indexOf(currentDict)) == -1){
          indexDict.push(currentDict);
          currentgroup.indexoriginalv.push(...C);
          currentgroup.indexv.push(C[0]-minX, C[1]-minY, C[2]-minZ);
          currentgroup.indexvt.push(vt[vti[i+2] * 2], vt[vti[i+2] * 2 + 1]);
        }
        
        // Add an entry
        t = indexDict.indexOf(currentDict);
        currentgroup.indices.push(t);
      }
      
      // Fill vertices buffer
      
      // Original
      currentgroup.originalv.push(...A);
      currentgroup.originalv.push(...B);
      currentgroup.originalv.push(...C);
      
      // Centered
      currentgroup.v.push(A[0] - minX, A[1] - minY, A[2] - minZ);
      currentgroup.v.push(B[0] - minX, B[1] - minY, B[2] - minZ);
      currentgroup.v.push(C[0] - minX, C[1] - minY, C[2] - minZ);
      
      // Fill textures coordinates buffer (if applicable)
      //console.log(1, vt);
      if(vti.length){
        currentgroup.vt.push(vt[vti[i+0] * 2], vt[vti[i+0] * 2 + 1]);
        currentgroup.vt.push(vt[vti[i+1] * 2], vt[vti[i+1] * 2 + 1]);
        currentgroup.vt.push(vt[vti[i+2] * 2], vt[vti[i+2] * 2 + 1]);
      }
    }
    
          
    // If the model is not textured, the indexed vertices are the same as in the obj file
    if(!vti.length) {
      currentgroup.indices = vi;
      currentgroup.indexoriginalv = v;
      for(i = 0; i < v.length; i+= 3){
        currentgroup.indexv.push(v[i] - minX, v[i + 1] - minY, v[i + 2] - minZ);
      }
    }
    
    // Save group smoothness
    currentgroup.s = currents;
    
    // Save indices lists
    //currentgroup.vi = vi;
    //currentgroup.vti = vti;
    //currentgroup.vni = vni;

    // Add group in current object
    currentobj.groups.push(currentgroup);
    
    // Reset group
    currentgroup = {};
    
    //console.log({indexDict});
    
    
    // Reset indices arrays
    vi = [];
    vti = [];
  };
  

  //console.log(file);
  
  // Parse the file
  
  // Remove comments and line breaks
  objlines = file.replace(/#.*\n*/g,'').split(/ *[\r\n]+/);
    
  // For each line
  for(objline of objlines){
    
    // Separate command and param(s)
    [objcommand, objparam] = objline.split(/ (.*)/);
    
    // Split params as a list if possible
    if(objparam){
      objlist = objparam.split(/ +/);
    }
    
    // Interpret each command
    switch(objcommand){

      
      // Set material
      case 'usemtl':
      
        //console.log("mtl", objparam);
      
        // If the current group is not empty and already has a material different than this one, save it and create a new one
        if(vi.length && currentgroup.usemtl != objparam){
          endGroup();
        }
        
        // Save the material name for the current and next groups
        currentusemtl = objparam;
        
        break;
      
      // New object
      case 'o':
      
        //console.log("o");
      
        // Save current group and current object and create new ones (if current object is not empty)
        if(currentobj.groups.length){
          endGroup();
          obj.push(currentobj);
          currentobj = {};
        }
        
        // Save current object's name
        currentobj.name = objparam;
        
        // Initialize groups
        currentobj.groups = [];
        
        // Reset smoothness to 1
        currents = 1;
        
        break;
        
      // New group
      case 'g':
      
        //console.log("g");
      
        // Save current group and create a new one (if it's not empty)
        if(vi.length){
          endGroup()
        }
        
        // Save current group's name
        currentgroup.name = objparam;
        
        // Reset smoothness to 1
        currents = 1;
        
        break;
        
      // Vertex (x, y, z, w*, r*, g*, b*)
      case 'v':
      
        //console.log("v");
        
        // Push x, y, z into v
        v.push(+objlist[0], +objlist[1], +objlist[2]);
        
        // Update global min/max coords
        minX = Math.min(minX, objlist[0]);
        minY = Math.min(minY, objlist[1]);
        minZ = Math.min(minZ, objlist[2]);
        maxX = Math.max(maxX, objlist[0]);
        maxY = Math.max(maxY, objlist[1]);
        maxZ = Math.max(maxZ, objlist[2]);
        break;
        
      // Texture coordinates (u, v, w*)
      case 'vt':
      
        //console.log("vt");
      
        // Push u, v into vt (w ignored)
        vt.push(+objlist[0], +objlist[1]);
        break;
        
      // Normal (ignored)
      case 'vn':
        break;
      
      // New face (polygon)
      // Polygons with 4+ faces are converted into consecutive triangles
      case 'f':
      
        //console.log("f");
      
        // For all possible triangles
        for(i = 1; i < objlist.length - 1; i++){
          
          // Consider the current triangle
          tmp = [objlist[0], objlist[i], objlist[i+1]];
          
          // For each summit of the triangle
          // Possible formats:
          // - "vertex" indices
          // - "vertex/texture" indices
          // - "vertex/texture/normal" indices
          // - "vertex//normal" indices
          tmp.map(x => {
            
            // Split vertex/texture/normal
            // indices are decremented because obj files start counting at 1, not 0
            x = x.split("/");
            vi.push(+x[0] - 1);
            if(x[1]){
              vti.push(+x[1] - 1);
            }
            // Normals are ignored
            //if(x[2]){
            //  vni.push(+x[2] - 1);
            //}
          });
        }
        break;
        
      // Set smoothness for the following faces of the current group
      case 's':
      
        // Get the new smoothness value
        tmp = (objparam == 0 || objparam == 'off') ? 0 : 1;

        // Save current group and create a new one (if it's not empty and if the smoothness has changed)
        if(vi.length && currents != tmp){
          endGroup();
        }
        
        // Set smoothness for the current group
        currents = tmp;
        break;
    }
  }
  
  // At the end of the file, push the last group in the current object and the last object in obj
  endGroup();
  obj.push(currentobj);
  obj.push({v, vt, vi, vti, maxX, maxY, maxZ, minX, minY, minZ, size: Math.max(maxX-minX, maxY-minY, maxZ-minZ)});
  return obj;
}