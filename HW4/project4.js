var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows
		Ray shadowRay;
		shadowRay.pos = position + 0.001 * normal;	// OFFSET per evitare collisione iniziale
		shadowRay.dir = lights[i].position - shadowRay.pos; // NON normalizzato
		HitInfo shadowHit;
		if  ( IntersectRay( shadowHit, shadowRay ) && shadowHit.t < 1.0 ) {
			continue;	// la luce è bloccata da un oggetto, quindi passo alla luce successiva
		}

		// TO-DO: If not shadowed, perform shading using the Blinn model
		vec3 lightDir = normalize( lights[i].position - position ); // direction from the point to the light source
		float cosTheta = dot ( normal, lightDir );

		if ( cosTheta > 0.0 ) {		// luce sotto orizzonte rispetto alla superficie
			vec3 contrib = mtl.k_d * cosTheta;	// diffuse contribution
			vec3 h = normalize( lightDir + view );	// half vector

			float cosPhi = dot( normal, h );
			if ( cosPhi > 0.0 ) {
				contrib += mtl.k_s * pow( cosPhi, mtl.n );	// specular contribution
			}
			color += contrib * lights[i].intensity;
		}
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		vec3 oc = ray.pos - spheres[i].center;

		float a = dot( ray.dir, ray.dir );
		float b = 2.0 * dot ( oc, ray.dir );
		float c = dot( oc, oc ) - spheres[i].radius * spheres[i].radius;

		float discriminant = b*b - 4.0*a*c;	// Delta

		if ( discriminant > 0.0 ) {
			// TO-DO: Update the hit information with the intersection details
			float t = (-b - sqrt(discriminant)) / (2.0*a);   // we take the smaller t value

			if ( t > 0.0 && t < hit.t ) {
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize( hit.position - spheres[i].center );
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// TO-DO: Initialize the reflection ray
			r.pos = hit.position + 0.001 * hit.normal; // OFFSET per evitare collisione iniziale
			r.dir = reflect ( -view, hit.normal );
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				view = normalize( -r.dir );
				clr += k_s * Shade( h.mtl, h.position, h.normal, view);

				// TO-DO: Update the loop variables for tracing the next reflection ray
				k_s *= h.mtl.k_s;
				hit = h;
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;