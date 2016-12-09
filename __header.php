<!DOCTYPE html>
<html>
<head>
  <!-- bootstrap-required Meta -->
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
	
  <!-- page meta -->
  <title>Fuel Rats - Dispatch Board</title>
  <link rel="shortcut icon" href="favicon.ico" />
  
  <!-- stylesheets -->
  <link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
  <link rel="stylesheet" type="text/css" href="css/app.min.css" />

  <!-- Libraries -->
  <script type="text/javascript" src="js/jquery.min.js"></script>
  <script type="text/javascript" src="js/bootstrap.min.js"></script>

  <!-- App JS -->
  <script type="text/javascript">
    // https://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
    // cuz lazy.
    $.extend({
      getUrlParams: function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
          hash = hashes[i].split('=');
          vars.push(hash[0]);
          vars[hash[0]] = hash[1];
        }
        return vars;
      },
      getUrlParam: function(name){
        return $.getUrlParams()[name];
      }
    });
  </script>

  <script type="text/javascript" src="js/fr.client.min.js"></script>
  <script type="text/javascript" src="http://localhost:35729/livereload.js?snipver=1"></script><!---->
</head>
<body>
<?php include("__menu.php"); ?>
<div class="container-fluid">