import React from 'react';
import { useSelector } from 'react-redux';

import Post from './Post';

function ResultsPosts() {

    const resultsPosts = useSelector((state) => state.posts.resultsPosts);

    return (

        <div className="results-posts">
            
            <div className="results-posts__wrapper">
                
                {resultsPosts.length === 0 ? (
                
                    <div className="no-content">No results found. Try a different search.</div>
                
                ) : (
                
                    <ul className="results-posts__posts">
                    
                        {resultsPosts.map((post, index) => (
                    
                            <Post key={post.id || index} type="results" {...post} />
                        ))}
                    
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ResultsPosts;