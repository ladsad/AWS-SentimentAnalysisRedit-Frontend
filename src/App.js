import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js';

// Register the necessary chart elements
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale);

const SentimentAnalysisApp = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subreddit, setSubreddit] = useState('aws');

  const [sentimentCounts, setSentimentCounts] = useState({
    positive: 0,
    negative: 0,
    neutral: 0,
  });

  const API_GATEWAY_URL = 'https://guonqdxuyf.execute-api.ap-south-1.amazonaws.com/Stage1/sentiment/'; // Replace with your API Gateway POST URL
  const EXPRESS_BACKEND_URL = 'http://localhost:5000/api/comments/'; // Your Express backend URL

  const fetchNewComments = async () => {
    try {
      setLoading(true);

      // Step 1: Call the API Gateway to trigger the Lambda function
      await axios.post(API_GATEWAY_URL, {
        subreddit: subreddit,
        limit: 10,
      });

      // Step 2: Fetch the data from the Express backend
      console.log(`Requesting comments for subreddit: ${subreddit} at URL: ${EXPRESS_BACKEND_URL}`);
      const response = await axios.get(`${EXPRESS_BACKEND_URL}?subreddit=${subreddit}`);
      setComments(response.data);

      // Update sentiment counts based on the fetched comments
      const counts = { positive: 0, negative: 0, neutral: 0 };
      response.data.forEach((comment) => {
        counts[comment.sentiment.toLowerCase()] += 1;
      });
      setSentimentCounts(counts);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments whenever subreddit changes
  useEffect(() => {
    fetchNewComments();
  }, [subreddit]);

  // Prepare data for the pie chart
  const pieChartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral],
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
        hoverBackgroundColor: ['#218838', '#c82333', '#e0a800'],
      },
    ],
  };

  return (
    <div className="app-container">
      <h1>Reddit Sentiment Analysis</h1>

      {/* Subreddit Selection */}
      <div className="subreddit-selector">
        <label>Choose Subreddit:</label>
        <select
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
        >
          <option value="aws">AWS</option>
          <option value="python">Python</option>
          <option value="askreddit">AskReddit</option>
          {/* Add more subreddit options as needed */}
        </select>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div>Loading comments...</div>
      ) : (
        <div>
          {/* Pie Chart */}
          <div className="chart-container">
            <h3>Sentiment Distribution</h3>
            <Pie data={pieChartData} />
          </div>

          {/* Comments List */}
          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div className="comment-card" key={comment.comment_id}>
                  <p><strong>Author:</strong> {comment.author}</p>
                  <p><strong>Comment:</strong> {comment.body}</p>
                  <p><strong>Sentiment:</strong> {comment.sentiment}</p>
                  <p><strong>Timestamp:</strong> {new Date(comment.timestamp * 1000).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div>No comments available for this subreddit.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisApp;
