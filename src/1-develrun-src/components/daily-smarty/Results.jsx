import React from 'react';
import { useDispatch } from 'react-redux';

import { fetchPostsWithQuery } from '../../store/slices/postsSlice'

import Logo from './Logo';
import SearchBar from './SearchBar.jsx';
import ResultsPosts from './ResultsPosts';

function Results() {
    const dispatch = useDispatch();

    const handleSearch = (query) => {
        dispatch(fetchPostsWithQuery(query));
    };

    return (

        <div className="results">
            <Logo size={55} />
            <SearchBar page="results" onSubmit={handleSearch} />
            <ResultsPosts />
        </div>
    );
}

export default Results;
