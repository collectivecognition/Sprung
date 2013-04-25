#pragma strict

public var bounceClip : AudioClip;
public var thudClip : AudioClip;

function Start(){

}

function Update(){

}

function OnTriggerEnter(collider:Collider){
	var characterMotor = collider.GetComponent(CharacterMotor);
	var secondary : AudioSource = collider.GetComponents(AudioSource)[1];
	if(characterMotor.movement.velocity.y < 0){
		characterMotor.SetVelocity(Vector3.up * 40);
		secondary.PlayOneShot(bounceClip);
	}else{
		// Hit from underneath
		characterMotor.SetVelocity(-characterMotor.movement.velocity);
		// FIXME: Popping through blocks for a second
		secondary.PlayOneShot(thudClip);
	}
}