var types = CANNON.Shape.types;

var Grdn = {
  configureWorld: function(world) {
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRegularizationTime = 4;

    var solver = new CANNON.GSSolver();

    solver.iterations = 10;
    solver.tolerance = 0.0001;

    var split = false;

    if(split)
      world.solver = new CANNON.SplitSolver(solver);
    else
      world.solver = solver;

    world.gravity.set(0, -20, 0);
    world.broadphase = new CANNON.SAP1DBroadphase(world);
  },

  compile: function( obj ) {
    var shape, geometry, material;

    switch ( obj.shape.type ) {
      case types.SPHERE:
        shape = new CANNON.Sphere(obj.shape.radius);
        material = new THREE.MeshBasicMaterial( { color: 0xF36A6A } );
        geometry = new THREE.SphereGeometry(obj.shape.radius, 64, 64);
        break;
      case types.PLANE:
        shape = new CANNON.Plane();
        material = new THREE.MeshLambertMaterial( { color: 0x000000 } );
        geometry = new THREE.PlaneGeometry( 300, 300, 32, 32 );

        THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
        break;
      case types.BOX:
        shape = new CANNON.Box(new CANNON.Vec3(obj.shape.halfExtents.x, obj.shape.halfExtents.y, obj.shape.halfExtents.z));
        material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, map: THREE.ImageUtils.loadTexture('./wood.png'), opacity: 1} );
        geometry = new THREE.CubeGeometry(obj.shape.halfExtents.x * 2, obj.shape.halfExtents.y * 2, obj.shape.halfExtents.z * 2);
        break;
      case types.COMPOUND:
        break;
      case types.CONVEXPOLYHEDRON:
        break;
    }

    var body = new CANNON.RigidBody( obj.mass, shape, obj.material || void 0);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.useQuaternion = true;
    
    body.mesh = mesh;    
    this.applyMetrics(body, obj);
    return body;
  },
  
  applyMetrics: function (oldb, newb) {
    //if (!oldb.position.almostEquals(newb.position))
      oldb.position.set(newb.position.x, newb.position.y, newb.position.z);

      oldb.quaternion.set(newb.quaternion.x, newb.quaternion.y, newb.quaternion.z, newb.quaternion.w);

    //if (!oldb.velocity.almostEquals(newb.velocity))
      oldb.velocity.set(newb.velocity.x, newb.velocity.y, newb.velocity.z);

    //if (!oldb.angularVelocity.almostEquals(newb.angularVelocity))
      oldb.angularVelocity.set(newb.angularVelocity.x, newb.angularVelocity.y, newb.angularVelocity.z);

    //if (oldb.mass !== newb.mass)
      oldb.mass = newb.mass;
  }
}