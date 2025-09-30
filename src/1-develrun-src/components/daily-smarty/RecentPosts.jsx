import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';


import { fetchRecentPosts, fetchPostsWithQuery } from "../../store/slices/postsSlice";

import Post from './Post';

function RecentPosts() {

    const dispatch = useDispatch();
    
    const recentPosts = useSelector((state) => state.posts.recentPosts);

    useEffect(() => {
    
        dispatch(fetchRecentPosts());
    
    }, [dispatch]);


    return (

        <div className="recent-posts">
            <div className="recent-posts__wrapper">
            
            <div className="recent-posts__heading">Recent Posts</div>
                
                <ul className="recent-posts__posts">
                    {recentPosts.slice(0, 3).map((post, index) => (
                        <Post key={post.id || index} type="recent" {...post} />
                    ))}
                </ul>
                
            </div>

        </div>
    );
}

export default RecentPosts;
