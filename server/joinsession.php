<?php
	// requires:
	// 	session
	// 	name (of the user)
	// sets:
	// 	last_update for user
	// returns:
	// 	dataset
	// 	user_id
	
	include_once('db.inc.php');
	// current time format: 2012-05-20 00:00:00
	$current_date = date("Y-m-d H:i:s", time());
	
	$session = $_GET['session'];
	$name = $_GET['name'];
	
	$result = runQuery("SELECT * FROM session WHERE id=$session");
	foreach($result as $s) {
		$threshold = $s['threshold'];
		$dataset = $s['dataset'];
	}
	
	$result = runQuery("SELECT * FROM user WHERE session_id=$session");
	
	foreach($result as $user) {
		$diff = abs(strtotime($current_date) - strtotime($user['last_update']));
		if ($diff > $threshold) {
			executeQuery("UPDATE user SET name='$name', last_update='$current_date' WHERE id=".$user['id']." AND session_id=$session");
			if (! $preserve_selection || strcmp($user['name'], $name) != 0)
				executeQuery("UPDATE user SET selection=NULL WHERE id=".$user['id']." AND session_id=$session");
			die("{\"dataset\":\"$dataset\", \"id\":".$user['id']."}");
		}
	}
	die('session full')
?>