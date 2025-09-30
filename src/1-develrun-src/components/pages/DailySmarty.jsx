import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

import Home from '../daily-smarty/Home';
import Results from '../daily-smarty/Results';
import InfoModal from '../daily-smarty/InfoModal';

import '../../styles/daily-smarty/dsmain.scss';

function DailySmarty() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="dailysmarty-app">
            
            {/* Botón info flotante */}
            <button 
                className="ds-info-button"
                onClick={() => setShowModal(true)}
                aria-label="Project information"
            >
                <FontAwesomeIcon icon={faCircleInfo} />
            </button>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/results" element={<Results />} />
            </Routes>

            <InfoModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
            />
        </div>
    );
}

export default DailySmarty;