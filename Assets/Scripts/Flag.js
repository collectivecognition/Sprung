#pragma strict

function Start () {

}

function Update () {

}

function OnTriggerEnter(collider:Collider){
	collider.SendMessageUpwards("WinGame");
}