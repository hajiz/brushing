<?php
	// requires:
	// 	session
	// 	user
	// sets:
	// 	last_update for user
	// returns:
	// 	a set of user_id and their selections
	include_once('db.inc.php');
	include_once('config.inc.php');
	// current time format: 2012-05-20 00:00:00
	$current_date = date("Y-m-d H:i:s", time());
	
	$user = $_GET['user'];
	$session = $_GET['session'];
	
	$result = runQuery("SELECT * FROM session WHERE id=$session");
	foreach($result as $s) {
		$threshold = $s['threshold'];
	}
	
	$result = runQuery("SELECT * FROM user WHERE session_id=$session");
	$first = TRUE;
	echo "[";
	foreach($result as $u) {
		if ($user != $u['id'] && $u['name'] != NULL) {
			$diff = abs(strtotime($current_date) - strtotime($user['last_update']));
			if ($preserve_selection || $diff < $threshold) {
				if ($first)
					$first = FALSE;
				else
					echo ",";
				echo '{"name":"'.$u['name'].'", "id":'.$u['id'].', "selection":"'.$u['selection'].'"}';
			}
		}
	}
	echo "]";
?>