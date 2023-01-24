var scene, camera, renderer;

var lights;

var milimObject;

var mousePos,oldMousePos,isMouseDown;

var composer;

var cameraPositionPuppet, milimObjectRotationPuppet, lightIntensityPuppet;
var zoomMin,zoomMax;

var turnSpeed,turnDamping,zoomSpeed,zoomDamping;

var mouseDownTime;

var clock;

var flasherCenter,flasherRed,flasherBlue;

var backLightBasePower;

const bloomParams = {
    exposure: 0.9,
    bloomStrength: 2.99,
    bloomThreshold: 0.0,
    bloomRadius: 0.99,
};

window.onload = function() {
    Init();
    Tick();
}

function Init(){

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    clock = new THREE.Clock();

    turnSpeed = 1.4;
    turnDamping = 0.01;

    zoomSpeed = 3;
    zoomDamping = 0.005;

    zoomMin = 30;
    zoomMax = 800;

    renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);
    document.getElementById('canvas').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    mousePos = new THREE.Vector2()
    oldMousePos = new THREE.Vector2()
    isMouseDown = false;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 50;
    scene.add(camera);

    milimObject = new THREE.Mesh();
    scene.add( milimObject );

    cameraPositionPuppet = new THREE.Object3D();
    scene.add( cameraPositionPuppet );
    cameraPositionPuppet.position.z = 450;

    milimObjectRotationPuppet = new THREE.Object3D();
    scene.add( milimObjectRotationPuppet );
    milimObjectRotationPuppet.rotation = milimObject.rotation;
    milimObjectRotationPuppet.rotateX(-135);

    InitFlasherLights();

    InitLights();

    InitPostProcessing();

    setTimeout(LoadFbxAsync, 10);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener( 'mousewheel', onMouseWheel, false );
};

function InitFlasherLights(){

};
function InitPostProcessing(){
    renderer.gammaFactor = -100.0;

    renderer.outputEncoding = THREE.sRGBEncoding;

    composer = new THREE.EffectComposer(renderer);

    let renderPass = new THREE.RenderPass(scene,camera);
    renderPass.renderToScreen = true;

    let bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth * 2, 2 *window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.exposure = bloomParams.exposure;
    bloomPass.threshold = bloomParams.bloomThreshold;
    bloomPass.strength = bloomParams.bloomStrength;
    bloomPass.radius = bloomParams.bloomRadius;
    bloomPass.renderToScreen = true;

    let smaaPass = new THREE.SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
    smaaPass.renderToScreen = true;

    //let effectDotScreen = new THREE.DotScreenPass( new THREE.Vector2(0,0), 3.14, 30 );
    //effectDotScreen.renderToScreen = true;

    //var x;
    //let bleachPass = new THREE.ShaderPass(THREE.BleachBypassShader,x,0.5);
    //bleachPass.renderToScreen = true;

    composer.addPass(renderPass);
    //composer.addPass(effectDotScreen);
    //composer.addPass(bleachPass);

    composer.addPass( smaaPass );

    composer.addPass(bloomPass);


};
function InitLights(){
    lights = [];

    lights[0] = new THREE.DirectionalLight( 0xe6e6fa, 1.2 );
    lights[0].ambient = 0;
    //scene.add(lights[0]);

    THREE.RectAreaLightUniformsLib.init();

    lights[1] = new THREE.RectAreaLight( 0xe6e6fa, 1.1,1200,1200 );
    lights[1].position.set(0,-300,-500);
    lights[1].lookAt(0,0,0);
    lights[1].intensity = 0;
    lightIntensityPuppet = 3;
    scene.add(lights[1]);
    backLightBasePower = 0.8;


};
const LoadFbxAsync = async function () {

    var fbxLoader = new THREE.FBXLoader();
    const textureLoader = new THREE.TextureLoader();

    const baseColorMap = await textureLoader.load("./models/New/tex/diffuse.jpg");
    const emission = await textureLoader.load("./models/New/tex/emissive.jpg");
    const normalMap = await textureLoader.load("./models/New/tex/normal.jpg");
    const roughnessMap = await textureLoader.load("./models/Old/tex/roughness.jpg");
    const glossinessMap = await textureLoader.load("./models/New/tex/glossiness.jpg");

    fbxLoader.load( './models/New/export.fbx', function ( object ) {



        var material = new THREE.MeshPhysicalMaterial({
            map: baseColorMap,
            emissiveMap: emission,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(5,5),
            roughnessMap: roughnessMap,
            //glossinessMap: glossinessMap,
            metalness: 1
        });

        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material = material;
                child.castShadow = true;
                child.receiveShadow = false;
                child.flatshading = true;
            }
        } );

        object.scale.x = object.scale.y = object.scale.z = 0.1;
        //object.position.y = -80;

        object.children.forEach(child => {
            if (child instanceof THREE.Mesh) {

            }
        });

        milimObject.add(object);
    });

};
function DrawMilim(){
    var baseX = 7,baseZ = 7;

    let mat = new THREE.MeshBasicMaterial({color: 0xffccaa});

    let midBox = new THREE.BoxGeometry(baseX,40,baseZ);
    let midBoxMesh = new THREE.Mesh(midBox,mat);
    midBoxMesh.position.x += 20;

    let longBox = new THREE.BoxGeometry(baseX,60,baseZ);
    let longBoxMesh = new THREE.Mesh(longBox,mat);

    let shortBox = new THREE.BoxGeometry(baseX,25,baseZ);
    let shortBoxMesh = new THREE.Mesh(shortBox,mat);

    let pointBox = new THREE.BoxGeometry(baseX,14,baseZ);
    let pointBoxMesh = new THREE.Mesh(pointBox,mat);
    pointBoxMesh.position.x -= 20;


    AssignGodraysToMesh(midBoxMesh);
    AssignGodraysToMesh(longBoxMesh);
    AssignGodraysToMesh(pointBoxMesh);

    milimObject.add(midBoxMesh);
    milimObject.add(longBoxMesh);
    milimObject.add(pointBoxMesh);



};
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
function onMouseMove(event) {
    event.preventDefault();
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // console.log("mouse position: (" + mouse.x + ", "+ mouse.y + ")");
    if(isMouseDown)lightIntensityPuppet += 0.04;
    else lightIntensityPuppet += 0.02;

};
function onMouseDown(event){
    isMouseDown = true;
    oldMousePos.x = mousePos.x;
    oldMousePos.y = mousePos.y;
    clock.start();
    mouseDownTime = Date.now();

};

