#pragma strict

// TODO: Instructions on main menu
// TODO: Oculus support

// NICE: Pause menu, enable / disable oculus, restart
// NICE: New character model
// NICE: Flag offset
// NICE: Helmet overlay?
// NICE: Moving platforms?
// NICE: Intensify breathing as oxygen depletes
// NICE: Configurable difficulty / game length

public var buttonStyle : GUIStyle;

private var paused = true;
private var dead = false;
private var deathHeight = -50;
private var oculusEnabled = false;

public var breathNormalClip : AudioClip;
private var lastBreath = 0;

public var logoTexture: Texture2D;
public var flagPrefab : Transform;
public var blockPrefab : Transform;
public var ringPrefab : Transform;
public var fuelPrefab : Transform;
public var oxygenPrefab : Transform;
public var player : Transform;
public var heightGuiText : GUIText;
public var noFuelClip : AudioClip;
public var jetpackFire : ParticleSystem;
public var jetpackSmoke : ParticleSystem;

private var fuel = 10.0;
private var maxFuel = 10.0;
private var fuelPerSecond = 1.0;
private var fuelPerSecondEasy = 0.75;
private var fuelPerSecondHard = 1.5;
private var fuelPosition = new Vector2(0, 10);
private var fuelSize = new Vector2(120, 20);
public var fuelFullTexture : Texture2D;
private var fuelChance = 0.2;

private var oxygen = 10.0;
private var maxOxygen = 10.0;
private var oxygenPerSecond = 0.25;
private var oxygenPerSecondEasy = 0.15;
private var oxygenPerSecondHard = 0.35;
private var lowOxygenBlinkDuration = 0.15;
private var lowOxygenThreshold = 5.0;
private var lowOxygenBlinkState = false;
private var lowOxygenLastBlinkTime = 0.0;
private var oxygenPosition = new Vector2(0, 40);
private var oxygenSize = new Vector2(120, 20);
public var oxygenFullTexture : Texture2D;
private var oxygenChance = 0.2;

private var boostChance = 0.2;

function Start () {
	var x = 0;
	var z = 0;
	var num = 75; // FIXME: Should be infinite
	Instantiate(blockPrefab, new Vector3(0, 0, 0), Quaternion.identity);
	var vec : Vector3;
	for(var count = 1; count <= num; count++){
		vec = Random.onUnitSphere * 40; // Distance between platforms should be configurable
		vec.x += x;
		vec.z += z;
		x = vec.x;
		z = vec.z;
		vec.y = count * 7; // FIXME: Platform height offset should be configurable
		var block : Transform;
			block = Instantiate(blockPrefab, vec, Quaternion.identity); // Instantiate a block
			block.transform.eulerAngles.y = Random.Range(0, 360); // Apply a random rotation
			block.transform.localScale.x = Random.Range(0.5, 2.5);
			block.transform.localScale.z = block.transform.localScale.x;
			if(Random.value < boostChance && count != num){
				block = Instantiate(ringPrefab, vec + new Vector3(Random.Range(-5, 5), 20 + Random.value * 40, Random.Range(-5, 5)), Quaternion.identity);
		}
		if(count == num){
			// Add end of game flag
			Instantiate(flagPrefab, vec + new Vector3(0, 3.0, 0), Quaternion.identity);
		}else{
			// Add fuel to platforms randomly
			if(Random.value < fuelChance){
				Instantiate(fuelPrefab, block.transform.position + new Vector3(0, 0.5, 0), block.transform.rotation);
			}else{ // FIXME: Chances shouldn't be dependant
			// Add oxygen to platforms randomly
				if(Random.value < oxygenChance){
					Instantiate(oxygenPrefab, block.transform.position + new Vector3(0, 1.25, 0), Quaternion.Euler(-90, 0, 0));
				}
			}
		}
	}
	// Stop jetpack particl effects on start
	jetpackFire.Stop();
	jetpackSmoke.Stop();
}

function Update () {
	var secondary : AudioSource = gameObject.GetComponents(AudioSource)[1];
	// Pause / unpause game
	if(paused){
		Time.timeScale = 0.0;
		DisableControls();
		transform.RotateAround(Vector3.up, 0.001);
	}else{
		Time.timeScale = 1.0;
		EnableControls();
	}
	// Update height label
	if(paused)
		heightGuiText.text = "";
	else
		heightGuiText.text = Mathf.FloorToInt(player.position.y) + "m";
			
	if(!paused){
				
		// Dead?
		if(player.position.y <= deathHeight || oxygen <= 0){
			LoseGame();
		}
		// Consume oxygen
		oxygen -= oxygenPerSecond * Time.deltaTime;
		// Play heavy breathing sounds
		if(Time.time - lastBreath > 1){
			if(oxygen < lowOxygenThreshold){
				lastBreath = Time.time;
				secondary.PlayOneShot(breathNormalClip);
			}
		}
		// Jetpack controls
		if(Input.GetKey("space")){
			if(fuel > 0){
				if(!audio.isPlaying){
					audio.Play();
					jetpackFire.Play();
					jetpackSmoke.Play();
				}
				var characterMotor = collider.GetComponent(CharacterMotor);
				characterMotor.SetVelocity(characterMotor.movement.velocity + new Vector3(0, 30 * Time.deltaTime, 0)); // FIXME
				characterMotor.movement.velocity.y = Mathf.Clamp(characterMotor.movement.velocity.y, -20.0, 30.0); // FIXME
				// Consume fuel
				fuel -= fuelPerSecond * Time.deltaTime;
				fuel = Mathf.Clamp(fuel, 0, maxFuel);
			}else{
				audio.Stop();
				jetpackFire.Stop();
				jetpackSmoke.Stop();
			}
		}else{
			audio.Stop();
			jetpackFire.Stop();
			jetpackSmoke.Stop();
		}
		
		if(Input.GetKeyDown("space")){
			if(fuel <= 0){
				secondary.PlayOneShot(noFuelClip);
			}
		}
		
	}
}

