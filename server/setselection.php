<?php
	// requires:
	// 	session
	// 	user
	// 	selection
	// sets:
	// 	user selection
	// 	user last_update
	include_once('db.inc.php');
	// current time format: 2012-05-20 00:00:00
	$current_date = date("Y-m-d H:i:s", time());
	
	$session = $_GET['session'];
	$user = $_GET['user'];
	$selection = $_GET['selection'];
	
	if (exists("SELECT * FROM `user` WHERE session_id=$session AND id=$user"))
		executeQuery("UPDATE `user` SET selection='$selection', last_update='$current_date' WHERE session_id=$session AND id=$user");
	else
		echo "INVALID";
?>