<?php include("__header.php"); ?>
<script src="js/fr.websocket.js"></script>
<script type="text/javascript">
	//fr.ws.authCode = fr.client.GetCookie('tokenBearer');
	fr.ws.initConnection();
</script>
<div id="rescueBoard"></div>
<!--
<?php if(!isset($_SESSION['authCodeFetched'])) { ?>
<h2>Authorization needed</h2>
To verify that you are a rat, we need you to login to Fuel Rats!
<hr />
<a href="https://api.fuelrats.com/oauth2/authorise?client_id=6ae5920a-8764-4338-9877-aa4d9f851e0e&response_type=code&redirect_uri=https://dispatch.fuelr.at/">Login to Fuel Rats to access the board</a>
<?php } ?>
<?php if(isset($_REQUEST['code'])) { ?>
<script type="text/javascript">
	/*$(document).ready(function() {
		 if(fr.client.GetCookie('tokenBearer') == null) {
				fr.ws.fetchAuthCode('<?php echo $_REQUEST['code']; ?>');
		 } 
	});*/
</script>
<?php } ?>
-->
<script type="text/javascript">
fr.client.init();
</script>
<?php include("__footer.php"); ?>