#pragma strict

function Start () {

}

function Update () {

}

private var speed = 70;
public var boostClip : AudioClip;

function OnTriggerEnter(collider:Collider){
	var characterMotor = collider.GetComponent(CharacterMotor);
	if(characterMotor.movement.velocity.y > 0){
		var secondary : AudioSource = collider.GetComponents(AudioSource)[1];
		secondary.PlayOneShot(boostClip);
		// characterMotor.SetVelocity(new Vector3(characterMotor.movement.velocity.x, speed, characterMotor.movement.velocity.z));
		characterMotor.SetVelocity(characterMotor.movement.velocity + Vector3(0, speed, 0));	
	}
}