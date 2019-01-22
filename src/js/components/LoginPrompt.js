import React from 'react'





const LoginPrompt = () => (
  <div className="shutter loading-circle">
    <div id="ShutterLoginWelcome" className="shutter-text login msgtext">
      Welcome to The Fuel Rats Rescue Web Board!
      <br />
      A drilled rat account is required to access this resource.
    </div>
    <div id="ShutterLoginNeedPermission" className="shutter-text permission msgtext">
      Sorry, You need a drilled rat account to access the web board.
    </div>
    <div id="ShutterLoginSubtext" className="shutter-text login subtext">
      Login to begin...
    </div>
  </div>
)





export default LoginPrompt
