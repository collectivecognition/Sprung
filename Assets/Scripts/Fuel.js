#pragma strict

function Start(){

}

private var speed = 1.0;
private var amount = 2.5;
public var fuelClip : AudioClip;

function Update(){
	transform.RotateAround(Vector3.up, speed * Time.deltaTime); 
}

function OnTriggerEnter(collider:Collider){
	collider.gameObject.SendMessage("AddFuel", amount);
	var secondary : AudioSource = collider.GetComponents(AudioSource)[1];
	secondary.PlayOneShot(fuelClip);
	Destroy(this.gameObject);
}