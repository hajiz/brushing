<?php
	// requires:
	// 	log
	// 	session
	// 	user
	// sets:
	// 	log, session, user beside user name and current time

	die('bye');
	$method = $_GET;
	$log = $method['log'];
	$session = $method['session'];
	$user = $method['user'];

	echo $user;

	// current time format: 2012-05-20 00:00:00
	$current_date = date("Y-m-d H:i:s", time());
	
	$result = runQuery("SELECT name FROM user WHERE id=$user AND session_id=$session");
	$user_name = 'unregistered';
	for ($result as $u) $user_name = $u['name'];

	executeQuery("INSERT INTO log (log, session, user, user_name, created_at) VALUES ('$log', $session, $user, '$user_name', '$current_date')");
?>