import React from 'react'





const UserControls = () => (
  <div id="userMenu" className="user-menu" data-displaystate="none">
    <button className="button login" type="button">Login</button>
    <div className="user-options">
      <div className="rat-name">PLACEHOLDER</div>
      <ul className="option-list">
        <li>
          <a
            href="https://confluence.fuelrats.com/display/FRKB"
            rel="noopener noreferrer"
            target="_blank"
            title="Fuel Rats Knowledgebase - Fue Rats Confluence">
            FuelRats News
          </a>
        </li>
        <li>
          <a
            href="https://github.com/FuelRats/DispatchWebBoard/releases"
            rel="noopener noreferrer"
            target="_blank"
            title="Releases - FuelRats/DispatchWebBoard">
            DWB Changelog
          </a>
        </li>
        <li>
          <a
            href="https://jira.fuelrats.com/servicedesk/customer/portal/2/group/45"
            rel="noopener noreferrer"
            target="_blank"
            title="Website and API Helpdesk - Service Desk">
            Send Feedback
          </a>
        </li>
      </ul>
      <button className="button logout" type="button">Logout</button>
    </div>
    <div className="user-icon-container class-toggle" data-target="#userMenu" data-target-class="open">
      <img className="user-icon" src="static/prof.png" alt="User Profile" />
      <div className="user-icon-overlay-container">
        <i className="fa fa-bars  fa-2x user-icon-overlay overlay-open" aria-hidden="true" />
        <i className="fa fa-times fa-2x user-icon-overlay overlay-close" aria-hidden="true" />
      </div>
    </div>
  </div>
)





export default UserControls
