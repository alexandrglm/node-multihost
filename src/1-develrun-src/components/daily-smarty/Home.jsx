import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { fetchRecentPosts, fetchPostsWithQuery } from "../../store/slices/postsSlice";

import Logo from './Logo';
import SearchBar from './SearchBar';
import RecentPosts from './RecentPosts';

function Home() {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSearch = async (query) => {
    
        await dispatch(fetchPostsWithQuery(query));
        navigate('results');
    
    };

    
    
    return (
    
    <div className="home">
        <Logo size={200} />
    
        <SearchBar page="home" onSubmit={handleSearch} />
    
        <RecentPosts />
        </div>
    );
}

export default Home;
