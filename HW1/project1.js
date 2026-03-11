// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
	let rad = rotation * Math.PI / 180;
	let c = Math.cos(rad) * scale;
	let s = Math.sin(rad) * scale;

	return [
		c, s, 0,
		-s, c, 0,
		positionX, positionY, 1
	];
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
	let result = new Array(9);

	for (let col = 0; col < 3; col++) {
		for (let row = 0; row < 3; row++) {
			result[col * 3 + row] =
				trans2[0 * 3 + row] * trans1[col * 3 + 0] +
				trans2[1 * 3 + row] * trans1[col * 3 + 1] +
				trans2[2 * 3 + row] * trans1[col * 3 + 2];
		}
	}

	return result;
}
