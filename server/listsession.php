<?php
	include_once('db.inc.php');
	
	$result = runQuery("SELECT * FROM session");
	
	$first = TRUE;
	echo "[";
	foreach ($result as $session) {
		if ($first)
			$first = FALSE;
		else
			echo ",";
		echo "{\"id\":".$session['id'].",\"name\":\"".$session['name']."\",\"dataset\":\"".$session['dataset']."\"}";
	}
	echo "]";
?>