function OnGUI(){
	GUI.depth = 1;
	if(dead){
		GUI.color.a = 0.0;
		heightGuiText.text = "";
	}
	for(var ii = 0; ii < Camera.allCameras.length; ii++){
		var camera = Camera.allCameras[ii];
		var offset = ii * camera.pixelWidth;
		if(paused){
			GUI.BeginGroup(new Rect(offset + camera.pixelWidth / 2 - 200, camera.pixelHeight / 2 - 250, 400, 500));
			GUI.DrawTexture(new Rect(11, 0, 378, 74), logoTexture, ScaleMode.ScaleToFit, true, 0);
			// New game (easy)
			if(GUI.Button(new Rect(0, 100, 400, 90), "EASY", buttonStyle)){
				paused = false;
				fuelPerSecond = fuelPerSecondEasy;
				oxygenPerSecond = oxygenPerSecondEasy;
			}
			// New game (normal)
			if(GUI.Button(new Rect(0, 190, 400, 90), "NORMAL", buttonStyle)){
				paused = false;
			}
			// New game (hard)
			if(GUI.Button(new Rect(0, 280, 400, 90), "HARD", buttonStyle)){
				paused = false;
				fuelPerSecond = fuelPerSecondHard;
				oxygenPerSecond = oxygenPerSecondHard;
			}
			// Quit
			if(GUI.Button(new Rect(0, 370, 400, 90), "QUIT", buttonStyle)){
				Application.Quit();
			}
			GUI.EndGroup();
		}else{
			GUI.DrawTexture(new Rect(offset + camera.pixelWidth / 2 - fuelSize.x / maxFuel * fuel / 2 + fuelPosition.x, camera.pixelHeight / 2 + fuelSize.y / 2 + fuelPosition.y, fuelSize.x / maxFuel * fuel, fuelSize.y), fuelFullTexture, ScaleMode.StretchToFill, true, 0);
			// Draw oxygen bar
			if(oxygen > lowOxygenThreshold || lowOxygenBlinkState == true){
				GUI.DrawTexture(new Rect(offset + camera.pixelWidth / 2 - oxygenSize.x / maxOxygen * oxygen / 2 + oxygenPosition.x, camera.pixelHeight / 2 + oxygenSize.y / 2 + oxygenPosition.y, oxygenSize.x / maxOxygen * oxygen, oxygenSize.y), oxygenFullTexture, ScaleMode.StretchToFill, true, 0);
			}
			if(oxygen <= lowOxygenThreshold){
			// Blink oxygen indicator when low
				if(Time.time - lowOxygenLastBlinkTime > lowOxygenBlinkDuration){
					lowOxygenBlinkState = !lowOxygenBlinkState;
					lowOxygenLastBlinkTime = Time.time;
				}
			}
		}
	}
}

public function AddFuel(amount : float){
	fuel += amount;
	fuel = Mathf.Clamp(fuel, 0, maxFuel);
}

public function AddOxygen(amount : float){
	oxygen += amount;
	oxygen = Mathf.Clamp(oxygen, 0, maxOxygen);
}

private function DisableControls(){
	var scripts = GameObject.FindObjectsOfType(MouseLook);
	for(var ii = 0; ii < scripts.length; ii++){
		var script : MouseLook = scripts[ii];
		script.enabled = false;
	}
	Screen.showCursor = true;
}

private function EnableControls(){
	var scripts = GameObject.FindObjectsOfType(MouseLook);
	for(var ii = 0; ii < scripts.length; ii++){
		var script : MouseLook = scripts[ii];
		script.enabled = true;
	}
	Screen.showCursor = false;
}

public function WinGame(){
	// TODO
	Application.LoadLevel (Application.loadedLevelName);
}

public function LoseGame(){
	dead = true;
	// create a GUITexture:
	GUI.depth = 0;
	heightGuiText.text = "";
	var fade: GameObject = new GameObject();
	fade.AddComponent(GUITexture);
	// and set it to the screen dimensions:
	fade.guiTexture.pixelInset = Rect(0, 0, Screen.width, Screen.height);
	// set its texture to a black pixel:
	var tex = new Texture2D(1, 1);
	tex.SetPixel(0, 0, Color.black);
	tex.Apply();
	fade.guiTexture.texture = tex;
	// then fade it during duration seconds
	for (var alpha:float = 0.0; alpha < 1.0; ){
		alpha += Time.deltaTime * 1.0;
		fade.guiTexture.color.a = alpha;
		yield;
	}
	// finally, reload the scene
	paused = true;
	if(oxygen <= 0)
		Application.LoadLevel ("SuffocateScene");
	else
		Application.LoadLevel ("FallScene");
}