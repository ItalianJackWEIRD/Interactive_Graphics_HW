// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	// Rotation around x-axis
	var cx = Math.cos(rotationX);
	var sx = Math.sin(rotationX);
	var rotX = [
		1, 0, 0, 0,
		0, cx, sx, 0,
		0, -sx, cx, 0,
		0, 0, 0, 1
	];

	// Rotation around y-axis
	var cy = Math.cos(rotationY);
	var sy = Math.sin(rotationY);
	var rotY = [
		cy, 0, -sy, 0,
		0, 1, 0, 0,
		sy, 0, cy, 0,
		0, 0, 0, 1
	];

	// final matrix to be returned
	var mvp = MatrixMult(projectionMatrix, MatrixMult(trans, MatrixMult(rotY, rotX)));
	return mvp;
}




// SHADERS:
var meshVS = `
	attribute vec3 pos;		
	uniform mat4 mvp;
	uniform bool swapYZ;
	void main() {
		vec3 p = pos;
		if (swapYZ) {
			p = vec3(p.x, p.z, p.y);
		}
		gl_Position = mvp * vec4(p, 1.0);
	} 
	`;


var meshFS = `
	precision mediump float;
	void main() {
		gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);	// rosso = 1.0, blu = 0.0
	}`;


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		// "setMesh" Initialization: Create the vertex buffer and the shader program, and get the locations of the shader parameters.
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.posLoc = gl.getAttribLocation(this.prog, 'pos');
		this.swapYZLoc = gl.getUniformLocation(this.prog, 'swapYZ');
		this.vertBuffer = gl.createBuffer();
		this.numTriangles = 0;
	}

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		this.numTriangles = vertPos.length / 3;	// number of triangles
	}

	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap) {
		// [TO-DO] set the uniform parameter(s) of the vertex shader to specify if it should swap y and z axes.
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapYZLoc, swap ? 1 : 0);
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		// [TO-DO] Complete the WebGL initializations before drawing

		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.posLoc);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		// [TO-DO] Bind the texture

		// You can set the texture image data using the following command.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
	}

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show) {
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
	}

}
