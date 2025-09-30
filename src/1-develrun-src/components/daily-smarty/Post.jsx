import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


function Post({ type, title, url_for_post, associated_topics, post_links }) {
    
	const [isExpanded, setIsExpanded] = useState(false);

	const renderTopics = () => {

		return associated_topics?.map((topic, index) => (
		
			<span className="post-topic" key={index}>
				{topic}
			</span>
		));
	};

	const prettyPostTitle = url => {
		
		const parts = url.split('/');
		
		let link = parts[parts.length - 1];

		if (!link) {
		
			link = parts[parts.length - 2];
		
		}


		return link
			.replace('.html', '')
			.replace('.htm', '')
			.replace(/-/g, ' ');
	};


	// NEW IDEA -> Url Thumbs will be random Picsum.photos/200/200
	// 	const randomThumbUrl = () => {
	// 		return 'https://picsum.photos/200/200'
	// 	}
	const randomThumbUrl = () => 'https://picsum.photos/200/200';
	
	const renderLinks = () => {
	
		if (!post_links || post_links.length === 0) {
	
			return <div className="no-content">No Post links yet!</div>;
	
		}

		return post_links.map((link, index) => (
	
			<div className="post-link" key={index}>
			
				<div className="post-link__box">

					<img 
						src={ randomThumbUrl() } 
						alt="Link thumbnail"
					/>

				</div>
			
				<div className="post-link__link">

					<a href={link.link_url}>
						{prettyPostTitle(link.link_url)}
					</a>
				</div>
			
			</div>
		));
	};

	if (type === 'recent') {

		return (
			<li className="recent-post">

				<div className="recent-post__title">

					<a href={url_for_post}>{title}</a>
				
				</div>
				
				<div className="recent-post__topics">{renderTopics()}</div>

			</li>
		);
	}

	
	if (type === 'results') {
		
		return (
			<li
				className="result-post"
				onMouseEnter={() => setIsExpanded(true)}
				onMouseLeave={() => setIsExpanded(false)}
			>
			
			<div className="result-post__topics">{renderTopics()}</div>
				
			<div className="result-post__title">
				<a href={url_for_post}>{title}</a>
			</div>

			<AnimatePresence>
			
			{isExpanded && (

				<motion.div

					className="result-post__links"
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: 'auto', opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.3 }}
				
				>
					{renderLinks()}
				
				</motion.div>
			)}
			
			</AnimatePresence>
			</li>
		);
	}

	return null;
}


export default Post;
