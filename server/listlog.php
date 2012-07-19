<?php
	include_once('db.inc.php');
	
	$result = runQuery("SELECT * FROM log");
	
	$first = TRUE;
	echo "[";
	foreach ($result as $log) {
		if ($first)
			$first = FALSE;
		else
			echo ",";
		echo "{\"name\":\"".$log['user_name']."\",\"time\":\"".$log['created_at']."\", \"log\":".$log['log']."}";
	}
	echo "]";
?>