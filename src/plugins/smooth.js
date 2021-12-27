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