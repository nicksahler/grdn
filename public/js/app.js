var socket = io.connect('127.0.0.1:8080');
var cannon = CANNON;

var Universe = function( args ) {
  if (!args) args = {};
  this.world = args.world || new cannon.World() ;
  Grdn.configureWorld(this.world);

  this.io = args.io;
};

Universe.prototype = {
  world: null,
  scene: null,
  io: null,
  camera: null,

  entities: {},
  players: {},

  serialize: function() {
    var update = {
      entities: {},
      world: {
        collisionMatrix: universe.world.collisionMatrix,
        collisionMatrixPrevious: universe.world.collisionMatrixPrevious,
      }
    };

    for (var i in universe.entities)
      update.entities[i] = universe.entities[i].serialize();

    return update;
  },

  addPlayer: function( socket ) {
    this.players[socket.id] = { name: 'Mingebag' };
  },

  addEntity: function( entity ) {
    this.world.add(entity.body);
    this.entities[entity.id] = entity;
  },

  removeEntity: function( entity ) {
    // TODO: Emit
  },

  interval: null,

  loop: function() {
    var self = this;
    clearInterval(this.interval);
    var ms = 1000 / 60;
    this.interval = setInterval(function() {
      self.world.step(ms / 1000);
    }, ms);
  },

  start: function() {
    this.loop();
  }
};

var Session = function( args ) {
  this.universe = new Universe();
  
  this.scene = new THREE.Scene();
  
  this.scene.fog = new THREE.Fog( 0xFFFFFF, 0, 100 );
  this.scene.add( new THREE.AmbientLight( 0xFFFFFF ) );

  var light = new THREE.SpotLight( 0xffffff );
  light.position.set( 10, 30, 20 );
  light.target.position.set( 0, 0, 0 );
  light.castShadow = true;
  light.shadowCameraNear = 20;
  light.shadowCameraFar = 50;
  light.shadowCameraFov = 50;
  light.shadowMapBias = 0.1;
  light.shadowMapDarkness = 0.7;
  light.shadowMapWidth = 2*512;
  light.shadowMapHeight = 2*512;
  light.shadowCameraVisible = true;
  this.scene.add( light );

  this.clock = new THREE.Clock();

  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  
  this.controls = new THREE.PointerLockControls( this.camera );
  this.controls.getObject().position.setY(0);
  this.scene.add( this.controls.getObject() );

  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.renderer.shadowMapEnabled = true;
  this.renderer.shadowMapSoft = true;
  this.renderer.setSize( window.innerWidth, window.innerHeight );
  this.renderer.setClearColor( this.scene.fog.color );

  document.body.appendChild( this.renderer.domElement );
  window.addEventListener( 'resize', this.onWindowResize, false );

  this.start();
}

Session.prototype = {
  onWindowResize: function() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  },

  animate: function() {
    requestAnimationFrame( this.animate.bind(this) );

    for(var i in this.universe.world.bodies) {
      body = this.universe.world.bodies[i];
      body.position.copy(body.mesh.position);
      body.quaternion.copy(body.mesh.quaternion);
    }

    this.controls.update( this.clock.getDelta() );
    this.renderer.render( this.scene, this.camera );
    this.time = Date.now();
  },

  start: function() {
    this.universe.start();
    this.animate();
  }
}

var session;

socket.on('connect', function() {
  console.log(socket.socket.sessionid);
});

socket.on('log', function(data) {
  $('#message').append('<br>' + data.message);
});


socket.on('bootstrap', function (data) {
  if (session) location.reload();

  session = new Session();
  session.universe.world.collisionMatrix.matrix = data.world.collisionMatrix;
  session.universe.world.collisionMatrixPrevious.matrix = data.world.collisionMatrixPrevious;

  var entity;
  for (var i in data.entities) {
    entity = new Ent(data.entities[i]);
    session.universe.addEntity(entity);
    session.scene.add(entity.body.mesh);
  }
});

socket.on('sync', function (data) {
  session.universe.world.collisionMatrix.matrix = data.world.collisionMatrix;
  session.universe.world.collisionMatrixPrevious.matrix = data.world.collisionMatrixPrevious;

  for (var i in data.entities)
    session.universe.entities[i].setProperties(data.entities[i].body);
});

socket.on('create', function (data) {
  var entity = new Ent(data);
  session.universe.addEntity(entity);
  session.scene.add(entity.body.mesh);
});

socket.on('destroy', function (data) {
  var entity = session.universe.entities[data.id];

  session.universe.world.remove(entity.body);
  session.scene.remove(entity.body.mesh);

  session.universe.entities[entity.id] = void 0;
  delete session.universe.entities[entity.id];
});

socket.on('property', function (data) {
  session.universe.entities[data.id].setProperties(data);
});

socket.on('error', function(error) {
  console.log(error);
});

socket.on('disconnect', function (err) {
  socket.socket.reconnect();
});

$(document).on('keydown', function(data) {
  socket.emit('velocity', { x: 0, y: 10, z: 0 });
});

var projector = new THREE.Projector();
var ray = new THREE.Ray();

setInterval(function() {
  if (session) {
    var x = getIntersects(session.scene.children);
    console.log(x);
    for (var i in x)
      x[i].object.material.color.b = 255;
  }
}, 100); 

var getIntersects = function ( object ) {
    var vector = new THREE.Vector3(
        ( (window.innerWidth / 2)/ window.innerWidth ) * 2 - 1,
        - ( (window.innerHeight / 2)/ window.innerHeight ) * 2 + 1,
        0.5 );

    var ray = projector.pickingRay( vector, session.camera );

    var intersects = ray.intersectObjects( object );

    if ( object instanceof Array )
        return ray.intersectObjects( object );
    return ray.intersectObject( object );
};

window.addEventListener("click",function(e){
});
