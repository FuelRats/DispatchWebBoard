# DispatchWebBoard
The Official FuelRats rescue info tracking application.

## DWB Deployment (How do I use this thing again?)
It is recommended that users wishing to just use the board should use [the official live version](https://dispatch.fuelrats.com) instead of running their own. 

Setting up the DWB for your own uses requires oauth client registration with the Fuel Rats API. If you wish to develop and test against a live server, contact Clapton on the FuelRats IRC. ( [IRC Web Client](http://kiwi.fuelrats.com:7779/) / irc.fuelrats.com:+6697 ) The following guide assumes you have already done so, and have already registered your client.

### Setup Steps
* Clone the repo branch of your choosing to a directory on your webserver.
  * We recommend NGINX or Apache
  * Users wishing to use the FuelRats production API are REQUIRED to have a properly configured https-only server.
* Configure the board's setting files
  * Navigate to the config folder
  * Configure fr.config.js
    * Duplicate and rename fr.config_example.js to fr.config.js
    * Note the debug boolean at the top. Use this to control console information output.
    * Ensure WssURI and ApiURI are pointed to the correct api address. ClientID should be the UUID given to you upon oauth client creation.
    * WebPageTitle and CookieBase can be set to any value of your choosing.
  * Configure fr.const.js
    * Nothing needs to be done here, however you can change strings to how you see fit. const will soon contain all major strings to easily support translations in the future.
* Load the page from your browser for the first time, and attempt to login. If all is done right, you should now have a working dispatch board. ready for development testing

## Contributing
PRs are always welcome! If you wish to see open issues, visit the [FuelRats JIRA](https://jira.fuelrats.com/projects/DWB/issues) (Project key: DWB)

See our [CONTRIBUTING.md](CONTRIBUTING.md) before developing for the Dispatch Web Board.
