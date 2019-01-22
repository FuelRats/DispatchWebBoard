import React from 'react'





const Header = () => (
  <header className="navhead">
    <span className="branding" style={{ padding: '5px' }}>
      <img
        alt="Fuel Rats Logo"
        src="static/fuelrats.png"
        style={{ height: '40px', display: 'inline-block' }} />
      <span id="navbar-brand-title">title</span>
    </span>
    <div id="navbar" className="navbar navbar-right navbar-collapse">
      <ul className="navbar-content">
        <li><span className="ed-clock" /></li>
      </ul>
    </div>
  </header>
)





export default Header
