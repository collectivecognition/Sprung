#pragma strict

function Start(){
	transform.RotateAround(Vector3.up, 270);
}

private var speed = 1.0;
private var amount = 2.5;
public var oxygenClip : AudioClip;

function Update(){
	transform.RotateAround(Vector3.up, speed * Time.deltaTime); 
}

function OnTriggerEnter(collider:Collider){
	collider.gameObject.SendMessage("AddOxygen", amount);
	AudioSource.PlayClipAtPoint(oxygenClip, transform.position);
	Destroy(this.gameObject);
}