function onMouseUp(event){
    isMouseDown = false;

    if(clock.getDelta() <= 0.25){
        onMouseTap();
    }
    clock.stop();
};
function onMouseTap(){
    console.log(cameraPositionPuppet.position.z);
    val = 3;

    if(cameraPositionPuppet.position.z < 100) val = 1.9;
    else if(cameraPositionPuppet.position.z < 150) val = 2.3;
    else if(cameraPositionPuppet.position.z < 200) val = 2.8;
    else if(cameraPositionPuppet.position.z < 250) val = 3.5;

    lights[0].intensity = val;
    lights[1].intensity = val;
    lightIntensityPuppet = val;
};
function onMouseWheel(event){

    cameraPositionPuppet.position.z += (event.deltaY/50) * zoomSpeed;

    if(cameraPositionPuppet.position.z < zoomMin){
        cameraPositionPuppet.position.z = zoomMin;
    }
    if(cameraPositionPuppet.position.z > zoomMax){
        cameraPositionPuppet.position.z = zoomMax;
    }
};

function cameraZoom(){
    camera.position.lerp(cameraPositionPuppet.position,zoomDamping);
};
function lightDamp(){
    if(lights[1].intensity < lightIntensityPuppet - 0.1){
        lights[1].intensity += 0.02;
        //flasherCenter.scale += 0.03;
    }else if(lights[1].intensity > lightIntensityPuppet + 0.1){
        lights[1].intensity -= 0.012;
        //flasherCenter.scale -= 0.03;
    }

    if(lightIntensityPuppet > backLightBasePower){
        lightIntensityPuppet -= (lightIntensityPuppet - 1.0) / 33 ;
    }
    if(lightIntensityPuppet < backLightBasePower){
        lightIntensityPuppet = backLightBasePower;
    }
};
function milimObjectRotate(){
    if(isMouseDown){
        var mouseDiff = new THREE.Vector2(mousePos.x - oldMousePos.x,mousePos.y - oldMousePos.y);

        milimObjectRotationPuppet.rotation.x += -mouseDiff.y * turnSpeed;
        milimObjectRotationPuppet.rotation.y += -mouseDiff.x  * turnSpeed;

        oldMousePos.x = mousePos.x;
        oldMousePos.y = mousePos.y;
    }

    milimObject.quaternion.slerp( milimObjectRotationPuppet.quaternion , turnDamping );
    milimObject.quaternion.normalize();

};
function checkCameraBounce(timer){

    cameraPositionPuppet.z = 0;

}
function Tick(){
    var timer = 0.0001 * Date.now();

    requestAnimationFrame(Tick);

    milimObjectRotate();
    cameraZoom();
    lightDamp();
    checkCameraBounce();

    composer.render(0.1);
    //TWEEN.update();
};