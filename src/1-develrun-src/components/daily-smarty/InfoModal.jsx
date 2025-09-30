import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCircleInfo,
    faTimes,
    faCode,
    faBolt,
    faServer,
    faCloudArrowUp

} from '@fortawesome/free-solid-svg-icons';

function InfoModal({ isOpen, onClose }) {
    
    if (!isOpen) return null;

    return (
        
        <div className="ds-modal-overlay" onClick={onClose}>
            
            <div className="ds-modal-content" onClick={(e) => e.stopPropagation()}>
                
                <button className="ds-modal-close" onClick={onClose}>
            
                    <FontAwesomeIcon icon={faTimes} />
            
                </button>

                <div className="ds-modal-header">
                    
                    <FontAwesomeIcon icon={faCircleInfo} className="ds-modal-icon" />
                    <h2>About This Project</h2>
                </div>

                <div className="ds-modal-body">
                    <p>
                        <strong>DailySmartyUI</strong> is a practical exercise from <strong>DevCamp2025</strong>, originally built with a classic React - Webpack setup, now ported to a modern stack:
                    </p>

                    <ul>
                        <li><><FontAwesomeIcon icon={faCode} /></> Migrated from class components to <strong>React 18 functional components</strong></li>
                        <li><><FontAwesomeIcon icon={faBolt} /></> Rebuilt with <strong>Vite</strong> for a easiest deploys in both development/production stages</li>
                        <li><><FontAwesomeIcon icon={faServer} /></> Deployed on <strong>Render</strong>, a more flexible option compared with <strong>Heroku</strong>, which the original project required</li>
                        <li><><FontAwesomeIcon icon={faCloudArrowUp} /></>Backend API implemented as a <strong>submodule</strong> using mock data via JSON Server</li>
                    </ul>

                    <p className="ds-modal-note">
                        <strong>Note:</strong> The API data is mocked for demo purposes only.  
                        All data here are sample content.
                    </p>
                </div>

            </div>
        </div>
    );
}

export default InfoModal;