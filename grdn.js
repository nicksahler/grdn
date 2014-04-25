var Grdn = function( cannon ) { this.cannon = cannon; };

Grdn.prototype = {
  configure: function(world) {
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRegularizationTime = 4;

    var solver = new this.cannon.GSSolver();

    solver.iterations = 10;
    solver.tolerance = 0.0001;

    var split = false;

    if(split)
      world.solver = new this.cannon.SplitSolver(solver);
    else
      world.solver = solver;

    world.gravity.set(0, -20, 0);
    world.broadphase = new this.cannon.SAP1DBroadphase(world);
  },

  compile: function( obj ) {
    
  },
  
  applyMetrics: function (oldb, newb) {
    if (!oldb.position.almostEquals(newb.position))
      oldb.position.set(newb.position.x, newb.position.y, newb.position.z);

    oldb.quaternion.set(newb.quaternion.x, newb.quaternion.y, newb.quaternion.z, newb.quaternion.w);

    if (!oldb.velocity.almostEquals(newb.velocity))
      oldb.velocity.set(newb.velocity.x, newb.velocity.y, newb.velocity.z);

    if (!oldb.angularVelocity.almostEquals(newb.angularVelocity))
      oldb.angularVelocity.set(newb.angularVelocity.x, newb.angularVelocity.y, newb.angularVelocity.z);

    if (oldb.mass !== newb.mass)
      oldb.mass = newb.mass;
  },

  // Move to Universe();
  decompileWorld: function( universe ) {
    var update = {
      entities: [],
      world: {
        collisionMatrix: universe.world.collisionMatrix,
        collisionMatrixPrevious: universe.world.collisionMatrixPrevious,
      }
    };

    for (var i in universe.entities)
      update.entities[i] = this.decompile(universe.entities[i]);

    return update;
  },

  // Move to Entity();
  decompile: function( entity ) {
    var decompiled = {};

    decompiled.body = {};
    decompiled.body.position = body.position;
    decompiled.body.quaternion = body.quaternion;
    decompiled.body.velocity = body.velocity;
    decompiled.body.angularVelocity = body.angularVelocity;
    decompiled.body.mass = body.mass;
    decompiled.body.shape = body.shape;
    decompiled.body.id = body.id;

    return decompiled;
  }
};

if (typeof exports !== 'undefined') {
  module.exports = Grdn;
}