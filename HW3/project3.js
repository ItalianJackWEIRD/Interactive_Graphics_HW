// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
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

	var mv = MatrixMult(trans, MatrixMult(rotY, rotX));
	return mv;
}


// SHADERS:
var meshVS = `
	attribute vec3 pos;
	attribute vec2 texCoord;
	attribute vec3 normal;
	
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 mn;
	uniform bool swapYZ;

	varying vec3 vPos;
	varying vec2 vTexCoord;
	varying vec3 vNormal;

	void main() {
		vec3 p = pos;
		vec3 n = normal;

		vTexCoord = texCoord;

		if (swapYZ) {
			p = vec3(p.x, p.z, p.y);
			n = vec3(n.x, n.z, n.y);
		}
		
		vPos = (mv * vec4(p, 1.0)).xyz;
		vNormal = mn * n;

		gl_Position = mvp * vec4(p, 1.0);
	} 
`;


var meshFS = `
	precision mediump float;

	uniform vec3 lightDir;
	uniform float shininess;
	uniform bool showTex;
	uniform sampler2D tex;

	varying vec3 vPos;
	varying vec2 vTexCoord;
	varying vec3 vNormal;

	void main() {
		// Normalizza la normale
    	vec3 N = normalize(vNormal);

    	// Direzione della luce
    	vec3 L = normalize(lightDir);

    	// Direzione di vista
    	vec3 V = normalize(-vPos);

    	// Half-vector
    	vec3 H = normalize(L + V);

    	// Kd: texture se attiva, altrimenti bianco
    	vec3 Kd = vec3(1.0);
    	if (showTex) {
        	Kd = texture2D(tex, vTexCoord).rgb;
    	}

		// Ks : bianco
		vec3 Ks = vec3(1.0);

    	// Diffuse e Specular
    	float diff = max(dot(N, L), 0.0);
    	float spec = pow(max(dot(N, H), 0.0), shininess);

    	// Colore finale
    	gl_FragColor = vec4(Kd * diff + Ks * spec, 1.0);
	}
`;

// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		// "setMesh" Initialization: Create the vertex buffer and the shader program, and get the locations of the shader parameters.
		this.prog = InitShaderProgram(meshVS, meshFS);

		// Attribute locations
		this.posLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

		// Uniform Locations 
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.mvLoc = gl.getUniformLocation(this.prog, 'mv');
		this.mnLoc = gl.getUniformLocation(this.prog, 'mn');

		this.lightDirLoc = gl.getUniformLocation(this.prog, 'lightDir');
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');

		this.swapYZLoc = gl.getUniformLocation(this.prog, 'swapYZ');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
		this.texLoc = gl.getUniformLocation(this.prog, 'tex');

		// Buffers
		this.texBuffer = gl.createBuffer();
		this.vertBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
		this.texture = gl.createTexture();

		this.numTriangles = 0;
	}

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords, normals) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}

	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap) {
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapYZLoc, swap ? 1 : 0);
	}

	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw(matrixMVP, matrixMV, matrixNormal) {
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV);
		gl.uniformMatrix3fv(this.mnLoc, false, matrixNormal);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.posLoc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoordLoc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normalLoc);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(this.texLoc, 0);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		// [TO-DO] Bind the texture
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		// You can set the texture image data using the following command.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, 1);
	}

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show) {
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show ? 1 : 0);
	}

	// This method is called to set the incoming light direction
	setLightDir(x, y, z) {
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDirLoc, x, y, z);
	}

	// This method is called to set the shininess of the material
	setShininess(shininess) {
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininess);
	}
}
