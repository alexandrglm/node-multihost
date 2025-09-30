import React from 'react';
import { Link } from 'react-router-dom';

import logoSrc from '/public/1-develrun-public/assets/ds_circle_logo.png'

function Logo({ size = 105 }) {

    const style = {
        height: size,
        width: size
    };

    return (
    
        <div className="logo-main">
        
                <Link to="/project-five">

                    <img
                        style={style}
                        alt="daily smarty ui logo"
                        src={logoSrc}
                    />
                
                </Link>
        </div>
    );
}

export default Logo;
